import { createClient } from "@/lib/supabase/server";
import { LearningPlanView } from "./learning-plan-view";

export async function LearningPlanData() {
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  let preferredTrack = "engineering";

  if (supabase && user) {
    const profileRes = await supabase.from("profiles").select("career_interests,stream").eq("user_id", user.id).maybeSingle();
    const interests = profileRes?.data?.career_interests || [];
    const stream = profileRes?.data?.stream || "";

    if (interests.includes("designer") || stream.toLowerCase().includes("design")) {
      preferredTrack = "design";
    } else if (interests.includes("finance") || stream.toLowerCase().includes("commerce")) {
      preferredTrack = "strategy";
    } else if (interests.includes("doctor") || interests.includes("social-worker")) {
      preferredTrack = "strategy";
    } else if (interests.includes("content-creator") || interests.includes("media") || interests.includes("journalist")) {
      preferredTrack = "design";
    }
  }

  return <LearningPlanView preferredTrack={preferredTrack} />;
}
