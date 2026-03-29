import type { Post, PostWithAuthor, CommentWithAuthor } from "@/types/database";

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PostsListResponse {
  posts: PostWithAuthor[];
}

export interface HotPostsResponse {
  posts: PostWithAuthor[];
}

export interface RecommendedPostsResponse {
  posts: PostWithAuthor[];
  keywords?: string[];
}

export interface PostCreateResponse {
  post: Post;
}

export interface CommentsListResponse {
  comments: CommentWithAuthor[];
}

export interface CommentCreateResponse {
  comment: CommentWithAuthor;
}

export interface LikeResponse {
  success: boolean;
}

export interface UserKeywordsResponse {
  keywords: string[];
}

export interface AddKeywordRequest {
  keyword: string;
}

export interface AddKeywordResponse {
  success: boolean;
  keyword: string;
}

export interface RemoveKeywordResponse {
  success: boolean;
}
