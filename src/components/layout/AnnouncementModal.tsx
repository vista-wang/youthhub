"use client";

import { useState, useEffect, useCallback } from "react";
import { Megaphone, Sparkles, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatRelativeTime } from "@/lib/utils";
import type { Announcement } from "@/types/database";

const TYPE_CONFIG = {
  info: {
    icon: Info,
    color: "text-brand-blue bg-brand-blue/10 border-brand-blue/20",
    label: "通知",
    bgColor: "bg-blue-50/80",
  },
  important: {
    icon: Sparkles,
    color: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    label: "重要",
    bgColor: "bg-amber-50/80",
  },
  warning: {
    icon: Megaphone,
    color: "text-brand-green bg-brand-green/10 border-brand-green/20",
    label: "更新",
    bgColor: "bg-emerald-50/80",
  },
  event: {
    icon: Sparkles,
    color: "text-brand-blue bg-brand-blue/10 border-brand-blue/20",
    label: "活动",
    bgColor: "bg-blue-50/80",
  },
};

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

async function fetchAnnouncements(): Promise<Announcement[]> {
  try {
    const response = await fetch("/api/announcements");
    if (response.ok) {
      const data = await response.json();
      return data.announcements || [];
    }
  } catch (error) {
    console.warn("Failed to fetch announcements:", error);
  }
  return [];
}

export function AnnouncementModal({ isOpen, onClose }: AnnouncementModalProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    fetchAnnouncements().then((data) => {
      setAnnouncements(data);
      setCurrentIndex(0);
      setIsLoading(false);
    });
  }, [isOpen]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => 
      prev > 0 ? prev - 1 : Math.max(0, announcements.length - 1)
    );
  }, [announcements.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => 
      prev < announcements.length - 1 ? prev + 1 : 0
    );
  }, [announcements.length]);

  const goToIndex = useCallback((index: number) => {
    if (index >= 0 && index < announcements.length) {
      setCurrentIndex(index);
    }
  }, [announcements.length]);

  const currentAnnouncement = announcements[currentIndex];
  const hasMultiple = announcements.length > 1;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="系统公告">
      <div className="flex flex-col h-full">
        {!isLoading && announcements.length > 0 && (
          <div className="px-6 pt-2 text-xs text-slate-400">
            {currentIndex + 1}/{announcements.length}
          </div>
        )}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-pulse text-slate-400">加载中...</div>
            </div>
          ) : currentAnnouncement ? (
            <>
              <div className={`px-6 pb-3 ${TYPE_CONFIG[currentAnnouncement.type as keyof typeof TYPE_CONFIG]?.bgColor || ""}`}>
                {(() => {
                  const config = TYPE_CONFIG[currentAnnouncement.type as keyof typeof TYPE_CONFIG];
                  if (!config) return null;
                  const Icon = config.icon;
                  return (
                    <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
                      <Icon className="h-3 w-3" />
                      {config.label}
                    </div>
                  );
                })()}
                <h4 className="mt-2 font-semibold text-base text-gray-900">
                  {currentAnnouncement.title}
                </h4>
                {currentAnnouncement.created_at && (
                  <p className="text-xs text-slate-400 mt-1">
                    {formatRelativeTime(currentAnnouncement.created_at)}
                  </p>
                )}
              </div>

              <div className="px-6 scrollbar-hide">
                <div className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
                  {currentAnnouncement.content}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Megaphone className="h-12 w-12 text-slate-200 mb-3" />
              <p className="text-slate-500 text-sm">暂无公告</p>
            </div>
          )}
        </div>

        {hasMultiple && (
          <div className="shrink-0 flex items-center justify-between px-6 py-3 border-t border-slate-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              disabled={currentIndex <= 0}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              上一条
            </Button>

            <div className="flex gap-1.5">
              {announcements.map((_, i) => (
                <button
                  key={`${currentAnnouncement.id}-${i}`}
                  onClick={() => goToIndex(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === currentIndex
                      ? "bg-brand-blue scale-125"
                      : "bg-slate-200 hover:bg-slate-300"
                  }`}
                />
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              disabled={currentIndex >= announcements.length - 1}
            >
              下一条
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

interface AnnouncementButtonProps {
  count?: number;
}

export function AnnouncementButton({ count }: AnnouncementButtonProps) {
  const showBadge = count !== undefined && count > 0;

  return (
    <span
      className="relative flex items-center justify-center rounded-lg p-2 text-white bg-brand-blue shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
      aria-label="查看系统公告"
    >
      <Megaphone className="h-4 w-4" />
      {showBadge && (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
          {count > 99 ? '99+' : count}
        </span>
      )}
      {/* 只在有 count 时才显示提示点，否则不显示 */}
    </span>
  );
}
