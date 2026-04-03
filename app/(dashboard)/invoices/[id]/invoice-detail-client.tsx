'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, CheckCircle, Clock, Building2, Mail, Phone, MapPin, Calendar, FileText } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { updateInvoiceStatus } from '@/lib/actions/invoices';
import { formatCurrency, formatDate } from '@/lib/utils/helpers';
import { INVOICE_STATUS } from '@/lib/constants';
import type { Invoice, Role, InvoiceStatus } from '@/types';

interface InvoiceDetailClientProps {
  invoice: Invoice;
  userRole: Role;
}

export function InvoiceDetailClient({ invoice, userRole }: InvoiceDetailClientProps) {
  const router = useRouter();
  const canEdit = userRole === 'admin' || userRole === 'manager';
  const statusConfig = INVOICE_STATUS[invoice.status as keyof typeof INVOICE_STATUS];

  const handleStatusChange = async (status: InvoiceStatus) => {
    try {
      const amount = status === 'paid' ? invoice.total_amount : undefined;
      const result = await updateInvoiceStatus(invoice.id, status, amount);
      if (result.success) {
        toast.success(`Invoice marked as ${status}`);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update status');
      }
    } catch {
      toast.error('An error occurred');
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header Background
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    // Company Name
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('EnterpriX', 20, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Enterprise Resource Planning System', 20, 33);
    
    // Invoice Badge
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(pageWidth - 70, 10, 55, 25, 3, 3, 'F');
    doc.setTextColor(59, 130, 246);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth - 55, 20);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.invoice_number, pageWidth - 55, 28);
    
    // Invoice Details Section
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    let yPos = 60;
    
    // Left Column - Bill To
    doc.setTextColor(59, 130, 246);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO', 20, yPos);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    yPos += 8;
    doc.setFontSize(12);
    doc.text(invoice.customer?.name || 'N/A', 20, yPos);
    yPos += 6;
    doc.setFontSize(10);
    if (invoice.customer?.company_name) {
      doc.setTextColor(100, 100, 100);
      doc.text(invoice.customer.company_name, 20, yPos);
      yPos += 5;
    }
    if (invoice.customer?.email) {
      doc.text(invoice.customer.email, 20, yPos);
      yPos += 5;
    }
    if (invoice.customer?.phone) {
      doc.text(invoice.customer.phone, 20, yPos);
      yPos += 5;
    }
    if (invoice.customer?.address) {
      doc.text(invoice.customer.address, 20, yPos);
    }
    
    // Right Column - Invoice Info
    yPos = 60;
    doc.setTextColor(59, 130, 246);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE DETAILS', 120, yPos);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    yPos += 8;
    doc.text(`Invoice Number:`, 120, yPos);
    doc.setTextColor(0, 0, 0);
    doc.text(invoice.invoice_number, 165, yPos);
    yPos += 6;
    doc.setTextColor(100, 100, 100);
    doc.text(`Issue Date:`, 120, yPos);
    doc.setTextColor(0, 0, 0);
    doc.text(formatDate(invoice.issue_date), 165, yPos);
    yPos += 6;
    doc.setTextColor(100, 100, 100);
    doc.text(`Due Date:`, 120, yPos);
    doc.setTextColor(0, 0, 0);
    doc.text(formatDate(invoice.due_date), 165, yPos);
    yPos += 6;
    doc.setTextColor(100, 100, 100);
    doc.text(`Status:`, 120, yPos);
    doc.setTextColor(invoice.status === 'paid' ? 16 : invoice.status === 'overdue' ? 239 : 245, 
                     invoice.status === 'paid' ? 185 : invoice.status === 'overdue' ? 68 : 158, 
                     invoice.status === 'paid' ? 129 : invoice.status === 'overdue' ? 68 : 11);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.status.toUpperCase(), 165, yPos);
    
    // Table Header
    yPos = 115;
    doc.setFillColor(248, 250, 252);
    doc.rect(15, yPos - 5, pageWidth - 30, 12, 'F');
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('ITEM', 20, yPos + 3);
    doc.text('QTY', 110, yPos + 3);
    doc.text('UNIT PRICE', 130, yPos + 3);
    doc.text('TOTAL', 170, yPos + 3);
    
    // Table Body
    yPos += 15;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const items = invoice.sales_order?.items || [];
    
    items.forEach((item, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(252, 252, 253);
        doc.rect(15, yPos - 4, pageWidth - 30, 10, 'F');
      }
      doc.text(item.product?.name || 'Item', 20, yPos + 2);
      doc.text(item.quantity.toString(), 110, yPos + 2);
      doc.text(formatCurrency(item.unit_price), 130, yPos + 2);
      doc.text(formatCurrency(item.line_total), 170, yPos + 2);
      yPos += 10;
    });
    
    // Totals Section
    yPos += 10;
    doc.setDrawColor(230, 230, 230);
    doc.line(120, yPos, pageWidth - 15, yPos);
    yPos += 10;
    
    doc.setTextColor(100, 100, 100);
    doc.text('Subtotal:', 130, yPos);
    doc.setTextColor(0, 0, 0);
    doc.text(formatCurrency(invoice.subtotal), 170, yPos);
    yPos += 8;
    
    doc.setTextColor(100, 100, 100);
    doc.text('Tax (10%):', 130, yPos);
    doc.setTextColor(0, 0, 0);
    doc.text(formatCurrency(invoice.tax_amount), 170, yPos);
    yPos += 8;
    
    if (invoice.discount_amount > 0) {
      doc.setTextColor(100, 100, 100);
      doc.text('Discount:', 130, yPos);
      doc.setTextColor(239, 68, 68);
      doc.text(`-${formatCurrency(invoice.discount_amount)}`, 170, yPos);
      yPos += 8;
    }
    
    // Total
    yPos += 5;
    doc.setFillColor(59, 130, 246);
    doc.rect(120, yPos - 5, pageWidth - 135, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', 130, yPos + 5);
    doc.text(formatCurrency(invoice.total_amount), 170, yPos + 5);
    
    // Payment Info
    yPos += 30;
    doc.setTextColor(59, 130, 246);
    doc.setFontSize(10);
    doc.text('PAYMENT INFORMATION', 20, yPos);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    yPos += 8;
    doc.text('Payment Terms: Net 30 Days', 20, yPos);
    yPos += 5;
    doc.text('Bank: EnterpriX Business Bank', 20, yPos);
    yPos += 5;
    doc.text('Account: XXXX-XXXX-XXXX-1234', 20, yPos);
    
    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 25;
    doc.setDrawColor(230, 230, 230);
    doc.line(20, footerY, pageWidth - 20, footerY);
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for your business!', pageWidth / 2, footerY + 10, { align: 'center' });
    doc.text('EnterpriX ERP - Enterprise Resource Planning System', pageWidth / 2, footerY + 16, { align: 'center' });
    
    // Save
    doc.save(`Invoice-${invoice.invoice_number}.pdf`);
    toast.success('Invoice PDF downloaded');
  };

  const items = invoice.sales_order?.items || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/invoices">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{invoice.invoice_number}</h1>
              <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
            </div>
            <p className="text-muted-foreground">Invoice Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={generatePDF}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          {canEdit && invoice.status === 'unpaid' && (
            <>
              <Button variant="outline" onClick={() => handleStatusChange('overdue')}>
                <Clock className="mr-2 h-4 w-4" />
                Mark Overdue
              </Button>
              <Button onClick={() => handleStatusChange('paid')}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Paid
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Invoice Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice Number</span>
              <span className="font-medium">{invoice.invoice_number}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Issue Date</span>
              <span>{formatDate(invoice.issue_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due Date</span>
              <span>{formatDate(invoice.due_date)}</span>
            </div>
            {invoice.paid_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid Date</span>
                <span>{formatDate(invoice.paid_date)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sales Order</span>
              <Link href={`/sales-orders/${invoice.sales_order_id}`} className="text-primary hover:underline">
                {invoice.sales_order?.order_number || 'View Order'}
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="font-medium text-lg">{invoice.customer?.name}</div>
            {invoice.customer?.company_name && (
              <div className="text-muted-foreground">{invoice.customer.company_name}</div>
            )}
            {invoice.customer?.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{invoice.customer.email}</span>
              </div>
            )}
            {invoice.customer?.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{invoice.customer.phone}</span>
              </div>
            )}
            {invoice.customer?.address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{invoice.customer.address}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Amount Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Payment Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax (10%)</span>
              <span>{formatCurrency(invoice.tax_amount)}</span>
            </div>
            {invoice.discount_amount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-red-600">-{formatCurrency(invoice.discount_amount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(invoice.total_amount)}</span>
            </div>
            {invoice.amount_paid > 0 && (
              <>
                <div className="flex justify-between text-green-600">
                  <span>Amount Paid</span>
                  <span>{formatCurrency(invoice.amount_paid)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Balance Due</span>
                  <span>{formatCurrency(invoice.total_amount - invoice.amount_paid)}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
          <CardDescription>Products and services included in this invoice</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No items found
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product?.name || 'N/A'}</TableCell>
                    <TableCell className="text-muted-foreground">{item.product?.sku || '-'}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                    <TableCell className="text-right">{item.discount_percent}%</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(item.line_total)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={5} className="text-right font-medium">Subtotal</TableCell>
                <TableCell className="text-right">{formatCurrency(invoice.subtotal)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={5} className="text-right font-medium">Tax (10%)</TableCell>
                <TableCell className="text-right">{formatCurrency(invoice.tax_amount)}</TableCell>
              </TableRow>
              {invoice.discount_amount > 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-right font-medium">Discount</TableCell>
                  <TableCell className="text-right text-red-600">-{formatCurrency(invoice.discount_amount)}</TableCell>
                </TableRow>
              )}
              <TableRow className="bg-muted/50">
                <TableCell colSpan={5} className="text-right text-lg font-bold">Total</TableCell>
                <TableCell className="text-right text-lg font-bold text-primary">{formatCurrency(invoice.total_amount)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      {/* Notes */}
      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
