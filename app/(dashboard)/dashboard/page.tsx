import { Suspense } from 'react';
import { Package, ShoppingCart, DollarSign, AlertTriangle, Users, Truck, FileText, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RevenueChart } from '@/components/charts/revenue-chart';
import { CategoryChart } from '@/components/charts/category-chart';
import { getDashboardStats, getMonthlyRevenue, getLowStockAlerts, getInventoryByCategory } from '@/lib/actions/dashboard';
import { getSalesOrders } from '@/lib/actions/sales-orders';
import { formatCurrency, formatDate } from '@/lib/utils/helpers';
import { SALES_ORDER_STATUS } from '@/lib/constants';

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

async function StatsCards() {
  const stats = await getDashboardStats();

  const statItems = [
    {
      title: 'Total Products',
      value: stats.total_products.toLocaleString(),
      description: 'Active items in inventory',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Monthly Orders',
      value: stats.monthly_orders.toLocaleString(),
      description: 'Orders this month',
      icon: ShoppingCart,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(stats.monthly_revenue),
      description: 'Revenue this month',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Low Stock Alerts',
      value: stats.low_stock_count.toLocaleString(),
      description: 'Items need restocking',
      icon: AlertTriangle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      title: 'Total Customers',
      value: stats.total_customers.toLocaleString(),
      description: 'Registered customers',
      icon: Users,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
    },
    {
      title: 'Total Suppliers',
      value: stats.total_suppliers.toLocaleString(),
      description: 'Active suppliers',
      icon: Truck,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      title: 'Pending Orders',
      value: stats.pending_orders.toLocaleString(),
      description: 'Awaiting processing',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Unpaid Invoices',
      value: stats.unpaid_invoices.toLocaleString(),
      description: 'Awaiting payment',
      icon: FileText,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item) => (
        <Card key={item.title} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${item.bgColor}`}>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function ChartsSection() {
  const [monthlyRevenue, inventoryByCategory] = await Promise.all([
    getMonthlyRevenue(),
    getInventoryByCategory(),
  ]);

  return (
    <div className="grid gap-4 md:grid-cols-7">
      <RevenueChart data={monthlyRevenue} />
      <CategoryChart data={inventoryByCategory} />
    </div>
  );
}

async function RecentOrdersTable() {
  const { data: orders } = await getSalesOrders(undefined, undefined, 1, 5);

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Recent Sales Orders</CardTitle>
        <CardDescription>Latest orders from customers</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const statusConfig = SALES_ORDER_STATUS[order.status as keyof typeof SALES_ORDER_STATUS];
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>{order.customer?.name || 'N/A'}</TableCell>
                    <TableCell>{formatDate(order.order_date)}</TableCell>
                    <TableCell>
                      <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(order.total_amount)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

async function LowStockTable() {
  const alerts = await getLowStockAlerts();
  const topAlerts = alerts.slice(0, 5);

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Low Stock Alerts</CardTitle>
        <CardDescription>Products that need restocking</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Reorder</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topAlerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No low stock alerts
                </TableCell>
              </TableRow>
            ) : (
              topAlerts.map((alert) => (
                <TableRow key={alert.product_id}>
                  <TableCell className="font-medium">{alert.product_name}</TableCell>
                  <TableCell className="text-muted-foreground">{alert.sku}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={alert.current_stock === 0 ? 'destructive' : 'secondary'}>
                      {alert.current_stock}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {alert.reorder_level}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here&apos;s an overview of your business.</p>
      </div>

      <Suspense fallback={
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      }>
        <StatsCards />
      </Suspense>

      <Suspense fallback={
        <div className="grid gap-4 md:grid-cols-7">
          <Card className="col-span-4"><CardContent className="h-[400px]"><Skeleton className="h-full w-full" /></CardContent></Card>
          <Card className="col-span-3"><CardContent className="h-[400px]"><Skeleton className="h-full w-full" /></CardContent></Card>
        </div>
      }>
        <ChartsSection />
      </Suspense>

      <div className="grid gap-4 md:grid-cols-7">
        <Suspense fallback={<Card className="col-span-4"><CardContent className="h-[300px]"><Skeleton className="h-full w-full" /></CardContent></Card>}>
          <RecentOrdersTable />
        </Suspense>
        <Suspense fallback={<Card className="col-span-3"><CardContent className="h-[300px]"><Skeleton className="h-full w-full" /></CardContent></Card>}>
          <LowStockTable />
        </Suspense>
      </div>
    </div>
  );
}
