'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Plus, Pencil, Trash2, Eye, Mail, Phone, Star } from 'lucide-react';
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
import { SupplierFormDialog } from '@/components/forms/supplier-form';
import { deleteSupplier } from '@/lib/actions/suppliers';
import { formatCurrency } from '@/lib/utils/helpers';
import type { Supplier, Role } from '@/types';

interface SuppliersClientProps {
  suppliers: Supplier[];
  userRole: Role;
}

export function SuppliersClient({ suppliers, userRole }: SuppliersClientProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canEdit = userRole === 'admin' || userRole === 'manager';
  const canDelete = userRole === 'admin';

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const result = await deleteSupplier(deleteId);
      if (result.success) {
        toast.success('Supplier deleted');
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

  const columns: ColumnDef<Supplier>[] = [
    {
      accessorKey: 'name',
      header: 'Supplier',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.getValue('name')}</p>
          {row.original.contact_person && (
            <p className="text-sm text-muted-foreground">{row.original.contact_person}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Contact',
      cell: ({ row }) => (
        <div className="space-y-1">
          {row.original.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-3 w-3" />
              {row.original.email}
            </div>
          )}
          {row.original.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3 w-3" />
              {row.original.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'city',
      header: 'Location',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {[row.original.city, row.original.country].filter(Boolean).join(', ') || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'rating',
      header: 'Rating',
      cell: ({ row }) => {
        const rating = row.original.rating;
        if (!rating) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{rating.toFixed(1)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'total_orders',
      header: 'Orders',
      cell: ({ row }) => row.original.total_orders || 0,
    },
    {
      accessorKey: 'total_spent',
      header: 'Total Spent',
      cell: ({ row }) => formatCurrency(row.original.total_spent || 0),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.getValue('is_active') ? 'default' : 'secondary'}>
          {row.getValue('is_active') ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const supplier = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Link href={`/suppliers/${supplier.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {canEdit && (
                <DropdownMenuItem onClick={() => { setEditSupplier(supplier); setShowForm(true); }}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(supplier.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
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
          <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground">Manage your supplier network</p>
        </div>
        {canEdit && (
          <Button onClick={() => { setEditSupplier(null); setShowForm(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={suppliers} searchKey="name" searchPlaceholder="Search suppliers..." />
        </CardContent>
      </Card>

      <SupplierFormDialog
        open={showForm}
        onOpenChange={(open) => { if (!open) { setShowForm(false); setEditSupplier(null); } }}
        supplier={editSupplier}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the supplier and all associated data.
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
