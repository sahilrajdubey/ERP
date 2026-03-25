'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResponse, Product, Category, Warehouse, Inventory } from '@/types';
import type { ProductInput, CategoryInput, WarehouseInput } from '@/lib/validations';

// ============================================================================
// Products
// ============================================================================

export async function getProducts(
  search?: string,
  categoryId?: string,
  status?: string,
  page = 1,
  pageSize = 10
): Promise<{ data: Product[]; total: number }> {
  const supabase = await createClient();
  
  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name)
    `, { count: 'exact' });

  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
  }

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  if (status === 'active') {
    query = query.eq('is_active', true);
  } else if (status === 'inactive') {
    query = query.eq('is_active', false);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  const productIds = data?.map(p => p.id) || [];
  const { data: stockData } = await supabase
    .from('inventory')
    .select('product_id, quantity')
    .in('product_id', productIds);

  const stockMap = new Map<string, number>();
  stockData?.forEach(s => {
    stockMap.set(s.product_id, (stockMap.get(s.product_id) || 0) + s.quantity);
  });

  const productsWithStock = data?.map(p => ({
    ...p,
    total_stock: stockMap.get(p.id) || 0,
    stock_status: getStockStatus(stockMap.get(p.id) || 0, p.reorder_level),
  })) || [];

  return { data: productsWithStock, total: count || 0 };
}

function getStockStatus(stock: number, reorderLevel: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
  if (stock <= 0) return 'out_of_stock';
  if (stock <= reorderLevel) return 'low_stock';
  return 'in_stock';
}

export async function getProduct(id: string): Promise<Product | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('products')
    .select(`*, category:categories(id, name)`)
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function createProduct(input: ProductInput): Promise<ActionResponse<Product>> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('products')
    .insert(input)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath('/inventory/products');
  return { success: true, data };
}

export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<ActionResponse<Product>> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('products')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath('/inventory/products');
  return { success: true, data };
}

export async function deleteProduct(id: string): Promise<ActionResponse> {
  const supabase = await createClient();
  
  const { error } = await supabase.from('products').delete().eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/inventory/products');
  return { success: true };
}

// ============================================================================
// Categories
// ============================================================================

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) throw error;
  return data || [];
}

export async function createCategory(input: CategoryInput): Promise<ActionResponse<Category>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('categories').insert(input).select().single();
  if (error) return { success: false, error: error.message };
  revalidatePath('/inventory/categories');
  return { success: true, data };
}

export async function updateCategory(id: string, input: Partial<CategoryInput>): Promise<ActionResponse<Category>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) return { success: false, error: error.message };
  revalidatePath('/inventory/categories');
  return { success: true, data };
}

export async function deleteCategory(id: string): Promise<ActionResponse> {
  const supabase = await createClient();
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/inventory/categories');
  return { success: true };
}

// ============================================================================
// Warehouses
// ============================================================================

export async function getWarehouses(): Promise<Warehouse[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('warehouses').select('*').order('name');
  if (error) throw error;

  const { data: stockData } = await supabase.from('inventory').select('warehouse_id, quantity');
  const stockMap = new Map<string, number>();
  stockData?.forEach(s => {
    stockMap.set(s.warehouse_id, (stockMap.get(s.warehouse_id) || 0) + s.quantity);
  });

  return data?.map(w => ({
    ...w,
    current_stock: stockMap.get(w.id) || 0,
    utilization: w.capacity ? ((stockMap.get(w.id) || 0) / w.capacity) * 100 : 0,
  })) || [];
}

export async function createWarehouse(input: WarehouseInput): Promise<ActionResponse<Warehouse>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('warehouses').insert(input).select().single();
  if (error) return { success: false, error: error.message };
  revalidatePath('/inventory/warehouses');
  return { success: true, data };
}

export async function updateWarehouse(id: string, input: Partial<WarehouseInput>): Promise<ActionResponse<Warehouse>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('warehouses')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) return { success: false, error: error.message };
  revalidatePath('/inventory/warehouses');
  return { success: true, data };
}

export async function deleteWarehouse(id: string): Promise<ActionResponse> {
  const supabase = await createClient();
  const { error } = await supabase.from('warehouses').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/inventory/warehouses');
  return { success: true };
}

// ============================================================================
// Inventory
// ============================================================================

export async function getInventory(warehouseId?: string): Promise<Inventory[]> {
  const supabase = await createClient();
  let query = supabase.from('inventory').select(`*, product:products(*), warehouse:warehouses(*)`);
  if (warehouseId) query = query.eq('warehouse_id', warehouseId);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updateInventory(productId: string, warehouseId: string, quantity: number): Promise<ActionResponse> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('inventory')
    .upsert({ product_id: productId, warehouse_id: warehouseId, quantity, updated_at: new Date().toISOString() }, { onConflict: 'product_id,warehouse_id' });
  if (error) return { success: false, error: error.message };
  revalidatePath('/inventory');
  return { success: true };
}
