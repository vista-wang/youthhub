"use client";

import { useState } from "react";
import { Sparkles, RefreshCw, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui";
import { PostCard } from "@/components/post";
import { cn } from "@/lib/utils";
import type { PostWithAuthor } from "@/types/database";

interface RecommendedPostsProps {
  posts: PostWithAuthor[];
  keywords?: string[];
  isLoggedIn: boolean;
  onRefresh?: () => void;
}

export function RecommendedPosts({
  posts,
  keywords = [],
  isLoggedIn,
  onRefresh,
}: RecommendedPostsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsLoading(true);
    await onRefresh();
    setIsLoading(false);
  };

  if (!isLoggedIn) {
    return (
      <Card className="overflow-hidden border-blue-100 bg-blue-50/50">
        <CardContent className="p-6 text-center">
          <Sparkles className="h-8 w-8 text-brand-blue mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">个性化推荐</h3>
          <p className="text-sm text-slate-500">
            登录后获取专属推荐，越用越懂你
          </p>
        </CardContent>
      </Card>
    );
  }

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
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="text-xs text-slate-400 mr-1">猜你感兴趣</span>
            {keywords.slice(0, 5).map((keyword) => (
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
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
