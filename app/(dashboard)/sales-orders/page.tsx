import { redirect } from 'next/navigation';
import { SalesOrdersClient } from './sales-orders-client';
import { getSalesOrders } from '@/lib/actions/sales-orders';
import { getUserProfile } from '@/lib/actions/auth';

export default async function SalesOrdersPage() {
  const [{ data: orders }, user] = await Promise.all([
    getSalesOrders(),
    getUserProfile(),
  ]);

  if (!user) redirect('/login');

  return <SalesOrdersClient orders={orders} userRole={user.role} />;
}
