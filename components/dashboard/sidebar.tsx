"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Users,
  ChartColumn,
  FileDown,
  Building2,
  House,
  LogOut,
  Sun,
  Moon,
  Hammer,
  Receipt,
} from "lucide-react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { signout } from "@/app/login/actions"

const NAV_ITEMS = [
  { href: "/dashboard/prehled", label: "Přehled", icon: House, joyrideId: "nav-prehled" },
  { href: "/dashboard/rezidenti", label: "Rezidenti", icon: Users, joyrideId: "nav-rezidenti" },
  { href: "/dashboard/financials", label: "Finance", icon: ChartColumn, joyrideId: "nav-finance" },
  { href: "/dashboard/projects", label: "Projekty", icon: Hammer, joyrideId: "nav-projekty" },
  { href: "/dashboard/exporty", label: "Exporty", icon: FileDown, joyrideId: "nav-exporty" },
  { href: "/dashboard/faktury", label: "Faktury", icon: Receipt },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const [address, setAddress] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null)
      if (!user) return
      supabase
        .from("buildings")
        .select("address")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => setAddress(data?.address ?? null))
    })
  }, [])

  return (
    <aside className="sticky top-0 flex h-svh w-56 shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl">
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
        className="sb-item-in relative flex flex-col items-start gap-2.5 px-4 py-5"
        style={{ "--sb-i": 0 } as React.CSSProperties}
      >
        <div className={"flex flex-row items-center gap-2"}>
          <p className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
            Reno
          </p>
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
              data-joyride={item.joyrideId}
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

      <div
        aria-hidden
        className="mx-4 h-px bg-gradient-to-r from-sidebar-border via-sidebar-border/40 to-transparent"
      />

      <div className="relative flex flex-col gap-1 px-2 py-3">
        {email && (
          <div className="flex items-center justify-between px-2.5 py-1">
            <p className="truncate text-xs text-muted-foreground">{email}</p>
            <button
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
              className="rounded-lg px-2 py-1.5 text-muted-foreground transition-all duration-200 hover:bg-sidebar-accent/40"
              aria-label="Toggle theme"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </button>
          </div>
        )}
        <form action={signout}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-sm text-muted-foreground transition-all duration-200 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
          >
            <LogOut className="size-4 shrink-0" />
            Odhlásit se
          </button>
        </form>
      </div>
    </aside>
  )
}
