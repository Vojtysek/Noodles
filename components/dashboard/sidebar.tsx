"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, ChartColumn, FileDown, Calculator, Building2 } from "lucide-react"

import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/dashboard/rezidenti", label: "Rezidenti", icon: Users },
  { href: "/dashboard/financials", label: "Financials", icon: ChartColumn },
  { href: "/dashboard/exporty", label: "Exporty", icon: FileDown },
]

const TOOL_ITEMS = [{ href: "/calculator", label: "Kalkulačka", icon: Calculator }]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="sticky top-0 flex h-svh w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-2.5 px-4 py-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Building2 className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-sidebar-foreground">Noodles</p>
          <p className="truncate text-xs text-muted-foreground">SVJ Letná 24</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-2">
        <p className="px-2 pt-2 pb-1.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
          Přehledy
        </p>
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className={cn("size-4 shrink-0", active && "text-sidebar-primary")} />
              {item.label}
            </Link>
          )
        })}

        <p className="px-2 pt-5 pb-1.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
          Nástroje
        </p>
        {TOOL_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-3">
        <p className="text-xs text-muted-foreground">Mock data · bez backendu</p>
      </div>
    </aside>
  )
}
