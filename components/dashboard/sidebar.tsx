"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Users,
  ChartColumn,
  FileDown,
  Building2,
  House,
} from "lucide-react"

import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/dashboard/prehled", label: "Přehled", icon: House },
  { href: "/dashboard/rezidenti", label: "Rezidenti", icon: Users },
  { href: "/dashboard/financials", label: "Finance", icon: ChartColumn },
  { href: "/dashboard/exporty", label: "Exporty", icon: FileDown },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="sticky top-0 flex h-svh w-56 shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl"
    >
      {/* Ambient tint */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 size-56 rounded-full bg-sidebar-primary/10 blur-[90px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -bottom-24 size-56 rounded-full bg-emerald-500/8 blur-[90px]"
      />

      <div
        className="sb-item-in relative flex items-center gap-2.5 px-4 py-5"
        style={{ "--sb-i": 0 } as React.CSSProperties}
      >
        <div className="relative flex size-8 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-md ring-1 ring-white/15">
          <Building2 className="size-4" />
          <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-400 ring-2 ring-sidebar" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
            Noodles
          </p>
          <p className="truncate text-xs text-muted-foreground">SVJ Letná 24</p>
        </div>
      </div>

      <div
        aria-hidden
        className="mx-4 h-px bg-gradient-to-r from-sidebar-border via-sidebar-border/40 to-transparent"
      />

      <nav className="relative flex flex-1 flex-col gap-0.5 px-2 pt-1">
        <p
          className="sb-item-in px-2 pt-2 pb-1.5 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase"
          style={{ "--sb-i": 1 } as React.CSSProperties}
        >
          Přehledy
        </p>
        {NAV_ITEMS.map((item, i) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "sb-item-in relative flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-sm transition-all duration-200",
                active
                  ? "bg-sidebar-primary/10 font-medium text-sidebar-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}
              style={{ "--sb-i": 2 + i } as React.CSSProperties}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-full bg-sidebar-primary"
                />
              )}
              <item.icon
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  active && "text-sidebar-primary"
                )}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

    </aside>
  )
}
