"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Flame,
  Award,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Filter,
  CheckSquare,
} from "lucide-react";

export type LearningTask = {
  id: string;
  phaseId: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  type: "Reading" | "Hands-on" | "Video" | "Project" | "Practice";
  sourceName?: string;
  completed: boolean;
};

export type LearningPhase = {
  id: string;
  title: string;
  description: string;
  weeks: string;
};

export type LearningTrack = {
  id: string;
  name: string;
  description: string;
  phases: LearningPhase[];
  tasks: LearningTask[];
};

const tracksData: LearningTrack[] = [
  {
    id: "engineering",
    name: "Engineering & Technical Systems",
    description: "Build robust foundational engineering logic, algorithms, and practical system design.",
    phases: [
      {
        id: "eng-p1",
        title: "Phase 1: Computational Thinking & Core Logic",
        description: "Master baseline data structures, algorithms, and modular clean code.",
        weeks: "Weeks 1–3",
      },
      {
        id: "eng-p2",
        title: "Phase 2: Full-Stack Project Building",
        description: "Connect APIs, build reactive interfaces, and manage persistent data layers.",
        weeks: "Weeks 4–7",
      },
      {
        id: "eng-p3",
        title: "Phase 3: Production Readiness & Architecture",
        description: "Implement CI/CD, testing, database indexing, and performance optimization.",
        weeks: "Weeks 8–10",
      },
    ],
    tasks: [
      {
        id: "eng-t1",
        phaseId: "eng-p1",
        title: "Master Algorithmic Complexity & Big-O",
        description: "Analyze time and space complexity with realistic array and hash map problems.",
        estimatedMinutes: 60,
        type: "Reading",
        sourceName: "Harvard CS50 / MIT OpenCourseWare",
        completed: true,
      },
      {
        id: "eng-t2",
        phaseId: "eng-p1",
        title: "Build 5 Foundational Data Structure Implementations",
        description: "Implement linked lists, stacks, queues, binary search trees, and graphs from scratch.",
        estimatedMinutes: 120,
        type: "Hands-on",
        sourceName: "Interactive Code Sandbox",
        completed: true,
      },
      {
        id: "eng-t3",
        phaseId: "eng-p1",
        title: "Git Workflow & Team Branching Strategies",
        description: "Practice rebasing, cherry-picking, PR reviews, and semantic merge conflicts.",
        estimatedMinutes: 45,
        type: "Practice",
        sourceName: "GitHub Skills",
        completed: false,
      },
      {
        id: "eng-t4",
        phaseId: "eng-p2",
        title: "Develop an Asynchronous REST & WebSocket API",
        description: "Design endpoints with request validation, JWT authentication, and structured error handling.",
        estimatedMinutes: 180,
        type: "Project",
        sourceName: "Node.js / FastAPI Blueprint",
        completed: false,
      },
      {
        id: "eng-t5",
        phaseId: "eng-p2",
        title: "State Management & Optimistic UI Patterns",
        description: "Implement caching, stale-while-revalidate, and offline persistence in client apps.",
        estimatedMinutes: 90,
        type: "Hands-on",
        sourceName: "React / Next.js Docs",
        completed: false,
      },
      {
        id: "eng-t6",
        phaseId: "eng-p3",
        title: "Automated End-to-End & Integration Testing Suite",
        description: "Write unit and e2e test specs with Playwright or Vitest covering critical happy & failure paths.",
        estimatedMinutes: 120,
        type: "Practice",
        sourceName: "Testing Library Guide",
        completed: false,
      },
      {
        id: "eng-t7",
        phaseId: "eng-p3",
        title: "Production Deployment with Docker & Cloud Observability",
        description: "Containerize the application, configure health checks, and inspect structured latency logs.",
        estimatedMinutes: 90,
        type: "Project",
        sourceName: "Docker & Cloud Run",
        completed: false,
      },
    ],
  },
  {
    id: "design",
    name: "Product Design & UX",
    description: "From empathetic user discovery to high-fidelity design systems and interactive prototypes.",
    phases: [
      {
        id: "des-p1",
        title: "Phase 1: Discovery & Design Thinking Foundations",
        description: "Learn user interview frameworks, journey mapping, and problem framing.",
        weeks: "Weeks 1–3",
      },
      {
        id: "des-p2",
        title: "Phase 2: Visual Craft & Design Systems",
        description: "Typography, color theory, spacing tokens, and responsive Figma components.",
        weeks: "Weeks 4–7",
      },
      {
        id: "des-p3",
        title: "Phase 3: Interactive Prototypes & Usability Testing",
        description: "Run moderated user testing, synthesize feedback, and prepare case studies.",
        weeks: "Weeks 8–10",
      },
    ],
    tasks: [
      {
        id: "des-t1",
        phaseId: "des-p1",
        title: "Conduct 3 Empathy User Interviews",
        description: "Draft an open-ended interview script and identify core pain points around daily productivity.",
        estimatedMinutes: 90,
        type: "Hands-on",
        sourceName: "IDEO Design Kit",
        completed: true,
      },
      {
        id: "des-t2",
        phaseId: "des-p1",
        title: "Map User Persona & Empathy Archetypes",
        description: "Synthesize findings into goals, frustrations, and an end-to-end user journey map.",
        estimatedMinutes: 60,
        type: "Reading",
        sourceName: "Nielsen Norman Group",
        completed: false,
      },
      {
        id: "des-t3",
        phaseId: "des-p2",
        title: "Build a Scalable Figma Component Library",
        description: "Create accessible color palettes, typography scales, buttons, and input variants.",
        estimatedMinutes: 120,
        type: "Project",
        sourceName: "Figma Community Guide",
        completed: false,
      },
      {
        id: "des-t4",
        phaseId: "des-p3",
        title: "Prototype High-Fidelity Micro-interactions",
        description: "Create spring animations, stateful modal transitions, and responsive navigation drawers.",
        estimatedMinutes: 90,
        type: "Hands-on",
        sourceName: "Figma Smart Animate",
        completed: false,
      },
    ],
  },
  {
    id: "data",
    name: "Data Science & Strategic Analytics",
    description: "Extract actionable signal from messy raw datasets using statistical rigor and storytelling.",
    phases: [
      {
        id: "dat-p1",
        title: "Phase 1: Exploratory Data Analysis & SQL Mastery",
        description: "Write complex joins, window functions, and clean dirty datasets.",
        weeks: "Weeks 1–3",
      },
      {
        id: "dat-p2",
        title: "Phase 2: Python Data Wrangling & Modeling",
        description: "Use Pandas, NumPy, and Scikit-Learn for regression and classification.",
        weeks: "Weeks 4–7",
      },
      {
        id: "dat-p3",
        title: "Phase 3: Executive Dashboards & Decision Memos",
        description: "Synthesize insights into clear visualizations and executive takeaways.",
        weeks: "Weeks 8–10",
      },
    ],
    tasks: [
      {
        id: "dat-t1",
        phaseId: "dat-p1",
        title: "Advanced SQL: Window Functions & CTEs",
        description: "Calculate rolling 7-day retention and cohort lifetime value on e-commerce datasets.",
        estimatedMinutes: 75,
        type: "Hands-on",
        sourceName: "Mode Analytics SQL Tutorial",
        completed: true,
      },
      {
        id: "dat-t2",
        phaseId: "dat-p2",
        title: "Predictive Churn Model with Scikit-Learn",
        description: "Clean data, engineer features, evaluate ROC-AUC, and document feature importance.",
        estimatedMinutes: 150,
        type: "Project",
        sourceName: "Kaggle Open Datasets",
        completed: false,
      },
      {
        id: "dat-t3",
        phaseId: "dat-p3",
        title: "Publish an Interactive Dashboard Story",
        description: "Build an executive dashboard with clear narrative callouts for non-technical stakeholders.",
        estimatedMinutes: 90,
        type: "Practice",
        sourceName: "Tableau / Streamlit Lab",
        completed: false,
      },
    ],
  },
  {
    id: "strategy",
    name: "Business Strategy & Leadership",
    description: "Sharpen economic thinking, market sizing, strategic trade-offs, and communication.",
    phases: [
      {
        id: "str-p1",
        title: "Phase 1: Market Mechanics & Unit Economics",
        description: "Understand P&L statements, CAC/LTV dynamics, and pricing psychology.",
        weeks: "Weeks 1–3",
      },
      {
        id: "str-p2",
        title: "Phase 2: Competitive Moats & Product Positioning",
        description: "Evaluate Porter's Five Forces and platform network effects.",
        weeks: "Weeks 4–7",
      },
      {
        id: "str-p3",
        title: "Phase 3: High-Stakes Decision Memos & Pitching",
        description: "Write clear 1-page executive memos proposing decisive strategic pivots.",
        weeks: "Weeks 8–10",
      },
    ],
    tasks: [
      {
        id: "str-t1",
        phaseId: "str-p1",
        title: "Deconstruct an Annual 10-K Financial Report",
        description: "Analyze revenue streams, gross margins, and risk factors for a public tech company.",
        estimatedMinutes: 60,
        type: "Reading",
        sourceName: "SEC EDGAR / Morningstar",
        completed: true,
      },
      {
        id: "str-t2",
        phaseId: "str-p2",
        title: "Conduct a Competitive Moat Audit",
        description: "Map switching costs, brand power, and scale advantages of 3 rival businesses.",
        estimatedMinutes: 90,
        type: "Practice",
        sourceName: "Harvard Business Review Framework",
        completed: false,
      },
    ],
  },
];

export function LearningPlanView({ preferredTrack = "engineering" }: { preferredTrack?: string }) {
  const [activeTrackId, setActiveTrackId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const savedTrack = localStorage.getItem("careerx_active_track");
      if (savedTrack && tracksData.some((t) => t.id === savedTrack)) {
        return savedTrack;
      }
    }
    return tracksData.some((t) => t.id === preferredTrack) ? preferredTrack : "engineering";
  });

  const [tracksState, setTracksState] = useState<LearningTrack[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("careerx_learning_tracks");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return tracksData;
  });

  const [filterMode, setFilterMode] = useState<"all" | "pending" | "completed">("all");
  const [showAddTask, setShowAddTask] = useState(false);
  const [selectedPhaseForTask, setSelectedPhaseForTask] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskMinutes, setNewTaskMinutes] = useState(45);
  const [newTaskType, setNewTaskType] = useState<LearningTask["type"]>("Hands-on");

  // Focus Timer State (25 min default = 1500 sec)
  const [timerSeconds, setTimerSeconds] = useState(1500);
  const [timerActive, setTimerActive] = useState(false);
  const [loggedMinutesToday, setLoggedMinutesToday] = useState(45);

  useEffect(() => {
    try {
      localStorage.setItem("careerx_learning_tracks", JSON.stringify(tracksState));
      localStorage.setItem("careerx_active_track", activeTrackId);
    } catch {
      // ignore
    }
  }, [tracksState, activeTrackId]);

  // Pomodoro timer tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && timerActive) {
      setTimerActive(false);
      setLoggedMinutesToday((prev) => prev + 25);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timerSeconds]);

  const activeTrack = useMemo(() => {
    return tracksState.find((t) => t.id === activeTrackId) || tracksState[0];
  }, [tracksState, activeTrackId]);

  const totalTasks = activeTrack.tasks.length;
  const completedTasks = activeTrack.tasks.filter((t) => t.completed).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalMinutesRemaining = activeTrack.tasks
    .filter((t) => !t.completed)
    .reduce((sum, t) => sum + t.estimatedMinutes, 0);

  const toggleTask = (taskId: string) => {
    setTracksState((prevTracks) =>
      prevTracks.map((track) => {
        if (track.id !== activeTrackId) return track;
        return {
          ...track,
          tasks: track.tasks.map((task) => {
            if (task.id !== taskId) return task;
            return { ...task, completed: !task.completed };
          }),
        };
      })
    );
  };

  const handleAddNewTask = () => {
    if (!newTaskTitle.trim()) return;
    const phaseId = selectedPhaseForTask || activeTrack.phases[0]?.id;
    const newTask: LearningTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      phaseId,
      title: newTaskTitle.trim(),
      description: "Custom learner goal",
      estimatedMinutes: Number(newTaskMinutes) || 45,
      type: newTaskType,
      sourceName: "Custom Self-Study",
      completed: false,
    };

    setTracksState((prev) =>
      prev.map((track) => {
        if (track.id !== activeTrackId) return track;
        return {
          ...track,
          tasks: [...track.tasks, newTask],
        };
      })
    );
    setNewTaskTitle("");
    setShowAddTask(false);
  };

  const resetTracksToDefault = () => {
    setTracksState(tracksData);
    try {
      localStorage.removeItem("careerx_learning_tracks");
    } catch {
      // ignore
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e05e43]">Learning</p>
          <h1 className="display-font mt-2 text-4xl tracking-tight sm:text-5xl">Your learning plan.</h1>
          <p className="mt-3 max-w-xl text-[#667085]">
            Small, deliberate practice adds up faster than you think. Master competencies through structured modules.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setSelectedPhaseForTask(activeTrack.phases[0]?.id || "");
              setShowAddTask(true);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-[#223b83] px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_#142658] transition hover:bg-[#1a2f6b]"
          >
            <Plus size={16} /> Add custom task
          </button>
          <button
            type="button"
            onClick={resetTracksToDefault}
            title="Reset to default learning tracks"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#dfe3dc] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#667085] hover:bg-[#f0f2ed]"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      {/* Momentum & Focus Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Track Progress Card */}
        <div className="rounded-2xl bg-[#223b83] p-6 text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#cdd7fa]">Track Completion</span>
            <BookOpen size={18} className="text-[#ffb39e]" />
          </div>
          <p className="display-font mt-6 text-5xl">
            {progressPercent}
            <span className="text-2xl text-[#cdd7fa]">%</span>
          </p>
          <div className="mt-4 h-1.5 rounded-full bg-white/20">
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-1.5 rounded-full bg-[#ff9074] transition-all duration-500"
            />
          </div>
          <p className="mt-3 text-xs text-[#cdd7fa]">
            {completedTasks} of {totalTasks} milestones mastered · ~{Math.round(totalMinutesRemaining / 60)}h remaining
          </p>
        </div>

        {/* Weekly Focus & Streak */}
        <div className="rounded-2xl border border-[#e3e6df] bg-white p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#667085]">Daily Momentum</span>
            <Flame size={18} className="text-[#e05e43]" />
          </div>
          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-[#182032]">{loggedMinutesToday}</span>
            <span className="text-sm font-semibold text-[#8b93a2]">mins logged today</span>
          </div>
          <p className="mt-2 text-xs text-[#667085]">
            Target: 45m / day · Consistency beats cramming every single time.
          </p>
          <button
            type="button"
            onClick={() => setLoggedMinutesToday((prev) => prev + 30)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[#dfe3dc] bg-[#f7f8f5] px-3 py-1.5 text-xs font-bold text-[#223b83] hover:bg-[#e8edff]"
          >
            + Log 30m quick session
          </button>
        </div>

        {/* Live Focus Session Timer */}
        <div className="rounded-2xl border border-[#cfd8ef] bg-[#fff9e9] p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#e05e43]">Focus Session (Pomodoro)</span>
            <Clock size={18} className="text-[#e05e43]" />
          </div>
          <div className="mt-5 flex items-baseline justify-between">
            <span className="display-font text-4xl font-bold text-[#182032]">{formatTimer(timerSeconds)}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTimerActive((prev) => !prev)}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-white transition ${
                  timerActive ? "bg-[#e05e43] hover:bg-[#cc4f36]" : "bg-[#223b83] hover:bg-[#1a2f6b]"
                }`}
              >
                {timerActive ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimerActive(false);
                  setTimerSeconds(1500);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dfe3dc] bg-white text-[#667085] hover:bg-[#f7f8f5]"
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs text-[#667085]">
            {timerActive ? "Focus in progress... Stay with the task." : "25-minute deep focus block ready."}
          </p>
        </div>
      </div>

      {/* Track Selection Tabs */}
      <div>
        <label className="text-xs font-bold uppercase tracking-[0.16em] text-[#8b93a2]">Select Learning Track:</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {tracksState.map((track) => (
            <button
              key={track.id}
              type="button"
              onClick={() => setActiveTrackId(track.id)}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                activeTrackId === track.id
                  ? "border-[#223b83] bg-[#e8edff] text-[#223b83] shadow-xs"
                  : "border-[#e3e6df] bg-white text-[#667085] hover:border-[#cfd8ef]"
              }`}
            >
              <span className="block text-sm font-bold">{track.name}</span>
              <span className="mt-0.5 block text-xs opacity-75">{track.phases.length} phases</span>
            </button>
          ))}
        </div>
      </div>

      {/* Add Custom Task Form Drawer */}
      {showAddTask && (
        <div className="rounded-2xl border border-[#dfe3dc] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#182032]">Add Learning Task to {activeTrack.name}</h3>
            <button
              type="button"
              onClick={() => setShowAddTask(false)}
              className="text-xs font-bold text-[#8b93a2] hover:text-[#182032]"
            >
              Cancel
            </button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-[#667085]">Task Title / Objective</label>
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="e.g. Complete chapter 3 exercises on dynamic programming"
                className="mt-1 w-full rounded-xl border border-[#dfe3dc] bg-white px-3.5 py-2 text-sm outline-none focus:border-[#223b83]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#667085]">Target Phase</label>
              <select
                value={selectedPhaseForTask}
                onChange={(e) => setSelectedPhaseForTask(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#dfe3dc] bg-white px-3.5 py-2 text-sm outline-none focus:border-[#223b83]"
              >
                {activeTrack.phases.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-[#667085]">Estimated Time (Minutes)</label>
              <input
                type="number"
                min={15}
                step={15}
                value={newTaskMinutes}
                onChange={(e) => setNewTaskMinutes(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-[#dfe3dc] bg-white px-3.5 py-2 text-sm outline-none focus:border-[#223b83]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#667085]">Learning Format</label>
              <select
                value={newTaskType}
                onChange={(e) => setNewTaskType(e.target.value as LearningTask["type"])}
                className="mt-1 w-full rounded-xl border border-[#dfe3dc] bg-white px-3.5 py-2 text-sm outline-none focus:border-[#223b83]"
              >
                <option value="Hands-on">Hands-on</option>
                <option value="Reading">Reading</option>
                <option value="Video">Video</option>
                <option value="Project">Project</option>
                <option value="Practice">Practice</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleAddNewTask}
                disabled={!newTaskTitle.trim()}
                className="w-full rounded-xl bg-[#223b83] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1a2f6b] disabled:opacity-40"
              >
                Save Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Mode & Track Phases */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#e3e6df] pb-3">
          <span className="text-sm font-bold text-[#182032]">
            {activeTrack.name} Modules & Milestones
          </span>
          <div className="flex items-center gap-1 rounded-lg bg-[#f0f2ed] p-1 text-xs">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`rounded-md px-2.5 py-1 font-bold transition ${
                filterMode === "all" ? "bg-white text-[#223b83] shadow-xs" : "text-[#667085]"
              }`}
            >
              All ({totalTasks})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("pending")}
              className={`rounded-md px-2.5 py-1 font-bold transition ${
                filterMode === "pending" ? "bg-white text-[#223b83] shadow-xs" : "text-[#667085]"
              }`}
            >
              Remaining ({totalTasks - completedTasks})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("completed")}
              className={`rounded-md px-2.5 py-1 font-bold transition ${
                filterMode === "completed" ? "bg-white text-[#223b83] shadow-xs" : "text-[#667085]"
              }`}
            >
              Done ({completedTasks})
            </button>
          </div>
        </div>

        {/* Render Phases & Tasks */}
        <div className="space-y-6">
          {activeTrack.phases.map((phase) => {
            const phaseTasks = activeTrack.tasks.filter((t) => t.phaseId === phase.id);
            const filteredTasks = phaseTasks.filter((t) => {
              if (filterMode === "completed") return t.completed;
              if (filterMode === "pending") return !t.completed;
              return true;
            });

            const phaseCompletedCount = phaseTasks.filter((t) => t.completed).length;

            if (filterMode !== "all" && filteredTasks.length === 0) {
              return null;
            }

            return (
              <div key={phase.id} className="rounded-2xl border border-[#e3e6df] bg-white p-6">
                <div className="flex flex-col justify-between gap-2 border-b border-[#f0f2ed] pb-4 sm:flex-row sm:items-center">
                  <div>
                    <span className="rounded bg-[#f0f2ed] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#e05e43]">
                      {phase.weeks}
                    </span>
                    <h3 className="mt-1.5 text-lg font-bold text-[#182032]">{phase.title}</h3>
                    <p className="mt-1 text-xs text-[#8b93a2]">{phase.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#667085]">
                      {phaseCompletedCount} / {phaseTasks.length} done
                    </span>
                    <div className="h-2 w-20 rounded-full bg-[#f0f2ed] overflow-hidden">
                      <div
                        style={{
                          width: `${phaseTasks.length > 0 ? (phaseCompletedCount / phaseTasks.length) * 100 : 0}%`,
                        }}
                        className="h-full bg-[#48a582]"
                      />
                    </div>
                  </div>
                </div>

                {/* Tasks List */}
                <div className="mt-4 space-y-3">
                  {filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={`group flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition ${
                        task.completed
                          ? "border-[#e3f2ec] bg-[#f8fbf9]"
                          : "border-[#eef0ec] bg-white hover:border-[#cfd8ef] hover:bg-[#fafbfe]"
                      }`}
                    >
                      <button
                        type="button"
                        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                        className="mt-0.5 text-[#223b83] shrink-0"
                      >
                        {task.completed ? (
                          <CheckCircle2 size={20} className="text-[#48a582]" />
                        ) : (
                          <Circle size={20} className="text-[#c9d0dc] group-hover:text-[#223b83]" />
                        )}
                      </button>

                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-sm font-bold ${
                              task.completed ? "text-[#8b93a2] line-through" : "text-[#182032]"
                            }`}
                          >
                            {task.title}
                          </span>
                          <span className="rounded bg-[#f0f2ed] px-2 py-0.5 text-[10px] font-semibold text-[#667085]">
                            {task.type}
                          </span>
                          <span className="text-[11px] text-[#8b93a2]">~{task.estimatedMinutes} mins</span>
                        </div>
                        <p
                          className={`mt-1 text-xs leading-5 ${
                            task.completed ? "text-[#a3aab7]" : "text-[#667085]"
                          }`}
                        >
                          {task.description}
                        </p>
                        {task.sourceName && (
                          <p className="mt-2 flex items-center gap-1 text-[11px] font-bold text-[#223b83]">
                            <span>Resource: {task.sourceName}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  {filteredTasks.length === 0 && (
                    <p className="py-4 text-center text-xs text-[#8b93a2]">
                      No tasks matching filter in this phase.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Next Step Banner */}
      <div className="rounded-2xl border border-[#cfd8ef] bg-[#e8edff] p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h4 className="font-bold text-[#223b83]">Want to see where this learning connects?</h4>
            <p className="mt-1 text-xs leading-5 text-[#4663b0]">
              Review your 90-day transition timeline on the Roadmap tab.
            </p>
          </div>
          <Link
            href="/roadmap"
            className="inline-flex items-center gap-2 rounded-xl bg-[#223b83] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#1a2f6b]"
          >
            Open 90-Day Roadmap <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
