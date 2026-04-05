"use client";

import Link from "next/link";
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

export function PostCard({ 
  post, 
  isLiked = false, 
  onLike,
  showFullContent = false 
}: PostCardProps) {
  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onLike?.(post.id);
  };

  return (
    <Card className="group card-hover brand-shadow overflow-hidden">
      <Link href={`/post/${post.id}`}>
        <CardContent className="p-4 md:p-5">
          <div className="flex items-start gap-3">
            <Avatar
              src={post.author_avatar}
              alt={post.author_name}
              size="md"
              className="shrink-0 ring-2 ring-brand-blue/20"
            />
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-gray-900 hover:text-brand-blue transition-colors">
                  {post.author_name}
                </span>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(post.created_at)}
                </div>
              </div>
              
              <h3 className="mt-1.5 text-base font-semibold text-gray-900 line-clamp-2 group-hover:text-brand-blue transition-colors">
                {post.title}
              </h3>
              
              <p className="mt-1.5 text-sm text-gray-600 line-clamp-2 leading-relaxed">
                {showFullContent 
                  ? post.content 
                  : truncateText(post.content, 120)
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Link>
      
      <div className="flex items-center justify-between border-t border-slate-50 bg-slate-50/50 px-4 py-2.5 md:px-5">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={cn(
              "flex items-center gap-1.5 text-sm transition-all duration-200",
              isLiked
                ? "text-red-500"
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
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-brand-blue transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{post.comments_count}</span>
          </Link>
        </div>
        
        {post.comments_count > 10 && (
          <Badge variant="default" className="text-xs">
            热门
          </Badge>
        )}
      </div>
    </Card>
  );
}
