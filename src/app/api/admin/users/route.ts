import { NextRequest, NextResponse } from "next/server";
import { checkAdminPermission } from "@/lib/auth/admin";

export async function GET(request: NextRequest) {
  try {
    const auth = await checkAdminPermission();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase } = auth;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";

    const offset = (page - 1) * limit;

    let query = supabase
      .from("profiles")
      .select("id, username, avatar_url, bio, role, is_banned, ban_reason, banned_at, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.ilike("username", `%${search}%`);
    }

    const { data: users, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: "获取用户列表失败" }, { status: 500 });
    }

    return NextResponse.json({
      users,
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await checkAdminPermission();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase, userId } = auth;

    const body = await request.json();
    const { userId: targetUserId, action, reason } = body;

    if (!targetUserId || !action) {
      return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    }

    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", targetUserId)
      .single();

    if (targetProfile?.role === "admin") {
      return NextResponse.json({ error: "无法封禁管理员" }, { status: 400 });
    }

    if (action === "ban") {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          is_banned: true,
          ban_reason: reason || null,
          banned_at: new Date().toISOString(),
        })
        .eq("id", targetUserId);

      if (updateError) {
        return NextResponse.json({ error: "封禁用户失败" }, { status: 500 });
      }

      await supabase.from("admin_logs").insert({
        admin_id: userId,
        action: "ban_user",
        target_type: "user",
        target_id: targetUserId,
        details: { reason },
      });

      return NextResponse.json({ success: true, message: "用户已封禁" });
    }

    if (action === "unban") {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          is_banned: false,
          ban_reason: null,
          banned_at: null,
        })
        .eq("id", targetUserId);

      if (updateError) {
        return NextResponse.json({ error: "解封用户失败" }, { status: 500 });
      }

      await supabase.from("admin_logs").insert({
        admin_id: userId,
        action: "unban_user",
        target_type: "user",
        target_id: targetUserId,
      });

      return NextResponse.json({ success: true, message: "用户已解封" });
    }

    return NextResponse.json({ error: "未知操作" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
