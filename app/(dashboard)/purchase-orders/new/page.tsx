import { redirect } from 'next/navigation';
import { getUserProfile } from '@/lib/actions/auth';
import { getSuppliers } from '@/lib/actions/suppliers';
import { getProducts } from '@/lib/actions/inventory';
import { getWarehouses } from '@/lib/actions/inventory';
import { PurchaseOrderFormClient } from './purchase-order-form-client';

export default async function NewPurchaseOrderPage() {
  const user = await getUserProfile();
  
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    redirect('/purchase-orders');
  }

  const [suppliersData, productsData, warehouses] = await Promise.all([
    getSuppliers(undefined, 1, 100),
    getProducts(undefined, undefined, undefined, 1, 100),
    getWarehouses(),
  ]);

  return (
    <PurchaseOrderFormClient 
      suppliers={suppliersData.data} 
      products={productsData.data}
      warehouses={warehouses}
    />
  );
}
