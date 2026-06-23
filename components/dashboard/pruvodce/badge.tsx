import { cn } from "@/lib/utils"

/** Malý štítek (např. STAVBA) v jednotném stylu napříč Průvodcem. */
export function Badge({
  tone = "blue",
  children,
}: {
  tone?: "blue" | "amber" | "emerald"
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-px text-[10px] font-semibold tracking-wide uppercase",
        tone === "amber" &&
          "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
        tone === "blue" &&
          "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
        tone === "emerald" &&
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
      )}
    >
      {children}
    </span>
  )
}
