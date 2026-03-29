import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <div className="text-center">
        <div className="mb-6">
          <span className="text-8xl">🔍</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-xl font-medium text-gray-700 mb-4">
          页面走丢了
        </h2>
        <p className="text-gray-500 mb-8 max-w-md">
          抱歉，你访问的页面不存在或已被删除
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回上页
            </Button>
          </Link>
          <Link href="/">
            <Button variant="dopamine">
              <Home className="mr-2 h-4 w-4" />
              回到首页
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
