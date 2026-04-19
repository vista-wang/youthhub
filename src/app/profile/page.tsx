import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout";
import { ProfilePage } from "./ProfilePage";
import { transformPostsWithAuthor } from "@/lib/utils";
import { POSTS_SELECT } from "@/lib/services";
import type { SupabasePostResponse } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function Profile() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <>
        <Navbar user={null} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-slate-500">请先登录</p>
        </div>
      </>
    );
  }

  const [
    { data: profile },
    { data: posts },
    { data: likedPostIds },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, avatar_url, bio, points, experience, level, is_premium, premium_expires_at")
      .eq("id", user.id)
      .single(),
    supabase
      .from("posts")
      .select(POSTS_SELECT)
      .eq("author_id", user.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("likes")
      .select("post_id")
      .eq("user_id", user.id),
  ]);

  return (
    <>
      <Navbar 
        user={user} 
        username={profile?.username} 
        avatarUrl={profile?.avatar_url}
      />
      <ProfilePage 
        profile={{
          username: profile?.username ?? "",
          avatar_url: profile?.avatar_url ?? null,
          bio: profile?.bio ?? null,
          points: profile?.points ?? 0,
          experience: profile?.experience ?? 0,
          level: profile?.level ?? 1,
          is_premium: profile?.is_premium ?? false,
          premium_expires_at: profile?.premium_expires_at ?? null,
        }}
        posts={transformPostsWithAuthor(posts as SupabasePostResponse[] | null)}
        likedPostIds={new Set((likedPostIds ?? []).map((l: { post_id: string }) => l.post_id))}
        isLoggedIn={true}
      />
    </>
  );
}
