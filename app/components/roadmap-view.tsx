"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import {
  Route,
  CheckCircle2,
  Circle,
  Target,
  Calendar,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Plus,
  Layers,
  Award,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { careers } from "@/lib/careers";

export type MilestoneCheckpoint = {
  id: string;
  label: string;
  done: boolean;
};

export type RoadmapMilestone = {
  id: string;
  phaseNumber: 1 | 2 | 3;
  phaseLabel: string;
  timeframe: string;
  title: string;
  description: string;
  deliverable: string;
  checkpoints: MilestoneCheckpoint[];
};

export type CareerRoadmap = {
  careerSlug: string;
  careerName: string;
  summary: string;
  milestones: RoadmapMilestone[];
};

const defaultRoadmaps: Record<string, CareerRoadmap> = {
  engineer: {
    careerSlug: "engineer",
    careerName: "Software & Systems Engineer",
    summary: "From algorithmic baseline to a production-grade full-stack capstone and technical interviews.",
    milestones: [
      {
        id: "m-eng-1",
        phaseNumber: 1,
        phaseLabel: "Days 1–30: Foundation & Signal",
        timeframe: "Days 1–15",
        title: "Development Environment & Core Algorithms",
        description: "Standardize your modern developer tooling, TypeScript mastery, and core data structures.",
        deliverable: "Configured VSCode, GitHub profile, and 15 completed LeetCode/HackerRank algorithm patterns.",
        checkpoints: [
          { id: "c1", label: "Set up Git, SSH, TypeScript strict config, and ESLint environment", done: true },
          { id: "c2", label: "Implement core algorithms: Two Pointers, Sliding Window, and BFS/DFS", done: true },
          { id: "c3", label: "Write technical notes summarizing Big-O trade-offs", done: true },
        ],
      },
      {
        id: "m-eng-2",
        phaseNumber: 1,
        phaseLabel: "Days 1–30: Foundation & Signal",
        timeframe: "Days 16–30",
        title: "API Design & Relational Data Modeling",
        description: "Design relational database schemas, write efficient SQL queries, and implement clean REST endpoints.",
        deliverable: "A fully documented backend service with database migrations and automated unit tests.",
        checkpoints: [
          { id: "c4", label: "Model database relationships with foreign keys, indexes, and constraints", done: true },
          { id: "c5", label: "Build REST/GraphQL endpoints with structured request validation", done: true },
          { id: "c6", label: "Implement JWT/Session-based secure authentication flow", done: false },
        ],
      },
      {
        id: "m-eng-3",
        phaseNumber: 2,
        phaseLabel: "Days 31–60: Building Proof of Work",
        timeframe: "Days 31–45",
        title: "Full-Stack Capstone Project Architecture",
        description: "Architect and build an end-to-end web application that solves an authentic workflow friction.",
        deliverable: "Live deployed application on Vercel/Cloudflare with continuous deployment pipeline.",
        checkpoints: [
          { id: "c7", label: "Define project PRD, data model, and user journey wireframes", done: true },
          { id: "c8", label: "Build frontend client with responsive UI and optimistic updates", done: false },
          { id: "c9", label: "Connect persistent database and storage with environment secrets", done: false },
        ],
      },
      {
        id: "m-eng-4",
        phaseNumber: 2,
        phaseLabel: "Days 31–60: Building Proof of Work",
        timeframe: "Days 46–60",
        title: "Testing, Observability & Code Refactoring",
        description: "Harden your capstone application with automated integration testing, error handling, and docs.",
        deliverable: "Published GitHub repository with comprehensive README, system architecture diagram, and test suite.",
        checkpoints: [
          { id: "c10", label: "Add integration tests for primary critical paths", done: false },
          { id: "c11", label: "Optimize bundle size and Core Web Vitals performance", done: false },
          { id: "c12", label: "Write architectural decision record (ADR) explaining design trade-offs", done: false },
        ],
      },
      {
        id: "m-eng-5",
        phaseNumber: 3,
        phaseLabel: "Days 61–90: Review & Launch",
        timeframe: "Days 61–75",
        title: "Portfolio Polish & Engineering Narrative",
        description: "Package your project into a compelling case study that showcases your problem-solving process.",
        deliverable: "Polished personal developer portfolio with 2 deep case studies and live demos.",
        checkpoints: [
          { id: "c13", label: "Deploy personal engineering portfolio site", done: false },
          { id: "c14", label: "Record a 3-minute video walkthrough of your capstone codebase", done: false },
          { id: "c15", label: "Write a technical blog post detailing a complex bug you solved", done: false },
        ],
      },
      {
        id: "m-eng-6",
        phaseNumber: 3,
        phaseLabel: "Days 61–90: Review & Launch",
        timeframe: "Days 76–90",
        title: "System Design Mock Interviews & Targeted Outreach",
        description: "Practice technical and behavioral interview formats while networking with engineers in target teams.",
        deliverable: "Completed 5 mock technical interviews and 20 targeted engineering applications submitted.",
        checkpoints: [
          { id: "c16", label: "Complete 3 system design practice rounds (e.g. URL shortener, Chat app)", done: false },
          { id: "c17", label: "Conduct 2 mock technical behavioral interviews with feedback", done: false },
          { id: "c18", label: "Reach out to 10 alumni and hiring managers with personalized notes", done: false },
        ],
      },
    ],
  },
  designer: {
    careerSlug: "designer",
    careerName: "Product & UX Designer",
    summary: "From user research and design systems to high-fidelity Figma prototypes and industry portfolio.",
    milestones: [
      {
        id: "m-des-1",
        phaseNumber: 1,
        phaseLabel: "Days 1–30: Foundation & Signal",
        timeframe: "Days 1–15",
        title: "Design Systems & Visual Craft Fundamentals",
        description: "Master typography scales, 8pt spacing grids, accessible color contrast, and Figma components.",
        deliverable: "Comprehensive Figma UI kit with auto-layout components and color tokens.",
        checkpoints: [
          { id: "cd1", label: "Master Figma auto-layout, component variants, and interactive states", done: true },
          { id: "cd2", label: "Build accessible typography and color palette meeting WCAG AAA", done: true },
          { id: "cd3", label: "Recreate 3 industry-leading application interfaces pixel-for-pixel", done: true },
        ],
      },
      {
        id: "m-des-2",
        phaseNumber: 1,
        phaseLabel: "Days 1–30: Foundation & Signal",
        timeframe: "Days 16–30",
        title: "User Research & Problem Definition",
        description: "Conduct user interviews, synthesize empathy maps, and frame actionable problem statements.",
        deliverable: "Documented user research synthesis deck with personas and opportunity maps.",
        checkpoints: [
          { id: "cd4", label: "Conduct 4 qualitative user interviews on a target workflow problem", done: true },
          { id: "cd5", label: "Synthesize findings into user personas and journey friction points", done: false },
          { id: "cd6", label: "Draft 'How Might We' design prompts prioritizing core value", done: false },
        ],
      },
      {
        id: "m-des-3",
        phaseNumber: 2,
        phaseLabel: "Days 31–60: Building Proof of Work",
        timeframe: "Days 31–45",
        title: "End-to-End Capstone Prototype",
        description: "Transform wireframes into high-fidelity responsive screens with realistic micro-interactions.",
        deliverable: "Clickable interactive Figma prototype with end-to-end task flow.",
        checkpoints: [
          { id: "cd7", label: "Draft low-fidelity wireframes exploring 3 alternative layout concepts", done: false },
          { id: "cd8", label: "Produce high-fidelity responsive screens for desktop and mobile", done: false },
          { id: "cd9", label: "Create smooth micro-interactions and transitions with Smart Animate", done: false },
        ],
      },
      {
        id: "m-des-4",
        phaseNumber: 2,
        phaseLabel: "Days 31–60: Building Proof of Work",
        timeframe: "Days 46–60",
        title: "Usability Testing & Design Iteration",
        description: "Test your prototype with real users, measure task completion rates, and iterate on findings.",
        deliverable: "Usability test report highlighting before/after iterations and validated learnings.",
        checkpoints: [
          { id: "cd10", label: "Run usability tests with 5 target users and record session feedback", done: false },
          { id: "cd11", label: "Identify usability blockers and iterate on high-friction screens", done: false },
          { id: "cd12", label: "Prepare developer handoff specs with tokens and edge cases", done: false },
        ],
      },
      {
        id: "m-des-5",
        phaseNumber: 3,
        phaseLabel: "Days 61–90: Review & Launch",
        timeframe: "Days 61–75",
        title: "Portfolio Website & Case Study Storytelling",
        description: "Craft a narrative-driven case study emphasizing your problem solving, business impact, and craft.",
        deliverable: "Live portfolio with 2 comprehensive case studies showcasing process from research to UI.",
        checkpoints: [
          { id: "cd13", label: "Write clear case study narratives following Problem-Process-Solution format", done: false },
          { id: "cd14", label: "Deploy custom portfolio website or Framer portfolio", done: false },
        ],
      },
      {
        id: "m-des-6",
        phaseNumber: 3,
        phaseLabel: "Days 61–90: Review & Launch",
        timeframe: "Days 76–90",
        title: "Design Critique Prep & Strategic Outreach",
        description: "Practice presenting design decisions under critique and connect with design leads.",
        deliverable: "Completed 3 design presentation mocks and submitted 15 targeted applications.",
        checkpoints: [
          { id: "cd15", label: "Practice whiteboard/app critique challenge with a design peer", done: false },
          { id: "cd16", label: "Prepare 10-minute slide deck for portfolio presentation rounds", done: false },
        ],
      },
    ],
  },
  finance: {
    careerSlug: "finance",
    careerName: "Financial & Strategic Analyst",
    summary: "From financial statement modeling and DCF valuation to investment memos and decision analysis.",
    milestones: [
      {
        id: "m-fin-1",
        phaseNumber: 1,
        phaseLabel: "Days 1–30: Foundation & Signal",
        timeframe: "Days 1–30",
        title: "Financial Accounting & 3-Statement Modeling",
        description: "Master income statements, balance sheets, cash flow linkage, and advanced Excel modeling.",
        deliverable: "Dynamic 3-statement financial model with historical normalization and scenario toggles.",
        checkpoints: [
          { id: "cf1", label: "Master Excel shortcuts, dynamic index-match, and financial formulas", done: true },
          { id: "cf2", label: "Build fully integrated 3-statement model for a real company", done: true },
          { id: "cf3", label: "Perform working capital and debt schedule amortization breakdowns", done: false },
        ],
      },
      {
        id: "m-fin-2",
        phaseNumber: 2,
        phaseLabel: "Days 31–60: Building Proof of Work",
        timeframe: "Days 31–60",
        title: "Valuation & Investment Thesis Construction",
        description: "Execute DCF valuation, trading comparables, and precedent transaction analysis.",
        deliverable: "Comprehensive 10-page equity research / valuation memo on a publicly traded business.",
        checkpoints: [
          { id: "cf4", label: "Construct dynamic Discounted Cash Flow (DCF) with sensitivity table", done: false },
          { id: "cf5", label: "Benchmark trading multiples against 5 relevant industry competitors", done: false },
          { id: "cf6", label: "Formulate clear Buy/Hold/Sell recommendation with catalyst timeline", done: false },
        ],
      },
      {
        id: "m-fin-3",
        phaseNumber: 3,
        phaseLabel: "Days 61–90: Review & Launch",
        timeframe: "Days 61–90",
        title: "Financial Presentation & Career Placement",
        description: "Pitch your thesis to finance professionals and prepare for financial modeling tests.",
        deliverable: "Pitch deck delivered in mock interview and 15 targeted finance applications submitted.",
        checkpoints: [
          { id: "cf7", label: "Conduct 3 timed 90-minute financial modeling test practices", done: false },
          { id: "cf8", label: "Pitch investment thesis in a 15-minute mock executive presentation", done: false },
        ],
      },
    ],
  },
};

export function RoadmapView({ initialCareerSlug = "engineer" }: { initialCareerSlug?: string }) {
  const [selectedCareer, setSelectedCareer] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const savedCareer = localStorage.getItem("careerx_active_roadmap_career");
      if (savedCareer && defaultRoadmaps[savedCareer]) return savedCareer;
    }
    return defaultRoadmaps[initialCareerSlug] ? initialCareerSlug : "engineer";
  });

  const [roadmapsState, setRoadmapsState] = useState<Record<string, CareerRoadmap>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("careerx_roadmaps_data");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return defaultRoadmaps;
  });

  const [newCheckpointText, setNewCheckpointText] = useState("");
  const [activeMilestoneIdForNewCheck, setActiveMilestoneIdForNewCheck] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem("careerx_roadmaps_data", JSON.stringify(roadmapsState));
      localStorage.setItem("careerx_active_roadmap_career", selectedCareer);
    } catch {
      // ignore
    }
  }, [roadmapsState, selectedCareer]);

  const activeRoadmap = useMemo(() => {
    return roadmapsState[selectedCareer] || defaultRoadmaps.engineer;
  }, [roadmapsState, selectedCareer]);

  // Calculate overall metrics
  const totalCheckpoints = useMemo(() => {
    return activeRoadmap.milestones.reduce((acc, m) => acc + m.checkpoints.length, 0);
  }, [activeRoadmap]);

  const completedCheckpoints = useMemo(() => {
    return activeRoadmap.milestones.reduce(
      (acc, m) => acc + m.checkpoints.filter((c) => c.done).length,
      0
    );
  }, [activeRoadmap]);

  const roadmapPercent = totalCheckpoints > 0 ? Math.round((completedCheckpoints / totalCheckpoints) * 100) : 0;

  const completedMilestonesCount = useMemo(() => {
    return activeRoadmap.milestones.filter(
      (m) => m.checkpoints.length > 0 && m.checkpoints.every((c) => c.done)
    ).length;
  }, [activeRoadmap]);

  const toggleCheckpoint = (milestoneId: string, checkpointId: string) => {
    setRoadmapsState((prev) => {
      const current = prev[selectedCareer];
      if (!current) return prev;

      const updatedMilestones = current.milestones.map((m) => {
        if (m.id !== milestoneId) return m;
        return {
          ...m,
          checkpoints: m.checkpoints.map((c) => {
            if (c.id !== checkpointId) return c;
            return { ...c, done: !c.done };
          }),
        };
      });

      return {
        ...prev,
        [selectedCareer]: {
          ...current,
          milestones: updatedMilestones,
        },
      };
    });
  };

  const addCheckpointToMilestone = (milestoneId: string) => {
    if (!newCheckpointText.trim()) return;
    setRoadmapsState((prev) => {
      const current = prev[selectedCareer];
      if (!current) return prev;

      const updatedMilestones = current.milestones.map((m) => {
        if (m.id !== milestoneId) return m;
        return {
          ...m,
          checkpoints: [
            ...m.checkpoints,
            {
              id: `cp-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
              label: newCheckpointText.trim(),
              done: false,
            },
          ],
        };
      });

      return {
        ...prev,
        [selectedCareer]: {
          ...current,
          milestones: updatedMilestones,
        },
      };
    });
    setNewCheckpointText("");
    setActiveMilestoneIdForNewCheck(null);
  };

  const resetRoadmap = () => {
    setRoadmapsState(defaultRoadmaps);
    try {
      localStorage.removeItem("careerx_roadmaps_data");
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e05e43]">90-Day Plan</p>
          <h1 className="display-font mt-2 text-4xl tracking-tight sm:text-5xl">Your career roadmap.</h1>
          <p className="mt-3 max-w-xl text-[#667085]">
            A flexible path from curious to ready. Break a 3-month transition into small, confident steps.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={resetRoadmap}
            title="Reset roadmaps to standard template"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#dfe3dc] bg-white px-3.5 py-2 text-xs font-semibold text-[#667085] hover:bg-[#f0f2ed]"
          >
            <RotateCcw size={14} /> Reset roadmap
          </button>
        </div>
      </div>

      {/* Trajectory Progress Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-[#223b83] p-6 text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#cdd7fa]">Overall Progress</span>
            <Target size={18} className="text-[#ffb39e]" />
          </div>
          <p className="display-font mt-6 text-5xl">
            {roadmapPercent}
            <span className="text-2xl text-[#cdd7fa]">%</span>
          </p>
          <div className="mt-4 h-1.5 rounded-full bg-white/20">
            <div
              style={{ width: `${roadmapPercent}%` }}
              className="h-1.5 rounded-full bg-[#ff9074] transition-all duration-500"
            />
          </div>
          <p className="mt-3 text-xs text-[#cdd7fa]">
            {completedCheckpoints} of {totalCheckpoints} checkpoints checked off
          </p>
        </div>

        <div className="rounded-2xl border border-[#e3e6df] bg-white p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#667085]">Milestones Achieved</span>
            <Award size={18} className="text-[#e05e43]" />
          </div>
          <p className="mt-6 text-3xl font-bold text-[#182032]">
            {completedMilestonesCount} <span className="text-sm font-normal text-[#8b93a2]">of {activeRoadmap.milestones.length} milestones</span>
          </p>
          <div className="mt-4 flex gap-1.5">
            {activeRoadmap.milestones.map((m) => {
              const allDone = m.checkpoints.length > 0 && m.checkpoints.every((c) => c.done);
              return (
                <span
                  key={m.id}
                  className={`h-2 flex-1 rounded-full transition-all ${
                    allDone ? "bg-[#48a582]" : "bg-[#e8ebf0]"
                  }`}
                />
              );
            })}
          </div>
          <p className="mt-3 text-xs text-[#667085]">
            Target completion in 90 days with ~5-7 hours per week.
          </p>
        </div>

        <div className="rounded-2xl border border-[#cfd8ef] bg-[#fff9e9] p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#e05e43]">Active Phase</span>
            <Calendar size={18} className="text-[#e05e43]" />
          </div>
          <p className="mt-5 text-xl font-bold text-[#182032]">
            {roadmapPercent >= 66
              ? "Phase 3: Review & Launch"
              : roadmapPercent >= 33
              ? "Phase 2: Building Proof of Work"
              : "Phase 1: Foundation & Signal"}
          </p>
          <p className="mt-2 text-xs leading-5 text-[#667085]">
            Focus on concrete, public deliverables rather than passive tutorials.
          </p>
        </div>
      </div>

      {/* Target Roadmap Switcher */}
      <div>
        <label className="text-xs font-bold uppercase tracking-[0.16em] text-[#8b93a2]">
          Select Roadmap Pathway:
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.values(roadmapsState).map((rm) => (
            <button
              key={rm.careerSlug}
              type="button"
              onClick={() => setSelectedCareer(rm.careerSlug)}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                selectedCareer === rm.careerSlug
                  ? "border-[#223b83] bg-[#e8edff] text-[#223b83] shadow-xs"
                  : "border-[#e3e6df] bg-white text-[#667085] hover:border-[#cfd8ef]"
              }`}
            >
              <span className="block text-sm font-bold">{rm.careerName}</span>
              <span className="mt-0.5 block text-xs opacity-75">{rm.milestones.length} milestones · 90 days</span>
            </button>
          ))}
        </div>
      </div>

      {/* Milestones Timeline */}
      <div className="space-y-6">
        {activeRoadmap.milestones.map((milestone, index) => {
          const isCompleted = milestone.checkpoints.length > 0 && milestone.checkpoints.every((c) => c.done);
          const hasInProgress = milestone.checkpoints.some((c) => c.done) && !isCompleted;

          return (
            <div
              key={milestone.id}
              className={`relative rounded-2xl border transition-all ${
                isCompleted
                  ? "border-[#cde8dc] bg-[#f8fbf9]"
                  : hasInProgress
                  ? "border-[#cfd8ef] bg-white shadow-xs"
                  : "border-[#e3e6df] bg-white"
              } p-6`}
            >
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-1 flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold shrink-0 ${
                      isCompleted
                        ? "bg-[#e3f2ec] text-[#25805c]"
                        : hasInProgress
                        ? "bg-[#e8edff] text-[#223b83]"
                        : "bg-[#f0f2ed] text-[#667085]"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 size={16} /> : index + 1}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-[#f0f2ed] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#667085]">
                        {milestone.timeframe}
                      </span>
                      <span className="text-xs text-[#8b93a2]">· {milestone.phaseLabel}</span>
                      {isCompleted && (
                        <span className="rounded bg-[#e3f2ec] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#25805c]">
                          Milestone Complete
                        </span>
                      )}
                      {hasInProgress && (
                        <span className="rounded bg-[#e8edff] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#223b83]">
                          In Progress
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 text-xl font-bold text-[#182032]">{milestone.title}</h3>
                    <p className="mt-1 text-sm text-[#667085]">{milestone.description}</p>
                  </div>
                </div>
              </div>

              {/* Tangible Deliverable Banner */}
              <div className="mt-4 rounded-xl border border-[#dfe5f5] bg-[#f5f8ff] p-3 text-xs">
                <span className="font-bold text-[#223b83]">Proof of Work Artifact:</span>{" "}
                <span className="text-[#334b80]">{milestone.deliverable}</span>
              </div>

              {/* Checkpoints */}
              <div className="mt-5 space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#8b93a2]">Action Checkpoints:</p>
                {milestone.checkpoints.map((cp) => (
                  <div
                    key={cp.id}
                    onClick={() => toggleCheckpoint(milestone.id, cp.id)}
                    className="flex cursor-pointer items-start gap-3 rounded-lg p-2 transition hover:bg-[#f7f8f5]"
                  >
                    <button
                      type="button"
                      aria-label={cp.done ? "Mark undone" : "Mark done"}
                      className="mt-0.5 shrink-0"
                    >
                      {cp.done ? (
                        <CheckCircle2 size={18} className="text-[#48a582]" />
                      ) : (
                        <Circle size={18} className="text-[#c9d0dc]" />
                      )}
                    </button>
                    <span
                      className={`text-sm ${
                        cp.done ? "text-[#8b93a2] line-through font-normal" : "text-[#182032] font-semibold"
                      }`}
                    >
                      {cp.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add Checkpoint to this milestone */}
              {activeMilestoneIdForNewCheck === milestone.id ? (
                <div className="mt-3 flex items-center gap-2 border-t border-[#f0f2ed] pt-3">
                  <input
                    type="text"
                    value={newCheckpointText}
                    onChange={(e) => setNewCheckpointText(e.target.value)}
                    placeholder="Enter checkpoint description..."
                    className="flex-1 rounded-lg border border-[#dfe3dc] px-3 py-1.5 text-xs outline-none focus:border-[#223b83]"
                  />
                  <button
                    type="button"
                    onClick={() => addCheckpointToMilestone(milestone.id)}
                    className="rounded-lg bg-[#223b83] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1a2f6b]"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMilestoneIdForNewCheck(null)}
                    className="text-xs text-[#8b93a2] hover:text-[#182032]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="mt-3 border-t border-[#f0f2ed] pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMilestoneIdForNewCheck(milestone.id);
                      setNewCheckpointText("");
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#223b83] hover:underline"
                  >
                    <Plus size={13} /> Add personal checkpoint
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Simulator Link Card */}
      <div className="rounded-2xl border border-[#e3e6df] bg-[#fff9e9] p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <Sparkles size={24} className="mt-1 text-[#e05e43] shrink-0" />
            <div>
              <h4 className="font-bold text-[#182032]">Curious what a real day in this role feels like?</h4>
              <p className="mt-1 text-xs leading-5 text-[#667085]">
                Test your instincts before committing months of study in our interactive Career Simulator.
              </p>
            </div>
          </div>
          <Link
            href="/simulator"
            className="inline-flex items-center gap-2 rounded-xl bg-[#223b83] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#1a2f6b]"
          >
            Launch Career Simulator <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
