"use client";

import { useState, useEffect } from "react";
import { Megaphone, X, ChevronRight, AlertCircle, Info, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Announcement } from "@/types/database";

interface AnnouncementsBannerProps {
  announcements: Announcement[];
}

const typeConfig = {
  info: {
    icon: Info,
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    iconColor: "text-blue-500",
    badgeVariant: "secondary" as const,
  },
  warning: {
    icon: AlertCircle,
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    iconColor: "text-amber-500",
    badgeVariant: "warning" as const,
  },
  important: {
    icon: Megaphone,
    bgColor: "bg-dopamine-pink/5",
    borderColor: "border-dopamine-pink/20",
    iconColor: "text-dopamine-pink",
    badgeVariant: "default" as const,
  },
  event: {
    icon: Calendar,
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    iconColor: "text-purple-500",
    badgeVariant: "secondary" as const,
  },
};

export function AnnouncementsBanner({ announcements }: AnnouncementsBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (announcements.length <= 1) return;

    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % announcements.length);
        setIsVisible(true);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, [announcements.length]);

  if (announcements.length === 0 || isDismissed) return null;

  const current = announcements[currentIndex];
  const config = typeConfig[current.type];
  const Icon = config.icon;

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300 border",
      config.bgColor,
      config.borderColor,
      !isVisible && "opacity-0"
    )}>
      <CardContent className="p-0">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className={cn("shrink-0", config.iconColor)}>
            <Icon className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Badge variant={config.badgeVariant} className="text-xs">
                {current.type === "important" ? "重要" : 
                 current.type === "warning" ? "注意" : 
                 current.type === "event" ? "活动" : "公告"}
              </Badge>
              <span className="font-medium text-gray-900 text-sm truncate">
                {current.title}
              </span>
            </div>
            <p className="text-xs text-gray-600 line-clamp-1">
              {current.content}
            </p>
          </div>

          {announcements.length > 1 && (
            <div className="flex items-center gap-1 shrink-0">
              {announcements.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsVisible(false);
                    setTimeout(() => {
                      setCurrentIndex(index);
                      setIsVisible(true);
                    }, 150);
                  }}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    index === currentIndex
                      ? "bg-dopamine-pink w-3"
                      : "bg-gray-300 hover:bg-gray-400"
                  )}
                />
              ))}
            </div>
          )}

          <button
            onClick={() => setIsDismissed(true)}
            className="shrink-0 p-1 rounded-full hover:bg-gray-200/50 transition-colors"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

export function AnnouncementsList({ announcements }: AnnouncementsBannerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (announcements.length === 0) return null;

  return (
    <div className="space-y-3">
      {announcements.map((announcement) => {
        const config = typeConfig[announcement.type];
        const Icon = config.icon;
        const isExpanded = expandedId === announcement.id;

        return (
          <Card 
            key={announcement.id}
            className={cn(
              "overflow-hidden transition-all duration-200 cursor-pointer border",
              config.bgColor,
              config.borderColor,
              "hover:shadow-md"
            )}
            onClick={() => setExpandedId(isExpanded ? null : announcement.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={cn("shrink-0 mt-0.5", config.iconColor)}>
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={config.badgeVariant} className="text-xs">
                      {announcement.type === "important" ? "重要" : 
                       announcement.type === "warning" ? "注意" : 
                       announcement.type === "event" ? "活动" : "公告"}
                    </Badge>
                    <span className="font-medium text-gray-900">
                      {announcement.title}
                    </span>
                  </div>
                  
                  <p className={cn(
                    "text-sm text-gray-600 transition-all",
                    isExpanded ? "whitespace-pre-wrap" : "line-clamp-2"
                  )}>
                    {announcement.content}
                  </p>
                </div>

                <ChevronRight className={cn(
                  "h-4 w-4 text-gray-400 transition-transform shrink-0 mt-1",
                  isExpanded && "rotate-90"
                )} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
