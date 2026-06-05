"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  PENDING_BUILDING_KEY,
  saveBuilding,
  type BuildingPayload,
} from "@/lib/onboarding/save-building";

export function PendingBuildingBridge() {
  useEffect(() => {
    const raw =
      typeof window !== "undefined"
        ? localStorage.getItem(PENDING_BUILDING_KEY)
        : null;
    if (!raw) return;
    let payload: BuildingPayload;
    try {
      payload = JSON.parse(raw) as BuildingPayload;
    } catch {
      localStorage.removeItem(PENDING_BUILDING_KEY);
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) return; // not authenticated yet; will retry next dashboard load
      try {
        await saveBuilding(supabase, user.id, payload);
        localStorage.removeItem(PENDING_BUILDING_KEY);
        window.location.reload(); // refresh dashboard data now that the project exists
      } catch {
        // leave the pending payload for a later attempt
      }
    });
  }, []);
  return null;
}
