import { NextRequest, NextResponse } from "next/server";
import { createClient, fromTable } from "@/lib/supabase/server";
import { transformCommentsWithAuthor } from "@/lib/utils";
import { validateString, validateObject, validateId } from "@/lib/validation";
import { 
  ValidationError, 
  UnauthorizedError, 
  NotFoundError,
  toErrorResponse 
} from "@/lib/errors";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
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

    const { data: comments, error } = await supabase
      .from("comments")
      .select(`
        id,
        post_id,
        parent_id,
        content,
        likes_count,
        created_at,
        updated_at,
        author_id,
        profiles:author_id (
          username,
          avatar_url
        )
      `)
      .eq("post_id", id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error("获取评论失败");
    }

    return NextResponse.json({ comments: transformCommentsWithAuthor(comments) });
  } catch (error) {
    const errRes = toErrorResponse(error);
    const status = errRes.code === "VALIDATION_ERROR" ? 400 : 500;
    return NextResponse.json(errRes, { status });
  }
}

export async function POST(
  request: NextRequest,
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

    const body = await request.json();
    const validation = validateObject(body, {
      content: (value) => validateString(value, { 
        minLength: 1, 
        maxLength: 500, 
        required: true, 
        label: "评论内容" 
      }),
    });

    if (!validation.isValid) {
      throw new ValidationError("输入验证失败", undefined, validation.errors);
    }

    const { content, parent_id } = body;

    const { data: post } = await supabase
      .from("posts")
      .select("id")
      .eq("id", id)
      .eq("is_deleted", false)
      .single();

    if (!post) {
      throw new NotFoundError("帖子不存在", id);
    }

    const { data: comment, error } = await fromTable(supabase, "comments")
      .insert({
        post_id: id,
        author_id: user.id,
        parent_id: parent_id || null,
        content: content.trim(),
      })
      .select(`
        id,
        post_id,
        parent_id,
        content,
        likes_count,
        created_at,
        updated_at,
        author_id
      `)
      .single();

    if (error) {
      console.error("Create comment error:", error);
      throw new Error("评论发表失败");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      comment: {
        ...(comment as Record<string, unknown>),
        author_name: (profile as Record<string, unknown> | null)?.["username"] || "匿名用户",
        author_avatar: (profile as Record<string, unknown> | null)?.["avatar_url"] || null,
      },
    });
  } catch (error) {
    console.error("Create comment error:", error);
    const errRes = toErrorResponse(error);
    const status = errRes.code === "VALIDATION_ERROR" ? 400 : 
                   errRes.code === "UNAUTHORIZED" ? 401 : 
                   errRes.code === "NOT_FOUND" ? 404 : 500;
    return NextResponse.json(errRes, { status });
  }
}
