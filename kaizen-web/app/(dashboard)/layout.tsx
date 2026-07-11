import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CommandPalette } from "@/features/search/components/command-palette";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex min-h-screen flex-1 flex-col pb-16 lg:pb-0">
        <AppHeader />
        <main className="flex-1 p-6">{children}</main>
      </div>
      <MobileNav />
      <CommandPalette />
    </div>
  );
}
