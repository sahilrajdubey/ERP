import { redirect } from 'next/navigation';
import { SuppliersClient } from './suppliers-client';
import { getSuppliers } from '@/lib/actions/suppliers';
import { getUserProfile } from '@/lib/actions/auth';

export default async function SuppliersPage() {
  const [{ data: suppliers }, user] = await Promise.all([
    getSuppliers(),
    getUserProfile(),
  ]);

  if (!user) redirect('/login');

  return <SuppliersClient suppliers={suppliers} userRole={user.role} />;
}
