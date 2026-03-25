'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Role, UserProfile, ActivityLog } from '@/types';

export async function getAllUsers(): Promise<UserProfile[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  return data || [];
}

export async function updateUserRole(
  userId: string,
  role: Role
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('users')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user role:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/settings');
  return { success: true };
}

export async function updateUserStatus(
  userId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('users')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user status:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/settings');
  return { success: true };
}

export async function getActivityLogs(
  limit: number = 100
): Promise<ActivityLog[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('activity_log')
    .select(`
      *,
      user:users(email, full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching activity logs:', JSON.stringify(error, null, 2) || error.message);
    return [];
  }

  return data || [];
}

export async function deleteUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const adminClient = createAdminClient();
  
  // Delete from auth
  const { error: authError } = await adminClient.auth.admin.deleteUser(userId);
  if (authError) {
    console.error('Error deleting user from auth:', authError);
    return { success: false, error: authError.message };
  }

  // User will be cascade deleted from users table via trigger
  revalidatePath('/settings');
  return { success: true };
}
