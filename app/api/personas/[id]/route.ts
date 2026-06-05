import { NextRequest } from "next/server";
import { openai } from "@/lib/ai/client";
import { characterizePersona } from "@/lib/ai/instructions/characterizePersona";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { brief } = await req.json() as { brief: string };

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: characterizePersona },
      { role: "user", content: brief },
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

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("personas")
    .update({ brief, structured, sentiment, status: "zpracovano" })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}
