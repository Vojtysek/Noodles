export function buildSummarizeInvoicePrompt(): string {
  const prompt = `Jsi expert na čtení a analýzu českých faktur (za energie, služby a dodávky) v kontextu správy bytového domu a SVJ.

Dostaneš jako přílohu PDF nebo obrázek jedné faktury. Pečlivě ji přečti a vrať POUZE validní JSON objekt přesně v tomto tvaru:

{
  "summary": "1–2 věty shrnutí",
  "extracted": {
    "dodavatel": "",
    "druh": "",
    "obdobi": "",
    "castka": "",
    "splatnost": "",
    "cislo_faktury": "",
    "polozky": []
  }
}

Pravidla:
- Vše piš česky.
- Nic si nevymýšlej — vyplňuj pouze údaje, které jsou na faktuře skutečně uvedeny.
- Pokud některý údaj na faktuře není, použij hodnotu "neuvedeno" (a pro "polozky" prázdné pole []).
- "summary": stručné shrnutí faktury v 1–2 větách.
- "dodavatel": název dodavatele / vystavitele faktury.
- "druh": druh faktury (např. "elektřina", "plyn", "voda", "teplo", "služby", "dodávky").
- "obdobi": fakturované období.
- "castka": celková částka k úhradě včetně měny a včetně DPH.
- "splatnost": datum splatnosti.
- "cislo_faktury": číslo / variabilní symbol faktury.
- "polozky": pole krátkých stringů popisujících jednotlivé položky (spotřeba / jednotková cena / množství).
- Výstup je POUZE validní JSON bez jakéhokoli textu okolo a bez code fence (žádné \`\`\`).`

  return prompt.trim()
}
