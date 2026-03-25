'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Plus, Eye, Trash2, CheckCircle, XCircle, Truck, Package } from 'lucide-react';
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
import { updatePurchaseOrderStatus, deletePurchaseOrder } from '@/lib/actions/purchase-orders';
import { formatCurrency, formatDate } from '@/lib/utils/helpers';
import { ORDER_STATUS } from '@/lib/constants';
import type { PurchaseOrder, Role, OrderStatus } from '@/types';

interface PurchaseOrdersClientProps {
  orders: PurchaseOrder[];
  userRole: Role;
}

export function PurchaseOrdersClient({ orders, userRole }: PurchaseOrdersClientProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canEdit = userRole === 'admin' || userRole === 'manager';
  const canDelete = userRole === 'admin';

  const handleStatusChange = async (id: string, status: OrderStatus) => {
    try {
      const result = await updatePurchaseOrderStatus(id, status);
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

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const result = await deletePurchaseOrder(deleteId);
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

  const columns: ColumnDef<PurchaseOrder>[] = [
    {
      accessorKey: 'order_number',
      header: 'Order #',
      cell: ({ row }) => (
        <Link href={`/purchase-orders/${row.original.id}`} className="font-medium text-primary hover:underline">
          {row.getValue('order_number')}
        </Link>
      ),
    },
    {
      accessorKey: 'supplier',
      header: 'Supplier',
      cell: ({ row }) => row.original.supplier?.name || 'N/A',
    },
    {
      accessorKey: 'warehouse',
      header: 'Warehouse',
      cell: ({ row }) => row.original.warehouse?.name || 'N/A',
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
        const status = row.getValue('status') as keyof typeof ORDER_STATUS;
        const config = ORDER_STATUS[status];
        return <Badge className={config.color}>{config.label}</Badge>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const order = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Link href={`/purchase-orders/${order.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              {canEdit && (
                <>
                  <DropdownMenuSeparator />
                  {order.status === 'draft' && (
                    <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'approved')}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </DropdownMenuItem>
                  )}
                  {order.status === 'approved' && (
                    <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'ordered')}>
                      <Truck className="mr-2 h-4 w-4" />
                      Mark as Ordered
                    </DropdownMenuItem>
                  )}
                  {order.status === 'ordered' && (
                    <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'received')}>
                      <Package className="mr-2 h-4 w-4" />
                      Mark as Received
                    </DropdownMenuItem>
                  )}
                  {order.status !== 'received' && order.status !== 'cancelled' && (
                    <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'cancelled')}>
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel
                    </DropdownMenuItem>
                  )}
                </>
              )}
              {canDelete && order.status === 'draft' && (
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
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage supplier purchase orders</p>
        </div>
        {canEdit && (
          <Button asChild>
            <Link href="/purchase-orders/new">
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
              This will permanently delete the purchase order.
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
