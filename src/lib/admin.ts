import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

interface AdminAuthResult {
  authorized: true;
  supabase: SupabaseClient;
  userId: string;
}

interface AdminAuthError {
  authorized: false;
  error: string;
  status: number;
}

type AdminAuth = AdminAuthResult | AdminAuthError;

export async function requireAdmin(): Promise<AdminAuth> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false, error: "请先登录", status: 401 };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile as { role: string } | null)?.role || "";
  if (!profile || !["admin", "moderator"].includes(role)) {
    return { authorized: false, error: "权限不足", status: 403 };
  }

  return { authorized: true, supabase, userId: user.id };
}
