import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminSidebar from './_components/AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) redirect('/admin/login');

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AdminSidebar />
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
