"use client";

import { useState, useRef, useCallback } from "react";
import { Smile } from "lucide-react";
import { cn } from "@/lib/utils";
import { EMOJI_LIST } from "@/lib/constants/emoji";
import { Button } from "@/components/ui/button";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  className?: string;
}

export function EmojiPicker({ onEmojiSelect, className }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setIsOpen(false);
  };

  const getEmojiButtons = useCallback(() => {
    if (!gridRef.current) return [];
    return Array.from(gridRef.current.querySelectorAll<HTMLButtonElement>('[role="option"]'));
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const buttons = getEmojiButtons();
    if (buttons.length === 0) return;

    const activeIndex = buttons.findIndex((btn) => btn === document.activeElement);

    switch (e.key) {
      case "ArrowRight": {
        e.preventDefault();
        const nextIndex = activeIndex < buttons.length - 1 ? activeIndex + 1 : 0;
        buttons[nextIndex]?.focus();
        break;
      }
      case "ArrowDown": {
        e.preventDefault();
        const cols = 10;
        const downIndex = activeIndex + cols < buttons.length ? activeIndex + cols : activeIndex % cols;
        buttons[downIndex]?.focus();
        break;
      }
      case "ArrowLeft": {
        e.preventDefault();
        const prevIndex = activeIndex > 0 ? activeIndex - 1 : buttons.length - 1;
        buttons[prevIndex]?.focus();
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        const cols = 10;
        const upIndex = activeIndex - cols >= 0 ? activeIndex - cols : activeIndex + cols * Math.floor((buttons.length - 1 - activeIndex) / cols);
        buttons[upIndex >= 0 ? upIndex : activeIndex]?.focus();
        break;
      }
      case "Escape": {
        e.preventDefault();
        setIsOpen(false);
        break;
      }
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="text-slate-400 hover:text-amber-400 hover:bg-amber-400/10"
        aria-label="选择表情"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Smile className="h-5 w-5" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="absolute bottom-full left-0 mb-2 z-20 w-72 rounded-xl border border-slate-100 bg-white p-3 shadow-lg animate-slide-up"
            role="listbox"
            aria-label="表情选择器"
            onKeyDown={handleKeyDown}
          >
            <div className="grid grid-cols-10 gap-1" ref={gridRef}>
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  role="option"
                  aria-label={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-lg hover:bg-slate-100 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
