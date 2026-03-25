'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { productSchema, type ProductInput } from '@/lib/validations';
import { createProduct, updateProduct } from '@/lib/actions/inventory';
import { UNITS_OF_MEASURE } from '@/lib/constants';
import type { Product, Category } from '@/types';

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  categories: Category[];
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  categories,
}: ProductFormDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!product;

  const form = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: product ? {
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      category_id: product.category_id || '',
      unit_price: product.unit_price,
      cost_price: product.cost_price,
      reorder_level: product.reorder_level,
      unit_of_measure: product.unit_of_measure,
      is_active: product.is_active,
    } : {
      sku: '',
      name: '',
      description: '',
      category_id: '',
      unit_price: 0,
      cost_price: 0,
      reorder_level: 10,
      unit_of_measure: 'pcs',
      is_active: true,
    },
  });

  async function onSubmit(data: ProductInput) {
    setIsLoading(true);
    try {
      const result = isEditing
        ? await updateProduct(product.id, data)
        : await createProduct(data);

      if (result.success) {
        toast.success(isEditing ? 'Product updated successfully' : 'Product created successfully');
        onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the product details below.' : 'Fill in the product details below.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                placeholder="PRD-001"
                {...form.register('sku')}
                disabled={isLoading}
              />
              {form.formState.errors.sku && (
                <p className="text-sm text-destructive">{form.formState.errors.sku.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Product Name"
                {...form.register('name')}
                disabled={isLoading}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Product description..."
              {...form.register('description')}
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category_id">Category</Label>
              <Select
                value={form.watch('category_id') || ''}
                onValueChange={(value) => form.setValue('category_id', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit_of_measure">Unit of Measure *</Label>
              <Select
                value={form.watch('unit_of_measure')}
                onValueChange={(value) => form.setValue('unit_of_measure', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {UNITS_OF_MEASURE.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit_price">Unit Price *</Label>
              <Input
                id="unit_price"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...form.register('unit_price')}
                disabled={isLoading}
              />
              {form.formState.errors.unit_price && (
                <p className="text-sm text-destructive">{form.formState.errors.unit_price.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost_price">Cost Price *</Label>
              <Input
                id="cost_price"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...form.register('cost_price')}
                disabled={isLoading}
              />
              {form.formState.errors.cost_price && (
                <p className="text-sm text-destructive">{form.formState.errors.cost_price.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorder_level">Reorder Level *</Label>
              <Input
                id="reorder_level"
                type="number"
                placeholder="10"
                {...form.register('reorder_level')}
                disabled={isLoading}
              />
              {form.formState.errors.reorder_level && (
                <p className="text-sm text-destructive">{form.formState.errors.reorder_level.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Update Product' : 'Create Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
