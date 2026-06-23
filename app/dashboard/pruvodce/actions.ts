"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function addInvite(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()

  if (!email || !email.includes("@")) {
    return { error: "Neplatný email" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Nejste přihlášeni" }

  const { data: building } = await supabase
    .from("buildings")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!building) return { error: "Nemáte uložený projekt" }

  const { error } = await supabase.from("building_invites").insert({
    building_id: building.id,
    invited_email: email,
    created_by_user_id: user.id,
  })

  if (error) {
    if (error.code === "23505") return { error: "Tento email již byl pozván" }
    return { error: "Nepodařilo se přidat pozvánku" }
  }

  revalidatePath("/dashboard/pruvodce")
  return { success: true }
}

export async function submitFinancingLead(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const phone = String(formData.get("phone") ?? "").trim()
  const note = String(formData.get("note") ?? "").trim()
  const consent = formData.get("consent")

  if (!name) return { error: "Vyplňte prosím jméno." }
  if (!email || !email.includes("@")) return { error: "Zadejte platný e-mail." }
  if (!phone) return { error: "Zadejte telefonní číslo." }
  if (!consent) return { error: "Bez souhlasu vás nemůžeme kontaktovat." }

  const units = Number(formData.get("units")) || null
  const estimatedCost = Number(formData.get("total_cost")) || null
  const address = String(formData.get("address") ?? "").trim() || null

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let buildingId: string | null = null
  if (user) {
    const { data: building } = await supabase
      .from("buildings")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    buildingId = building?.id ?? null
  }

  const { error } = await supabase.from("financing_leads").insert({
    user_id: user?.id ?? null,
    building_id: buildingId,
    name,
    email,
    phone,
    note: note || null,
    units,
    estimated_cost: estimatedCost,
    address,
  })

  if (error) {
    return {
      error:
        "Poptávku se nepodařilo odeslat. Zkuste to prosím znovu, nebo nás kontaktujte.",
    }
  }

  return { success: true }
}
