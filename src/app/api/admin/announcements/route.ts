import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function checkAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false as const, error: "请先登录", status: 401 };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile as { role: string } | null)?.role;
  if (!profile || !["admin", "moderator"].includes(role)) {
    return { authorized: false as const, error: "权限不足", status: 403 };
  }

  return { authorized: true as const, supabase, userId: user.id };
}

export async function GET() {
  try {
    const auth = await checkAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase } = auth;

    const { data: announcements, error } = await supabase
      .from("announcements")
      .select("*")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "获取公告失败" }, { status: 500 });
    }

    return NextResponse.json({ announcements });
  } catch (error) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await checkAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase, userId } = auth;

    const body = await request.json();
    const { title, content, type, priority, is_active, start_at, end_at } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "标题和内容不能为空" }, { status: 400 });
    }

    const { data: announcement, error } = await supabase
      .from("announcements")
      .insert({
        title,
        content,
        type: type || "info",
        priority: priority || 0,
        is_active: is_active !== undefined ? is_active : true,
        start_at,
        end_at,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "创建公告失败" }, { status: 500 });
    }

    await supabase.from("admin_logs").insert({
      admin_id: userId,
      action: "create_announcement",
      target_type: "announcement",
      target_id: announcement.id,
      details: { title },
    });

    return NextResponse.json({ announcement });
  } catch (error) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await checkAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase, userId } = auth;

    const body = await request.json();
    const { id, title, content, type, priority, is_active, start_at, end_at } = body;

    if (!id) {
      return NextResponse.json({ error: "公告ID不能为空" }, { status: 400 });
    }

    const { data: announcement, error } = await supabase
      .from("announcements")
      .update({
        title,
        content,
        type,
        priority,
        is_active,
        start_at,
        end_at,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "更新公告失败" }, { status: 500 });
    }

    await supabase.from("admin_logs").insert({
      admin_id: userId,
      action: "update_announcement",
      target_type: "announcement",
      target_id: id,
      details: { title },
    });

    return NextResponse.json({ announcement });
  } catch (error) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await checkAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase, userId } = auth;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "公告ID不能为空" }, { status: 400 });
    }

    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "删除公告失败" }, { status: 500 });
    }

    await supabase.from("admin_logs").insert({
      admin_id: userId,
      action: "delete_announcement",
      target_type: "announcement",
      target_id: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
