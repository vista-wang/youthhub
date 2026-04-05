"use client";

import { useState } from "react";
import { X, Megaphone, Sparkles, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  type: "info" | "important" | "update" | "event";
}

const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "1",
    title: "🎉 友料公测版上线啦！",
    content:
      "欢迎来到友料（YouthHub）—— 一个专属于初中生的温暖社区！\n\n在这里你可以：\n• 分享你的想法和故事\n• 结识志同道合的朋友\n• 参与有趣的讨论\n\n让我们一起打造一个积极、友善的交流空间！",
    date: "2026-01-01",
    type: "event",
  },
  {
    id: "2",
    title: "📜 社区使用规范",
    content:
      "为了维护良好的社区环境，请遵守以下规范：\n\n1. 友善发言，尊重他人\n2. 不发布违法违规内容\n3. 不进行人身攻击或谩骂\n4. 保护个人隐私，不泄露他人信息\n5. 积极参与，传递正能量\n\n违反规范的账号将被限制使用权限。",
    date: "2026-01-01",
    type: "important",
  },
  {
    id: "3",
    title: "💡 功能更新预告",
    content:
      "我们正在开发以下新功能：\n\n• 帖子图片上传\n• 用户等级系统\n• 话题标签功能\n• 私信功能\n• 热门排行榜\n\n敬请期待！如有建议欢迎反馈~",
    date: "2026-01-15",
    type: "update",
  },
];

const TYPE_CONFIG = {
  info: {
    icon: Info,
    color: "text-dopamine-blue bg-dopamine-blue/10 border-dopamine-blue/20",
    label: "通知",
  },
  important: {
    icon: Sparkles,
    color: "text-dopamine-orange bg-dopamine-orange/10 border-dopamine-orange/20",
    label: "重要",
  },
  update: {
    icon: Megaphone,
    color: "text-dopamine-green bg-dopamine-green/10 border-dopamine-green/20",
    label: "更新",
  },
  event: {
    icon: Sparkles,
    color: "text-dopamine-pink bg-dopamine-pink/10 border-dopamine-pink/20",
    label: "活动",
  },
};

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AnnouncementModal({ isOpen, onClose }: AnnouncementModalProps) {
  const [currentId, setCurrentId] = useState(ANNOUNCEMENTS[0]?.id || "");

  if (!isOpen) return null;

  const currentIndex = ANNOUNCEMENTS.findIndex((a) => a.id === currentId);
  const currentAnnouncement = ANNOUNCEMENTS[currentIndex];

  const handlePrev = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : ANNOUNCEMENTS.length - 1;
    setCurrentId(ANNOUNCEMENTS[newIndex].id);
  };

  const handleNext = () => {
    const newIndex = currentIndex < ANNOUNCEMENTS.length - 1 ? currentIndex + 1 : 0;
    setCurrentId(ANNOUNCEMENTS[newIndex].id);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <Card className="relative w-full max-w-lg animate-slide-up shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-dopamine-purple" />
            <h3 className="font-bold text-lg text-gray-900">系统公告</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {currentAnnouncement && (
          <>
            <div className="px-4 pb-3">
              <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_CONFIG[currentAnnouncement.type].color}`}>
                <TYPE_CONFIG[currentAnnouncement.type].icon className="h-3 w-3" />
                {TYPE_CONFIG[currentAnnouncement.type].label}
              </div>
              <h4 className="mt-2 font-semibold text-base text-gray-900">
                {currentAnnouncement.title}
              </h4>
              <p className="text-xs text-gray-400 mt-1">{currentAnnouncement.date}</p>
            </div>

            <CardContent className="flex-1 overflow-y-auto scrollbar-hide pt-0">
              <div className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
                {currentAnnouncement.content}
              </div>
            </CardContent>

            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <Button variant="ghost" size="sm" onClick={handlePrev} disabled={ANNOUNCEMENTS.length <= 1}>
                ← 上一条
              </Button>

              <div className="flex gap-1.5">
                {ANNOUNCEMENTS.map((a, i) => (
                  <button
                    key={a.id}
                    onClick={() => setCurrentId(a.id)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === currentIndex ? "bg-dopamine-pink" : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  />
                ))}
              </div>

              <Button variant="ghost" size="sm" onClick={handleNext} disabled={ANNOUNCEMENTS.length <= 1}>
                下一条 →
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

export function AnnouncementButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center justify-center rounded-lg p-2 text-white bg-gradient-to-r from-dopamine-orange to-dopamine-pink shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 group"
      aria-label="查看系统公告"
    >
      <Megaphone className="h-4 w-4" />
      <span className="absolute -top-1 -right-1 flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-400" />
      </span>
    </button>
  );
}
