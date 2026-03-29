import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout";
import { HomePage } from "./HomePage";
import { transformPostsWithAuthor } from "@/lib/utils";

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
        profiles!posts_author_id_fkey (
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
        profiles!posts_author_id_fkey (
          username,
          avatar_url
        )
      `)
      .eq("is_deleted", false)
      .gte("likes_count", 10)
      .order("likes_count", { ascending: false })
      .limit(5),
  ]);

  let profile = null;
  let userKeywords: string[] = [];
  let recommendedPosts = null;

  if (user) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", user.id)
      .single();
    profile = profileData;

    const { data: keywordsData } = await supabase
      .from("user_keywords")
      .select("keyword, weight")
      .eq("user_id", user.id)
      .order("weight", { ascending: false })
      .limit(10);
    
    userKeywords = keywordsData?.map((k) => k.keyword) || [];

    if (userKeywords.length > 0) {
      const { data: postKeywords } = await supabase
        .from("post_keywords")
        .select("post_id, keyword, relevance")
        .in("keyword", userKeywords);

      if (postKeywords && postKeywords.length > 0) {
        const userKeywordWeights = new Map(
          keywordsData?.map((k) => [k.keyword, k.weight]) || []
        );
        
        const postScores: Record<string, number> = {};
        postKeywords.forEach((pk) => {
          const weight = userKeywordWeights.get(pk.keyword) || 1;
          postScores[pk.post_id] = (postScores[pk.post_id] || 0) + weight * pk.relevance;
        });

        const sortedPostIds = Object.entries(postScores)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([id]) => id);

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
              profiles!posts_author_id_fkey (
                username,
                avatar_url
              )
            `)
            .in("id", sortedPostIds)
            .eq("is_deleted", false);

          recommendedPosts = sortedPostIds
            .map((id) => recPosts?.find((p) => p.id === id))
            .filter(Boolean);
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
        initialPosts={transformPostsWithAuthor(posts)}
        initialAnnouncements={announcements || []}
        initialWeeklyTopic={weeklyTopic || null}
        initialHotPosts={transformPostsWithAuthor(hotPosts)}
        initialRecommendedPosts={transformPostsWithAuthor(recommendedPosts)}
        initialUserKeywords={userKeywords}
        isLoggedIn={!!user}
        currentUserId={user?.id}
      />
    </>
  );
}
