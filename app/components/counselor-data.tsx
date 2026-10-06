import { createClient } from "@/lib/supabase/server";
import { readCounselorContext } from "@/lib/counselor";
import { AICounselor } from "./ai-counselor";

export async function CounselorData() {
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  const context = supabase && user ? await readCounselorContext(supabase, user.id) : null;

  return <AICounselor initialMatches={context?.matches ?? []} initialSignals={context?.profileSignals ?? []} />;
}