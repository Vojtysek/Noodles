import type { SupabaseClient } from "@supabase/supabase-js";

export type BuildingPayload = {
  address: string | null;
  units: number;
  floors: number | null;
  year_built: number | null;
  zastavena_plocha: number | null;
  energy_grade: string | null;
  insulated: boolean;
  new_windows: boolean;
  selected_renovations: string[];
  costs_by_project: Record<string, number>;
  selected_scenario?: string | null;
  monthly_per_unit: number;
  total_cost: number;
  final_rent: number;
  rent_years: number;
  window_count: number;
  capped_by_max: boolean;
};

export const PENDING_BUILDING_KEY = "noodles_pending_building";

/** Replace the user's single building project with the onboarding payload. */
export async function saveBuilding(
  supabase: SupabaseClient,
  userId: string,
  payload: BuildingPayload,
) {
  // RLS scopes this to the current user, but be explicit anyway.
  await supabase.from("buildings").delete().eq("user_id", userId);
  const { error } = await supabase
    .from("buildings")
    .insert({ ...payload, user_id: userId });
  if (error) throw error;
}
