"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  LogOut, 
  FileText, 
  Loader2,
  PenSquare,
  Star,
  Coins,
  Trophy,
  Crown,
  Gift,
  Camera
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PostCard } from "@/components/post";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { getLevelInfo } from "@/types/database";
import type { PostWithAuthor } from "@/types/database";

interface UserProfile {
  username: string;
  avatar_url: string | null;
  bio: string | null;
  points: number;
  experience: number;
  level: number;
  is_premium: boolean;
  premium_expires_at: string | null;
}

interface ProfilePageProps {
  profile: UserProfile | null;
  posts: PostWithAuthor[];
  likedPostIds: Set<string>;
  isLoggedIn: boolean;
}

type ProfileTab = "posts" | "exchange" | "premium";

export function ProfilePage({ profile, posts, likedPostIds, isLoggedIn }: ProfilePageProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.url) {
        setAvatarUrl(data.url);
      }
    } catch (error) {
      console.error("Failed to upload avatar:", error);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  const levelInfo = getLevelInfo(profile.experience);

  const tabs = [
    { key: "posts" as ProfileTab, label: "我的帖子", icon: FileText },
    { key: "exchange" as ProfileTab, label: "点数兑换", icon: Gift },
    { key: "premium" as ProfileTab, label: "高级用户", icon: Crown },
  ];

  return (
    <main className="min-h-screen pb-10">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Card className="shadow-sm mb-6 overflow-hidden">
          <div className="h-24 bg-brand-blue relative">
            {profile.is_premium && (
              <div className="absolute top-3 right-3">
                <Badge className="bg-amber-500 text-white border-amber-500 flex items-center gap-1">
                  <Crown className="h-3 w-3" />
                  高级用户
                </Badge>
              </div>
            )}
          </div>
          <CardContent className="pt-0 pb-6">
            <div className="flex flex-col items-center -mt-12">
              <div className="relative group">
                <Avatar
                  src={avatarUrl}
                  alt={profile.username}
                  size="lg"
                  className="ring-4 ring-white shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 bg-brand-blue text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  Lv{profile.level}
                </div>
                <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 group-hover:bg-black/30 transition-colors cursor-pointer">
                  {isUploadingAvatar ? (
                    <Loader2 className="h-6 w-6 text-white animate-spin opacity-0 group-hover:opacity-100" />
                  ) : (
                    <Camera className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={isUploadingAvatar}
                  />
                </label>
              </div>
              <h1 className="mt-4 text-xl font-bold text-gray-900">
                {profile.username}
              </h1>
              {profile.bio && (
                <p className="mt-2 text-sm text-slate-500 text-center max-w-md">
                  {profile.bio}
                </p>
              )}

              <div className="mt-4 w-full grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg bg-blue-50/50">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Coins className="h-4 w-4 text-brand-blue" />
                    <span className="text-lg font-bold text-gray-900">{profile.points}</span>
                  </div>
                  <span className="text-xs text-slate-500">点数</span>
                </div>
                <div className="text-center p-3 rounded-lg bg-amber-50/50">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <span className="text-lg font-bold text-gray-900">{profile.experience}</span>
                  </div>
                  <span className="text-xs text-slate-500">经验值</span>
                </div>
                <div className="text-center p-3 rounded-lg bg-green-50/50">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star className="h-4 w-4 text-brand-green" />
                    <span className="text-lg font-bold text-gray-900">Lv{profile.level}</span>
                  </div>
                  <span className="text-xs text-slate-500">等级</span>
                </div>
              </div>

              <div className="mt-3 w-full">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>经验值 {profile.experience} / {levelInfo.nextLevelExp}</span>
                  <span>下一级: Lv{profile.level + 1}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-blue rounded-full transition-all duration-500"
                    style={{ width: `${levelInfo.progress * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="mt-4 flex items-center gap-3">
                <Link href="/create">
                  <Button variant="primary" size="sm">
                    <PenSquare className="mr-1.5 h-4 w-4" />
                    发布帖子
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="text-slate-500"
                >
                  {isLoggingOut ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-4 flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center",
                activeTab === tab.key
                  ? "bg-white text-brand-blue shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "posts" && (
          <>
            {posts.length === 0 ? (
              <Card className="border-dashed border-slate-200">
                <CardContent className="py-12 text-center">
                  <div className="rounded-full bg-slate-50 w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <FileText className="h-6 w-6 text-slate-300" />
                  </div>
                  <p className="text-slate-500 text-sm mb-4">
                    还没有发布过帖子
                  </p>
                  <Link href="/create">
                    <Button variant="primary" size="sm">
                      发布第一篇帖子
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} isLiked={likedPostIds.has(post.id)} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "exchange" && (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="rounded-full bg-slate-50 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Gift className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">点数兑换</h3>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                即将上线！用你的点数兑换精彩好礼 🎁
              </p>
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                <Coins className="h-4 w-4" />
                当前点数: {profile.points}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "premium" && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 mb-4">
                  <Crown className="h-8 w-8 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">高级用户</h3>
                <p className="text-sm text-slate-500">
                  解锁更多专属特权，提升你的社区体验
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {[
                  "发布帖子获得双倍经验值",
                  "专属高级用户标识",
                  "点数获取速度 +50%",
                  "优先展示你的内容",
                ].map((perk, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                    <div className="w-6 h-6 rounded-full bg-brand-green flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-700">{perk}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-lg bg-amber-50/50 border border-amber-100 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">月度订阅</p>
                    <p className="text-xs text-slate-500">每月自动续费</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">¥10</p>
                    <p className="text-xs text-slate-500">/月</p>
                  </div>
                </div>
              </div>

              {profile.is_premium ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-green-50 border border-green-100 text-center">
                    <p className="text-sm text-brand-green font-medium">
                      ✨ 你已是高级用户
                    </p>
                    {profile.premium_expires_at && (
                      <p className="text-xs text-slate-500 mt-1">
                        到期时间: {new Date(profile.premium_expires_at).toLocaleDateString("zh-CN")}
                      </p>
                    )}
                  </div>
                  <Button variant="outline" className="w-full" disabled>
                    续费订阅
                  </Button>
                </div>
              ) : (
                <Button variant="primary" className="w-full" disabled>
                  <Crown className="mr-2 h-4 w-4" />
                  开通高级用户
                </Button>
              )}

              <p className="text-xs text-slate-400 text-center mt-3">
                开通即获 +5 点数和经验值
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
