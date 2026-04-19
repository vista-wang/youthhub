"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { RefreshCw, Inbox, Flame, Clock, MessageCircle, Heart, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { AuthModal } from "@/components/auth";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { PostWithAuthor } from "@/types/database";

type HotTabType = "latest" | "hot";

function getHeatScore(post: PostWithAuthor): number {
  return post.likes_count * 2 + post.comments_count * 3;
}

interface HotPageProps {
  initialPosts: PostWithAuthor[];
  initialHotPosts: PostWithAuthor[];
  isLoggedIn: boolean;
}

export function HotPage({ 
  initialPosts, 
  initialHotPosts,
  isLoggedIn,
}: HotPageProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");
  const [posts, setPosts] = useState<PostWithAuthor[]>(initialPosts);
  const [hotPosts, setHotPosts] = useState<PostWithAuthor[]>(initialHotPosts);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(() => new Set());
  const [activeTab, setActiveTab] = useState<HotTabType>("hot");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth_required") === "true") {
      setShowAuthModal(true);
      setAuthModalMode("login");
    }
  }, []);

  const handleAuthSuccess = useCallback(() => {
    setShowAuthModal(false);
    window.location.reload();
  }, []);

  const openAuthModal = useCallback((mode: "login" | "register") => {
    setShowAuthModal(true);
    setAuthModalMode(mode);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const endpoint = activeTab === "hot" ? "/api/posts/hot" : "/api/posts";
      const response = await fetch(endpoint);
      const data = await response.json();
      if (data.posts) {
        if (activeTab === "hot") {
          setHotPosts(data.posts);
        } else {
          setPosts(data.posts);
        }
      }
    } catch (error) {
      console.error("Failed to refresh:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  const handlePostLike = useCallback(async (postId: string) => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
      setAuthModalMode("login");
      return;
    }

    const isCurrentlyLiked = likedPosts.has(postId);
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
  }, [isLoggedIn, likedPosts]);

  const displayPosts = useMemo((): PostWithAuthor[] => {
    return activeTab === "hot" ? hotPosts : posts;
  }, [activeTab, hotPosts, posts]);

  const renderHotPost = useCallback((post: PostWithAuthor, index: number) => {
    const heatScore = getHeatScore(post);
    const isLiked = likedPosts.has(post.id);
    const rankColors = [
      "bg-red-500 text-white",
      "bg-orange-500 text-white",
      "bg-amber-500 text-white",
    ];
    const rankColor = index < 3 ? rankColors[index] : "bg-slate-100 text-slate-500";

    return (
      <Link key={post.id} href={`/post/${post.id}`} className="block">
        <div className="flex gap-4 p-4 rounded-lg bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className={cn(
            "shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
            rankColor
          )}>
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate mb-1">
              {post.title}
            </h3>
            <p className="text-sm text-slate-500 line-clamp-2 mb-2">
              {post.content}
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="font-medium text-brand-blue">
                {post.author_name || "匿名"}
              </span>
              <span className="flex items-center gap-1">
                <Heart className={cn("h-3.5 w-3.5", isLiked ? "text-red-500 fill-current" : "")} />
                {post.likes_count}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5" />
                {post.comments_count}
              </span>
              <span className="flex items-center gap-1 text-brand-orange font-medium">
                <Flame className="h-3.5 w-3.5" />
                {heatScore}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }, [likedPosts]);

  const renderLatestPost = useCallback((post: PostWithAuthor, index: number) => {
    const isLiked = likedPosts.has(post.id);
    const isLast = index === displayPosts.length - 1;

    return (
      <Link key={post.id} href={`/post/${post.id}`} className="block">
        <div className="flex gap-4 relative">
          <div className="flex flex-col items-center">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-blue shrink-0 mt-1.5" />
            {!isLast && (
              <div className="w-px flex-1 bg-slate-200 mt-1" />
            )}
          </div>
          <div className={cn("flex-1 min-w-0 pb-5", isLast && "pb-0")}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(post.created_at)}
              </span>
              <span className="text-xs text-brand-blue font-medium">
                {post.author_name || "匿名"}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              {post.title}
            </h3>
            <p className="text-xs text-slate-500 line-clamp-1">
              {post.content}
            </p>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Heart className={cn("h-3 w-3", isLiked ? "text-red-500 fill-current" : "")} />
                {post.likes_count}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {post.comments_count}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }, [likedPosts, displayPosts.length]);

  const renderContent = useMemo(() => {
    if (displayPosts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-slate-50 p-8 mb-5">
            <Inbox className="h-16 w-16 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {activeTab === "hot" ? "暂无热门帖子" : "这里还空空如也"}
          </h3>
          <p className="text-slate-500 mb-6 max-w-xs">
            {activeTab === "hot" 
              ? "快去给喜欢的帖子点个赞吧，让好内容被更多人看到 🔥" 
              : "成为第一个分享想法的人吧！🎉"}
          </p>
        </div>
      );
    }

    if (activeTab === "hot") {
      return (
        <div className="space-y-3">
          {displayPosts.map((post, index) => renderHotPost(post, index))}
        </div>
      );
    }

    return (
      <div className="py-2">
        {displayPosts.map((post, index) => renderLatestPost(post, index))}
      </div>
    );
  }, [displayPosts, activeTab, renderHotPost, renderLatestPost]);

  const handleAuthModalClose = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  return (
    <main className="min-h-screen pb-20">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-brand-orange">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">热门广场</h1>
          </div>
        </div>

        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              role="tab"
              aria-selected={activeTab === "hot"}
              onClick={() => setActiveTab("hot")}
              className={cn(
                "pb-2 text-sm font-semibold transition-colors relative",
                activeTab === "hot"
                  ? "text-brand-orange"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <span className="flex items-center gap-1.5">
                <Flame className="h-4 w-4" />
                最热
              </span>
              {activeTab === "hot" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-orange rounded-full" />
              )}
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "latest"}
              onClick={() => setActiveTab("latest")}
              className={cn(
                "pb-2 text-sm font-semibold transition-colors relative",
                activeTab === "latest"
                  ? "text-brand-blue"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                最新
              </span>
              {activeTab === "latest" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-blue rounded-full" />
              )}
            </button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
            className="text-slate-500"
          >
            <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
          </Button>
        </div>

        {renderContent}
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={handleAuthModalClose}
        defaultMode={authModalMode}
        onSuccess={handleAuthSuccess}
      />

      {!isLoggedIn && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-slate-100 bg-white/90 backdrop-blur-md px-4 pt-4 md:hidden" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <p className="text-xs text-slate-600">加入友料，开始你的社区之旅</p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => openAuthModal("login")}>
                登录
              </Button>
              <Button variant="primary" size="sm" onClick={() => openAuthModal("register")}>
                注册
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
