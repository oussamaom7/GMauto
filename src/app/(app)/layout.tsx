import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileNavProvider } from "@/components/layout/MobileNavProvider";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <MobileNavProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar userName={session?.user?.name ?? "Admin"} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto bg-zinc-50 p-4 dark:bg-[#0b0e14] sm:p-6">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </MobileNavProvider>
  );
}
