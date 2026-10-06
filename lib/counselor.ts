import { careers, getCareer, type Career } from "./careers";
import { matchCareers, type CareerProfileScore } from "./assessment";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ATTEMPT_PROFILE_COLUMNS, normalizeAnswers } from "./assessment-attempts";

export type CounselorProfile = {
  interests?: string[];
  skills?: string[];
  stream?: string;
  work_style?: string;
  preferred_work_environment?: string;
  preferred_industry?: string;
  career_interests?: string[];
  career_preferences?: unknown;
};

export type CounselorReply = { text: string; careerSlugs: string[] };
export type CounselorMatch = Pick<CareerProfileScore, "careerSlug" | "careerName" | "score" | "reasons">;
export type CounselorCareerSummary = Pick<CareerProfileScore, "careerSlug" | "careerName" | "score" | "reasons"> & Pick<Career, "category" | "skills" | "education" | "subjects" | "environment" | "scope" | "opportunities">;

function toSummary(career: Career, score: number, reasons: string[]): CounselorCareerSummary {
  return { careerSlug: career.slug, careerName: career.name, category: career.category, score, reasons, skills: career.skills, education: career.education, subjects: career.subjects, environment: career.environment, scope: career.scope, opportunities: career.opportunities };
}

const signalPatterns: Array<{ pattern: RegExp; tags: string[] }> = [
  { pattern: /\b(technology|tech|computer|coding|programming|software|artificial intelligence|\bai\b|data|cybersecurity|cloud)\b/i, tags: ["Technology", "Programming", "Computer Science", "Analysis"] },
  { pattern: /\b(design|visual|creative|creativity|art|fashion|ui|ux)\b/i, tags: ["Design", "Creativity", "Arts"] },
  { pattern: /\b(business|finance|money|accounting|commerce|market|management)\b/i, tags: ["Business", "Finance", "Management"] },
  { pattern: /\b(people|helping|health|healthcare|medicine|wellbeing|psychology|care)\b/i, tags: ["Helping others", "Medicine", "Psychology", "Social Service"] },
  { pattern: /\b(engineering|build|building|machines|hands.on|practical|electronics|circuit)\b/i, tags: ["Engineering", "Practical work", "Problem Solving"] },
  { pattern: /\b(write|writing|story|stories|media|journalism|law|legal|communication)\b/i, tags: ["Writing", "Communication", "Media", "Law"] },
  { pattern: /\b(math|mathematics|numbers|statistics|analytical|analysis|research)\b/i, tags: ["Mathematics", "Numerical ability", "Analysis", "Research"] },
];

function profileHasSignals(profile?: CounselorProfile | null) {
  return Boolean(profile && [
    ...(profile.interests ?? []),
    ...(profile.skills ?? []),
    ...(profile.career_interests ?? []),
    profile.stream,
    profile.work_style,
    profile.preferred_work_environment,
    profile.preferred_industry,
  ].some(Boolean));
}

export async function readCounselorContext(client: SupabaseClient, userId: string) {
  const [profileResult, attemptResult] = await Promise.all([
    client.from("profiles").select(ATTEMPT_PROFILE_COLUMNS).eq("user_id", userId).maybeSingle(),
    client.from("assessment_attempts").select("answers,career_candidates").eq("user_id", userId).order("attempt_number", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const profile = (profileResult.data ?? null) as CounselorProfile | null;
  const attempt = attemptResult.data as { answers?: unknown; career_candidates?: unknown } | null;
  const savedMatches = Array.isArray(attempt?.career_candidates)
    ? attempt.career_candidates.flatMap((value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return [];
      const candidate = value as Record<string, unknown>;
      if (typeof candidate.careerSlug !== "string" || typeof candidate.finalScore !== "number" || !Number.isFinite(candidate.finalScore)) return [];
      const career = getCareer(candidate.careerSlug);
      if (!career) return [];
      const reasons = Array.isArray(candidate.reasons) ? candidate.reasons.filter((reason): reason is string => typeof reason === "string") : [];
      return [toSummary(career, Math.max(0, Math.min(100, Math.round(candidate.finalScore))), reasons)];
    }).sort((first, second) => second.score - first.score)
    : [];
  const answers = normalizeAnswers(attempt?.answers);
  const profileMatches = answers || profileHasSignals(profile)
    ? matchCareers(answers ?? {}, profile ?? undefined, 3).flatMap((match) => {
      const career = getCareer(match.careerSlug);
      return career ? [toSummary(career, match.score, match.reasons)] : [];
    })
    : [];

  return {
    profile,
    matches: savedMatches.length ? savedMatches.slice(0, 3) : profileMatches,
    profileSignals: getCounselorProfileSignals(profile),
  };
}

function findNamedCareers(question: string): Career[] {
  const normalizedQuestion = question.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return careers.filter((career) => {
    const normalizedName = career.name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    return normalizedName.length > 2 && ` ${normalizedQuestion} `.includes(` ${normalizedName} `);
  });
}

function getQuestionMatches(question: string, profile: CounselorProfile | null | undefined, assessmentMatches: CounselorCareerSummary[], contextCareerSlugs: string[]) {
  const namedCareers = findNamedCareers(question);
  if (namedCareers.length) return namedCareers.slice(0, 3);

  const contextualCareers = contextCareerSlugs.flatMap((slug) => {
    const career = getCareer(slug);
    return career ? [career] : [];
  });
  if (contextualCareers.length) return contextualCareers.slice(0, 3);

  const tags = signalPatterns.flatMap(({ pattern, tags: matchedTags }) => pattern.test(question) ? matchedTags : []);
  if (tags.length) {
    const profileTags = [
      ...(profile?.interests ?? []),
      ...(profile?.skills ?? []),
      ...(profile?.career_interests ?? []),
    ];
    const ranked = matchCareers({}, { ...profile, interests: [...profileTags, ...tags] }, careers.length);
    return ranked.slice(0, 3).flatMap((match) => {
      const career = getCareer(match.careerSlug);
      return career ? [career] : [];
    });
  }

  return assessmentMatches.slice(0, 3).flatMap((match) => {
    const career = getCareer(match.careerSlug);
    return career ? [career] : [];
  });
}

function formatCareerNames(items: Career[]) {
  if (items.length < 2) return items[0]?.name ?? "";
  if (items.length === 2) return `${items[0].name} and ${items[1].name}`;
  return `${items[0].name}, ${items[1].name}, and ${items[2].name}`;
}

export function answerCounselorQuestion(
  question: string,
  profile: CounselorProfile | null | undefined,
  assessmentMatches: CounselorCareerSummary[],
  contextCareerSlugs: string[] = [],
): CounselorReply {
  const prompt = question.trim();
  const namedCareers = findNamedCareers(prompt);
  const matchedCareers = getQuestionMatches(prompt, profile, assessmentMatches, contextCareerSlugs);
  const careerSlugs = matchedCareers.map((career) => career.slug);
  const asksAboutSalary = /\b(salary|salaries|pay|earnings|income)\b/i.test(prompt);

  if (asksAboutSalary) {
    const targetName = namedCareers[0]?.name;
    const roleContext = targetName ? ` for ${targetName}` : "";
    return {
      text: `CareerX's career library doesn't contain reliable salary data${roleContext}, so I won't guess at a figure. Pay varies by location, experience, and role; compare current local job listings and official salary surveys. I can still help you explore the work, skills, and education for a path.`,
      careerSlugs,
    };
  }

  if (matchedCareers.length === 0) {
    return {
      text: "I don't have enough signal to make a useful recommendation yet. Tell me what you enjoy learning, the kind of problems you like solving, or what you want from your day-to-day work. A short career assessment can also give us a stronger starting point.",
      careerSlugs: [],
    };
  }

  const selected = namedCareers[0] ?? matchedCareers[0];
  if (/\b(compare|versus| vs\.?|difference|between)\b/i.test(prompt) && matchedCareers.length > 1) {
    return {
      text: `${formatCareerNames(matchedCareers)} connect to different kinds of work. Compare the skills, work environments, and education paths below; notice which activities you'd actually want to practice, not just which title sounds impressive.`,
      careerSlugs,
    };
  }

  if (/\b(education|degree|college|course|study|qualification|subjects?)\b/i.test(prompt)) {
    return { text: `${selected.name}: ${selected.education} Subjects to explore include ${selected.subjects.join(", ")}. Requirements vary by institution and location, so use this as a starting point and verify local admission or licensing rules.`, careerSlugs };
  }

  if (/\b(skill|skills|learn|learning|practice|start|begin|portfolio)\b/i.test(prompt)) {
    const nextStep = selected.category === "Design" || selected.category === "Media"
      ? "Choose one small brief, create a first version, and ask someone in your intended audience what is clear or confusing."
      : selected.category === "Healthcare" || selected.category === "Law"
        ? "Start with the foundational subjects and speak with a qualified professional about the training and local requirements."
        : "Try a small project that uses one of these skills, then reflect on which part you wanted to keep doing.";
    return { text: `For ${selected.name}, the catalog highlights ${selected.skills.join(", ")}. A low-stakes first step: ${nextStep}`, careerSlugs };
  }

  if (/\b(environment|workplace|team|day.to.day|day)\b/i.test(prompt)) {
    return { text: `${selected.name} work can happen in ${selected.environment} The day-to-day varies by role, so try a small project or informational conversation to test whether that setting suits you.`, careerSlugs };
  }

  if (/\b(future|scope|opportunit|growth|jobs?)\b/i.test(prompt)) {
    return { text: `${selected.scope} The catalog lists opportunities such as ${selected.opportunities.join(", ")}; these are directions to explore, not a guarantee of a particular outcome.`, careerSlugs };
  }

  if (/\b(worried|worry|afraid|behind|not good enough|not smart|unsure|doubt|weak)\b/i.test(prompt)) {
    return { text: `You don't need to arrive fully formed to explore ${selected.name}. Skills develop through practice, and a career match is a conversation starter, not a verdict. Which part feels most uncertain: the subjects, the day-to-day work, or getting started?`, careerSlugs };
  }

  if (assessmentMatches.length > 0 && !namedCareers.length && !signalPatterns.some(({ pattern }) => pattern.test(prompt))) {
    const topMatch = assessmentMatches[0];
    return {
      text: `Your latest assessment points first to ${topMatch.careerName} (${topMatch.score}% match), with ${formatCareerNames(matchedCareers.slice(1)) || "other paths"} also worth a look. The strongest reasons were ${topMatch.reasons.slice(0, 2).join(" and ").toLowerCase()}. What would you like to compare or learn about?`,
      careerSlugs,
    };
  }

  const reasons = assessmentMatches.find((match) => match.careerSlug === selected.slug)?.reasons;
  const explanation = reasons?.length ? ` Your assessment signals include ${reasons.slice(0, 2).join(" and ").toLowerCase()}.` : ` The catalog connects it with ${selected.interests.slice(0, 3).join(", ").toLowerCase()} and skills such as ${selected.skills.slice(0, 2).join(" and ").toLowerCase()}.`;
  return {
    text: `${selected.name} could be a useful path to explore.${explanation} Which part should we unpack first: the work itself, the skills to build, or the education path?`,
    careerSlugs,
  };
}

export function getCounselorProfileSignals(profile?: CounselorProfile | null) {
  if (!profileHasSignals(profile)) return [];
  return [...new Set([
    ...(profile?.interests ?? []),
    ...(profile?.skills ?? []),
    ...(profile?.career_interests ?? []),
    profile?.stream,
    profile?.work_style,
    profile?.preferred_work_environment,
    profile?.preferred_industry,
  ].filter((value): value is string => Boolean(value)))].slice(0, 6);
}