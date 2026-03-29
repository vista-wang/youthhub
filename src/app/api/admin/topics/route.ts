import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "moderator"].includes(profile.role)) {
      return NextResponse.json({ error: "权限不足" }, { status: 403 });
    }

    const { data: topics, error } = await supabase
      .from("weekly_topics")
      .select("*")
      .order("week_start", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "获取话题失败" }, { status: 500 });
    }

    return NextResponse.json({ topics });
  } catch (error) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "moderator"].includes(profile.role)) {
      return NextResponse.json({ error: "权限不足" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, cover_image, week_start, week_end, is_active } = body;

    if (!title || !week_start || !week_end) {
      return NextResponse.json({ error: "标题、开始日期和结束日期不能为空" }, { status: 400 });
    }

    const { data: topic, error } = await supabase
      .from("weekly_topics")
      .insert({
        title,
        description,
        cover_image,
        week_start,
        week_end,
        is_active: is_active !== undefined ? is_active : true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "该时间段已存在话题" }, { status: 400 });
      }
      return NextResponse.json({ error: "创建话题失败" }, { status: 500 });
    }

    await supabase.from("admin_logs").insert({
      admin_id: user.id,
      action: "create_topic",
      target_type: "topic",
      target_id: topic.id,
      details: { title },
    });

    return NextResponse.json({ topic });
  } catch (error) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "moderator"].includes(profile.role)) {
      return NextResponse.json({ error: "权限不足" }, { status: 403 });
    }

    const body = await request.json();
    const { id, title, description, cover_image, week_start, week_end, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: "话题ID不能为空" }, { status: 400 });
    }

    const { data: topic, error } = await supabase
      .from("weekly_topics")
      .update({
        title,
        description,
        cover_image,
        week_start,
        week_end,
        is_active,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "更新话题失败" }, { status: 500 });
    }

    await supabase.from("admin_logs").insert({
      admin_id: user.id,
      action: "update_topic",
      target_type: "topic",
      target_id: id,
      details: { title },
    });

    return NextResponse.json({ topic });
  } catch (error) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "moderator"].includes(profile.role)) {
      return NextResponse.json({ error: "权限不足" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "话题ID不能为空" }, { status: 400 });
    }

    const { error } = await supabase
      .from("weekly_topics")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "删除话题失败" }, { status: 500 });
    }

    await supabase.from("admin_logs").insert({
      admin_id: user.id,
      action: "delete_topic",
      target_type: "topic",
      target_id: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
