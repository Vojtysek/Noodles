import { DashboardSidebar } from "@/components/dashboard/sidebar"

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="relative flex min-h-svh">
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
      <main className="min-w-0 flex-1 p-6 lg:p-8">{children}</main>
    </div>
  )
}
