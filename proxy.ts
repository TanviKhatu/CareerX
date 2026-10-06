import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

const protectedPaths = ["/dashboard", "/profile", "/assessment", "/careers", "/compare", "/skills", "/learning", "/roadmap", "/simulator", "/counselor", "/mock-interview", "/resume", "/report", "/ai-learning", "/settings"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const isProtected = protectedPaths.some((path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`));
  const isAuthPage = request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register" || request.nextUrl.pathname === "/verify-email";
  if (!isProtected && !isAuthPage) return response;
  if (!supabaseUrl || !supabaseAnonKey) {
    if (isProtected) return NextResponse.redirect(new URL("/login?reason=setup", request.url));
    return response;
  }
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, { cookies: { getAll: () => request.cookies.getAll(), setAll: (cookiesToSet) => { cookiesToSet.forEach(({ name, value, options }) => { request.cookies.set(name, value); response = NextResponse.next({ request }); response.cookies.set(name, value, options); }); } } });
  const { data: { user } } = await supabase.auth.getUser();
  const isEmailVerified = Boolean(user?.email_confirmed_at);
  if (isProtected && !isEmailVerified) return NextResponse.redirect(new URL(user ? "/verify-email" : "/login", request.url));
  if (isAuthPage && user && !isEmailVerified && request.nextUrl.pathname !== "/verify-email") return NextResponse.redirect(new URL("/verify-email", request.url));
  if (isAuthPage && user && isEmailVerified) return NextResponse.redirect(new URL("/dashboard", request.url));
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
