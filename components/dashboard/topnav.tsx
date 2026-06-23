"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Users,
  ChartColumn,
  FileDown,
  Compass,
  LogOut,
  Sun,
  Moon,
  Hammer,
  Receipt,
  Menu,
  X,
} from "lucide-react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { signout } from "@/app/login/actions"

const NAV_ITEMS = [
  { href: "/dashboard/pruvodce", label: "Průvodce", icon: Compass, joyrideId: "nav-pruvodce" },
  { href: "/dashboard/rezidenti", label: "Rezidenti", icon: Users, joyrideId: "nav-rezidenti" },
  { href: "/dashboard/financials", label: "Finance", icon: ChartColumn, joyrideId: "nav-finance" },
  { href: "/dashboard/projects", label: "Projekty", icon: Hammer, joyrideId: "nav-projekty" },
  { href: "/dashboard/exporty", label: "Exporty", icon: FileDown, joyrideId: "nav-exporty" },
  { href: "/dashboard/faktury", label: "Faktury", icon: Receipt },
]

function isActive(pathname: string, href: string) {
  return pathname.startsWith(href)
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      aria-label="Přepnout motiv"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="size-5" />
      ) : (
        <Moon className="size-5" />
      )}
    </button>
  )
}

export function DashboardTopNav() {
  const pathname = usePathname()
  const [email, setEmail] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null)
    })
  }, [])

  // ESC zavírá mobilní menu + zámek scrollu.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.body.style.overflow = open ? "hidden" : ""
    window.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  const initial = email?.[0]?.toUpperCase() ?? "U"

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b border-border/70 bg-background/80 backdrop-blur-xl">
        {/* Jemný tint v pozadí lišty */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-sidebar-primary/30 to-transparent"
        />
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 lg:px-8">
          {/* Brand */}
          <Link
            href="/dashboard/pruvodce"
            className="flex shrink-0 items-center gap-2"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              R
            </span>
            <span className="text-base font-semibold tracking-tight">Reno</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden flex-1 items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-joyride={item.joyrideId}
                  className={cn(
                    "group relative flex h-16 items-center gap-2 px-3 text-sm transition-colors",
                    active
                      ? "font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "size-4 shrink-0 transition-colors",
                      active && "text-primary"
                    )}
                  />
                  {item.label}
                  {/* Aktivní podtržení — sedí přesně na spodní hraně lišty */}
                  <span
                    className={cn(
                      "absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary transition-all duration-300",
                      active ? "opacity-100" : "opacity-0 group-hover:opacity-40"
                    )}
                  />
                </Link>
              )
            })}
          </nav>

          {/* Right cluster */}
          <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
            <ThemeToggle />
            <div
              className="hidden size-9 items-center justify-center rounded-full bg-sidebar-primary/15 text-sm font-semibold text-sidebar-primary sm:flex"
              title={email ?? undefined}
            >
              {initial}
            </div>
            <form action={signout} className="hidden lg:block">
              <button
                type="submit"
                className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Odhlásit se"
                title="Odhlásit se"
              >
                <LogOut className="size-5" />
              </button>
            </form>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex size-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-accent lg:hidden"
              aria-label="Otevřít menu"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer backdrop */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      {/* Mobile drawer panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex h-svh w-72 max-w-[80vw] flex-col overflow-hidden border-l border-sidebar-border bg-sidebar/95 backdrop-blur-xl transition-transform duration-300 lg:hidden",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <span className="text-sm font-semibold tracking-tight">Reno</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            aria-label="Zavřít menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <div
          aria-hidden
          className="mx-4 h-px bg-gradient-to-r from-sidebar-border via-sidebar-border/40 to-transparent"
        />

        <nav className="flex flex-1 flex-col gap-0.5 px-2 pt-2">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-all duration-200",
                  active
                    ? "bg-sidebar-primary/10 font-medium text-sidebar-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "size-4 shrink-0",
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

        <div className="flex flex-col gap-1 px-2 py-3">
          {email && (
            <div className="flex items-center justify-between px-2.5 py-1">
              <p className="truncate text-xs text-muted-foreground">{email}</p>
              <ThemeToggle />
            </div>
          )}
          <form action={signout}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-muted-foreground transition-all duration-200 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            >
              <LogOut className="size-4 shrink-0" />
              Odhlásit se
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
