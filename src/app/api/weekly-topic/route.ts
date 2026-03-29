import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];

    const { data: topic, error } = await supabase
      .from("weekly_topics")
      .select("*")
      .eq("is_active", true)
      .lte("week_start", today)
      .gte("week_end", today)
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json(
        { error: "获取每周话题失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({ topic: topic || null });
  } catch (error) {
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
