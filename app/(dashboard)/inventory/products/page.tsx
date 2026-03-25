import { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductsHeader } from './products-header';
import { ProductsTable } from './products-table';
import { getProducts, getCategories } from '@/lib/actions/inventory';
import { getUserProfile } from '@/lib/actions/auth';
import { redirect } from 'next/navigation';

async function ProductsContent() {
  const [{ data: products }, categories, user] = await Promise.all([
    getProducts(),
    getCategories(),
    getUserProfile(),
  ]);

  if (!user) redirect('/login');

  return (
    <>
      <ProductsHeader categories={categories} userRole={user.role} />
      <Card>
        <CardContent className="pt-6">
          <ProductsTable products={products} categories={categories} userRole={user.role} />
        </CardContent>
      </Card>
    </>
  );
}

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <Suspense
        fallback={
          <>
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-4 w-48 mt-2" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-[400px] w-full" />
              </CardContent>
            </Card>
          </>
        }
      >
        <ProductsContent />
      </Suspense>
    </div>
  );
}
