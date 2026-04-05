"use client";

import Link from "next/link";
import { useState } from "react";
import { X, LogOut, Sparkles, Menu, User, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { NAV_ITEMS, AUTH_PATHS } from "@/lib/navigation";
import { AnnouncementButton } from "./AnnouncementModal";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface NavbarProps {
  user: SupabaseUser | null;
  username?: string | null;
  avatarUrl?: string | null;
}

export function Navbar({ user, username, avatarUrl }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleAuthRequired = (href: string) => {
    window.location.href = `/?auth_required=true&redirect=${href}`;
  };

  const renderNavItem = (item: typeof NAV_ITEMS[number], isMobile = false) => {
    const { href, label, icon: Icon, requireAuth } = item;
    
    if (requireAuth && !user) {
      const buttonClass = isMobile
        ? "flex items-center gap-3 rounded-lg px-4 py-3 text-left text-gray-600 transition-colors hover:bg-gray-50 w-full"
        : "text-gray-600 hover:text-brand-blue";

      return (
        <button
          key={href}
          className={buttonClass}
          onClick={() => {
            if (isMobile) setIsMenuOpen(false);
            handleAuthRequired(href);
          }}
        >
          <Icon className={isMobile ? "h-5 w-5" : "mr-1.5 h-4 w-4"} />
          {label}
        </button>
      );
    }

    const linkClass = isMobile
      ? "flex items-center gap-3 rounded-lg px-4 py-3 text-gray-600 transition-colors hover:bg-gray-50"
      : "";

    return (
      <Link
        key={href}
        href={href}
        className={linkClass}
        onClick={() => isMobile && setIsMenuOpen(false)}
      >
        {isMobile ? (
          <>
            <item.icon className="h-5 w-5" />
            {label}
          </>
        ) : (
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-brand-blue">
            <item.icon className="mr-1.5 h-4 w-4" />
            {label}
          </Button>
        )}
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-4xl px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse-soft rounded-full bg-gradient-to-r from-brand-blue to-brand-teal opacity-40 blur-md" />
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-teal">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
            </div>
            <span className="text-xl font-bold brand-text">友料</span>
            <span className="ml-1 rounded-full bg-gradient-to-r from-brand-green to-brand-teal px-2 py-0.5 text-xs font-medium text-white shadow-sm">
              公测版
            </span>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            {NAV_ITEMS.map((item) => renderNavItem(item))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link href="/announcements">
              <AnnouncementButton />
            </Link>
            
            {user ? (
              <div className="flex items-center gap-3">
                <Link href={AUTH_PATHS.PROFILE}>
                  <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 transition-colors hover:bg-slate-100">
                    <Avatar src={avatarUrl} alt={username || "用户"} size="sm" />
                    <span className="text-sm font-medium text-slate-700">
                      {username || "用户"}
                    </span>
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="text-slate-500 hover:text-brand-blue hover:bg-brand-blue/10"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href={AUTH_PATHS.LOGIN}>
                  <Button variant="ghost" size="sm">登录</Button>
                </Link>
                <Link href={AUTH_PATHS.REGISTER}>
                  <Button variant="primary" size="sm">注册</Button>
                </Link>
              </div>
            )}
          </div>

          <button
            className="flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "absolute left-0 right-0 top-full border-b border-slate-200/60 bg-white/95 backdrop-blur-md md:hidden transition-all duration-300",
          isMenuOpen
            ? "translate-y-0 opacity-100"
            : "-translate-y-2 opacity-0 pointer-events-none"
        )}
      >
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex flex-col gap-2">
            <Link
              href="/announcements"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-brand-blue bg-gradient-to-r from-brand-blue/10 to-brand-teal/10 transition-colors hover:from-brand-blue/20 hover:to-brand-teal/20"
              onClick={() => setIsMenuOpen(false)}
            >
              <Megaphone className="h-5 w-5" />
              系统公告
            </Link>
            
            {NAV_ITEMS.map((item) => renderNavItem(item, true))}
            
            <div className="my-2 h-px bg-slate-100" />
            
            {user ? (
              <>
                <Link
                  href={AUTH_PATHS.PROFILE}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-600 transition-colors hover:bg-slate-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Avatar src={avatarUrl} alt={username || "用户"} size="sm" />
                  <span className="font-medium">{username || "个人中心"}</span>
                </Link>
                <button
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-left text-red-500 transition-colors hover:bg-red-50"
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                  disabled={isLoggingOut}
                >
                  <LogOut className="h-5 w-5" />
                  退出登录
                </button>
              </>
            ) : (
              <>
                <Link
                  href={AUTH_PATHS.LOGIN}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-600 transition-colors hover:bg-slate-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-5 w-5" />
                  登录
                </Link>
                <Link href={AUTH_PATHS.REGISTER} onClick={() => setIsMenuOpen(false)}>
                  <Button variant="primary" className="w-full">注册账号</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

    </nav>
  );
}
