// Čtení katalogu nefinančních přínosů z DB (tabulka renovation_benefits)
// se statickým fallbackem na NON_FINANCIAL_BENEFITS z lib/benefits.ts.
// Při jakékoli chybě nebo prázdném výsledku se vrací statický katalog,
// aby aplikace fungovala i bez dostupné databáze.
import { type SupabaseClient } from "@supabase/supabase-js"
import { type ProjectId } from "@/lib/mock-data"
import {
  NON_FINANCIAL_BENEFITS,
  type BenefitCategory,
  type NonFinancialBenefit,
} from "@/lib/benefits"

type BenefitRow = {
  id: string
  project_id: string | null
  category: string
  title: string
  description: string
  meeting_pitch: string | null
  impact: number
}

export async function fetchNonFinancialBenefits(
  supabase: SupabaseClient,
): Promise<NonFinancialBenefit[]> {
  try {
    const { data, error } = await supabase
      .from("renovation_benefits")
      .select("id, project_id, category, title, description, meeting_pitch, impact")

    if (error || !data || data.length === 0) return NON_FINANCIAL_BENEFITS

    return (data as BenefitRow[]).map((row) => ({
      id: row.id,
      projectId: (row.project_id as ProjectId | null) ?? null,
      category: row.category as BenefitCategory,
      title: row.title,
      description: row.description,
      meetingPitch: row.meeting_pitch ?? undefined,
      impact: row.impact as 1 | 2 | 3,
    }))
  } catch {
    return NON_FINANCIAL_BENEFITS
  }
}
