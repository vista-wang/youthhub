"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Inbox, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PostCard, RecommendedPosts } from "@/components/post";
import { WeeklyTopicCard } from "@/components/topic";
import { Button } from "@/components/ui";
import { AuthModal } from "@/components/auth";
import { useHomePage } from "@/lib/hooks";
import type { PostWithAuthor, WeeklyTopic } from "@/types/database";

interface HomePageProps {
  initialPosts: PostWithAuthor[];
  initialWeeklyTopic: WeeklyTopic | null;
  initialRecommendedPosts: PostWithAuthor[];
  initialUserKeywords: string[];
  initialLikedPostIds?: string[];
  isLoggedIn: boolean;
  currentUserId?: string;
}

export function HomePage({ 
  initialPosts, 
  initialWeeklyTopic,
  initialRecommendedPosts,
  initialUserKeywords,
  initialLikedPostIds = [],
  isLoggedIn,
}: HomePageProps) {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");

  const {
    posts,
    recommendedPosts,
    userKeywords,
    likedPosts,
    isLoading,
    handleRefreshRecommended,
    handleLike,
  } = useHomePage({
    initialPosts,
    initialRecommendedPosts,
    initialUserKeywords,
    initialLikedPostIds,
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
    router.refresh();
  }, [router]);

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

  const displayPosts = useMemo((): PostWithAuthor[] => {
    if (isLoggedIn) {
      return recommendedPosts.length > 0 ? recommendedPosts : posts;
    }
    return posts;
  }, [posts, recommendedPosts, isLoggedIn]);

  const renderPosts = useMemo(() => {
    if (displayPosts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-slate-50 p-8 mb-5">
            <Inbox className="h-16 w-16 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isLoggedIn ? "暂无推荐内容" : "这里还空空如也"}
          </h3>
          <p className="text-slate-500 mb-6 max-w-xs">
            {isLoggedIn 
              ? "多浏览和点赞，我们会越来越懂你 ✨" 
              : "加入我们，成为第一个分享想法的人吧！🎉"}
          </p>
          {isLoggedIn ? (
            <Link href="/create">
              <Button variant="primary">发布第一篇帖子</Button>
            </Link>
          ) : (
            <Button variant="primary" onClick={() => openAuthModal("register")}>
              注册并发布
            </Button>
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
  }, [displayPosts, isLoggedIn, likedPosts, handlePostLike, openAuthModal]);

  const handleWeeklyTopicParticipate = useCallback(() => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
      setAuthModalMode("login");
    } else {
      router.push("/create");
    }
  }, [isLoggedIn, router]);

  const handleAuthModalClose = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  return (
    <main className="min-h-screen pb-20">
      <div className="mx-auto max-w-3xl px-4 py-6">
        {initialWeeklyTopic && (
          <div className="mb-4">
            <WeeklyTopicCard 
              topic={initialWeeklyTopic}
              onParticipate={handleWeeklyTopicParticipate}
            />
          </div>
        )}

        {isLoggedIn && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-brand-blue">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">为你推荐</h2>
            </div>
            <RecommendedPosts
              posts={recommendedPosts}
              likedPostIds={likedPosts}
              onLike={handlePostLike}
              onRefresh={handleRefreshRecommended}
              userKeywords={userKeywords}
            />
          </div>
        )}

        {renderPosts}
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
