'use server';

import { createClient } from '@/lib/supabase/server';
import type { DashboardStats, MonthlyRevenue, LowStockAlert, InventoryByCategory, ProductRanking } from '@/types';

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    { count: totalProducts },
    { count: totalCustomers },
    { count: totalSuppliers },
    { data: monthlyOrders },
    { data: lowStockProducts },
    { count: pendingOrders },
    { count: unpaidInvoices },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('suppliers').select('*', { count: 'exact', head: true }),
    supabase.from('sales_orders').select('total_amount').gte('created_at', startOfMonth),
    supabase.from('products').select('id, reorder_level'),
    supabase.from('sales_orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'unpaid'),
  ]);

  // Calculate monthly revenue
  const monthlyRevenue = monthlyOrders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;

  // Check for low stock
  const productIds = lowStockProducts?.map(p => p.id) || [];
  const { data: inventoryData } = await supabase
    .from('inventory')
    .select('product_id, quantity')
    .in('product_id', productIds);

  const stockMap = new Map<string, number>();
  inventoryData?.forEach(i => {
    stockMap.set(i.product_id, (stockMap.get(i.product_id) || 0) + i.quantity);
  });

  const lowStockCount = lowStockProducts?.filter(p => {
    const stock = stockMap.get(p.id) || 0;
    return stock <= p.reorder_level;
  }).length || 0;

  return {
    total_products: totalProducts || 0,
    monthly_orders: monthlyOrders?.length || 0,
    monthly_revenue: monthlyRevenue,
    low_stock_count: lowStockCount,
    total_customers: totalCustomers || 0,
    total_suppliers: totalSuppliers || 0,
    pending_orders: pendingOrders || 0,
    unpaid_invoices: unpaidInvoices || 0,
  };
}

export async function getMonthlyRevenue(): Promise<MonthlyRevenue[]> {
  const supabase = await createClient();
  
  // Get last 12 months of data
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 11);
  startDate.setDate(1);

  const { data } = await supabase
    .from('sales_orders')
    .select('order_date, total_amount')
    .gte('order_date', startDate.toISOString())
    .order('order_date');

  // Group by month
  const monthlyData = new Map<string, { revenue: number; orders: number }>();
  
  for (let i = 0; i < 12; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData.set(key, { revenue: 0, orders: 0 });
  }

  data?.forEach(order => {
    const date = new Date(order.order_date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const current = monthlyData.get(key) || { revenue: 0, orders: 0 };
    current.revenue += order.total_amount || 0;
    current.orders++;
    monthlyData.set(key, current);
  });

  return Array.from(monthlyData.entries()).map(([month, data]) => ({
    month,
    revenue: data.revenue,
    orders: data.orders,
  }));
}

export async function getLowStockAlerts(): Promise<LowStockAlert[]> {
  const supabase = await createClient();
  
  const { data: products } = await supabase
    .from('products')
    .select(`id, name, sku, reorder_level, category:categories(name)`);

  if (!products) return [];

  const productIds = products.map(p => p.id);
  const { data: inventoryData } = await supabase
    .from('inventory')
    .select('product_id, quantity')
    .in('product_id', productIds);

  const stockMap = new Map<string, number>();
  inventoryData?.forEach(i => {
    stockMap.set(i.product_id, (stockMap.get(i.product_id) || 0) + i.quantity);
  });

  return products
    .filter(p => {
      const stock = stockMap.get(p.id) || 0;
      return stock <= p.reorder_level;
    })
    .map(p => ({
      product_id: p.id,
      product_name: p.name,
      sku: p.sku,
      current_stock: stockMap.get(p.id) || 0,
      reorder_level: p.reorder_level,
      category_name: (p.category as { name: string } | null)?.name || null,
    }))
    .sort((a, b) => a.current_stock - b.current_stock);
}

export async function getInventoryByCategory(): Promise<InventoryByCategory[]> {
  const supabase = await createClient();
  
  const { data: categories } = await supabase.from('categories').select('id, name');
  const { data: products } = await supabase.from('products').select('id, category_id, cost_price');
  const { data: inventory } = await supabase.from('inventory').select('product_id, quantity');

  if (!categories || !products || !inventory) return [];

  const stockMap = new Map<string, number>();
  inventory.forEach(i => {
    stockMap.set(i.product_id, (stockMap.get(i.product_id) || 0) + i.quantity);
  });

  const categoryData = new Map<string, { count: number; value: number }>();
  categories.forEach(c => categoryData.set(c.id, { count: 0, value: 0 }));

  products.forEach(p => {
    if (p.category_id) {
      const data = categoryData.get(p.category_id) || { count: 0, value: 0 };
      const stock = stockMap.get(p.id) || 0;
      data.count++;
      data.value += stock * p.cost_price;
      categoryData.set(p.category_id, data);
    }
  });

  return categories.map(c => ({
    category_id: c.id,
    category_name: c.name,
    product_count: categoryData.get(c.id)?.count || 0,
    total_value: categoryData.get(c.id)?.value || 0,
  })).filter(c => c.product_count > 0);
}

export async function getTopProducts(limit = 10): Promise<ProductRanking[]> {
  const supabase = await createClient();
  
  const { data: items } = await supabase
    .from('so_items')
    .select(`product_id, quantity, line_total, product:products(name)`);

  if (!items) return [];

  const productData = new Map<string, { name: string; sold: number; revenue: number }>();
  
  items.forEach(item => {
    const current = productData.get(item.product_id) || { 
      name: (item.product as { name: string } | null)?.name || 'Unknown', 
      sold: 0, 
      revenue: 0 
    };
    current.sold += item.quantity;
    current.revenue += item.line_total;
    productData.set(item.product_id, current);
  });

  return Array.from(productData.entries())
    .map(([id, data]) => ({
      product_id: id,
      product_name: data.name,
      total_sold: data.sold,
      total_revenue: data.revenue,
    }))
    .sort((a, b) => b.total_revenue - a.total_revenue)
    .slice(0, limit);
}

export async function getActivityLogs(page = 1, pageSize = 20) {
  const supabase = await createClient();
  
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await supabase
    .from('activity_log')
    .select(`*, user:users(*, employee:employees(*))`, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data: data || [], total: count || 0 };
}
