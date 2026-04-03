'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, Mail, Phone, MapPin, Building2, CreditCard, DollarSign, ShoppingCart, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CustomerFormDialog } from '@/components/forms/customer-form';
import { deleteCustomer } from '@/lib/actions/customers';
import { formatCurrency, formatDate } from '@/lib/utils/helpers';
import { SALES_ORDER_STATUS, INVOICE_STATUS } from '@/lib/constants';
import type { Customer, Role, SalesOrder, Invoice } from '@/types';
import { createClient } from '@/lib/supabase/client';

interface CustomerDetailClientProps {
  customer: Customer;
  userRole: Role;
}

export function CustomerDetailClient({ customer, userRole }: CustomerDetailClientProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const canEdit = userRole === 'admin' || userRole === 'manager';
  const canDelete = userRole === 'admin';

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      
      const [ordersRes, invoicesRes] = await Promise.all([
        supabase
          .from('sales_orders')
          .select('*')
          .eq('customer_id', customer.id)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('invoices')
          .select('*')
          .eq('customer_id', customer.id)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      setOrders(ordersRes.data || []);
      setInvoices(invoicesRes.data || []);
      setIsLoading(false);
    }

    fetchData();
  }, [customer.id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteCustomer(customer.id);
      if (result.success) {
        toast.success('Customer deleted');
        router.push('/customers');
      } else {
        toast.error(result.error || 'Failed to delete');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate stats
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const paidInvoices = invoices.filter(i => i.status === 'paid').length;
  const unpaidAmount = invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + (i.total_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/customers">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
              <Badge variant={customer.is_active ? 'default' : 'secondary'}>
                {customer.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-muted-foreground">{customer.company_name || 'Customer Details'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button variant="outline" onClick={() => setShowEditDialog(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {customer.name}. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Paid Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidInvoices}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unpaid Amount</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(unpaidAmount)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Customer Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customer.company_name && (
              <div>
                <span className="text-sm text-muted-foreground">Company</span>
                <p className="font-medium">{customer.company_name}</p>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${customer.email}`} className="text-primary hover:underline">
                  {customer.email}
                </a>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{customer.phone}</span>
              </div>
            )}
            {(customer.address || customer.city || customer.country) && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  {customer.address && <p>{customer.address}</p>}
                  <p>{[customer.city, customer.country].filter(Boolean).join(', ')}</p>
                </div>
              </div>
            )}
            <Separator />
            {customer.tax_id && (
              <div>
                <span className="text-sm text-muted-foreground">Tax ID</span>
                <p className="font-medium">{customer.tax_id}</p>
              </div>
            )}
            {customer.credit_limit !== null && customer.credit_limit !== undefined && (
              <div>
                <span className="text-sm text-muted-foreground">Credit Limit</span>
                <p className="font-medium">{formatCurrency(customer.credit_limit)}</p>
              </div>
            )}
            {customer.payment_terms && (
              <div>
                <span className="text-sm text-muted-foreground">Payment Terms</span>
                <p className="font-medium">{customer.payment_terms}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders & Invoices Tabs */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>History</CardTitle>
            <CardDescription>Recent orders and invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="orders">
              <TabsList>
                <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
                <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="orders" className="mt-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No orders found
                          </TableCell>
                        </TableRow>
                      ) : (
                        orders.map((order) => {
                          const statusConfig = SALES_ORDER_STATUS[order.status as keyof typeof SALES_ORDER_STATUS];
                          return (
                            <TableRow key={order.id}>
                              <TableCell>
                                <Link href={`/sales-orders/${order.id}`} className="font-medium text-primary hover:underline">
                                  {order.order_number}
                                </Link>
                              </TableCell>
                              <TableCell>{formatDate(order.order_date)}</TableCell>
                              <TableCell>
                                <Badge className={statusConfig?.color}>{statusConfig?.label}</Badge>
                              </TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(order.total_amount)}</TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
              
              <TabsContent value="invoices" className="mt-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Issue Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No invoices found
                          </TableCell>
                        </TableRow>
                      ) : (
                        invoices.map((invoice) => {
                          const statusConfig = INVOICE_STATUS[invoice.status as keyof typeof INVOICE_STATUS];
                          return (
                            <TableRow key={invoice.id}>
                              <TableCell>
                                <Link href={`/invoices/${invoice.id}`} className="font-medium text-primary hover:underline">
                                  {invoice.invoice_number}
                                </Link>
                              </TableCell>
                              <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                              <TableCell>{formatDate(invoice.due_date)}</TableCell>
                              <TableCell>
                                <Badge className={statusConfig?.color}>{statusConfig?.label}</Badge>
                              </TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(invoice.total_amount)}</TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <CustomerFormDialog 
        open={showEditDialog} 
        onOpenChange={setShowEditDialog}
        customer={customer}
      />
    </div>
  );
}
