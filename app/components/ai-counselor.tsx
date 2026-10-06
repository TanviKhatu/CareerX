"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowRight, ArrowUp, BookOpen, BrainCircuit, BriefcaseBusiness, CircleHelp, Compass, LoaderCircle, RotateCcw, Sparkles } from "lucide-react";
import type { CounselorCareerSummary } from "@/lib/counselor";

type CounselorCareer = Omit<CounselorCareerSummary, "careerSlug" | "careerName" | "score"> & { slug: string; name: string; score: number | null; reasons: string[] };
type Message = { id: number; role: "assistant" | "user"; text: string; careers: CounselorCareer[] };
type ApiReply = { text?: string; careers?: CounselorCareer[]; profileSignals?: string[]; error?: string };

const starters = [
  "What careers fit me best?",
  "I like technology and design",
  "How do I get started?",
  "Compare my top paths",
];

export function AICounselor({ initialMatches, initialSignals }: { initialMatches: CounselorCareerSummary[]; initialSignals: string[] }) {
  const [messages, setMessages] = useState<Message[]>(() => [{
    id: 0,
    role: "assistant",
    text: initialMatches.length
      ? "Hi, let's make sense of your options. I can see your latest career signals. Ask me about a path, compare options, or work out one next step."
      : "Hi, I'm here to help you explore what comes next. Tell me what you enjoy, what matters to you, or what feels hard to decide.",
    careers: [],
  }]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [profileSignals, setProfileSignals] = useState(initialSignals);
  const [activeCareerSlugs, setActiveCareerSlugs] = useState(initialMatches.map((career) => career.careerSlug));
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending]);

  async function sendQuestion(question: string) {
    const trimmed = question.trim();
    if (!trimmed || pending) return;
    setMessages((previous) => [...previous, { id: Date.now(), role: "user", text: trimmed, careers: [] }]);
    setDraft("");
    setPending(true);
    setError("");

    try {
      const response = await fetch("/api/counselor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, careerSlugs: activeCareerSlugs }),
      });
      const payload = await response.json() as ApiReply;
      if (!response.ok) throw new Error(payload.error ?? "I couldn't send that just now. Please try again.");
      const careers = Array.isArray(payload.careers) ? payload.careers : [];
      setMessages((previous) => [...previous, {
        id: Date.now() + 1,
        role: "assistant",
        text: payload.text ?? "Let's try that again with a little more detail.",
        careers,
      }]);
      setActiveCareerSlugs(careers.map((career) => career.slug));
      if (Array.isArray(payload.profileSignals)) setProfileSignals(payload.profileSignals);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "I couldn't send that just now. Please try again.");
    } finally {
      setPending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendQuestion(draft);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendQuestion(draft);
    }
  }

  function resetConversation() {
    setMessages([{ id: Date.now(), role: "assistant", text: "Fresh start. What's the career question on your mind?", careers: [] }]);
    setActiveCareerSlugs(initialMatches.map((career) => career.careerSlug));
    setError("");
  }

  return <div className="mx-auto max-w-6xl">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div className="max-w-2xl">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#e05e43]"><Sparkles size={14} /> Career guidance, grounded in your profile</p>
        <h1 className="display-font mt-3 text-4xl tracking-tight sm:text-5xl">Let&apos;s find your next step.</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#667085]">Ask about a career, a choice, or what to try next. We&apos;ll work from your saved signals and CareerX&apos;s career library.</p>
      </div>
      <button type="button" onClick={resetConversation} disabled={pending} title="Start a new conversation" aria-label="Start a new conversation" className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl border border-[#dfe3dc] bg-white px-3 text-sm font-bold text-[#223b83] transition hover:bg-[#f0f2ed] disabled:opacity-50 sm:self-auto"><RotateCcw size={15} /> New chat</button>
    </div>

    <div className="mt-8 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <section aria-label="Career counselor conversation" className="overflow-hidden rounded-2xl border border-[#e3e6df] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#e8ebe5] bg-[#fbfcfa] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e9edfb] text-[#223b83]"><BrainCircuit size={20} /></span>
            <div><p className="text-sm font-bold">CareerX counselor</p><p className="mt-0.5 text-xs text-[#788293]">A thoughtful place to sort through options</p></div>
          </div>
          <span className="hidden items-center gap-1.5 text-[11px] font-bold text-[#25805c] sm:flex"><span className="h-2 w-2 rounded-full bg-[#48a582]" /> Ready</span>
        </div>

        <div className="flex max-h-[min(64vh,660px)] min-h-[390px] flex-col overflow-y-auto px-4 py-5 sm:px-6 sm:py-6" aria-live="polite" aria-relevant="additions text">
          <div className="space-y-5">
            {messages.map((message) => <article key={message.id} className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
              <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${message.role === "assistant" ? "bg-[#e9edfb] text-[#223b83]" : "bg-[#fce9df] text-[#9d422e]"}`}>{message.role === "assistant" ? <BrainCircuit size={16} /> : <span className="text-xs font-extrabold">You</span>}</span>
              <div className={`min-w-0 max-w-[92%] sm:max-w-[86%] ${message.role === "user" ? "text-right" : ""}`}>
                <p className={`inline-block rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "assistant" ? "rounded-tl-sm bg-[#f5f6f2] text-[#344054]" : "rounded-tr-sm bg-[#223b83] text-white"}`}>{message.text}</p>
                {message.careers.length > 0 && <div className={`mt-3 grid gap-2 text-left ${message.careers.length > 1 ? "sm:grid-cols-2" : ""}`}>
                  {message.careers.map((career) => <CareerReplyCard key={career.slug} career={career} />)}
                </div>}
              </div>
            </article>)}
            {pending && <div className="flex items-center gap-3 text-sm text-[#667085]" role="status"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e9edfb] text-[#223b83]"><BrainCircuit size={16} /></span><span className="inline-flex items-center gap-2"><LoaderCircle size={14} className="animate-spin" /> Thinking through your question…</span></div>}
            <div ref={messageEndRef} />
          </div>
        </div>

        {messages.length === 1 && <div className="border-t border-[#edf0eb] px-4 py-4 sm:px-6">
          <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#8b93a2]"><Sparkles size={13} /> Try a question</p>
          <div className="flex flex-wrap gap-2">{starters.map((starter) => <button key={starter} type="button" disabled={pending} onClick={() => void sendQuestion(starter)} className="rounded-full border border-[#dfe3dc] bg-white px-3 py-2 text-xs font-semibold text-[#475467] transition hover:border-[#aab7df] hover:bg-[#f6f7fc] hover:text-[#223b83] disabled:opacity-50">{starter}</button>)}</div>
        </div>}

        <form onSubmit={handleSubmit} className="border-t border-[#e8ebe5] bg-[#fbfcfa] p-3 sm:p-4">
          {error && <p className="mb-2 rounded-lg bg-[#fff0eb] px-3 py-2 text-xs font-medium text-[#a13d28]" role="alert">{error}</p>}
          <div className="flex items-end gap-2 rounded-xl border border-[#dfe3dc] bg-white p-2 focus-within:border-[#8395d0] focus-within:ring-2 focus-within:ring-[#e9edfb]">
            <label htmlFor="counselor-question" className="sr-only">Ask your counselor</label>
            <textarea id="counselor-question" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleKeyDown} maxLength={500} rows={1} placeholder="Ask about a career, skill, or decision…" className="max-h-32 min-h-10 flex-1 resize-y bg-transparent px-2 py-2 text-sm leading-5 text-[#182032] outline-none placeholder:text-[#98a0ad]" />
            <button type="submit" disabled={!draft.trim() || pending} title="Send message" aria-label="Send message" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e05e43] text-white transition hover:bg-[#c84f37] disabled:cursor-not-allowed disabled:bg-[#d8dce3]"><ArrowUp size={19} /></button>
          </div>
          <div className="flex justify-between px-1 pt-2 text-[10px] text-[#9aa1ad]"><span>Career matches are a starting point, not a verdict.</span><span>{draft.length}/500</span></div>
        </form>
      </section>

      <aside className="space-y-4">
        <section className="rounded-2xl border border-[#e3e6df] bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-bold"><Compass size={16} className="text-[#e05e43]" /> Your starting point</h2>
            <Link href="/profile" title="Edit profile" aria-label="Edit profile" className="rounded-lg p-1.5 text-[#667085] transition hover:bg-[#f0f2ed] hover:text-[#223b83]"><ArrowRight size={15} /></Link>
          </div>
          {profileSignals.length ? <div className="mt-4 flex flex-wrap gap-1.5">{profileSignals.map((signal) => <span key={signal} className="rounded-md bg-[#f1f3ef] px-2 py-1 text-[11px] font-semibold text-[#667085]">{signal.replaceAll("_", " ")}</span>)}</div> : <div className="mt-4 rounded-xl bg-[#f7f8f5] p-3"><p className="text-xs leading-5 text-[#667085]">Add your interests and strengths so guidance can reflect what matters to you.</p><Link href="/profile" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#223b83]">Complete your profile <ArrowRight size={13} /></Link></div>}
        </section>

        <section className="rounded-2xl border border-[#e3e6df] bg-white p-5">
          <div className="flex items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-sm font-bold"><BriefcaseBusiness size={16} className="text-[#e05e43]" /> Paths to explore</h2><span className="text-[10px] font-semibold text-[#8b93a2]">From your latest signals</span></div>
          {initialMatches.length ? <div className="mt-4 divide-y divide-[#edf0eb]">{initialMatches.map((career) => <div key={career.careerSlug} className="py-3 first:pt-0 last:pb-0">
            <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-bold">{career.careerName}</p><p className="mt-0.5 text-[11px] text-[#8b93a2]">{career.category}</p></div><span className="shrink-0 rounded-md bg-[#e3f2ec] px-2 py-1 text-[11px] font-bold text-[#25805c]">{career.score}%</span></div>
            {career.reasons[0] && <p className="mt-2 text-xs leading-5 text-[#667085]">{career.reasons[0]}</p>}
            <Link href={`/careers/${career.careerSlug}`} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#223b83]">Explore path <ArrowRight size={12} /></Link>
          </div>)}</div> : <div className="mt-4 rounded-xl bg-[#f7f8f5] p-3"><p className="text-xs leading-5 text-[#667085]">Complete the career assessment to see your strongest matches here.</p><Link href="/assessment" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#223b83]">Start assessment <ArrowRight size={13} /></Link></div>}
          <p className="mt-4 flex gap-2 border-t border-[#edf0eb] pt-3 text-[10px] leading-4 text-[#8b93a2]"><CircleHelp size={13} className="mt-0.5 shrink-0" /> Matches are based on the information you&apos;ve shared, not a prediction of your future.</p>
        </section>

        <Link href="/careers" className="flex items-center justify-between rounded-xl border border-[#e3e6df] bg-[#fff9e9] px-4 py-3 text-xs font-bold text-[#6f5925] transition hover:bg-[#fff4d2]"><span className="flex items-center gap-2"><BookOpen size={15} /> Browse the career library</span><ArrowRight size={14} /></Link>
      </aside>
    </div>
  </div>;
}

function CareerReplyCard({ career }: { career: CounselorCareer }) {
  return <article className="rounded-xl border border-[#e3e6df] bg-white p-4">
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#e05e43]">{career.category}</p><h3 className="mt-1 text-sm font-bold leading-5 text-[#182032]">{career.name}</h3></div>{career.score !== null && <span className="shrink-0 rounded-md bg-[#e3f2ec] px-2 py-1 text-[10px] font-bold text-[#25805c]">{career.score}%</span>}</div>
    {career.reasons[0] && <p className="mt-2 text-xs leading-5 text-[#667085]">{career.reasons[0]}</p>}
    <p className="mt-3 text-[11px] leading-5 text-[#667085]">Skills: {career.skills.slice(0, 3).join(", ")}</p>
    <Link href={`/careers/${career.slug}`} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#223b83]">View career <ArrowRight size={12} /></Link>
  </article>;
}