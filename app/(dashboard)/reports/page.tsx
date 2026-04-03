import { redirect } from 'next/navigation';
import { ReportsClient } from './reports-client';
import { getMonthlyRevenue, getTopProducts, getInventoryByCategory, getLowStockAlerts } from '@/lib/actions/dashboard';
import { getUserProfile } from '@/lib/actions/auth';

export default async function ReportsPage() {
  const user = await getUserProfile();
  if (!user) redirect('/login');

  const [monthlyRevenue, topProducts, inventoryByCategory, lowStockAlerts] = await Promise.all([
    getMonthlyRevenue(),
    getTopProducts(),
    getInventoryByCategory(),
    getLowStockAlerts(),
  ]);

  return (
    <ReportsClient
      monthlyRevenue={monthlyRevenue}
      topProducts={topProducts}
      inventoryByCategory={inventoryByCategory}
      lowStockAlerts={lowStockAlerts}
    />
  );
}
