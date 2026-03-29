import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    const { data: keywords, error } = await supabase
      .from("user_keywords")
      .select("*")
      .eq("user_id", user.id)
      .order("weight", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "获取关键词失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({ keywords });
  } catch (error) {
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient() as any;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { keyword, weight = 1.0, source = "manual" } = body;

    if (!keyword || !keyword.trim()) {
      return NextResponse.json(
        { error: "关键词不能为空" },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("user_keywords")
      .select("id, weight")
      .eq("user_id", user.id)
      .eq("keyword", keyword.trim())
      .single();

    if (existing) {
      const { error } = await supabase
        .from("user_keywords")
        .update({ 
          weight: Math.min(existing.weight + 0.5, 5.0),
          updated_at: new Date().toISOString()
        })
        .eq("id", existing.id);

      if (error) {
        return NextResponse.json(
          { error: "更新关键词失败" },
          { status: 500 }
        );
      }
    } else {
      const { error } = await supabase
        .from("user_keywords")
        .insert({
          user_id: user.id,
          keyword: keyword.trim(),
          weight,
          source,
        });

      if (error) {
        return NextResponse.json(
          { error: "添加关键词失败" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword");

    if (!keyword) {
      return NextResponse.json(
        { error: "关键词不能为空" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("user_keywords")
      .delete()
      .eq("user_id", user.id)
      .eq("keyword", keyword);

    if (error) {
      return NextResponse.json(
        { error: "删除关键词失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
