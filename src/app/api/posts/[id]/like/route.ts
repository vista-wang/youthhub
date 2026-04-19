import { NextRequest, NextResponse } from "next/server";
import { createClient, fromTable } from "@/lib/supabase/server";
import { validateId } from "@/lib/validation";
import { ValidationError, UnauthorizedError, toErrorResponse } from "@/lib/errors";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  _request: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;
    
    const idValidation = validateId(id, "帖子ID");
    if (!idValidation.isValid) {
      throw new ValidationError("ID无效", undefined, [idValidation.error || ""]);
    }

    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new UnauthorizedError("请先登录");
    }

    const { data: existingLike } = await supabase
      .from("likes")
      .select("id")
      .eq("user_id", user.id)
      .eq("likeable_id", id)
      .eq("likeable_type", "post")
      .single();

    if (existingLike) {
      throw new ValidationError("已经点赞过了");
    }

    const { error } = await fromTable(supabase, "likes").insert({
      user_id: user.id,
      likeable_id: id,
      likeable_type: "post",
    });

    if (error) {
      console.error("Like error:", error);
      throw new Error("点赞失败");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Like error:", error);
    const errRes = toErrorResponse(error);
    const status = errRes.code === "VALIDATION_ERROR" ? 400 : 
                   errRes.code === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json(errRes, { status });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;
    
    const idValidation = validateId(id, "帖子ID");
    if (!idValidation.isValid) {
      throw new ValidationError("ID无效", undefined, [idValidation.error || ""]);
    }

    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new UnauthorizedError("请先登录");
    }

    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("user_id", user.id)
      .eq("likeable_id", id)
      .eq("likeable_type", "post");

    if (error) {
      console.error("Unlike error:", error);
      throw new Error("取消点赞失败");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unlike error:", error);
    const errRes = toErrorResponse(error);
    const status = errRes.code === "VALIDATION_ERROR" ? 400 : 
                   errRes.code === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json(errRes, { status });
  }
}
