import { createClient } from "@/lib/supabase/server";

type ProfileWithRole = {
  role: string;
};

type AuthResult = 
  | { authorized: true; supabase: Awaited<ReturnType<typeof createClient>>; userId: string }
  | { authorized: false; error: string; status: number };

export async function checkAdminPermission(): Promise<AuthResult> {
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

  if (!profile || !["admin", "moderator"].includes((profile as ProfileWithRole).role)) {
    return { authorized: false, error: "权限不足", status: 403 };
  }

  return { authorized: true, supabase, userId: user.id };
}
