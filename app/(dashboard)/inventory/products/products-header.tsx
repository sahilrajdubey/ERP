'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductFormDialog } from '@/components/forms/product-form';
import type { Category, Role } from '@/types';

interface ProductsHeaderProps {
  categories: Category[];
  userRole: Role;
}

export function ProductsHeader({ categories, userRole }: ProductsHeaderProps) {
  const [showForm, setShowForm] = useState(false);
  const canCreate = userRole === 'admin' || userRole === 'manager';

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        )}
      </div>

      <ProductFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        categories={categories}
      />
    </>
  );
}
