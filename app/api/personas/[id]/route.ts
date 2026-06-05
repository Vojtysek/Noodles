import { NextRequest } from "next/server";
import { openai } from "@/lib/ai/client";
import { buildCharacterizePersonaPrompt } from "@/lib/ai/instructions/characterizePersona";
import { createClient } from "@/lib/supabase/server";
import { PersonaType, PERSONA_TYPES } from "@/lib/persona-types";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { brief } = await req.json() as { brief?: string };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("personas")
    .select("persona_type")
    .eq("id", id)
    .single();
  const rawType = existing?.persona_type;
  const existingPersonaType: PersonaType | undefined =
    rawType && rawType in PERSONA_TYPES ? rawType as PersonaType : undefined;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildCharacterizePersonaPrompt(existingPersonaType) },
      { role: "user", content: brief ?? "" },
    ],
  });

  const raw = JSON.parse(completion.choices[0].message.content ?? "{}") as {
    traits: string[];
    objections: string[];
    motivations: string[];
    rejects: string[];
    sentiment: "podporuje" | "vaha" | "proti";
  };

  const { sentiment, ...structured } = raw;

  const { data, error } = await supabase
    .from("personas")
    .update({ brief: brief ?? null, structured, sentiment, status: "zpracovano" })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // FK on delete cascade smaže i persona_strategies.
  const { error } = await supabase.from("personas").delete().eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
