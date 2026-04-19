import type { PostWithAuthor, CommentWithAuthor, SupabasePostResponse, SupabaseCommentResponse } from "@/types/database";

export function transformPostWithAuthor(post: SupabasePostResponse): PostWithAuthor {
  const profiles = post.profiles;
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    likes_count: post.likes_count,
    comments_count: post.comments_count,
    created_at: post.created_at,
    updated_at: post.updated_at,
    author_id: post.author_id,
    author_name: profiles?.username || "匿名用户",
    author_avatar: profiles?.avatar_url || null,
  };
}

export function transformCommentWithAuthor(comment: SupabaseCommentResponse): CommentWithAuthor {
  const profiles = comment.profiles;
  return {
    id: comment.id,
    post_id: comment.post_id,
    parent_id: comment.parent_id,
    content: comment.content,
    likes_count: comment.likes_count,
    created_at: comment.created_at,
    updated_at: comment.updated_at,
    author_id: comment.author_id,
    author_name: profiles?.username || "匿名用户",
    author_avatar: profiles?.avatar_url || null,
  };
}

export function transformPostsWithAuthor(posts: SupabasePostResponse[] | null): PostWithAuthor[] {
  if (!posts || posts.length === 0) return [];
  const result = [];
  for (let i = 0, len = posts.length; i < len; i++) {
    const post = posts[i];
    if (post) {
      result.push(transformPostWithAuthor(post));
    }
  }
  return result;
}

export function transformCommentsWithAuthor(comments: SupabaseCommentResponse[] | null): CommentWithAuthor[] {
  if (!comments || comments.length === 0) return [];
  const result = [];
  for (let i = 0, len = comments.length; i < len; i++) {
    const comment = comments[i];
    if (comment) {
      result.push(transformCommentWithAuthor(comment));
    }
  }
  return result;
}
