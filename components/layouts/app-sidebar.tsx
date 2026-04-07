'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Truck,
  ShoppingCart,
  Users,
  Receipt,
  FileText,
  UserCog,
  BarChart3,
  Settings,
  ChevronDown,
  Building2,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { Role } from '@/types';

import Image from 'next/image';

const iconMap = {
  LayoutDashboard,
  Package,
  Truck,
  ShoppingCart,
  Users,
  Receipt,
  FileText,
  UserCog,
  BarChart3,
  Settings,
};

const navItems = [
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
];

interface AppSidebarProps {
  role: Role;
}

export function AppSidebar({ role }: AppSidebarProps) {
  const pathname = usePathname();

  const filteredNavItems = navItems.filter(item => item.roles.includes(role));

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 overflow-hidden shadow-lg ring-1 ring-blue-500/20">
            <Image 
              src="/logo.png" 
              alt="EnterpriX Logo" 
              width={40} 
              height={40} 
              className="object-cover"
            />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              EnterpriX
            </span>
            <span className="text-xs text-muted-foreground -mt-0.5 font-medium">ERP System</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-3 py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap];
                const isActive = item.href 
                  ? pathname === item.href || pathname.startsWith(item.href + '/')
                  : item.children?.some(child => pathname === child.href || pathname.startsWith(child.href + '/'));

                if (item.children) {
                  const filteredChildren = item.children.filter(child => child.roles.includes(role));
                  
                  return (
                    <Collapsible key={item.title} className="group/collapsible">
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          render={<CollapsibleTrigger />}
                          className={`w-full justify-between ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}`}
                        >
                          <span className="flex items-center gap-3">
                            <Icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </span>
                          <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {filteredChildren.map((child) => (
                              <SidebarMenuSubItem key={child.href}>
                                <SidebarMenuSubButton
                                  render={<Link href={child.href} />}
                                  isActive={pathname === child.href}
                                >
                                  {child.title}
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton render={<Link href={item.href!} className="flex items-center gap-3" />} isActive={isActive}>
                      <Icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="text-xs text-muted-foreground text-center group-data-[collapsible=icon]:hidden">
          © 2024 EnterpriX ERP
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
