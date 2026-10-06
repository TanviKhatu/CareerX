"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function VerifyEmailForm() {
  const router = useRouter();
  const [email, setEmail] = useState(""); const [phone, setPhone] = useState(""); const [code, setCode] = useState("");
  const [emailVerified, setEmailVerified] = useState(false); const [phoneVerified, setPhoneVerified] = useState(false); const [codeSent, setCodeSent] = useState(false); const [loading, setLoading] = useState(true); const [submitting, setSubmitting] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");

  const refreshUser = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) { setError("Supabase is not configured. Add the project values to .env.local."); setLoading(false); return; }
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) { const pendingEmail = new URLSearchParams(window.location.search).get("email"); if (pendingEmail) { setEmail(pendingEmail); setLoading(false); return; } setError("Please log in to continue verification."); setLoading(false); return; }
    setEmail(user.email ?? ""); setPhone(user.phone ?? user.user_metadata?.phone ?? ""); setEmailVerified(Boolean(user.email_confirmed_at)); setPhoneVerified(Boolean(user.phone_confirmed_at)); setLoading(false);
    if (user.email_confirmed_at) router.replace("/dashboard");
  }, [router]);

  useEffect(() => { void Promise.resolve().then(() => refreshUser()); }, [refreshUser]);

  async function resendEmail() { const supabase = createClient(); if (!supabase || !email) return; setSubmitting(true); setError(""); setMessage(""); const { error: resendError } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${window.location.origin}/verify-email` } }); setSubmitting(false); if (resendError) setError("Too many verification emails have been requested. Please wait and try again later."); else setMessage("A new verification email has been sent. Check your inbox and spam folder."); }

  async function sendPhoneCode(event: FormEvent) { event.preventDefault(); const supabase = createClient(); if (!supabase || !phone.trim()) { setError("Enter the phone number you want to verify, or continue without phone verification."); return; } setSubmitting(true); setError(""); setMessage(""); const { error: updateError } = await supabase.auth.updateUser({ phone: phone.trim() }); setSubmitting(false); if (updateError) { console.error("CareerX phone verification error:", updateError); setMessage("Phone verification is currently unavailable. You can continue using CareerX with email verification."); return; } setCodeSent(true); setMessage("A verification code was sent by SMS. Enter it below, or continue using CareerX with email verification."); }

  async function verifyPhone(event: FormEvent) { event.preventDefault(); const supabase = createClient(); if (!supabase || code.trim().length < 4) { setError("Enter the verification code from your SMS."); return; } setSubmitting(true); setError(""); const { error: verifyError } = await supabase.auth.verifyOtp({ phone: phone.trim(), token: code.trim(), type: "phone_change" }); setSubmitting(false); if (verifyError) { console.error("CareerX phone OTP error:", verifyError); setMessage("Phone verification is currently unavailable. You can continue using CareerX with email verification."); return; } setMessage("Phone verified successfully."); await refreshUser(); router.refresh(); }

  async function logout() { const supabase = createClient(); if (supabase) await supabase.auth.signOut(); router.replace("/login"); }

  if (loading) return <p className="mt-8 text-sm text-[#667085]">Checking your verification status...</p>;
  return <div className="mt-8 space-y-6"><div className="rounded-2xl border border-[#e3e6df] bg-[#f7f8f5] p-4 text-sm"><div className="flex items-center justify-between"><span>Email verification</span><strong className={emailVerified ? "text-[#25805c]" : "text-[#a13d28]"}>{emailVerified ? "Verified" : "Waiting"}</strong></div><p className="mt-1 text-xs text-[#8b93a2]">{email || "Your email address"}</p></div>{!emailVerified && <><p className="text-sm leading-6 text-[#667085]">Check your inbox and click the verification link to activate your CareerX account. If it has not arrived, check spam or resend it.</p><button type="button" onClick={resendEmail} disabled={submitting} className="w-full rounded-xl bg-[#223b83] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{submitting ? "Sending..." : "Resend verification email"}</button></>}{emailVerified && !phoneVerified && <><div className="rounded-2xl border border-[#e3e6df] bg-[#f7f8f5] p-4 text-sm"><div className="flex items-center justify-between"><span>Phone verification</span><strong className="text-[#667085]">Optional</strong></div><p className="mt-1 text-xs text-[#8b93a2]">Phone verification is optional. You can continue using CareerX with email verification.</p></div><form onSubmit={sendPhoneCode} className="space-y-3"><input className="auth-input" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone number (optional)" /><button disabled={submitting} className="w-full rounded-xl border border-[#223b83] px-4 py-3 text-sm font-bold text-[#223b83] disabled:opacity-60">{submitting ? "Sending..." : "Verify Phone"}</button></form>{codeSent && <form onSubmit={verifyPhone} className="space-y-3"><input className="auth-input" inputMode="numeric" value={code} onChange={(event) => setCode(event.target.value)} placeholder="SMS verification code" required /><button disabled={submitting} className="w-full rounded-xl bg-[#223b83] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{submitting ? "Verifying..." : "Verify phone"}</button></form>}<p className="text-xs leading-5 text-[#8b93a2]">Phone verification is optional and uses Supabase Auth SMS when configured.</p></>}{error && <p role="alert" className="rounded-xl bg-[#fff0eb] px-4 py-3 text-sm text-[#a13d28]">{error}</p>}{message && <p role="status" className="rounded-xl bg-[#e3f2ec] px-4 py-3 text-sm text-[#25805c]">{message}</p>}<div className="flex items-center justify-between text-xs font-bold"><Link href="/login" className="text-[#223b83]">Back to Login</Link><button type="button" onClick={logout} className="text-[#a13d28]">Logout</button></div></div>;
}
