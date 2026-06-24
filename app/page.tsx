"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  FileDown,
  FileText,
  Presentation,
  Sparkles,
  UserRound,
} from "lucide-react"
import { motion, useAnimation } from "motion/react"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

gsap.registerPlugin(useGSAP, ScrollTrigger)

const heroBenefits = [
  "Spočítejte úspory energií a návratnost",
  "Argumenty a podpora sousedů pro hlasování",
  "Od prvního nápadu po schválení na schůzi SVJ",
]

const stats = [
  { value: 4, suffix: "", label: "typy renovací v plánu" },
  { value: 40, suffix: " %", label: "tepla může ušetřit zateplení fasády" },
  { value: 50, suffix: " %", label: "nákladů může pokrýt dotace NZÚ" },
  { value: 24, suffix: "", label: "bytových jednotek v domě" },
]

const steps = [
  {
    title: "Zadejte svůj dům",
    description:
      "Vyplňte základní údaje o domě a vyberte renovace, které zvažujete — fasádu, okna, střechu nebo výtah.",
  },
  {
    title: "Prohlédněte si čísla",
    description:
      "Noodles spočítá náklady, úspory energií a návratnost. Vše přehledně v grafech, kterým rozumí každý.",
  },
  {
    title: "Přesvědčte sousedy",
    description:
      "Sledujte postoje rezidentů, připravte si argumenty a exportujte přehledné materiály přímo na schůzi SVJ.",
  },
  {
    title: "Sledujte průběh",
    description:
      "Po schválení renovace sledujte harmonogram, čerpání fondu oprav a skutečné úspory v čase.",
  },
]

const landingArchetypes = [
  {
    name: "Skrblík",
    img: "/personas/skrblik.png",
    subtitle: "Každá koruna se počítá",
    objections: [
      "Zvýšení fondu oprav",
      "Příliš drahé řešení",
      "„Nešlo by to levněji?“",
    ],
    strategy: [
      "Ukažte návratnost s dotací NZÚ — ne celkovou cenu.",
      "Rozložte náklady do fondu oprav, ať záloha nevyskočí nárazově.",
    ],
  },
  {
    name: "Investor",
    img: "/personas/investor.png",
    subtitle: "Byt je pro něj investice",
    objections: [
      "Dlouhá návratnost",
      "Náklady bez vlivu na hodnotu bytu",
      "Zdlouhavé schvalování",
    ],
    strategy: [
      "Veďte řeč o zhodnocení bytu a růstu ceny, ne o pořizovací ceně.",
      "Ukažte návratnost v letech a srovnejte ji s jinými investicemi.",
    ],
  },
  {
    name: "Technik",
    img: "/personas/technik.png",
    subtitle: "Chce vidět dokumentaci",
    objections: [
      "Kvalita navržených materiálů",
      "Chybějící posudky a reference",
      "Výběr dodavatele bez soutěže",
    ],
    strategy: [
      "Přineste technickou dokumentaci, posudky a reference zhotovitelů.",
      "Vysvětlete transparentní výběrové řízení a kvalitu materiálů.",
    ],
  },
  {
    name: "Ekolog",
    img: "/personas/ekolog.png",
    subtitle: "Zelená řešení na prvním místě",
    objections: [
      "Scénář bez ekologického přínosu",
      "Promarněná šance na fotovoltaiku",
      "Krátkozraká levná řešení",
    ],
    strategy: [
      "Zdůrazněte úsporu energií, nižší emise a připravenost na fotovoltaiku.",
      "Ukažte, že varianta není kosmetická, ale má reálný ekologický přínos.",
    ],
  },
  {
    name: "Lhostejný",
    img: "/personas/lhostejny.png",
    subtitle: "Hlavně ať ho nikdo neobtěžuje",
    objections: [
      "„Proč to vůbec řešit?“",
      "Další schůze navíc",
      "Papírování a formuláře",
    ],
    strategy: [
      "Nabídněte hlasování per rollam nebo online — minimum úsilí.",
      "Dejte jasné doporučení v jedné větě, ať se nemusí do ničeho nořit.",
    ],
  },
  {
    name: "Nováček",
    img: "/personas/novacek.png",
    subtitle: "Teprve poznává dům i sousedy",
    objections: [
      "Nerozumí souvislostem a historii",
      "Neví, komu věřit",
      "Obava ze špatného rozhodnutí",
    ],
    strategy: [
      "Vysvětlete kontext a historii domu od začátku, bez žargonu.",
      "Ukažte přehledná čísla a plán a ujistěte ho, že rozhoduje správně.",
    ],
  },
]

const landingScenarios = [
  {
    id: "dilci",
    name: "Dílčí renovace",
    tagline:
      "Zateplení fasády a výměna oken — dvě opatření s největším dopadem na tepelné ztráty domu.",
    tone: "blue" as const,
    renovations: [
      {
        label: "Fasáda",
        color: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
      },
      {
        label: "Okna",
        color: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
      },
    ],
    investment: "5,5 mil. Kč",
    savingsPerYear: "200 tis. Kč",
    energySaving: "−40 %",
    subsidy: "2,75 mil. Kč",
    bestFor: "Nejlepší poměr ceny a úspor",
  },
  {
    id: "komplexni",
    name: "Komplexní renovace",
    tagline:
      "Fasáda, okna i střecha najednou. Dům připravený na desítky let — a poloviční účty za teplo.",
    tone: "emerald" as const,
    renovations: [
      {
        label: "Fasáda",
        color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      },
      {
        label: "Okna",
        color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      },
      {
        label: "Střecha",
        color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      },
    ],
    investment: "21 mil. Kč",
    savingsPerYear: "360 tis. Kč",
    energySaving: "−70 %",
    subsidy: "10,5 mil. Kč",
    bestFor: "Dlouhodobá hodnota domu",
  },
]

const faqs = [
  {
    question: "Co je Noodles?",
    answer:
      "Noodles je aplikace, která provází celým životním cyklem renovace bytového domu — od výpočtu úspor a získání podpory sousedů, přes schválení na schůzi SVJ, až po sledování průběhu a skutečných výsledků rekonstrukce.",
  },
  {
    question: "Pro koho je aplikace určená?",
    answer:
      "Pro výbory SVJ, aktivní rezidenty a správce bytových domů, kteří chtějí renovaci dotáhnout od prvního nápadu až po dokončenou stavbu.",
  },
  {
    question: "Co se děje po schválení renovace?",
    answer:
      "Po schválení na schůzi vám Noodles pomůže sledovat harmonogram prací, čerpání fondu oprav a skutečné úspory energie v čase — takže víte, jestli vše probíhá podle plánu.",
  },
  {
    question: "Kolik to stojí?",
    answer:
      "Aplikace je momentálně v rané fázi a můžete ji vyzkoušet zdarma. O případných placených plánech vás budeme včas informovat.",
  },
  {
    question: "Odkud berete čísla o úsporách?",
    answer:
      "Výpočty vycházejí z typických hodnot pro bytové domy v ČR — cen energií, tepelných ztrát a orientačních nákladů na renovace. Slouží jako první odhad, ne jako náhrada projektové dokumentace.",
  },
  {
    question: "Jak funguje sledování rezidentů?",
    answer:
      "Ke každému rezidentovi si zapíšete, jak se k renovaci staví. Noodles z vašich poznámek vytvoří přehled postojů a pomůže vám připravit materiály přizpůsobené každému sousedovi.",
  },
]

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div data-reveal className="rounded-2xl border px-5 py-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between gap-4 text-left font-medium"
      >
        {question}
        <ChevronDown
          className={`size-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-out ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <p className="pt-3 text-sm text-muted-foreground">{answer}</p>
        </div>
      </div>
    </div>
  )
}

function HeroCta({ href }: { href: string }) {
  const arrowControls = useAnimation()

  return (
    <div
      data-hero-cta
      className="group flex items-center gap-1.5"
      onMouseEnter={() =>
        arrowControls.start({
          x: 3,
          y: -3,
          transition: {
            type: "spring",
            stiffness: 600,
            damping: 12,
            mass: 0.6,
          },
        })
      }
      onMouseLeave={() =>
        arrowControls.start({
          x: 0,
          y: 0,
          transition: { type: "spring", stiffness: 400, damping: 20 },
        })
      }
    >
      <Button
        asChild
        className="h-14 rounded-full px-8 text-base font-semibold shadow-xl group-hover:bg-primary/85 hover:bg-primary/85"
      >
        <Link href={href}>Spustit kalkulačku</Link>
      </Button>
      <Button
        asChild
        className="size-14 rounded-full shadow-xl group-hover:bg-primary/85 hover:bg-primary/85"
      >
        <Link href={href} aria-label="Vyzkoušet zdarma">
          <motion.span animate={arrowControls} className="inline-flex">
            <ArrowUpRight className="size-6" />
          </motion.span>
        </Link>
      </Button>
    </div>
  )
}

export default function Page() {
  const root = useRef<HTMLDivElement>(null)

  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [selectedArchetype, setSelectedArchetype] = useState(0)

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setLoggedIn(!!data.user))
  }, [])

  const appHref = loggedIn ? "/dashboard/pruvodce" : "/onboarding"

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Hero entrance
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } })
        tl.from(
          "[data-hero-img]",
          { scale: 1.12, duration: 1.8, ease: "power2.out" },
          0
        )
          .from("[data-hero-nav]", { y: -24, autoAlpha: 0, duration: 0.6 }, 0.2)
          .from(
            "[data-hero-line] > span",
            { yPercent: 110, duration: 0.9, stagger: 0.12 },
            0.35
          )
          .from(
            "[data-hero-benefit]",
            { x: -24, autoAlpha: 0, duration: 0.5, stagger: 0.1 },
            0.9
          )
          .from("[data-hero-cta]", { y: 16, autoAlpha: 0, duration: 0.5 }, 1.15)
          .from(
            "[data-hero-blob]",
            { scale: 0.4, autoAlpha: 0, duration: 0.9, ease: "back.out(1.6)" },
            0.9
          )
          .from("[data-hero-card]", { y: 40, autoAlpha: 0, duration: 0.7 }, 1.2)
          .from(
            "[data-hero-bar]",
            {
              scaleX: 0,
              transformOrigin: "left center",
              duration: 0.9,
              ease: "power3.out",
            },
            1.6
          )

        // Blob percentage counts up as the blob lands (synced with its entrance)
        const blobNum = document.querySelector<HTMLElement>("[data-blob-count]")
        if (blobNum) {
          const blobCounter = { value: 0 }
          tl.to(
            blobCounter,
            {
              value: 40,
              duration: 1.4,
              ease: "power2.out",
              onUpdate() {
                blobNum.textContent = String(Math.round(blobCounter.value))
              },
            },
            0.95
          )
        }

        // Subtle parallax on the hero photo — numeric scrub adds inertia so
        // the photo glides instead of snapping 1:1 with the wheel
        gsap.to("[data-hero-img]", {
          yPercent: 8,
          ease: "none",
          scrollTrigger: {
            trigger: "[data-hero]",
            start: "top top",
            end: "bottom top",
            scrub: 0.8,
          },
        })

        // The corner cards drift gently after they land
        gsap.to("[data-hero-blob]", {
          y: -10,
          duration: 3.2,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: 2,
        })
        gsap.to("[data-hero-card]", {
          y: -8,
          duration: 2.6,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: 2.2,
        })

        // Scroll reveals
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          gsap.from(el, {
            y: 36,
            autoAlpha: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 85%" },
          })
        })

        // Count-up numbers (supports decimals via data-decimals, Czech comma)
        gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
          const target = parseFloat(el.dataset.count ?? "0")
          const suffix = el.dataset.suffix ?? ""
          const decimals = Number(el.dataset.decimals ?? 0)
          const counter = { value: 0 }
          gsap.to(counter, {
            value: target,
            duration: 1.6,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 85%" },
            onUpdate() {
              el.textContent = `${counter.value.toFixed(decimals).replace(".", ",")}${suffix}`
            },
          })
        })

        // Segmented bars fill from the left
        gsap.utils.toArray<HTMLElement>("[data-fill-bar]").forEach((bar) => {
          gsap.from(bar.children, {
            scaleX: 0,
            transformOrigin: "left center",
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.12,
            scrollTrigger: { trigger: bar, start: "top 85%" },
          })
        })

        // Chart bars grow from the baseline
        gsap.utils.toArray<HTMLElement>("[data-bar-chart]").forEach((chart) => {
          gsap.from(chart.querySelectorAll("[data-bar]"), {
            scaleY: 0,
            transformOrigin: "bottom center",
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.08,
            scrollTrigger: { trigger: chart, start: "top 85%" },
          })
        })

        // Avatars pop in one by one
        gsap.utils.toArray<HTMLElement>("[data-avatar-row]").forEach((row) => {
          gsap.from(row.children, {
            scale: 0,
            duration: 0.5,
            ease: "back.out(2)",
            stagger: 0.07,
            scrollTrigger: { trigger: row, start: "top 85%" },
          })
        })

        // Draw the curved progress line through the steps
        const stepsLine =
          document.querySelector<SVGPathElement>("[data-steps-line]")
        if (stepsLine) {
          const length = stepsLine.getTotalLength()
          gsap.set(stepsLine, {
            strokeDasharray: length,
            strokeDashoffset: length,
          })
          gsap.to(stepsLine, {
            strokeDashoffset: 0,
            duration: 1.4,
            ease: "power2.inOut",
            scrollTrigger: { trigger: "[data-steps]", start: "top 70%" },
          })
        }
      })
    },
    { scope: root }
  )

  return (
    <div ref={root} className="flex min-h-svh flex-col">
      {/* Hero — full-bleed photo tapering off at the bottom */}
      <section data-hero className="relative">
        <div className="relative isolate min-h-[94svh] overflow-hidden rounded-b-[2.5rem] sm:rounded-b-[4rem] lg:rounded-br-[10rem] lg:rounded-bl-[4rem]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            data-hero-img
            src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2400&auto=format&fit=crop"
            alt="Bytový dům"
            className="absolute -top-[8%] left-0 h-[116%] w-full object-cover will-change-transform"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/70 to-transparent" />

          {/* Floating pill navbar */}
          <header
            data-hero-nav
            className="absolute inset-x-0 top-0 z-20 px-4 pt-5 sm:px-6"
          >
            <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 rounded-full bg-background/95 py-2 pr-2 pl-5 shadow-lg backdrop-blur">
              <Link href="/" className="-ml-2 flex items-center font-semibold">
                <img src="/reno-logo.svg" alt="Reno" className="h-10 w-auto rounded-full" />
              </Link>
              <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
                <a
                  href="#funkce"
                  className="transition-colors hover:text-foreground"
                >
                  Funkce
                </a>
                <a
                  href="#jak-to-funguje"
                  className="transition-colors hover:text-foreground"
                >
                  Jak to funguje
                </a>
                <a
                  href="#faq"
                  className="transition-colors hover:text-foreground"
                >
                  Časté dotazy
                </a>
              </nav>
              <div className="flex items-center gap-2">
                {loggedIn === false && (
                  <Button
                    variant="ghost"
                    asChild
                    className="rounded-full px-3 sm:px-4"
                  >
                    <Link href="/login">Přihlásit se</Link>
                  </Button>
                )}
                <Button asChild className="h-10 rounded-full px-4 sm:px-5">
                  <Link href={appHref}>
                    <span className="sm:hidden">Spustit</span>
                    <span className="hidden sm:inline">Spustit aplikaci</span>
                  </Link>
                </Button>
              </div>
            </div>
          </header>

          {/* Hero content */}
          <div className="relative z-10 mx-auto flex min-h-[94svh] w-full max-w-6xl flex-col justify-center gap-8 px-6 pt-32 pb-28 sm:px-8">
            <h1 className="max-w-3xl text-5xl leading-[1.08] font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              <span data-hero-line className="block overflow-hidden">
                <span className="block">Naplánujte renovaci.</span>
              </span>
              <span data-hero-line className="block overflow-hidden">
                <span className="block">Přesvědčte sousedy.</span>
              </span>
            </h1>
            <ul className="flex flex-col gap-3">
              {heroBenefits.map((benefit) => (
                <li
                  key={benefit}
                  data-hero-benefit
                  className="flex items-center gap-3 font-medium text-white"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-emerald-950">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
            <HeroCta href={appHref} />

            {/* Oversized stat blob — anchored to the container's right edge */}
            <div
              data-hero-blob
              className="absolute top-32 right-0 z-10 hidden w-60 flex-col gap-3 rounded-[2.5rem] bg-primary p-8 text-primary-foreground shadow-2xl lg:flex"
            >
              <p className="text-7xl leading-none font-bold tracking-tight">
                <span data-blob-count>40</span>
                <span className="align-top text-3xl">%</span>
              </p>
              <p className="text-sm leading-snug text-pretty opacity-90">
                tepla může ušetřit zateplení fasády staršího domu
              </p>
            </div>

            {/* Floating product card — anchored to the container's right edge */}
            <div
              data-hero-card
              className="absolute right-0 bottom-28 z-10 hidden w-80 flex-col gap-4 rounded-2xl bg-zinc-950/70 p-5 text-white shadow-[0_24px_64px_-16px_rgba(0,0,0,0.6)] ring-1 ring-white/15 backdrop-blur-md lg:flex"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/70">
                  Roční náklady domu na teplo
                </span>
                <span className="rounded-md bg-emerald-400/15 px-1.5 py-0.5 text-xs font-medium text-emerald-300 tabular-nums">
                  −35 %
                </span>
              </div>
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-3">
                  <span className="w-9 shrink-0 text-[11px] text-white/50">
                    Dnes
                  </span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-full rounded-full bg-white/35" />
                  </div>
                  <span className="w-16 shrink-0 text-right text-xs text-white/70 tabular-nums">
                    600 tis. Kč
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-9 shrink-0 text-[11px] text-white/50">
                    Potom
                  </span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      data-hero-bar
                      className="h-full w-[65%] rounded-full bg-emerald-400"
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right text-xs font-medium text-emerald-300 tabular-nums">
                    390 tis. Kč
                  </span>
                </div>
              </div>
              <p className="text-xs text-pretty text-white/60">
                Úspora{" "}
                <span className="font-semibold text-emerald-300">
                  210 000 Kč ročně
                </span>{" "}
                po zateplení fasády domu s 24 byty
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1">
        {/* Stats band with count-up */}
        <section className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-y-10 px-4 py-16 sm:px-6 lg:grid-cols-4 lg:py-20">
          {stats.map((stat) => (
            <div
              key={stat.label}
              data-reveal
              className="flex flex-col items-center gap-1 text-center"
            >
              <p
                data-count={stat.value}
                data-suffix={stat.suffix}
                className="text-5xl font-bold tracking-tight"
              >
                {stat.value}
                {stat.suffix}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </section>

        {/* Features — bento grid */}
        <section
          id="funkce"
          className="mx-auto w-full max-w-6xl scroll-mt-8 px-4 py-16 sm:px-6 lg:py-24"
        >
          <div data-reveal className="mb-12 max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              Od nápadu po rekonstrukci — na jednom místě.
            </h2>
            <p className="mt-3 text-lg text-pretty text-muted-foreground">
              Renovace neztroskotá na číslech, ale na schůzi. A po schválení
              přichází další výzva — sledovat průběh. Noodles vás provede každým
              krokem.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {/* Rezidenti — anchor card with inset product viewport */}
            <div
              data-reveal
              className="flex flex-col rounded-2xl bg-card p-7 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_32px_-16px_rgba(16,24,40,0.14)] ring-1 ring-black/[0.06] md:col-span-2 md:row-span-2 dark:ring-white/[0.06]"
            >
              <p className="text-xs font-medium tracking-wider text-primary uppercase">
                Rezidenti
              </p>
              <h3 className="mt-1.5 text-xl font-semibold tracking-tight">
                Připravte si argumenty na každý typ souseda
              </h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                AI zná šest typů sousedů — pochopí jejich námitky i motivace a
                připraví argumenty na míru vybranému scénáři. Na schůzi vás tak
                nikdo nezaskočí.
              </p>

              {/* Galerie archetypů */}
              <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {landingArchetypes.map((a, i) => (
                  <button
                    type="button"
                    key={a.name}
                    onClick={() => setSelectedArchetype(i)}
                    aria-pressed={i === selectedArchetype}
                    className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border p-2 text-center transition-colors ${
                      i === selectedArchetype
                        ? "border-primary/60 bg-primary/5"
                        : "border-border/50 bg-background/40"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.img}
                      alt={a.name}
                      className="aspect-square w-full rounded-lg object-cover"
                    />
                    <span className="w-full truncate text-[11px] font-medium">
                      {a.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Detail vybraného archetypu */}
              <div className="mt-auto pt-6">
                <div className="flex flex-col gap-4 rounded-xl bg-muted/40 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] ring-1 ring-black/[0.04] ring-inset dark:shadow-none dark:ring-white/[0.04]">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={landingArchetypes[selectedArchetype].img}
                      alt={landingArchetypes[selectedArchetype].name}
                      className="size-10 shrink-0 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">
                        {landingArchetypes[selectedArchetype].name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {landingArchetypes[selectedArchetype].subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Námitky */}
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                      Námitky
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {landingArchetypes[selectedArchetype].objections.map((o) => (
                        <span
                          key={o}
                          className="rounded-full border border-border/60 bg-background px-2.5 py-1 text-xs text-muted-foreground"
                        >
                          {o}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Argumentační strategie */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-primary" />
                      <p className="text-[11px] font-medium tracking-wider text-primary uppercase">
                        Argumentační strategie
                      </p>
                    </div>
                    {landingArchetypes[selectedArchetype].strategy.map((point, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 rounded-lg bg-background px-3.5 py-2.5"
                      >
                        <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground tabular-nums">
                          {i + 1}
                        </span>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {point}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Exporty — materiály pro schůzi SVJ */}
            <div
              data-reveal
              className="flex flex-col overflow-hidden rounded-2xl bg-card shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-12px_rgba(16,24,40,0.12)] ring-1 ring-black/[0.06] dark:ring-white/[0.06]"
            >
              <div className="flex items-center gap-2 border-b border-border/60 px-5 py-3">
                <FileDown className="size-3.5 shrink-0 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">
                  Exporty · připraveno
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                {[
                  {
                    Icon: FileText,
                    label: "Stručný přehled",
                    tag: "PDF · 1 str.",
                  },
                  {
                    Icon: Presentation,
                    label: "Prezentace na schůzi",
                    tag: "PPTX · 8 sl.",
                  },
                  {
                    Icon: UserRound,
                    label: "Dopis sousedovi",
                    tag: "PDF · na míru",
                  },
                ].map(({ Icon, label, tag }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 rounded-xl border bg-muted/40 px-3 py-2.5"
                  >
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-3.5" />
                    </div>
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">
                      {label}
                    </p>
                    <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
                      {tag}
                    </span>
                  </div>
                ))}
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Materiály přizpůsobené vašim datům — na nástěnku, do e-mailu i
                  na schůzi SVJ.
                </p>
              </div>
            </div>

            {/* Finanční přehled — edge-bleed chart with annotation */}
            <div
              data-reveal
              className="relative overflow-hidden rounded-2xl bg-card p-7 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-12px_rgba(16,24,40,0.12)] ring-1 ring-black/[0.06] dark:ring-white/[0.06]"
            >
              <p className="text-xs font-medium tracking-wider text-primary uppercase">
                Finance
              </p>
              <h3 className="mt-1.5 text-lg font-semibold tracking-tight">
                Víte, kdy se investice vrátí
              </h3>
              <div className="-mx-7 mt-6 border-t border-dashed border-border/70 px-7 pt-10">
                <div
                  data-bar-chart
                  className="flex h-24 items-end gap-1.5 border-b border-border/60 pb-px"
                >
                  {[35, 55, 45, 70, 60, 85, 100].map((height, i) => (
                    <div
                      key={i}
                      className="relative flex h-full flex-1 items-end"
                    >
                      {i === 6 && (
                        <span className="absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 rounded-md bg-foreground px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap text-background">
                          9. rok
                        </span>
                      )}
                      <div
                        data-bar
                        className={`w-full rounded-t-[3px] ${i === 6 ? "bg-primary" : "bg-primary/15"}`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Kalkulačka — full-width strip with flat metric columns */}
            <div
              data-reveal
              className="flex flex-col gap-8 rounded-2xl bg-card p-7 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-12px_rgba(16,24,40,0.12)] ring-1 ring-black/[0.06] md:col-span-3 md:flex-row md:items-center dark:ring-white/[0.06]"
            >
              <div className="md:max-w-sm md:flex-1">
                <p className="text-xs font-medium tracking-wider text-primary uppercase">
                  Kalkulačka
                </p>
                <h3 className="mt-1.5 text-lg font-semibold tracking-tight">
                  Čísla za minutu, ne za měsíc
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Zadejte parametry domu a zjistíte orientační náklady, úspory a
                  návratnost jednotlivých renovací.
                </p>
              </div>
              <dl className="grid flex-1 grid-cols-3 divide-border/60 md:divide-x">
                <div className="flex flex-col gap-1 md:px-6 md:first:pl-0 md:last:pr-0">
                  <dt className="text-xs text-muted-foreground">Náklady</dt>
                  <dd className="text-lg font-semibold tabular-nums">
                    <span
                      data-count="4.8"
                      data-decimals="1"
                      data-suffix=" mil. Kč"
                    >
                      4,8 mil. Kč
                    </span>
                  </dd>
                </div>
                <div className="flex flex-col gap-1 md:px-6">
                  <dt className="text-xs text-muted-foreground">
                    Úspora ročně
                  </dt>
                  <dd className="text-lg font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
                    <span data-count="210" data-suffix=" tis. Kč">
                      210 tis. Kč
                    </span>
                  </dd>
                </div>
                <div className="flex flex-col gap-1 md:px-6 md:last:pr-0">
                  <dt className="text-xs text-muted-foreground">
                    Návratnost s dotací
                  </dt>
                  <dd className="text-lg font-semibold tabular-nums">
                    <span data-count="11" data-suffix=" let">
                      11 let
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* How it works — ghost numbers */}
        <section id="jak-to-funguje" className="border-y">
          <div className="mx-auto w-full max-w-6xl scroll-mt-8 px-4 py-16 sm:px-6 lg:py-24">
            <div data-reveal className="mb-14 max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                Jak to funguje
              </h2>
              <p className="mt-3 text-lg text-muted-foreground">
                Čtyři kroky od prvního nápadu až za schválenou rekonstrukci.
              </p>
            </div>
            <div data-steps className="relative">
              {/* Curved line through the pip centers — dashed track + solid fill */}
              <svg
                className="pointer-events-none absolute -top-4 left-0 hidden h-20 w-full text-primary md:block"
                viewBox="0 0 1200 80"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  className="text-border"
                  d="M 150 40 C 270 6, 330 6, 450 40 C 570 6, 630 6, 750 40 C 870 6, 930 6, 1050 40"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="2 8"
                  strokeLinecap="round"
                />
                <path
                  data-steps-line
                  d="M 150 40 C 270 6, 330 6, 450 40 C 570 6, 630 6, 750 40 C 870 6, 930 6, 1050 40"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
              <div className="relative grid gap-12 md:grid-cols-4 md:gap-8">
                {steps.map((step, index) => (
                  <div
                    key={step.title}
                    data-reveal
                    className="flex flex-col items-center gap-3 text-center"
                  >
                    <span className="relative z-10 flex size-12 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-background">
                      {index + 1}
                    </span>
                    <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                    <p className="max-w-xs text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Scenario comparison */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <div data-reveal className="mb-12 max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              Porovnejte varianty, vyberte svou cestu
            </h2>
            <p className="mt-3 text-lg text-pretty text-muted-foreground">
              Každý dům je jiný. Noodles vám ukáže, jak různé kombinace projektů
              ovlivní náklady, úspory i hlasování SVJ.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:gap-6">
            {landingScenarios.map((s) => (
              <div
                key={s.id}
                data-reveal
                className="relative flex flex-col rounded-2xl bg-card p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-12px_rgba(16,24,40,0.12)] ring-1 ring-black/[0.06] transition-shadow hover:shadow-[0_4px_32px_-8px_rgba(16,24,40,0.16)] dark:ring-white/[0.06]"
              >
                {/* Header */}
                <div className="mb-4">
                  <p className="text-xs font-semibold tracking-wider text-primary uppercase">
                    {s.bestFor}
                  </p>
                  <h3 className="mt-1 text-lg font-bold tracking-tight">
                    {s.name}
                  </h3>
                  <p className="mt-1.5 text-sm leading-snug text-muted-foreground">
                    {s.tagline}
                  </p>
                </div>

                {/* Renovation tags */}
                <div className="mb-5 flex flex-wrap gap-1.5">
                  {s.renovations.map((r) => (
                    <span
                      key={r.label}
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${r.color}`}
                    >
                      {r.label}
                    </span>
                  ))}
                </div>

                {/* Metrics */}
                <div className="mt-auto flex flex-col gap-3 border-t border-border/50 pt-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      Celková investice
                    </span>
                    <span className="text-sm font-semibold tabular-nums">
                      {s.investment}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      Úspora ročně
                    </span>
                    <span className="text-sm font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
                      {s.savingsPerYear}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      Úspora energie
                    </span>
                    <span className="text-sm font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
                      {s.energySaving}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2">
                    <span className="text-xs text-muted-foreground">
                      Dotace NZÚ až
                    </span>
                    <span className="text-sm font-bold tabular-nums">
                      {s.subsidy}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 px-1 text-xs text-muted-foreground">
            Orientační čísla pro typický panelový dům s 24 byty v ČR. Vycházejí
            z reálných případových studií renovací (TZB-info, Ekowatt) a
            podmínek programu Nová zelená úsporám, který kryje až 50 %
            způsobilých výdajů. Ta vaše si spočítáte v kalkulačce.
          </p>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t">
          <div className="mx-auto w-full max-w-3xl scroll-mt-8 px-4 py-16 sm:px-6 lg:py-24">
            <div data-reveal className="mb-10">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Časté dotazy
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              {faqs.map((faq) => (
                <FaqItem
                  key={faq.question}
                  question={faq.question}
                  answer={faq.answer}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:pb-24">
          <div
            data-reveal
            className="relative overflow-hidden rounded-[3rem] bg-primary px-6 py-16 text-center text-primary-foreground sm:py-20"
          >
            <div
              className="absolute -top-24 -right-24 size-72 rounded-full bg-white/10"
              aria-hidden
            />
            <div
              className="absolute -bottom-32 -left-16 size-80 rounded-full bg-white/10"
              aria-hidden
            />
            <div className="relative flex flex-col items-center gap-6">
              <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-balance sm:text-5xl">
                Příští schůze SVJ může dopadnout jinak
              </h2>
              <p className="max-w-md text-pretty opacity-90">
                Za pár minut budete vědět, kolik váš dům ušetří, koho ještě
                přesvědčit — a co sledovat, až renovace projde.
              </p>
              <Button
                size="lg"
                variant="secondary"
                asChild
                className="h-14 rounded-full px-8 text-base font-semibold"
              >
                <Link href={appHref}>Vyzkoušet zdarma</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-2">
            <Link href="/" className="flex items-center font-semibold">
              <img src="/reno-logo.svg" alt="Reno" className="h-12 w-auto rounded-lg" />
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">
              Od výpočtu úspor přes přesvědčení sousedů až po sledování průběhu
              rekonstrukce — vše na jednom místě.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 text-sm">
            <div className="flex flex-col gap-2">
              <p className="font-medium text-foreground">Aplikace</p>
              <Link
                href="/dashboard"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Dashboard
              </Link>
              <Link
                href="/onboarding"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Kalkulačka
              </Link>
              <Link
                href="/dashboard/exporty"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Exporty
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-medium text-foreground">Informace</p>
              <a
                href="#funkce"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Funkce
              </a>
              <a
                href="#jak-to-funguje"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Jak to funguje
              </a>
              <a
                href="#faq"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Časté dotazy
              </a>
            </div>
          </div>
        </div>
        <div className="border-t">
          <p className="mx-auto w-full max-w-6xl px-4 py-4 text-xs text-muted-foreground sm:px-6">
            © 2026 Noodles. Uvedené výpočty jsou orientační a nenahrazují
            projektovou dokumentaci ani odborné posouzení.
          </p>
        </div>
      </footer>
    </div>
  )
}
