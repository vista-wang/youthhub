"use client";

import { useState, useCallback, useRef } from "react";
import type { PostWithAuthor } from "@/types/database";

type TabType = "latest" | "hot" | "recommend";

interface UseHomePageOptions {
  initialPosts: PostWithAuthor[];
  initialHotPosts: PostWithAuthor[];
  initialRecommendedPosts: PostWithAuthor[];
  initialUserKeywords: string[];
}

interface UseHomePageReturn {
  posts: PostWithAuthor[];
  hotPosts: PostWithAuthor[];
  recommendedPosts: PostWithAuthor[];
  userKeywords: string[];
  likedPosts: Set<string>;
  activeTab: TabType;
  isLoading: boolean;
  setActiveTab: (tab: TabType) => void;
  handleRefresh: () => Promise<void>;
  handleRefreshHot: () => Promise<void>;
  handleRefreshRecommended: () => Promise<void>;
  handleLike: (postId: string) => Promise<void>;
  handleAddKeyword: (keyword: string) => Promise<void>;
  handleRemoveKeyword: (keyword: string) => Promise<void>;
}

export function useHomePage({
  initialPosts,
  initialHotPosts,
  initialRecommendedPosts,
  initialUserKeywords,
}: UseHomePageOptions): UseHomePageReturn {
  const [posts, setPosts] = useState<PostWithAuthor[]>(initialPosts);
  const [hotPosts, setHotPosts] = useState<PostWithAuthor[]>(initialHotPosts);
  const [recommendedPosts, setRecommendedPosts] = useState<PostWithAuthor[]>(initialRecommendedPosts);
  const [userKeywords, setUserKeywords] = useState<string[]>(initialUserKeywords);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(() => new Set());
  const [activeTab, setActiveTab] = useState<TabType>("latest");
  const [isLoading, setIsLoading] = useState(false);

  const likedPostsRef = useRef(likedPosts);
  likedPostsRef.current = likedPosts;

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/posts");
      const data = await response.json();
      if (data.posts) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error("Failed to refresh posts:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRefreshHot = useCallback(async () => {
    try {
      const response = await fetch("/api/posts/hot");
      const data = await response.json();
      if (data.posts) {
        setHotPosts(data.posts);
      }
    } catch (error) {
      console.error("Failed to refresh hot posts:", error);
    }
  }, []);

  const handleRefreshRecommended = useCallback(async () => {
    try {
      const response = await fetch("/api/posts/recommend");
      const data = await response.json();
      if (data.posts) {
        setRecommendedPosts(data.posts);
        if (data.keywords) {
          setUserKeywords(data.keywords);
        }
      }
    } catch (error) {
      console.error("Failed to refresh recommended posts:", error);
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

  const handleAddKeyword = useCallback(async (keyword: string) => {
    try {
      const response = await fetch("/api/user-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword }),
      });
      if (response.ok) {
        setUserKeywords((prev) =>
          prev.includes(keyword) ? prev : [...prev, keyword]
        );
        handleRefreshRecommended();
      }
    } catch (error) {
      console.error("Failed to add keyword:", error);
    }
  }, [handleRefreshRecommended]);

  const handleRemoveKeyword = useCallback(async (keyword: string) => {
    try {
      const response = await fetch(`/api/user-keywords?keyword=${encodeURIComponent(keyword)}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setUserKeywords((prev) => prev.filter((k) => k !== keyword));
        handleRefreshRecommended();
      }
    } catch (error) {
      console.error("Failed to remove keyword:", error);
    }
  }, [handleRefreshRecommended]);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    if (tab === "hot") {
      handleRefreshHot();
    } else if (tab === "recommend") {
      handleRefreshRecommended();
    }
  }, [handleRefreshHot, handleRefreshRecommended]);

  return {
    posts,
    hotPosts,
    recommendedPosts,
    userKeywords,
    likedPosts,
    activeTab,
    isLoading,
    setActiveTab: handleTabChange,
    handleRefresh,
    handleRefreshHot,
    handleRefreshRecommended,
    handleLike,
    handleAddKeyword,
    handleRemoveKeyword,
  };
}
