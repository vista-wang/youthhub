import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transformPostsWithAuthor, calculatePostScores, getTopPostIds } from "@/lib/utils";

export const revalidate = 60;

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

    const typedUserKeywords = userKeywords as Array<{ keyword: string; weight: number }>;
    const userKeywordWeights = new Map(typedUserKeywords.map((k) => [k.keyword, k.weight]));
    const keywords = Array.from(userKeywordWeights.keys());

    const { data: postKeywords } = await supabase
      .from("post_keywords")
      .select("post_id, keyword, relevance")
      .in("keyword", keywords);

    if (!postKeywords || postKeywords.length === 0) {
      return NextResponse.json({ posts: [], reason: "no_matching_posts" });
    }

    const postScores = calculatePostScores(postKeywords, userKeywordWeights);
    const sortedPostIds = getTopPostIds(postScores, 10);

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

    const postIdIndexMap = new Map(sortedPostIds.map((id, index) => [id, index]));
    const typedPosts = (posts as any[] | null) || [];
    
    const sortedPosts = new Array(typedPosts.length);
    for (const post of typedPosts) {
      const index = postIdIndexMap.get(post.id);
      if (index !== undefined) {
        sortedPosts[index] = post;
      }
    }

    return NextResponse.json({ 
      posts: transformPostsWithAuthor(sortedPosts.filter(Boolean)),
      keywords: keywords.slice(0, 5)
    }, {
      headers: {
        "Cache-Control": "private, s-maxage=60, stale-while-revalidate=120"
      }
    });
  } catch (error) {
    console.error("Recommend posts error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
