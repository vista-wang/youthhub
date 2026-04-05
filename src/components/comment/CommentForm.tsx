"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { cn, validateCommentContent, checkSensitiveWords } from "@/lib/utils";

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  submitText?: string;
  className?: string;
  autoFocus?: boolean;
}

export function CommentForm({
  onSubmit,
  placeholder = "写下你的评论...",
  submitText = "发表评论",
  className,
  autoFocus = false,
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmojiSelect = (emoji: string) => {
    setContent((prev) => prev + emoji);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validateCommentContent(content);
    if (!validation.isValid) {
      setError(validation.error || "评论内容不合法");
      return;
    }

    const { hasSensitiveWords, foundWords } = checkSensitiveWords(content);
    if (hasSensitiveWords) {
      setError(`内容包含敏感词：${foundWords.join("、")}，请修改后重试`);
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(content.trim());
      setContent("");
    } catch (err) {
      setError("评论发表失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  const remainingChars = 500 - content.length;

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-3", className)}>
      <div className="relative">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          maxLength={500}
          className="min-h-[100px] pr-12"
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {error && (
            <span className="text-xs text-red-500">{error}</span>
          )}
          <span
            className={cn(
              "text-xs",
              remainingChars < 50
                ? "text-red-400"
                : "text-slate-400"
            )}
          >
            {remainingChars}
          </span>
        </div>
        
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={isLoading || !content.trim()}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              发表中...
            </>
          ) : (
            submitText
          )}
        </Button>
      </div>

      <p className="text-xs text-slate-400">
        💡 请友善发言，共同维护温暖社区
      </p>
    </form>
  );
}
