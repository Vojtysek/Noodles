"use client";

import { useState } from "react";
import type { InstructionType } from "@/app/api/chat/route";

interface Message {
  role: "user" | "assistant";
  content: string;
  display?: string;
}

interface QuickCard {
  label: string;
  tag: string;
  prompt: string;
  instruction: InstructionType;
}

const QUICK_CARDS: QuickCard[] = [
  {
    label: "Skeptický investor",
    tag: "FVE",
    instruction: "generateArguments",
    prompt: `TÉMA:
FVE (fotovoltaika) pro bytový dům

PERSONA:
- styl: analytical
- postoj: skeptic
- hlavní obava: návratnost investice
- citlivost na cenu: vysoká
- potřeba důkazů: vysoká
- vztah k domu: investiční vlastník
- vliv na ostatní: střední

FAKTA:
- Instalace FVE 30 kWp, cena 450 000 Kč
- Předpokládaná roční úspora 85 000 Kč
- Návratnost 5–6 let
- Dostupná dotace 150 000 Kč z NZÚ

VÝSTUP:
- forma: email
- délka: střední
- tón: věcný`,
  },
  {
    label: "Rozhodovatel ve spěchu",
    tag: "Zateplení",
    instruction: "generateArguments",
    prompt: `TÉMA:
Zateplení fasády bytového domu

PERSONA:
- styl: driver
- postoj: neutral
- hlavní obava: délka stavebních prací
- citlivost na cenu: nízká
- potřeba důkazů: nízká
- vztah k domu: bydlí tam
- vliv na ostatní: vysoký

FAKTA:
- Zateplení 800 m² fasády, minerální vata 160 mm
- Cena 1 200 000 Kč, dotace 40 %
- Práce trvají 6 týdnů, mimo topnou sezónu
- Úspora tepla 35 %, snížení nákladů na vytápění o 28 000 Kč/rok

VÝSTUP:
- forma: skript
- délka: krátká
- tón: rozhodovací`,
  },
  {
    label: "Přátelský zastánce",
    tag: "Fond oprav",
    instruction: "generateArguments",
    prompt: `TÉMA:
Navýšení fondu oprav o 800 Kč/měsíc na byt

PERSONA:
- styl: amiable
- postoj: supporter
- hlavní obava: přesvědčit ostatní sousedy
- citlivost na cenu: střední
- potřeba důkazů: střední
- vztah k domu: bydlí tam
- vliv na ostatní: vysoký

FAKTA:
- Aktuální fond: 12 Kč/m², navrhované navýšení na 18 Kč/m²
- Plánované opravy: střecha (2026), výtah (2028), fasáda (2029)
- Celková rezerva po navýšení: 2,4 mil. Kč za 3 roky
- Bez navýšení hrozí úvěr s úrokem 7 %

VÝSTUP:
- forma: leták
- délka: střední
- tón: lidský`,
  },
  {
    label: "Expresivní odpůrce",
    tag: "Výměna oken",
    instruction: "generateArguments",
    prompt: `TÉMA:
Výměna oken za plastová trojskla v celém domě

PERSONA:
- styl: expressive
- postoj: opponent
- hlavní obava: zásah do vzhledu domu
- citlivost na cenu: střední
- potřeba důkazů: střední
- vztah k domu: bydlí tam
- vliv na ostatní: střední

FAKTA:
- Výměna 48 oken, cena 960 000 Kč (20 000 Kč/okno)
- Úspora tepla 18 %, snížení hluku z ulice
- Barva rámů zachovává historický ráz (antracit)
- Dotace 30 % z NZÚ, realizace 2 týdny

VÝSTUP:
- forma: FAQ
- délka: střední
- tón: diplomatický`,
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage(
    overrideText?: string,
    displayLabel?: string,
    instruction: InstructionType = "generateArguments",
  ) {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text, display: displayLabel },
    ]);
    setLoading(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, instruction }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error ?? "Request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;

          try {
            const parsed = JSON.parse(payload);
            const chunk: string = parsed.text ?? parsed.content ?? parsed.output ?? "";
            if (chunk) {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: updated[updated.length - 1].content + chunk,
                };
                return updated;
              });
            }
          } catch {
            // non-JSON SSE line, skip
          }
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Chyba při komunikaci s AI.",
        };
        return updated;
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-svh flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {messages.length === 0 && (
            <div className="mt-16 flex flex-col gap-4">
              <p className="text-muted-foreground text-center text-sm">
                Vyber ukázkový scénář nebo napiš vlastní dotaz
              </p>
              <div className="grid grid-cols-2 gap-3">
                {QUICK_CARDS.map((card) => (
                  <button
                    key={card.label}
                    onClick={() => sendMessage(card.prompt, `${card.label} – ${card.tag}`, card.instruction)}
                    className="bg-muted hover:bg-muted/70 border-border flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-colors"
                  >
                    <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 text-xs font-medium">
                      {card.tag}
                    </span>
                    <span className="text-foreground text-sm font-medium">{card.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {msg.display ?? msg.content}
                {msg.role === "assistant" && loading && i === messages.length - 1 && (
                  <span className="ml-1 animate-pulse">▊</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <form
          className="mx-auto flex max-w-2xl gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
        >
          <input
            className="border-input bg-background focus-visible:ring-ring flex-1 rounded-xl border px-4 py-2 text-sm outline-none focus-visible:ring-2"
            placeholder="Napiš zprávu..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 rounded-xl px-4 py-2 text-sm font-medium transition-opacity"
          >
            Odeslat
          </button>
        </form>
      </div>
    </div>
  );
}
