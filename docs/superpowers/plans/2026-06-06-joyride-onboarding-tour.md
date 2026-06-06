# Joyride Onboarding Tour Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 9-step Czech-language react-joyride tour that triggers once on first login and walks users through every section of the Noodles dashboard.

**Architecture:** A single `JoyrideTour` client component is mounted inside `DashboardLayout`. It reads/writes a `localStorage` key (`noodles_tour_seen`) to gate first-login display. Tour targets are wired via `data-joyride="X"` attributes sprinkled on existing sidebar nav links and Přehled page sections; steps that target optional elements (harmonogram, benefits — only visible when a building plan exists) use `disableBeacon: true` so joyride floats them gracefully when the DOM node is absent.

**Tech Stack:** Next.js 16 / React 19, react-joyride v3, TypeScript, Tailwind CSS

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Install | — | add react-joyride to dependencies |
| **Create** | `components/dashboard/joyride-tour.tsx` | All tour logic, steps, locale strings |
| **Modify** | `app/dashboard/layout.tsx` | Mount `<JoyrideTour />` |
| **Modify** | `components/dashboard/sidebar.tsx` | Add `data-joyride` attrs to 5 nav links |
| **Modify** | `app/dashboard/prehled/page.tsx` | Add `data-joyride` attrs to hero, harmonogram card, benefits card |

---

## Task 1: Install react-joyride

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install the package**

```bash
cd /Users/simon/Documents/repos/Noodles
npm install react-joyride
```

Expected output: `added 1 package` (or similar), no errors.

- [ ] **Step 2: Verify types are bundled**

```bash
ls node_modules/react-joyride/types 2>/dev/null || echo "types bundled in index.d.ts"
cat node_modules/react-joyride/package.json | grep '"types"'
```

react-joyride ships its own types — no `@types/react-joyride` needed.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install react-joyride"
```

---

## Task 2: Add `data-joyride` attributes to the sidebar

**Files:**
- Modify: `components/dashboard/sidebar.tsx`

The sidebar `NAV_ITEMS` array drives all 5 nav links. Each `<Link>` needs a `data-joyride` attribute so the tour can target it.

- [ ] **Step 1: Open the sidebar and locate the nav link render**

File: `components/dashboard/sidebar.tsx`, around line 96–124. The relevant section is:

```tsx
{NAV_ITEMS.map((item, i) => {
  const active = pathname.startsWith(item.href)
  return (
    <Link
      key={item.href}
      href={item.href}
      // ...
    >
```

- [ ] **Step 2: Add `data-joyride` to NAV_ITEMS entries**

Replace the `NAV_ITEMS` array definition (lines 23–29) with:

```tsx
const NAV_ITEMS = [
  { href: "/dashboard/prehled", label: "Přehled", icon: House, joyrideId: "nav-prehled" },
  { href: "/dashboard/rezidenti", label: "Rezidenti", icon: Users, joyrideId: "nav-rezidenti" },
  { href: "/dashboard/financials", label: "Finance", icon: ChartColumn, joyrideId: "nav-finance" },
  { href: "/dashboard/projects", label: "Projekty", icon: Hammer, joyrideId: "nav-projekty" },
  { href: "/dashboard/exporty", label: "Exporty", icon: FileDown, joyrideId: "nav-exporty" },
]
```

- [ ] **Step 3: Pass `data-joyride` to each Link element**

In the `.map()` body, add `data-joyride={item.joyrideId}` to the `<Link>`:

```tsx
<Link
  key={item.href}
  href={item.href}
  data-joyride={item.joyrideId}
  className={cn(
    "sb-item-in relative flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-sm transition-all duration-200",
    active
      ? "bg-sidebar-primary/10 font-medium text-sidebar-foreground shadow-sm"
      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
  )}
  style={{ "--sb-i": 2 + i } as React.CSSProperties}
>
```

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/sidebar.tsx
git commit -m "feat(tour): add data-joyride attrs to sidebar nav links"
```

---

## Task 3: Add `data-joyride` attributes to Přehled page

**Files:**
- Modify: `app/dashboard/prehled/page.tsx`

Three elements need targeting: the hero photo strip, the harmonogram card, and the benefits card.

- [ ] **Step 1: Tag the hero section**

In `app/dashboard/prehled/page.tsx`, find the outer hero `<div>` (around line 541, has `data-pr-header` and class `relative isolate min-h-...`). Add `data-joyride="prehled-hero"`:

```tsx
<div
  data-pr-header
  data-joyride="prehled-hero"
  className="relative isolate min-h-[15rem] overflow-hidden rounded-[2rem] rounded-br-[5rem] sm:min-h-[17rem]"
>
```

- [ ] **Step 2: Tag the harmonogram card**

Find the harmonogram card `<div>` (around line 786, has `data-pr-reveal` and contains `<Harmonogram`). Add `data-joyride="prehled-harmonogram"`:

```tsx
<div
  data-pr-reveal
  data-joyride="prehled-harmonogram"
  className="relative overflow-hidden rounded-2xl border bg-background/60 p-4 backdrop-blur-sm sm:p-5"
>
```

- [ ] **Step 3: Tag the benefits card**

Find the benefits outer `<div>` (around line 803, wraps `Zlepšení kvality života`). Add `data-joyride="prehled-benefits"`:

```tsx
<div
  data-pr-reveal
  data-joyride="prehled-benefits"
  className="relative overflow-hidden rounded-2xl border bg-background/60 p-4 backdrop-blur-sm sm:p-5"
>
```

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/prehled/page.tsx
git commit -m "feat(tour): add data-joyride attrs to Přehled page sections"
```

---

## Task 4: Create the JoyrideTour component

**Files:**
- Create: `components/dashboard/joyride-tour.tsx`

This is the core component. It imports `Joyride` from `react-joyride`, defines the 9 steps, handles first-login gating via `localStorage`, and applies Czech locale strings.

- [ ] **Step 1: Create the file with the full implementation**

Create `components/dashboard/joyride-tour.tsx`:

```tsx
"use client"

import { useEffect, useState } from "react"
import Joyride, { type CallBackProps, STATUS, type Step } from "react-joyride"

const STORAGE_KEY = "noodles_tour_seen"

const STEPS: Step[] = [
  {
    target: "body",
    placement: "center",
    disableBeacon: true,
    title: "Vítejte v Noodles",
    content:
      "Ukážeme vám základy aplikace za méně než minutu. Můžete kdykoli přeskočit.",
  },
  {
    target: '[data-joyride="nav-prehled"]',
    disableBeacon: true,
    title: "Přehled",
    content:
      "Váš hlavní rozcestník — klíčové metriky budovy, srovnání scénářů s rekonstrukcí a bez ní a přehled investice.",
  },
  {
    target: '[data-joyride="prehled-hero"]',
    disableBeacon: true,
    title: "Základní informace budovy",
    content:
      "Energetická třída, počet bytových jednotek, odhadovaná měsíční splátka na byt a roční úspora na energiích — vše na jednom místě.",
  },
  {
    target: '[data-joyride="prehled-harmonogram"]',
    disableBeacon: true,
    title: "Harmonogram",
    content:
      "Časová osa rekonstrukcí pro vybraný scénář — vidíte pořadí projektů, délku každé fáze a celkový termín dokončení.",
  },
  {
    target: '[data-joyride="prehled-benefits"]',
    disableBeacon: true,
    title: "Přínosy",
    content:
      "Nefinanční přínosy rekonstrukcí rozdělené do kategorií: komfort, zdraví, hodnota nemovitosti, bezpečnost a další — argumenty do diskuse se sousedy.",
  },
  {
    target: '[data-joyride="nav-rezidenti"]',
    disableBeacon: true,
    title: "Rezidenti",
    content:
      "Připravte si argumenty ještě před schůzí SVJ. Vyberte typ souseda (archetyp) nebo si vytvořte vlastní personu — AI pak vygeneruje argumentační strategii šitou na míru danému scénáři rekonstrukce.",
  },
  {
    target: '[data-joyride="nav-finance"]',
    disableBeacon: true,
    title: "Finance",
    content:
      "Detailní finanční model: rozpady nákladů po projektech, simulace úvěru, návratnost investice a predikce úspor na 20 let dopředu.",
  },
  {
    target: '[data-joyride="nav-projekty"]',
    disableBeacon: true,
    title: "Projekty",
    content:
      "Katalog všech dostupných rekonstrukcí — fasáda, okna, střecha, výtah a další. U každého projektu vidíte rozpočet, stav a prioritu.",
  },
  {
    target: '[data-joyride="nav-exporty"]',
    disableBeacon: true,
    title: "Exporty",
    content: (
      <div className="flex flex-col gap-2 text-sm">
        <p>Čtyři typy dokumentů připravených ke stažení:</p>
        <ul className="flex flex-col gap-1 pl-1">
          <li>
            <strong>Stručný přehled</strong> (PDF, 2–3 strany) — pro nástěnku nebo hromadný e-mail
          </li>
          <li>
            <strong>Personalizovaný export</strong> (PDF, 3–4 strany) — argumenty šité na míru konkrétnímu rezidentovi
          </li>
          <li>
            <strong>Detailní report</strong> (PDF, 10–15 stran) — pro analytické povahy, s rozpadem nákladů a harmonogramem
          </li>
          <li>
            <strong>Prezentace</strong> (PPTX, 8–10 snímků) — připravená k promítání na schůzi SVJ
          </li>
        </ul>
      </div>
    ),
  },
]

const LOCALE = {
  back: "Zpět",
  close: "Zavřít",
  last: "Hotovo",
  next: "Další",
  nextLabelWithProgress: "Další ({step} z {steps})",
  open: "Otevřít průvodce",
  skip: "Přeskočit",
}

export function JoyrideTour() {
  const [run, setRun] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setRun(true)
    }
  }, [])

  function handleCallback(data: CallBackProps) {
    const { status } = data
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      localStorage.setItem(STORAGE_KEY, "1")
      setRun(false)
    }
  }

  if (!run) return null

  return (
    <Joyride
      steps={STEPS}
      run={run}
      continuous
      showProgress
      showSkipButton
      locale={LOCALE}
      callback={handleCallback}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: "var(--color-primary, #3b82f6)",
          textColor: "var(--color-foreground, #09090b)",
          backgroundColor: "var(--color-card, #ffffff)",
          arrowColor: "var(--color-card, #ffffff)",
        },
      }}
    />
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/joyride-tour.tsx
git commit -m "feat(tour): create JoyrideTour client component with 9 Czech steps"
```

---

## Task 5: Mount JoyrideTour in DashboardLayout

**Files:**
- Modify: `app/dashboard/layout.tsx`

The layout is a server component but already imports client components (`DashboardSidebar`, `PendingBuildingBridge`), so adding another client component import is fine.

- [ ] **Step 1: Add the import and render the component**

Replace the full content of `app/dashboard/layout.tsx` with:

```tsx
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { JoyrideTour } from "@/components/dashboard/joyride-tour"
import { PendingBuildingBridge } from "@/components/onboarding/pending-building-bridge"

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="relative flex min-h-svh">
      <PendingBuildingBridge />
      <JoyrideTour />
      {/* Shared ambient atmosphere behind all dashboard pages */}
      <div
        aria-hidden
        className="pointer-events-none fixed -top-1/4 left-1/4 -z-10 size-[40rem] rounded-full bg-emerald-500/5 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -right-1/4 -bottom-1/4 -z-10 size-[40rem] rounded-full bg-blue-500/5 blur-[120px]"
      />
      <DashboardSidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden p-6 lg:p-8">{children}</main>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
cd /Users/simon/Documents/repos/Noodles && npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/layout.tsx
git commit -m "feat(tour): mount JoyrideTour in DashboardLayout"
```

---

## Task 6: Smoke-test the tour

**Files:** none (manual verification)

- [ ] **Step 1: Start the dev server**

```bash
cd /Users/simon/Documents/repos/Noodles && npm run dev
```

- [ ] **Step 2: Clear tour state and open the dashboard**

In your browser DevTools console:

```js
localStorage.removeItem('noodles_tour_seen')
```

Then navigate to `http://localhost:3000/dashboard/prehled` (refresh if already there).

- [ ] **Step 3: Verify all 9 steps**

Walk through the tour:

| Step | Expected target highlighted |
|---|---|
| 1 | Centered overlay, no spotlight |
| 2 | Přehled sidebar link |
| 3 | Hero image strip |
| 4 | Harmonogram card (or floating if no plan) |
| 5 | Benefits card (or floating if no plan) |
| 6 | Rezidenti sidebar link |
| 7 | Finance sidebar link |
| 8 | Projekty sidebar link |
| 9 | Exporty sidebar link |

- [ ] **Step 4: Verify tour does not re-appear on refresh**

Refresh the page. Tour must not reappear (localStorage key is set).

- [ ] **Step 5: Verify skip works**

`localStorage.removeItem('noodles_tour_seen')`, refresh, click "Přeskočit" on step 1. Tour closes. Refresh again — no tour.

- [ ] **Step 6: Final commit**

```bash
git add -p  # only if any fixups were needed
git commit -m "feat: add react-joyride first-login onboarding tour"
```
