'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Eye, Download, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/data-table';
import { updateInvoiceStatus } from '@/lib/actions/invoices';
import { formatCurrency, formatDate } from '@/lib/utils/helpers';
import { INVOICE_STATUS } from '@/lib/constants';
import type { Invoice, Role, InvoiceStatus } from '@/types';

interface InvoicesClientProps {
  invoices: Invoice[];
  userRole: Role;
}

function generatePDF(invoice: Invoice) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(24);
  doc.setTextColor(59, 130, 246);
  doc.text('EnterpriX ERP', 20, 25);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Enterprise Resource Planning System', 20, 32);
  
  // Invoice Info
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text('INVOICE', 150, 25);
  
  doc.setFontSize(10);
  doc.text(`Invoice #: ${invoice.invoice_number}`, 150, 35);
  doc.text(`Date: ${formatDate(invoice.issue_date)}`, 150, 42);
  doc.text(`Due Date: ${formatDate(invoice.due_date)}`, 150, 49);
  
  // Customer Info
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Bill To:', 20, 60);
  doc.setFontSize(10);
  doc.text(invoice.customer?.name || 'N/A', 20, 68);
  if (invoice.customer?.company_name) {
    doc.text(invoice.customer.company_name, 20, 75);
  }
  
  // Table Header
  const tableTop = 95;
  doc.setFillColor(59, 130, 246);
  doc.rect(20, tableTop, 170, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('Description', 25, tableTop + 7);
  doc.text('Qty', 100, tableTop + 7);
  doc.text('Price', 125, tableTop + 7);
  doc.text('Total', 160, tableTop + 7);
  
  // Table Body
  doc.setTextColor(0, 0, 0);
  let yPos = tableTop + 18;
  
  const items = invoice.sales_order?.items || [];
  items.forEach((item) => {
    doc.text(item.product?.name || 'Item', 25, yPos);
    doc.text(item.quantity.toString(), 100, yPos);
    doc.text(formatCurrency(item.unit_price), 125, yPos);
    doc.text(formatCurrency(item.line_total), 160, yPos);
    yPos += 10;
  });
  
  // Totals
  yPos += 10;
  doc.line(20, yPos, 190, yPos);
  yPos += 10;
  
  doc.text('Subtotal:', 130, yPos);
  doc.text(formatCurrency(invoice.subtotal), 160, yPos);
  yPos += 8;
  
  doc.text('Tax:', 130, yPos);
  doc.text(formatCurrency(invoice.tax_amount), 160, yPos);
  yPos += 8;
  
  if (invoice.discount_amount > 0) {
    doc.text('Discount:', 130, yPos);
    doc.text(`-${formatCurrency(invoice.discount_amount)}`, 160, yPos);
    yPos += 8;
  }
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', 130, yPos + 5);
  doc.text(formatCurrency(invoice.total_amount), 160, yPos + 5);
  
  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Thank you for your business!', 105, 280, { align: 'center' });
  
  doc.save(`Invoice-${invoice.invoice_number}.pdf`);
}

export function InvoicesClient({ invoices, userRole }: InvoicesClientProps) {
  const router = useRouter();
  const canEdit = userRole === 'admin' || userRole === 'manager';

  const handleStatusChange = async (id: string, status: InvoiceStatus, amount?: number) => {
    try {
      const result = await updateInvoiceStatus(id, status, amount);
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

  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: 'invoice_number',
      header: 'Invoice #',
      cell: ({ row }) => (
        <Link href={`/invoices/${row.original.id}`} className="font-medium text-primary hover:underline">
          {row.getValue('invoice_number')}
        </Link>
      ),
    },
    {
      accessorKey: 'customer',
      header: 'Customer',
      cell: ({ row }) => row.original.customer?.name || 'N/A',
    },
    {
      accessorKey: 'issue_date',
      header: 'Issue Date',
      cell: ({ row }) => formatDate(row.getValue('issue_date')),
    },
    {
      accessorKey: 'due_date',
      header: 'Due Date',
      cell: ({ row }) => formatDate(row.getValue('due_date')),
    },
    {
      accessorKey: 'total_amount',
      header: 'Amount',
      cell: ({ row }) => formatCurrency(row.getValue('total_amount')),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as keyof typeof INVOICE_STATUS;
        const config = INVOICE_STATUS[status];
        return <Badge className={config.color}>{config.label}</Badge>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Link href={`/invoices/${invoice.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => generatePDF(invoice)}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </DropdownMenuItem>
              {canEdit && invoice.status === 'unpaid' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, 'paid', invoice.total_amount)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Paid
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, 'overdue')}>
                    <Clock className="mr-2 h-4 w-4" />
                    Mark as Overdue
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
        <p className="text-muted-foreground">Manage customer invoices</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={invoices} searchKey="invoice_number" searchPlaceholder="Search invoices..." />
        </CardContent>
      </Card>
    </div>
  );
}
