import { DashboardTopNav } from "@/components/dashboard/topnav"
import { JoyrideTour } from "@/components/dashboard/joyride-tour"
import { PendingBuildingBridge } from "@/components/onboarding/pending-building-bridge"

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="relative flex min-h-svh flex-col">
      <PendingBuildingBridge />
      {/* Shared ambient atmosphere behind all dashboard pages */}
      <div
        aria-hidden
        className="pointer-events-none fixed -top-1/4 left-1/4 -z-10 size-[40rem] rounded-full bg-emerald-500/5 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -right-1/4 -bottom-1/4 -z-10 size-[40rem] rounded-full bg-blue-500/5 blur-[120px]"
      />
      <DashboardTopNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8 lg:py-10">
        {children}
      </main>
      <JoyrideTour />
    </div>
  )
}
