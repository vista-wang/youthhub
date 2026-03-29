import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transformPostsWithAuthor } from "@/lib/utils";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ posts: [], reason: "not_logged_in" });
    }

    const { data: userKeywords } = await supabase
      .from("user_keywords")
      .select("keyword, weight")
      .eq("user_id", user.id)
      .order("weight", { ascending: false })
      .limit(10);

    if (!userKeywords || userKeywords.length === 0) {
      return NextResponse.json({ posts: [], reason: "no_keywords" });
    }

    const keywords = userKeywords.map((k) => k.keyword);

    const { data: postKeywords } = await supabase
      .from("post_keywords")
      .select("post_id, keyword, relevance")
      .in("keyword", keywords);

    if (!postKeywords || postKeywords.length === 0) {
      return NextResponse.json({ posts: [], reason: "no_matching_posts" });
    }

    const postScores: Record<string, number> = {};
    postKeywords.forEach((pk) => {
      const userKeyword = userKeywords.find((k) => k.keyword === pk.keyword);
      if (userKeyword) {
        postScores[pk.post_id] = (postScores[pk.post_id] || 0) + userKeyword.weight * pk.relevance;
      }
    });

    const sortedPostIds = Object.entries(postScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id);

    if (sortedPostIds.length === 0) {
      return NextResponse.json({ posts: [], reason: "no_matching_posts" });
    }

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
      .in("id", sortedPostIds)
      .eq("is_deleted", false);

    if (error) {
      return NextResponse.json(
        { error: "获取推荐帖子失败" },
        { status: 500 }
      );
    }

    const sortedPosts = sortedPostIds
      .map((id) => posts?.find((p) => p.id === id))
      .filter(Boolean);

    return NextResponse.json({ 
      posts: transformPostsWithAuthor(sortedPosts),
      keywords: keywords.slice(0, 5)
    });
  } catch (error) {
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
