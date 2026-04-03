'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResponse, Invoice, InvoiceStatus } from '@/types';

export async function getInvoices(
  search?: string,
  status?: InvoiceStatus,
  page = 1,
  pageSize = 10
): Promise<{ data: Invoice[]; total: number }> {
  const supabase = await createClient();
  
  let query = supabase
    .from('invoices')
    .select(`*, customer:customers(id, name)`, { count: 'exact' });

  if (search) {
    query = query.ilike('invoice_number', `%${search}%`);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data: data || [], total: count || 0 };
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      customer:customers(*),
      sales_order:sales_orders(*, items:so_items(*, product:products(*)))
    `)
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function createInvoiceFromOrder(salesOrderId: string): Promise<ActionResponse<Invoice>> {
  const supabase = await createClient();
  
  // Get the sales order
  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .select('*')
    .eq('id', salesOrderId)
    .single();

  if (orderError || !order) return { success: false, error: 'Sales order not found' };

  const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30); // Net 30

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      invoice_number: invoiceNumber,
      sales_order_id: salesOrderId,
      customer_id: order.customer_id,
      status: 'unpaid',
      issue_date: new Date().toISOString(),
      due_date: dueDate.toISOString(),
      subtotal: order.subtotal,
      tax_amount: order.tax_amount,
      discount_amount: order.discount_amount,
      total_amount: order.total_amount,
      amount_paid: 0,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath('/invoices');
  return { success: true, data: invoice };
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus, amountPaid?: number): Promise<ActionResponse> {
  const supabase = await createClient();
  
  const updateData: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  
  if (status === 'paid') {
    updateData.paid_date = new Date().toISOString();
    if (amountPaid !== undefined) {
      updateData.amount_paid = amountPaid;
    }
  }

  const { error } = await supabase.from('invoices').update(updateData).eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidatePath('/invoices');
  return { success: true };
}
