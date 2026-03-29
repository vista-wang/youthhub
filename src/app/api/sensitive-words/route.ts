import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: words, error } = await supabase
      .from("sensitive_words")
      .select("word, category, severity, replacement")
      .eq("is_active", true);

    if (error) {
      return NextResponse.json(
        { error: "获取敏感词失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({ words });
  } catch (error) {
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
