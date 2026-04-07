'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Plus, Eye, Trash2, Package, Truck, CheckCircle, XCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DataTable } from '@/components/data-table';
import { updateSalesOrderStatus, deleteSalesOrder } from '@/lib/actions/sales-orders';
import { createInvoiceFromOrder } from '@/lib/actions/invoices';
import { formatCurrency, formatDate } from '@/lib/utils/helpers';
import { SALES_ORDER_STATUS } from '@/lib/constants';
import type { SalesOrder, Role, SalesOrderStatus } from '@/types';

interface SalesOrdersClientProps {
  orders: SalesOrder[];
  userRole: Role;
}

export function SalesOrdersClient({ orders, userRole }: SalesOrdersClientProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canEdit = userRole === 'admin' || userRole === 'manager';
  const canDelete = userRole === 'admin';

  const handleStatusChange = async (id: string, status: SalesOrderStatus) => {
    try {
      const result = await updateSalesOrderStatus(id, status);
      if (result.success) {
        toast.success(`Order status updated to ${status}`);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update status');
      }
    } catch {
      toast.error('An error occurred');
    }
  };

  const handleCreateInvoice = async (id: string) => {
    try {
      const result = await createInvoiceFromOrder(id);
      if (result.success) {
        toast.success('Invoice created');
        router.push(`/invoices/${result.data?.id}`);
      } else {
        toast.error(result.error || 'Failed to create invoice');
      }
    } catch {
      toast.error('An error occurred');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const result = await deleteSalesOrder(deleteId);
      if (result.success) {
        toast.success('Order deleted');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const columns: ColumnDef<SalesOrder>[] = [
    {
      accessorKey: 'order_number',
      header: 'Order #',
      cell: ({ row }) => (
        <Link href={`/sales-orders/${row.original.id}`} className="font-medium text-primary hover:underline">
          {row.getValue('order_number')}
        </Link>
      ),
    },
    {
      accessorKey: 'customer',
      header: 'Customer',
      cell: ({ row }) => row.original.customer?.name || 'N/A',
    },
    {
      accessorKey: 'order_date',
      header: 'Date',
      cell: ({ row }) => formatDate(row.getValue('order_date')),
    },
    {
      accessorKey: 'total_amount',
      header: 'Total',
      cell: ({ row }) => formatCurrency(row.getValue('total_amount')),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as keyof typeof SALES_ORDER_STATUS;
        const config = SALES_ORDER_STATUS[status];
        return <Badge className={config.color}>{config.label}</Badge>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const order = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/sales-orders/${order.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              {canEdit && (
                <>
                  <DropdownMenuSeparator />
                  {order.status === 'pending' && (
                    <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'processing')}>
                      <Package className="mr-2 h-4 w-4" />
                      Start Processing
                    </DropdownMenuItem>
                  )}
                  {order.status === 'processing' && (
                    <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'shipped')}>
                      <Truck className="mr-2 h-4 w-4" />
                      Mark as Shipped
                    </DropdownMenuItem>
                  )}
                  {order.status === 'shipped' && (
                    <>
                      <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'delivered')}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark as Delivered
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCreateInvoice(order.id)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Create Invoice
                      </DropdownMenuItem>
                    </>
                  )}
                  {order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'cancelled')}>
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel
                    </DropdownMenuItem>
                  )}
                </>
              )}
              {canDelete && order.status === 'pending' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(order.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Orders</h1>
          <p className="text-muted-foreground">Manage customer orders</p>
        </div>
        {canEdit && (
          <Button asChild>
            <Link href="/sales-orders/new">
              <Plus className="mr-2 h-4 w-4" />
              New Order
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={orders} searchKey="order_number" searchPlaceholder="Search orders..." />
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the sales order.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
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
    </div>
  );
}
