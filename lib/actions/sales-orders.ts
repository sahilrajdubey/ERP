'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResponse, SalesOrder, SalesOrderStatus } from '@/types';
import type { SalesOrderInput } from '@/lib/validations';

export async function getSalesOrders(
  search?: string,
  status?: SalesOrderStatus,
  page = 1,
  pageSize = 10
): Promise<{ data: SalesOrder[]; total: number }> {
  const supabase = await createClient();
  
  let query = supabase
    .from('sales_orders')
    .select(`*, customer:customers(id, name), warehouse:warehouses(id, name)`, { count: 'exact' });

  if (search) {
    query = query.ilike('order_number', `%${search}%`);
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

export async function getSalesOrder(id: string): Promise<SalesOrder | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('sales_orders')
    .select(`
      *,
      customer:customers(*),
      warehouse:warehouses(*),
      items:so_items(*, product:products(*)),
      invoice:invoices(*)
    `)
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function createSalesOrder(input: SalesOrderInput): Promise<ActionResponse<SalesOrder>> {
  const supabase = await createClient();
  
  const orderNumber = `SO-${Date.now().toString(36).toUpperCase()}`;
  
  const subtotal = input.items.reduce((sum, item) => {
    const lineTotal = item.quantity * item.unit_price * (1 - (item.discount_percent || 0) / 100);
    return sum + lineTotal;
  }, 0);
  const taxAmount = subtotal * 0.1;
  const totalAmount = subtotal + taxAmount - (input.discount_amount || 0);

  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .insert({
      order_number: orderNumber,
      customer_id: input.customer_id,
      warehouse_id: input.warehouse_id,
      shipping_address: input.shipping_address,
      notes: input.notes,
      status: 'pending',
      order_date: new Date().toISOString(),
      subtotal,
      tax_amount: taxAmount,
      discount_amount: input.discount_amount || 0,
      total_amount: totalAmount,
    })
    .select()
    .single();

  if (orderError) return { success: false, error: orderError.message };

  const items = input.items.map(item => ({
    sales_order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    discount_percent: item.discount_percent || 0,
    line_total: item.quantity * item.unit_price * (1 - (item.discount_percent || 0) / 100),
  }));

  const { error: itemsError } = await supabase.from('so_items').insert(items);
  if (itemsError) return { success: false, error: itemsError.message };

  revalidatePath('/sales-orders');
  return { success: true, data: order };
}

export async function updateSalesOrderStatus(id: string, status: SalesOrderStatus): Promise<ActionResponse> {
  const supabase = await createClient();
  
  const updateData: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  
  if (status === 'shipped') {
    updateData.shipping_date = new Date().toISOString();
  } else if (status === 'delivered') {
    updateData.delivery_date = new Date().toISOString();
  }

  const { error } = await supabase.from('sales_orders').update(updateData).eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidatePath('/sales-orders');
  return { success: true };
}

export async function deleteSalesOrder(id: string): Promise<ActionResponse> {
  const supabase = await createClient();
  
  await supabase.from('so_items').delete().eq('sales_order_id', id);
  
  const { error } = await supabase.from('sales_orders').delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidatePath('/sales-orders');
  return { success: true };
}
