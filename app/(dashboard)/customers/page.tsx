import { redirect } from 'next/navigation';
import { CustomersClient } from './customers-client';
import { getCustomers } from '@/lib/actions/customers';
import { getUserProfile } from '@/lib/actions/auth';

export default async function CustomersPage() {
  const [{ data: customers }, user] = await Promise.all([
    getCustomers(),
    getUserProfile(),
  ]);

  if (!user) redirect('/login');

  return <CustomersClient customers={customers} userRole={user.role} />;
}
