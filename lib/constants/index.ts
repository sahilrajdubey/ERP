// ============================================================================
// EnterpriX ERP - Constants
// ============================================================================

export const APP_NAME = 'EnterpriX ERP';
export const APP_DESCRIPTION = 'Enterprise Resource Planning System';

// Role Definitions
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  VIEWER: 'viewer',
} as const;

// Role Permissions Matrix
export const ROLE_PERMISSIONS = {
  admin: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canManageUsers: true,
    canManageSettings: true,
    canViewReports: true,
    canApproveOrders: true,
  },
  manager: {
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canManageUsers: false,
    canManageSettings: false,
    canViewReports: true,
    canApproveOrders: true,
  },
  viewer: {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canManageUsers: false,
    canManageSettings: false,
    canViewReports: true,
    canApproveOrders: false,
  },
} as const;

// Order Status Labels and Colors
export const ORDER_STATUS = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-800' },
  ordered: { label: 'Ordered', color: 'bg-yellow-100 text-yellow-800' },
  received: { label: 'Received', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
} as const;

export const SALES_ORDER_STATUS = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-800' },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800' },
  shipped: { label: 'Shipped', color: 'bg-yellow-100 text-yellow-800' },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
} as const;

export const INVOICE_STATUS = {
  unpaid: { label: 'Unpaid', color: 'bg-yellow-100 text-yellow-800' },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800' },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
} as const;

// Stock Status
export const STOCK_STATUS = {
  in_stock: { label: 'In Stock', color: 'bg-green-100 text-green-800' },
  low_stock: { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' },
  out_of_stock: { label: 'Out of Stock', color: 'bg-red-100 text-red-800' },
} as const;

// Navigation Items
export const NAV_ITEMS = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
    roles: ['admin', 'manager', 'viewer'],
  },
  {
    title: 'Inventory',
    icon: 'Package',
    roles: ['admin', 'manager', 'viewer'],
    children: [
      { title: 'Products', href: '/inventory/products', roles: ['admin', 'manager', 'viewer'] },
      { title: 'Categories', href: '/inventory/categories', roles: ['admin', 'manager', 'viewer'] },
      { title: 'Warehouses', href: '/inventory/warehouses', roles: ['admin', 'manager', 'viewer'] },
    ],
  },
  {
    title: 'Suppliers',
    href: '/suppliers',
    icon: 'Truck',
    roles: ['admin', 'manager', 'viewer'],
  },
  {
    title: 'Purchase Orders',
    href: '/purchase-orders',
    icon: 'ShoppingCart',
    roles: ['admin', 'manager', 'viewer'],
  },
  {
    title: 'Customers',
    href: '/customers',
    icon: 'Users',
    roles: ['admin', 'manager', 'viewer'],
  },
  {
    title: 'Sales Orders',
    href: '/sales-orders',
    icon: 'Receipt',
    roles: ['admin', 'manager', 'viewer'],
  },
  {
    title: 'Invoices',
    href: '/invoices',
    icon: 'FileText',
    roles: ['admin', 'manager', 'viewer'],
  },
  {
    title: 'Employees',
    href: '/employees',
    icon: 'UserCog',
    roles: ['admin'],
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: 'BarChart3',
    roles: ['admin', 'manager', 'viewer'],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: 'Settings',
    roles: ['admin'],
  },
] as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Date Formats
export const DATE_FORMAT = 'MMM dd, yyyy';
export const DATE_TIME_FORMAT = 'MMM dd, yyyy HH:mm';

// Currency
export const CURRENCY = {
  code: 'USD',
  symbol: '$',
  locale: 'en-US',
} as const;

// Tax Rate (percentage)
export const DEFAULT_TAX_RATE = 10;

// Units of Measure
export const UNITS_OF_MEASURE = [
  { value: 'pcs', label: 'Pieces' },
  { value: 'kg', label: 'Kilograms' },
  { value: 'g', label: 'Grams' },
  { value: 'l', label: 'Liters' },
  { value: 'ml', label: 'Milliliters' },
  { value: 'm', label: 'Meters' },
  { value: 'box', label: 'Boxes' },
  { value: 'pack', label: 'Packs' },
] as const;

// Payment Terms
export const PAYMENT_TERMS = [
  { value: 'net_15', label: 'Net 15 Days' },
  { value: 'net_30', label: 'Net 30 Days' },
  { value: 'net_45', label: 'Net 45 Days' },
  { value: 'net_60', label: 'Net 60 Days' },
  { value: 'cod', label: 'Cash on Delivery' },
  { value: 'prepaid', label: 'Prepaid' },
] as const;
