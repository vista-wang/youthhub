"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface TurnstileProps {
  siteKey?: string;
  onVerify?: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact";
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: Record<string, unknown>
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId?: string) => void;
    };
  }
}

const SITE_KEY = "0x4AAAAAAC0x673kaeqxGwW-";

export function Turnstile({
  siteKey = SITE_KEY,
  onVerify,
  onError,
  onExpire,
  theme = "auto",
  size = "normal",
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (window.turnstile) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => setHasError(true);
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !containerRef.current || !window.turnstile) return;

    const id = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token: string) => onVerify?.(token),
      "error-callback": () => onError?.(),
      "expired-callback": () => onExpire?.(),
      theme,
      size,
    });

    widgetIdRef.current = id;

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [isLoaded, siteKey, theme, size, onVerify, onError, onExpire]);

  if (hasError) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-600">验证组件加载失败，请刷新页面</p>
      </div>
    );
  }

  return <div ref={containerRef} />;
}

export function useTurnstile() {
  const [token, setToken] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  return {
    token,
    verified,
    onVerify: useCallback((t: string) => { setToken(t); setVerified(true); }, []),
    onError: useCallback(() => { setToken(null); setVerified(false); }, []),
    onExpire: useCallback(() => { setToken(null); setVerified(false); }, []),
    reset: useCallback(() => { setToken(null); setVerified(false); }, []),
  };
}
