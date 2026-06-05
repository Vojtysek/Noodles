"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  PENDING_BUILDING_KEY,
  saveBuilding,
  type BuildingPayload,
} from "@/lib/onboarding/save-building";

const inputClass =
  "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function RegisterOverlay({
  payload,
  onClose,
}: {
  payload: BuildingPayload;
  onClose: () => void;
}) {
  const router = useRouter();
  // One client instance so the session from signUp is reused for the insert.
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);
  const [pending, startTransition] = useTransition();

  // Stash the payload so any auth path (email confirmation, or "log in
  // instead") lets the dashboard bridge attach the data later.
  useEffect(() => {
    try {
      localStorage.setItem(PENDING_BUILDING_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage failures
    }
  }, [payload]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (data.session && data.user) {
        // Email confirmation disabled → we have a session right away.
        try {
          await saveBuilding(supabase, data.user.id, payload);
          localStorage.removeItem(PENDING_BUILDING_KEY);
        } catch {
          // leave payload for the bridge to retry
        }
        router.push("/dashboard/prehled?from=onboarding");
        return;
      }
      // No session → email confirmation required. Keep payload; bridge attaches later.
      setConfirmSent(true);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-overlay-title"
        className="relative w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl ring-1 ring-border/50"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Zavřít"
          className="absolute top-4 right-4 inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <X className="size-4" />
        </button>

        {confirmSent ? (
          <div className="flex flex-col gap-4">
            <h2
              id="register-overlay-title"
              className="text-lg font-semibold text-foreground"
            >
              Hotovo!
            </h2>
            <p className="text-sm text-muted-foreground">
              Zkontrolujte e-mail a potvrďte registraci — váš projekt se pak
              uloží automaticky.
            </p>
            <Button asChild className="w-full">
              <Link href="/login">Přejít na přihlášení</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 pr-8">
              <h2
                id="register-overlay-title"
                className="text-lg font-semibold text-foreground"
              >
                Uložte svůj projekt
              </h2>
              <p className="text-sm text-muted-foreground">
                Zaregistrujte se a váš výpočet se uloží na váš účet.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="register-email"
                className="text-sm font-medium text-foreground"
              >
                E-mail
              </label>
              <input
                id="register-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="register-password"
                className="text-sm font-medium text-foreground"
              >
                Heslo
              </label>
              <input
                id="register-password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Ukládám…" : "Zaregistrovat a uložit"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Už mám účet?{" "}
              <Link
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                Přihlásit se
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
