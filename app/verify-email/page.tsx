import Link from "next/link";
import { VerifyEmailForm } from "../components/verify-email-form";

export default function VerifyEmailPage() {
  return <main className="min-h-screen bg-[#f7f8f5] px-6 pt-10 text-[#182032]"><div className="mx-auto max-w-md"><Link href="/" className="mb-12 flex justify-center text-lg font-bold">career<span className="text-[#e05e43]">X</span></Link><div className="rounded-3xl border border-[#e3e6df] bg-white p-8 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e05e43]">CareerX verification</p><h1 className="display-font mt-3 text-4xl">Verify your email</h1><p className="mt-3 text-sm leading-6 text-[#667085]">Check your inbox and click the verification link to activate your CareerX account.</p><VerifyEmailForm /></div></div></main>;
}