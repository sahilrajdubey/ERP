import { redirect } from 'next/navigation';
import { CategoriesClient } from './categories-client';
import { getCategories } from '@/lib/actions/inventory';
import { getUserProfile } from '@/lib/actions/auth';

export default async function CategoriesPage() {
  const [categories, user] = await Promise.all([
    getCategories(),
    getUserProfile(),
  ]);

  if (!user) redirect('/login');

  return <CategoriesClient categories={categories} userRole={user.role} />;
}
