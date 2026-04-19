import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { fromTable } from "@/lib/supabase/server";
import { validateId, validateString, validateNumber, validateEnum, validateObject } from "@/lib/validation";
import { ValidationError, toErrorResponse } from "@/lib/errors";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase } = auth;

    const { data: announcements, error } = await supabase
      .from("announcements")
      .select("*")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error("获取公告失败");
    }

    return NextResponse.json({ announcements });
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
      content: (value) => validateString(value, { 
        minLength: 1, 
        maxLength: 10000, 
        required: true, 
        label: "内容" 
      }),
      type: (value) => validateEnum(value, ["info", "important", "warning", "event"], "类型"),
      priority: (value) => validateNumber(value, { 
        min: 0, 
        max: 100, 
        integer: true, 
        required: false, 
        label: "优先级" 
      }),
    });

    if (!validation.isValid) {
      throw new ValidationError("输入验证失败", undefined, validation.errors);
    }

    const { title, content, type, priority, is_active, start_at, end_at } = body;

    const { data: announcement, error } = await fromTable(supabase, "announcements")
      .insert({
        title,
        content,
        type: type || "info",
        priority: priority !== undefined ? priority : 0,
        is_active: is_active !== undefined ? is_active : true,
        start_at,
        end_at,
      })
      .select()
      .single();

    if (error) {
      throw new Error("创建公告失败");
    }

    await fromTable(supabase, "admin_logs").insert({
      admin_id: userId,
      action: "create_announcement",
      target_type: "announcement",
      target_id: announcement.id,
      details: { title },
    });

    return NextResponse.json({ announcement });
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
      id: (value) => validateId(value, "公告ID"),
      title: (value) => validateString(value, { 
        minLength: 1, 
        maxLength: 200, 
        required: false, 
        label: "标题" 
      }),
      content: (value) => validateString(value, { 
        minLength: 1, 
        maxLength: 10000, 
        required: false, 
        label: "内容" 
      }),
      type: (value) => validateEnum(value, ["info", "important", "warning", "event"], "类型"),
      priority: (value) => validateNumber(value, { 
        min: 0, 
        max: 100, 
        integer: true, 
        required: false, 
        label: "优先级" 
      }),
    });

    if (!validation.isValid) {
      throw new ValidationError("输入验证失败", undefined, validation.errors);
    }

    const { id, title, content, type, priority, is_active, start_at, end_at } = body;

    const { data: announcement, error } = await supabase
      .from("announcements")
      .update({
        title,
        content,
        type,
        priority,
        is_active,
        start_at,
        end_at,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error("更新公告失败");
    }

    await fromTable(supabase, "admin_logs").insert({
      admin_id: userId,
      action: "update_announcement",
      target_type: "announcement",
      target_id: id,
      details: { title },
    });

    return NextResponse.json({ announcement });
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

    const idValidation = validateId(id, "公告ID");
    if (!idValidation.isValid) {
      throw new ValidationError("ID无效", undefined, [idValidation.error || ""]);
    }

    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", id!);

    if (error) {
      throw new Error("删除公告失败");
    }

    await fromTable(supabase, "admin_logs").insert({
      admin_id: userId,
      action: "delete_announcement",
      target_type: "announcement",
      target_id: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const errRes = toErrorResponse(error);
    const status = errRes.code === "VALIDATION_ERROR" ? 400 : 500;
    return NextResponse.json(errRes, { status });
  }
}
