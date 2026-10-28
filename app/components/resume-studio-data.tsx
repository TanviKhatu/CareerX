import { createClient } from "@/lib/supabase/server";
import { ResumeStudioView } from "./resume-studio-view";

export async function ResumeStudioData() {
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  let initialProfile = {};

  if (supabase && user) {
    const profileRes = await supabase
      .from("profiles")
      .select("full_name,email,phone,city,state,skills,stream")
      .eq("user_id", user.id)
      .maybeSingle();

    const data = profileRes?.data;
    if (data) {
      initialProfile = {
        fullName: data.full_name || user.user_metadata?.full_name || "",
        email: data.email || user.email || "",
        phone: data.phone || "",
        location: [data.city, data.state].filter(Boolean).join(", "),
        skills: Array.isArray(data.skills) && data.skills.length > 0 ? data.skills : undefined,
      };
    }
  }

  return <ResumeStudioView initialProfile={initialProfile} />;
}
