import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { PlatformShell } from "../../../components/platform-shell";
import { getCareer, type Career } from "@/lib/careers";
import { redirect } from "next/navigation";

type SearchParams = Record<string, string | string[] | undefined>;

function getSingleParam(params: SearchParams, key: string): string | null {
  const value = params[key];
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] ?? null : null;
}

function getScore(value: string | null): number | null {
  if (!value || !/^\d{1,3}$/.test(value)) return null;
  const score = Number(value);
  return score >= 0 && score <= 100 ? score : null;
}

function ComparisonDetail({ title, values }: { title: string; values: string[] }) {
  return (
    <div className="mt-6 border-t border-[#eef0ec] pt-5">
      <h3 className="text-sm font-bold">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-5 text-[#667085]">
        {values.map((value) => (
          <li key={value} className="flex gap-2">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#48a582]" />
            {value}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CareerColumn({ career, score }: { career: Career; score: number }) {
  return (
    <article className="rounded-2xl border border-[#e3e6df] bg-white p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#e05e43]">{career.category}</p>
          <h2 className="mt-2 text-2xl font-bold">{career.name}</h2>
        </div>
        <span className="shrink-0 rounded-full bg-[#e3f2ec] px-3 py-1.5 text-sm font-bold text-[#25805c]">{score}% match</span>
      </div>
      <p className="mt-5 text-sm leading-6 text-[#667085]">{career.description}</p>
      <ComparisonDetail title="Education pathway" values={[career.education]} />
      <ComparisonDetail title="Key skills" values={career.skills} />
      <ComparisonDetail title="Work environment and roles" values={[career.environment, ...career.opportunities]} />
      <ComparisonDetail title="Recommended subjects" values={career.subjects} />
      <Link href={`/careers/${career.slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#223b83]">
        Explore {career.name} <ArrowRight size={15} />
      </Link>
    </article>
  );
}

export default async function TopCareersComparisonPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const first = getCareer(getSingleParam(params, "first") ?? "");
  const second = getCareer(getSingleParam(params, "second") ?? "");
  const firstScore = getScore(getSingleParam(params, "firstScore"));
  const secondScore = getScore(getSingleParam(params, "secondScore"));

  if (!first || !second || first.slug === second.slug || firstScore === null || secondScore === null) {
    redirect("/assessment/results");
  }

  return (
    <PlatformShell>
      <Link href="/assessment/results" className="inline-flex items-center gap-2 text-sm font-bold text-[#223b83]">
        <ArrowLeft size={15} /> Back to assessment results
      </Link>
      <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-[#e05e43]">Your top career matches</p>
      <h1 className="display-font mt-2 text-4xl tracking-tight sm:text-5xl">Explore your top 2 careers.</h1>
      <p className="mt-3 max-w-2xl text-[#667085]">Compare their match scores, education pathways, skills, work environments, opportunities, and recommended subjects.</p>
      <section aria-label="Top two career comparison" className="mt-8 grid gap-4 lg:grid-cols-2">
        <CareerColumn career={first} score={firstScore} />
        <CareerColumn career={second} score={secondScore} />
      </section>
    </PlatformShell>
  );
}
