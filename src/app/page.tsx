import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout";
import { HomePage } from "./HomePage";
import { transformPostsWithAuthor, calculatePostScores, getTopPostIds } from "@/lib/utils";
import { POSTS_SELECT } from "@/lib/services";
import type { SupabasePostResponse } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const [
    { data: { user } },
    { data: posts },
    { data: weeklyTopic },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("posts")
      .select(POSTS_SELECT)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("weekly_topics")
      .select("*")
      .eq("is_active", true)
      .lte("week_start", today)
      .gte("week_end", today)
      .single(),
  ]);

  let profile: { username: string | null; avatar_url: string | null } | null = null;
  let userKeywords: string[] = [];
  let recommendedPosts: SupabasePostResponse[] | null = null;

  if (user) {
    const [profileResult, keywordsResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.id)
        .single(),
      supabase
        .from("user_keywords")
        .select("keyword, weight")
        .eq("user_id", user.id)
        .order("weight", { ascending: false })
        .limit(10),
    ]);

    profile = profileResult.data as { username: string | null; avatar_url: string | null } | null;
    
    const typedKeywords = (keywordsResult.data as Array<{ keyword: string; weight: number }> | null) || [];
    userKeywords = typedKeywords.map((k) => k.keyword);

    if (userKeywords.length > 0) {
      const userKeywordWeights = new Map(typedKeywords.map((k) => [k.keyword, k.weight]));

      const { data: postKeywords } = await supabase
        .from("post_keywords")
        .select("post_id, keyword, relevance")
        .in("keyword", userKeywords);

      const typedPostKeywords = (postKeywords as Array<{ post_id: string; keyword: string; relevance: number }> | null) || [];

      if (typedPostKeywords.length > 0) {
        const postScores = calculatePostScores(typedPostKeywords, userKeywordWeights);
        const sortedPostIds = getTopPostIds(postScores, 5);

        if (sortedPostIds.length > 0) {
          const { data: recPosts } = await supabase
            .from("posts")
            .select(POSTS_SELECT)
            .in("id", sortedPostIds)
            .eq("is_deleted", false);

          const postIdIndexMap = new Map(sortedPostIds.map((id, index) => [id, index]));
          const typedRecPosts = (recPosts as SupabasePostResponse[] | null) || [];
          
          recommendedPosts = new Array(typedRecPosts.length);
          for (const post of typedRecPosts) {
            const index = postIdIndexMap.get(post.id);
            if (index !== undefined) {
              recommendedPosts[index] = post;
            }
          }
          recommendedPosts = recommendedPosts.filter(Boolean);
        }
      }
    }
  }

  return (
    <>
      <Navbar 
        user={user} 
        username={profile?.username} 
        avatarUrl={profile?.avatar_url}
      />
      <HomePage 
        initialPosts={transformPostsWithAuthor(posts as SupabasePostResponse[] | null)}
        initialWeeklyTopic={weeklyTopic}
        initialRecommendedPosts={transformPostsWithAuthor(recommendedPosts as SupabasePostResponse[] | null)}
        initialUserKeywords={userKeywords}
        isLoggedIn={!!user}
        currentUserId={user?.id}
      />
    </>
  );
}
