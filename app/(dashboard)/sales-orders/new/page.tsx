import { redirect } from 'next/navigation';
import { getUserProfile } from '@/lib/actions/auth';
import { getCustomers } from '@/lib/actions/customers';
import { getProducts } from '@/lib/actions/inventory';
import { getWarehouses } from '@/lib/actions/inventory';
import { SalesOrderFormClient } from './sales-order-form-client';

export default async function NewSalesOrderPage() {
  const user = await getUserProfile();
  
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    redirect('/sales-orders');
  }

  const [customersData, productsData, warehouses] = await Promise.all([
    getCustomers(undefined, 1, 100),
    getProducts(undefined, undefined, undefined, 1, 100),
    getWarehouses(),
  ]);

  return (
    <SalesOrderFormClient 
      customers={customersData.data} 
      products={productsData.data}
      warehouses={warehouses}
    />
  );
}
