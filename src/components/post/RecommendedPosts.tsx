"use client";

import { useState } from "react";
import { RefreshCw, Heart, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { PostWithAuthor } from "@/types/database";

interface RecommendedPostsProps {
  posts: PostWithAuthor[];
  userKeywords?: string[];
  likedPostIds?: Set<string>;
  onLike?: (postId: string) => void;
  onRefresh?: () => void;
}

export function RecommendedPosts({
  posts,
  userKeywords = [],
  likedPostIds = new Set<string>(),
  onLike,
  onRefresh,
}: RecommendedPostsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsLoading(true);
    await onRefresh();
    setIsLoading(false);
  };

  return (
    <Card className="overflow-hidden border-blue-100 bg-blue-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 rounded-lg bg-brand-blue">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            为你推荐
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

      <CardContent className="pt-0">
        {userKeywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="text-xs text-slate-400 mr-1">猜你感兴趣</span>
            {userKeywords.slice(0, 5).map((keyword) => (
              <Badge key={keyword} variant="secondary" className="text-xs">
                {keyword}
              </Badge>
            ))}
          </div>
        )}

        {posts.length === 0 ? (
          <div className="text-center py-6">
            <Heart className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">
              多浏览和点赞，我们会越来越懂你
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.slice(0, 3).map((post) => (
              <article key={post.id} className="rounded-xl border border-blue-100 bg-white p-3">
                <Link href={`/post/${post.id}`} className="block">
                  <h3 className="line-clamp-1 text-sm font-semibold text-gray-900 hover:text-brand-blue">
                    {post.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-600">{post.content}</p>
                </Link>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Avatar src={post.author_avatar} alt={post.author_name} size="sm" />
                    <span className="max-w-24 truncate">{post.author_name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <button
                      onClick={() => onLike?.(post.id)}
                      className={cn("inline-flex items-center gap-1", likedPostIds.has(post.id) && "text-red-500")}
                      aria-label={likedPostIds.has(post.id) ? "取消点赞" : "点赞"}
                    >
                      <Heart className={cn("h-3.5 w-3.5", likedPostIds.has(post.id) && "fill-current")} />
                      {post.likes_count}
                    </button>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="h-3.5 w-3.5" />
                      {post.comments_count}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
