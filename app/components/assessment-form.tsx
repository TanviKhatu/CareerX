"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { assessmentQuestions } from "@/lib/assessment";

export function AssessmentForm() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [writtenAnswers, setWrittenAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [startedAt] = useState(() => new Date().toISOString());
  const question = assessmentQuestions[current];
  const selected = answers[question.id];
  const writtenAnswer = writtenAnswers[question.id] ?? "";

  function choose(value: number) {
    setAnswers((previous) => ({ ...previous, [question.id]: value }));
    setError("");
  }

  function writeAnswer(value: string) {
    setWrittenAnswers((previous) => ({ ...previous, [question.id]: value }));
  }

  async function submit() {
    if (Object.keys(answers).length !== assessmentQuestions.length) {
      setError("Please answer every question before submitting.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/assessment/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, writtenAnswers, startedAt }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string; attemptId?: string | null } | null;
      if (!response.ok) {
        setError(payload?.error ?? "We could not save your assessment. Please try again.");
        setLoading(false);
        return;
      }
      setLoading(false);
      router.push(payload?.attemptId ? `/assessment/results?attempt=${payload.attemptId}` : "/assessment/results");
      router.refresh();
    } catch {
      setError("We could not save your assessment. Please try again.");
      setLoading(false);
    }
  }

  return <div className="mx-auto max-w-3xl"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e05e43]">Career assessment</p><h1 className="display-font mt-2 text-4xl tracking-tight">Find your direction.</h1></div><span className="text-sm font-bold text-[#667085]">Question {current + 1} of {assessmentQuestions.length}</span></div><div className="mt-7 h-2 rounded-full bg-[#e8ebf0]"><div className="h-2 rounded-full bg-[#e05e43] transition-all" style={{ width: `${((current + 1) / assessmentQuestions.length) * 100}%` }} /></div><section className="mt-8 rounded-3xl border border-[#e3e6df] bg-white p-6 shadow-sm sm:p-10"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#223b83]">{question.category}</p><h2 className="display-font mt-5 text-3xl leading-tight">{question.prompt}</h2><div className="mt-8 space-y-3">{question.options.map((option, index) => <button type="button" key={option.label} onClick={() => choose(index)} className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left text-sm font-bold transition ${selected === index ? "border-[#223b83] bg-[#e8edff] text-[#223b83]" : "border-[#e3e6df] hover:border-[#223b83]"}`}><span className={`flex h-5 w-5 items-center justify-center rounded-full border ${selected === index ? "border-[#223b83] bg-[#223b83]" : "border-[#b6bdc8]"}`}>{selected === index && <span className="h-2 w-2 rounded-full bg-white" />}</span>{option.label}</button>)}</div><div className="mt-8"><label htmlFor={`written-${question.id}`} className="text-sm font-bold text-[#182032]">Your response <span className="font-normal text-[#8b93a2]">(optional)</span></label><p className="mt-1 text-xs text-[#667085]">Add context or explain what you would do in this situation.</p><textarea id={`written-${question.id}`} value={writtenAnswer} onChange={(event) => writeAnswer(event.target.value)} maxLength={1200} rows={5} placeholder="Write your thoughts here..." className="mt-3 min-h-32 w-full resize-y rounded-xl border border-[#dfe3dc] bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-[#223b83] focus:ring-2 focus:ring-[#223b83]/10" /><p className="mt-1 text-right text-xs text-[#8b93a2]">{writtenAnswer.length}/1200 · Your written response does not affect your score.</p></div>{error && <p role="alert" className="mt-5 rounded-xl bg-[#fff0eb] px-4 py-3 text-sm text-[#a13d28]">{error}</p>}<div className="mt-8 flex items-center justify-between"><button type="button" disabled={current === 0} onClick={() => setCurrent((value) => value - 1)} className="rounded-xl border border-[#dfe3dc] px-4 py-2.5 text-sm font-bold text-[#667085] disabled:opacity-40">Previous</button>{current < assessmentQuestions.length - 1 ? <button type="button" onClick={() => selected === undefined ? setError("Choose an answer to continue.") : setCurrent((value) => value + 1)} className="rounded-xl bg-[#223b83] px-5 py-2.5 text-sm font-bold text-white">Next</button> : <button type="button" disabled={loading} onClick={submit} className="rounded-xl bg-[#e05e43] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{loading ? "Saving..." : "Submit assessment"}</button>}</div></section><p className="mt-5 text-center text-xs text-[#8b93a2]">Your answers are saved to your private CareerX account. <Link href="/profile" className="font-bold text-[#223b83]">Update your profile</Link></p></div>;
}
