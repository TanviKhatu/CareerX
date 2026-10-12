import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAssessmentAttempt } from "@/lib/assessment-attempts";

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Your session expired. Please log in again." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { answers?: unknown; writtenAnswers?: unknown; startedAt?: unknown } | null;
  const startedAt = typeof body?.startedAt === "string" ? body.startedAt : null;

  const outcome = await createAssessmentAttempt(supabase, { userId: user.id, answers: body?.answers, writtenAnswers: body?.writtenAnswers, startedAt });
  if (!outcome.ok) {
    const status = outcome.code === "23505" ? 409 : 400;
    return NextResponse.json({ error: outcome.error }, { status });
  }

  return NextResponse.json({
    attemptId: outcome.attemptId,
    attemptNumber: outcome.attemptNumber,
    submittedAt: outcome.submittedAt,
    persisted: outcome.persisted
  });
}
