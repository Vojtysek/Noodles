"use client"

import { useEffect, useState } from "react"
import { Joyride, STATUS, type EventData, type Step } from "react-joyride"

const STORAGE_KEY = "noodles_tour_seen"

const STEPS: Step[] = [
  {
    target: "body",
    placement: "center",
    skipBeacon: true,
    title: "Vítejte v Noodles",
    content:
      "Ukážeme vám základy aplikace za méně než minutu. Můžete kdykoli přeskočit.",
  },
  {
    target: '[data-joyride="nav-prehled"]',
    skipBeacon: true,
    title: "Přehled",
    content:
      "Váš hlavní rozcestník — klíčové metriky budovy, srovnání scénářů s rekonstrukcí a bez ní a přehled investice.",
  },
  {
    target: '[data-joyride="prehled-hero"]',
    skipBeacon: true,
    title: "Základní informace budovy",
    content:
      "Energetická třída, počet bytových jednotek, odhadovaná měsíční splátka na byt a roční úspora na energiích — vše na jednom místě.",
  },
  {
    target: '[data-joyride="prehled-harmonogram"]',
    skipBeacon: true,
    title: "Harmonogram",
    content:
      "Časová osa rekonstrukcí pro vybraný scénář — vidíte pořadí projektů, délku každé fáze a celkový termín dokončení.",
  },
  {
    target: '[data-joyride="prehled-benefits"]',
    skipBeacon: true,
    title: "Přínosy",
    content:
      "Nefinanční přínosy rekonstrukcí rozdělené do kategorií: komfort, zdraví, hodnota nemovitosti, bezpečnost a další — argumenty do diskuse se sousedy.",
  },
  {
    target: '[data-joyride="nav-rezidenti"]',
    skipBeacon: true,
    title: "Rezidenti",
    content:
      "Připravte si argumenty ještě před schůzí SVJ. Vyberte typ souseda (archetyp) nebo si vytvořte vlastní personu — AI pak vygeneruje argumentační strategii šitou na míru danému scénáři rekonstrukce.",
  },
  {
    target: '[data-joyride="nav-finance"]',
    skipBeacon: true,
    title: "Finance",
    content:
      "Detailní finanční model: rozpady nákladů po projektech, simulace úvěru, návratnost investice a predikce úspor na 20 let dopředu.",
  },
  {
    target: '[data-joyride="nav-projekty"]',
    skipBeacon: true,
    title: "Projekty",
    content:
      "Katalog všech dostupných rekonstrukcí — fasáda, okna, střecha, výtah a další. U každého projektu vidíte rozpočet, stav a prioritu.",
  },
  {
    target: '[data-joyride="nav-exporty"]',
    skipBeacon: true,
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

  function handleEvent(data: EventData) {
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
      locale={LOCALE}
      onEvent={handleEvent}
      options={{
        showProgress: true,
        buttons: ["back", "close", "primary", "skip"],
        primaryColor: "#3b82f6",
        textColor: "#09090b",
        overlayColor: "#00000080",
        zIndex: 10000,
      }}
    />
  )
}
