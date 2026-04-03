'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, Loader2, Users, Package, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { createSalesOrder } from '@/lib/actions/sales-orders';
import { formatCurrency } from '@/lib/utils/helpers';
import type { Customer, Product, Warehouse } from '@/types';

interface SalesOrderFormClientProps {
  customers: Customer[];
  products: Product[];
  warehouses: Warehouse[];
}

interface OrderItem {
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  available_stock: number;
}

const STEPS = [
  { id: 1, title: 'Select Customer', icon: Users },
  { id: 2, title: 'Add Items', icon: Package },
  { id: 3, title: 'Review & Submit', icon: ClipboardList },
];

export function SalesOrderFormClient({ customers, products, warehouses }: SalesOrderFormClientProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [items, setItems] = useState<OrderItem[]>([]);

  // Item Selection State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemPrice, setItemPrice] = useState(0);
  const [itemDiscount, setItemDiscount] = useState(0);

  const selectedCustomer = customers.find(c => c.id === customerId);
  const selectedWarehouse = warehouses.find(w => w.id === warehouseId);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => {
    const lineTotal = item.quantity * item.unit_price * (1 - item.discount_percent / 100);
    return sum + lineTotal;
  }, 0);
  const taxAmount = subtotal * 0.1;
  const totalAmount = subtotal + taxAmount - orderDiscount;

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedProductId(productId);
      setItemPrice(product.unit_price);
      setItemDiscount(0);
    }
  };

  const addItem = () => {
    const product = products.find(p => p.id === selectedProductId);
    if (!product || itemQuantity <= 0 || itemPrice <= 0) {
      toast.error('Please select a product and enter valid quantity/price');
      return;
    }

    const existingIndex = items.findIndex(i => i.product_id === selectedProductId);
    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex].quantity += itemQuantity;
      setItems(newItems);
    } else {
      setItems([...items, {
        product_id: selectedProductId,
        product_name: product.name,
        sku: product.sku,
        quantity: itemQuantity,
        unit_price: itemPrice,
        discount_percent: itemDiscount,
        available_stock: product.total_stock || 0,
      }]);
    }

    setSelectedProductId('');
    setItemQuantity(1);
    setItemPrice(0);
    setItemDiscount(0);
    toast.success('Item added');
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) return;
    const newItems = [...items];
    newItems[index].quantity = quantity;
    setItems(newItems);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return customerId && warehouseId;
      case 2:
        return items.length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await createSalesOrder({
        customer_id: customerId,
        warehouse_id: warehouseId,
        shipping_address: shippingAddress || undefined,
        notes: notes || undefined,
        discount_amount: orderDiscount,
        items: items.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          discount_percent: i.discount_percent,
        })),
      });

      if (result.success) {
        toast.success('Sales order created successfully');
        router.push('/sales-orders');
      } else {
        toast.error(result.error || 'Failed to create order');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/sales-orders">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Sales Order</h1>
          <p className="text-muted-foreground">Create a new sales order for your customer</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                currentStep === step.id
                  ? 'bg-primary text-primary-foreground'
                  : currentStep > step.id
                  ? 'bg-green-500 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {currentStep > step.id ? (
                <Check className="h-5 w-5" />
              ) : (
                <step.icon className="h-5 w-5" />
              )}
              <span className="font-medium hidden sm:inline">{step.title}</span>
              <span className="font-medium sm:hidden">{step.id}</span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`w-12 h-1 mx-2 rounded ${currentStep > step.id ? 'bg-green-500' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {/* Step 1: Select Customer */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <CardTitle>Select Customer & Warehouse</CardTitle>
                <CardDescription className="mt-1">Choose the customer and the fulfillment warehouse</CardDescription>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer *</Label>
                  <Select value={customerId} onValueChange={(val) => val && setCustomerId(val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.filter(c => c.is_active).map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <div className="flex flex-col">
                            <span>{customer.name}</span>
                            {customer.company_name && (
                              <span className="text-xs text-muted-foreground">{customer.company_name}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warehouse">Fulfillment Warehouse *</Label>
                  <Select value={warehouseId} onValueChange={(val) => val && setWarehouseId(val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.filter(w => w.is_active).map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          <div className="flex flex-col">
                            <span>{warehouse.name}</span>
                            {warehouse.location && (
                              <span className="text-xs text-muted-foreground">{warehouse.location}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="shipping_address">Shipping Address</Label>
                  <Textarea
                    id="shipping_address"
                    placeholder="Enter shipping address..."
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any notes for this order..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              {selectedCustomer && (
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Selected Customer Details</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span>{selectedCustomer.name}</span>
                    </div>
                    {selectedCustomer.email && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span>{selectedCustomer.email}</span>
                      </div>
                    )}
                    {selectedCustomer.phone && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone:</span>
                        <span>{selectedCustomer.phone}</span>
                      </div>
                    )}
                    {selectedCustomer.credit_limit !== null && selectedCustomer.credit_limit !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Credit Limit:</span>
                        <span>{formatCurrency(selectedCustomer.credit_limit)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Add Items */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <CardTitle>Add Order Items</CardTitle>
                <CardDescription className="mt-1">Add products to your sales order</CardDescription>
              </div>

              {/* Add Item Form */}
              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="grid gap-4 md:grid-cols-5 items-end">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Product</Label>
                    <Select value={selectedProductId} onValueChange={(val) => val && handleProductSelect(val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.filter(p => p.is_active).map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            <div className="flex items-center gap-2">
                              <span>{product.name}</span>
                              <Badge variant="outline" className="text-xs">{product.sku}</Badge>
                              <span className="text-xs text-muted-foreground">Stock: {product.total_stock || 0}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min={1}
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit Price ($)</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Discount (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={itemDiscount}
                      onChange={(e) => setItemDiscount(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <Button className="mt-4" onClick={addItem} disabled={!selectedProductId}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>

              {/* Items Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No items added yet. Add products above.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, index) => {
                      const lineTotal = item.quantity * item.unit_price * (1 - item.discount_percent / 100);
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.product_name}</TableCell>
                          <TableCell className="text-muted-foreground">{item.sku}</TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                              className="w-20 text-right"
                            />
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                          <TableCell className="text-right">{item.discount_percent}%</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(lineTotal)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
                {items.length > 0 && (
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={5} className="text-right font-medium">Subtotal</TableCell>
                      <TableCell className="text-right">{formatCurrency(subtotal)}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>

              {/* Order Discount */}
              <div className="flex items-center gap-4 justify-end">
                <Label htmlFor="order_discount">Order Discount ($)</Label>
                <Input
                  id="order_discount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={orderDiscount}
                  onChange={(e) => setOrderDiscount(parseFloat(e.target.value) || 0)}
                  className="w-32"
                />
              </div>
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <CardTitle>Review Order</CardTitle>
                <CardDescription className="mt-1">Please review your sales order before submitting</CardDescription>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Order Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Order Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Customer</span>
                      <span className="font-medium">{selectedCustomer?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Warehouse</span>
                      <span>{selectedWarehouse?.name}</span>
                    </div>
                    {shippingAddress && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ship To</span>
                        <span className="text-right max-w-[200px]">{shippingAddress}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Items</span>
                      <span>{items.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Quantity</span>
                      <span>{items.reduce((sum, i) => sum + i.quantity, 0)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Totals */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Order Total</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax (10%)</span>
                      <span>{formatCurrency(taxAmount)}</span>
                    </div>
                    {orderDiscount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Discount</span>
                        <span className="text-red-600">-{formatCurrency(orderDiscount)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span className="text-primary">{formatCurrency(totalAmount)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Items Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Items ({items.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Disc</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => {
                        const lineTotal = item.quantity * item.unit_price * (1 - item.discount_percent / 100);
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.product_name}</TableCell>
                            <TableCell className="text-muted-foreground">{item.sku}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                            <TableCell className="text-right">{item.discount_percent}%</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(lineTotal)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            {currentStep < 3 ? (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceed()}
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Create Sales Order
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
