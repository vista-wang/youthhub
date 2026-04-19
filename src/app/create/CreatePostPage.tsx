"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { Card, CardContent } from "@/components/ui/card";
import { 
  validatePostContent, 
  checkSensitiveWords,
  cn 
} from "@/lib/utils";

export function CreatePostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [sensitiveWarning, setSensitiveWarning] = useState<string | null>(null);

  const handleTitleEmojiSelect = (emoji: string) => {
    setTitle((prev) => prev + emoji);
  };

  const handleContentEmojiSelect = (emoji: string) => {
    setContent((prev) => prev + emoji);
  };

  const checkContent = () => {
    const { hasSensitiveWords, foundWords } = checkSensitiveWords(title + content);
    if (hasSensitiveWords) {
      setSensitiveWarning(`检测到敏感词：${foundWords.join("、")}`);
    } else {
      setSensitiveWarning(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setSensitiveWarning(null);

    const validation = validatePostContent(title, content);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    const { hasSensitiveWords, foundWords } = checkSensitiveWords(title + content);
    if (hasSensitiveWords) {
      setSensitiveWarning(`内容包含敏感词：${foundWords.join("、")}，请修改后重试`);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // 处理新的错误响应格式
        const errorMessages: string[] = [];
        if (data.details && Array.isArray(data.details)) {
          errorMessages.push(...data.details);
        } else if (data.message) {
          errorMessages.push(data.message);
        } else {
          errorMessages.push("发帖失败，请稍后重试");
        }
        setErrors(errorMessages);
        return;
      }

      router.push(`/post/${data.post.id}`);
      router.refresh();
    } catch (error) {
      setErrors(["网络错误，请稍后重试"]);
    } finally {
      setIsLoading(false);
    }
  };

  const titleRemaining = 100 - title.length;
  const contentRemaining = 5000 - content.length;

  return (
    <main className="min-h-screen pb-10">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-slate-500">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              发布新帖 ✍️
            </h1>
            <p className="text-sm text-slate-500">
              分享你的想法和故事
            </p>
          </div>
        </div>

        <Card className="brand-shadow">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标题
                </label>
                <div className="relative">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={checkContent}
                    placeholder="给你的帖子起个标题..."
                    maxLength={100}
                    className="pr-20"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <EmojiPicker 
                      onEmojiSelect={handleTitleEmojiSelect} 
                    />
                    <span
                      aria-live="polite"
                      className={cn(
                        "text-xs",
                        titleRemaining < 20 ? "text-red-400" : "text-slate-400"
                      )}
                    >
                      {titleRemaining}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  内容
                </label>
                <div className="relative">
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onBlur={checkContent}
                    placeholder="分享你的想法、故事或者问题..."
                    maxLength={5000}
                    className="min-h-[200px] pr-12"
                  />
                  <div className="absolute bottom-2 right-2 flex items-center gap-1">
                    <EmojiPicker onEmojiSelect={handleContentEmojiSelect} />
                  </div>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    支持 Markdown 格式
                  </span>
                  <span
                    aria-live="polite"
                    className={cn(
                      "text-xs",
                      contentRemaining < 100 ? "text-red-400" : "text-slate-400"
                    )}
                  >
                    {contentRemaining} 字符剩余
                  </span>
                </div>
              </div>

              {sensitiveWarning && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
                  ⚠️ {sensitiveWarning}
                </div>
              )}

              {errors.length > 0 && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                  {errors.map((error, index) => (
                    <p key={index} className="text-sm text-red-600">
                      {error}
                    </p>
                  ))}
                </div>
              )}

              <div className="rounded-lg bg-gradient-to-r from-brand-blue/5 to-brand-teal/5 border border-brand-blue/20 px-4 py-3">
                <p className="text-sm text-gray-600">
                  💡 <span className="font-medium">温馨提示：</span>
                  请友善发言，共同维护温暖社区。禁止发布违法违规、人身攻击等内容。
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Link href="/">
                  <Button type="button" variant="ghost">
                    取消
                  </Button>
                </Link>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading || !title.trim() || !content.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      发布中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-1.5 h-4 w-4" />
                      发布帖子
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
