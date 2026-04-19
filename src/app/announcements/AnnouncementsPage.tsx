"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Megaphone,
  Sparkles,
  Info,
  Home,
  ArrowLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Announcement } from "@/types/database";

type CategoryType = "all" | "info" | "important" | "warning" | "event";

const CATEGORIES: Array<{ key: CategoryType; label: string; icon: React.ElementType; color: string }> = [
  { key: "all", label: "全部公告", icon: Megaphone, color: "text-brand-blue" },
  { key: "info", label: "通知", icon: Info, color: "text-brand-blue" },
  { key: "important", label: "重要", icon: Sparkles, color: "text-amber-500" },
  { key: "warning", label: "更新", icon: Megaphone, color: "text-brand-green" },
  { key: "event", label: "活动", icon: Calendar, color: "text-brand-blue" },
];

const TYPE_CONFIG = {
  info: { icon: Info, color: "text-brand-blue bg-brand-blue/10 border-brand-blue/20", label: "通知", dotColor: "bg-brand-blue" },
  important: { icon: Sparkles, color: "text-amber-600 bg-amber-500/10 border-amber-500/20", label: "重要", dotColor: "bg-amber-500" },
  warning: { icon: Megaphone, color: "text-brand-green bg-brand-green/10 border-brand-green/20", label: "更新", dotColor: "bg-brand-green" },
  event: { icon: Calendar, color: "text-brand-blue bg-brand-blue/10 border-brand-blue/20", label: "活动", dotColor: "bg-brand-blue" },
};

export function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryType>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnnouncements() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/announcements");
        if (response.ok) {
          const data = await response.json();
          const list = data.announcements || [];
          setAnnouncements(list);
          if (list.length > 0 && !selectedId) {
            setSelectedId(list[0].id);
          }
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

  const filteredAnnouncements = activeCategory === "all"
    ? announcements
    : announcements.filter((a) => a.type === activeCategory);

  const selectedAnnouncement = announcements.find((a) => a.id === selectedId) || null;

  return (
    <main className="min-h-screen pb-10">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Megaphone className="h-6 w-6 text-brand-blue" />
              系统公告
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">了解社区最新动态和重要通知</p>
          </div>
        </div>

        <div className="flex gap-6">
          {/* ========== 左侧边栏（B站风格）========== */}
          <aside className="w-72 shrink-0 hidden lg:block">
            <Card className="sticky top-24 shadow-sm overflow-hidden">
              {/* 分类导航 */}
              <div className="border-b border-slate-100 p-3">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 px-1">分类</p>
                <nav className="space-y-0.5">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const count = cat.key === "all"
                      ? announcements.length
                      : announcements.filter((a) => a.type === cat.key).length;

                    return (
                      <button
                        key={cat.key}
                        onClick={() => {
                          setActiveCategory(cat.key);
                          const filtered = cat.key === "all"
                            ? announcements
                            : announcements.filter((a) => a.type === cat.key);
                          if (filtered.length > 0 && filtered[0]) setSelectedId(filtered[0].id);
                        }}
                        className={cn(
                          "flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm font-medium transition-all",
                          activeCategory === cat.key
                            ? "bg-brand-blue text-white shadow-sm"
                            : "text-slate-600 hover:bg-slate-50 hover:text-gray-900"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1 text-left">{cat.label}</span>
                        <span
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded-full",
                            activeCategory === cat.key
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 text-slate-400"
                          )}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* 公告列表 */}
              <div className="max-h-[calc(100vh-320px)] overflow-y-auto scrollbar-hide">
                {isLoading ? (
                  <div aria-busy="true" aria-hidden="true" className="p-4 space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="animate-pulse flex items-start gap-3 p-2 rounded-lg">
                        <div className="h-2.5 w-2.5 mt-1.5 rounded-full bg-slate-200 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-3/4 rounded-lg bg-slate-200" />
                          <div className="h-3 w-1/2 rounded-lg bg-slate-100" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="p-6 text-center">
                    <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">{error}</p>
                  </div>
                ) : filteredAnnouncements.length === 0 ? (
                  <div className="p-6 text-center">
                    <Megaphone className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">暂无此类公告</p>
                  </div>
                ) : (
                  <div className="py-1">
                    {filteredAnnouncements.map((announcement) => {
                      const config = TYPE_CONFIG[announcement.type as keyof typeof TYPE_CONFIG];
                      const isSelected = selectedId === announcement.id;

                      return (
                        <button
                          key={announcement.id}
                          onClick={() => setSelectedId(announcement.id)}
                          className={cn(
                            "group flex items-start gap-3 w-full px-4 py-3 text-left transition-all",
                            isSelected
                              ? "bg-brand-blue/5 border-l-2 border-brand-blue"
                              : "border-l-2 border-transparent hover:bg-slate-50"
                          )}
                        >
                          <span
                            className={cn(
                              "mt-1.5 h-2 w-2 rounded-full shrink-0 transition-colors",
                              config?.dotColor || "bg-slate-300",
                              isSelected && "ring-2 ring-offset-1 ring-brand-blue/30"
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                "text-sm font-medium line-clamp-1 transition-colors",
                                isSelected ? "text-brand-blue" : "text-gray-700 group-hover:text-gray-900"
                              )}
                            >
                              {announcement.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-400">{config?.label}</span>
                              {announcement.created_at && (
                                <>
                                  <span className="text-slate-200">·</span>
                                  <span className="text-xs text-slate-400">
                                    {formatRelativeTime(announcement.created_at)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <ChevronRight className="h-4 w-4 text-brand-blue shrink-0 mt-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </aside>

          {/* ========== 右侧正文区域 ========== */}
          <section className="flex-1 min-w-0">
            {isLoading ? (
              <Card aria-busy="true" aria-hidden="true" className="shadow-sm animate-pulse">
                <CardContent className="p-8">
                  <div className="space-y-4">
                    <div className="h-8 w-48 rounded-lg bg-slate-200" />
                    <div className="h-4 w-32 rounded-lg bg-slate-100" />
                    <div className="h-px bg-slate-100 my-6" />
                    <div className="space-y-3">
                      <div className="h-4 w-full rounded-lg bg-slate-100" />
                      <div className="h-4 w-5/6 rounded-lg bg-slate-50" />
                      <div className="h-4 w-4/6 rounded-lg bg-slate-50" />
                      <div className="h-4 w-full rounded-lg bg-slate-100" />
                      <div className="h-4 w-3/4 rounded-lg bg-slate-50" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : error ? (
              <Card className="shadow-sm border-dashed">
                <CardContent className="py-20 text-center">
                  <AlertCircle className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500">{error}</p>
                  <Button variant="primary" size="sm" className="mt-4" onClick={() => window.location.reload()}>
                    重试
                  </Button>
                </CardContent>
              </Card>
            ) : !selectedAnnouncement ? (
              <Card className="shadow-sm border-dashed">
                <CardContent className="py-20 text-center">
                  <Megaphone className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500">暂无公告</p>
                  <p className="text-xs text-slate-400 mt-1">管理员发布后会在此处显示</p>
                </CardContent>
              </Card>
            ) : (
              (() => {
                const config = TYPE_CONFIG[selectedAnnouncement.type as keyof typeof TYPE_CONFIG];
                const Icon = config?.icon || Info;

                return (
                  <Card className="shadow-sm overflow-hidden">
                    {/* 头部信息条 */}
                    <div className="border-b border-slate-100 bg-slate-50 px-6 py-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={cn("rounded-full p-2", config?.color)}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <Badge
                          variant="secondary"
                          className={cn(config?.color)}
                        >
                          {config?.label}
                        </Badge>
                        {selectedAnnouncement.priority && selectedAnnouncement.priority >= 8 && (
                          <Badge variant="warning" className="text-xs">
                            ⭐ 置顶
                          </Badge>
                        )}
                      </div>

                      <h2 className="text-xl font-bold text-gray-900 leading-snug">
                        {selectedAnnouncement.title}
                      </h2>

                      <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                        {selectedAnnouncement.created_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatRelativeTime(selectedAnnouncement.created_at)}
                          </span>
                        )}
                        {selectedAnnouncement.updated_at && selectedAnnouncement.updated_at !== selectedAnnouncement.created_at && (
                          <span>· 已编辑</span>
                        )}
                      </div>
                    </div>

                    {/* 正文内容 */}
                    <CardContent className="p-6 md:p-8">
                      <div className="prose prose-slate max-w-none">
                        <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-gray-700">
                          {selectedAnnouncement.content}
                        </div>
                      </div>

                      {selectedAnnouncement.priority && selectedAnnouncement.priority >= 8 && (
                        <div className="mt-8 pt-6 border-t border-slate-100 rounded-lg bg-amber-50/50 px-4 py-3">
                          <p className="text-sm text-amber-700 flex items-center gap-1.5">
                            <Sparkles className="h-4 w-4 shrink-0" />
                            此为重要公告，请仔细阅读并遵守相关规定
                          </p>
                        </div>
                      )}

                      {/* 底部导航 */}
                      <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-blue transition-colors">
                          <Home className="h-4 w-4" />
                          返回首页
                        </Link>

                        <div className="flex items-center gap-2">
                          {(() => {
                            const currentIndex = filteredAnnouncements.findIndex((a) => a.id === selectedId);
                            const prevItem = currentIndex > 0 ? filteredAnnouncements[currentIndex - 1] : null;
                            const nextItem = currentIndex < filteredAnnouncements.length - 1 ? filteredAnnouncements[currentIndex + 1] : null;

                            return (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={!prevItem}
                                  onClick={() => prevItem && setSelectedId(prevItem.id)}
                                >
                                  ← 上一篇
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={!nextItem}
                                  onClick={() => nextItem && setSelectedId(nextItem.id)}
                                >
                                  下一篇 →
                                </Button>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()
            )}
          </section>
        </div>

        {/* ========== 移动端：分类标签 + 列表视图 ========== */}
        <div className="lg:hidden mt-6">
          {/* 移动端分类标签 */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4 -mx-4 px-4">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const count = cat.key === "all"
                ? announcements.length
                : announcements.filter((a) => a.type === cat.key).length;

              return (
                <button
                  key={cat.key}
                  onClick={() => {
                    setActiveCategory(cat.key);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                    activeCategory === cat.key
                      ? "bg-brand-blue text-white shadow-sm"
                      : "bg-slate-100 text-slate-600"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cat.label}
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full",
                    activeCategory === cat.key ? "bg-white/25" : "bg-white/50"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 移动端公告卡片列表 */}
          {!isLoading && filteredAnnouncements.length > 0 && (
            <div className="space-y-3">
              {filteredAnnouncements.map((announcement) => {
                const config = TYPE_CONFIG[announcement.type as keyof typeof TYPE_CONFIG];
                const Icon = config?.icon || Info;

                return (
                  <Card
                    key={announcement.id}
                    className={cn(
                      "overflow-hidden cursor-pointer transition-all",
                      selectedId === announcement.id ? "ring-2 ring-brand-blue/30 shadow-sm" : ""
                    )}
                    onClick={() => setSelectedId(announcement.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn("rounded-full p-1.5 shrink-0 mt-0.5", config?.color)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={cn(
                              "font-semibold text-sm line-clamp-1",
                              selectedId === announcement.id ? "text-brand-blue" : "text-gray-900"
                            )}>
                              {announcement.title}
                            </h3>
                          </div>
                          {selectedId === announcement.id && (
                            <div className="mt-2 pt-2 border-t border-slate-100">
                              <p className="whitespace-pre-wrap text-sm text-gray-600 leading-relaxed">
                                {announcement.content}
                              </p>
                            </div>
                          )}
                          {selectedId !== announcement.id && (
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                              <span>{config?.label}</span>
                              {announcement.created_at && (
                                <span>{formatRelativeTime(announcement.created_at)}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
