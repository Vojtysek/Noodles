"use client";

import { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Building2,
  Calculator,
  ChartLine,
  Check,
  ChevronDown,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const heroBenefits = [
  "Spočítejte úspory energií a návratnost",
  "Získejte podporu sousedů pro hlasování",
  "Od prvního nápadu po schválení na schůzi",
];

const stats = [
  { value: 4, suffix: "", label: "typy renovací v plánu" },
  { value: 32, suffix: " %", label: "průměrná úspora energií" },
  { value: 8, suffix: " let", label: "typická návratnost investice" },
  { value: 24, suffix: "", label: "bytových jednotek v domě" },
];

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
      "Sledujte podporu rezidentů, připravte si argumenty s AI asistentem a přijďte na schůzi SVJ připraveni.",
  },
];

const projects = [
  {
    name: "Zateplení fasády",
    cost: "4 800 000 Kč",
    savings: "18 %",
    payback: "9 let",
    status: "Připraveno k hlasování",
    dot: "bg-emerald-500",
  },
  {
    name: "Výměna oken",
    cost: "2 100 000 Kč",
    savings: "11 %",
    payback: "7 let",
    status: "Ve fázi plánování",
    dot: "bg-amber-500",
  },
  {
    name: "Rekonstrukce střechy",
    cost: "1 600 000 Kč",
    savings: "6 %",
    payback: "11 let",
    status: "Ve fázi plánování",
    dot: "bg-amber-500",
  },
  {
    name: "Modernizace výtahu",
    cost: "1 900 000 Kč",
    savings: "—",
    payback: "—",
    status: "Sbíráme podporu",
    dot: "bg-rose-500",
  },
];

const faqs = [
  {
    question: "Co je Noodles?",
    answer:
      "Noodles je aplikace pro plánování renovací bytových domů. Pomůže vám spočítat náklady a úspory, sledovat názory rezidentů a připravit se na hlasování SVJ.",
  },
  {
    question: "Pro koho je aplikace určená?",
    answer:
      "Pro výbory SVJ, aktivní rezidenty a správce bytových domů, kteří chtějí renovaci dotáhnout od prvního nápadu až po schválení na schůzi.",
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
      "Ke každému rezidentovi si zapíšete, jak se k renovaci staví. AI z vašich poznámek vytvoří profil s námitkami a motivacemi, takže víte, s kým a o čem mluvit.",
  },
];

export default function Page() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Hero entrance
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.from("[data-hero-img]", { scale: 1.12, duration: 1.8, ease: "power2.out" }, 0)
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
          .from("[data-hero-card]", { y: 40, autoAlpha: 0, duration: 0.7 }, 1.2);

        // Subtle parallax on the hero photo
        gsap.to("[data-hero-img]", {
          yPercent: 8,
          ease: "none",
          scrollTrigger: {
            trigger: "[data-hero]",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });

        // Scroll reveals
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          gsap.from(el, {
            y: 36,
            autoAlpha: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 85%" },
          });
        });

        // Count-up stats
        gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
          const target = parseFloat(el.dataset.count ?? "0");
          const suffix = el.dataset.suffix ?? "";
          const counter = { value: 0 };
          gsap.to(counter, {
            value: target,
            duration: 1.6,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 85%" },
            onUpdate() {
              el.textContent = `${Math.round(counter.value)}${suffix}`;
            },
          });
        });
      });
    },
    { scope: root }
  );

  return (
    <div ref={root} className="flex min-h-svh flex-col">
      {/* Hero — full-bleed photo tapering off at the bottom */}
      <section data-hero className="relative">
        <div className="relative min-h-[94svh] overflow-hidden rounded-b-[2.5rem] sm:rounded-b-[4rem] lg:rounded-bl-[4rem] lg:rounded-br-[10rem]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            data-hero-img
            src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2400&auto=format&fit=crop"
            alt="Bytový dům"
            className="absolute -top-[8%] left-0 h-[116%] w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/70 to-transparent" />

          {/* Floating pill navbar */}
          <header data-hero-nav className="absolute inset-x-0 top-0 z-20 px-4 pt-5 sm:px-6">
            <div className="bg-background/95 mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 rounded-full py-2 pr-2 pl-5 shadow-lg backdrop-blur">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-full">
                  <Building2 className="size-4" />
                </span>
                Noodles
              </Link>
              <nav className="text-muted-foreground hidden items-center gap-6 text-sm md:flex">
                <a href="#funkce" className="hover:text-foreground transition-colors">
                  Funkce
                </a>
                <a href="#jak-to-funguje" className="hover:text-foreground transition-colors">
                  Jak to funguje
                </a>
                <a href="#faq" className="hover:text-foreground transition-colors">
                  Časté dotazy
                </a>
              </nav>
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild className="hidden rounded-full sm:inline-flex">
                  <Link href="/calculator">Kalkulačka</Link>
                </Button>
                <Button asChild className="h-10 rounded-full px-5">
                  <Link href="/dashboard">Otevřít aplikaci</Link>
                </Button>
              </div>
            </div>
          </header>

          {/* Hero content */}
          <div className="relative z-10 mx-auto flex min-h-[94svh] w-full max-w-6xl flex-col justify-center gap-8 px-6 pt-32 pb-28 sm:px-8">
            <h1 className="max-w-3xl text-5xl leading-[1.08] font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              <span data-hero-line className="block overflow-hidden">
                <span className="block">Jednoduché</span>
              </span>
              <span data-hero-line className="block overflow-hidden">
                <span className="block">plánování renovací</span>
              </span>
              <span data-hero-line className="block overflow-hidden">
                <span className="block">vašeho domu</span>
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
            <div data-hero-cta className="flex items-center gap-1.5">
              <Button
                asChild
                className="h-14 rounded-full px-8 text-base font-semibold shadow-xl"
              >
                <Link href="/dashboard">Vyzkoušet zdarma</Link>
              </Button>
              <Button asChild className="size-14 rounded-full shadow-xl">
                <Link href="/dashboard" aria-label="Vyzkoušet zdarma">
                  <ArrowUpRight className="size-6" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Oversized stat blob */}
          <div
            data-hero-blob
            className="bg-primary text-primary-foreground absolute top-32 right-8 z-10 hidden max-w-72 items-start gap-3 rounded-[3rem] p-8 shadow-2xl lg:flex xl:right-16"
          >
            <p className="text-7xl leading-none font-bold tracking-tight">
              32<span className="align-top text-3xl">%</span>
            </p>
            <p className="pt-1 text-sm leading-snug opacity-90">
              průměrná úspora energií po renovaci
            </p>
          </div>

          {/* Floating product card */}
          <div
            data-hero-card
            className="bg-background absolute right-8 bottom-12 z-10 hidden w-80 flex-col gap-3 rounded-2xl p-5 shadow-2xl lg:flex xl:right-16"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">Zateplení fasády</span>
              <span className="text-muted-foreground text-xs">podpora 16 z 24</span>
            </div>
            <div className="bg-muted h-2 overflow-hidden rounded-full">
              <div className="flex h-full">
                <div className="w-[67%] bg-emerald-500" />
                <div className="w-[21%] bg-amber-500" />
                <div className="w-[12%] bg-rose-500" />
              </div>
            </div>
            <div className="text-muted-foreground flex items-center justify-between text-xs">
              <span>Návratnost 9 let</span>
              <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                −18 % energií
              </span>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1">
        {/* Stats band with count-up */}
        <section className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-y-10 px-4 py-16 sm:px-6 lg:grid-cols-4 lg:py-20">
          {stats.map((stat) => (
            <div key={stat.label} data-reveal className="flex flex-col items-center gap-1 text-center">
              <p
                data-count={stat.value}
                data-suffix={stat.suffix}
                className="text-5xl font-bold tracking-tight"
              >
                {stat.value}
                {stat.suffix}
              </p>
              <p className="text-muted-foreground text-sm">{stat.label}</p>
            </div>
          ))}
        </section>

        {/* Features — bento grid */}
        <section id="funkce" className="mx-auto w-full max-w-6xl scroll-mt-8 px-4 py-16 sm:px-6 lg:py-24">
          <div data-reveal className="mb-12 max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              Vše pro renovaci na jednom místě
            </h2>
            <p className="text-muted-foreground mt-3 text-lg text-pretty">
              Žádné tabulky v Excelu ani nekonečné e-maily. Noodles drží čísla, lidi i plány
              pohromadě.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Rezidenti — wide card with sentiment visual */}
            <div
              data-reveal
              className="bg-muted/30 flex flex-col justify-between gap-6 rounded-3xl border p-7 md:col-span-2"
            >
              <div className="flex flex-col gap-3">
                <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                  <Users className="size-5" />
                </span>
                <h3 className="text-lg font-semibold">Rezidenti</h3>
                <p className="text-muted-foreground max-w-md text-sm">
                  Mějte přehled o tom, kdo renovaci podporuje, kdo váhá a kdo je proti. AI vám
                  pomůže pochopit námitky a motivace každého souseda.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex -space-x-2">
                  {["JN", "MK", "PV", "AH", "TS"].map((initials, i) => (
                    <span
                      key={initials}
                      className={`flex size-9 items-center justify-center rounded-full border-2 border-background text-xs font-semibold text-white ${
                        ["bg-emerald-500", "bg-emerald-600", "bg-amber-500", "bg-rose-500", "bg-emerald-500"][i]
                      }`}
                    >
                      {initials}
                    </span>
                  ))}
                  <span className="bg-muted text-muted-foreground border-background flex size-9 items-center justify-center rounded-full border-2 text-xs font-medium">
                    +19
                  </span>
                </div>
                <div className="bg-muted h-2.5 overflow-hidden rounded-full">
                  <div className="flex h-full">
                    <div className="w-[67%] bg-emerald-500" />
                    <div className="w-[21%] bg-amber-500" />
                    <div className="w-[12%] bg-rose-500" />
                  </div>
                </div>
                <div className="text-muted-foreground flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    Podporuje
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-amber-500" />
                    Váhá
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-rose-500" />
                    Proti
                  </span>
                </div>
              </div>
            </div>

            {/* AI asistent — chat bubbles */}
            <div data-reveal className="bg-muted/30 flex flex-col gap-6 rounded-3xl border p-7">
              <div className="flex flex-col gap-3">
                <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                  <Bot className="size-5" />
                </span>
                <h3 className="text-lg font-semibold">AI asistent</h3>
                <p className="text-muted-foreground text-sm">
                  Zeptejte se na cokoliv — od technických detailů po argumenty na schůzi SVJ.
                </p>
              </div>
              <div className="mt-auto flex flex-col gap-2 text-xs">
                <p className="bg-primary text-primary-foreground max-w-[85%] self-end rounded-2xl rounded-br-sm px-3 py-2">
                  Vyplatí se nám zateplit fasádu?
                </p>
                <p className="bg-muted max-w-[85%] self-start rounded-2xl rounded-bl-sm px-3 py-2">
                  Při vašich nákladech na teplo ušetříte ~530 tis. Kč ročně…
                </p>
              </div>
            </div>

            {/* Finanční přehled — mini bar chart */}
            <div data-reveal className="bg-muted/30 flex flex-col gap-6 rounded-3xl border p-7">
              <div className="flex flex-col gap-3">
                <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                  <ChartLine className="size-5" />
                </span>
                <h3 className="text-lg font-semibold">Finanční přehled</h3>
                <p className="text-muted-foreground text-sm">
                  Rozpočty, cashflow a úspory na jednom místě. Víte, kdy se vám investice vrátí.
                </p>
              </div>
              <div className="mt-auto flex h-20 items-end gap-2">
                {[35, 55, 45, 70, 60, 85, 100].map((height, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-md ${i >= 5 ? "bg-primary" : "bg-primary/25"}`}
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Kalkulačka — wide card with sample row */}
            <div
              data-reveal
              className="bg-muted/30 flex flex-col justify-between gap-6 rounded-3xl border p-7 md:col-span-2"
            >
              <div className="flex flex-col gap-3">
                <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                  <Calculator className="size-5" />
                </span>
                <h3 className="text-lg font-semibold">Kalkulačka renovací</h3>
                <p className="text-muted-foreground max-w-md text-sm">
                  Zadejte parametry domu a během minuty zjistíte orientační náklady, úspory a
                  návratnost jednotlivých renovací.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="bg-background rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs">Náklady</p>
                  <p className="font-mono font-semibold">4,8 mil. Kč</p>
                </div>
                <div className="bg-background rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs">Úspora ročně</p>
                  <p className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    530 tis. Kč
                  </p>
                </div>
                <div className="bg-background rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs">Návratnost</p>
                  <p className="font-mono font-semibold">9 let</p>
                </div>
              </div>
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
              <p className="text-muted-foreground mt-3 text-lg">
                Tři kroky od nápadu ke schválené renovaci.
              </p>
            </div>
            <div className="grid gap-10 md:grid-cols-3 md:gap-8">
              {steps.map((step, index) => (
                <div key={step.title} data-reveal className="relative flex flex-col gap-3 pt-10">
                  <span
                    className="text-foreground/[7%] pointer-events-none absolute -top-4 left-0 text-8xl font-bold select-none"
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Project examples */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <div data-reveal className="mb-12 max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              Jaké renovace s námi naplánujete
            </h2>
            <p className="text-muted-foreground mt-3 text-lg text-pretty">
              Ukázka projektů z typického bytového domu. Čísla jsou orientační — ta vaše si
              spočítáte v kalkulačce.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {projects.map((project) => (
              <div
                key={project.name}
                data-reveal
                className="bg-card flex flex-col gap-5 rounded-3xl border p-6 transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-lg"
              >
                <div className="flex flex-col gap-2">
                  <p className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
                    <span className={`size-2 rounded-full ${project.dot}`} />
                    {project.status}
                  </p>
                  <h3 className="text-lg font-semibold">{project.name}</h3>
                </div>
                <dl className="mt-auto flex flex-col gap-2 border-t pt-4 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Náklady</dt>
                    <dd className="font-mono font-medium">{project.cost}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Úspora energií</dt>
                    <dd className="font-mono font-medium">{project.savings}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Návratnost</dt>
                    <dd className="font-mono font-medium">{project.payback}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t">
          <div className="mx-auto w-full max-w-3xl scroll-mt-8 px-4 py-16 sm:px-6 lg:py-24">
            <div data-reveal className="mb-10">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Časté dotazy</h2>
            </div>
            <div className="flex flex-col gap-3">
              {faqs.map((faq) => (
                <details key={faq.question} data-reveal className="group rounded-2xl border px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <ChevronDown className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="text-muted-foreground mt-3 text-sm">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:pb-24">
          <div
            data-reveal
            className="bg-primary text-primary-foreground relative overflow-hidden rounded-[3rem] px-6 py-16 text-center sm:py-20"
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
                Začněte plánovat renovaci ještě dnes
              </h2>
              <p className="max-w-md text-pretty opacity-90">
                Stačí pár minut a uvidíte, kolik váš dům může ušetřit.
              </p>
              <Button
                size="lg"
                variant="secondary"
                asChild
                className="h-14 rounded-full px-8 text-base font-semibold"
              >
                <Link href="/dashboard">
                  Vyzkoušet zdarma
                  <ArrowRight data-icon="inline-end" className="size-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-2">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-full">
                <Building2 className="size-4" />
              </span>
              Noodles
            </Link>
            <p className="text-muted-foreground max-w-xs text-sm">
              Plánování renovací bytových domů — jednoduše a s čísly, kterým rozumí celé SVJ.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 text-sm">
            <div className="flex flex-col gap-2">
              <p className="text-foreground font-medium">Aplikace</p>
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <Link href="/calculator" className="text-muted-foreground hover:text-foreground transition-colors">
                Kalkulačka
              </Link>
              <Link href="/chat" className="text-muted-foreground hover:text-foreground transition-colors">
                AI asistent
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-foreground font-medium">Informace</p>
              <a href="#funkce" className="text-muted-foreground hover:text-foreground transition-colors">
                Funkce
              </a>
              <a href="#jak-to-funguje" className="text-muted-foreground hover:text-foreground transition-colors">
                Jak to funguje
              </a>
              <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">
                Časté dotazy
              </a>
            </div>
          </div>
        </div>
        <div className="border-t">
          <p className="text-muted-foreground mx-auto w-full max-w-6xl px-4 py-4 text-xs sm:px-6">
            © 2026 Noodles. Uvedené výpočty jsou orientační a nenahrazují projektovou dokumentaci
            ani odborné posouzení.
          </p>
        </div>
      </footer>
    </div>
  );
}
