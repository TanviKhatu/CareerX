"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Search,
  Filter,
  TrendingUp,
  Award,
  BookOpen,
} from "lucide-react";
import { careers, type Career } from "@/lib/careers";

export type SkillItem = {
  id: string;
  name: string;
  category: "Technical" | "Analytical" | "Creative" | "Soft Skills" | "Domain";
  level: number; // 1 to 5
  status: "learning" | "practicing" | "mastered";
};

const defaultInitialSkills: SkillItem[] = [
  { id: "1", name: "Problem Solving", category: "Analytical", level: 4, status: "mastered" },
  { id: "2", name: "Communication", category: "Soft Skills", level: 3, status: "practicing" },
  { id: "3", name: "Teamwork", category: "Soft Skills", level: 4, status: "mastered" },
  { id: "4", name: "Analysis", category: "Analytical", level: 3, status: "practicing" },
  { id: "5", name: "Creativity", category: "Creative", level: 3, status: "practicing" },
  { id: "6", name: "Research", category: "Analytical", level: 3, status: "practicing" },
  { id: "7", name: "Technical", category: "Technical", level: 2, status: "learning" },
];

const popularSkillSuggestions = [
  { name: "Writing", category: "Creative" as const },
  { name: "Numerical ability", category: "Analytical" as const },
  { name: "Visual thinking", category: "Creative" as const },
  { name: "Planning", category: "Soft Skills" as const },
  { name: "Ethics", category: "Soft Skills" as const },
  { name: "Evidence", category: "Analytical" as const },
  { name: "Leadership", category: "Soft Skills" as const },
  { name: "Empathy", category: "Soft Skills" as const },
  { name: "Collaboration", category: "Soft Skills" as const },
];

const categories = ["All", "Technical", "Analytical", "Creative", "Soft Skills", "Domain"] as const;

export function SkillsView({
  initialProfileSkills = [],
  topCareerSlug = "engineer",
}: {
  initialProfileSkills?: string[];
  topCareerSlug?: string;
}) {
  const [skills, setSkills] = useState<SkillItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("careerx_skills_data");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    if (initialProfileSkills.length > 0) {
      return initialProfileSkills.map((s, idx) => ({
        id: `profile-${idx}`,
        name: s,
        category: "Technical",
        level: 3,
        status: "practicing",
      }));
    }
    return defaultInitialSkills;
  });

  const [selectedCareerSlug, setSelectedCareerSlug] = useState<string>(topCareerSlug || "engineer");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState<SkillItem["category"]>("Technical");
  const [newSkillLevel, setNewSkillLevel] = useState(3);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("careerx_skills_data", JSON.stringify(skills));
    } catch {
      // ignore
    }
  }, [skills]);

  const targetCareer: Career = useMemo(() => {
    return careers.find((c) => c.slug === selectedCareerSlug) || careers[0];
  }, [selectedCareerSlug]);

  const filteredSkills = useMemo(() => {
    return skills.filter((item) => {
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      const matchesQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [skills, activeCategory, searchQuery]);

  // Skill Gap Analysis
  const requiredSkills = targetCareer.skills || [];
  const matchedSkills = useMemo(() => {
    return requiredSkills.filter((req) =>
      skills.some((s) => s.name.toLowerCase().trim() === req.toLowerCase().trim())
    );
  }, [requiredSkills, skills]);

  const gapSkills = useMemo(() => {
    return requiredSkills.filter(
      (req) => !skills.some((s) => s.name.toLowerCase().trim() === req.toLowerCase().trim())
    );
  }, [requiredSkills, skills]);

  const readinessScore = useMemo(() => {
    if (!requiredSkills.length) return 100;
    const matchCount = matchedSkills.length;
    // factor in proficiency level of matches
    const totalPossible = requiredSkills.length * 5;
    let earned = 0;
    requiredSkills.forEach((req) => {
      const found = skills.find((s) => s.name.toLowerCase().trim() === req.toLowerCase().trim());
      if (found) {
        earned += found.level;
      }
    });
    return Math.min(100, Math.round((earned / totalPossible) * 100));
  }, [requiredSkills, matchedSkills, skills]);

  const addSkill = (name: string, category: SkillItem["category"], level = 3) => {
    if (!name.trim()) return;
    if (skills.some((s) => s.name.toLowerCase().trim() === name.toLowerCase().trim())) {
      return;
    }
    const newSkill: SkillItem = {
      id: `skill-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      category,
      level,
      status: level >= 4 ? "mastered" : level >= 3 ? "practicing" : "learning",
    };
    setSkills((prev) => [newSkill, ...prev]);
    setNewSkillName("");
    setShowAddForm(false);
  };

  const removeSkill = (id: string) => {
    setSkills((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSkillLevel = (id: string, newLevel: number) => {
    setSkills((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        return {
          ...s,
          level: newLevel,
          status: newLevel >= 4 ? "mastered" : newLevel >= 3 ? "practicing" : "learning",
        };
      })
    );
  };

  const resetToDefaults = () => {
    setSkills(defaultInitialSkills);
    try {
      localStorage.removeItem("careerx_skills_data");
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e05e43]">Skills</p>
          <h1 className="display-font mt-2 text-4xl tracking-tight sm:text-5xl">Your skill signal.</h1>
          <p className="mt-3 max-w-xl text-[#667085]">
            Map what you already bring to the table, benchmark against target careers, and identify high-leverage gaps.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full bg-[#223b83] px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_#142658] transition hover:bg-[#1a2f6b]"
          >
            <Plus size={16} /> Add new skill
          </button>
          <button
            type="button"
            onClick={resetToDefaults}
            title="Reset to default example skills"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#dfe3dc] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#667085] hover:bg-[#f0f2ed]"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      {/* Target Career Benchmark & Gap Analysis Card */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-[#cfd8ef] bg-[#e8edff] p-6 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#223b83]">Career Benchmark</span>
            <Sparkles size={18} className="text-[#223b83]" />
          </div>

          <label className="mt-4 block text-xs font-bold text-[#667085]">Select Target Career:</label>
          <select
            value={selectedCareerSlug}
            onChange={(e) => setSelectedCareerSlug(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-[#cad5f2] bg-white px-3.5 py-2.5 text-sm font-bold text-[#182032] outline-none focus:border-[#223b83]"
          >
            {careers.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name} ({c.category})
              </option>
            ))}
          </select>

          <div className="mt-6 border-t border-[#d4def7] pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold text-[#223b83]">Skill Readiness</span>
              <span className="display-font text-3xl font-bold text-[#223b83]">{readinessScore}%</span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/70">
              <div
                style={{ width: `${readinessScore}%` }}
                className={`h-full rounded-full transition-all duration-500 ${
                  readinessScore >= 70 ? "bg-[#48a582]" : readinessScore >= 40 ? "bg-[#e05e43]" : "bg-[#223b83]"
                }`}
              />
            </div>
            <p className="mt-2 text-xs text-[#556997]">
              {matchedSkills.length} of {requiredSkills.length} core competencies matched for {targetCareer.name}.
            </p>
          </div>
        </div>

        {/* Skill Gap Deep Dive */}
        <div className="rounded-2xl border border-[#e3e6df] bg-white p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#182032]">Gap Analysis for {targetCareer.name}</h2>
              <p className="mt-0.5 text-xs text-[#8b93a2]">
                Key skills required in professional practice vs your current inventory.
              </p>
            </div>
            <Link
              href="/learning"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#223b83] hover:underline"
            >
              Go to learning plan <ArrowRight size={13} />
            </Link>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {/* Matched Skills */}
            <div className="rounded-xl border border-[#e3f2ec] bg-[#f4f9f7] p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#48a582]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#25805c]">
                  Your Strengths ({matchedSkills.length})
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {matchedSkills.length > 0 ? (
                  matchedSkills.map((name) => {
                    const sk = skills.find((s) => s.name.toLowerCase().trim() === name.toLowerCase().trim());
                    return (
                      <span
                        key={name}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#cde8dc] bg-white px-2.5 py-1 text-xs font-bold text-[#25805c]"
                      >
                        {name}
                        <span className="rounded bg-[#e3f2ec] px-1 py-0.2 text-[10px] text-[#48a582]">
                          Lvl {sk?.level ?? 3}
                        </span>
                      </span>
                    );
                  })
                ) : (
                  <p className="text-xs text-[#8b93a2]">No matching skills yet.</p>
                )}
              </div>
            </div>

            {/* Gap Skills */}
            <div className="rounded-xl border border-[#fbe5e0] bg-[#fff8f7] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-[#e05e43]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#b83d24]">
                    Skills to Build ({gapSkills.length})
                  </span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {gapSkills.length > 0 ? (
                  gapSkills.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => addSkill(name, "Domain", 1)}
                      title="Click to add this skill to your inventory"
                      className="group inline-flex items-center gap-1.5 rounded-lg border border-[#f8cfc6] bg-white px-2.5 py-1 text-xs font-bold text-[#b83d24] transition hover:bg-[#e05e43] hover:text-white"
                    >
                      <Plus size={12} className="group-hover:rotate-90 transition-transform" />
                      {name}
                    </button>
                  ))
                ) : (
                  <p className="text-xs font-medium text-[#48a582]">
                    Fantastic! You cover all core skills for this career.
                  </p>
                )}
              </div>
              {gapSkills.length > 0 && (
                <p className="mt-3 text-[11px] text-[#8b93a2]">
                  Tip: Click any missing skill above to add it to your active tracking.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Skill Drawer / Modal Form */}
      {showAddForm && (
        <div className="rounded-2xl border border-[#dfe3dc] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#182032]">Add a New Skill</h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs font-bold text-[#8b93a2] hover:text-[#182032]"
            >
              Close
            </button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-bold text-[#667085]">Skill Name</label>
              <input
                type="text"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="e.g. Data Analysis, Figma, Python"
                className="mt-1 w-full rounded-xl border border-[#dfe3dc] bg-white px-3.5 py-2 text-sm outline-none focus:border-[#223b83]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#667085]">Category</label>
              <select
                value={newSkillCategory}
                onChange={(e) => setNewSkillCategory(e.target.value as SkillItem["category"])}
                className="mt-1 w-full rounded-xl border border-[#dfe3dc] bg-white px-3.5 py-2 text-sm outline-none focus:border-[#223b83]"
              >
                <option value="Technical">Technical</option>
                <option value="Analytical">Analytical</option>
                <option value="Creative">Creative</option>
                <option value="Soft Skills">Soft Skills</option>
                <option value="Domain">Domain</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-[#667085]">Initial Level (1 to 5)</label>
              <div className="mt-1 flex items-center gap-1.5 py-1">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setNewSkillLevel(lvl)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition ${
                      newSkillLevel === lvl
                        ? "bg-[#223b83] text-white"
                        : "border border-[#dfe3dc] bg-white text-[#667085] hover:bg-[#f7f8f5]"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[#eef0ec] pt-4">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#8b93a2]">
              <span>Quick add:</span>
              {popularSkillSuggestions.slice(0, 5).map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => addSkill(s.name, s.category, 3)}
                  className="rounded-full border border-[#dfe3dc] px-2.5 py-0.5 text-xs text-[#667085] hover:bg-[#f0f2ed]"
                >
                  +{s.name}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => addSkill(newSkillName, newSkillCategory, newSkillLevel)}
              disabled={!newSkillName.trim()}
              className="rounded-xl bg-[#223b83] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#1a2f6b] disabled:opacity-40"
            >
              Save skill
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  activeCategory === cat
                    ? "bg-[#223b83] text-white"
                    : "border border-[#dfe3dc] bg-white text-[#667085] hover:bg-[#f7f8f5]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b93a2]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your skills..."
              className="w-full rounded-xl border border-[#dfe3dc] bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-[#223b83]"
            />
          </div>
        </div>

        {/* Skills Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSkills.map((skill) => (
            <div
              key={skill.id}
              className="group flex flex-col justify-between rounded-2xl border border-[#e3e6df] bg-white p-5 transition hover:shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-[#f0f2ed] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#667085]">
                    {skill.category}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSkill(skill.id)}
                    aria-label={`Remove ${skill.name}`}
                    className="opacity-0 transition group-hover:opacity-100 text-[#a3aab7] hover:text-[#e05e43]"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <h3 className="mt-3 text-base font-bold text-[#182032]">{skill.name}</h3>
              </div>

              <div className="mt-5 border-t border-[#f0f2ed] pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#8b93a2]">Proficiency</span>
                  <span className="font-bold text-[#223b83]">
                    Level {skill.level} / 5 ·{" "}
                    {skill.level === 5
                      ? "Expert"
                      : skill.level === 4
                      ? "Advanced"
                      : skill.level === 3
                      ? "Intermediate"
                      : skill.level === 2
                      ? "Elementary"
                      : "Beginner"}
                  </span>
                </div>
                {/* Level selector pills */}
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4, 5].map((levelNum) => (
                    <button
                      key={levelNum}
                      type="button"
                      onClick={() => updateSkillLevel(skill.id, levelNum)}
                      title={`Set proficiency to Level ${levelNum}`}
                      className={`h-2 flex-1 rounded-full transition-all ${
                        levelNum <= skill.level ? "bg-[#223b83]" : "bg-[#e8ebf0] hover:bg-[#cfd5e0]"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}

          {!filteredSkills.length && (
            <div className="col-span-full rounded-2xl border border-dashed border-[#cfd4db] bg-white p-8 text-center">
              <p className="font-bold text-[#182032]">No skills found.</p>
              <p className="mt-1 text-xs text-[#8b93a2]">
                Try adjusting your search query or add a new skill above.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations & Action Footer */}
      <div className="rounded-2xl border border-[#e3e6df] bg-[#fff9e9] p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <Award size={24} className="mt-1 text-[#e05e43] shrink-0" />
            <div>
              <h4 className="font-bold text-[#182032]">Ready to turn gaps into strengths?</h4>
              <p className="mt-1 text-xs leading-5 text-[#667085]">
                Your skills dynamically feed your personalized roadmap and learning modules.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/learning"
              className="inline-flex items-center gap-2 rounded-xl bg-[#223b83] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#1a2f6b]"
            >
              <BookOpen size={14} /> Open learning plan
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
