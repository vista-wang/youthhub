import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { fromTable } from "@/lib/supabase/server";
import { validateId, validateNumber, validateString, validateObject } from "@/lib/validation";
import { ValidationError, toErrorResponse } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase } = auth;

    const { searchParams } = new URL(request.url);
    const pageStr = searchParams.get("page") || "1";
    const limitStr = searchParams.get("limit") || "20";
    const includeDeleted = searchParams.get("include_deleted") === "true";

    const pageValidation = validateNumber(parseInt(pageStr), { 
      min: 1, 
      integer: true, 
      label: "页码" 
    });
    const limitValidation = validateNumber(parseInt(limitStr), { 
      min: 1, 
      max: 100, 
      integer: true, 
      label: "每页数量" 
    });

    if (!pageValidation.isValid || !limitValidation.isValid) {
      const errors = [];
      if (!pageValidation.isValid && pageValidation.error) errors.push(pageValidation.error);
      if (!limitValidation.isValid && limitValidation.error) errors.push(limitValidation.error);
      throw new ValidationError("参数验证失败", undefined, errors);
    }

    const page = parseInt(pageStr);
    const limit = parseInt(limitStr);
    const offset = (page - 1) * limit;

    let query = supabase
      .from("posts")
      .select(`
        id,
        title,
        content,
        likes_count,
        comments_count,
        image_urls,
        attachment_urls,
        is_deleted,
        created_at,
        author_id,
        profiles:author_id (
          username,
          avatar_url
        )
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (!includeDeleted) {
      query = query.eq("is_deleted", false);
    }

    const { data: posts, error } = await query;

    if (error) {
      throw new Error("获取帖子失败");
    }

    const { count } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      posts: posts?.map((post: Record<string, unknown>) => ({
        ...post,
        author_name: (post["profiles"] as Record<string, unknown> | null)?.["username"] || "匿名用户",
        author_avatar: (post["profiles"] as Record<string, unknown> | null)?.["avatar_url"] || null,
      })),
      total: count || 0,
      page,
      limit,
    });
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

    const body = await request.json();
    const validation = validateObject(body, {
      postId: (value) => validateId(value, "帖子ID"),
      reason: (value) => validateString(value, { 
        maxLength: 500, 
        required: false, 
        label: "删除原因" 
      }),
    });

    if (!validation.isValid) {
      throw new ValidationError("输入验证失败", undefined, validation.errors);
    }

    const { postId, reason } = body;

    const { error: updateError } = await fromTable(supabase, "posts")
      .update({ is_deleted: true })
      .eq("id", postId);

    if (updateError) {
      throw new Error("删除帖子失败");
    }

    await fromTable(supabase, "admin_logs").insert({
      admin_id: userId,
      action: "delete_post",
      target_type: "post",
      target_id: postId,
      details: { reason },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const errRes = toErrorResponse(error);
    const status = errRes.code === "VALIDATION_ERROR" ? 400 : 500;
    return NextResponse.json(errRes, { status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase, userId } = auth;

    const body = await request.json();
    const validation = validateObject(body, {
      postId: (value) => validateId(value, "帖子ID"),
    });

    if (!validation.isValid) {
      throw new ValidationError("输入验证失败", undefined, validation.errors);
    }

    const { postId } = body;

    const { error: updateError } = await fromTable(supabase, "posts")
      .update({ is_deleted: false })
      .eq("id", postId);

    if (updateError) {
      throw new Error("恢复帖子失败");
    }

    await fromTable(supabase, "admin_logs").insert({
      admin_id: userId,
      action: "restore_post",
      target_type: "post",
      target_id: postId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const errRes = toErrorResponse(error);
    const status = errRes.code === "VALIDATION_ERROR" ? 400 : 500;
    return NextResponse.json(errRes, { status });
  }
}
