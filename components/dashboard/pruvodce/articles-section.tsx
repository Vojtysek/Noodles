import Link from "next/link"
import { ArrowRight, BookOpen } from "lucide-react"

import { cn } from "@/lib/utils"
import { ARTICLES } from "@/lib/pruvodce/articles"

const ACCENT: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
}

/** Vzdělávací články pro hlubší ponoření do tématu. */
export function ArticlesSection() {
  return (
    <section>
      <div className="mb-1.5 flex items-center gap-2">
        <BookOpen className="size-5 text-primary" />
        <h2 className="text-base font-semibold">Chcete se dozvědět víc?</h2>
      </div>
      <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
        Projděte si průvodce klíčovými tématy — financováním, dotacemi i tím,
        jak získat sousedy na svou stranu.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ARTICLES.map((article) => {
          const Icon = article.icon
          return (
            <Link
              key={article.slug}
              href={`/dashboard/pruvodce/clanky/${article.slug}`}
              className="group flex flex-col rounded-2xl border bg-background/60 p-5 backdrop-blur-sm transition-all hover:border-foreground/15 hover:shadow-sm"
            >
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl",
                  ACCENT[article.accent]
                )}
              >
                <Icon className="size-5" />
              </span>
              <h3 className="mt-3.5 text-base font-semibold leading-snug">
                {article.title}
              </h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                {article.excerpt}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {article.readingTime}
                </span>
                <span className="flex items-center gap-1 text-xs font-medium text-primary">
                  Číst
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
