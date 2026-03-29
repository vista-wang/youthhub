import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout";
import { ProfilePage } from "./ProfilePage";

export const dynamic = "force-dynamic";

type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
};

type Post = {
  id: string;
  title: string;
  content: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  author_id: string;
  profiles?: { username: string | null; avatar_url: string | null } | null;
};

export default async function Profile() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?auth_required=true&redirect=/profile");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const typedProfile = profile as Profile | null;

  const { data: posts } = await supabase
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
    .eq("author_id", user.id)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(10);

  const typedPosts = (posts as Post[] | null) || [];

  const postsWithAuthor = typedPosts.map((post) => ({
    ...post,
    author_name: post.profiles?.username || "匿名用户",
    author_avatar: post.profiles?.avatar_url || null,
  }));

  return (
    <>
      <Navbar 
        user={user} 
        username={typedProfile?.username} 
        avatarUrl={typedProfile?.avatar_url}
      />
      <ProfilePage 
        profile={typedProfile}
        posts={postsWithAuthor}
      />
    </>
  );
}
