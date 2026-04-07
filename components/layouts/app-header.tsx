'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Package, Users, ShoppingCart, FileText, Bell, User, LogOut, Settings, ChevronDown, Menu, AlertCircle, ShoppingBag, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { getNotifications, type Notification } from '@/lib/actions/notifications';
import { formatDistanceToNow } from 'date-fns';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { signOut } from '@/lib/actions/auth';
import { globalSearch } from '@/lib/actions/search';
import { getInitials } from '@/lib/utils/helpers';
import type { UserProfile, SearchResult } from '@/types';

interface AppHeaderProps {
  user: UserProfile;
}

export function AppHeader({ user }: AppHeaderProps) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every 2 minutes
    const interval = setInterval(fetchNotifications, 120000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    try {
      const result = await globalSearch(query);
      setSearchResults(result);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSignOut = async () => {
    toast.success('Signed out successfully');
    await signOut();
  };

  const displayName = user.employee 
    ? `${user.employee.first_name} ${user.employee.last_name}` 
    : 'User';

  const hasResults = searchResults && (
    searchResults.products.length > 0 ||
    searchResults.customers.length > 0 ||
    searchResults.orders.length > 0
  );

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 px-6">
        <SidebarTrigger className="-ml-2">
          <Menu className="h-5 w-5" />
        </SidebarTrigger>

        <div className="flex-1 flex items-center gap-4">
          <Button
            variant="outline"
            className="relative h-9 w-full max-w-sm justify-start text-sm text-muted-foreground"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="mr-2 h-4 w-4" />
            <span>Search...</span>
            <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative group">
                <Bell className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background ring-offset-0 animate-pulse" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Notifications</span>
                  {notifications.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-4">
                      {notifications.length} New
                    </Badge>
                  )}
                </div>
              </DropdownMenuLabel>
              <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <DropdownMenuItem 
                      key={notif.id} 
                      asChild 
                      className="p-4 cursor-pointer border-b last:border-0 focus:bg-muted/50"
                    >
                      <Link href={notif.link} className="flex gap-3">
                        <div className={cn(
                          "mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                          notif.type === 'stock' ? "bg-red-50 text-red-600" : 
                          notif.type === 'order' ? "bg-blue-50 text-blue-600" : 
                          "bg-green-50 text-green-600"
                        )}>
                          {notif.type === 'stock' && <AlertCircle className="h-4 w-4" />}
                          {notif.type === 'order' && <ShoppingBag className="h-4 w-4" />}
                          {notif.type === 'invoice' && <CreditCard className="h-4 w-4" />}
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{notif.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {notif.description}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="m-0" />
              <DropdownMenuItem className="p-3 justify-center text-xs text-muted-foreground font-medium hover:text-foreground cursor-pointer" asChild>
                <Link href="/settings">View all activity</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xs">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium">{displayName}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 capitalize">
                    {user.role}
                  </Badge>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{displayName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href="/settings" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                {user.role === 'admin' && (
                  <DropdownMenuItem>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput 
          placeholder="Search products, customers, orders..." 
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          {isSearching && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          )}
          {!isSearching && searchQuery.length >= 2 && !hasResults && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}
          {hasResults && (
            <>
              {searchResults!.products.length > 0 && (
                <CommandGroup heading="Products">
                  {searchResults!.products.map((product) => (
                    <CommandItem
                      key={product.id}
                      onSelect={() => {
                        router.push(`/inventory/products?id=${product.id}`);
                        setSearchOpen(false);
                      }}
                    >
                      <Package className="mr-2 h-4 w-4" />
                      <span>{product.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{product.sku}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {searchResults!.customers.length > 0 && (
                <CommandGroup heading="Customers">
                  {searchResults!.customers.map((customer) => (
                    <CommandItem
                      key={customer.id}
                      onSelect={() => {
                        router.push(`/customers/${customer.id}`);
                        setSearchOpen(false);
                      }}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      <span>{customer.name}</span>
                      {customer.company_name && (
                        <span className="ml-2 text-xs text-muted-foreground">{customer.company_name}</span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {searchResults!.orders.length > 0 && (
                <CommandGroup heading="Orders">
                  {searchResults!.orders.map((order) => (
                    <CommandItem
                      key={order.id}
                      onSelect={() => {
                        router.push(`/sales-orders/${order.id}`);
                        setSearchOpen(false);
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      <span>{order.order_number}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{order.customer_name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
