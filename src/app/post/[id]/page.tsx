import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout";
import { PostDetailPage } from "./PostDetailPage";

interface PostPageProps {
  params: Promise<{
    id: string;
  }>;
}

type Profile = {
  username: string | null;
  avatar_url: string | null;
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

type Comment = {
  id: string;
  post_id: string;
  parent_id: string | null;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  author_id: string;
  profiles?: { username: string | null; avatar_url: string | null } | null;
};

function transformPost(post: Post) {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    likes_count: post.likes_count,
    comments_count: post.comments_count,
    created_at: post.created_at,
    updated_at: post.updated_at,
    author_id: post.author_id,
    author_name: post.profiles?.username || "匿名用户",
    author_avatar: post.profiles?.avatar_url || null,
  };
}

function transformComments(comments: Comment[] | null) {
  if (!comments) return [];
  return comments.map((comment) => ({
    id: comment.id,
    post_id: comment.post_id,
    parent_id: comment.parent_id,
    content: comment.content,
    likes_count: comment.likes_count,
    created_at: comment.created_at,
    updated_at: comment.updated_at,
    author_id: comment.author_id,
    author_name: comment.profiles?.username || "匿名用户",
    author_avatar: comment.profiles?.avatar_url || null,
  }));
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

  const typedProfile = profile as Profile | null;

  return (
    <>
      <Navbar 
        user={user} 
        username={typedProfile?.username} 
        avatarUrl={typedProfile?.avatar_url}
      />
      <PostDetailPage
        post={transformPost(post as Post)}
        comments={transformComments(comments as Comment[] | null)}
        isLoggedIn={!!user}
        currentUserId={user?.id}
        isLiked={!!likeData}
      />
    </>
  );
}
