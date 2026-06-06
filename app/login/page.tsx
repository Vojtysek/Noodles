"use client"

import { Suspense, useState, useTransition } from "react"
import { useSearchParams } from "next/navigation"
import { Building2, Loader2, Lock, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { login, signup } from "./actions"

type Mode = "login" | "signup"

function LoginCard() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  const message = searchParams.get("message")
  const fromOnboarding = searchParams.get("from") === "onboarding"

  const [mode, setMode] = useState<Mode>(
    searchParams.get("mode") === "signup" ? "signup" : "login"
  )
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      if (mode === "login") {
        await login(formData)
      } else {
        await signup(formData)
      }
    })
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4">
      {/* Ambient tint */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 size-96 rounded-full bg-primary/10 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -bottom-32 size-96 rounded-full bg-emerald-500/8 blur-[120px]"
      />

      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card/70 p-7 shadow-xl ring-1 ring-white/5 backdrop-blur-xl">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex flex-row items-center gap-2">
            <div className="relative flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md ring-1 ring-white/15">
              <Building2 className="size-5" />
            </div>
            <p className="text-lg font-semibold tracking-tight text-foreground">
              Noodles
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {fromOnboarding
              ? "Zaregistrujte se a váš výpočet se uloží na váš účet"
              : mode === "login"
                ? "Přihlaste se ke svému účtu"
                : "Vytvořte si nový účet"}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={
              "rounded-md px-3 py-1.5 text-sm font-medium transition-all " +
              (mode === "login"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            Přihlášení
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={
              "rounded-md px-3 py-1.5 text-sm font-medium transition-all " +
              (mode === "signup"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            Registrace
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
            {message}
          </div>
        )}

        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-xs font-medium text-muted-foreground"
            >
              E-mail
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="vas@email.cz"
                className="h-9 w-full rounded-lg border border-border bg-background pr-3 pl-9 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-xs font-medium text-muted-foreground"
            >
              Heslo
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={4}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                placeholder="••••••••"
                className="h-9 w-full rounded-lg border border-border bg-background pr-3 pl-9 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          </div>

          <Button type="submit" size="lg" disabled={isPending} className="mt-1">
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {mode === "login" ? "Přihlásit se" : "Zaregistrovat se"}
          </Button>
        </form>

        {mode === "login" && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Byli jste pozváni?{" "}
            <button
              type="button"
              onClick={() => setMode("signup")}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Zaregistrujte se zde
            </button>
          </p>
        )}
        {mode === "signup" && !fromOnboarding && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Použijte email, na který jste byli pozváni.
          </p>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-background">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <LoginCard />
    </Suspense>
  )
}
