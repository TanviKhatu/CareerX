import { careers } from "./careers";

export type AssessmentOption = { label: string; tags: string[] };
export type AssessmentQuestion = { id: string; category: string; signalCategory?: string; prompt: string; options: AssessmentOption[] };

const options = (labels: string[], tags: string[][]): AssessmentOption[] => labels.map((label, index) => ({ label, tags: tags[index] }));
const rankedScenario = (tags: string[], responses: [string, string, string, string]): AssessmentOption[] => options(responses, [[], tags.slice(0, 1), tags.slice(0, 2), tags]);

export const assessmentQuestions: AssessmentQuestion[] = [
 { id: "interest-technology", category: "Interest", prompt: "Your team’s prototype keeps freezing during a demo. What would you be most interested in doing?", options: rankedScenario(["Technology", "Engineering", "Problem Solving"], ["Hand the troubleshooting to someone else and move on", "Try a quick fix by following the setup instructions", "Test a few likely causes and see which changes the result", "Trace how the system works, isolate the fault, and improve the design"]) },
 { id: "interest-science", category: "Interest", prompt: "A class experiment produces a result nobody expected. What would you want to explore?", options: rankedScenario(["Science", "Medicine", "Research"], ["Set the result aside and continue with the next activity", "Review the steps to see if anything was missed", "Compare the result with the original prediction and look for patterns", "Design another test to understand what caused the unexpected result"]) },
 { id: "interest-business", category: "Interest", prompt: "Your club has a limited budget for its next event. Which part would you most enjoy working on?", options: rankedScenario(["Finance", "Business", "Numerical ability"], ["Choose an idea without getting involved in the budget", "List the main costs so the group knows what it can afford", "Compare costs and expected turnout for a few event ideas", "Build a budget and recommend the option with the strongest value"]) },
 { id: "interest-design", category: "Interest", prompt: "Students say a new event sign is hard to follow. What would you focus on?", options: rankedScenario(["Design", "Creativity", "Visual thinking"], ["Leave the sign as it is and direct people if they ask", "Make the wording shorter and easier to read", "Rearrange the information so the important details stand out", "Try alternative layouts and see which makes the directions clearest"]) },
 { id: "interest-people", category: "Interest", prompt: "A classmate is falling behind in a subject they used to enjoy. What would you be curious to understand?", options: rankedScenario(["Psychology", "Teaching", "Social Service"], ["Assume they will catch up on their own", "Ask whether anything about the class has been difficult", "Explore what support or learning approach might help", "Understand the wider challenges affecting them and connect them with support"]) },
 { id: "interest-writing", category: "Interest", prompt: "Your group has a useful project, but other students do not understand why it matters. What would you do?", options: rankedScenario(["Writing", "Media", "Communication"], ["Let someone else explain the project", "Write a short description of what the group made", "Shape the key points into a clear story for other students", "Create a compelling message using words, visuals, or video"]) },
 { id: "aptitude-logic", category: "Aptitude", prompt: "Three clues about a school mystery point to different explanations. How would you work through them?", options: rankedScenario(["Logical reasoning", "Problem Solving", "Evidence"], ["Pick the explanation that sounds most familiar", "Look at each clue and note what it might mean", "Compare which explanations fit the clues best", "Test each explanation against all the clues and rule out contradictions"]) },
 { id: "aptitude-numbers", category: "Aptitude", prompt: "Your class must choose between event venues with different prices and capacities. What would you do?", options: rankedScenario(["Numerical ability", "Mathematics", "Finance"], ["Choose based on appearance without comparing the details", "Check the listed prices and capacities", "Estimate the cost per attendee for each venue", "Compare the numbers, account for likely attendance, and recommend the best fit"]) },
 { id: "aptitude-verbal", category: "Aptitude", prompt: "A new student is confused by a set of complicated project instructions. How would you help?", options: rankedScenario(["Verbal reasoning", "Communication", "Teaching"], ["Suggest they ask someone else to explain it", "Repeat the instructions more slowly", "Break the instructions into simpler steps", "Check what they already understand, then explain the idea in a clear example"]) },
 { id: "aptitude-analysis", category: "Aptitude", prompt: "Two online posts make opposite claims about a topic you are researching. What would you check first?", options: rankedScenario(["Analytical thinking", "Research", "Journalism"], ["Share the post that seems more convincing", "Look for where each post got its information", "Compare the evidence and dates behind both claims", "Trace the claims to reliable original sources and check what the evidence supports"]) },
 { id: "style-team", category: "Personality", signalCategory: "Work style", prompt: "Your project team includes people with different strengths, but the ideas are not coming together. What role suits you?", options: rankedScenario(["Teamwork", "Communication", "Collaboration"], ["Prefer to complete a separate task on your own", "Share your own ideas when the group asks", "Help the group hear and build on each person’s ideas", "Bring the different expertise together to solve the shared problem"]) },
 { id: "style-independent", category: "Personality", signalCategory: "Work style", prompt: "You have a multi-week project and your teacher will not check in often. How would you approach it?", options: rankedScenario(["Independent work", "Research", "Self-direction"], ["Wait for reminders before making progress", "Start when the next deadline gets close", "Set a few milestones and work through them independently", "Plan the whole project, track your progress, and adjust your approach as needed"]) },
 { id: "style-creative", category: "Personality", signalCategory: "Work style", prompt: "A community group asks your team to make an event more welcoming but gives few details. What would you do?", options: rankedScenario(["Creativity", "Design", "Content Creation"], ["Ask for a detailed plan before contributing", "Suggest a familiar idea that has worked before", "Explore a few fresh ideas that fit the goal", "Turn the open-ended brief into an original concept and test how well it works"]) },
 { id: "style-leadership", category: "Personality", signalCategory: "Work style", prompt: "Your group is stuck choosing its next step and the deadline is approaching. What would you do?", options: rankedScenario(["Leadership", "Planning", "Teaching"], ["Wait for someone else to make the decision", "Offer an idea if the group asks for one", "Help compare the options and agree on a next step", "Clarify the goal, organize the choices, and take responsibility for moving forward"]) },
 { id: "style-research", category: "Personality", signalCategory: "Work style", prompt: "You are preparing a presentation and notice that one important detail may be outdated. What would you do?", options: rankedScenario(["Research", "Evidence", "Journalism"], ["Use the detail as written to finish faster", "Look for a more recent source", "Check whether the new source supports the same conclusion", "Verify the detail across reliable sources before presenting it as fact"]) },
 { id: "style-helping", category: "Personality", signalCategory: "Work style", prompt: "A friend is stressed about a difficult decision and starts talking with you. How would you respond?", options: rankedScenario(["Empathy", "Social Service", "Helping others"], ["Change the subject because you are unsure what to say", "Listen and offer a quick suggestion", "Ask what they need and listen without judging", "Help them explore their options while respecting that the decision is theirs"]) },
 { id: "style-practical", category: "Personality", signalCategory: "Work style", prompt: "Your first attempt at building a simple model does not work as expected. What would you try next?", options: rankedScenario(["Practical work", "Engineering", "Problem Solving"], ["Stop working on it and switch to another task", "Follow the instructions again from the beginning", "Change one part and see what happens", "Run a small test, observe the result, and refine the model step by step"]) },
 { id: "style-theoretical", category: "Personality", signalCategory: "Work style", prompt: "A school rule changes and students disagree about whether it is fair. What would you want to examine?", options: rankedScenario(["Research", "Law", "Analysis"], ["Follow the new rule without looking into it", "Ask what reason was given for the change", "Compare the reasons and how the rule affects students", "Explore the principles behind the rule and whether they are applied consistently"]) },
 { id: "skill-programming", category: "Technical", signalCategory: "Skills", prompt: "A digital tool gives your team an unexpected result just before a presentation. What would you do?", options: rankedScenario(["Technical", "Engineering", "Problem Solving"], ["Avoid the tool and move on without investigating", "Repeat the steps to check whether the result happens again", "Inspect the settings and test likely causes", "Trace the process, isolate the fault, and verify a fix before the presentation"]) },
 { id: "skill-communication", category: "Technical", signalCategory: "Skills", prompt: "You are explaining a project to someone who is new to the topic and looks confused. What would you do?", options: rankedScenario(["Communication", "Teaching", "Writing"], ["Continue with the explanation you already prepared", "Repeat the main point using different words", "Ask what part is unclear and adjust your explanation", "Use what they know already to build a clear example they can follow"]) },
 { id: "skill-leadership", category: "Technical", signalCategory: "Skills", prompt: "Your group must recommend one of two proposals, and each member favors a different one. How would you help decide?", options: rankedScenario(["Analysis", "Law", "Finance"], ["Support whichever option most people already prefer", "List a few advantages and disadvantages", "Compare the proposals against the group’s goals and evidence", "Organize the evidence, weigh the trade-offs, and explain a well-supported recommendation"]) },
 { id: "skill-creativity", category: "Technical", signalCategory: "Skills", prompt: "Your team has a rough idea for a campaign but needs something people can understand quickly. What would you contribute?", options: rankedScenario(["Creativity", "Design", "Content Creation"], ["Wait until someone else develops the idea", "Suggest a straightforward way to present the main point", "Shape the idea into a clear visual or short story", "Develop and refine an engaging concept that makes the message memorable"]) },
 { id: "preference-environment", category: "Preference", prompt: "At a community event, a few different tasks need volunteers. Which would you choose for the day?", options: options(["Build or test a system for the event", "Teach or support an attendee", "Investigate a concern and check the facts", "Create a story or experience to engage visitors"], [["Engineering", "Technology"], ["Teaching", "Social Service", "Medicine"], ["Journalism", "Law", "Research"], ["Media", "Design", "Content Creation"]]) },
 { id: "preference-impact", category: "Preference", prompt: "Your team can make one improvement to a service used by students. Which result would matter most to you?", options: options(["A safer or more useful product", "A student learns or feels supported", "A decision is fair and evidence-based", "An audience understands or feels something"], [["Engineering", "Problem Solving"], ["Teaching", "Social Service", "Medicine"], ["Law", "Finance", "Evidence"], ["Media", "Journalism", "Content Creation"]]) },
 { id: "preference-learning", category: "Scenario", signalCategory: "Preference", prompt: "A project deadline is close, and you discover a claim in the work may be wrong. What would you do first?", options: options(["Check the underlying data and test the result", "Tell the affected person and work out how to correct it", "Pause publication and verify the source before sharing", "Explain the uncertainty clearly and offer a revised version"], [["Engineering", "Finance", "Analysis"], ["Medicine", "Teaching", "Social Service"], ["Journalism", "Law", "Evidence"], ["Media", "Content Creation", "Communication"]]) },
];

function normalize(value: string) { return value.toLowerCase().replace(/[\/&-]/g, " ").replace(/\s+/g, " ").trim(); }
function matchesTag(tags: string[], target: string) { const targetValue = normalize(target); return tags.some((tag) => normalize(tag) === targetValue); }

const domainTags: Record<string, string[]> = {
  Engineering: ["Engineering", "Technology", "Problem Solving", "Technical"],
  Healthcare: ["Medicine", "Healthcare", "Science", "Helping others", "Empathy"],
  Education: ["Teaching", "Education", "Communication", "Helping others"],
  Law: ["Law", "Legal", "Evidence", "Research", "Writing"],
  Design: ["Design", "Creativity", "Visual thinking", "Research"],
  "Social Service": ["Social Service", "Psychology", "Helping others", "Empathy"],
  Finance: ["Finance", "Business", "Numerical ability", "Analysis"],
  Media: ["Media", "Communication", "Storytelling", "Creativity"],
  "Content Creation": ["Content Creation", "Writing", "Media", "Creativity"],
  Journalism: ["Journalism", "Media", "Writing", "Research", "Evidence"],
};

type Signal = { tag: string; category: string; strength: number };
type Evidence = { positive: Signal[]; negative: Signal[] };

function collectEvidence(answers: Record<string, number>): Evidence {
  const positive: Signal[] = []; const negative: Signal[] = [];
  for (const question of assessmentQuestions) {
    const answer = answers[question.id]; if (answer === undefined) continue;
    const category = question.signalCategory ?? question.category;
    if (category === "Preference") {
      const selected = question.options[answer]?.tags ?? [];
      selected.forEach((tag) => positive.push({ tag, category, strength: 3 }));
      const rejected = question.options.flatMap((option, index) => index === answer ? [] : option.tags);
      rejected.forEach((tag) => negative.push({ tag, category, strength: 2 }));
      continue;
    }
    const allTags = question.options.flatMap((option) => option.tags);
    const selected = question.options[answer]?.tags ?? [];
    if (answer === 0) allTags.forEach((tag) => negative.push({ tag, category, strength: 3 }));
    else selected.forEach((tag) => positive.push({ tag, category, strength: answer }));
  }
  return { positive, negative };
}

function primaryDomain(category: string) { return category; }
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
