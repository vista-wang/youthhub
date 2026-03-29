import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transformCommentsWithAuthor } from "@/lib/utils";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: comments, error } = await supabase
      .from("comments")
      .select(`
        id,
        post_id,
        parent_id,
        content,
        likes_count,
        created_at,
        updated_at,
        author_id,
        profiles:author_id (
          username,
          avatar_url
        )
      `)
      .eq("post_id", id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "获取评论失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({ comments: transformCommentsWithAuthor(comments) });
  } catch (error) {
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content, parent_id } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "评论内容不能为空" },
        { status: 400 }
      );
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: "评论内容不能超过500个字符" },
        { status: 400 }
      );
    }

    const { data: post } = await supabase
      .from("posts")
      .select("id")
      .eq("id", id)
      .eq("is_deleted", false)
      .single();

    if (!post) {
      return NextResponse.json(
        { error: "帖子不存在" },
        { status: 404 }
      );
    }

    const { data: comment, error } = await supabase
      .from("comments")
      .insert({
        post_id: id,
        author_id: user.id,
        parent_id: parent_id || null,
        content: content.trim(),
      })
      .select(`
        id,
        post_id,
        parent_id,
        content,
        likes_count,
        created_at,
        updated_at,
        author_id
      `)
      .single();

    if (error) {
      console.error("Create comment error:", error);
      return NextResponse.json(
        { error: "评论发表失败" },
        { status: 500 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      comment: {
        ...comment,
        author_name: profile?.username || "匿名用户",
        author_avatar: profile?.avatar_url || null,
      },
    });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
