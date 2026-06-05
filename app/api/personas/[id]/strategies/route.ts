import { NextRequest } from "next/server";
import { openai } from "@/lib/ai/client";
import { generateStrategy } from "@/lib/ai/instructions/generateStrategy";
import { createClient } from "@/lib/supabase/server";
import { projects } from "@/lib/mock-data";
import type { StrategyPoint } from "@/lib/mock-data";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("persona_strategies")
    .select("project_id, strategies")
    .eq("persona_id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const result: Record<string, StrategyPoint[]> = {};
  for (const row of data ?? []) {
    result[row.project_id as string] = row.strategies as StrategyPoint[];
  }

  return Response.json(result);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let project_id: string;
  try {
    const body = (await req.json()) as { project_id?: unknown };
    if (!body.project_id || typeof body.project_id !== "string") {
      return Response.json({ error: "project_id je povinný." }, { status: 400 });
    }
    project_id = body.project_id;
  } catch {
    return Response.json({ error: "Neplatné tělo požadavku." }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: persona, error: personaError } = await supabase
    .from("personas")
    .select("name, brief, structured, sentiment")
    .eq("id", id)
    .single();

  if (personaError || !persona) {
    return Response.json({ error: "Persona not found" }, { status: 404 });
  }

  if (!persona.structured) {
    return Response.json(
      { error: "Persona nemá zpracovaný brief — nejdříve spusťte analýzu." },
      { status: 400 }
    );
  }

  const project = projects.find((p) => p.id === project_id);
  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const structured = persona.structured as {
    traits: string[];
    objections: string[];
    motivations: string[];
    rejects: string[];
  };

  const userMessage = `PERSONA:
Jméno: ${persona.name}
Postoj: ${persona.sentiment}
Charakteristika: ${structured.traits.join(", ")}
Námitky: ${structured.objections.join(", ")}
Motivace: ${structured.motivations.join(", ")}
Odmítá: ${structured.rejects.join(", ")}

PROJEKT:
Název: ${project.name}
Rozpočet: ${project.budget.toLocaleString("cs-CZ")} Kč
Roční úspora: ${project.savingsPerYear.toLocaleString("cs-CZ")} Kč
Návratnost: ${project.paybackYears} let
Navýšení fondu: ${project.fundIncreasePerFlat} Kč/byt/měsíc
Úspora energií: ${project.energySavingPct} %

Vygeneruj 4 strategické body jak přesvědčit tuto personu k podpoře tohoto projektu.`;

  let raw: { strategies: StrategyPoint[] };
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: generateStrategy },
        { role: "user", content: userMessage },
      ],
    });

    raw = JSON.parse(
      completion.choices?.[0]?.message?.content ?? "{}"
    ) as { strategies: StrategyPoint[] };
  } catch {
    return Response.json(
      { error: "Nepodařilo se vygenerovat strategie." },
      { status: 502 }
    );
  }

  if (!Array.isArray(raw.strategies)) {
    return Response.json(
      { error: "Neplatný výstup modelu." },
      { status: 502 }
    );
  }

  const { error: upsertError } = await supabase
    .from("persona_strategies")
    .upsert(
      { persona_id: id, project_id, strategies: raw.strategies },
      { onConflict: "persona_id,project_id" }
    );

  if (upsertError) {
    return Response.json({ error: upsertError.message }, { status: 500 });
  }

  return Response.json(raw.strategies);
}
