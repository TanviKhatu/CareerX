import { createClient } from "@/lib/supabase/server";
import { RoadmapView } from "./roadmap-view";

export async function RoadmapData() {
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  let initialCareer = "engineer";

  if (supabase && user) {
    const [profileRes, resultRes] = await Promise.all([
      supabase.from("profiles").select("career_interests,stream").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("assessment_results")
        .select("result_data")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const recs = resultRes?.data?.result_data?.recommendations;
    if (Array.isArray(recs) && recs.length > 0 && recs[0]?.careerSlug) {
      initialCareer = recs[0].careerSlug;
    } else if (Array.isArray(profileRes?.data?.career_interests) && profileRes.data.career_interests.length > 0) {
      initialCareer = profileRes.data.career_interests[0];
    }
  }

  return <RoadmapView initialCareerSlug={initialCareer} />;
}
