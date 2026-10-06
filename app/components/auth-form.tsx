"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const levels = ["School", "Undergraduate", "Graduate", "Postgraduate"];
const streams = ["Science", "Commerce", "Arts/Humanities", "Engineering", "Medical", "Computer/IT", "Law", "Management", "Other"];

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const supabase = createClient();
    if (!supabase) { setError("Supabase is not configured yet. Add the values in .env.local, then restart the dev server."); return; }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) { setError("Please enter a valid email address."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (mode === "register") {
      const confirm = String(form.get("confirmPassword") ?? "");
      if (!String(form.get("fullName") ?? "").trim()) { setError("Please enter your full name."); return; }
      if (password !== confirm) { setError("Passwords do not match."); return; }
    }
    setLoading(true);
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/verify-email`, data: { full_name: form.get("fullName"), phone: form.get("phone"), education_level: form.get("educationLevel"), stream: form.get("stream") } } });
    setLoading(false);
    if (result.error) {
      console.error("CareerX Supabase auth error:", result.error);
      if (mode === "login" && result.error.message.toLowerCase().includes("email not confirmed")) { router.push(`/verify-email?email=${encodeURIComponent(email)}`); return; }
      setError(mode === "login" ? "That email or password is not correct." : getRegistrationError(result.error.message));
      return;
    }
    if (mode === "register") {
      if (result.data.session && !result.data.user?.email_confirmed_at) await supabase.auth.signOut();
      setMessage("Registration started. Please check your email and verify your email address to activate your CareerX account.");
      return;
    }
    if (!result.data.user?.email_confirmed_at) { router.push("/verify-email"); router.refresh(); return; }
    router.push("/dashboard");
    router.refresh();
  }

  async function forgotPassword() {
    const supabase = createClient();
    const email = window.prompt("Enter your CareerX email address");
    if (!supabase || !email) return;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` });
    setError(resetError ? "We could not send the reset email. Check the address and try again." : "Password reset instructions are on their way.");
  }

  return <form onSubmit={submit} className="mt-8 space-y-4">
    {mode === "register" && <>
      <input name="fullName" required className="auth-input" placeholder="Full name" />
      <input name="phone" className="auth-input" placeholder="Phone number (optional)" type="tel" />
      <div className="grid grid-cols-2 gap-3"><select name="educationLevel" required className="auth-input"><option value="">Education level</option>{levels.map((item) => <option key={item}>{item}</option>)}</select><select name="stream" required className="auth-input"><option value="">Stream</option>{streams.map((item) => <option key={item}>{item}</option>)}</select></div>
      <p className="rounded-xl bg-[#e8edff] px-4 py-3 text-xs leading-5 text-[#4663b0]">Verify your email to activate your CareerX account. Phone verification is optional.</p>
    </>}
    <input name="email" required className="auth-input" placeholder="Email address" type="email" />
    <input name="password" required className="auth-input" placeholder="Password (8+ characters)" type="password" />
    {mode === "register" && <input name="confirmPassword" required className="auth-input" placeholder="Confirm password" type="password" />}
    <button disabled={loading} className="w-full rounded-xl bg-[#223b83] px-4 py-3 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60">{loading ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}</button>
    {mode === "login" && <button type="button" onClick={forgotPassword} className="w-full text-center text-xs font-bold text-[#223b83]">Forgot password?</button>}
    {error && <p role="alert" className="rounded-xl bg-[#fff0eb] px-4 py-3 text-sm text-[#a13d28]">{error}</p>}
    {message && <p role="status" className="rounded-xl bg-[#e3f2ec] px-4 py-3 text-sm text-[#25805c]">{message}</p>}
    {mode === "register" && message && <><p className="text-sm leading-6 text-[#667085]">Your account is not active yet. We have sent a verification link to the email address you provided. After verifying your email, phone verification remains optional.</p><p className="text-sm leading-6 text-[#667085]">Didn&apos;t receive the email? Check your spam/junk folder or use Resend Verification Email.</p></>}
    <p className="text-center text-xs text-[#8b93a2]">{mode === "login" ? <>New here? <Link className="font-bold text-[#223b83]" href="/register">Create an account</Link></> : <>Already registered? <Link className="font-bold text-[#223b83]" href="/login">Log in</Link></>}</p>
  </form>;
}

function getRegistrationError(message: string) { if (process.env.NODE_ENV === "development") return `Supabase registration failed: ${message}`; const normalized = message.toLowerCase(); if (normalized.includes("already") || normalized.includes("registered")) return "We could not create the account with those details. Please try again or use the login page."; if (normalized.includes("password")) return "Your password does not meet the requirements."; return "We could not create your account. Please try again."; }
