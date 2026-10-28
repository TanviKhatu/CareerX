"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import {
  Network,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Award,
  ChevronRight,
  Clock,
  Briefcase,
  Users,
  ShieldAlert,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
} from "lucide-react";

export type SimulationChoice = {
  id: string;
  text: string;
  mentorFeedback: string;
  riskNote: string;
  scoreImpact: {
    trust: number;
    craft: number;
    speed: number;
  };
};

export type SimulationStage = {
  stageNumber: number;
  timeLabel: string;
  situationTitle: string;
  context: string;
  stakeholders: string[];
  choices: SimulationChoice[];
};

export type SimulationScenario = {
  id: string;
  roleTitle: string;
  companyContext: string;
  archetype: string;
  tagline: string;
  stages: SimulationStage[];
};

const scenarios: SimulationScenario[] = [
  {
    id: "swe",
    roleTitle: "Software Engineer",
    companyContext: "CloudScale Fintech (High-Volume Payment Infrastructure)",
    archetype: "The Resilient Systems Thinker",
    tagline: "High-volume checkout gateway with real money on the line.",
    stages: [
      {
        stageNumber: 1,
        timeLabel: "09:30 AM — Incident Alert",
        situationTitle: "Spike in Failed Checkout Webhooks",
        context:
          "It's peak morning shopping hours. Your automated PagerDuty alarm fires: 14% of payment confirmation webhooks are failing with 504 Gateway Timeouts. Customers are getting charged, but their orders aren't marking as paid.",
        stakeholders: ["VP of Engineering", "Customer Support Lead", "Database Admin"],
        choices: [
          {
            id: "swe-1-a",
            text: "Immediately revert the latest deployment from 20 minutes ago to restore baseline stability.",
            mentorFeedback:
              "Classic SRE instinct: prioritize immediate customer blast radius over diagnosing in production. This stops the bleeding fast.",
            riskNote: "You might lose uncommitted patch migrations if the deploy included breaking database schema shifts.",
            scoreImpact: { trust: 15, craft: 10, speed: 20 },
          },
          {
            id: "swe-1-b",
            text: "Quickly attach distributed tracing and inspect latency logs in Datadog before taking action.",
            mentorFeedback:
              "High analytical rigor: you confirm whether the root cause is actually the new deploy or a downstream third-party banking API outage.",
            riskNote: "Every minute spent diagnosing without mitigation adds 200 angry customer support tickets.",
            scoreImpact: { trust: 5, craft: 25, speed: -5 },
          },
          {
            id: "swe-1-c",
            text: "Spin up a temporary worker queue to ingest failed webhooks and retry with exponential backoff.",
            mentorFeedback:
              "Thoughtful engineering resilience: you isolate the symptom so orders are not lost while fixing the core bottleneck.",
            riskNote: "Takes 15-20 minutes to spin up and test safely under load.",
            scoreImpact: { trust: 10, craft: 20, speed: 10 },
          },
        ],
      },
      {
        stageNumber: 2,
        timeLabel: "01:15 PM — Architecture Decision",
        situationTitle: "The Root Cause & Patch Dilemma",
        context:
          "You discovered the culprit: an unindexed query inside a transaction lock is exhausting the Postgres connection pool under concurrency. You can either deploy a quick raw SQL index in production right now, or refactor the transaction into an async event job.",
        stakeholders: ["Lead Architect", "Security & Compliance Lead"],
        choices: [
          {
            id: "swe-2-a",
            text: "Run CREATE INDEX CONCURRENTLY directly in production after testing on a read-replica.",
            mentorFeedback:
              "Pragmatic production firefighting: index creation concurrently avoids table locking and solves 90% of the latency within 5 minutes.",
            riskNote: "High risk if replica indexing characteristics differ from primary production CPU usage.",
            scoreImpact: { trust: 10, craft: 15, speed: 25 },
          },
          {
            id: "swe-2-b",
            text: "Decouple the transaction completely into an async Redis event bus with guaranteed delivery.",
            mentorFeedback:
              "Architecturally superior solution that permanently eliminates concurrency lock contention for future scale.",
            riskNote: "Requires full PR review and staging verification; cannot launch during peak hours.",
            scoreImpact: { trust: 15, craft: 30, speed: 5 },
          },
        ],
      },
      {
        stageNumber: 3,
        timeLabel: "04:30 PM — Incident Post-Mortem",
        situationTitle: "The Blameless Post-Mortem",
        context:
          "The system is completely stable now. In the post-mortem meeting, leadership asks how this reached production without automated tests catching the missing database index.",
        stakeholders: ["CTO", "Product Director"],
        choices: [
          {
            id: "swe-3-a",
            text: "Propose an automated CI check that flags any SQL queries without query-plan index coverage.",
            mentorFeedback:
              "Best-in-class engineering leadership: you convert a single human mistake into an institutional guardrail that protects everyone.",
            riskNote: "Requires setting up synthetic database fixture benchmarks in GitHub Actions.",
            scoreImpact: { trust: 25, craft: 25, speed: 15 },
          },
          {
            id: "swe-3-b",
            text: "Walk through the full timeline transparently, acknowledging gaps and documenting 4 clear action items.",
            mentorFeedback:
              "Builds tremendous psychological safety and cross-functional trust across the product and engineering org.",
            riskNote: "Needs strict accountability follow-up in the next sprint.",
            scoreImpact: { trust: 30, craft: 15, speed: 15 },
          },
        ],
      },
    ],
  },
  {
    id: "designer",
    roleTitle: "Product Designer",
    companyContext: "Lumina Workspace (Collaborative SaaS Productivity Tool)",
    archetype: "The Empathetic Craft Champion",
    tagline: "Balancing urgent executive growth demands with user clarity and dignity.",
    stages: [
      {
        stageNumber: 1,
        timeLabel: "10:00 AM — Executive Clash",
        situationTitle: "The Dark Pattern Feature Request",
        context:
          "The VP of Growth wants to hide the 'Skip Trial' button behind a tiny link and auto-check an annual billing toggle to hit quarterly expansion targets. You believe this erodes long-term user trust.",
        stakeholders: ["VP of Growth", "Product Manager", "Lead Researcher"],
        choices: [
          {
            id: "des-1-a",
            text: "Present user retention data showing users forced into unwanted billing churn at 4x the baseline rate.",
            mentorFeedback:
              "Elite design strategy: speak the language of business metrics (LTV and churn) instead of purely aesthetic complaints.",
            riskNote: "Requires pulling cohort retention data with the data analyst before the 11 AM sync.",
            scoreImpact: { trust: 25, craft: 20, speed: 10 },
          },
          {
            id: "des-1-b",
            text: "Design an alternative high-conversion checkout flow that highlights plan value with transparent billing toggles.",
            mentorFeedback:
              "Generative problem solving: never show up with just 'no'; bring a better design that achieves their goal with integrity.",
            riskNote: "Takes extra design time to craft compelling benefit comparison microcopy.",
            scoreImpact: { trust: 20, craft: 30, speed: 15 },
          },
          {
            id: "des-1-c",
            text: "Propose an A/B test with a small 10% audience sample to settle the debate with objective feedback.",
            mentorFeedback:
              "Pragmatic de-escalation that depersonalizes the conflict and lets customer behavior dictate product decisions.",
            riskNote: "Exposes 10% of users to a potentially negative brand experience.",
            scoreImpact: { trust: 15, craft: 10, speed: 25 },
          },
        ],
      },
      {
        stageNumber: 2,
        timeLabel: "02:15 PM — Usability Lab Testing",
        situationTitle: "Users Miss the Core Navigation Shift",
        context:
          "During live moderated testing of your newly redesigned dashboard, 4 out of 5 users repeatedly click the wrong menu item to find their workspace settings, expressing frustration.",
        stakeholders: ["User 1 (Enterprise)", "User 2 (Solo)", "Frontend Engineer"],
        choices: [
          {
            id: "des-2-a",
            text: "Pause the rollout immediately to simplify the information architecture based on user mental models.",
            mentorFeedback:
              "Strong user advocacy: catching usability failures in Figma/Staging is 100x cheaper than fixing them post-launch.",
            riskNote: "Pushes the planned sprint release date back by one week.",
            scoreImpact: { trust: 15, craft: 30, speed: 5 },
          },
          {
            id: "des-2-b",
            text: "Keep the layout but add contextual tooltips and an interactive onboarding spotlight tour.",
            mentorFeedback:
              "Practical band-aid that keeps release velocity intact, though tooltips rarely compensate for confusing architecture.",
            riskNote: "Users frequently dismiss product tour modals without reading.",
            scoreImpact: { trust: 10, craft: 10, speed: 25 },
          },
        ],
      },
      {
        stageNumber: 3,
        timeLabel: "04:45 PM — Design System Handoff",
        situationTitle: "Engineering Handoff & Edge Cases",
        context:
          "The engineers review your design specs. They point out that in Arabic (RTL) and German (long strings), the navigation chips will break onto three awkward lines on mobile screens.",
        stakeholders: ["Senior Frontend Engineer", "Localization Specialist"],
        choices: [
          {
            id: "des-3-a",
            text: "Pair with the engineer to define dynamic flex wrapping rules and sensible character truncation with tooltips.",
            mentorFeedback:
              "Shows deep professional maturity: great designers design systems and edge cases, not just happy-path desktop screens.",
            riskNote: "Requires updating Figma auto-layout specs for all viewport breakpoints.",
            scoreImpact: { trust: 30, craft: 25, speed: 15 },
          },
        ],
      },
    ],
  },
  {
    id: "data",
    roleTitle: "Data Analyst / Strategist",
    companyContext: "Aura Health (Digital Therapeutics & Fitness Platform)",
    archetype: "The Insight Detective",
    tagline: "Finding the ground truth behind anomalous corporate metrics.",
    stages: [
      {
        stageNumber: 1,
        timeLabel: "09:15 AM — Urgent Slack Message",
        situationTitle: "The Sudden 28% Drop in Monthly Active Users",
        context:
          "The CEO pings the analytics channel: 'Our headline MAU chart dropped 28% overnight. What happened?' Everyone in the room is panicking.",
        stakeholders: ["CEO", "Chief Product Officer", "Data Engineering Lead"],
        choices: [
          {
            id: "dat-1-a",
            text: "Check data pipeline health first to verify if ETL ingestion cron jobs failed or lagged.",
            mentorFeedback:
              "First rule of data science: never diagnose user psychology before confirming data pipeline integrity. 70% of overnight crashes are broken telemetry.",
            riskNote: "If the pipeline is healthy, you'll need to pivot immediately to cohort segmentation.",
            scoreImpact: { trust: 25, craft: 25, speed: 20 },
          },
          {
            id: "dat-1-b",
            text: "Segment the 28% drop by geography, platform (iOS vs Android), and app version.",
            mentorFeedback:
              "Sound exploratory data analysis: dimensional breakdown isolates whether the issue is isolated (e.g. an iOS 18 crash) or company-wide.",
            riskNote: "Takes 30-40 minutes of SQL slicing while executives wait impatiently.",
            scoreImpact: { trust: 15, craft: 25, speed: 15 },
          },
        ],
      },
      {
        stageNumber: 2,
        timeLabel: "01:30 PM — The Breakthrough",
        situationTitle: "An iOS Update Broke Background Session Tracking",
        context:
          "You discover the pipeline is fine: the latest iOS release had a privacy flag misconfiguration that stopped recording background session pings, making active users appear dormant.",
        stakeholders: ["Mobile Engineering Lead", "Growth Marketing Lead"],
        choices: [
          {
            id: "dat-2-a",
            text: "Publish an interim 1-page executive memo explaining the telemetry bug with estimated true usage.",
            mentorFeedback:
              "Calm, executive-ready communication: you eliminate panic, quantify the discrepancy, and set expectations.",
            riskNote: "Estimates must be clearly marked as projections, not audited numbers.",
            scoreImpact: { trust: 30, craft: 20, speed: 20 },
          },
        ],
      },
      {
        stageNumber: 3,
        timeLabel: "04:15 PM — Strategic Prevention",
        situationTitle: "Defending Against Future Telemetry Gaps",
        context:
          "Leadership asks how analytics can stay synchronized with mobile app releases moving forward.",
        stakeholders: ["VP of Product", "QA Lead"],
        choices: [
          {
            id: "dat-3-a",
            text: "Establish a mandatory Tracking Plan schema validation step in all mobile release smoke tests.",
            mentorFeedback:
              "Transforms analytics from passive reporting into an essential engineering release gatekeeper.",
            riskNote: "Requires ongoing cross-functional maintenance with mobile QA.",
            scoreImpact: { trust: 25, craft: 30, speed: 15 },
          },
        ],
      },
    ],
  },
];

export function SimulatorView() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("swe");
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [chosenChoices, setChosenChoices] = useState<Record<number, SimulationChoice>>({});
  const [isCompleted, setIsCompleted] = useState(false);

  // Energy diagnostics checkboxes
  const [energizingFactors, setEnergizingFactors] = useState<string[]>([]);
  const [drainingFactors, setDrainingFactors] = useState<string[]>([]);

  const activeScenario = useMemo(() => {
    return scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];
  }, [selectedScenarioId]);

  const currentStage = activeScenario.stages[currentStageIndex];

  // Calculate cumulative impact scores
  const scoreSummary = useMemo(() => {
    let trust = 50;
    let craft = 50;
    let speed = 50;
    Object.values(chosenChoices).forEach((choice) => {
      trust += choice.scoreImpact.trust;
      craft += choice.scoreImpact.craft;
      speed += choice.scoreImpact.speed;
    });
    return {
      trust: Math.min(100, Math.max(10, trust)),
      craft: Math.min(100, Math.max(10, craft)),
      speed: Math.min(100, Math.max(10, speed)),
    };
  }, [chosenChoices]);

  const selectScenario = (id: string) => {
    setSelectedScenarioId(id);
    setCurrentStageIndex(0);
    setChosenChoices({});
    setIsCompleted(false);
    setEnergizingFactors([]);
    setDrainingFactors([]);
  };

  const handleChoose = (choice: SimulationChoice) => {
    setChosenChoices((prev) => ({
      ...prev,
      [currentStageIndex]: choice,
    }));
  };

  const nextStage = () => {
    if (currentStageIndex < activeScenario.stages.length - 1) {
      setCurrentStageIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const restartSimulation = () => {
    setCurrentStageIndex(0);
    setChosenChoices({});
    setIsCompleted(false);
    setEnergizingFactors([]);
    setDrainingFactors([]);
  };

  const toggleFactor = (list: string[], setList: (val: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e05e43]">Career Simulator</p>
          <h1 className="display-font mt-2 text-4xl tracking-tight sm:text-5xl">Try on a career.</h1>
          <p className="mt-3 max-w-xl text-[#667085]">
            Step into authentic workday challenges with real trade-offs. Test your instincts and discover what kind of work truly energizes you.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={restartSimulation}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#dfe3dc] bg-white px-3.5 py-2 text-xs font-semibold text-[#667085] hover:bg-[#f0f2ed]"
          >
            <RotateCcw size={14} /> Restart scenario
          </button>
        </div>
      </div>

      {/* Role Picker Pills */}
      <div>
        <label className="text-xs font-bold uppercase tracking-[0.16em] text-[#8b93a2]">
          Select Career Role to Simulate:
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {scenarios.map((sc) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => selectScenario(sc.id)}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                selectedScenarioId === sc.id
                  ? "border-[#223b83] bg-[#e8edff] text-[#223b83] shadow-xs"
                  : "border-[#e3e6df] bg-white text-[#667085] hover:border-[#cfd8ef]"
              }`}
            >
              <span className="block text-sm font-bold">{sc.roleTitle}</span>
              <span className="mt-0.5 block text-xs opacity-75">{sc.archetype}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Live Simulation Workday Experience */}
      {!isCompleted ? (
        <div className="space-y-6">
          {/* Situation Header Card */}
          <div className="rounded-2xl border border-[#cfd8ef] bg-white p-6 shadow-xs">
            <div className="flex flex-col justify-between gap-3 border-b border-[#f0f2ed] pb-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-[#e8edff] px-2.5 py-1 text-xs font-bold text-[#223b83]">
                    {activeScenario.roleTitle}
                  </span>
                  <span className="text-xs text-[#8b93a2]">· {activeScenario.companyContext}</span>
                </div>
                <h2 className="display-font mt-3 text-2xl font-bold text-[#182032]">
                  {currentStage.situationTitle}
                </h2>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-[#f7f8f5] px-3 py-2 text-xs font-bold text-[#e05e43]">
                <Clock size={16} />
                <span>{currentStage.timeLabel}</span>
              </div>
            </div>

            {/* Context Narrative */}
            <p className="mt-4 text-sm leading-6 text-[#182032]">{currentStage.context}</p>

            {/* Stakeholders Involved */}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#f0f2ed] pt-3 text-xs text-[#8b93a2]">
              <span className="font-semibold text-[#667085]">In the room:</span>
              {currentStage.stakeholders.map((sh) => (
                <span key={sh} className="rounded-full bg-[#f0f2ed] px-2.5 py-0.5 text-xs text-[#182032]">
                  {sh}
                </span>
              ))}
            </div>
          </div>

          {/* Interactive Choices Grid */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#8b93a2]">
              How do you respond? Choose your move:
            </h3>

            <div className="grid gap-3">
              {currentStage.choices.map((choice) => {
                const isSelected = chosenChoices[currentStageIndex]?.id === choice.id;

                return (
                  <div
                    key={choice.id}
                    onClick={() => handleChoose(choice)}
                    className={`cursor-pointer rounded-2xl border p-5 transition ${
                      isSelected
                        ? "border-[#223b83] bg-[#f8faff] shadow-sm"
                        : "border-[#e3e6df] bg-white hover:border-[#cfd8ef] hover:bg-[#fafbfe]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                          isSelected ? "bg-[#223b83] text-white" : "border border-[#cfd4db] text-[#8b93a2]"
                        }`}
                      >
                        {isSelected ? <CheckCircle2 size={14} /> : ""}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${isSelected ? "font-bold text-[#182032]" : "text-[#182032]"}`}>
                          {choice.text}
                        </p>

                        {/* If selected, show professional mentor insight */}
                        {isSelected && (
                          <div className="mt-4 space-y-2 rounded-xl border border-[#dfe5f5] bg-white p-4 text-xs">
                            <div className="flex items-start gap-2 text-[#223b83]">
                              <Sparkles size={15} className="mt-0.5 shrink-0" />
                              <div>
                                <span className="font-bold">Senior Mentor Breakdown: </span>
                                <span className="text-[#334b80]">{choice.mentorFeedback}</span>
                              </div>
                            </div>
                            <div className="flex items-start gap-2 text-[#b83d24]">
                              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                              <div>
                                <span className="font-bold">Trade-off / Risk: </span>
                                <span className="text-[#9e341f]">{choice.riskNote}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Advance Button */}
            {chosenChoices[currentStageIndex] && (
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={nextStage}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#223b83] px-6 py-3 text-sm font-bold text-white shadow-[0_4px_0_#142658] transition hover:bg-[#1a2f6b]"
                >
                  {currentStageIndex < activeScenario.stages.length - 1 ? (
                    <>
                      Proceed to next incident <ArrowRight size={16} />
                    </>
                  ) : (
                    <>
                      Complete Workday & View Debrief <Award size={16} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Current Instinct Meters */}
          <div className="rounded-2xl border border-[#e3e6df] bg-white p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8b93a2]">
              Professional Instinct Meters (Based on Decisions Made)
            </span>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#667085]">Stakeholder Trust</span>
                  <span className="text-[#223b83]">{scoreSummary.trust}%</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-[#f0f2ed] overflow-hidden">
                  <div style={{ width: `${scoreSummary.trust}%` }} className="h-full bg-[#223b83] rounded-full" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#667085]">Technical & Craft Rigor</span>
                  <span className="text-[#48a582]">{scoreSummary.craft}%</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-[#f0f2ed] overflow-hidden">
                  <div style={{ width: `${scoreSummary.craft}%` }} className="h-full bg-[#48a582] rounded-full" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#667085]">Execution Velocity</span>
                  <span className="text-[#e05e43]">{scoreSummary.speed}%</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-[#f0f2ed] overflow-hidden">
                  <div style={{ width: `${scoreSummary.speed}%` }} className="h-full bg-[#e05e43] rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Workday Simulation Debrief & Energy Diagnostic */
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#cfd8ef] bg-white p-8 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <span className="rounded-full bg-[#e3f2ec] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#25805c]">
                  Workday Simulation Completed
                </span>
                <h2 className="display-font mt-3 text-3xl font-bold text-[#182032]">
                  {activeScenario.roleTitle} Debrief
                </h2>
                <p className="mt-1 text-sm text-[#667085]">
                  You navigated {activeScenario.stages.length} real dilemmas as {activeScenario.archetype}.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={restartSimulation}
                  className="rounded-xl border border-[#dfe3dc] bg-white px-4 py-2.5 text-xs font-bold text-[#223b83] hover:bg-[#f7f8f5]"
                >
                  Replay role
                </button>
              </div>
            </div>

            {/* Career Energy Diagnostic Form */}
            <div className="mt-8 border-t border-[#f0f2ed] pt-6">
              <h3 className="text-base font-bold text-[#182032]">
                Reflect on Your Instincts: What did you notice?
              </h3>
              <p className="mt-1 text-xs text-[#8b93a2]">
                Knowing what drains or energizes you is more important than knowing what you're merely capable of.
              </p>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {/* Energizing */}
                <div className="rounded-2xl border border-[#e3f2ec] bg-[#f8fbf9] p-5">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#25805c]">
                    <ThumbsUp size={16} />
                    <span>What energized you in this role?</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      "Troubleshooting high-stakes urgency",
                      "Defending the end-user against bad metrics",
                      "Architecting long-term scalable systems",
                      "Cross-functional communication under pressure",
                      "Deep detective work with telemetry data",
                    ].map((factor) => {
                      const active = energizingFactors.includes(factor);
                      return (
                        <button
                          key={factor}
                          type="button"
                          onClick={() => toggleFactor(energizingFactors, setEnergizingFactors, factor)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                            active
                              ? "border-[#48a582] bg-[#48a582] text-white"
                              : "border-[#cde8dc] bg-white text-[#25805c] hover:bg-[#eef8f4]"
                          }`}
                        >
                          {factor}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Draining */}
                <div className="rounded-2xl border border-[#fbe5e0] bg-[#fff8f7] p-5">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#b83d24]">
                    <ThumbsDown size={16} />
                    <span>What felt draining or frustrating?</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      "Dealing with corporate politics & metrics pressure",
                      "Ambiguity without clear directions",
                      "Risk of breaking production systems",
                      "Having to justify decisions repeatedly",
                      "Time constraints forcing suboptimal quick-fixes",
                    ].map((factor) => {
                      const active = drainingFactors.includes(factor);
                      return (
                        <button
                          key={factor}
                          type="button"
                          onClick={() => toggleFactor(drainingFactors, setDrainingFactors, factor)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                            active
                              ? "border-[#e05e43] bg-[#e05e43] text-white"
                              : "border-[#f8cfc6] bg-white text-[#b83d24] hover:bg-[#fdedea]"
                          }`}
                        >
                          {factor}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Final Verdict Callout */}
            <div className="mt-8 rounded-2xl border border-[#cfd8ef] bg-[#e8edff] p-6">
              <div className="flex items-start gap-4">
                <Award size={28} className="mt-1 text-[#223b83] shrink-0" />
                <div>
                  <h4 className="font-bold text-[#223b83]">Simulator Takeaway for {activeScenario.roleTitle}</h4>
                  <p className="mt-1 text-sm leading-6 text-[#334b80]">
                    You demonstrated natural instincts as {activeScenario.archetype}. Your balanced approach between
                    rigor ({scoreSummary.craft}%) and stakeholder trust ({scoreSummary.trust}%) shows great promise for
                    this career trajectory.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href="/skills"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#223b83] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#1a2f6b]"
                    >
                      Audit your skills for this career <ArrowRight size={14} />
                    </Link>
                    <Link
                      href="/learning"
                      className="inline-flex items-center gap-2 rounded-xl border border-[#cad5f2] bg-white px-4 py-2.5 text-xs font-bold text-[#223b83] hover:bg-[#f0f2ed]"
                    >
                      Review learning plan
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
