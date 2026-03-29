import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const now = new Date().toISOString();

    const { data: announcements, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("is_active", true)
      .or(`start_at.is.null,start_at.lte.${now}`)
      .or(`end_at.is.null,end_at.gte.${now}`)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      return NextResponse.json(
        { error: "获取公告失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({ announcements });
  } catch (error) {
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
