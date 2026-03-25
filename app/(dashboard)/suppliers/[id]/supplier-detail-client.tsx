'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, Mail, Phone, MapPin, Building2, Package, ShoppingCart, DollarSign, Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
import { SupplierFormDialog } from '@/components/forms/supplier-form';
import { deleteSupplier } from '@/lib/actions/suppliers';
import { formatCurrency, formatDate } from '@/lib/utils/helpers';
import { ORDER_STATUS } from '@/lib/constants';
import type { Supplier, SupplierProduct, Role, PurchaseOrder } from '@/types';
import { createClient } from '@/lib/supabase/client';

interface SupplierDetailClientProps {
  supplier: Supplier;
  userRole: Role;
  supplierProducts: SupplierProduct[];
}

export function SupplierDetailClient({ supplier, userRole, supplierProducts }: SupplierDetailClientProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const canEdit = userRole === 'admin' || userRole === 'manager';
  const canDelete = userRole === 'admin';

  useEffect(() => {
    async function fetchOrders() {
      const supabase = createClient();
      const { data } = await supabase
        .from('purchase_orders')
        .select('*, warehouse:warehouses(id, name)')
        .eq('supplier_id', supplier.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      setOrders(data || []);
      setIsLoading(false);
    }

    fetchOrders();
  }, [supplier.id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteSupplier(supplier.id);
      if (result.success) {
        toast.success('Supplier deleted');
        router.push('/suppliers');
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
  const totalSpent = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const completedOrders = orders.filter(o => o.status === 'received').length;
  const onTimeRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/suppliers">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{supplier.name}</h1>
              <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
                {supplier.is_active ? 'Active' : 'Inactive'}
              </Badge>
              {supplier.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{supplier.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            <p className="text-muted-foreground">{supplier.contact_person || 'Supplier Details'}</p>
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
                  <AlertDialogTitle>Delete Supplier?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {supplier.name}. This action cannot be undone.
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalSpent)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Products Supplied</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supplierProducts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{onTimeRate.toFixed(0)}%</div>
            <Progress value={onTimeRate} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Supplier Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {supplier.contact_person && (
              <div>
                <span className="text-sm text-muted-foreground">Contact Person</span>
                <p className="font-medium">{supplier.contact_person}</p>
              </div>
            )}
            {supplier.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${supplier.email}`} className="text-primary hover:underline">
                  {supplier.email}
                </a>
              </div>
            )}
            {supplier.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{supplier.phone}</span>
              </div>
            )}
            {(supplier.address || supplier.city || supplier.country) && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  {supplier.address && <p>{supplier.address}</p>}
                  <p>{[supplier.city, supplier.country].filter(Boolean).join(', ')}</p>
                </div>
              </div>
            )}
            <Separator />
            {supplier.payment_terms && (
              <div>
                <span className="text-sm text-muted-foreground">Payment Terms</span>
                <p className="font-medium">{supplier.payment_terms}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products & Orders Tabs */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Products and purchase history</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="products">
              <TabsList>
                <TabsTrigger value="products">Products ({supplierProducts.length})</TabsTrigger>
                <TabsTrigger value="orders">Purchase Orders ({orders.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="products" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Unit Cost</TableHead>
                      <TableHead className="text-right">Min Qty</TableHead>
                      <TableHead>Preferred</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No products linked to this supplier
                        </TableCell>
                      </TableRow>
                    ) : (
                      supplierProducts.map((sp) => (
                        <TableRow key={sp.id}>
                          <TableCell className="font-medium">{sp.product?.name || 'N/A'}</TableCell>
                          <TableCell className="text-muted-foreground">{sp.supplier_sku || sp.product?.sku || '-'}</TableCell>
                          <TableCell className="text-right">{formatCurrency(sp.unit_cost)}</TableCell>
                          <TableCell className="text-right">{sp.min_order_qty}</TableCell>
                          <TableCell>
                            {sp.is_preferred && (
                              <Badge className="bg-green-100 text-green-800">Preferred</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
              
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
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No purchase orders found
                          </TableCell>
                        </TableRow>
                      ) : (
                        orders.map((order) => {
                          const statusConfig = ORDER_STATUS[order.status as keyof typeof ORDER_STATUS];
                          return (
                            <TableRow key={order.id}>
                              <TableCell>
                                <Link href={`/purchase-orders/${order.id}`} className="font-medium text-primary hover:underline">
                                  {order.order_number}
                                </Link>
                              </TableCell>
                              <TableCell>{formatDate(order.order_date)}</TableCell>
                              <TableCell>{order.warehouse?.name || 'N/A'}</TableCell>
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
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <SupplierFormDialog 
        open={showEditDialog} 
        onOpenChange={setShowEditDialog}
        supplier={supplier}
      />
    </div>
  );
}
