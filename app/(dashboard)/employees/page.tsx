import { redirect } from 'next/navigation';
import { EmployeesClient } from './employees-client';
import { getEmployees, getDepartments } from '@/lib/actions/employees';
import { getUserProfile } from '@/lib/actions/auth';

export default async function EmployeesPage() {
  const user = await getUserProfile();
  
  if (!user) redirect('/login');
  if (user.role !== 'admin') redirect('/dashboard');

  const [{ data: employees }, departments] = await Promise.all([
    getEmployees(),
    getDepartments(),
  ]);

  return <EmployeesClient employees={employees} departments={departments} />;
}
