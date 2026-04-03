'use server';

import { createClient } from '@/lib/supabase/server';
import type { SearchResult } from '@/types';

export async function globalSearch(query: string): Promise<SearchResult> {
  if (!query || query.length < 2) {
    return { products: [], orders: [], customers: [] };
  }

  const supabase = await createClient();
  const searchTerm = `%${query}%`;

  const [productsRes, ordersRes, customersRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, sku, unit_price')
      .or(`name.ilike.${searchTerm},sku.ilike.${searchTerm}`)
      .limit(5),
    supabase
      .from('sales_orders')
      .select(`id, order_number, total_amount, customer:customers(name)`)
      .ilike('order_number', searchTerm)
      .limit(5),
    supabase
      .from('customers')
      .select('id, name, email, company_name')
      .or(`name.ilike.${searchTerm},company_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
      .limit(5),
  ]);

  return {
    products: (productsRes.data || []).map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      unit_price: p.unit_price,
    })),
    orders: (ordersRes.data || []).map(o => ({
      id: o.id,
      order_number: o.order_number,
      total_amount: o.total_amount,
      customer_name: (o.customer as { name: string } | null)?.name || 'N/A',
    })),
    customers: (customersRes.data || []).map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      company_name: c.company_name,
    })),
  };
}
