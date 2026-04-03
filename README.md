# EnterpriX ERP

A production-grade, enterprise-level full-stack Enterprise Resource Planning (ERP) web application built with modern technologies.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, RLS)
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod
- **PDF Generation**: jsPDF

## Features

### Core Modules
- **Dashboard**: KPI cards, revenue charts, low stock alerts
- **Inventory**: Products, Categories, Warehouses management
- **Suppliers**: Supplier network management with performance tracking
- **Purchase Orders**: Multi-step workflow (draft → approved → ordered → received)
- **Sales Orders**: Customer order management with status lifecycle
- **Customers**: Customer database with order history
- **Invoices**: Auto-generation from orders with PDF export
- **Employees**: HR management with user account creation (Admin only)
- **Reports**: Revenue trends, top products, inventory analytics
- **Settings**: Company profile, user management, audit log (Admin only)

### Role-Based Access Control (RBAC)
- **Admin**: Full system access including user/settings management
- **Manager**: Can create/update data, cannot delete critical records
- **Viewer**: Read-only access to dashboards and reports

### Security
- Three-layer RBAC enforcement (Frontend, Middleware, Database RLS)
- Supabase Auth with JWT session management
- Row Level Security policies on all tables

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Database Setup

1. Create a new Supabase project
2. Run the SQL schema from `supabase/schema.sql` in the SQL editor
3. Enable Row Level Security on all tables
4. Add RLS policies from `supabase/policies.sql`

## Project Structure

```
├── app/
│   ├── (auth)/           # Auth pages (login)
│   ├── (dashboard)/      # Protected dashboard routes
│   │   ├── dashboard/
│   │   ├── inventory/
│   │   ├── suppliers/
│   │   ├── customers/
│   │   ├── purchase-orders/
│   │   ├── sales-orders/
│   │   ├── invoices/
│   │   ├── employees/
│   │   ├── reports/
│   │   └── settings/
│   └── layout.tsx
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── layouts/          # App shell components
│   ├── charts/           # Recharts wrappers
│   ├── forms/            # Form dialogs
│   └── data-table/       # TanStack Table wrapper
├── lib/
│   ├── actions/          # Server Actions
│   ├── supabase/         # Supabase clients
│   ├── utils/            # Utility functions
│   ├── validations.ts    # Zod schemas
│   └── constants.ts      # App constants
├── types/
│   └── database.ts       # TypeScript types
└── middleware.ts         # Auth middleware
```

## Database Schema

The database follows Third Normal Form (3NF) with the following core tables:
- `roles`, `departments`, `employees`, `users`
- `categories`, `products`, `warehouses`, `inventory`
- `suppliers`, `supplier_products`
- `customers`
- `purchase_orders`, `po_items`
- `sales_orders`, `so_items`
- `invoices`
- `stock_transactions`
- `activity_log`

### Database Triggers
- Auto-increment inventory on PO received
- Auto-decrement inventory on SO items created
- Auto-calculate order totals
- Audit logging for all INSERT/UPDATE/DELETE operations

## Deployment

### Vercel (Frontend)
1. Connect your GitHub repository to Vercel
2. Add environment variables
3. Deploy

### Supabase (Backend)
1. Create production project
2. Run migrations
3. Enable RLS
4. Update environment variables in Vercel

## License

MIT
