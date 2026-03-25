import { notFound } from 'next/navigation';
import { getSupplier, getSupplierProducts } from '@/lib/actions/suppliers';
import { getUserProfile } from '@/lib/actions/auth';
import { SupplierDetailClient } from './supplier-detail-client';

interface SupplierDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SupplierDetailPage({ params }: SupplierDetailPageProps) {
  const { id } = await params;
  const [supplier, user, supplierProducts] = await Promise.all([
    getSupplier(id),
    getUserProfile(),
    getSupplierProducts(id),
  ]);

  if (!supplier || !user) {
    notFound();
  }

  return <SupplierDetailClient supplier={supplier} userRole={user.role} supplierProducts={supplierProducts} />;
}
