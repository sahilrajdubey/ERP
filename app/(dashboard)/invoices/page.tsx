import { redirect } from 'next/navigation';
import { InvoicesClient } from './invoices-client';
import { getInvoices } from '@/lib/actions/invoices';
import { getUserProfile } from '@/lib/actions/auth';

export default async function InvoicesPage() {
  const [{ data: invoices }, user] = await Promise.all([
    getInvoices(),
    getUserProfile(),
  ]);

  if (!user) redirect('/login');

  return <InvoicesClient invoices={invoices} userRole={user.role} />;
}
