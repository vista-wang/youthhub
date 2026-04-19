"use client";

import { useState, useCallback, useRef } from "react";
import type { PostWithAuthor } from "@/types/database";

interface UseHomePageOptions {
  initialPosts: PostWithAuthor[];
  initialRecommendedPosts: PostWithAuthor[];
  initialUserKeywords: string[];
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
}: UseHomePageOptions): UseHomePageReturn {
  const [posts] = useState<PostWithAuthor[]>(initialPosts);
  const [recommendedPosts, setRecommendedPosts] = useState<PostWithAuthor[]>(initialRecommendedPosts);
  const [userKeywords] = useState<string[]>(initialUserKeywords);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(() => new Set());
  const [isLoading, setIsLoading] = useState(false);

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
      }
    } catch (error) {
      setLikedPosts((prev) => {
        const newSet = new Set(prev);
        if (isCurrentlyLiked) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });
    }
  }, []);

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
