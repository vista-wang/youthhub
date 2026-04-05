"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Megaphone, 
  Sparkles, 
  Info, 
  Home,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import type { Announcement } from "@/components/layout/AnnouncementModal";

const TYPE_CONFIG = {
  info: { icon: Info, color: "text-dopamine-blue bg-dopamine-blue/10", label: "通知" },
  important: { icon: Sparkles, color: "text-dopamine-orange bg-dopamine-orange/10", label: "重要" },
  update: { icon: Megaphone, color: "text-dopamine-green bg-dopamine-green/10", label: "更新" },
  event: { icon: Sparkles, color: "text-dopamine-pink bg-dopamine-pink/10", label: "活动" },
};

export function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnnouncements() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/announcements");
        if (response.ok) {
          const data = await response.json();
          setAnnouncements(data.announcements || []);
        } else {
          setError("加载失败，请稍后重试");
        }
      } catch (err) {
        setError("网络错误");
      } finally {
        setIsLoading(false);
      }
    }

    loadAnnouncements();
  }, []);

  return (
    <main className="min-h-screen pb-10">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-gray-500">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Megaphone className="h-6 w-6 text-dopamine-purple" />
              系统公告
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              了解社区最新动态和重要通知
            </p>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <Badge variant="default" className="bg-gradient-to-r from-dopamine-purple/10 to-dopamine-pink/10 text-dopamine-purple border-dopamine-purple/20">
            共 {announcements.length} 条公告
          </Badge>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.reload()}
            disabled={isLoading}
            className="text-gray-500"
          >
            刷新
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200" />
                    <div className="space-y-2 flex-1">
                      <div className="h-5 w-32 rounded bg-gray-200" />
                      <div className="h-3 w-20 rounded bg-gray-100" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-full rounded bg-gray-100" />
                    <div className="h-3 w-3/4 rounded bg-gray-50" />
                    <div className="h-3 w-1/2 rounded bg-gray-50" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Megaphone className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">{error}</p>
              <Button variant="dopamine" size="sm" className="mt-4" onClick={() => window.location.reload()}>
                重试
              </Button>
            </CardContent>
          </Card>
        ) : announcements.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Megaphone className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">暂无公告</p>
              <p className="text-xs text-gray-400 mt-1">管理员发布后会在此处显示</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement, index) => {
              const config = TYPE_CONFIG[announcement.type as keyof typeof TYPE_CONFIG];
              const Icon = config?.icon || Info;

              return (
                <Card key={`${announcement.id}-${index}`} className="card-hover dopamine-shadow overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-full p-2 ${config?.color || 'bg-gray-100'}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-base text-gray-900">
                            {announcement.title}
                          </h3>
                          {announcement.created_at && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {formatRelativeTime(announcement.created_at)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {config && (
                        <Badge 
                          variant="secondary" 
                          className={`${config.color.split(' ')[0]} ${config.color.split(' ')[1]}`}
                        >
                          {config.label}
                        </Badge>
                      )}
                    </div>

                    <div className="whitespace-pre-line text-sm leading-relaxed text-gray-700 bg-gray-50 rounded-lg p-4">
                      {announcement.content}
                    </div>

                    {announcement.priority && announcement.priority >= 8 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-dopamine-orange flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          此为重要公告，请仔细阅读
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!isLoading && !error && announcements.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-400 space-y-2">
            <p>已显示全部公告</p>
            <Link href="/" className="inline-flex items-center gap-1 text-dopamine-pink hover:underline">
              <Home className="h-4 w-4" />
              返回首页
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
