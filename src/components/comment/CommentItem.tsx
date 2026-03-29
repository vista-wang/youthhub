"use client";

import { Clock } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { LikeButton } from "@/components/ui/like-button";
import { formatRelativeTime } from "@/lib/utils";
import type { CommentWithAuthor } from "@/types/database";

interface CommentItemProps {
  comment: CommentWithAuthor;
  postAuthorId?: string;
}

export function CommentItem({ comment, postAuthorId }: CommentItemProps) {
  const isPostAuthor = postAuthorId === comment.author_id;

  return (
    <div className="group flex gap-3 py-4">
      <Avatar
        src={comment.author_avatar}
        alt={comment.author_name}
        size="sm"
        className="shrink-0"
      />
      
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900 text-sm">
            {comment.author_name}
          </span>
          {isPostAuthor && (
            <span className="text-xs text-dopamine-pink bg-dopamine-pink/10 px-1.5 py-0.5 rounded">
              楼主
            </span>
          )}
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="h-3 w-3" />
            {formatRelativeTime(comment.created_at)}
          </div>
        </div>
        
        <p className="mt-1.5 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {comment.content}
        </p>
        
        <div className="mt-2 flex items-center gap-4">
          <LikeButton
            initialCount={comment.likes_count}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
}
