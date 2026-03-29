"use client";

import { useState } from "react";
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

export function HotPostsSection({ posts, onRefresh }: HotPostsSectionProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsLoading(true);
    await onRefresh();
    setIsLoading(false);
  };

  if (posts.length === 0) return null;

  return (
    <Card className="overflow-hidden border-amber-200/50 bg-gradient-to-br from-amber-50/50 to-orange-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-400 to-red-500">
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
          <div key={post.id} className="relative">
            <div className="absolute -left-2 top-3 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{
                background: index === 0 ? 'linear-gradient(135deg, #FF6B6B, #FF8E53)' :
                           index === 1 ? 'linear-gradient(135deg, #FF8E53, #FFA726)' :
                           'linear-gradient(135deg, #FFA726, #FFCA28)'
              }}
            >
              {index + 1}
            </div>
            <div className="ml-5">
              <PostCard post={post} showFullContent={false} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function HotPostsMini({ posts }: { posts: PostWithAuthor[] }) {
  if (posts.length === 0) return null;

  return (
    <div className="space-y-2">
      {posts.slice(0, 5).map((post, index) => (
        <a
          key={post.id}
          href={`/post/${post.id}`}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
        >
          <span className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
            index === 0 ? "bg-red-100 text-red-600" :
            index === 1 ? "bg-orange-100 text-orange-600" :
            index === 2 ? "bg-yellow-100 text-yellow-600" :
            "bg-gray-100 text-gray-500"
          )}>
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-dopamine-pink transition-colors">
              {post.title}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>❤️ {post.likes_count}</span>
              <span>💬 {post.comments_count}</span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
