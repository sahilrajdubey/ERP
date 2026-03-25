import { redirect } from 'next/navigation';
import { WarehousesClient } from './warehouses-client';
import { getWarehouses } from '@/lib/actions/inventory';
import { getUserProfile } from '@/lib/actions/auth';

export default async function WarehousesPage() {
  const [warehouses, user] = await Promise.all([
    getWarehouses(),
    getUserProfile(),
  ]);

  if (!user) redirect('/login');

  return <WarehousesClient warehouses={warehouses} userRole={user.role} />;
}
