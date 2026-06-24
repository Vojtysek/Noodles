import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { ARTICLES, articleBySlug } from "@/lib/pruvodce/articles"

const ACCENT: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
}

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }))
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = articleBySlug(slug)
  if (!article) notFound()

  const Icon = article.icon

  return (
    <article className="mx-auto w-full">
      <Link
        href="/dashboard/pruvodce"
        className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        Zpět na průvodce
      </Link>

      <header className="mt-6">
        <span
          className={cn(
            "flex size-12 items-center justify-center rounded-2xl",
            ACCENT[article.accent]
          )}
        >
          <Icon className="size-6" />
        </span>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          {article.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{article.readingTime}</p>
        <p className="mt-5 text-lg leading-relaxed text-foreground/90">
          {article.lead}
        </p>
      </header>

      <div className="mt-10 flex flex-col gap-9">
        {article.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl font-semibold tracking-tight">
              {section.heading}
            </h2>
            <div className="mt-3 flex flex-col gap-3">
              {section.paragraphs.map((p, i) => (
                <p key={i} className="leading-relaxed text-muted-foreground">
                  {p}
                </p>
              ))}
            </div>
            {section.bullets && (
              <ul className="mt-4 flex flex-col gap-2.5">
                {section.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="leading-relaxed text-foreground/90">{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      {/* Soft CTA back into the wizard */}
      <div className="mt-12 rounded-2xl border bg-primary/[0.04] p-6">
        <p className="text-sm font-semibold">Připraveni posunout se dál?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Vraťte se do průvodce — provede vás každým krokem rekonstrukce krok za
          krokem.
        </p>
        <Link
          href="/dashboard/pruvodce"
          className="group mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Otevřít průvodce
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  )
}
