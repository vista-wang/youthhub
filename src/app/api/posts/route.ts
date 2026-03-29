import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transformPostsWithAuthor } from "@/lib/utils";

export const revalidate = 60;

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: posts, error } = await supabase
      .from("posts")
      .select(`
        id,
        title,
        content,
        likes_count,
        comments_count,
        created_at,
        updated_at,
        author_id,
        profiles:author_id (
          username,
          avatar_url
        )
      `)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Fetch posts error:", error);
      return NextResponse.json(
        { error: "获取帖子列表失败" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { posts: transformPostsWithAuthor(posts) },
      { 
        headers: { 
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" 
        } 
      }
    );
  } catch (error) {
    console.error("Fetch posts error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
    const { title, content } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "标题不能为空" },
        { status: 400 }
      );
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "内容不能为空" },
        { status: 400 }
      );
    }

    if (title.length > 100) {
      return NextResponse.json(
        { error: "标题不能超过100个字符" },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: "内容不能超过5000个字符" },
        { status: 400 }
      );
    }

    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        author_id: user.id,
        title: title.trim(),
        content: content.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error("Create post error:", error);
      return NextResponse.json(
        { error: "发帖失败，请稍后重试" },
        { status: 500 }
      );
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
