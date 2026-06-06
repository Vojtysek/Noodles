import { NextRequest } from "next/server";
import { openai } from "@/lib/ai/client";
import {
  generateStrategy,
  buildStrategyUserMessage,
} from "@/lib/ai/instructions/generateStrategy";
import { createClient } from "@/lib/supabase/server";
import { getArchetype, isArchetypeId } from "@/lib/archetypes";
import { aggregateScenario, isProjectId, scenarioKey } from "@/lib/scenarios";
import type { StrategyPoint } from "@/lib/mock-data";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  if (!isArchetypeId(type)) {
    return Response.json({ error: "Neznámý archetyp." }, { status: 404 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("persona_strategies")
    .select("project_id, strategies")
    .eq("archetype", type)
    .is("persona_id", null);

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
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  if (!isArchetypeId(type)) {
    return Response.json({ error: "Neznámý archetyp." }, { status: 404 });
  }

  let projectIds: string[];
  let scenarioName: string;
  try {
    const body = (await req.json()) as { project_ids?: unknown; scenario_name?: unknown };
    if (!Array.isArray(body.project_ids) || body.project_ids.length === 0) {
      return Response.json({ error: "project_ids je povinné pole." }, { status: 400 });
    }
    projectIds = body.project_ids as string[];
    scenarioName = typeof body.scenario_name === "string" ? body.scenario_name : "Scénář";
  } catch {
    return Response.json({ error: "Neplatné tělo požadavku." }, { status: 400 });
  }

  if (!projectIds.every(isProjectId)) {
    return Response.json({ error: "Neznámé ID projektu." }, { status: 400 });
  }

  const archetype = getArchetype(type);
  const aggregates = aggregateScenario(projectIds);
  const key = scenarioKey(projectIds);

  let raw: { strategies: StrategyPoint[] };
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: generateStrategy },
        {
          role: "user",
          content: buildStrategyUserMessage(
            { name: archetype.name, profile: archetype.profile },
            { name: scenarioName, ...aggregates }
          ),
        },
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
    return Response.json({ error: "Neplatný výstup modelu." }, { status: 502 });
  }

  const supabase = await createClient();
  const { error: upsertError } = await supabase
    .from("persona_strategies")
    .upsert(
      { archetype: type, persona_id: null, project_id: key, strategies: raw.strategies },
      { onConflict: "archetype,project_id" }
    );

  if (upsertError) {
    return Response.json({ error: upsertError.message }, { status: 500 });
  }

  return Response.json(raw.strategies);
}
