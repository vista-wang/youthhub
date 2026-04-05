import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout";
import { HomePage } from "./HomePage";
import { transformPostsWithAuthor, calculatePostScores, getTopPostIds } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const now = new Date().toISOString();

  const [
    { data: { user } },
    { data: posts },
    { data: announcements },
    { data: weeklyTopic },
    { data: hotPosts },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
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
      .limit(20),
    supabase
      .from("announcements")
      .select("*")
      .eq("is_active", true)
      .or(`start_at.is.null,start_at.lte.${now}`)
      .or(`end_at.is.null,end_at.gte.${now}`)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("weekly_topics")
      .select("*")
      .eq("is_active", true)
      .lte("week_start", today)
      .gte("week_end", today)
      .single(),
    supabase
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
      .limit(5),
  ]);

  let profile: { username: string | null; avatar_url: string | null } | null = null;
  let userKeywords: string[] = [];
  let recommendedPosts: any[] | null = null;

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

          const postIdIndexMap = new Map(sortedPostIds.map((id, index) => [id, index]));
          const typedRecPosts = (recPosts as any[] | null) || [];
          
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
        initialPosts={transformPostsWithAuthor(posts as any[] | null)}
        initialAnnouncements={(announcements as any[]) || []}
        initialWeeklyTopic={weeklyTopic}
        initialHotPosts={transformPostsWithAuthor(hotPosts as any[] | null)}
        initialRecommendedPosts={transformPostsWithAuthor(recommendedPosts as any[] | null)}
        initialUserKeywords={userKeywords}
        isLoggedIn={!!user}
        currentUserId={user?.id}
      />
    </>
  );
}
