"use client";

import { useState, memo, useCallback } from "react";
import { Flame, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui";
import { PostCard } from "@/components/post";
import { cn } from "@/lib/utils";
import type { PostWithAuthor } from "@/types/database";

interface HotPostsSectionProps {
  posts: PostWithAuthor[];
  onRefresh?: () => void;
}

function HotPostsSectionInner({ posts, onRefresh }: HotPostsSectionProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    setIsLoading(true);
    await onRefresh();
    setIsLoading(false);
  }, [onRefresh]);

  // 所有 Hook 必须在早返回之前
  if (posts.length === 0) return null;

  return (
    <Card className="overflow-hidden border-amber-200/50 bg-amber-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 rounded-lg bg-brand-orange">
              <Flame className="h-4 w-4 text-white" />
            </div>
            热门帖子
          </CardTitle>
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {posts.slice(0, 3).map((post, index) => (
          <div key={post.id} className="relative pl-8">
            <div className={cn(
              "absolute left-0 top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white z-10",
              index === 0 ? "bg-red-500" :
              index === 1 ? "bg-orange-500" :
              "bg-amber-500"
            )}
            >
              {index + 1}
            </div>
            <div className="w-full">
              <PostCard post={post} showFullContent={false} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export const HotPostsSection = memo(HotPostsSectionInner);

function HotPostsMiniInner({ posts }: { posts: PostWithAuthor[] }) {
  // 没有 Hook，所以早返回没问题
  if (posts.length === 0) return null;

  return (
    <div className="space-y-2">
      {posts.slice(0, 5).map((post, index) => (
        <a
          key={post.id}
          href={`/post/${post.id}`}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group"
        >
          <span className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
            index === 0 ? "bg-red-500 text-white" :
            index === 1 ? "bg-orange-500 text-white" :
            index === 2 ? "bg-amber-500 text-white" :
            "bg-slate-100 text-slate-500"
          )}>
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-brand-blue transition-colors">
              {post.title}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>❤️ {post.likes_count}</span>
              <span>💬 {post.comments_count}</span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

export const HotPostsMini = memo(HotPostsMiniInner);
