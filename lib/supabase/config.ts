const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseUrl = configuredUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
