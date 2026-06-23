import { redirect } from "next/navigation"

// Stránka byla přejmenována na „Průvodce". Staré odkazy a záložky
// přesměrujeme, aby nic nepřestalo fungovat.
export default async function PrehledRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const from = typeof params.from === "string" ? params.from : null
  redirect(from ? `/dashboard/pruvodce?from=${from}` : "/dashboard/pruvodce")
}
