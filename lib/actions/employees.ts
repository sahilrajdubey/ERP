'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import type { ActionResponse, Employee, UserProfile, Role } from '@/types';
import type { EmployeeInput, CreateUserInput } from '@/lib/validations';

export async function getEmployees(search?: string, page = 1, pageSize = 10): Promise<{ data: Employee[]; total: number }> {
  const supabase = await createClient();
  
  let query = supabase
    .from('employees')
    .select(`*, department:departments(id, name)`, { count: 'exact' });

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query.order('first_name').range(from, to);
  if (error) throw error;
  return { data: data || [], total: count || 0 };
}

export async function getEmployee(id: string): Promise<Employee | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('employees')
    .select(`*, department:departments(*)`)
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

export async function createEmployee(input: EmployeeInput): Promise<ActionResponse<Employee>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('employees').insert(input).select().single();
  if (error) return { success: false, error: error.message };
  revalidatePath('/employees');
  return { success: true, data };
}

export async function updateEmployee(id: string, input: Partial<EmployeeInput>): Promise<ActionResponse<Employee>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('employees')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) return { success: false, error: error.message };
  revalidatePath('/employees');
  return { success: true, data };
}

export async function deleteEmployee(id: string): Promise<ActionResponse> {
  const supabase = await createClient();
  const { error } = await supabase.from('employees').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/employees');
  return { success: true };
}

// User Management (Admin only)
export async function getUsers(): Promise<UserProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .select(`*, employee:employees(*)`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createUserAccount(input: CreateUserInput): Promise<ActionResponse> {
  const adminClient = createAdminClient();
  
  // Create auth user
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });

  if (authError) return { success: false, error: authError.message };

  // Create user profile
  const supabase = await createClient();
  const { error: profileError } = await supabase
    .from('users')
    .insert({
      auth_id: authData.user.id,
      role: input.role,
      employee_id: input.employee_id,
      is_active: true,
    });

  if (profileError) return { success: false, error: profileError.message };

  revalidatePath('/settings');
  return { success: true };
}

export async function updateUserRole(userId: string, role: Role): Promise<ActionResponse> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('users')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) return { success: false, error: error.message };
  revalidatePath('/settings');
  return { success: true };
}

export async function toggleUserStatus(userId: string, isActive: boolean): Promise<ActionResponse> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('users')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) return { success: false, error: error.message };
  revalidatePath('/settings');
  return { success: true };
}

export async function getDepartments() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('departments').select('*').order('name');
  if (error) throw error;
  return data || [];
}
