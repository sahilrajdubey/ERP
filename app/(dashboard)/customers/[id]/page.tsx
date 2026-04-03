import { notFound } from 'next/navigation';
import { getCustomer } from '@/lib/actions/customers';
import { getUserProfile } from '@/lib/actions/auth';
import { CustomerDetailClient } from './customer-detail-client';

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;
  const [customer, user] = await Promise.all([
    getCustomer(id),
    getUserProfile(),
  ]);

  if (!customer || !user) {
    notFound();
  }

  return <CustomerDetailClient customer={customer} userRole={user.role} />;
}
