import { redirect } from 'next/navigation';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layouts/app-sidebar';
import { AppHeader } from '@/components/layouts/app-header';
import { getUserProfile } from '@/lib/actions/auth';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserProfile();
  
  if (!user) {
    redirect('/login');
  }

  return (
    <SidebarProvider>
      <AppSidebar role={user.role} />
      <SidebarInset className="flex flex-col min-h-screen">
        <AppHeader user={user} />
        <main className="flex-1 p-6 bg-slate-50/50">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
