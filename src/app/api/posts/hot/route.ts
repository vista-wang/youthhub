import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transformPostsWithAuthor } from "@/lib/utils";

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
      .gte("likes_count", 10)
      .order("likes_count", { ascending: false })
      .order("comments_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json(
        { error: "获取热门帖子失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({ posts: transformPostsWithAuthor(posts) });
  } catch (error) {
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
