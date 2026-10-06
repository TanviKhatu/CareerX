import { NextResponse } from "next/server";
import { answerCounselorQuestion, readCounselorContext } from "@/lib/counselor";
import { createClient } from "@/lib/supabase/server";
import { getCareer } from "@/lib/careers";

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Your session expired. Please log in again." }, { status: 401 });

  const body = await request.json().catch(() => null) as { question?: unknown; careerSlugs?: unknown } | null;
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  if (!question || question.length > 500) {
    return NextResponse.json({ error: "Enter a question of up to 500 characters." }, { status: 400 });
  }

  const careerSlugs = Array.isArray(body?.careerSlugs)
    ? [...new Set(body.careerSlugs.filter((slug): slug is string => typeof slug === "string" && getCareer(slug) !== undefined))].slice(0, 3)
    : [];
  const context = await readCounselorContext(supabase, user.id);
  const reply = answerCounselorQuestion(question, context.profile, context.matches, careerSlugs);
  const careers = reply.careerSlugs.flatMap((slug) => {
    const career = getCareer(slug);
    if (!career) return [];
    const match = context.matches.find((item) => item.careerSlug === slug);
    return [{
      slug: career.slug,
      name: career.name,
      category: career.category,
      skills: career.skills,
      education: career.education,
      subjects: career.subjects,
      environment: career.environment,
      scope: career.scope,
      opportunities: career.opportunities,
      score: match?.score ?? null,
      reasons: match?.reasons ?? [],
    }];
  });

  return NextResponse.json({ ...reply, careers, profileSignals: context.profileSignals });
}