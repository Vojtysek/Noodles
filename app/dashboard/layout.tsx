import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { JoyrideTour } from "@/components/dashboard/joyride-tour"
import { PendingBuildingBridge } from "@/components/onboarding/pending-building-bridge"

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="relative flex min-h-svh">
      <PendingBuildingBridge />
      <JoyrideTour />
      {/* Shared ambient atmosphere behind all dashboard pages */}
      <div
        aria-hidden
        className="pointer-events-none fixed -top-1/4 left-1/4 -z-10 size-[40rem] rounded-full bg-emerald-500/5 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -right-1/4 -bottom-1/4 -z-10 size-[40rem] rounded-full bg-blue-500/5 blur-[120px]"
      />
      <DashboardSidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden p-6 pt-20 lg:p-8 lg:pt-8">
        {children}
      </main>
    </div>
  )
}
