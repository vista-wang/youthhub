import { NextRequest, NextResponse } from "next/server";
import { createClient, fromTable } from "@/lib/supabase/server";
import { validateString, validateNumber, validateObject } from "@/lib/validation";
import { ValidationError, UnauthorizedError, toErrorResponse } from "@/lib/errors";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new UnauthorizedError("请先登录");
    }

    const { data: keywords, error } = await supabase
      .from("user_keywords")
      .select("*")
      .eq("user_id", user.id)
      .order("weight", { ascending: false });

    if (error) {
      throw new Error("获取关键词失败");
    }

    return NextResponse.json({ keywords });
  } catch (error) {
    const errRes = toErrorResponse(error);
    const status = errRes.code === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json(errRes, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new UnauthorizedError("请先登录");
    }

    const body = await request.json();

    const validation = validateObject(body, {
      keyword: (value) => validateString(value, { 
        minLength: 1, 
        maxLength: 100, 
        required: true, 
        label: "关键词" 
      }),
      weight: (value) => validateNumber(value, { 
        min: 0.1, 
        max: 5.0, 
        required: false, 
        label: "权重" 
      }),
      source: (value) => validateString(value, { 
        maxLength: 50, 
        required: false, 
        label: "来源" 
      }),
    });

    if (!validation.isValid) {
      throw new ValidationError("输入验证失败", undefined, validation.errors);
    }

    const { keyword, weight = 1.0, source = "manual" } = body;

    const { data: existing } = await supabase.from("user_keywords")
      .select("id, weight")
      .eq("user_id", user.id)
      .eq("keyword", keyword.trim())
      .single();

    const existingRow = existing as { id: string; weight: number } | null;

    if (existingRow) {
      const { error } = await fromTable(supabase, "user_keywords")
        .update({ 
          weight: Math.min(existingRow.weight + 0.5, 5.0),
          updated_at: new Date().toISOString()
        })
        .eq("id", existingRow.id);

      if (error) {
        throw new Error("更新关键词失败");
      }
    } else {
      const { error } = await fromTable(supabase, "user_keywords")
        .insert({
          user_id: user.id,
          keyword: keyword.trim(),
          weight,
          source,
        });

      if (error) {
        throw new Error("添加关键词失败");
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const errRes = toErrorResponse(error);
    const status = errRes.code === "VALIDATION_ERROR" ? 400 : 
                   errRes.code === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json(errRes, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new UnauthorizedError("请先登录");
    }

    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword");

    const keywordValidation = validateString(keyword, { 
      minLength: 1, 
      maxLength: 100, 
      required: true, 
      label: "关键词" 
    });

    if (!keywordValidation.isValid) {
      throw new ValidationError("输入验证失败", undefined, [keywordValidation.error || ""]);
    }

    const { error } = await supabase
      .from("user_keywords")
      .delete()
      .eq("user_id", user.id)
      .eq("keyword", keyword!);

    if (error) {
      throw new Error("删除关键词失败");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const errRes = toErrorResponse(error);
    const status = errRes.code === "VALIDATION_ERROR" ? 400 : 
                   errRes.code === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json(errRes, { status });
  }
}
