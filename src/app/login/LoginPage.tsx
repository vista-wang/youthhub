"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowLeft, Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Turnstile, useTurnstile } from "@/components/ui/turnstile";
import { createClient } from "@/lib/supabase/client";
import { validateEmail, validateString } from "@/lib/validation";

export function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const turnstile = useTurnstile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 验证输入
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || "邮箱格式不正确");
      return;
    }

    const passwordValidation = validateString(password, {
      minLength: 6,
      required: true,
      label: "密码",
    });
    if (!passwordValidation.isValid) {
      setError(passwordValidation.error || "密码格式不正确");
      return;
    }

    if (!turnstile.verified) {
      setError("请完成人机验证");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: { captchaToken: turnstile.token },
      });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError("登录失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-8">
          <ArrowLeft className="h-4 w-4" />返回首页
        </Link>
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold brand-title">欢迎回来</CardTitle>
            <p className="text-sm text-slate-500 mt-1">登录你的友料账号</p>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input type="email" placeholder="邮箱地址" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" autoComplete="email" required maxLength={254} />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input type={showPassword ? "text" : "password"} placeholder="密码" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" autoComplete="current-password" required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label="切换密码可见性">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex justify-center py-2">
                <Turnstile onVerify={turnstile.onVerify} onError={turnstile.onError} onExpire={turnstile.onExpire} />
              </div>
              {!turnstile.verified && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2 text-center">请完成上方人机验证后登录</p>
              )}
              {error && <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
              <Button type="submit" variant="primary" className="w-full" disabled={isLoading || !turnstile.verified}>
                {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />登录中...</>) : "登录"}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-slate-500">
              还没有账号？
              <Link href="/register" className="ml-1 font-medium text-brand-blue hover:underline">立即注册</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
