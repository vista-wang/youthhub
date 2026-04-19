"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, RefreshCw, Inbox } from "lucide-react";
import Link from "next/link";
import { PostCard, RecommendedPosts } from "@/components/post";
import { AnnouncementsBanner } from "@/components/announcement";
import { WeeklyTopicCard } from "@/components/topic";
import { Button } from "@/components/ui";
import { AuthModal } from "@/components/auth";
import { cn } from "@/lib/utils";
import { useHomePage } from "@/lib/hooks";
import type { PostWithAuthor, Announcement, WeeklyTopic } from "@/types/database";

type TabType = "latest" | "hot" | "recommend";

interface HomePageProps {
  initialPosts: PostWithAuthor[];
  initialAnnouncements: Announcement[];
  initialWeeklyTopic: WeeklyTopic | null;
  initialHotPosts: PostWithAuthor[];
  initialRecommendedPosts: PostWithAuthor[];
  initialUserKeywords: string[];
  isLoggedIn: boolean;
  currentUserId?: string;
}

export function HomePage({ 
  initialPosts, 
  initialAnnouncements,
  initialWeeklyTopic,
  initialHotPosts,
  initialRecommendedPosts,
  initialUserKeywords,
  isLoggedIn,
}: HomePageProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");

  const {
    posts,
    hotPosts,
    recommendedPosts,
    userKeywords,
    likedPosts,
    activeTab,
    isLoading,
    setActiveTab,
    handleRefresh,
    handleLike,
    handleAddKeyword,
    handleRemoveKeyword,
  } = useHomePage({
    initialPosts,
    initialHotPosts,
    initialRecommendedPosts,
    initialUserKeywords,
  });

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

  const handlePostLike = useCallback((postId: string) => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
      setAuthModalMode("login");
    } else {
      handleLike(postId);
    }
  }, [isLoggedIn, handleLike]);

  const handleTabClick = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, [setActiveTab]);

  const tabs = useMemo<Array<{ key: TabType; label: string; icon: React.ReactNode }>>(() => [
    { key: "latest", label: "最新", icon: <RefreshCw className="h-4 w-4" /> },
    { key: "hot", label: "热门", icon: <span className="text-sm">🔥</span> },
    ...(isLoggedIn ? [{ key: "recommend" as TabType, label: "推荐", icon: <span className="text-sm">✨</span> }] : []),
  ], [isLoggedIn]);

  const displayPosts = useMemo((): PostWithAuthor[] => {
    switch (activeTab) {
      case "hot":
        return hotPosts;
      case "recommend":
        return recommendedPosts;
      default:
        return posts;
    }
  }, [activeTab, hotPosts, recommendedPosts, posts]);

  const renderPosts = useMemo(() => {
    if (displayPosts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-slate-100 p-6 mb-4">
            <Inbox className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {activeTab === "recommend" ? "暂无推荐" : "暂无帖子"}
          </h3>
          <p className="text-slate-500 mb-6">
            {activeTab === "recommend" 
              ? "添加感兴趣的关键词，获取个性化推荐" 
              : "成为第一个发帖的人吧！"}
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

  const handleWeeklyTopicParticipate = useCallback(() => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
      setAuthModalMode("login");
    } else {
      window.location.href = "/create";
    }
  }, [isLoggedIn]);

  const handleAuthModalClose = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  return (
    <main className="min-h-screen pb-20">
      <div className="mx-auto max-w-3xl px-4 py-6">
        {initialAnnouncements.length > 0 && (
          <div className="mb-4">
            <AnnouncementsBanner announcements={initialAnnouncements} />
          </div>
        )}

        {initialWeeklyTopic && (
          <div className="mb-4">
            <WeeklyTopicCard 
              topic={initialWeeklyTopic}
              onParticipate={handleWeeklyTopicParticipate}
            />
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <div role="tablist" className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={activeTab === tab.key}
                onClick={() => handleTabClick(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
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
            {activeTab === "latest" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={isLoading}
                className="text-slate-500"
              >
                <RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            )}
            
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

        {activeTab === "recommend" && isLoggedIn && (
          <div className="mb-4">
            <RecommendedPosts
              posts={recommendedPosts}
              keywords={userKeywords}
              isLoggedIn={isLoggedIn}
              onAddKeyword={handleAddKeyword}
              onRemoveKeyword={handleRemoveKeyword}
            />
          </div>
        )}

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
            <p className="text-sm text-slate-600">加入友料，开始你的社区之旅</p>
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
