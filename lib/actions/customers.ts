'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResponse, Customer } from '@/types';
import type { CustomerInput } from '@/lib/validations';

export async function getCustomers(search?: string, page = 1, pageSize = 10): Promise<{ data: Customer[]; total: number }> {
  const supabase = await createClient();
  
  let query = supabase.from('customers').select('*', { count: 'exact' });

  if (search) {
    query = query.or(`name.ilike.%${search}%,company_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query.order('name').range(from, to);
  if (error) throw error;

  // Get order stats
  const customerIds = data?.map(c => c.id) || [];
  const { data: orderStats } = await supabase
    .from('sales_orders')
    .select('customer_id, total_amount')
    .in('customer_id', customerIds);

  const statsMap = new Map<string, { count: number; total: number }>();
  orderStats?.forEach(o => {
    const stats = statsMap.get(o.customer_id) || { count: 0, total: 0 };
    stats.count++;
    stats.total += o.total_amount;
    statsMap.set(o.customer_id, stats);
  });

  const customersWithStats = data?.map(c => ({
    ...c,
    total_orders: statsMap.get(c.id)?.count || 0,
    total_revenue: statsMap.get(c.id)?.total || 0,
  })) || [];

  return { data: customersWithStats, total: count || 0 };
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('customers').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

export async function createCustomer(input: CustomerInput): Promise<ActionResponse<Customer>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('customers').insert(input).select().single();
  if (error) return { success: false, error: error.message };
  revalidatePath('/customers');
  return { success: true, data };
}

export async function updateCustomer(id: string, input: Partial<CustomerInput>): Promise<ActionResponse<Customer>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('customers')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) return { success: false, error: error.message };
  revalidatePath('/customers');
  return { success: true, data };
}

export async function deleteCustomer(id: string): Promise<ActionResponse> {
  const supabase = await createClient();
  const { error } = await supabase.from('customers').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/customers');
  return { success: true };
}
