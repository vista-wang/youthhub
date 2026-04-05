import { createClient } from "@/lib/supabase/server";
import type { PostWithAuthor, CommentWithAuthor, Announcement, WeeklyTopic, UserKeyword } from "@/types/database";
import { transformPostsWithAuthor, transformCommentsWithAuthor } from "@/lib/utils";

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
  async getPosts(options: PostsQueryOptions = {}): Promise<PostWithAuthor[]> {
    const supabase = await createClient();
    const {
      limit = 20,
      sortBy = "created_at",
      sortOrder = "desc",
      minLikes,
    } = options;

    let query = supabase
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

    return transformPostsWithAuthor(data as any[] | null);
  }

  async getPostById(id: string): Promise<PostWithAuthor | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
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
      .eq("id", id)
      .eq("is_deleted", false)
      .single();

    if (error || !data) {
      return null;
    }

    const transformed = transformPostsWithAuthor([data as any]);
    return transformed[0] || null;
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
    const postScores = new Map<string, number>();
    for (const pk of typedPostKeywords) {
      const weight = keywordWeights.get(pk.keyword);
      if (weight) {
        const currentScore = postScores.get(pk.post_id) || 0;
        postScores.set(pk.post_id, currentScore + weight * pk.relevance);
      }
    }

    const sortedPostIds = Array.from(postScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);

    if (sortedPostIds.length === 0) {
      return { posts: [], keywords: keywords.slice(0, 5) };
    }

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
      .in("id", sortedPostIds)
      .eq("is_deleted", false);

    const postIdIndexMap = new Map(sortedPostIds.map((id, index) => [id, index]));
    const typedPosts = (posts as any[] | null) || [];
    
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
  }

  async createPost(authorId: string, title: string, content: string): Promise<PostWithAuthor | null> {
    const supabase = await createClient() as any;

    const { data, error } = await supabase
      .from("posts")
      .insert({
        author_id: authorId,
        title: title.trim(),
        content: content.trim(),
      })
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
      .single();

    if (error || !data) {
      console.error("Error creating post:", error);
      return null;
    }

    const transformed = transformPostsWithAuthor([data as any]);
    return transformed[0] || null;
  }
}

class CommentService {
  async getCommentsByPostId(postId: string): Promise<CommentWithAuthor[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
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
        profiles:author_id (
          username,
          avatar_url
        )
      `)
      .eq("post_id", postId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return [];
    }

    return transformCommentsWithAuthor(data as any[] | null);
  }

  async createComment(
    postId: string,
    authorId: string,
    content: string,
    parentId?: string
  ): Promise<CommentWithAuthor | null> {
    const supabase = await createClient() as any;

    const { data, error } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        author_id: authorId,
        content: content.trim(),
        parent_id: parentId || null,
      })
      .select(`
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
      `)
      .single();

    if (error || !data) {
      console.error("Error creating comment:", error);
      return null;
    }

    const transformed = transformCommentsWithAuthor([data as any]);
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
    const supabase = await createClient() as any;

    const { error } = await supabase
      .from("user_keywords")
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
