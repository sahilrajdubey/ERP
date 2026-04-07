'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Plus, Pencil, Trash2, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { warehouseSchema, type WarehouseInput } from '@/lib/validations';
import { createWarehouse, updateWarehouse, deleteWarehouse } from '@/lib/actions/inventory';
import { formatNumber } from '@/lib/utils/helpers';
import type { Warehouse, Role } from '@/types';

interface WarehousesClientProps {
  warehouses: Warehouse[];
  userRole: Role;
}

export function WarehousesClient({ warehouses, userRole }: WarehousesClientProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editWarehouse, setEditWarehouse] = useState<Warehouse | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canEdit = userRole === 'admin' || userRole === 'manager';
  const canDelete = userRole === 'admin';

  const form = useForm<WarehouseInput>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: { name: '', location: '', capacity: undefined, is_active: true },
  });

  const openEditForm = (warehouse: Warehouse) => {
    setEditWarehouse(warehouse);
    form.reset({
      name: warehouse.name,
      location: warehouse.location || '',
      capacity: warehouse.capacity || undefined,
      is_active: warehouse.is_active,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditWarehouse(null);
    form.reset({ name: '', location: '', capacity: undefined, is_active: true });
  };

  async function onSubmit(data: WarehouseInput) {
    setIsLoading(true);
    try {
      const result = editWarehouse
        ? await updateWarehouse(editWarehouse.id, data)
        : await createWarehouse(data);

      if (result.success) {
        toast.success(editWarehouse ? 'Warehouse updated' : 'Warehouse created');
        closeForm();
        router.refresh();
      } else {
        toast.error(result.error || 'Something went wrong');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const result = await deleteWarehouse(deleteId);
      if (result.success) {
        toast.success('Warehouse deleted');
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

  const columns: ColumnDef<Warehouse>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>,
    },
    {
      accessorKey: 'location',
      header: 'Location',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {row.getValue('location') || '—'}
        </div>
      ),
    },
    {
      accessorKey: 'capacity',
      header: 'Capacity',
      cell: ({ row }) => {
        const warehouse = row.original;
        const utilization = warehouse.utilization || 0;
        return (
          <div className="space-y-1 w-32">
            <div className="flex justify-between text-sm">
              <span>{formatNumber(warehouse.current_stock || 0)}</span>
              <span className="text-muted-foreground">/ {formatNumber(warehouse.capacity || 0)}</span>
            </div>
            <Progress value={utilization} className="h-2" />
          </div>
        );
      },
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
        const warehouse = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && (
                <DropdownMenuItem onClick={() => openEditForm(warehouse)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setDeleteId(warehouse.id)}
                >
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
          <h1 className="text-3xl font-bold tracking-tight">Warehouses</h1>
          <p className="text-muted-foreground">Manage storage locations</p>
        </div>
        {canEdit && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Warehouse
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={warehouses} searchKey="name" searchPlaceholder="Search warehouses..." />
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editWarehouse ? 'Edit Warehouse' : 'Add Warehouse'}</DialogTitle>
            <DialogDescription>
              {editWarehouse ? 'Update warehouse details.' : 'Create a new warehouse location.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...form.register('name')} disabled={isLoading} />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" {...form.register('location')} disabled={isLoading} placeholder="City, State" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity (units)</Label>
              <Input id="capacity" type="number" {...form.register('capacity')} disabled={isLoading} placeholder="10000" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeForm} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editWarehouse ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Warehouse?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All inventory in this warehouse will be affected.
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
