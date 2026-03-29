"use client";

import { useState } from "react";
import { Sparkles, MessageCircle, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { WeeklyTopic } from "@/types/database";

interface WeeklyTopicCardProps {
  topic: WeeklyTopic;
  onParticipate?: () => void;
}

export function WeeklyTopicCard({ topic, onParticipate }: WeeklyTopicCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const weekLabel = (() => {
    const start = new Date(topic.week_start);
    const end = new Date(topic.week_end);
    const formatDate = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
    return `${formatDate(start)} - ${formatDate(end)}`;
  })();

  return (
    <Card className="overflow-hidden dopamine-shadow bg-gradient-to-br from-dopamine-purple/5 via-dopamine-pink/5 to-dopamine-blue/5 border-dopamine-purple/20">
      <CardContent className="p-0">
        <div className="relative">
          {topic.cover_image && (
            <div className="h-24 w-full bg-gray-100 overflow-hidden">
              <img 
                src={topic.cover_image} 
                alt={topic.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gradient-to-r from-dopamine-pink to-dopamine-purple text-white text-xs font-medium">
                <Sparkles className="h-3 w-3" />
                本周话题
              </div>
              <span className="text-xs text-gray-400">{weekLabel}</span>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {topic.title}
            </h3>

            {topic.description && (
              <p className={cn(
                "text-sm text-gray-600 leading-relaxed transition-all",
                isExpanded ? "whitespace-pre-wrap" : "line-clamp-2"
              )}>
                {topic.description}
              </p>
            )}

            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="dopamine"
                size="sm"
                onClick={onParticipate}
              >
                <MessageCircle className="mr-1.5 h-4 w-4" />
                参与讨论
              </Button>

              {topic.description && topic.description.length > 80 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-xs text-dopamine-purple hover:underline flex items-center gap-0.5"
                >
                  {isExpanded ? "收起" : "展开"}
                  <ChevronRight className={cn(
                    "h-3 w-3 transition-transform",
                    isExpanded && "rotate-90"
                  )} />
                </button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function WeeklyTopicMini({ topic }: { topic: WeeklyTopic }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-dopamine-purple/5 to-dopamine-pink/5 border border-dopamine-purple/10">
      <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-dopamine-pink to-dopamine-purple flex items-center justify-center">
        <Sparkles className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 mb-0.5">本周话题</p>
        <p className="text-sm font-medium text-gray-900 truncate">{topic.title}</p>
      </div>
    </div>
  );
}
