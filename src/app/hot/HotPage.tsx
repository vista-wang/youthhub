"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, RefreshCw, Inbox, Home, Flame } from "lucide-react";
import Link from "next/link";
import { PostCard } from "@/components/post";
import { Button } from "@/components/ui";
import { AuthModal } from "@/components/auth";
import { cn } from "@/lib/utils";
import type { PostWithAuthor, WeeklyTopic } from "@/types/database";

type HotTabType = "latest" | "hot";

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
  const [activeTab, setActiveTab] = useState<HotTabType>("latest");
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

  const handleRefreshLatest = useCallback(async () => {
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
    setIsLoading(true);
    try {
      const response = await fetch("/api/posts/hot");
      const data = await response.json();
      if (data.posts) {
        setHotPosts(data.posts);
      }
    } catch (error) {
      console.error("Failed to refresh hot posts:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  const handleTabClick = useCallback((tab: HotTabType) => {
    setActiveTab(tab);
  }, []);

  const tabs = useMemo<Array<{ key: HotTabType; label: string; icon: React.ReactNode }>>(() => [
    { key: "latest", label: "最新", icon: <RefreshCw className="h-4 w-4" /> },
    { key: "hot", label: "热门", icon: <Flame className="h-4 w-4" /> },
  ], []);

  const displayPosts = useMemo((): PostWithAuthor[] => {
    switch (activeTab) {
      case "hot":
        return hotPosts;
      default:
        return posts;
    }
  }, [activeTab, hotPosts, posts]);

  const renderPosts = useMemo(() => {
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
          {activeTab === "latest" && (
            isLoggedIn ? (
              <Link href="/create">
                <Button variant="primary">发布第一篇帖子</Button>
              </Link>
            ) : (
              <Button variant="primary" onClick={() => openAuthModal("register")}>
                注册并发布
              </Button>
            )
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {displayPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            isLiked={likedPosts.has(post.id)}
            onLike={handlePostLike}
          />
        ))}
      </div>
    );
  }, [displayPosts, activeTab, isLoggedIn, likedPosts, handlePostLike, openAuthModal]);

  const handleAuthModalClose = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  return (
    <main className="min-h-screen pb-20">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-brand-blue">
            <Home className="h-5 w-5" />
            <span className="font-medium">返回首页</span>
          </Link>

          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <Link href="/create">
                <Button variant="primary" size="sm" className="whitespace-nowrap">
                  <Plus className="mr-1.5 h-4 w-4" />
                  发帖
                </Button>
              </Link>
            ) : (
              <Button
                variant="primary"
                size="sm"
                className="whitespace-nowrap"
                onClick={() => openAuthModal("register")}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                发帖
              </Button>
            )}
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div role="tablist" className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={activeTab === tab.key}
                onClick={() => handleTabClick(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  activeTab === tab.key
                    ? "bg-white text-brand-blue shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={activeTab === "latest" ? handleRefreshLatest : handleRefreshHot}
              disabled={isLoading}
              className="text-slate-500"
            >
              <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {renderPosts}

        {posts.length > 0 && posts.length >= 20 && activeTab === "latest" && (
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-400">已经到底啦 ~</p>
          </div>
        )}
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
