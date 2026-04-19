"use client";

import { useState, useCallback, useRef } from "react";

interface UseLikeOptions {
  initialIsLiked?: boolean;
  initialCount?: number;
  onLike?: () => Promise<void>;
  onUnlike?: () => Promise<void>;
}

interface UseLikeReturn {
  isLiked: boolean;
  count: number;
  isLoading: boolean;
  toggle: () => Promise<void>;
}

export function useLike({
  initialIsLiked = false,
  initialCount = 0,
  onLike,
  onUnlike,
}: UseLikeOptions): UseLikeReturn {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const isLikedRef = useRef(isLiked);
  isLikedRef.current = isLiked;

  const toggle = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    const newIsLiked = !isLikedRef.current;

    setIsLiked(newIsLiked);
    setCount((prev) => (newIsLiked ? prev + 1 : prev - 1));

    try {
      if (newIsLiked) {
        await onLike?.();
      } else {
        await onUnlike?.();
      }
    } catch (error) {
      setIsLiked(!newIsLiked);
      setCount((prev) => (newIsLiked ? prev - 1 : prev + 1));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, onLike, onUnlike]);

  return { isLiked, count, isLoading, toggle };
}

interface UsePostLikeOptions {
  postId: string;
  initialIsLiked?: boolean;
  initialCount?: number;
  isLoggedIn: boolean;
  onAuthRequired?: () => void;
}

interface UsePostLikeReturn {
  isLiked: boolean;
  count: number;
  isLoading: boolean;
  handleLike: () => Promise<void>;
}

export function usePostLike({
  postId,
  initialIsLiked = false,
  initialCount = 0,
  isLoggedIn,
  onAuthRequired,
}: UsePostLikeOptions): UsePostLikeReturn {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const isLikedRef = useRef(isLiked);
  isLikedRef.current = isLiked;

  const handleLike = useCallback(async () => {
    if (!isLoggedIn) {
      onAuthRequired?.();
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    const newIsLiked = !isLikedRef.current;

    setIsLiked(newIsLiked);
    setCount((prev) => (newIsLiked ? prev + 1 : prev - 1));

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: newIsLiked ? "POST" : "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to update like");
      }
    } catch (error) {
      setIsLiked(!newIsLiked);
      setCount((prev) => (newIsLiked ? prev - 1 : prev + 1));
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, isLoading, postId, onAuthRequired]);

  return { isLiked, count, isLoading, handleLike };
}
