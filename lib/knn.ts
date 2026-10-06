import { assessmentQuestions } from "./assessment";
import { careers, type Career } from "./careers";

export type StudentAnswers = Record<string, number>;

export type KnnProfile = {
  interests?: string[] | null;
  skills?: string[] | null;
  stream?: string | null;
  work_style?: string | null;
  preferred_work_environment?: string | null;
  career_interests?: string[] | null;
  preferred_industry?: string | null;
  higher_education_preference?: string | null;
  education_level?: string | null;
  academic_performance?: string | null;
  career_preferences?: unknown;
};

export type KnnOptions = { k?: number };
export type FeatureGroup = "domain" | "trait" | "education";
export type FeatureVector = Record<string, number>;
export type GroupedVector = Record<FeatureGroup, FeatureVector>;

export type KnnVector = { vector: FeatureVector; groups: GroupedVector };

export type KnnPrediction = {
  rank: number;
  careerSlug: string;
  careerName: string;
  category: string;
  distance: number;
  similarity: number;
  matchingAreas: string[];
  explanation: string;
};

export type KnnPredictionSet = {
  algorithm: "content-based-knn-v1";
  k: number;
  distanceMetric: "euclidean";
  predictions: KnnPrediction[];
  studentFeatureCount: number;
  featureDimensions: number;
};

export type KnnCandidate = { career: Career; grouped: GroupedVector; vector: FeatureVector };
export type RankedCareer = { career: Career; vector: FeatureVector; distance: number };

const DEFAULT_K = 5;
const MAX_SIGNAL = 3;
const featureGroups: FeatureGroup[] = ["domain", "trait", "education"];
const groupWeights: Record<FeatureGroup, number> = { domain: 1.35, trait: 1.0, education: 0.85 };

type FeatureRef = { group: FeatureGroup; key: string };

function normalizeTag(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\/&-]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function refsForTag(tag: string): FeatureRef[] {
  const normalized = normalizeTag(tag);
  if (!normalized) return [];
  const refs: FeatureRef[] = [];
  const has = (phrase: string) => normalized.includes(phrase);
  const addDomain = (key: string) => refs.push({ group: "domain", key });
  const addTrait = (key: string) => refs.push({ group: "trait", key });
  const addEducation = (key: string) => refs.push({ group: "education", key });

  if (
    has("computer science") ||
    has("computer") ||
    has("technology") ||
    has("software") ||
    has("program") ||
    has("data") ||
    has("cloud") ||
    has("cybersecurity") ||
    has("networking") ||
    has("electronics") ||
    has("machine learning") ||
    has("artificial intelligence")
  ) {
    addDomain("technology");
  }
  if (has("science") || has("biology") || has("chemistry") || has("physics")) addDomain("science");
  if (
    has("commerce") ||
    has("finance") ||
    has("account") ||
    has("bank") ||
    has("business") ||
    has("economics") ||
    has("management") ||
    has("marketing")
  ) {
    addDomain("commerce");
  }
  if (has("medicine") || has("medical") || has("healthcare") || has("health") || has("nursing") || has("nutrition")) {
    addDomain("healthcare");
  }
  if (has("engineering")) addDomain("engineering");
  if (has("law") || has("legal") || has("civics")) addDomain("law");
  if (has("arts") || has("humanities") || has("history") || has("literature")) addDomain("arts");
  if (has("design") || has("fashion") || has("animation") || has("visual")) addDomain("design");
  if (has("media") || has("journalism") || has("broadcasting")) addDomain("media");
  if (has("social service")) addDomain("social_service");
  if (has("psychology")) addDomain("psychology");
  if (has("teaching") || has("education") || has("pedagogy")) addDomain("teaching");
  if (has("research")) addDomain("research");

  if (has("programming") || has("program")) addTrait("programming");
  if (has("numerical ability")) addTrait("numerical_ability");
  if (has("mathematics")) addTrait("mathematics");
  if (has("statistics")) {
    addTrait("mathematics");
    addTrait("numerical_ability");
  }
  if (has("analysis")) addTrait("analysis");
  if (has("problem solving")) addTrait("problem_solving");
  if (has("communication") || has("writing")) addTrait("communication");
  if (has("writing") || has("literature") || has("story")) addTrait("writing");
  if (has("creativity")) addTrait("creativity");
  if (has("leadership")) addTrait("leadership");
  if (has("teamwork")) addTrait("teamwork");
  if (has("helping others")) addTrait("helping_others");
  if (has("independent work")) addTrait("independent_work");
  if (has("practical work")) addTrait("practical_work");
  if (has("theoretical work")) addTrait("theoretical_work");
  if (has("logical reasoning")) addTrait("logical_reasoning");
  if (has("verbal reasoning")) addTrait("verbal_reasoning");
  if (has("management")) addTrait("management");
  if (has("public speaking")) addTrait("public_speaking");
  if (has("research")) addTrait("research");
  if (has("social service")) addTrait("helping_others");

  if (has("computer science") || has("computer")) addEducation("computer_science");
  if (has("engineering")) addEducation("engineering");
  if (has("medicine") || has("medical")) addEducation("medical");
  if (has("commerce") || has("finance") || has("account") || has("bank") || has("business") || has("economics")) {
    addEducation("commerce");
  }
  if (has("arts") || has("humanities")) addEducation("arts");
  if (has("science")) addEducation("science");
  if (has("vocational")) addEducation("vocational");
  if (has("other")) addEducation("other");

  return dedupeRefs(refs);
}

function dedupeRefs(refs: FeatureRef[]): FeatureRef[] {
  const seen = new Set<string>();
  const unique: FeatureRef[] = [];
  for (const ref of refs) {
    const id = ref.group + ":" + ref.key;
    if (seen.has(id)) continue;
    seen.add(id);
    unique.push(ref);
  }
  return unique;
}

function emptyGroups(): GroupedVector {
  return { domain: {}, trait: {}, education: {} };
}

function addSignal(groups: GroupedVector, tag: string, amount: number): void {
  if (!tag || amount <= 0) return;
  const refs = refsForTag(tag);
  if (refs.length === 0) return;
  for (const ref of refs) {
    const current = groups[ref.group][ref.key] ?? 0;
    groups[ref.group][ref.key] = Math.min(MAX_SIGNAL, current + amount);
  }
}

function addStringTags(groups: GroupedVector, value: string | string[] | null | undefined, weight: number): void {
  if (!value) return;
  const tags = Array.isArray(value) ? value : [value];
  tags
    .filter((item): item is string => typeof item === "string" && item.trim() !== "")
    .forEach((tag) => addSignal(groups, tag, weight));
}

function collectStrings(value: unknown, acc: string[]): void {
  if (typeof value === "string") acc.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, acc));
  else if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((item) => collectStrings(item, acc));
  }
}

export function normalizeVector(groups: GroupedVector): FeatureVector {
  const vector: FeatureVector = {};
  for (const group of featureGroups) {
    const normalized = normalizeGroupVector(groups[group]);
    const weight = groupWeights[group];
    for (const [key, value] of Object.entries(normalized)) {
      if (value > 0) vector[group + "." + key] = value * weight;
    }
  }
  return vector;
}

function normalizeGroupVector(vector: FeatureVector): FeatureVector {
  let sum = 0;
  for (const value of Object.values(vector)) sum += value * value;
  const magnitude = Math.sqrt(sum);
  if (magnitude === 0) return {};
  const normalized: FeatureVector = {};
  for (const [key, value] of Object.entries(vector)) normalized[key] = value / magnitude;
  return normalized;
}

export function euclideanDistance(a: FeatureVector, b: FeatureVector): number {
  const keys = new Set<string>([...Object.keys(a), ...Object.keys(b)]);
  let sum = 0;
  for (const key of keys) {
    const diff = (a[key] ?? 0) - (b[key] ?? 0);
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export function similarityFromDistance(distance: number): number {
  if (distance <= 0) return 1;
  return Math.min(1, 1 / (1 + distance));
}

export function resolveK(k?: number): number {
  const numeric = typeof k === "number" && Number.isFinite(k) ? Math.floor(k) : DEFAULT_K;
  return numeric >= 1 ? numeric : DEFAULT_K;
}

export function buildStudentFeatureVector(
  answers: StudentAnswers | null | undefined,
  profile: KnnProfile | null | undefined = undefined
): KnnVector {
  const groups = emptyGroups();
  const answersRecord = answers ?? {};
  for (const question of assessmentQuestions) {
    const answer = answersRecord[question.id];
    if (typeof answer !== "number" || Number.isNaN(answer) || answer < 0 || answer > 3) continue;
    const selected = question.options[answer];
    if (!selected) continue;
    const isPreference = question.category === "Preference";
    const strength = isPreference ? 1 : answer / 3;
    const weight =
      question.category === "Interest"
        ? 1.3
        : question.category === "Aptitude"
        ? 1.15
        : question.category === "Skills"
        ? 1.15
        : question.category === "Work style"
        ? 1.05
        : 1.0;
    for (const tag of selected.tags) addSignal(groups, tag, strength * weight);
  }
  const profileValue: KnnProfile = profile ?? {};
  addStringTags(groups, profileValue.interests, 1.1);
  addStringTags(groups, profileValue.career_interests, 1.1);
  addStringTags(groups, profileValue.skills, 1.2);
  addStringTags(groups, profileValue.stream, 1.25);
  addStringTags(groups, profileValue.work_style, 1.0);
  addStringTags(groups, profileValue.preferred_work_environment, 1.0);
  addStringTags(groups, profileValue.preferred_industry, 1.2);
  if (profileValue.career_preferences) {
    const parsed: string[] = [];
    collectStrings(profileValue.career_preferences, parsed);
    parsed.forEach((tag) => addSignal(groups, tag, 0.9));
  }
  return { groups, vector: normalizeVector(groups) };
}

export function buildCareerFeatureVector(career: Career): KnnVector {
  const groups = emptyGroups();
  addSignal(groups, career.category, 1.8);
  career.interests.forEach((tag) => addSignal(groups, tag, 1.1));
  career.skills.forEach((tag) => addSignal(groups, tag, 1.25));
  career.streams.forEach((tag) => addSignal(groups, tag, 1.15));
  career.aptitude.forEach((tag) => addSignal(groups, tag, 1.1));
  career.workStyle.forEach((tag) => addSignal(groups, tag, 1.0));
  career.subjects.forEach((tag) => addSignal(groups, tag, 0.7));
  addSignal(groups, career.environment, 0.6);
  addSignal(groups, career.scope, 0.3);
  return { groups, vector: normalizeVector(groups) };
}

export function buildCareerFeatureVectors(careersList?: Career[]): KnnCandidate[] {
  return (careersList ?? careers).map((career) => {
    const grouped = extractCareerGroups(career);
    return { career, grouped, vector: normalizeVector(grouped) };
  });
}

function extractCareerGroups(career: Career): GroupedVector {
  return buildCareerFeatureVector(career).groups;
}

export function extractStudentGroups(
  answers: StudentAnswers | null | undefined,
  profile: KnnProfile | null | undefined = undefined
): GroupedVector {
  return buildStudentFeatureVector(answers, profile).groups;
}

export function matchingAreas(student: GroupedVector, career: GroupedVector): string[] {
  const byLabel = new Map<string, number>();
  for (const group of featureGroups) {
    const studentGroup = student[group];
    const careerGroup = career[group];
    for (const key of Object.keys(studentGroup)) {
      if (careerGroup[key] > 0 && studentGroup[key] > 0) {
        const label = humanLabel(key);
        const score = Math.min(studentGroup[key] ?? 0, careerGroup[key] ?? 0);
        const existing = byLabel.get(label) ?? 0;
        if (score > existing) byLabel.set(label, score);
      }
    }
  }
  return Array.from(byLabel.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 4)
    .map((entry) => entry[0]);
}

function humanLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function round(value: number, digits: number): number {
  const factor = Math.pow(10, digits);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function explainPrediction(areas: string[], category: string): string {
  const top = areas.slice(0, 3);
  const list = top.length ? top.join(", ") : "aligned profile signals";
  return `Content-based KNN match for the ${category} category, strongest overlap on ${list}.`;
}

export function selectKNearestCareers(
  studentVector: FeatureVector,
  candidates: KnnCandidate[],
  options: KnnOptions = {}
): RankedCareer[] {
  const k = resolveK(options.k);
  const ranked = candidates
    .map((candidate) => ({ candidate, distance: euclideanDistance(studentVector, candidate.vector) }))
    .sort((a, b) => a.distance - b.distance || a.candidate.career.name.localeCompare(b.candidate.career.name));
  return ranked.slice(0, Math.min(k, ranked.length)).map((item) => ({
    career: item.candidate.career,
    vector: item.candidate.vector,
    distance: item.distance,
  }));
}

export function formatKnnPredictions(
  nearest: RankedCareer[],
  student: KnnVector,
  k: number
): KnnPrediction[] {
  return nearest.map((item, index) => {
    const distance = round(item.distance, 4);
    const areas = matchingAreas(student.groups, groupsForItem(item));
    return {
      rank: index + 1,
      careerSlug: item.career.slug,
      careerName: item.career.name,
      category: item.career.category,
      distance,
      similarity: round(similarityFromDistance(item.distance), 4),
      matchingAreas: areas,
      explanation: explainPrediction(areas, item.career.category),
    };
  });
}

function groupsForItem(item: RankedCareer): GroupedVector {
  return buildCareerFeatureVector(item.career).groups;
}

export function predictCareersWithKnn(
  answers: StudentAnswers | null | undefined,
  profile: KnnProfile | null | undefined = undefined,
  options: KnnOptions = {}
): KnnPredictionSet {
  const k = resolveK(options.k);
  const student = buildStudentFeatureVector(answers, profile);
  const candidates = buildCareerFeatureVectors();
  const nearest = selectKNearestCareers(student.vector, candidates, options);
  const predictions = formatKnnPredictions(nearest, student, k);
  return {
    algorithm: "content-based-knn-v1",
    k,
    distanceMetric: "euclidean",
    predictions,
    studentFeatureCount: nonZeroCount(student.vector),
    featureDimensions: distinctDimensionCount(candidates),
  };
}

function distinctDimensionCount(candidates: KnnCandidate[]): number {
  const keys = new Set<string>();
  candidates.forEach((item) => Object.keys(item.vector).forEach((key) => keys.add(key)));
  return keys.size;
}

function nonZeroCount(vector: FeatureVector): number {
  let count = 0;
  for (const value of Object.values(vector)) if (value > 0) count += 1;
  return count;
}
