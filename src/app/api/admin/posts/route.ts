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
    const includeDeleted = searchParams.get("include_deleted") === "true";

    const offset = (page - 1) * limit;

    let query = supabase
      .from("posts")
      .select(`
        id,
        title,
        content,
        likes_count,
        comments_count,
        is_deleted,
        created_at,
        author_id,
        profiles:author_id (
          username,
          avatar_url
        )
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (!includeDeleted) {
      query = query.eq("is_deleted", false);
    }

    const { data: posts, error } = await query;

    if (error) {
      return NextResponse.json({ error: "获取帖子失败" }, { status: 500 });
    }

    const { count } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      posts: posts?.map((post) => ({
        ...post,
        author_name: post.profiles?.username || "匿名用户",
        author_avatar: post.profiles?.avatar_url || null,
      })),
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await checkAdminPermission();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase, userId } = auth;

    const body = await request.json();
    const { postId, reason } = body;

    if (!postId) {
      return NextResponse.json({ error: "帖子ID不能为空" }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("posts")
      .update({ is_deleted: true })
      .eq("id", postId);

    if (updateError) {
      return NextResponse.json({ error: "删除帖子失败" }, { status: 500 });
    }

    await supabase.from("admin_logs").insert({
      admin_id: userId,
      action: "delete_post",
      target_type: "post",
      target_id: postId,
      details: { reason },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await checkAdminPermission();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase, userId } = auth;

    const body = await request.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json({ error: "帖子ID不能为空" }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("posts")
      .update({ is_deleted: false })
      .eq("id", postId);

    if (updateError) {
      return NextResponse.json({ error: "恢复帖子失败" }, { status: 500 });
    }

    await supabase.from("admin_logs").insert({
      admin_id: userId,
      action: "restore_post",
      target_type: "post",
      target_id: postId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
