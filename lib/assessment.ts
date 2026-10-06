import { careers } from "./careers";

export type AssessmentOption = { label: string; tags: string[] };
export type AssessmentQuestion = { id: string; category: string; prompt: string; options: AssessmentOption[] };

const options = (labels: string[], tags: string[][]): AssessmentOption[] => labels.map((label, index) => ({ label, tags: tags[index] }));
const scale = (prompt: string, tags: string[]): AssessmentOption[] => options(["Not really me", "A little like me", "Often like me", "Very much like me"], [[], tags.slice(0, 1), tags.slice(0, 2), tags]);

export const assessmentQuestions: AssessmentQuestion[] = [
 { id: "interest-technology", category: "Interest", prompt: "I enjoy learning how technology works.", options: scale("", ["Technology", "Programming", "Analysis"]) },
 { id: "interest-science", category: "Interest", prompt: "I like exploring science and how the world works.", options: scale("", ["Science", "Research", "Analytical thinking"]) },
 { id: "interest-business", category: "Interest", prompt: "I enjoy thinking about businesses, money, or markets.", options: scale("", ["Business", "Finance", "Management"]) },
 { id: "interest-design", category: "Interest", prompt: "I notice design, visuals, and how things look or feel.", options: scale("", ["Design", "Creativity", "Arts"]) },
 { id: "interest-people", category: "Interest", prompt: "I am curious about people, behavior, and wellbeing.", options: scale("", ["Psychology", "Helping others", "Social Service"]) },
 { id: "interest-writing", category: "Interest", prompt: "I enjoy writing, explaining, or telling stories.", options: scale("", ["Writing", "Communication", "Media"]) },
 { id: "aptitude-logic", category: "Aptitude", prompt: "I enjoy puzzles that require logical reasoning.", options: scale("", ["Logical reasoning", "Problem Solving", "Analysis"]) },
 { id: "aptitude-numbers", category: "Aptitude", prompt: "I feel comfortable working with numbers and patterns.", options: scale("", ["Numerical ability", "Mathematics", "Analysis"]) },
 { id: "aptitude-verbal", category: "Aptitude", prompt: "I can understand and explain written ideas clearly.", options: scale("", ["Verbal reasoning", "Writing", "Communication"]) },
 { id: "aptitude-analysis", category: "Aptitude", prompt: "I like breaking a complex problem into smaller parts.", options: scale("", ["Analytical thinking", "Problem Solving", "Research"]) },
 { id: "style-team", category: "Work style", prompt: "I do my best work when collaborating with others.", options: scale("", ["Teamwork", "Communication", "Helping others"]) },
 { id: "style-independent", category: "Work style", prompt: "I am comfortable planning and finishing work independently.", options: scale("", ["Independent work", "Research", "Analysis"]) },
 { id: "style-creative", category: "Work style", prompt: "I like open-ended work where I can create something new.", options: scale("", ["Creativity", "Design", "Arts"]) },
 { id: "style-leadership", category: "Work style", prompt: "I enjoy taking responsibility and helping a group move forward.", options: scale("", ["Leadership", "Management", "Communication"]) },
 { id: "style-research", category: "Work style", prompt: "I can spend time investigating a question carefully.", options: scale("", ["Research", "Analysis", "Independent work"]) },
 { id: "style-helping", category: "Work style", prompt: "I find purpose in helping people solve real problems.", options: scale("", ["Helping others", "Social Service", "Communication"]) },
 { id: "style-practical", category: "Work style", prompt: "I prefer learning by making, testing, or working hands-on.", options: scale("", ["Practical work", "Problem Solving", "Teamwork"]) },
 { id: "style-theoretical", category: "Work style", prompt: "I enjoy ideas, theories, and understanding why things happen.", options: scale("", ["Theoretical work", "Research", "Science"]) },
 { id: "skill-programming", category: "Skills", prompt: "Programming or learning code feels interesting to me.", options: scale("", ["Programming", "Technology", "Problem Solving"]) },
 { id: "skill-communication", category: "Skills", prompt: "People often understand what I mean when I explain something.", options: scale("", ["Communication", "Public Speaking", "Writing"]) },
 { id: "skill-leadership", category: "Skills", prompt: "I can organize people or tasks toward a shared goal.", options: scale("", ["Leadership", "Management", "Teamwork"]) },
 { id: "skill-creativity", category: "Skills", prompt: "I can generate original ideas and approaches.", options: scale("", ["Creativity", "Design", "Problem Solving"]) },
 { id: "preference-environment", category: "Preference", prompt: "Which environment sounds most appealing?", options: [{ label: "A technology or research team", tags: ["Technology", "Research"] }, { label: "A people-focused service", tags: ["Helping others", "Social Service"] }, { label: "A creative studio or media team", tags: ["Creativity", "Design", "Media"] }, { label: "A business or finance organization", tags: ["Business", "Finance", "Management"] }] },
 { id: "preference-impact", category: "Preference", prompt: "What kind of outcome would feel most rewarding?", options: [{ label: "A useful product or system", tags: ["Technology", "Problem Solving"] }, { label: "Better health or wellbeing", tags: ["Medicine", "Helping others"] }, { label: "A clear story or visual experience", tags: ["Writing", "Design", "Communication"] }, { label: "A stronger organization or decision", tags: ["Business", "Analysis", "Management"] }] },
 { id: "preference-learning", category: "Preference", prompt: "What would you most like to keep developing?", options: [{ label: "Technical and numerical skills", tags: ["Programming", "Mathematics", "Analysis"] }, { label: "Communication and people skills", tags: ["Communication", "Helping others", "Leadership"] }, { label: "Creative and visual skills", tags: ["Creativity", "Design", "Writing"] }, { label: "Research and subject expertise", tags: ["Research", "Theoretical work", "Science"] }] },
];

function normalize(value: string) { return value.toLowerCase().replace(/[\/&-]/g, " ").replace(/\s+/g, " ").trim(); }
function matchesTag(tags: string[], target: string) { const targetValue = normalize(target); return tags.some((tag) => normalize(tag) === targetValue); }

const domainTags: Record<string, string[]> = {
  Technology: ["Technology", "Programming", "Computer Science", "AI", "Software", "Data", "Cybersecurity", "Cloud"],
  Commerce: ["Commerce", "Finance", "Accounting", "Business", "Banking", "Management"],
  Healthcare: ["Medicine", "Medical", "Healthcare", "Biology", "Helping others"],
  Engineering: ["Engineering"],
  Law: ["Law", "Legal"],
  Arts: ["Arts", "Writing", "Psychology", "Teaching", "Social Service", "History"],
  Design: ["Design", "Creativity"],
  Media: ["Media", "Communication"],
};

type Signal = { tag: string; category: string; strength: number };
type Evidence = { positive: Signal[]; negative: Signal[] };

function collectEvidence(answers: Record<string, number>): Evidence {
  const positive: Signal[] = []; const negative: Signal[] = [];
  for (const question of assessmentQuestions) {
    const answer = answers[question.id]; if (answer === undefined) continue;
    if (question.category === "Preference") {
      const selected = question.options[answer]?.tags ?? [];
      selected.forEach((tag) => positive.push({ tag, category: question.category, strength: 3 }));
      const rejected = question.options.flatMap((option, index) => index === answer ? [] : option.tags);
      rejected.forEach((tag) => negative.push({ tag, category: question.category, strength: 2 }));
      continue;
    }
    const allTags = question.options.flatMap((option) => option.tags);
    const selected = question.options[answer]?.tags ?? [];
    if (answer === 0) allTags.forEach((tag) => negative.push({ tag, category: question.category, strength: 3 }));
    else selected.forEach((tag) => positive.push({ tag, category: question.category, strength: answer }));
  }
  return { positive, negative };
}

function primaryDomain(category: string) { return category === "Finance" || category === "Business" ? "Commerce" : category === "Healthcare" ? "Healthcare" : category; }
function clamp(value: number) { return Math.max(-1, Math.min(1, value)); }

export type CareerParameterScores = { interest: number; preference: number; aptitude: number; skills: number; workStyle: number; education: number; profileFit: number };
export type CareerProfileScore = { careerSlug: string; careerName: string; category: string; score: number; rawScore: number; parameterScores: CareerParameterScores; reasons: string[] };

function collectProfileTags(profile?: { interests?: string[]; skills?: string[]; stream?: string; work_style?: string; preferred_work_environment?: string; preferred_industry?: string; career_interests?: string[]; career_preferences?: unknown }) {
  const tags = [...(profile?.interests ?? []), ...(profile?.skills ?? []), ...(profile?.career_interests ?? []), profile?.stream ?? "", profile?.work_style ?? "", profile?.preferred_work_environment ?? "", profile?.preferred_industry ?? ""];
  const collect = (value: unknown) => { if (typeof value === "string") tags.push(value); else if (Array.isArray(value)) value.forEach(collect); else if (value && typeof value === "object") Object.values(value as Record<string, unknown>).forEach(collect); };
  collect(profile?.career_preferences);
  return tags.filter(Boolean);
}

export function matchCareers(answers: Record<string, number>, profile?: { interests?: string[]; skills?: string[]; stream?: string; work_style?: string; preferred_work_environment?: string; preferred_industry?: string; career_interests?: string[]; career_preferences?: unknown }, limit = 6): CareerProfileScore[] {
  const evidence = collectEvidence(answers); const profileTags = collectProfileTags(profile);
  return careers.map((career) => {
    const domain = primaryDomain(career.category); const domainSet = domainTags[domain] ?? []; const careerTags = [career.category, ...career.interests, ...career.skills, ...career.streams, ...career.aptitude, ...career.workStyle]; const reasons: string[] = [];
    const positiveHits = careerTags.filter((tag) => evidence.positive.some((item) => matchesTag([item.tag], tag))); const negativeHits = careerTags.filter((tag) => evidence.negative.some((item) => matchesTag([item.tag], tag))); const profileHits = careerTags.filter((tag) => profileTags.some((item) => matchesTag([item], tag)));
    const positiveDomain = evidence.positive.filter((item) => item.category === "Interest" && domainSet.some((tag) => matchesTag([item.tag], tag))).reduce((sum, item) => sum + item.strength, 0); const negativeDomain = evidence.negative.filter((item) => item.category === "Interest" && domainSet.some((tag) => matchesTag([item.tag], tag))).reduce((sum, item) => sum + item.strength, 0);
    const positivePreference = evidence.positive.filter((item) => item.category === "Preference" && domainSet.some((tag) => matchesTag([item.tag], tag))).reduce((sum, item) => sum + item.strength, 0); const negativePreference = evidence.negative.filter((item) => item.category === "Preference" && domainSet.some((tag) => matchesTag([item.tag], tag))).reduce((sum, item) => sum + item.strength, 0);
    const interest = clamp((positiveDomain - negativeDomain) / 12); const preference = clamp((positivePreference - negativePreference) / 9);
    const aptitude = clamp(evidence.positive.filter((item) => item.category === "Aptitude" && career.aptitude.some((tag) => matchesTag([item.tag], tag))).reduce((sum, item) => sum + item.strength, 0) / 12);
    const skills = clamp((evidence.positive.filter((item) => item.category === "Skills" && career.skills.some((tag) => matchesTag([item.tag], tag))).reduce((sum, item) => sum + item.strength, 0) + profileHits.filter((tag) => career.skills.includes(tag)).length) / 12);
    const workStyle = clamp(evidence.positive.filter((item) => item.category === "Work style" && career.workStyle.some((tag) => matchesTag([item.tag], tag))).reduce((sum, item) => sum + item.strength, 0) / 12);
    const stream = profile?.stream?.trim();
    const education = stream ? (career.streams.some((item) => matchesTag([item], stream)) ? 1 : -0.35) : 0;
    const profileFit = clamp(profileHits.filter((tag) => career.interests.includes(tag) || career.streams.includes(tag)).length / 5);
    const parameterScores: CareerParameterScores = { interest: Math.round((interest + 1) * 50), preference: Math.round((preference + 1) * 50), aptitude: Math.round((aptitude + 1) * 50), skills: Math.round((skills + 1) * 50), workStyle: Math.round((workStyle + 1) * 50), education: Math.round((education + 1) * 50), profileFit: Math.round((profileFit + 1) * 50) };
    // Domain interest 25%, explicit career preference 25%, aptitude 12%, skills 13%, work style 10%, education 10%, profile fit 5%.
    // Each component is normalized to -1..1, so rejected domains lower the final score instead of being hidden by generic skills.
    const weighted = interest * 25 + preference * 25 + aptitude * 12 + skills * 13 + workStyle * 10 + education * 10 + profileFit * 5;
    const rawScore = Math.round(50 + weighted / 2); const score = Math.max(0, Math.min(100, rawScore));
    const strongestPositive = positiveHits.find((tag) => career.interests.includes(tag) || career.category === tag); const strongestNegative = negativeHits[0];
    if (strongestPositive) reasons.push(`Matches your ${strongestPositive.toLowerCase()} interest`); if (profileHits[0]) reasons.push(`Connects with your ${profileHits[0].toLowerCase()} profile signal`); if (career.aptitude.some((tag) => evidence.positive.some((item) => matchesTag([item.tag], tag)))) reasons.push(`Uses your ${career.aptitude[0].toLowerCase()} aptitude`); if (strongestNegative) reasons.push(`Lower match because ${strongestNegative.toLowerCase()} was rejected`); if (!reasons.length) reasons.push(`Explore this ${career.category.toLowerCase()} path`);
    return { careerSlug: career.slug, careerName: career.name, category: career.category, score, rawScore, parameterScores, reasons: reasons.slice(0, 4) };
  }).sort((a, b) => b.score - a.score || b.rawScore - a.rawScore || a.careerName.localeCompare(b.careerName)).slice(0, Math.max(0, limit));
}
