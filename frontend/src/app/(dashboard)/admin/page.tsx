import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { AdminPanel } from "@/components/admin/AdminPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();

  // Protect server-side. Do not render anything if not Super Admin.
  if (!session || !session.superAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Super Admin Panel</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Monitor system metrics, manage user profiles, and audit groups.
        </p>
      </div>
      
      <AdminPanel />
    </div>
  );
}
