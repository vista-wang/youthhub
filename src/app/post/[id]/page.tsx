import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout";
import { PostDetailPage } from "./PostDetailPage";
import { transformPostWithAuthor, transformCommentsWithAuthor } from "@/lib/utils";

interface PostPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: profile },
    { data: post, error: postError },
    { data: comments },
    { data: likeData }
  ] = await Promise.all([
    user ? supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", user.id)
      .single() : Promise.resolve({ data: null }),
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
      .eq("id", id)
      .eq("is_deleted", false)
      .single(),
    supabase
      .from("comments")
      .select(`
        id,
        post_id,
        parent_id,
        content,
        likes_count,
        created_at,
        updated_at,
        author_id,
        profiles!comments_author_id_fkey (
          username,
          avatar_url
        )
      `)
      .eq("post_id", id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true }),
    user ? supabase
      .from("likes")
      .select("id")
      .eq("user_id", user.id)
      .eq("likeable_id", id)
      .eq("likeable_type", "post")
      .maybeSingle() : Promise.resolve({ data: null })
  ]);

  if (postError || !post) {
    notFound();
  }

  return (
    <>
      <Navbar 
        user={user} 
        username={profile?.username} 
        avatarUrl={profile?.avatar_url}
      />
      <PostDetailPage
        post={transformPostWithAuthor(post)}
        comments={transformCommentsWithAuthor(comments)}
        isLoggedIn={!!user}
        currentUserId={user?.id}
        isLiked={!!likeData}
      />
    </>
  );
}
