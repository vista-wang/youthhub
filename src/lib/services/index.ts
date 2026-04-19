import { createClient, fromTable } from "@/lib/supabase/server";
import type { PostWithAuthor, CommentWithAuthor, Announcement, WeeklyTopic, UserKeyword, SupabasePostResponse, SupabaseCommentResponse } from "@/types/database";
import { transformPostsWithAuthor, transformCommentsWithAuthor } from "@/lib/utils";
import type { Database } from "@/types/database";
import { getGlobalCache } from "@/lib/cache";
import { calculatePostScores, getTopPostIds } from "@/lib/utils";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type PostsQueryBuilder = any;
type CommentsQueryBuilder = any;

export const POSTS_SELECT = `
  id,
  title,
  content,
  likes_count,
  comments_count,
  image_urls,
  attachment_urls,
  created_at,
  updated_at,
  author_id,
  profiles:author_id (
    username,
    avatar_url,
    level
  )
` as const;

export const COMMENTS_SELECT = `
  id,
  post_id,
  parent_id,
  content,
  likes_count,
  created_at,
  updated_at,
  author_id,
  profiles:author_id (
    username,
    avatar_url
  )
` as const;

function buildPostsQuery(query: PostsQueryBuilder) {
  return query.select(POSTS_SELECT);
}

function buildCommentsQuery(query: CommentsQueryBuilder) {
  return query.select(COMMENTS_SELECT);
}

export interface PostsQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "created_at" | "likes_count" | "comments_count";
  sortOrder?: "asc" | "desc";
  minLikes?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  hasMore: boolean;
}

class PostService {
  private cache = getGlobalCache();

  async getPosts(options: PostsQueryOptions = {}): Promise<PostWithAuthor[]> {
    const {
      limit = 20,
      sortBy = "created_at",
      sortOrder = "desc",
      minLikes,
    } = options;

    const cacheKey = `posts:${limit}:${sortBy}:${sortOrder}:${minLikes ?? "none"}`;
    return this.cache.getOrSet(cacheKey, async () => {
      const supabase = await createClient();
      let query = buildPostsQuery(
        supabase
          .from("posts")
      )
      .eq("is_deleted", false)
      .order(sortBy, { ascending: sortOrder === "asc" })
      .limit(limit);

      if (minLikes !== undefined) {
        query = query.gte("likes_count", minLikes);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching posts:", error);
        return [];
      }

      return transformPostsWithAuthor(data as SupabasePostResponse[] | null);
    }, 30000);
  }

  async getPostById(id: string): Promise<PostWithAuthor | null> {
    const cacheKey = `post:${id}`;
    return this.cache.getOrSet(cacheKey, async () => {
      const supabase = await createClient();

      const { data, error } = await buildPostsQuery(
        supabase
          .from("posts")
      )
      .eq("id", id)
      .eq("is_deleted", false)
      .single();

      if (error || !data) {
        return null;
      }

      const transformed = transformPostsWithAuthor([data as SupabasePostResponse]);
      return transformed[0] || null;
    }, 60000);
  }

  async getHotPosts(limit: number = 10): Promise<PostWithAuthor[]> {
    return this.getPosts({
      limit,
      sortBy: "likes_count",
      sortOrder: "desc",
      minLikes: 10,
    });
  }

  async getRecommendedPosts(userId: string, limit: number = 10): Promise<{
    posts: PostWithAuthor[];
    keywords: string[];
  }> {
    const cacheKey = `recommended:${userId}:${limit}`;
    return this.cache.getOrSet(cacheKey, async () => {
      const supabase = await createClient();

      const { data: userKeywords } = await supabase
        .from("user_keywords")
        .select("keyword, weight")
        .eq("user_id", userId)
        .order("weight", { ascending: false })
        .limit(10);

      if (!userKeywords || userKeywords.length === 0) {
        return { posts: [], keywords: [] };
      }

      const typedUserKeywords = userKeywords as Array<{ keyword: string; weight: number }>;
      const keywordWeights = new Map(typedUserKeywords.map((k) => [k.keyword, k.weight]));
      const keywords = Array.from(keywordWeights.keys());

      const { data: postKeywords } = await supabase
        .from("post_keywords")
        .select("post_id, keyword, relevance")
        .in("keyword", keywords);

      if (!postKeywords || postKeywords.length === 0) {
        return { posts: [], keywords };
      }

      const typedPostKeywords = postKeywords as Array<{ post_id: string; keyword: string; relevance: number }>;
      const postScores = calculatePostScores(typedPostKeywords, keywordWeights);
      const sortedPostIds = getTopPostIds(postScores, limit);

      if (sortedPostIds.length === 0) {
        return { posts: [], keywords: keywords.slice(0, 5) };
      }

      const { data: posts } = await buildPostsQuery(
        supabase
          .from("posts")
      )
      .in("id", sortedPostIds)
      .eq("is_deleted", false);

      const postIdIndexMap = new Map(sortedPostIds.map((id, index) => [id, index]));
      const typedPosts = (posts as SupabasePostResponse[] | null) || [];

      const sortedPosts = new Array(typedPosts.length);
      for (const post of typedPosts) {
        const index = postIdIndexMap.get(post.id);
        if (index !== undefined) {
          sortedPosts[index] = post;
        }
      }

      return {
        posts: transformPostsWithAuthor(sortedPosts.filter(Boolean)),
        keywords: keywords.slice(0, 5),
      };
    }, 30000);
  }

  async createPost(authorId: string, title: string, content: string, imageUrls?: string[], attachmentUrls?: string[]): Promise<PostWithAuthor | null> {
    const supabase = await createClient();

    const { data, error } = await fromTable(supabase, "posts")
      .insert({
        author_id: authorId,
        title: title.trim(),
        content: content.trim(),
        image_urls: imageUrls || [],
        attachment_urls: attachmentUrls || [],
      })
      .select(POSTS_SELECT)
      .single();

    if (error || !data) {
      console.error("Error creating post:", error);
      return null;
    }

    const transformed = transformPostsWithAuthor([data as SupabasePostResponse]);
    return transformed[0] || null;
  }
}

class CommentService {
  async getCommentsByPostId(postId: string): Promise<CommentWithAuthor[]> {
    const supabase = await createClient();

    const { data, error } = await buildCommentsQuery(
      supabase
        .from("comments")
    )
    .eq("post_id", postId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return [];
    }

    return transformCommentsWithAuthor(data as SupabaseCommentResponse[] | null);
  }

  async createComment(
    postId: string,
    authorId: string,
    content: string,
    parentId?: string
  ): Promise<CommentWithAuthor | null> {
    const supabase = await createClient();

    const { data, error } = await fromTable(supabase, "comments")
      .insert({
        post_id: postId,
        author_id: authorId,
        content: content.trim(),
        parent_id: parentId || null,
      })
      .select(COMMENTS_SELECT)
      .single();

    if (error || !data) {
      console.error("Error creating comment:", error);
      return null;
    }

    const transformed = transformCommentsWithAuthor([data as SupabaseCommentResponse]);
    return transformed[0] || null;
  }
}

class AnnouncementService {
  async getActiveAnnouncements(limit: number = 5): Promise<Announcement[]> {
    const supabase = await createClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("is_active", true)
      .or(`start_at.is.null,start_at.lte.${now}`)
      .or(`end_at.is.null,end_at.gte.${now}`)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching announcements:", error);
      return [];
    }

    return (data as Announcement[]) || [];
  }
}

class UserService {
  async getUserKeywords(userId: string): Promise<UserKeyword[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("user_keywords")
      .select("*")
      .eq("user_id", userId)
      .order("weight", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching user keywords:", error);
      return [];
    }

    return (data as UserKeyword[]) || [];
  }

  async addUserKeyword(userId: string, keyword: string): Promise<boolean> {
    const supabase = await createClient();

    const { error } = await fromTable(supabase, "user_keywords")
      .upsert(
        {
          user_id: userId,
          keyword,
          weight: 1,
          source: "manual",
        },
        { onConflict: "user_id,keyword" }
      );

    return !error;
  }

  async removeUserKeyword(userId: string, keyword: string): Promise<boolean> {
    const supabase = await createClient();

    const { error } = await supabase
      .from("user_keywords")
      .delete()
      .eq("user_id", userId)
      .eq("keyword", keyword);

    return !error;
  }
}

class TopicService {
  async getCurrentWeeklyTopic(): Promise<WeeklyTopic | null> {
    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("weekly_topics")
      .select("*")
      .eq("is_active", true)
      .lte("week_start", today)
      .gte("week_end", today)
      .single();

    if (error || !data) {
      return null;
    }

    return data as WeeklyTopic;
  }
}

export const postService = new PostService();
export const commentService = new CommentService();
export const announcementService = new AnnouncementService();
export const userService = new UserService();
export const topicService = new TopicService();
