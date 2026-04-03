import { redirect } from 'next/navigation';
import { PurchaseOrdersClient } from './purchase-orders-client';
import { getPurchaseOrders } from '@/lib/actions/purchase-orders';
import { getUserProfile } from '@/lib/actions/auth';

export default async function PurchaseOrdersPage() {
  const [{ data: orders }, user] = await Promise.all([
    getPurchaseOrders(),
    getUserProfile(),
  ]);

  if (!user) redirect('/login');

  return <PurchaseOrdersClient orders={orders} userRole={user.role} />;
}
