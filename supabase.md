# EnterpriX ERP - Supabase Database Setup Guide

This document contains all the SQL statements needed to set up the complete database schema for EnterpriX ERP in Supabase.

## Table of Contents

1. [Enable Extensions](#enable-extensions)
2. [Core Tables](#core-tables)
3. [Inventory Tables](#inventory-tables)
4. [Supplier Tables](#supplier-tables)
5. [Purchase Order Tables](#purchase-order-tables)
6. [Customer & Sales Tables](#customer--sales-tables)
7. [Invoice Tables](#invoice-tables)
8. [Transaction & Audit Tables](#transaction--audit-tables)
9. [Views for Reporting](#views-for-reporting)
10. [Functions & Triggers](#functions--triggers)
11. [Row Level Security (RLS)](#row-level-security-rls)
12. [Seed Data](#seed-data)

---

## Enable Extensions

```sql
-- Enable UUID extension (usually enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for additional security functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

---

## Core Tables

### Departments Table

```sql
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_departments_name ON departments(name);
```

### Roles Table

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE CHECK (name IN ('admin', 'manager', 'viewer')),
  description TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Employees Table

```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  position VARCHAR(100),
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  hire_date DATE,
  salary DECIMAL(12, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_active ON employees(is_active);
```

### Users Table (linked to Supabase Auth)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'viewer')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_employee ON users(employee_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
```

---

## Inventory Tables

### Categories Table

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_name ON categories(name);
CREATE INDEX idx_categories_parent ON categories(parent_id);
```

### Warehouses Table

```sql
CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  location TEXT,
  capacity INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_warehouses_name ON warehouses(name);
CREATE INDEX idx_warehouses_active ON warehouses(is_active);
```

### Products Table

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  cost_price DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  reorder_level INTEGER NOT NULL DEFAULT 10 CHECK (reorder_level >= 0),
  unit_of_measure VARCHAR(50) NOT NULL DEFAULT 'unit',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);

-- Full text search index
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
```

### Inventory Table (Product-Warehouse Junction)

```sql
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_quantity INTEGER NOT NULL DEFAULT 0,
  max_quantity INTEGER,
  last_restocked TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, warehouse_id)
);

CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_warehouse ON inventory(warehouse_id);
CREATE INDEX idx_inventory_quantity ON inventory(quantity);
```

---

## Supplier Tables

### Suppliers Table

```sql
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  contact_person VARCHAR(200),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  payment_terms VARCHAR(100),
  rating DECIMAL(2, 1) CHECK (rating >= 0 AND rating <= 5),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_email ON suppliers(email);
CREATE INDEX idx_suppliers_active ON suppliers(is_active);
```

### Supplier Products Table (Junction)

```sql
CREATE TABLE supplier_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  supplier_sku VARCHAR(50),
  unit_cost DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  lead_time_days INTEGER,
  min_order_qty INTEGER NOT NULL DEFAULT 1,
  is_preferred BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(supplier_id, product_id)
);

CREATE INDEX idx_supplier_products_supplier ON supplier_products(supplier_id);
CREATE INDEX idx_supplier_products_product ON supplier_products(product_id);
CREATE INDEX idx_supplier_products_preferred ON supplier_products(is_preferred);
```

---

## Purchase Order Tables

### Purchase Orders Table

```sql
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) NOT NULL UNIQUE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'ordered', 'received', 'cancelled')),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_date DATE,
  received_date DATE,
  subtotal DECIMAL(14, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchase_orders_number ON purchase_orders(order_number);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_warehouse ON purchase_orders(warehouse_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_date ON purchase_orders(order_date);
CREATE INDEX idx_purchase_orders_created_by ON purchase_orders(created_by);
```

### Purchase Order Items Table

```sql
CREATE TABLE po_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_cost DECIMAL(12, 2) NOT NULL CHECK (unit_cost >= 0),
  received_quantity INTEGER NOT NULL DEFAULT 0 CHECK (received_quantity >= 0),
  line_total DECIMAL(14, 2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_po_items_order ON po_items(purchase_order_id);
CREATE INDEX idx_po_items_product ON po_items(product_id);
```

---

## Customer & Sales Tables

### Customers Table

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  company_name VARCHAR(200),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  tax_id VARCHAR(50),
  credit_limit DECIMAL(14, 2),
  payment_terms VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_company ON customers(company_name);
CREATE INDEX idx_customers_active ON customers(is_active);

-- Full text search
CREATE INDEX idx_customers_search ON customers USING gin(to_tsvector('english', name || ' ' || COALESCE(company_name, '')));
```

### Sales Orders Table

```sql
CREATE TABLE sales_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  shipping_date DATE,
  delivery_date DATE,
  subtotal DECIMAL(14, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
  shipping_address TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sales_orders_number ON sales_orders(order_number);
CREATE INDEX idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX idx_sales_orders_warehouse ON sales_orders(warehouse_id);
CREATE INDEX idx_sales_orders_status ON sales_orders(status);
CREATE INDEX idx_sales_orders_date ON sales_orders(order_date);
CREATE INDEX idx_sales_orders_created_by ON sales_orders(created_by);
```

### Sales Order Items Table

```sql
CREATE TABLE so_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(12, 2) NOT NULL CHECK (unit_price >= 0),
  discount_percent DECIMAL(5, 2) NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  line_total DECIMAL(14, 2) GENERATED ALWAYS AS (quantity * unit_price * (1 - discount_percent / 100)) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_so_items_order ON so_items(sales_order_id);
CREATE INDEX idx_so_items_product ON so_items(product_id);
```

---

## Invoice Tables

### Invoices Table

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'overdue', 'cancelled')),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  paid_date DATE,
  subtotal DECIMAL(14, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(14, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_sales_order ON invoices(sales_order_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
```

---

## Transaction & Audit Tables

### Stock Transactions Table

```sql
CREATE TABLE stock_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('purchase_in', 'sale_out', 'adjustment', 'transfer')),
  quantity INTEGER NOT NULL,
  reference_type VARCHAR(50),
  reference_id UUID,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stock_transactions_product ON stock_transactions(product_id);
CREATE INDEX idx_stock_transactions_warehouse ON stock_transactions(warehouse_id);
CREATE INDEX idx_stock_transactions_type ON stock_transactions(transaction_type);
CREATE INDEX idx_stock_transactions_date ON stock_transactions(created_at);
CREATE INDEX idx_stock_transactions_reference ON stock_transactions(reference_type, reference_id);
```

### Activity Log Table

```sql
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  table_name VARCHAR(50) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_log_user ON activity_log(user_id);
CREATE INDEX idx_activity_log_table ON activity_log(table_name);
CREATE INDEX idx_activity_log_record ON activity_log(record_id);
CREATE INDEX idx_activity_log_action ON activity_log(action);
CREATE INDEX idx_activity_log_date ON activity_log(created_at DESC);
```

---

## Views for Reporting

### Monthly Revenue View

```sql
CREATE OR REPLACE VIEW v_monthly_revenue AS
SELECT 
  DATE_TRUNC('month', order_date)::DATE AS month,
  SUM(total_amount) AS revenue,
  COUNT(*) AS order_count
FROM sales_orders
WHERE status NOT IN ('cancelled')
GROUP BY DATE_TRUNC('month', order_date)
ORDER BY month DESC;
```

### Low Stock Alerts View

```sql
CREATE OR REPLACE VIEW v_low_stock_alerts AS
SELECT 
  p.id AS product_id,
  p.name AS product_name,
  p.sku,
  COALESCE(SUM(i.quantity), 0) AS current_stock,
  p.reorder_level,
  c.name AS category_name
FROM products p
LEFT JOIN inventory i ON p.id = i.product_id
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_active = true
GROUP BY p.id, p.name, p.sku, p.reorder_level, c.name
HAVING COALESCE(SUM(i.quantity), 0) <= p.reorder_level
ORDER BY current_stock ASC;
```

### Supplier Performance View

```sql
CREATE OR REPLACE VIEW v_supplier_performance AS
SELECT 
  s.id AS supplier_id,
  s.name AS supplier_name,
  COUNT(DISTINCT po.id) AS total_orders,
  SUM(po.total_amount) AS total_spent,
  AVG(CASE WHEN po.received_date IS NOT NULL AND po.expected_date IS NOT NULL 
      THEN CASE WHEN po.received_date <= po.expected_date THEN 100 ELSE 0 END END) AS on_time_delivery_rate,
  AVG(CASE WHEN po.received_date IS NOT NULL AND po.order_date IS NOT NULL 
      THEN EXTRACT(DAY FROM po.received_date - po.order_date) END) AS avg_lead_time
FROM suppliers s
LEFT JOIN purchase_orders po ON s.id = po.supplier_id AND po.status = 'received'
GROUP BY s.id, s.name
ORDER BY total_spent DESC NULLS LAST;
```

### Product Rankings View

```sql
CREATE OR REPLACE VIEW v_product_rankings AS
SELECT 
  p.id AS product_id,
  p.name AS product_name,
  COALESCE(SUM(soi.quantity), 0) AS total_sold,
  COALESCE(SUM(soi.line_total), 0) AS total_revenue
FROM products p
LEFT JOIN so_items soi ON p.id = soi.product_id
LEFT JOIN sales_orders so ON soi.sales_order_id = so.id AND so.status NOT IN ('cancelled')
GROUP BY p.id, p.name
ORDER BY total_revenue DESC;
```

### Inventory by Category View

```sql
CREATE OR REPLACE VIEW v_inventory_by_category AS
SELECT 
  c.id AS category_id,
  c.name AS category_name,
  COUNT(DISTINCT p.id) AS product_count,
  COALESCE(SUM(i.quantity * p.cost_price), 0) AS total_value
FROM categories c
LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
LEFT JOIN inventory i ON p.id = i.product_id
GROUP BY c.id, c.name
ORDER BY total_value DESC;
```

---

## Functions & Triggers

### Update Timestamp Function

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER tr_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_warehouses_updated_at BEFORE UPDATE ON warehouses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_supplier_products_updated_at BEFORE UPDATE ON supplier_products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_sales_orders_updated_at BEFORE UPDATE ON sales_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Purchase Order Totals Calculation

```sql
CREATE OR REPLACE FUNCTION calculate_po_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE purchase_orders
  SET 
    subtotal = (SELECT COALESCE(SUM(quantity * unit_cost), 0) FROM po_items WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id)),
    tax_amount = (SELECT COALESCE(SUM(quantity * unit_cost), 0) * 0.1 FROM po_items WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id)),
    total_amount = (SELECT COALESCE(SUM(quantity * unit_cost), 0) * 1.1 FROM po_items WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id))
  WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_po_items_calculate_totals
AFTER INSERT OR UPDATE OR DELETE ON po_items
FOR EACH ROW EXECUTE FUNCTION calculate_po_totals();
```

### Sales Order Totals Calculation

```sql
CREATE OR REPLACE FUNCTION calculate_so_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_subtotal DECIMAL(14, 2);
  v_discount DECIMAL(14, 2);
BEGIN
  SELECT 
    COALESCE(SUM(quantity * unit_price * (1 - discount_percent / 100)), 0)
  INTO v_subtotal
  FROM so_items 
  WHERE sales_order_id = COALESCE(NEW.sales_order_id, OLD.sales_order_id);
  
  SELECT discount_amount INTO v_discount
  FROM sales_orders 
  WHERE id = COALESCE(NEW.sales_order_id, OLD.sales_order_id);
  
  UPDATE sales_orders
  SET 
    subtotal = v_subtotal,
    tax_amount = v_subtotal * 0.1,
    total_amount = v_subtotal * 1.1 - COALESCE(v_discount, 0)
  WHERE id = COALESCE(NEW.sales_order_id, OLD.sales_order_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_so_items_calculate_totals
AFTER INSERT OR UPDATE OR DELETE ON so_items
FOR EACH ROW EXECUTE FUNCTION calculate_so_totals();
```

### Purchase Order Received - Update Inventory

```sql
CREATE OR REPLACE FUNCTION handle_po_received()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when status changes to 'received'
  IF NEW.status = 'received' AND OLD.status != 'received' THEN
    -- Update inventory for each item
    INSERT INTO inventory (product_id, warehouse_id, quantity)
    SELECT poi.product_id, NEW.warehouse_id, poi.quantity
    FROM po_items poi
    WHERE poi.purchase_order_id = NEW.id
    ON CONFLICT (product_id, warehouse_id)
    DO UPDATE SET 
      quantity = inventory.quantity + EXCLUDED.quantity,
      last_restocked = NOW(),
      updated_at = NOW();
    
    -- Log stock transactions
    INSERT INTO stock_transactions (product_id, warehouse_id, transaction_type, quantity, reference_type, reference_id)
    SELECT poi.product_id, NEW.warehouse_id, 'purchase_in', poi.quantity, 'purchase_order', NEW.id
    FROM po_items poi
    WHERE poi.purchase_order_id = NEW.id;
    
    -- Update received quantities
    UPDATE po_items SET received_quantity = quantity WHERE purchase_order_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_purchase_order_received
AFTER UPDATE ON purchase_orders
FOR EACH ROW EXECUTE FUNCTION handle_po_received();
```

### Sales Order Item - Deduct Inventory

```sql
CREATE OR REPLACE FUNCTION handle_so_item_created()
RETURNS TRIGGER AS $$
DECLARE
  v_warehouse_id UUID;
BEGIN
  -- Get warehouse from sales order
  SELECT warehouse_id INTO v_warehouse_id FROM sales_orders WHERE id = NEW.sales_order_id;
  
  -- Deduct from inventory
  UPDATE inventory
  SET quantity = quantity - NEW.quantity, updated_at = NOW()
  WHERE product_id = NEW.product_id AND warehouse_id = v_warehouse_id;
  
  -- Log stock transaction
  INSERT INTO stock_transactions (product_id, warehouse_id, transaction_type, quantity, reference_type, reference_id)
  VALUES (NEW.product_id, v_warehouse_id, 'sale_out', -NEW.quantity, 'sales_order', NEW.sales_order_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_so_item_created
AFTER INSERT ON so_items
FOR EACH ROW EXECUTE FUNCTION handle_so_item_created();
```

### Activity Log Trigger Function

```sql
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Try to get current user from auth.uid()
  BEGIN
    v_user_id := (SELECT id FROM users WHERE auth_id = auth.uid());
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_log (user_id, table_name, record_id, action, new_values)
    VALUES (v_user_id, TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO activity_log (user_id, table_name, record_id, action, old_values, new_values)
    VALUES (v_user_id, TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO activity_log (user_id, table_name, record_id, action, old_values)
    VALUES (v_user_id, TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to key tables
CREATE TRIGGER tr_products_activity AFTER INSERT OR UPDATE OR DELETE ON products FOR EACH ROW EXECUTE FUNCTION log_activity();
CREATE TRIGGER tr_suppliers_activity AFTER INSERT OR UPDATE OR DELETE ON suppliers FOR EACH ROW EXECUTE FUNCTION log_activity();
CREATE TRIGGER tr_customers_activity AFTER INSERT OR UPDATE OR DELETE ON customers FOR EACH ROW EXECUTE FUNCTION log_activity();
CREATE TRIGGER tr_purchase_orders_activity AFTER INSERT OR UPDATE OR DELETE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION log_activity();
CREATE TRIGGER tr_sales_orders_activity AFTER INSERT OR UPDATE OR DELETE ON sales_orders FOR EACH ROW EXECUTE FUNCTION log_activity();
CREATE TRIGGER tr_invoices_activity AFTER INSERT OR UPDATE OR DELETE ON invoices FOR EACH ROW EXECUTE FUNCTION log_activity();
CREATE TRIGGER tr_inventory_activity AFTER INSERT OR UPDATE OR DELETE ON inventory FOR EACH ROW EXECUTE FUNCTION log_activity();
CREATE TRIGGER tr_users_activity AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION log_activity();
```

### Auto-create Invoice on Shipped Status

```sql
CREATE OR REPLACE FUNCTION auto_create_invoice()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_exists BOOLEAN;
BEGIN
  -- Only process when status changes to 'shipped'
  IF NEW.status = 'shipped' AND OLD.status != 'shipped' THEN
    -- Check if invoice already exists
    SELECT EXISTS(SELECT 1 FROM invoices WHERE sales_order_id = NEW.id) INTO v_invoice_exists;
    
    IF NOT v_invoice_exists THEN
      INSERT INTO invoices (
        invoice_number,
        sales_order_id,
        customer_id,
        status,
        issue_date,
        due_date,
        subtotal,
        tax_amount,
        discount_amount,
        total_amount
      )
      VALUES (
        'INV-' || UPPER(encode(gen_random_bytes(4), 'hex')),
        NEW.id,
        NEW.customer_id,
        'unpaid',
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days',
        NEW.subtotal,
        NEW.tax_amount,
        NEW.discount_amount,
        NEW.total_amount
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_sales_order_shipped
AFTER UPDATE ON sales_orders
FOR EACH ROW EXECUTE FUNCTION auto_create_invoice();
```

---

## Row Level Security (RLS)

### Enable RLS on all tables

```sql
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE so_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
```

### Helper Function to Get User Role

```sql
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM users WHERE auth_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### RLS Policies

```sql
-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- All authenticated users can read users
CREATE POLICY "users_select_policy" ON users
  FOR SELECT TO authenticated
  USING (true);

-- Only admins can insert/update/delete users
CREATE POLICY "users_insert_policy" ON users
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "users_update_policy" ON users
  FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "users_delete_policy" ON users
  FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================================
-- EMPLOYEES TABLE POLICIES
-- ============================================================================

CREATE POLICY "employees_select_policy" ON employees
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "employees_insert_policy" ON employees
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "employees_update_policy" ON employees
  FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "employees_delete_policy" ON employees
  FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================================
-- DEPARTMENTS TABLE POLICIES
-- ============================================================================

CREATE POLICY "departments_select_policy" ON departments
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "departments_insert_policy" ON departments
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "departments_update_policy" ON departments
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "departments_delete_policy" ON departments
  FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================================
-- PRODUCTS TABLE POLICIES
-- ============================================================================

CREATE POLICY "products_select_policy" ON products
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "products_insert_policy" ON products
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "products_update_policy" ON products
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "products_delete_policy" ON products
  FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================================
-- CATEGORIES TABLE POLICIES
-- ============================================================================

CREATE POLICY "categories_select_policy" ON categories
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "categories_insert_policy" ON categories
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "categories_update_policy" ON categories
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "categories_delete_policy" ON categories
  FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================================
-- WAREHOUSES TABLE POLICIES
-- ============================================================================

CREATE POLICY "warehouses_select_policy" ON warehouses
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "warehouses_insert_policy" ON warehouses
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "warehouses_update_policy" ON warehouses
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "warehouses_delete_policy" ON warehouses
  FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================================
-- INVENTORY TABLE POLICIES
-- ============================================================================

CREATE POLICY "inventory_select_policy" ON inventory
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "inventory_insert_policy" ON inventory
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "inventory_update_policy" ON inventory
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "inventory_delete_policy" ON inventory
  FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================================
-- SUPPLIERS TABLE POLICIES
-- ============================================================================

CREATE POLICY "suppliers_select_policy" ON suppliers
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "suppliers_insert_policy" ON suppliers
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "suppliers_update_policy" ON suppliers
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "suppliers_delete_policy" ON suppliers
  FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================================
-- SUPPLIER_PRODUCTS TABLE POLICIES
-- ============================================================================

CREATE POLICY "supplier_products_select_policy" ON supplier_products
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "supplier_products_insert_policy" ON supplier_products
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "supplier_products_update_policy" ON supplier_products
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "supplier_products_delete_policy" ON supplier_products
  FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================================
-- PURCHASE_ORDERS TABLE POLICIES
-- ============================================================================

CREATE POLICY "purchase_orders_select_policy" ON purchase_orders
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "purchase_orders_insert_policy" ON purchase_orders
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "purchase_orders_update_policy" ON purchase_orders
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "purchase_orders_delete_policy" ON purchase_orders
  FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================================
-- PO_ITEMS TABLE POLICIES
-- ============================================================================

CREATE POLICY "po_items_select_policy" ON po_items
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "po_items_insert_policy" ON po_items
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "po_items_update_policy" ON po_items
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "po_items_delete_policy" ON po_items
  FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================================
-- CUSTOMERS TABLE POLICIES
-- ============================================================================

CREATE POLICY "customers_select_policy" ON customers
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "customers_insert_policy" ON customers
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "customers_update_policy" ON customers
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "customers_delete_policy" ON customers
  FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================================
-- SALES_ORDERS TABLE POLICIES
-- ============================================================================

CREATE POLICY "sales_orders_select_policy" ON sales_orders
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "sales_orders_insert_policy" ON sales_orders
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "sales_orders_update_policy" ON sales_orders
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "sales_orders_delete_policy" ON sales_orders
  FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================================
-- SO_ITEMS TABLE POLICIES
-- ============================================================================

CREATE POLICY "so_items_select_policy" ON so_items
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "so_items_insert_policy" ON so_items
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "so_items_update_policy" ON so_items
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "so_items_delete_policy" ON so_items
  FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================================
-- INVOICES TABLE POLICIES
-- ============================================================================

CREATE POLICY "invoices_select_policy" ON invoices
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "invoices_insert_policy" ON invoices
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "invoices_update_policy" ON invoices
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "invoices_delete_policy" ON invoices
  FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================================
-- STOCK_TRANSACTIONS TABLE POLICIES
-- ============================================================================

CREATE POLICY "stock_transactions_select_policy" ON stock_transactions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "stock_transactions_insert_policy" ON stock_transactions
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'manager'));

-- No update/delete for transactions (audit trail)

-- ============================================================================
-- ACTIVITY_LOG TABLE POLICIES
-- ============================================================================

CREATE POLICY "activity_log_select_policy" ON activity_log
  FOR SELECT TO authenticated
  USING (get_user_role() = 'admin');

-- Insert via trigger only (SECURITY DEFINER)
CREATE POLICY "activity_log_insert_policy" ON activity_log
  FOR INSERT TO authenticated
  WITH CHECK (true);
```

---

## Seed Data

### Initial Roles

```sql
INSERT INTO roles (name, description, permissions) VALUES
  ('admin', 'Full system access', '{"all": true}'),
  ('manager', 'Can manage operations but not system settings', '{"read": true, "create": true, "update": true, "delete": false}'),
  ('viewer', 'Read-only access to dashboards and reports', '{"read": true}');
```

### Sample Departments

```sql
INSERT INTO departments (name, description) VALUES
  ('Sales', 'Sales and business development'),
  ('Warehouse', 'Inventory and logistics'),
  ('Finance', 'Accounting and financial management'),
  ('IT', 'Information technology and support'),
  ('HR', 'Human resources and recruitment');
```

### Sample Categories

```sql
INSERT INTO categories (name, description) VALUES
  ('Electronics', 'Electronic devices and accessories'),
  ('Office Supplies', 'Office equipment and stationery'),
  ('Furniture', 'Office and warehouse furniture'),
  ('Raw Materials', 'Manufacturing raw materials'),
  ('Packaging', 'Packaging materials and supplies');
```

### Sample Warehouses

```sql
INSERT INTO warehouses (name, location, capacity, is_active) VALUES
  ('Main Warehouse', 'New York, NY', 10000, true),
  ('West Coast DC', 'Los Angeles, CA', 8000, true),
  ('Central Hub', 'Chicago, IL', 6000, true);
```

### Create Admin User (after creating in Auth)

```sql
-- After creating a user in Supabase Auth, link them:
-- INSERT INTO users (auth_id, role, is_active)
-- VALUES ('<auth_user_id>', 'admin', true);
```

### Sample Products

```sql
INSERT INTO products (sku, name, description, category_id, unit_price, cost_price, reorder_level, unit_of_measure) VALUES
  ('ELEC-001', 'Laptop Pro 15', 'High-performance laptop with 15-inch display', (SELECT id FROM categories WHERE name = 'Electronics'), 1299.99, 899.99, 10, 'pcs'),
  ('ELEC-002', 'Wireless Mouse', 'Ergonomic wireless mouse with USB receiver', (SELECT id FROM categories WHERE name = 'Electronics'), 29.99, 15.99, 50, 'pcs'),
  ('ELEC-003', 'USB-C Hub', '7-in-1 USB-C hub with HDMI, USB 3.0, and SD card', (SELECT id FROM categories WHERE name = 'Electronics'), 49.99, 25.99, 30, 'pcs'),
  ('OFF-001', 'A4 Paper Ream', '500 sheets of premium white A4 paper', (SELECT id FROM categories WHERE name = 'Office Supplies'), 9.99, 4.99, 100, 'pack'),
  ('OFF-002', 'Ballpoint Pens', 'Pack of 12 blue ballpoint pens', (SELECT id FROM categories WHERE name = 'Office Supplies'), 5.99, 2.49, 200, 'pack'),
  ('FURN-001', 'Office Chair', 'Ergonomic office chair with lumbar support', (SELECT id FROM categories WHERE name = 'Furniture'), 299.99, 149.99, 5, 'pcs'),
  ('FURN-002', 'Standing Desk', 'Electric height-adjustable standing desk', (SELECT id FROM categories WHERE name = 'Furniture'), 599.99, 349.99, 3, 'pcs');
```

### Sample Suppliers

```sql
INSERT INTO suppliers (name, contact_person, email, phone, address, city, country, payment_terms, rating, is_active) VALUES
  ('Tech Supplies Inc', 'John Smith', 'john@techsupplies.com', '+1-555-0101', '123 Tech Street', 'San Francisco', 'USA', 'net_30', 4.5, true),
  ('Office World', 'Sarah Johnson', 'sarah@officeworld.com', '+1-555-0102', '456 Office Blvd', 'Chicago', 'USA', 'net_15', 4.2, true),
  ('Furniture Direct', 'Mike Brown', 'mike@furnituredirect.com', '+1-555-0103', '789 Furniture Ave', 'Los Angeles', 'USA', 'net_45', 4.8, true);
```

### Sample Customers

```sql
INSERT INTO customers (name, company_name, email, phone, address, city, country, credit_limit, payment_terms, is_active) VALUES
  ('Alice Williams', 'Williams Corp', 'alice@williamscorp.com', '+1-555-1001', '100 Business Way', 'New York', 'USA', 50000, 'net_30', true),
  ('Bob Martinez', 'Martinez Industries', 'bob@martinezind.com', '+1-555-1002', '200 Industry Road', 'Houston', 'USA', 75000, 'net_30', true),
  ('Carol Davis', 'Davis Enterprises', 'carol@davisent.com', '+1-555-1003', '300 Enterprise Lane', 'Seattle', 'USA', 100000, 'net_45', true);
```

### Sample Inventory

```sql
INSERT INTO inventory (product_id, warehouse_id, quantity, min_quantity, max_quantity)
SELECT p.id, w.id, 100, 10, 500
FROM products p
CROSS JOIN warehouses w
WHERE w.name = 'Main Warehouse';
```

---

## Quick Setup Script

Run all the above SQL in order in the Supabase SQL Editor:

1. Enable Extensions
2. Create all tables
3. Create indexes
4. Create views
5. Create functions and triggers
6. Enable RLS and create policies
7. Insert seed data
8. Create your admin user via Supabase Auth, then link in users table

## Environment Variables

Make sure to set these in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Demo credentials for login page
NEXT_PUBLIC_DEMO_EMAIL=admin@enterprix.com
NEXT_PUBLIC_DEMO_PASSWORD=password123
```

---

## Creating Demo User in Supabase

1. Go to your Supabase Dashboard → Authentication → Users
2. Click "Add User" → "Create New User"
3. Enter:
   - Email: `admin@enterprix.com` (or your preferred email)
   - Password: `password123` (or your preferred password)
   - Check "Auto Confirm User"
4. Copy the user's UUID from the user list
5. Run the following SQL with the copied UUID:

```sql
INSERT INTO users (auth_id, role, is_active)
VALUES ('paste-user-uuid-here', 'admin', true);
```

6. Update your `.env.local` with the credentials:

```env
NEXT_PUBLIC_DEMO_EMAIL=admin@enterprix.com
NEXT_PUBLIC_DEMO_PASSWORD=password123
```

---

## Notes

1. **Order of Execution**: Tables must be created before triggers that reference them
2. **Foreign Keys**: Ensure referenced tables exist before creating foreign keys
3. **RLS**: Test policies thoroughly to ensure proper access control
4. **Triggers**: The activity log trigger uses `SECURITY DEFINER` to bypass RLS
5. **Generated Columns**: `line_total` in `po_items` and `so_items` are automatically calculated
6. **Demo Credentials**: Store in `.env.local` and they will appear on the login page
