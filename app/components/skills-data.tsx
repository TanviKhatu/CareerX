import { createClient } from "@/lib/supabase/server";
import { SkillsView } from "./skills-view";

export async function SkillsData() {
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  let initialSkills: string[] = [];
  let topCareerSlug = "engineer";

  if (supabase && user) {
    const [profileRes, resultRes] = await Promise.all([
      supabase.from("profiles").select("skills,career_interests").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("assessment_results")
        .select("result_data")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (Array.isArray(profileRes?.data?.skills) && profileRes.data.skills.length > 0) {
      initialSkills = profileRes.data.skills;
    }

    const recs = resultRes?.data?.result_data?.recommendations;
    if (Array.isArray(recs) && recs.length > 0 && recs[0]?.careerSlug) {
      topCareerSlug = recs[0].careerSlug;
    } else if (Array.isArray(profileRes?.data?.career_interests) && profileRes.data.career_interests.length > 0) {
      topCareerSlug = profileRes.data.career_interests[0];
    }
  }

  return <SkillsView initialProfileSkills={initialSkills} topCareerSlug={topCareerSlug} />;
}
