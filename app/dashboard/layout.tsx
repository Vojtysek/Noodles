import { DashboardSidebar } from "@/components/dashboard/sidebar"

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-svh">
      <DashboardSidebar />
      <main className="min-w-0 flex-1 p-6 lg:p-8">{children}</main>
    </div>
  )
}
