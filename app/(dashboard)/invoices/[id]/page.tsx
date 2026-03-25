import { notFound } from 'next/navigation';
import { getInvoice } from '@/lib/actions/invoices';
import { getUserProfile } from '@/lib/actions/auth';
import { InvoiceDetailClient } from './invoice-detail-client';

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = await params;
  const [invoice, user] = await Promise.all([
    getInvoice(id),
    getUserProfile(),
  ]);

  if (!invoice || !user) {
    notFound();
  }

  return <InvoiceDetailClient invoice={invoice} userRole={user.role} />;
}
