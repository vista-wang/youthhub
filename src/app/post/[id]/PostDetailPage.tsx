"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Clock, 
  Heart, 
  MessageCircle, 
  Share2
} from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui";
import { Card, CardContent } from "@/components/ui/card";
import { CommentForm } from "@/components/comment/CommentForm";
import { CommentItem } from "@/components/comment/CommentItem";
import { AuthModal } from "@/components/auth";
import { formatRelativeTime, cn } from "@/lib/utils";
import { usePostLike } from "@/lib/hooks";
import type { PostWithAuthor, CommentWithAuthor } from "@/types/database";

interface PostDetailPageProps {
  post: PostWithAuthor;
  comments: CommentWithAuthor[];
  isLoggedIn: boolean;
  currentUserId?: string;
  isLiked: boolean;
}

export function PostDetailPage({
  post,
  comments: initialComments,
  isLoggedIn,
  currentUserId,
  isLiked: initialIsLiked,
}: PostDetailPageProps) {
  const router = useRouter();
  const [comments, setComments] = useState<CommentWithAuthor[]>(initialComments);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { isLiked, count: likesCount, handleLike } = usePostLike({
    postId: post.id,
    initialIsLiked,
    initialCount: post.likes_count,
    isLoggedIn,
    onAuthRequired: () => setShowAuthModal(true),
  });

  const handleCommentSubmit = async (content: string) => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
      throw new Error("请先登录");
    }

    const response = await fetch(`/api/posts/${post.id}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error("评论发表失败");
    }

    const data = await response.json();
    
    setComments((prev) => [
      ...prev,
      {
        ...data.comment,
        author_name: data.comment.author_name || "你",
        author_avatar: data.comment.author_avatar,
      },
    ]);

    router.refresh();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.content.slice(0, 100),
          url: window.location.href,
        });
      } catch (error) {
        console.log("Share cancelled");
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert("链接已复制到剪贴板");
    }
  };

  return (
    <main className="min-h-screen pb-10">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-gray-500">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-medium text-gray-900">帖子详情</h1>
        </div>

        <Card className="dopamine-shadow mb-6">
          <CardContent className="p-5 md:p-6">
            <div className="flex items-start gap-3 mb-4">
              <Avatar
                src={post.author_avatar}
                alt={post.author_name}
                size="lg"
                className="shrink-0 ring-2 ring-dopamine-pink/20"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900">
                    {post.author_name}
                  </span>
                  {currentUserId === post.author_id && (
                    <Badge variant="default">楼主</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span>{formatRelativeTime(post.created_at)}</span>
                  {post.updated_at !== post.created_at && (
                    <span className="text-gray-300">· 已编辑</span>
                  )}
                </div>
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
              {post.title}
            </h2>

            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleLike}
                  className={cn(
                    "flex items-center gap-1.5 text-sm transition-all duration-200",
                    isLiked
                      ? "text-dopamine-pink"
                      : "text-gray-400 hover:text-dopamine-pink"
                  )}
                >
                  <Heart
                    className={cn(
                      "h-5 w-5 transition-transform duration-200",
                      isLiked && "fill-current scale-110"
                    )}
                  />
                  <span className="font-medium">{likesCount}</span>
                </button>

                <div className="flex items-center gap-1.5 text-sm text-gray-400">
                  <MessageCircle className="h-5 w-5" />
                  <span>{comments.length}</span>
                </div>
              </div>

              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-dopamine-blue transition-colors"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-dopamine-blue" />
            评论 ({comments.length})
          </h3>
        </div>

        {isLoggedIn ? (
          <Card className="mb-6 dopamine-shadow">
            <CardContent className="p-4">
              <CommentForm
                onSubmit={handleCommentSubmit}
                placeholder="写下你的评论..."
                submitText="发表评论"
              />
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6 border-dopamine-pink/20 bg-gradient-to-r from-dopamine-pink/5 to-dopamine-purple/5">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-gray-600 mb-3">
                登录后参与讨论
              </p>
              <Button
                variant="dopamine"
                size="sm"
                onClick={() => setShowAuthModal(true)}
              >
                登录 / 注册
              </Button>
            </CardContent>
          </Card>
        )}

        {comments.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <div className="rounded-full bg-gray-100 w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">
                暂无评论，快来抢沙发吧！
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="divide-y divide-gray-100">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  postAuthorId={post.author_id}
                />
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode="login"
        onSuccess={() => router.refresh()}
      />
    </main>
  );
}
