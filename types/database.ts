// ============================================================================
// EnterpriX ERP - Database Types
// Comprehensive TypeScript types for all database entities
// ============================================================================

export type Role = 'admin' | 'manager' | 'viewer';

export type OrderStatus = 'draft' | 'approved' | 'ordered' | 'received' | 'cancelled';
export type SalesOrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type InvoiceStatus = 'unpaid' | 'paid' | 'overdue' | 'cancelled';
export type TransactionType = 'purchase_in' | 'sale_out' | 'adjustment' | 'transfer';

// ============================================================================
// Core Entities
// ============================================================================

export interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoleRecord {
  id: string;
  name: Role;
  description: string | null;
  permissions: Record<string, boolean>;
  created_at: string;
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  position: string | null;
  department_id: string | null;
  hire_date: string | null;
  salary: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  department?: Department;
}

export interface UserProfile {
  id: string;
  auth_id: string;
  employee_id: string | null;
  role: Role;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  employee?: Employee;
}

// ============================================================================
// Inventory Entities
// ============================================================================

export interface Category {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  // Computed
  product_count?: number;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string | null;
  capacity: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Computed
  current_stock?: number;
  utilization?: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category_id: string | null;
  unit_price: number;
  cost_price: number;
  reorder_level: number;
  unit_of_measure: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  category?: Category;
  // Computed
  total_stock?: number;
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface Inventory {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  min_quantity: number;
  max_quantity: number | null;
  last_restocked: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  product?: Product;
  warehouse?: Warehouse;
}

// ============================================================================
// Supplier Entities
// ============================================================================

export interface Supplier {
  id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  payment_terms: string | null;
  rating: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Computed
  total_orders?: number;
  total_spent?: number;
}

export interface SupplierProduct {
  id: string;
  supplier_id: string;
  product_id: string;
  supplier_sku: string | null;
  unit_cost: number;
  lead_time_days: number | null;
  min_order_qty: number;
  is_preferred: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  supplier?: Supplier;
  product?: Product;
}

// ============================================================================
// Purchase Order Entities
// ============================================================================

export interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_id: string;
  warehouse_id: string;
  status: OrderStatus;
  order_date: string;
  expected_date: string | null;
  received_date: string | null;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes: string | null;
  created_by: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  supplier?: Supplier;
  warehouse?: Warehouse;
  items?: PurchaseOrderItem[];
  created_by_user?: UserProfile;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  received_quantity: number;
  line_total: number;
  created_at: string;
  // Relations
  product?: Product;
}

// ============================================================================
// Customer & Sales Entities
// ============================================================================

export interface Customer {
  id: string;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  tax_id: string | null;
  credit_limit: number | null;
  payment_terms: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Computed
  total_orders?: number;
  total_revenue?: number;
}

export interface SalesOrder {
  id: string;
  order_number: string;
  customer_id: string;
  warehouse_id: string;
  status: SalesOrderStatus;
  order_date: string;
  shipping_date: string | null;
  delivery_date: string | null;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  shipping_address: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  customer?: Customer;
  warehouse?: Warehouse;
  items?: SalesOrderItem[];
  invoice?: Invoice;
}

export interface SalesOrderItem {
  id: string;
  sales_order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  line_total: number;
  created_at: string;
  // Relations
  product?: Product;
}

// ============================================================================
// Invoice Entities
// ============================================================================

export interface Invoice {
  id: string;
  invoice_number: string;
  sales_order_id: string;
  customer_id: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  paid_date: string | null;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  sales_order?: SalesOrder;
  customer?: Customer;
}

// ============================================================================
// Transaction & Audit Entities
// ============================================================================

export interface StockTransaction {
  id: string;
  product_id: string;
  warehouse_id: string;
  transaction_type: TransactionType;
  quantity: number;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  // Relations
  product?: Product;
  warehouse?: Warehouse;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  // Relations
  user?: UserProfile;
}

// ============================================================================
// Analytics & Reporting Types
// ============================================================================

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  orders: number;
}

export interface ProductRanking {
  product_id: string;
  product_name: string;
  total_sold: number;
  total_revenue: number;
}

export interface LowStockAlert {
  product_id: string;
  product_name: string;
  sku: string;
  current_stock: number;
  reorder_level: number;
  category_name: string | null;
}

export interface SupplierPerformance {
  supplier_id: string;
  supplier_name: string;
  total_orders: number;
  total_spent: number;
  on_time_delivery_rate: number;
  avg_lead_time: number;
}

export interface InventoryByCategory {
  category_id: string;
  category_name: string;
  product_count: number;
  total_value: number;
}

export interface DashboardStats {
  total_products: number;
  monthly_orders: number;
  monthly_revenue: number;
  low_stock_count: number;
  total_customers: number;
  total_suppliers: number;
  pending_orders: number;
  unpaid_invoices: number;
}

// ============================================================================
// Form Input Types
// ============================================================================

export interface ProductInput {
  sku: string;
  name: string;
  description?: string;
  category_id?: string;
  unit_price: number;
  cost_price: number;
  reorder_level: number;
  unit_of_measure: string;
  is_active?: boolean;
}

export interface SupplierInput {
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  payment_terms?: string;
  is_active?: boolean;
}

export interface CustomerInput {
  name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  tax_id?: string;
  credit_limit?: number;
  payment_terms?: string;
  is_active?: boolean;
}

export interface PurchaseOrderInput {
  supplier_id: string;
  warehouse_id: string;
  expected_date?: string;
  notes?: string;
  items: PurchaseOrderItemInput[];
}

export interface PurchaseOrderItemInput {
  product_id: string;
  quantity: number;
  unit_cost: number;
}

export interface SalesOrderInput {
  customer_id: string;
  warehouse_id: string;
  shipping_address?: string;
  notes?: string;
  discount_amount?: number;
  items: SalesOrderItemInput[];
}

export interface SalesOrderItemInput {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
}

export interface EmployeeInput {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position?: string;
  department_id?: string;
  hire_date?: string;
  salary?: number;
  is_active?: boolean;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SearchFilters {
  search?: string;
  category_id?: string;
  status?: string;
  is_active?: boolean;
  date_from?: string;
  date_to?: string;
}

// ============================================================================
// Search Result Types
// ============================================================================

export interface SearchResult {
  products: {
    id: string;
    name: string;
    sku: string;
    unit_price: number;
  }[];
  orders: {
    id: string;
    order_number: string;
    total_amount: number;
    customer_name: string;
  }[];
  customers: {
    id: string;
    name: string;
    email: string | null;
    company_name: string | null;
  }[];
}
