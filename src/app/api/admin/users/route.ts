import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { fromTable } from "@/lib/supabase/server";
import { validateId, validateString, validateEnum, validateNumber, validateObject } from "@/lib/validation";
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
    const search = searchParams.get("search") || "";

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
      .from("profiles")
      .select("id, username, avatar_url, bio, role, is_banned, ban_reason, banned_at, created_at, points, experience, level, is_premium, premium_expires_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.ilike("username", `%${search}%`);
    }

    const { data: users, error, count } = await query;

    if (error) {
      throw new Error("获取用户列表失败");
    }

    return NextResponse.json({
      users,
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

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase, userId } = auth;

    const body = await request.json();
    const validation = validateObject(body, {
      userId: (value) => validateId(value, "目标用户ID"),
      action: (value) => validateEnum(value, ["ban", "unban"], "操作类型"),
      reason: (value) => validateString(value, { 
        maxLength: 500, 
        required: false, 
        label: "封禁原因" 
      }),
    });

    if (!validation.isValid) {
      throw new ValidationError("输入验证失败", undefined, validation.errors);
    }

    const { userId: targetUserId, action, reason } = body;

    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", targetUserId)
      .single();

    const targetRole = (targetProfile as { role: string } | null)?.role;
    if (targetRole === "admin") {
      throw new ValidationError("无法封禁管理员");
    }

    if (action === "ban") {
      const { error: updateError } = await fromTable(supabase, "profiles")
        .update({
          is_banned: true,
          ban_reason: reason || null,
          banned_at: new Date().toISOString(),
        })
        .eq("id", targetUserId);

      if (updateError) {
        throw new Error("封禁用户失败");
      }

      await fromTable(supabase, "admin_logs").insert({
        admin_id: userId,
        action: "ban_user",
        target_type: "user",
        target_id: targetUserId,
        details: { reason },
      });

      return NextResponse.json({ success: true, message: "用户已封禁" });
    }

    if (action === "unban") {
      const { error: updateError } = await fromTable(supabase, "profiles")
        .update({
          is_banned: false,
          ban_reason: null,
          banned_at: null,
        })
        .eq("id", targetUserId);

      if (updateError) {
        throw new Error("解封用户失败");
      }

      await fromTable(supabase, "admin_logs").insert({
        admin_id: userId,
        action: "unban_user",
        target_type: "user",
        target_id: targetUserId,
      });

      return NextResponse.json({ success: true, message: "用户已解封" });
    }

    throw new ValidationError("未知操作");
  } catch (error) {
    const errRes = toErrorResponse(error);
    const status = errRes.code === "VALIDATION_ERROR" ? 400 : 500;
    return NextResponse.json(errRes, { status });
  }
}
