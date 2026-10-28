import { createClient } from "@/lib/supabase/server";
import { MockInterviewView } from "./mock-interview-view";

export async function MockInterviewData() {
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  let initialRole = "engineer";

  if (supabase && user) {
    const profileRes = await supabase.from("profiles").select("career_interests").eq("user_id", user.id).maybeSingle();
    const interests = profileRes?.data?.career_interests || [];
    if (interests.includes("designer")) {
      initialRole = "designer";
    } else if (interests.includes("engineer")) {
      initialRole = "engineer";
    } else if (interests.length > 0) {
      initialRole = "general";
    }
  }

  return <MockInterviewView initialRole={initialRole} />;
}
