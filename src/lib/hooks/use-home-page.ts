"use client";

import { useState, useCallback, useRef } from "react";
import type { PostWithAuthor } from "@/types/database";

interface UseHomePageOptions {
  initialPosts: PostWithAuthor[];
  initialRecommendedPosts: PostWithAuthor[];
  initialUserKeywords: string[];
  initialLikedPostIds?: string[];
}

interface UseHomePageReturn {
  posts: PostWithAuthor[];
  recommendedPosts: PostWithAuthor[];
  userKeywords: string[];
  likedPosts: Set<string>;
  isLoading: boolean;
  handleRefreshRecommended: () => Promise<void>;
  handleLike: (postId: string) => Promise<void>;
}

export function useHomePage({
  initialPosts,
  initialRecommendedPosts,
  initialUserKeywords,
  initialLikedPostIds = [],
}: UseHomePageOptions): UseHomePageReturn {
  const [posts, setPosts] = useState<PostWithAuthor[]>(initialPosts);
  const [recommendedPosts, setRecommendedPosts] = useState<PostWithAuthor[]>(initialRecommendedPosts);
  const [userKeywords] = useState<string[]>(initialUserKeywords);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(() => new Set(initialLikedPostIds));
  const [isLoading, setIsLoading] = useState(false);
  const patchLikeCount = useCallback((items: PostWithAuthor[], postId: string, delta: number): PostWithAuthor[] => {
    return items.map((item) => {
      if (item.id !== postId) {
        return item;
      }
      return {
        ...item,
        likes_count: Math.max(0, item.likes_count + delta),
      };
    });
  }, []);

  const applyLikeDelta = useCallback((postId: string, delta: number) => {
    setPosts((prev) => patchLikeCount(prev, postId, delta));
    setRecommendedPosts((prev) => patchLikeCount(prev, postId, delta));
  }, [patchLikeCount]);


  const likedPostsRef = useRef(likedPosts);
  likedPostsRef.current = likedPosts;

  const handleRefreshRecommended = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/posts/recommend");
      const data = await response.json();
      if (data.posts) {
        setRecommendedPosts(data.posts);
      }
    } catch (error) {
      console.error("Failed to refresh recommended posts:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLike = useCallback(async (postId: string) => {
    const currentLikedPosts = likedPostsRef.current;
    const isCurrentlyLiked = currentLikedPosts.has(postId);
    
    setLikedPosts((prev) => {
      const newSet = new Set(prev);
      if (isCurrentlyLiked) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
    applyLikeDelta(postId, isCurrentlyLiked ? -1 : 1);

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: isCurrentlyLiked ? "DELETE" : "POST",
      });

      if (!response.ok) {
        setLikedPosts((prev) => {
          const newSet = new Set(prev);
          if (isCurrentlyLiked) {
            newSet.add(postId);
          } else {
            newSet.delete(postId);
          }
          return newSet;
        });
        applyLikeDelta(postId, isCurrentlyLiked ? 1 : -1);
      }
    } catch {
      setLikedPosts((prev) => {
        const newSet = new Set(prev);
        if (isCurrentlyLiked) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });
      applyLikeDelta(postId, isCurrentlyLiked ? 1 : -1);
    }
  }, [applyLikeDelta]);

  return {
    posts,
    recommendedPosts,
    userKeywords,
    likedPosts,
    isLoading,
    handleRefreshRecommended,
    handleLike,
  };
}
