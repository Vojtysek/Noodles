import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Logged-in users who already created their project skip onboarding.
  if (user) {
    const { data: building } = await supabase
      .from("buildings")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (building) {
      redirect("/dashboard/prehled");
    }
  }

  // Unauthenticated visitors are allowed — they register at the end of onboarding.
  return <>{children}</>;
}
