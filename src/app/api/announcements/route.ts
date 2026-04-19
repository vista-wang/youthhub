import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: announcements, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "获取公告失败" },
        { status: 500 }
      );
    }

    const defaultAnnouncements = [
      {
        id: "default-1",
        title: "🎉 友料公测版上线啦！",
        content:
          "欢迎来到友料（YouthHub）—— 一个专属于初中生的温暖社区！\n\n在这里你可以：\n• 分享你的想法和故事\n• 结识志同道合的朋友\n• 参与有趣的讨论",
        type: "event" as const,
        priority: 10,
        created_at: new Date().toISOString(),
      },
      {
        id: "default-2",
        title: "📜 社区使用规范",
        content:
          "为了维护良好的社区环境，请遵守以下规范：\n\n1. 友善发言，尊重他人\n2. 不发布违法违规内容\n3. 不进行人身攻击或谩骂\n4. 保护个人隐私\n5. 积极参与，传递正能量",
        type: "important" as const,
        priority: 8,
        created_at: new Date().toISOString(),
      },
      {
        id: "default-3",
        title: "💡 功能更新预告",
        content:
          "我们正在开发以下新功能：\n\n• 帖子图片上传\n• 用户等级系统\n• 话题标签功能\n• 私信功能\n• 热门排行榜",
        type: "warning" as const,
        priority: 5,
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const result = (announcements && announcements.length > 0)
      ? announcements
      : defaultAnnouncements;

    return NextResponse.json({ announcements: result });
  } catch (error) {
    console.error("Get announcements error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
