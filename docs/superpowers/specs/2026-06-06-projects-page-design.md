# Projects Page Design

**Date:** 2026-06-06  
**Route:** `/dashboard/projects`  
**Status:** Approved

## Goal

A dashboard subpage that shows all available renovation projects with a visual distinction between selected (user's plan) and available (not yet chosen). Users can toggle projects on/off directly from this page, updating their `selected_renovations` in Supabase.

## Data

**Source:** Supabase `buildings` table, same row fetch as `financials/page.tsx`.

Fields read:
- `selected_renovations: string[]` — renovation labels e.g. `["Okna", "Zateplení fasády"]`
- `costs_by_project: Record<string, number> | null` — per-project cost overrides from the calculator

Full project catalog comes from `projects` in `lib/mock-data.ts` (9 projects total). Costs are merged using the existing `scaleProjectsToBuilding` function from `financials/page.tsx` (to be extracted to a shared location or duplicated).

Label → project ID mapping uses `RENOVATION_LABEL_TO_PROJECT` from `lib/scenarios.ts`.

**Write:** On toggle, update `selected_renovations` on the user's `buildings` row via Supabase client. Optimistic local state update first, then persist.

## Architecture

- `/app/dashboard/projects/page.tsx` — client component (`"use client"`)
- No new API routes
- Direct Supabase client reads/writes (same pattern as `financials`)
- Reuses: `scaleProjectsToBuilding`, `RENOVATION_LABEL_TO_PROJECT`, `userProjects`, `fmtCzkShort`, `fmtCzk`, `cn`

## UI Layout

### Hero header (dark strip, matches financials)
- Title: "Projekty"
- Subtitle: "Vyberte rekonstrukce pro váš dům"
- Two summary chips: "X vybráno" · "Celkem Kč" (sum of selected project costs)
- Subtle save status text: "Ukládám…" / "Uloženo ✓" (no toast/modal)

### Project grid
- Layout: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Sorted by `priority` ascending (priority 1 first)
- Clickable cards — toggle selected state on click

**Selected card:**
- Blue ring + border (`ring-2 ring-primary border-primary/60 bg-primary/5`)
- `CircleCheck` icon (blue, top-right)
- Priority 1: `Star` icon (amber, filled)

**Unselected card:**
- Muted border, neutral background
- No check icon
- Priority 1: `Star` icon still shown (amber, outline or muted)

**Card content (per project):**
- Project name (`p.name`)
- Short name as subtitle (`p.shortName`)
- Cost: `fmtCzkShort(p.budget)` (scaled from `costs_by_project` where available)
- Duration: `p.durationMonths` months
- Energy saving: `p.energySavingPct %` badge

### Loading state
- Skeleton pulse cards in the same grid layout (6 placeholder cards)

### Empty state
- Shown when no building data exists
- CTA button to `/onboarding`

## Interaction

- **Toggle:** Click card → flip selected state locally → write new `selected_renovations` array to Supabase
- **Save feedback:** "Ukládám…" shown while Supabase write is in-flight, "Uloženo" on success
- **Error:** On Supabase write failure, revert optimistic update silently (or show brief inline error near header)

## Navigation

Add "Projekty" to the dashboard sidebar, between existing items. Exact position TBD based on sidebar order.

## Out of scope

- Reordering projects
- Per-project detail pages
- Cost editing from this page
