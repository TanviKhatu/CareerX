"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import {
  Mic2,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Award,
  ChevronRight,
  ThumbsUp,
  AlertCircle,
  Lightbulb,
  FileCheck,
  Send,
  HelpCircle,
} from "lucide-react";

export type InterviewQuestion = {
  id: string;
  role: string;
  category: "Behavioral" | "Technical" | "Situational";
  question: string;
  interviewerIntent: string;
  starTips: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  sampleWeakAnswer: string;
  sampleStrongAnswer: string;
};

const interviewBank: InterviewQuestion[] = [
  {
    id: "q-eng-1",
    role: "engineer",
    category: "Behavioral",
    question: "Tell me about a time you faced a difficult technical disagreement with a team member. How did you resolve it?",
    interviewerIntent: "Assessing collaborative maturity, intellectual humility, and whether you rely on data/benchmarks rather than ego.",
    starTips: {
      situation: "Briefly explain the project and the technical dispute (e.g. database schema or architectural choice).",
      task: "Clarify your responsibility and why reaching alignment was time-critical for the release.",
      action: "Describe how you listened, ran a benchmark/proof of concept, and depersonalized the trade-offs.",
      result: "State the outcome, project delivery success, and how your working relationship strengthened.",
    },
    sampleWeakAnswer:
      "A teammate wanted to use a slow library so I just proved them wrong by writing the code myself over the weekend.",
    sampleStrongAnswer:
      "During our API overhaul, my peer favored GraphQL while I advocated for REST with OpenAPI. Instead of debating opinion, we set up a 1-day spike testing mobile latency and caching complexity. The data demonstrated REST cut payload latency by 35% on mobile 3G. We aligned on REST, delivered 3 days early, and documented the decision in an ADR.",
  },
  {
    id: "q-eng-2",
    role: "engineer",
    category: "Technical",
    question: "Walk me through how you approach debugging a critical production outage with minimal logs.",
    interviewerIntent: "Evaluating systematic root-cause analysis, calm problem solving under pressure, and production safety.",
    starTips: {
      situation: "Mention a high-stakes incident where telemetry was incomplete or ambiguous.",
      task: "Identify the critical priority: stop customer impact before deep-diving into obscure code.",
      action: "Explain your binary search debugging, rollback safeguards, and metric instrumentation.",
      result: "Highlight mean-time-to-recovery (MTTR) and post-incident telemetry guardrails added.",
    },
    sampleWeakAnswer:
      "I usually just print console logs everywhere until I see where the error happens.",
    sampleStrongAnswer:
      "I follow a triage framework: first mitigate blast radius by checking if recent deploys or network anomalies correlate. If logs are sparse, I replicate production state locally using sanitized fixtures, isolate the failing subsystem with distributed request IDs, and patch with an automated regression test.",
  },
  {
    id: "q-des-1",
    role: "designer",
    category: "Behavioral",
    question: "Describe a project where user research directly challenged your personal design assumptions.",
    interviewerIntent: "Checking whether you are ego-driven or genuinely user-centric and willing to pivot on evidence.",
    starTips: {
      situation: "Describe your original design concept and why you felt confident in it.",
      task: "Explain the research methodology (usability testing, open-ended task flow).",
      action: "Share the humbling insight discovered and how you restructured the interface.",
      result: "Show the measurable outcome: higher task completion or reduced user confusion.",
    },
    sampleWeakAnswer:
      "I thought people would like a minimalist menu, but users are lazy so I added more buttons.",
    sampleStrongAnswer:
      "I designed an icon-only navigation bar that looked sleek in Figma. However, in 5 moderated usability sessions, 4 users paused and hesitated on every task. I immediately pivoted to labeled text navigation. Post-launch, onboarding drop-off decreased by 22%, reinforcing that clarity always trumps minimalism.",
  },
  {
    id: "q-des-2",
    role: "designer",
    category: "Situational",
    question: "How do you handle a product manager who wants to rush a feature without usability testing?",
    interviewerIntent: "Testing stakeholder negotiation, risk management, and finding pragmatic compromises.",
    starTips: {
      situation: "A tight sprint deadline where UX rigor is viewed as a blocker.",
      task: "Protect user experience while respecting the team's delivery velocity.",
      action: "Propose guerrilla testing, an unmoderated 1-hour session, or a fast post-launch feedback plan.",
      result: "Shipped on schedule while catching 2 critical UX flaws before general rollout.",
    },
    sampleWeakAnswer:
      "I refuse to hand over the Figma files until we do full two-week user research.",
    sampleStrongAnswer:
      "I don't position design as a bottleneck. I propose a pragmatic middle path: while engineers build the backend scaffolding, I run a 2-hour unmoderated 5-user UsabilityHub test. We caught a confusing checkout button before frontend integration, saving rework without delaying sprint delivery.",
  },
  {
    id: "q-gen-1",
    role: "general",
    category: "Behavioral",
    question: "Tell me about your greatest professional or academic failure and what it taught you.",
    interviewerIntent: "Assessing self-awareness, accountability, resilience, and actionable growth.",
    starTips: {
      situation: "Choose a real mistake, not a disguised humblebrag.",
      task: "Own your responsibility without blaming teammates, tools, or timing.",
      action: "Detail the steps you took to repair the damage and prevent recurrence.",
      result: "The enduring lesson and how it makes you more reliable today.",
    },
    sampleWeakAnswer:
      "My biggest failure was working too hard and burning myself out because I care too much.",
    sampleStrongAnswer:
      "In my junior year capstone, I underestimated third-party API rate limits and our demo crashed during live judging. It was entirely on me for not stress-testing. That taught me to always build graceful fallbacks and offline mock modes. In every project since, defensive architecture is my first checklist item.",
  },
];

export function MockInterviewView({ initialRole = "engineer" }: { initialRole?: string }) {
  const [selectedRole, setSelectedRole] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("careerx_interview_role");
      if (saved) return saved;
    }
    return initialRole || "engineer";
  });

  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [activeTab, setActiveTab] = useState<"practice" | "starGuide" | "modelAnswer">("practice");
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    score: number;
    clarity: number;
    impact: number;
    strengths: string[];
    improvements: string[];
  } | null>(null);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  // Filter questions for the selected role or general
  const filteredQuestions = useMemo(() => {
    const list = interviewBank.filter((q) => q.role === selectedRole || q.role === "general");
    return list.length > 0 ? list : interviewBank;
  }, [selectedRole]);

  const currentQuestion = filteredQuestions[activeQuestionIndex] || filteredQuestions[0];

  useEffect(() => {
    try {
      localStorage.setItem("careerx_interview_role", selectedRole);
    } catch {
      // ignore
    }
  }, [selectedRole]);

  // Timer ticker
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleEvaluate = () => {
    if (!userAnswer.trim()) return;
    setEvaluating(true);
    setTimerRunning(false);

    setTimeout(() => {
      // Analyze text metrics
      const wordCount = userAnswer.trim().split(/\s+/).length;
      const hasActionVerbs = /(implemented|architected|resolved|built|reduced|measured|designed|analyzed|led|collaborated)/i.test(
        userAnswer
      );
      const hasMetrics = /\d+(%|x|k|m|days|hours|users|ms)?/i.test(userAnswer);
      const hasResult = /(result|outcome|led to|decreased|increased|delivered|achieved)/i.test(userAnswer);

      let clarityScore = Math.min(95, Math.max(60, Math.round((wordCount / 70) * 85)));
      let impactScore = 65;
      if (hasMetrics) impactScore += 18;
      if (hasActionVerbs) impactScore += 12;
      let overall = Math.round((clarityScore * 0.4) + (impactScore * 0.6));

      const strengths: string[] = [];
      const improvements: string[] = [];

      if (wordCount >= 45) {
        strengths.push("Good descriptive depth and context provided.");
      } else {
        improvements.push("Answer is slightly brief. Expand on the specific actions you took.");
      }

      if (hasActionVerbs) {
        strengths.push("Effective use of active ownership verbs rather than passive voice.");
      } else {
        improvements.push("Use more definitive action verbs (e.g., 'I architected', 'I investigated').");
      }

      if (hasMetrics) {
        strengths.push("Terrific inclusion of quantifiable metrics or timeframes to anchor your impact.");
      } else {
        improvements.push("Add concrete numbers or percentages (e.g. 'reduced latency by 30%', 'shipped 3 days early').");
      }

      if (hasResult) {
        strengths.push("Closed the answer with a clear, positive resolution.");
      } else {
        improvements.push("Conclude explicitly with the long-term impact on the team or product.");
      }

      setEvaluationResult({
        score: Math.min(98, overall),
        clarity: clarityScore,
        impact: impactScore,
        strengths,
        improvements,
      });
      setEvaluating(false);
    }, 600);
  };

  const switchQuestion = (index: number) => {
    setActiveQuestionIndex(index);
    setUserAnswer("");
    setEvaluationResult(null);
    setTimerSeconds(0);
    setTimerRunning(false);
    setActiveTab("practice");
  };

  const insertSampleAnswer = (type: "strong" | "weak") => {
    if (type === "strong") {
      setUserAnswer(currentQuestion.sampleStrongAnswer);
    } else {
      setUserAnswer(currentQuestion.sampleWeakAnswer);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e05e43]">Mock Interview</p>
          <h1 className="display-font mt-2 text-4xl tracking-tight sm:text-5xl">Practice room.</h1>
          <p className="mt-3 max-w-xl text-[#667085]">
            A low-stakes place to turn preparation into confidence. Practice authentic questions, structure answers with STAR, and receive immediate coaching feedback.
          </p>
        </div>

        {/* Role Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#8b93a2]">Role Track:</span>
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setActiveQuestionIndex(0);
              setUserAnswer("");
              setEvaluationResult(null);
            }}
            className="rounded-xl border border-[#dfe3dc] bg-white px-3.5 py-2 text-xs font-bold text-[#182032] outline-none focus:border-[#223b83]"
          >
            <option value="engineer">Engineering & Tech</option>
            <option value="designer">Product & UX Design</option>
            <option value="general">General & Leadership</option>
          </select>
        </div>
      </div>

      {/* Main Practice Container */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Question & Active Practice Space */}
        <div className="space-y-6 lg:col-span-2">
          {/* Question Navigator & Banner */}
          <div className="rounded-2xl border border-[#cfd8ef] bg-white p-6 shadow-xs">
            <div className="flex flex-col justify-between gap-3 border-b border-[#f0f2ed] pb-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-[#e8edff] px-2.5 py-1 text-xs font-bold text-[#223b83]">
                  Question {activeQuestionIndex + 1} of {filteredQuestions.length}
                </span>
                <span className="rounded-md bg-[#f0f2ed] px-2.5 py-1 text-xs font-bold text-[#667085]">
                  {currentQuestion.category}
                </span>
              </div>

              {/* Timer Bar */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-lg border border-[#dfe3dc] bg-[#f7f8f5] px-3 py-1.5 text-xs font-bold text-[#182032]">
                  <Clock size={14} className="text-[#e05e43]" />
                  <span>{formatTimer(timerSeconds)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setTimerRunning((v) => !v)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-white transition ${
                    timerRunning ? "bg-[#e05e43]" : "bg-[#223b83]"
                  }`}
                  title={timerRunning ? "Pause timer" : "Start response timer"}
                >
                  {timerRunning ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTimerRunning(false);
                    setTimerSeconds(0);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#dfe3dc] bg-white text-[#667085] hover:bg-[#f0f2ed]"
                  title="Reset timer"
                >
                  <RotateCcw size={13} />
                </button>
              </div>
            </div>

            {/* The Question */}
            <h2 className="display-font mt-4 text-2xl font-bold leading-8 text-[#182032]">
              &ldquo;{currentQuestion.question}&rdquo;
            </h2>

            {/* Interviewer Mindset / Intent */}
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#dfe5f5] bg-[#f5f8ff] p-3.5 text-xs">
              <Lightbulb size={16} className="mt-0.5 text-[#223b83] shrink-0" />
              <div>
                <span className="font-bold text-[#223b83]">What the Interviewer is Evaluating: </span>
                <span className="text-[#334b80]">{currentQuestion.interviewerIntent}</span>
              </div>
            </div>
          </div>

          {/* Practice Tabs (Your Response / STAR Framework / Model Answer) */}
          <div className="rounded-2xl border border-[#e3e6df] bg-white p-6">
            <div className="flex items-center justify-between border-b border-[#f0f2ed] pb-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("practice")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    activeTab === "practice"
                      ? "bg-[#223b83] text-white"
                      : "text-[#667085] hover:bg-[#f0f2ed]"
                  }`}
                >
                  Your Answer
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("starGuide")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    activeTab === "starGuide"
                      ? "bg-[#223b83] text-white"
                      : "text-[#667085] hover:bg-[#f0f2ed]"
                  }`}
                >
                  STAR Blueprint Guide
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("modelAnswer")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    activeTab === "modelAnswer"
                      ? "bg-[#223b83] text-white"
                      : "text-[#667085] hover:bg-[#f0f2ed]"
                  }`}
                >
                  Model Answer Example
                </button>
              </div>

              {/* Sample Answers Dropdown */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[#8b93a2]">Try sample:</span>
                <button
                  type="button"
                  onClick={() => insertSampleAnswer("strong")}
                  className="rounded-md border border-[#cde8dc] bg-[#e3f2ec] px-2 py-0.5 text-[11px] font-bold text-[#25805c] hover:bg-[#d6f0e4]"
                >
                  Strong answer
                </button>
                <button
                  type="button"
                  onClick={() => insertSampleAnswer("weak")}
                  className="rounded-md border border-[#fbe5e0] bg-[#fff8f7] px-2 py-0.5 text-[11px] font-bold text-[#b83d24] hover:bg-[#fdebea]"
                >
                  Weak answer
                </button>
              </div>
            </div>

            {/* Tab: Your Answer Input */}
            {activeTab === "practice" && (
              <div className="mt-4 space-y-4">
                <textarea
                  rows={7}
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Structure your answer here using Situation, Task, Action, and Result..."
                  className="w-full rounded-xl border border-[#dfe3dc] p-4 text-sm leading-6 text-[#182032] outline-none focus:border-[#223b83]"
                />

                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <span className="text-xs text-[#8b93a2]">
                    Word count: {userAnswer.trim() ? userAnswer.trim().split(/\s+/).length : 0} words · Aim for ~90-180 words
                  </span>

                  <button
                    type="button"
                    onClick={handleEvaluate}
                    disabled={evaluating || !userAnswer.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#223b83] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#1a2f6b] disabled:opacity-40"
                  >
                    {evaluating ? (
                      <>Evaluating response...</>
                    ) : (
                      <>
                        <Sparkles size={14} /> Evaluate answer with AI Coach
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Tab: STAR Blueprint Guide */}
            {activeTab === "starGuide" && (
              <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
                <div className="rounded-xl border border-[#e3e6df] bg-[#f7f8f5] p-3.5">
                  <span className="font-bold uppercase tracking-wider text-[#e05e43]">1. Situation</span>
                  <p className="mt-1 text-[#667085] leading-5">{currentQuestion.starTips.situation}</p>
                </div>
                <div className="rounded-xl border border-[#e3e6df] bg-[#f7f8f5] p-3.5">
                  <span className="font-bold uppercase tracking-wider text-[#223b83]">2. Task</span>
                  <p className="mt-1 text-[#667085] leading-5">{currentQuestion.starTips.task}</p>
                </div>
                <div className="rounded-xl border border-[#e3e6df] bg-[#f7f8f5] p-3.5">
                  <span className="font-bold uppercase tracking-wider text-[#48a582]">3. Action</span>
                  <p className="mt-1 text-[#667085] leading-5">{currentQuestion.starTips.action}</p>
                </div>
                <div className="rounded-xl border border-[#e3e6df] bg-[#f7f8f5] p-3.5">
                  <span className="font-bold uppercase tracking-wider text-[#182032]">4. Result</span>
                  <p className="mt-1 text-[#667085] leading-5">{currentQuestion.starTips.result}</p>
                </div>
              </div>
            )}

            {/* Tab: Model Answer Example */}
            {activeTab === "modelAnswer" && (
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-[#cde8dc] bg-[#f4f9f7] p-4 text-xs">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#25805c]">
                    <CheckCircle2 size={16} /> Strong Candidate Answer:
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#182032] italic">
                    &ldquo;{currentQuestion.sampleStrongAnswer}&rdquo;
                  </p>
                </div>

                <div className="rounded-xl border border-[#fbe5e0] bg-[#fff8f7] p-4 text-xs">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#b83d24]">
                    <AlertCircle size={16} /> What to Avoid (Common Pitfall):
                  </div>
                  <p className="mt-1 text-sm leading-5 text-[#667085] italic">
                    &ldquo;{currentQuestion.sampleWeakAnswer}&rdquo;
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* AI Coach Feedback & Evaluation Results */}
          {evaluationResult && (
            <div className="rounded-2xl border border-[#cfd8ef] bg-white p-6 shadow-sm">
              <div className="flex flex-col justify-between gap-3 border-b border-[#f0f2ed] pb-4 sm:flex-row sm:items-center">
                <div>
                  <span className="rounded-full bg-[#e8edff] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#223b83]">
                    Interview Coach Evaluation
                  </span>
                  <h3 className="display-font mt-2 text-xl font-bold text-[#182032]">
                    Delivery Performance Report
                  </h3>
                </div>
                <div className="text-right">
                  <span className="display-font text-3xl font-bold text-[#223b83]">
                    {evaluationResult.score}%
                  </span>
                  <span className="block text-[11px] text-[#8b93a2]">Readiness Score</span>
                </div>
              </div>

              {/* Strength and Improvement Grids */}
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-[#e3f2ec] bg-[#f8fbf9] p-4 text-xs">
                  <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#25805c]">
                    <ThumbsUp size={14} /> Key Strengths
                  </span>
                  <ul className="mt-2.5 space-y-2">
                    {evaluationResult.strengths.map((str, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[#182032]">
                        <CheckCircle2 size={14} className="mt-0.5 text-[#48a582] shrink-0" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-[#fbe5e0] bg-[#fff8f7] p-4 text-xs">
                  <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#b83d24]">
                    <AlertCircle size={14} /> High-Leverage Tweaks
                  </span>
                  <ul className="mt-2.5 space-y-2">
                    {evaluationResult.improvements.map((imp, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[#182032]">
                        <ArrowRight size={14} className="mt-0.5 text-[#e05e43] shrink-0" />
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Advance to Next Question */}
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const next = (activeQuestionIndex + 1) % filteredQuestions.length;
                    switchQuestion(next);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#223b83] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#1a2f6b]"
                >
                  Next Question ({activeQuestionIndex + 2 > filteredQuestions.length ? 1 : activeQuestionIndex + 2} of {filteredQuestions.length}) <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Questions Bank Sidebar & Confidence Meter */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#e3e6df] bg-white p-5">
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#8b93a2]">
              Question Playlist ({filteredQuestions.length})
            </h3>

            <div className="mt-3 space-y-2">
              {filteredQuestions.map((q, idx) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => switchQuestion(idx)}
                  className={`flex w-full items-start gap-2.5 rounded-xl p-3 text-left transition ${
                    activeQuestionIndex === idx
                      ? "border border-[#223b83] bg-[#e8edff] text-[#223b83]"
                      : "border border-[#f0f2ed] bg-white text-[#667085] hover:bg-[#f7f8f5]"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold shrink-0 ${
                      activeQuestionIndex === idx ? "bg-[#223b83] text-white" : "bg-[#f0f2ed] text-[#8b93a2]"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold">{q.question}</p>
                    <span className="mt-0.5 block text-[10px] text-[#8b93a2]">{q.category}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Interview Principles Card */}
          <div className="rounded-2xl border border-[#cfd8ef] bg-[#fff9e9] p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#e05e43]">Golden Rule</span>
            <h4 className="mt-2 text-sm font-bold text-[#182032]">
              Lead with the result, anchor with proof.
            </h4>
            <p className="mt-2 text-xs leading-5 text-[#667085]">
              Interviewers evaluate hundreds of candidates. Clear numbers and genuine lessons learned stand out 10x more than generic buzzwords.
            </p>
            <Link
              href="/resume"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#223b83] hover:underline"
            >
              Align with Resume Studio <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
