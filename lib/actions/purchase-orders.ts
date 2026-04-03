'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResponse, PurchaseOrder, OrderStatus } from '@/types';
import type { PurchaseOrderInput } from '@/lib/validations';

export async function getPurchaseOrders(
  search?: string,
  status?: OrderStatus,
  page = 1,
  pageSize = 10
): Promise<{ data: PurchaseOrder[]; total: number }> {
  const supabase = await createClient();
  
  let query = supabase
    .from('purchase_orders')
    .select(`*, supplier:suppliers(id, name), warehouse:warehouses(id, name)`, { count: 'exact' });

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

export async function getPurchaseOrder(id: string): Promise<PurchaseOrder | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('purchase_orders')
    .select(`
      *,
      supplier:suppliers(*),
      warehouse:warehouses(*),
      items:po_items(*, product:products(*))
    `)
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function createPurchaseOrder(input: PurchaseOrderInput): Promise<ActionResponse<PurchaseOrder>> {
  const supabase = await createClient();
  
  // Generate order number
  const orderNumber = `PO-${Date.now().toString(36).toUpperCase()}`;
  
  // Calculate totals
  const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0);
  const taxAmount = subtotal * 0.1; // 10% tax
  const totalAmount = subtotal + taxAmount;

  const { data: order, error: orderError } = await supabase
    .from('purchase_orders')
    .insert({
      order_number: orderNumber,
      supplier_id: input.supplier_id,
      warehouse_id: input.warehouse_id,
      expected_date: input.expected_date,
      notes: input.notes,
      status: 'draft',
      order_date: new Date().toISOString(),
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
    })
    .select()
    .single();

  if (orderError) return { success: false, error: orderError.message };

  // Insert items
  const items = input.items.map(item => ({
    purchase_order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_cost: item.unit_cost,
    line_total: item.quantity * item.unit_cost,
    received_quantity: 0,
  }));

  const { error: itemsError } = await supabase.from('po_items').insert(items);
  if (itemsError) return { success: false, error: itemsError.message };

  revalidatePath('/purchase-orders');
  return { success: true, data: order };
}

export async function updatePurchaseOrderStatus(id: string, status: OrderStatus): Promise<ActionResponse> {
  const supabase = await createClient();
  
  const updateData: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  
  if (status === 'received') {
    updateData.received_date = new Date().toISOString();
  }

  const { error } = await supabase.from('purchase_orders').update(updateData).eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidatePath('/purchase-orders');
  return { success: true };
}

export async function deletePurchaseOrder(id: string): Promise<ActionResponse> {
  const supabase = await createClient();
  
  // Delete items first
  await supabase.from('po_items').delete().eq('purchase_order_id', id);
  
  const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidatePath('/purchase-orders');
  return { success: true };
}
