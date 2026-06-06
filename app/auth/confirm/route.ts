import { type EmailOtpType, type SupabaseClient, type User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

async function linkInviteIfExists(supabase: SupabaseClient, user: User) {
  try {
    if (!user.email) return;

    const { data: invite } = await supabase
      .from("building_invites")
      .select("id, building_id")
      .eq("invited_email", user.email)
      .maybeSingle();

    if (!invite) return;

    await supabase
      .from("building_members")
      .insert({ building_id: invite.building_id, user_id: user.id });

    await supabase
      .from("building_invites")
      .delete()
      .eq("id", invite.id);
  } catch {
    // silently ignore
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard/prehled";

  const redirectTo = (pathname: string, search = "") => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = search;
    return NextResponse.redirect(url);
  };

  const supabase = await createClient();

  // PKCE flow — Supabase redirects back with ?code=... (this is what
  // @supabase/ssr uses for the email confirmation link).
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await linkInviteIfExists(supabase, user);
      return redirectTo(next);
    }
    return redirectTo("/login", `?error=${encodeURIComponent(error.message)}`);
  }

  // OTP / token_hash flow — magic-link style confirmation.
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await linkInviteIfExists(supabase, user);
      return redirectTo(next);
    }
    return redirectTo("/login", `?error=${encodeURIComponent(error.message)}`);
  }

  return redirectTo(
    "/login",
    `?error=${encodeURIComponent("Neplatný nebo chybějící potvrzovací odkaz.")}`,
  );
}
