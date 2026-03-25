'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Package, ShoppingCart, Users, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { globalSearch } from '@/lib/actions/search';
import { formatCurrency } from '@/lib/utils/helpers';
import type { SearchResult } from '@/types';

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults(null);
      return;
    }

    setIsLoading(true);
    try {
      const data = await globalSearch(searchQuery);
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = (type: string, id: string) => {
    setOpen(false);
    setQuery('');
    
    const routes: Record<string, string> = {
      product: `/inventory/products`,
      order: `/sales-orders/${id}`,
      customer: `/customers/${id}`,
    };
    
    router.push(routes[type] || '/dashboard');
  };

  const totalResults = results 
    ? results.products.length + results.orders.length + results.customers.length 
    : 0;

  return (
    <>
      <Button
        variant="outline"
        className="relative w-full max-w-sm justify-start text-muted-foreground sm:pr-12"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Search everything...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[550px] p-0 gap-0">
          <DialogHeader className="px-4 py-3 border-b">
            <DialogTitle className="sr-only">Search</DialogTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products, orders, customers..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 pr-9 border-0 focus-visible:ring-0 text-base"
                autoFocus
              />
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="max-h-[400px] overflow-y-auto">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isLoading && query.length >= 2 && totalResults === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                No results found for &quot;{query}&quot;
              </div>
            )}

            {!isLoading && results && (
              <div className="py-2">
                {results.products.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
                      Products
                    </div>
                    {results.products.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleSelect('product', product.id)}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors text-left"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                          <Package className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.sku} • {formatCurrency(product.unit_price)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {results.orders.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
                      Orders
                    </div>
                    {results.orders.map((order) => (
                      <button
                        key={order.id}
                        onClick={() => handleSelect('order', order.id)}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors text-left"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                          <ShoppingCart className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{order.order_number}</p>
                          <p className="text-sm text-muted-foreground">{order.customer_name} • {formatCurrency(order.total_amount)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {results.customers.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
                      Customers
                    </div>
                    {results.customers.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => handleSelect('customer', customer.id)}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors text-left"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                          <Users className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">{customer.email || customer.company_name || 'No email'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!isLoading && query.length < 2 && (
              <div className="py-8 text-center text-muted-foreground">
                Type at least 2 characters to search
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
