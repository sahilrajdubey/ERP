import { redirect } from 'next/navigation';
import { SettingsClient } from './settings-client';
import { getUserProfile } from '@/lib/actions/auth';
import { getAllUsers, getActivityLogs } from '@/lib/actions/settings';

export default async function SettingsPage() {
  const user = await getUserProfile();
  
  if (!user) redirect('/login');
  if (user.role !== 'admin') redirect('/dashboard');

  const [users, activityLogs] = await Promise.all([
    getAllUsers(),
    getActivityLogs(),
  ]);

  return <SettingsClient users={users} activityLogs={activityLogs} />;
}
