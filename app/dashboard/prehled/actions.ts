"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function addInvite(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()

  if (!email || !email.includes("@")) {
    return { error: "Neplatný email" }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Nejste přihlášeni" }

  // Get this user's building
  const { data: building } = await supabase
    .from("buildings")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!building) return { error: "Nemáte uložený projekt" }

  const { error } = await supabase
    .from("building_invites")
    .insert({
      building_id: building.id,
      invited_email: email,
      created_by_user_id: user.id,
    })

  if (error) {
    if (error.code === "23505") return { error: "Tento email již byl pozván" }
    return { error: "Nepodařilo se přidat pozvánku" }
  }

  revalidatePath("/dashboard/prehled")
  return { success: true }
}
