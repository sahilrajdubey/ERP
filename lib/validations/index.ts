import { z } from 'zod';

// ============================================================================
// Auth Validations
// ============================================================================

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ============================================================================
// Product Validations
// ============================================================================

export const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU must be less than 50 characters'),
  name: z.string().min(1, 'Product name is required').max(200, 'Name must be less than 200 characters'),
  description: z.string().optional(),
  category_id: z.string().optional(),
  unit_price: z.coerce.number().min(0, 'Unit price must be positive'),
  cost_price: z.coerce.number().min(0, 'Cost price must be positive'),
  reorder_level: z.coerce.number().int().min(0, 'Reorder level must be a positive integer'),
  unit_of_measure: z.string().min(1, 'Unit of measure is required'),
  is_active: z.boolean().default(true),
});

export type ProductInput = z.infer<typeof productSchema>;

// ============================================================================
// Category Validations
// ============================================================================

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().optional(),
  parent_id: z.string().optional(),
});

export type CategoryInput = z.infer<typeof categorySchema>;

// ============================================================================
// Warehouse Validations
// ============================================================================

export const warehouseSchema = z.object({
  name: z.string().min(1, 'Warehouse name is required').max(100, 'Name must be less than 100 characters'),
  location: z.string().optional(),
  capacity: z.number().int().min(0, 'Capacity must be a positive integer').optional(),
  is_active: z.boolean(),
});

export type WarehouseInput = z.infer<typeof warehouseSchema>;

// ============================================================================
// Supplier Validations
// ============================================================================

export const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required').max(200, 'Name must be less than 200 characters'),
  contact_person: z.string().optional(),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  payment_terms: z.string().optional(),
  is_active: z.boolean().default(true),
});

export type SupplierInput = z.infer<typeof supplierSchema>;

// ============================================================================
// Customer Validations
// ============================================================================

export const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(200, 'Name must be less than 200 characters'),
  company_name: z.string().optional(),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  tax_id: z.string().optional(),
  credit_limit: z.coerce.number().min(0, 'Credit limit must be positive').optional(),
  payment_terms: z.string().optional(),
  is_active: z.boolean().default(true),
});

export type CustomerInput = z.infer<typeof customerSchema>;

// ============================================================================
// Purchase Order Validations
// ============================================================================

export const purchaseOrderItemSchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  unit_cost: z.coerce.number().min(0, 'Unit cost must be positive'),
});

export const purchaseOrderSchema = z.object({
  supplier_id: z.string().min(1, 'Supplier is required'),
  warehouse_id: z.string().min(1, 'Warehouse is required'),
  expected_date: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(purchaseOrderItemSchema).min(1, 'At least one item is required'),
});

export type PurchaseOrderItemInput = z.infer<typeof purchaseOrderItemSchema>;
export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;

// ============================================================================
// Sales Order Validations
// ============================================================================

export const salesOrderItemSchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  unit_price: z.coerce.number().min(0, 'Unit price must be positive'),
  discount_percent: z.coerce.number().min(0).max(100, 'Discount must be between 0-100').default(0),
});

export const salesOrderSchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  warehouse_id: z.string().min(1, 'Warehouse is required'),
  shipping_address: z.string().optional(),
  notes: z.string().optional(),
  discount_amount: z.coerce.number().min(0, 'Discount must be positive').default(0),
  items: z.array(salesOrderItemSchema).min(1, 'At least one item is required'),
});

export type SalesOrderItemInput = z.infer<typeof salesOrderItemSchema>;
export type SalesOrderInput = z.infer<typeof salesOrderSchema>;

// ============================================================================
// Employee Validations
// ============================================================================

export const employeeSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100, 'First name must be less than 100 characters'),
  last_name: z.string().min(1, 'Last name is required').max(100, 'Last name must be less than 100 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  position: z.string().optional(),
  department_id: z.string().optional(),
  hire_date: z.string().optional(),
  salary: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : Number(val)),
    z.number().min(0, 'Salary must be positive').optional()
  ),
  is_active: z.boolean().default(true),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;

// ============================================================================
// Settings Validations
// ============================================================================

export const companySettingsSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  tax_id: z.string().optional(),
  currency: z.string().default('USD'),
  tax_rate: z.coerce.number().min(0).max(100).default(10),
});

export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;

// ============================================================================
// User Management Validations
// ============================================================================

export const userRoleSchema = z.object({
  user_id: z.string().min(1, 'User ID is required'),
  role: z.enum(['admin', 'manager', 'viewer']),
  is_active: z.boolean().default(true),
});

export type UserRoleInput = z.infer<typeof userRoleSchema>;

export const createUserSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'manager', 'viewer']).default('viewer'),
  employee_id: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
