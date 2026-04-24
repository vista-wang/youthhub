"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Loader2, Sparkles, ImagePlus, FileUp, X, FileText, Film, Music, Archive } from "lucide-react";
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

const MAX_IMAGES = 4;
const MAX_ATTACHMENTS = 4;

interface AttachmentInfo {
  url: string;
  type: "image" | "file";
  name: string;
  mimeType: string;
}

interface UploadedFileMeta {
  url: string;
  type?: "image" | "file";
  name?: string;
  mimeType?: string;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("video/")) return Film;
  if (mimeType.startsWith("audio/")) return Music;
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("7z")) return Archive;
  return FileText;
}

export function CreatePostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<AttachmentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [sensitiveWarning, setSensitiveWarning] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTitleEmojiSelect = (emoji: string) => {
    setTitle((prev) => prev + emoji);
  };

  const handleContentEmojiSelect = (emoji: string) => {
    setContent((prev) => prev + emoji);
  };

  const uploadFiles = async (filesToUpload: File[]): Promise<UploadedFileMeta[]> => {
    const uploaded: UploadedFileMeta[] = [];
    const failedNames: string[] = [];
    setIsUploading(true);
    setUploadStatus(`正在上传 ${filesToUpload.length} 个文件...`);
    try {
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload/attachment", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          failedNames.push(file.name);
          continue;
        }

        const data = await response.json();
        if (data.url) {
          uploaded.push({
            url: data.url,
            type: data.type,
            name: data.name ?? file.name,
            mimeType: data.mimeType ?? file.type,
          });
        } else {
          failedNames.push(file.name);
        }
      }

      if (failedNames.length > 0) {
        setErrors((prev) => [
          ...prev,
          `以下文件上传失败：${failedNames.join("、")}`,
        ]);
      }

      return uploaded;
    } catch {
      setErrors((prev) => [...prev, "上传失败，请检查网络后重试"]);
      return uploaded;
    } finally {
      setIsUploading(false);
      setUploadStatus(null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrors([]);
    const remaining = MAX_IMAGES - imageUrls.length;
    if (remaining <= 0) return;

    const filesToUpload = Array.from(files).slice(0, remaining);
    const uploaded = await uploadFiles(filesToUpload);
    const newUrls = uploaded
      .filter((item) => item.url)
      .map((item) => item.url);
    if (newUrls.length > 0) {
      setImageUrls((prev) => [...prev, ...newUrls]);
    }

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrors([]);
    const remaining = MAX_ATTACHMENTS - attachments.length;
    if (remaining <= 0) return;

    const filesToUpload = Array.from(files).slice(0, remaining);
    const uploaded = await uploadFiles(filesToUpload);
    const newAttachments: AttachmentInfo[] = uploaded
      .filter((item): item is Required<UploadedFileMeta> => Boolean(item.url && item.type && item.name && item.mimeType))
      .map((item) => ({
        url: item.url,
        type: item.type,
        name: item.name,
        mimeType: item.mimeType,
      }));

    if (newAttachments.length > 0) {
      setAttachments((prev) => [...prev, ...newAttachments]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
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
          image_urls: imageUrls,
          attachment_urls: attachments.map((a) => a.url),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
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

        <Card className="elevated-shadow">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  图片（最多 {MAX_IMAGES} 张）
                </label>
                <div className="flex flex-wrap gap-3">
                  {imageUrls.map((url, index) => (
                    <div key={url} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200">
                      <Image
                        src={url}
                        alt={`图片 ${index + 1}`}
                        width={96}
                        height={96}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {imageUrls.length < MAX_IMAGES && (
                    <label className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-brand-blue hover:bg-blue-50/50 transition-colors">
                      {isUploading ? (
                        <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
                      ) : (
                        <>
                          <ImagePlus className="h-6 w-6 text-slate-400" />
                          <span className="text-[10px] text-slate-400 mt-1">
                            {imageUrls.length}/{MAX_IMAGES}
                          </span>
                        </>
                      )}
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleImageUpload}
                        className="hidden"
                        multiple
                        disabled={isUploading}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  附件（最多 {MAX_ATTACHMENTS} 个）
                </label>
                {attachments.length > 0 && (
                  <div className="space-y-2 mb-2">
                    {attachments.map((att, index) => {
                      const Icon = getFileIcon(att.mimeType);
                      return (
                        <div key={att.url} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                          <Icon className="h-5 w-5 text-slate-400 shrink-0" />
                          <span className="text-sm text-gray-700 truncate flex-1">{att.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(index)}
                            className="shrink-0 w-5 h-5 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {attachments.length < MAX_ATTACHMENTS && (
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-slate-200 cursor-pointer hover:border-brand-blue hover:bg-blue-50/50 transition-colors">
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
                    ) : (
                      <FileUp className="h-4 w-4 text-slate-400" />
                    )}
                    <span className="text-sm text-slate-500">
                      上传文件（PDF/Word/视频/音频/压缩包等）
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.md,.mp4,.webm,.mov,.mp3,.wav,.ogg,.zip,.rar,.7z"
                      onChange={handleFileUpload}
                      className="hidden"
                      multiple
                      disabled={isUploading}
                    />
                  </label>
                )}
              </div>

              {uploadStatus && (
                <div aria-live="polite" className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-2 text-sm text-slate-600">
                  {uploadStatus}
                </div>
              )}

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

              <div className="rounded-lg bg-blue-50/50 border border-blue-100 px-4 py-3">
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
                  disabled={isLoading || isUploading || !title.trim() || !content.trim()}
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
