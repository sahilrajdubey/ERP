'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResponse, Supplier, SupplierProduct } from '@/types';
import type { SupplierInput } from '@/lib/validations';

export async function getSuppliers(search?: string, page = 1, pageSize = 10): Promise<{ data: Supplier[]; total: number }> {
  const supabase = await createClient();
  
  let query = supabase.from('suppliers').select('*', { count: 'exact' });

  if (search) {
    query = query.or(`name.ilike.%${search}%,contact_person.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query.order('name').range(from, to);
  if (error) throw error;

  // Get order stats
  const supplierIds = data?.map(s => s.id) || [];
  const { data: orderStats } = await supabase
    .from('purchase_orders')
    .select('supplier_id, total_amount')
    .in('supplier_id', supplierIds);

  const statsMap = new Map<string, { count: number; total: number }>();
  orderStats?.forEach(o => {
    const stats = statsMap.get(o.supplier_id) || { count: 0, total: 0 };
    stats.count++;
    stats.total += o.total_amount;
    statsMap.set(o.supplier_id, stats);
  });

  const suppliersWithStats = data?.map(s => ({
    ...s,
    total_orders: statsMap.get(s.id)?.count || 0,
    total_spent: statsMap.get(s.id)?.total || 0,
  })) || [];

  return { data: suppliersWithStats, total: count || 0 };
}

export async function getSupplier(id: string): Promise<Supplier | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('suppliers').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

export async function createSupplier(input: SupplierInput): Promise<ActionResponse<Supplier>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('suppliers').insert(input).select().single();
  if (error) return { success: false, error: error.message };
  revalidatePath('/suppliers');
  return { success: true, data };
}

export async function updateSupplier(id: string, input: Partial<SupplierInput>): Promise<ActionResponse<Supplier>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('suppliers')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) return { success: false, error: error.message };
  revalidatePath('/suppliers');
  return { success: true, data };
}

export async function deleteSupplier(id: string): Promise<ActionResponse> {
  const supabase = await createClient();
  const { error } = await supabase.from('suppliers').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/suppliers');
  return { success: true };
}

export async function getSupplierProducts(supplierId: string): Promise<SupplierProduct[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('supplier_products')
    .select(`*, product:products(*)`)
    .eq('supplier_id', supplierId);
  if (error) throw error;
  return data || [];
}
