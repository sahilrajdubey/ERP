'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ColumnDef } from '@tanstack/react-table';
import { Loader2, Shield, ShieldAlert, ShieldCheck, Eye } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/data-table';
import { updateUserRole } from '@/lib/actions/settings';
import { formatDate } from '@/lib/utils/helpers';
import type { UserProfile, ActivityLog, Role } from '@/types';

interface SettingsClientProps {
  users: UserProfile[];
  activityLogs: ActivityLog[];
}

const ROLE_ICONS = {
  admin: ShieldAlert,
  manager: ShieldCheck,
  viewer: Eye,
};

const ROLE_COLORS = {
  admin: 'bg-red-100 text-red-800',
  manager: 'bg-blue-100 text-blue-800',
  viewer: 'bg-gray-100 text-gray-800',
};

export function SettingsClient({ users, activityLogs }: SettingsClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const companyForm = useForm({
    defaultValues: {
      name: 'EnterpriX Corporation',
      email: 'contact@enterprix.com',
      phone: '+1 (555) 123-4567',
      address: '123 Business Ave, Suite 100\nNew York, NY 10001',
      taxId: 'US-12345678',
    },
  });

  const handleCompanySubmit = async (data: unknown) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Company profile updated');
    setIsLoading(false);
  };

  const handleRoleChange = async (userId: string, role: Role) => {
    try {
      const result = await updateUserRole(userId, role);
      if (result.success) {
        toast.success('User role updated');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update role');
      }
    } catch {
      toast.error('An error occurred');
    }
  };

  const userColumns: ColumnDef<UserProfile>[] = [
    {
      accessorKey: 'full_name',
      header: 'User',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.full_name || 'No name'}</p>
          <p className="text-sm text-muted-foreground">{row.original.email}</p>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.original.role;
        const Icon = ROLE_ICONS[role];
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <Badge className={ROLE_COLORS[role]}>{role.charAt(0).toUpperCase() + role.slice(1)}</Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
          {row.original.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Joined',
      cell: ({ row }) => formatDate(row.original.created_at),
    },
    {
      id: 'actions',
      header: 'Change Role',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <Select
            value={user.role}
            onValueChange={(value: Role) => handleRoleChange(user.id, value)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
        );
      },
    },
  ];

  const activityColumns: ColumnDef<ActivityLog>[] = [
    {
      accessorKey: 'created_at',
      header: 'Timestamp',
      cell: ({ row }) => new Date(row.getValue('created_at')).toLocaleString(),
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => {
        const action = row.getValue('action') as string;
        const actionColors: Record<string, string> = {
          INSERT: 'bg-green-100 text-green-800',
          UPDATE: 'bg-blue-100 text-blue-800',
          DELETE: 'bg-red-100 text-red-800',
        };
        return <Badge className={actionColors[action] || 'bg-gray-100 text-gray-800'}>{action}</Badge>;
      },
    },
    {
      accessorKey: 'table_name',
      header: 'Table',
      cell: ({ row }) => <span className="font-mono text-sm">{row.getValue('table_name')}</span>,
    },
    {
      accessorKey: 'user',
      header: 'User',
      cell: ({ row }) => row.original.user?.email || 'System',
    },
    {
      accessorKey: 'record_id',
      header: 'Record ID',
      cell: ({ row }) => <span className="font-mono text-xs">{row.getValue('record_id')?.substring(0, 8)}...</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage system settings and configurations</p>
      </div>

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList>
          <TabsTrigger value="company">Company Profile</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Company Profile</CardTitle>
              <CardDescription>Update your company information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={companyForm.handleSubmit(handleCompanySubmit)} className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Company Name</Label>
                    <Input id="name" {...companyForm.register('name')} disabled={isLoading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...companyForm.register('email')} disabled={isLoading} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" {...companyForm.register('phone')} disabled={isLoading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxId">Tax ID</Label>
                    <Input id="taxId" {...companyForm.register('taxId')} disabled={isLoading} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" {...companyForm.register('address')} disabled={isLoading} rows={3} />
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user roles and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable columns={userColumns} data={users} searchKey="full_name" searchPlaceholder="Search users..." />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>Track all system changes and activities</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable columns={activityColumns} data={activityLogs} searchKey="table_name" searchPlaceholder="Filter by table..." />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
