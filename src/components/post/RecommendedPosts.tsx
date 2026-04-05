"use client";

import { useState } from "react";
import { Sparkles, Settings, X, Plus, RefreshCw, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { PostCard } from "@/components/post";
import { cn } from "@/lib/utils";
import type { PostWithAuthor } from "@/types/database";

interface RecommendedPostsProps {
  posts: PostWithAuthor[];
  keywords?: string[];
  isLoggedIn: boolean;
  onAddKeyword?: (keyword: string) => Promise<void>;
  onRemoveKeyword?: (keyword: string) => Promise<void>;
  onRefresh?: () => void;
}

export function RecommendedPosts({
  posts,
  keywords = [],
  isLoggedIn,
  onAddKeyword,
  onRemoveKeyword,
  onRefresh,
}: RecommendedPostsProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAddKeyword = async () => {
    if (!newKeyword.trim() || !onAddKeyword) return;
    setIsLoading(true);
    await onAddKeyword(newKeyword.trim());
    setNewKeyword("");
    setIsLoading(false);
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsLoading(true);
    await onRefresh();
    setIsLoading(false);
  };

  if (!isLoggedIn) {
    return (
      <Card className="overflow-hidden border-brand-teal/20 bg-gradient-to-br from-brand-teal/5 to-brand-blue/5">
        <CardContent className="p-6 text-center">
          <Sparkles className="h-8 w-8 text-brand-teal mx-auto mb-3" />
          <h3 className="font-medium text-gray-900 mb-2">个性化推荐</h3>
          <p className="text-sm text-slate-500 mb-4">
            登录后设置感兴趣的关键词，获取专属推荐
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-brand-teal/20 bg-gradient-to-br from-brand-teal/5 to-brand-blue/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-brand-teal to-brand-blue">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            为你推荐
          </CardTitle>
          <div className="flex items-center gap-1">
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              className="h-8 w-8"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {showSettings && (
          <div className="mb-4 p-3 rounded-lg bg-white/50 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="添加感兴趣的关键词..."
                className="flex-1 h-8 text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddKeyword}
                disabled={!newKeyword.trim() || isLoading}
                className="h-8"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {keywords.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    {keyword}
                    <button
                      onClick={() => onRemoveKeyword?.(keyword)}
                      className="p-0.5 rounded-full hover:bg-slate-300"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {keywords.length > 0 && !showSettings && (
          <div className="flex flex-wrap gap-1.5 mb-3">
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
              {keywords.length === 0
                ? "添加感兴趣的关键词，获取个性化推荐"
                : "暂无匹配的帖子，试试其他关键词"}
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
