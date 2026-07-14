import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { PageTransition } from "@/components/layout/page-transition";
import { CommandPalette } from "@/features/search/components/command-palette";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background flex min-h-screen">
      <AppSidebar />
      <div className="flex min-h-screen flex-1 flex-col pb-16 lg:pb-0">
        <AppHeader />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1600px]">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
      <MobileNav />
      <CommandPalette />
    </div>
  );
}
