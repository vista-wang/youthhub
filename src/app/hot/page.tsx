import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout";
import { HotPage } from "./HotPage";
import { transformPostsWithAuthor } from "@/lib/utils";
import { POSTS_SELECT } from "@/lib/services";
import type { SupabasePostResponse } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function Hot() {
  const supabase = await createClient();

  const [
    { data: { user } },
    { data: posts },
    { data: hotPosts },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("posts")
      .select(POSTS_SELECT)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("posts")
      .select(POSTS_SELECT)
      .eq("is_deleted", false)
      .gte("likes_count", 10)
      .order("likes_count", { ascending: false })
      .limit(20),
  ]);

  let profile: { username: string | null; avatar_url: string | null } | null = null;
  
  if (user) {
    const { data: profileResult } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", user.id)
      .single();
    
    profile = profileResult as { username: string | null; avatar_url: string | null } | null;
  }

  return (
    <>
      <Navbar 
        user={user} 
        username={profile?.username} 
        avatarUrl={profile?.avatar_url}
      />
      <HotPage 
        initialPosts={transformPostsWithAuthor(posts as SupabasePostResponse[] | null)}
        initialHotPosts={transformPostsWithAuthor(hotPosts as SupabasePostResponse[] | null)}
        isLoggedIn={!!user}
      />
    </>
  );
}
