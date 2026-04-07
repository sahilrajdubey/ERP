'use server';

import { createClient } from '@/lib/supabase/server';

export interface Notification {
  id: string;
  type: 'stock' | 'order' | 'invoice';
  title: string;
  description: string;
  created_at: string;
  is_read: boolean;
  link: string;
}

export async function getNotifications(): Promise<Notification[]> {
  const supabase = await createClient();
  const notifications: Notification[] = [];

  // 1. Fetch Low Stock Alerts
  const { data: lowStock } = await supabase
    .from('products')
    .select('id, name, sku, reorder_level');

  if (lowStock) {
    const productIds = lowStock.map(p => p.id);
    const { data: inventory } = await supabase
      .from('inventory')
      .select('product_id, quantity')
      .in('product_id', productIds);

    const stockMap = new Map<string, number>();
    inventory?.forEach(i => stockMap.set(i.product_id, (stockMap.get(i.product_id) || 0) + i.quantity));

    lowStock.forEach(p => {
      const stock = stockMap.get(p.id) || 0;
      if (stock <= p.reorder_level) {
        notifications.push({
          id: `stock-${p.id}`,
          type: 'stock',
          title: 'Low Stock Alert',
          description: `${p.name} (${p.sku}) is low on stock (${stock} left).`,
          created_at: new Date().toISOString(),
          is_read: false,
          link: '/inventory/products',
        });
      }
    });
  }

  // 2. Fetch Pending Orders
  const { data: pendingOrders } = await supabase
    .from('sales_orders')
    .select('id, order_number, customers(name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5);

  pendingOrders?.forEach(order => {
    notifications.push({
      id: `order-${order.id}`,
      type: 'order',
      title: 'New Pending Order',
      description: `Order ${order.order_number} from ${(order.customers as any)?.name || 'Customer'} is pending.`,
      created_at: new Date().toISOString(),
      is_read: false,
      link: `/sales-orders/${order.id}`,
    });
  });

  // 3. Fetch Unpaid/Overdue Invoices
  const { data: overdueInvoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, total_amount')
    .eq('status', 'unpaid')
    .lt('due_date', new Date().toISOString())
    .limit(5);

  overdueInvoices?.forEach(invoice => {
    notifications.push({
      id: `invoice-${invoice.id}`,
      type: 'invoice',
      title: 'Overdue Invoice',
      description: `Invoice ${invoice.invoice_number} for $${invoice.total_amount} is overdue.`,
      created_at: new Date().toISOString(),
      is_read: false,
      link: '/invoices',
    });
  });

  return notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
