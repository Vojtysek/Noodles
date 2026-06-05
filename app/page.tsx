import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function Page() {
  const supabase = await createClient();
  const { data: renovations } = await supabase
    .from("renovations")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="flex min-h-svh p-6">
      <div className="flex w-full max-w-lg flex-col gap-6">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-semibold">Renovations</h1>
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <LayoutDashboard />
              Dashboard
            </Link>
          </Button>
        </div>
        <div className="flex flex-col gap-3">
          {renovations?.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
            >
              <span>{r.name}</span>
              <span className="font-mono font-medium">
                {Number(r.cost_czk).toLocaleString("cs-CZ")} Kč
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
