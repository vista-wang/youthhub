import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { fromTable } from "@/lib/supabase/server";
import { validateId, validateString, validateObject } from "@/lib/validation";
import { ValidationError, toErrorResponse } from "@/lib/errors";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase } = auth;

    const { data: topics, error } = await supabase
      .from("weekly_topics")
      .select("*")
      .order("week_start", { ascending: false });

    if (error) {
      throw new Error("获取话题失败");
    }

    return NextResponse.json({ topics });
  } catch (error) {
    const errRes = toErrorResponse(error);
    return NextResponse.json(errRes, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase, userId } = auth;

    const body = await request.json();
    const validation = validateObject(body, {
      title: (value) => validateString(value, { 
        minLength: 1, 
        maxLength: 200, 
        required: true, 
        label: "标题" 
      }),
      description: (value) => validateString(value, { 
        maxLength: 2000, 
        required: false, 
        label: "描述" 
      }),
      week_start: (value) => validateString(value, { 
        required: true, 
        label: "开始日期" 
      }),
      week_end: (value) => validateString(value, { 
        required: true, 
        label: "结束日期" 
      }),
      cover_image: (value) => validateString(value, { 
        maxLength: 1000, 
        required: false, 
        label: "封面图片" 
      }),
    });

    if (!validation.isValid) {
      throw new ValidationError("输入验证失败", undefined, validation.errors);
    }

    const { title, description, cover_image, week_start, week_end, is_active } = body;

    const { data: topic, error } = await fromTable(supabase, "weekly_topics")
      .insert({
        title,
        description,
        cover_image,
        week_start,
        week_end,
        is_active: is_active !== undefined ? is_active : true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new ValidationError("该时间段已存在话题");
      }
      throw new Error("创建话题失败");
    }

    await fromTable(supabase, "admin_logs").insert({
      admin_id: userId,
      action: "create_topic",
      target_type: "topic",
      target_id: topic.id,
      details: { title },
    });

    return NextResponse.json({ topic });
  } catch (error) {
    const errRes = toErrorResponse(error);
    const status = errRes.code === "VALIDATION_ERROR" ? 400 : 500;
    return NextResponse.json(errRes, { status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase, userId } = auth;

    const body = await request.json();
    const validation = validateObject(body, {
      id: (value) => validateId(value, "话题ID"),
      title: (value) => validateString(value, { 
        minLength: 1, 
        maxLength: 200, 
        required: false, 
        label: "标题" 
      }),
      description: (value) => validateString(value, { 
        maxLength: 2000, 
        required: false, 
        label: "描述" 
      }),
      cover_image: (value) => validateString(value, { 
        maxLength: 1000, 
        required: false, 
        label: "封面图片" 
      }),
    });

    if (!validation.isValid) {
      throw new ValidationError("输入验证失败", undefined, validation.errors);
    }

    const { id, title, description, cover_image, week_start, week_end, is_active } = body;

    const { data: topic, error } = await supabase
      .from("weekly_topics")
      .update({
        title,
        description,
        cover_image,
        week_start,
        week_end,
        is_active,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error("更新话题失败");
    }

    await fromTable(supabase, "admin_logs").insert({
      admin_id: userId,
      action: "update_topic",
      target_type: "topic",
      target_id: id,
      details: { title },
    });

    return NextResponse.json({ topic });
  } catch (error) {
    const errRes = toErrorResponse(error);
    const status = errRes.code === "VALIDATION_ERROR" ? 400 : 500;
    return NextResponse.json(errRes, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase, userId } = auth;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    const idValidation = validateId(id, "话题ID");
    if (!idValidation.isValid) {
      throw new ValidationError("ID无效", undefined, [idValidation.error || ""]);
    }

    const { error } = await supabase
      .from("weekly_topics")
      .delete()
      .eq("id", id!);

    if (error) {
      throw new Error("删除话题失败");
    }

    await fromTable(supabase, "admin_logs").insert({
      admin_id: userId,
      action: "delete_topic",
      target_type: "topic",
      target_id: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const errRes = toErrorResponse(error);
    const status = errRes.code === "VALIDATION_ERROR" ? 400 : 500;
    return NextResponse.json(errRes, { status });
  }
}
