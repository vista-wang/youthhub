"use client";

import { useState, useRef } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  initialIsLiked?: boolean;
  initialCount?: number;
  onLike?: () => Promise<void>;
  onUnlike?: () => Promise<void>;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { icon: "h-4 w-4", text: "text-xs", gap: "gap-1" },
  md: { icon: "h-5 w-5", text: "text-sm", gap: "gap-1.5" },
  lg: { icon: "h-6 w-6", text: "text-base", gap: "gap-2" },
} as const;

export function LikeButton({
  initialIsLiked = false,
  initialCount = 0,
  onLike,
  onUnlike,
  size = "md",
  showCount = true,
  className,
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const isLikedRef = useRef(isLiked);
  isLikedRef.current = isLiked;

  const handleClick = async () => {
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
    } finally {
      setIsLoading(false);
    }
  };

  const config = sizeConfig[size];

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      aria-pressed={isLiked}
      aria-label={isLiked ? "取消点赞" : "点赞"}
      className={cn(
        "flex items-center min-w-[44px] min-h-[44px] transition-all duration-200",
        config.gap,
        isLiked
          ? "text-red-500"
          : "text-slate-400 hover:text-red-400",
        isLoading && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <Heart
        className={cn(
          config.icon,
          "transition-transform duration-200",
          isLiked && "fill-current",
          !isLoading && isLiked && "animate-bounce-in"
        )}
      />
      {showCount && <span className={config.text}>{count}</span>}
    </button>
  );
}
