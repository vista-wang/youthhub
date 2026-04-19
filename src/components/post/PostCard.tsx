"use client";

import { memo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, formatRelativeTime, truncateText } from "@/lib/utils";
import type { PostWithAuthor } from "@/types/database";

interface PostCardProps {
  post: PostWithAuthor;
  isLiked?: boolean;
  onLike?: (postId: string) => void;
  showFullContent?: boolean;
}

function PostCardInner({ 
  post, 
  isLiked = false, 
  onLike,
  showFullContent = false 
}: PostCardProps) {
  const router = useRouter();

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onLike?.(post.id);
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card className="group card-hover shadow-sm overflow-hidden">
      <article
        onClick={() => router.push(`/post/${post.id}`)}
        className="cursor-pointer"
      >
        <CardContent className="p-4 md:p-5">
          <div className="flex items-start gap-3">
            <Avatar
              src={post.author_avatar}
              alt={post.author_name}
              size="md"
              className="shrink-0 ring-2 ring-slate-100"
            />
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-gray-900 hover:text-brand-blue transition-colors">
                  {post.author_name}
                </span>
                <span className="text-[10px] font-bold text-brand-blue bg-brand-blue/10 px-1.5 py-0.5 rounded-full">
                  Lv{post.author_level}
                </span>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(post.created_at)}
                </div>
              </div>
              
              <h3 className="mt-1.5 text-base font-semibold text-gray-900 line-clamp-2 group-hover:text-brand-blue transition-colors">
                <Link href={`/post/${post.id}`} onClick={(e) => e.stopPropagation()}>
                  {post.title}
                </Link>
              </h3>
              
              <p className="mt-1.5 text-sm text-gray-600 line-clamp-2 leading-relaxed">
                {showFullContent 
                  ? post.content 
                  : truncateText(post.content, 120)
                }
              </p>
              {post.image_urls && post.image_urls.length > 0 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {post.image_urls.slice(0, 3).map((url, i) => (
                    <div key={`img-${i}`} className="shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-slate-100">
                      <img
                        src={url}
                        alt={`图片 ${i + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                  {post.image_urls.length > 3 && (
                    <div key="img-more" className="shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center">
                      <span className="text-sm text-slate-400">+{post.image_urls.length - 3}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </article>
      
      <div className="flex items-center justify-between border-t border-slate-50 bg-white px-4 py-2.5 md:px-5">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            aria-pressed={isLiked}
            aria-label={isLiked ? "取消点赞" : "点赞"}
            className={cn(
              "flex items-center gap-1.5 text-sm transition-all duration-200",
              isLiked
                ? "text-red-500"
                : post.likes_count > 50
                  ? "text-red-500/60 hover:text-red-500"
                  : "text-slate-400 hover:text-red-400"
            )}
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isLiked && "fill-current scale-110"
              )}
            />
            <span>{post.likes_count}</span>
          </button>
          
          <Link
            href={`/post/${post.id}`}
            onClick={handleCommentClick}
            aria-label="评论"
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-brand-blue transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{post.comments_count}</span>
          </Link>
        </div>
        
        {post.comments_count > 10 && (
          <Badge variant="warning" className="text-xs bg-brand-orange text-white border-brand-orange">
            热门
          </Badge>
        )}
      </div>
    </Card>
  );
}

export const PostCard = memo(PostCardInner);
