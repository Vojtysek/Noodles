"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight, Building2, Check, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const heroBenefits = [
  "Spočítejte úspory energií a návratnost",
  "Argumenty a podpora sousedů pro hlasování",
  "Od prvního nápadu po schválení na schůzi SVJ",
];

const stats = [
  { value: 4, suffix: "", label: "typy renovací v plánu" },
  { value: 40, suffix: " %", label: "tepla může ušetřit zateplení fasády" },
  { value: 50, suffix: " %", label: "nákladů může pokrýt dotace NZÚ" },
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
    savings: "−35 %",
    payback: "11 let",
    status: "K hlasování",
    pill: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  {
    name: "Výměna oken",
    cost: "2 100 000 Kč",
    savings: "−15 %",
    payback: "12 let",
    status: "Plánování",
    pill: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  {
    name: "Rekonstrukce střechy",
    cost: "1 600 000 Kč",
    savings: "−10 %",
    payback: "13 let",
    status: "Plánování",
    pill: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  {
    name: "Modernizace výtahu",
    cost: "1 900 000 Kč",
    savings: "—",
    payback: "—",
    status: "Sbíráme podporu",
    pill: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  },
];

const faqs = [
  {
    question: "Co je Noodles?",
    answer:
      "Noodles je aplikace, která pomáhá renovace bytových domů nejen naplánovat, ale hlavně prosadit. Spočítá náklady a úspory, sleduje názory rezidentů a připraví vás s argumenty na hlasování SVJ.",
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

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

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
          className={`text-muted-foreground size-4 shrink-0 transition-transform duration-300 ease-out ${
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
          <p className="text-muted-foreground pt-3 text-sm">{answer}</p>
        </div>
      </div>
    </div>
  );
}

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
          .from("[data-hero-card]", { y: 40, autoAlpha: 0, duration: 0.7 }, 1.2)
          .from(
            "[data-hero-bar]",
            { scaleX: 0, transformOrigin: "left center", duration: 0.9, ease: "power3.out" },
            1.6
          );

        // Blob percentage counts up as the blob lands (synced with its entrance)
        const blobNum = document.querySelector<HTMLElement>("[data-blob-count]");
        if (blobNum) {
          const blobCounter = { value: 0 };
          tl.to(
            blobCounter,
            {
              value: 40,
              duration: 1.4,
              ease: "power2.out",
              onUpdate() {
                blobNum.textContent = String(Math.round(blobCounter.value));
              },
            },
            0.95
          );
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
        });

        // The corner cards drift gently after they land
        gsap.to("[data-hero-blob]", {
          y: -10,
          duration: 3.2,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: 2,
        });
        gsap.to("[data-hero-card]", {
          y: -8,
          duration: 2.6,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: 2.2,
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

        // Count-up numbers (supports decimals via data-decimals, Czech comma)
        gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
          const target = parseFloat(el.dataset.count ?? "0");
          const suffix = el.dataset.suffix ?? "";
          const decimals = Number(el.dataset.decimals ?? 0);
          const counter = { value: 0 };
          gsap.to(counter, {
            value: target,
            duration: 1.6,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 85%" },
            onUpdate() {
              el.textContent = `${counter.value.toFixed(decimals).replace(".", ",")}${suffix}`;
            },
          });
        });

        // Segmented bars fill from the left
        gsap.utils.toArray<HTMLElement>("[data-fill-bar]").forEach((bar) => {
          gsap.from(bar.children, {
            scaleX: 0,
            transformOrigin: "left center",
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.12,
            scrollTrigger: { trigger: bar, start: "top 85%" },
          });
        });

        // Chart bars grow from the baseline
        gsap.utils.toArray<HTMLElement>("[data-bar-chart]").forEach((chart) => {
          gsap.from(chart.querySelectorAll("[data-bar]"), {
            scaleY: 0,
            transformOrigin: "bottom center",
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.08,
            scrollTrigger: { trigger: chart, start: "top 85%" },
          });
        });

        // Avatars pop in one by one
        gsap.utils.toArray<HTMLElement>("[data-avatar-row]").forEach((row) => {
          gsap.from(row.children, {
            scale: 0,
            duration: 0.5,
            ease: "back.out(2)",
            stagger: 0.07,
            scrollTrigger: { trigger: row, start: "top 85%" },
          });
        });

        // Chat bubbles arrive like a real conversation
        gsap.utils.toArray<HTMLElement>("[data-chat]").forEach((chat) => {
          gsap.from(chat.children, {
            y: 12,
            autoAlpha: 0,
            duration: 0.5,
            ease: "power2.out",
            stagger: 0.35,
            scrollTrigger: { trigger: chat, start: "top 85%" },
          });
        });

        // Draw the curved progress line through the steps
        const stepsLine = document.querySelector<SVGPathElement>("[data-steps-line]");
        if (stepsLine) {
          const length = stepsLine.getTotalLength();
          gsap.set(stepsLine, { strokeDasharray: length, strokeDashoffset: length });
          gsap.to(stepsLine, {
            strokeDashoffset: 0,
            duration: 1.4,
            ease: "power2.inOut",
            scrollTrigger: { trigger: "[data-steps]", start: "top 70%" },
          });
        }
      });
    },
    { scope: root }
  );

  return (
    <div ref={root} className="flex min-h-svh flex-col">
      {/* Hero — full-bleed photo tapering off at the bottom */}
      <section data-hero className="relative">
        <div className="relative isolate min-h-[94svh] overflow-hidden rounded-b-[2.5rem] sm:rounded-b-[4rem] lg:rounded-bl-[4rem] lg:rounded-br-[10rem]">
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
            className="bg-primary text-primary-foreground absolute top-32 right-8 z-10 hidden w-60 flex-col gap-3 rounded-[2.5rem] p-8 shadow-2xl lg:flex xl:right-16"
          >
            <p className="text-7xl leading-none font-bold tracking-tight">
              <span data-blob-count>40</span>
              <span className="align-top text-3xl">%</span>
            </p>
            <p className="text-sm leading-snug text-pretty opacity-90">
              tepla může ušetřit zateplení fasády staršího domu
            </p>
          </div>

          {/* Floating product card — heating costs before/after, dark glass */}
          <div
            data-hero-card
            className="absolute right-8 bottom-12 z-10 hidden w-80 flex-col gap-4 rounded-2xl bg-zinc-950/70 p-5 text-white ring-1 ring-white/15 backdrop-blur-md lg:flex xl:right-16 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.6)]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white/70">
                Roční náklady domu na teplo
              </span>
              <span className="rounded-md bg-emerald-400/15 px-1.5 py-0.5 text-xs font-medium tabular-nums text-emerald-300">
                −35 %
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-3">
                <span className="w-9 shrink-0 text-[11px] text-white/50">Dnes</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-full rounded-full bg-white/35" />
                </div>
                <span className="w-16 shrink-0 text-right text-xs tabular-nums text-white/70">
                  600 tis. Kč
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-9 shrink-0 text-[11px] text-white/50">Potom</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    data-hero-bar
                    className="h-full w-[65%] rounded-full bg-emerald-400"
                  />
                </div>
                <span className="w-16 shrink-0 text-right text-xs font-medium tabular-nums text-emerald-300">
                  390 tis. Kč
                </span>
              </div>
            </div>
            <p className="text-xs text-pretty text-white/60">
              Úspora{" "}
              <span className="font-semibold text-emerald-300">210 000 Kč ročně</span> po
              zateplení fasády domu s 24 byty
            </p>
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
              Spočítat je snadné. Přesvědčit je těžší.
            </h2>
            <p className="text-muted-foreground mt-3 text-lg text-pretty">
              Renovace neztroskotá na číslech, ale na schůzi. Noodles vám dá čísla, argumenty
              i přehled o tom, koho ještě musíte získat.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {/* Rezidenti — anchor card with inset product viewport */}
            <div
              data-reveal
              className="bg-card flex flex-col rounded-2xl p-7 ring-1 ring-black/[0.06] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_32px_-16px_rgba(16,24,40,0.14)] md:col-span-2 md:row-span-2 dark:ring-white/[0.06]"
            >
              <p className="text-primary text-xs font-medium tracking-wider uppercase">
                Rezidenti
              </p>
              <h3 className="mt-1.5 text-xl font-semibold tracking-tight">
                Víte, kdo bude na schůzi proti — dřív, než se tam postaví
              </h3>
              <p className="text-muted-foreground mt-2 max-w-md text-sm">
                AI z vašich poznámek pochopí námitky a motivace každého souseda, takže víte,
                s kým a o čem mluvit.
              </p>
              <div className="mt-6 flex flex-col">
                {[
                  {
                    initials: "MK",
                    color: "bg-emerald-500",
                    name: "Marek Kolář",
                    note: "„Hlavně ať se začne co nejdřív.“",
                    label: "Podporuje",
                    pill: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                  },
                  {
                    initials: "PV",
                    color: "bg-amber-500",
                    name: "Petra Veselá",
                    note: "„Nejdřív chci vidět návratnost.“",
                    label: "Váhá",
                    pill: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                  },
                  {
                    initials: "AH",
                    color: "bg-rose-500",
                    name: "Anna Horáková",
                    note: "„Bojím se zvýšení záloh.“",
                    label: "Proti",
                    pill: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
                  },
                ].map((resident) => (
                  <div
                    key={resident.initials}
                    className="border-border/40 flex items-center gap-3 border-b py-2.5 last:border-b-0"
                  >
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ${resident.color}`}
                    >
                      {resident.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{resident.name}</p>
                      <p className="text-muted-foreground truncate text-xs">{resident.note}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${resident.pill}`}
                    >
                      {resident.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="bg-primary/5 text-primary mt-3 rounded-lg px-3.5 py-2.5 text-xs leading-relaxed">
                ✦ AI tip: Anně ukažte rozpočet s fixními zálohami — její námitka je
                o cashflow, ne o renovaci samotné.
              </div>
              <div className="mt-auto pt-6">
                <div className="bg-muted/40 flex flex-col gap-4 rounded-xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] ring-1 ring-black/[0.04] ring-inset dark:shadow-none dark:ring-white/[0.04]">
                  <div className="flex items-center justify-between">
                    <div data-avatar-row className="flex -space-x-2">
                      {["JN", "MK", "PV", "AH", "TS"].map((initials, i) => (
                        <span
                          key={initials}
                          className={`border-background flex size-9 items-center justify-center rounded-full border-2 text-xs font-semibold text-white ${
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
                    <span
                      data-count="16"
                      data-suffix=" z 24 pro"
                      className="text-muted-foreground text-xs tabular-nums"
                    >
                      16 z 24 pro
                    </span>
                  </div>
                  <div className="bg-muted h-2.5 overflow-hidden rounded-full">
                    <div data-fill-bar className="flex h-full">
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
            </div>

            {/* AI asistent — live chat transcript */}
            <div
              data-reveal
              className="bg-card flex flex-col overflow-hidden rounded-2xl ring-1 ring-black/[0.06] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-12px_rgba(16,24,40,0.12)] dark:ring-white/[0.06]"
            >
              <div className="border-border/60 flex items-center gap-2 border-b px-5 py-3">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground text-xs font-medium">
                  AI asistent · online
                </span>
              </div>
              <div data-chat className="flex flex-1 flex-col gap-2.5 p-5 text-xs">
                <p className="bg-primary text-primary-foreground max-w-[88%] self-end rounded-2xl rounded-br-md px-3 py-2">
                  Soused tvrdí, že se zateplení nevyplatí. Co mu mám říct?
                </p>
                <p className="bg-muted max-w-[88%] self-start rounded-2xl rounded-bl-md px-3 py-2">
                  Při vašich nákladech na teplo ušetříte ~210 tis. Kč ročně. Tady jsou tři
                  argumenty…
                </p>
                <span className="bg-muted mt-0.5 flex gap-1 self-start rounded-2xl rounded-bl-md px-3 py-2.5">
                  <span className="bg-muted-foreground/50 size-1.5 animate-bounce rounded-full [animation-delay:0ms]" />
                  <span className="bg-muted-foreground/50 size-1.5 animate-bounce rounded-full [animation-delay:150ms]" />
                  <span className="bg-muted-foreground/50 size-1.5 animate-bounce rounded-full [animation-delay:300ms]" />
                </span>
              </div>
            </div>

            {/* Finanční přehled — edge-bleed chart with annotation */}
            <div
              data-reveal
              className="bg-card relative overflow-hidden rounded-2xl p-7 ring-1 ring-black/[0.06] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-12px_rgba(16,24,40,0.12)] dark:ring-white/[0.06]"
            >
              <p className="text-primary text-xs font-medium tracking-wider uppercase">
                Finance
              </p>
              <h3 className="mt-1.5 text-lg font-semibold tracking-tight">
                Víte, kdy se investice vrátí
              </h3>
              <div className="border-border/70 -mx-7 mt-6 border-t border-dashed px-7 pt-10">
                <div data-bar-chart className="border-border/60 flex h-24 items-end gap-1.5 border-b pb-px">
                  {[35, 55, 45, 70, 60, 85, 100].map((height, i) => (
                    <div key={i} className="relative flex h-full flex-1 items-end">
                      {i === 6 && (
                        <span className="bg-foreground text-background absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 rounded-md px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap">
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
              className="bg-card flex flex-col gap-8 rounded-2xl p-7 ring-1 ring-black/[0.06] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-12px_rgba(16,24,40,0.12)] md:col-span-3 md:flex-row md:items-center dark:ring-white/[0.06]"
            >
              <div className="md:max-w-sm md:flex-1">
                <p className="text-primary text-xs font-medium tracking-wider uppercase">
                  Kalkulačka
                </p>
                <h3 className="mt-1.5 text-lg font-semibold tracking-tight">
                  Čísla za minutu, ne za měsíc
                </h3>
                <p className="text-muted-foreground mt-2 text-sm">
                  Zadejte parametry domu a zjistíte orientační náklady, úspory a návratnost
                  jednotlivých renovací.
                </p>
              </div>
              <dl className="divide-border/60 grid flex-1 grid-cols-3 md:divide-x">
                <div className="flex flex-col gap-1 md:px-6 md:first:pl-0 md:last:pr-0">
                  <dt className="text-muted-foreground text-xs">Náklady</dt>
                  <dd className="text-lg font-semibold tabular-nums">
                    <span data-count="4.8" data-decimals="1" data-suffix=" mil. Kč">
                      4,8 mil. Kč
                    </span>
                  </dd>
                </div>
                <div className="flex flex-col gap-1 md:px-6">
                  <dt className="text-muted-foreground text-xs">Úspora ročně</dt>
                  <dd className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    <span data-count="210" data-suffix=" tis. Kč">
                      210 tis. Kč
                    </span>
                  </dd>
                </div>
                <div className="flex flex-col gap-1 md:px-6 md:last:pr-0">
                  <dt className="text-muted-foreground text-xs">Návratnost s dotací</dt>
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
              <p className="text-muted-foreground mt-3 text-lg">
                Tři kroky od nápadu ke schválené renovaci.
              </p>
            </div>
            <div data-steps className="relative">
              {/* Curved line through the pip centers — dashed track + solid fill */}
              <svg
                className="text-primary pointer-events-none absolute -top-4 left-0 hidden h-20 w-full md:block"
                viewBox="0 0 1200 80"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  className="text-border"
                  d="M 189 40 C 320 6, 470 6, 600 40 C 730 6, 880 6, 1011 40"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="2 8"
                  strokeLinecap="round"
                />
                <path
                  data-steps-line
                  d="M 189 40 C 320 6, 470 6, 600 40 C 730 6, 880 6, 1011 40"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
              <div className="relative grid gap-12 md:grid-cols-3 md:gap-8">
                {steps.map((step, index) => (
                  <div
                    key={step.title}
                    data-reveal
                    className="flex flex-col items-center gap-3 text-center"
                  >
                    <span className="bg-primary text-primary-foreground ring-background shadow-primary/30 relative z-10 flex size-12 items-center justify-center rounded-full text-lg font-semibold shadow-lg ring-4">
                      {index + 1}
                    </span>
                    <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                    <p className="text-muted-foreground max-w-xs text-sm">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Project examples */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <div data-reveal className="mb-12 max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              Jaké renovace s námi naplánujete a prosadíte
            </h2>
            <p className="text-muted-foreground mt-3 text-lg text-pretty">
              Ukázka projektů z typického bytového domu. Čísla jsou orientační — ta vaše si
              spočítáte v kalkulačce.
            </p>
          </div>
          <div
            data-reveal
            className="bg-card overflow-hidden rounded-2xl ring-1 ring-black/[0.06] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-12px_rgba(16,24,40,0.12)] dark:ring-white/[0.06]"
          >
            <div className="border-border/60 bg-muted/30 flex items-center justify-between border-b px-6 py-3.5">
              <p className="text-sm font-semibold tracking-tight">Bělohorská 1042/18</p>
              <p className="text-muted-foreground text-xs">
                4 projekty · <span className="tabular-nums">24</span> jednotek
              </p>
            </div>
            <div className="text-muted-foreground border-border/60 hidden grid-cols-[1.6fr_1fr_1fr_0.8fr_8.5rem] gap-4 border-b px-6 py-2.5 text-xs md:grid">
              <span>Projekt</span>
              <span className="text-right">Náklady</span>
              <span className="text-right">Úspora tepla</span>
              <span className="text-right">Návratnost*</span>
              <span className="text-right">Stav</span>
            </div>
            {projects.map((project) => (
              <div
                key={project.name}
                className="border-border/40 hover:bg-muted/30 flex flex-col gap-3 border-b px-6 py-4 transition-colors last:border-b-0 md:grid md:grid-cols-[1.6fr_1fr_1fr_0.8fr_8.5rem] md:items-center md:gap-4"
              >
                <div className="flex items-center justify-between md:contents">
                  <h3 className="text-sm font-medium tracking-tight">{project.name}</h3>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium md:hidden ${project.pill}`}
                  >
                    {project.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 md:contents">
                  <div className="md:text-right">
                    <p className="text-muted-foreground text-[11px] md:hidden">Náklady</p>
                    <p className="text-sm tabular-nums">{project.cost}</p>
                  </div>
                  <div className="md:text-right">
                    <p className="text-muted-foreground text-[11px] md:hidden">Úspora</p>
                    <p
                      className={`text-sm tabular-nums ${
                        project.savings !== "—"
                          ? "font-medium text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {project.savings}
                    </p>
                  </div>
                  <div className="md:text-right">
                    <p className="text-muted-foreground text-[11px] md:hidden">Návratnost</p>
                    <p
                      className={`text-sm tabular-nums ${
                        project.payback === "—" ? "text-muted-foreground" : "font-medium"
                      }`}
                    >
                      {project.payback}
                    </p>
                  </div>
                </div>
                <span
                  className={`hidden shrink-0 justify-self-end rounded-full px-2 py-0.5 text-[11px] font-medium md:inline-flex ${project.pill}`}
                >
                  {project.status}
                </span>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground mt-3 px-1 text-xs">
            * Návratnost při využití dotace Nová zelená úsporám (až 50 % způsobilých výdajů) a
            ročních nákladech domu na teplo ~600 tis. Kč.
          </p>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t">
          <div className="mx-auto w-full max-w-3xl scroll-mt-8 px-4 py-16 sm:px-6 lg:py-24">
            <div data-reveal className="mb-10">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Časté dotazy</h2>
            </div>
            <div className="flex flex-col gap-3">
              {faqs.map((faq) => (
                <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
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
                Příští schůze SVJ může dopadnout jinak
              </h2>
              <p className="max-w-md text-pretty opacity-90">
                Za pár minut budete vědět, kolik váš dům ušetří — a s čím přesvědčíte
                i ty, kteří váhají.
              </p>
              <Button
                size="lg"
                variant="secondary"
                asChild
                className="h-14 rounded-full px-8 text-base font-semibold"
              >
                <Link href="/dashboard">Vyzkoušet zdarma</Link>
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
              Naplánujte renovaci bytového domu a získejte pro ni podporu celého SVJ —
              s čísly a argumenty, kterým rozumí každý soused.
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
