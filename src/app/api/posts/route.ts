import { NextRequest, NextResponse } from "next/server";
import { createClient, fromTable } from "@/lib/supabase/server";
import { postService } from "@/lib/services";
import { validateString, validateObject } from "@/lib/validation";
import { 
  ValidationError, 
  UnauthorizedError, 
  toErrorResponse 
} from "@/lib/errors";

export const revalidate = 60;

export async function GET() {
  try {
    const posts = await postService.getPosts({ limit: 20 });
    return NextResponse.json(
      { posts },
      { 
        headers: { 
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" 
        } 
      }
    );
  } catch (error) {
    console.error("Fetch posts error:", error);
    const errRes = toErrorResponse(error);
    return NextResponse.json(
      { error: errRes.message },
      { status: 500 }
    );
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
      title: (value) => validateString(value, { 
        minLength: 1, 
        maxLength: 100, 
        required: true, 
        label: "标题" 
      }),
      content: (value) => validateString(value, { 
        minLength: 1, 
        maxLength: 5000, 
        required: true, 
        label: "内容" 
      }),
    });

    if (!validation.isValid) {
      throw new ValidationError("输入验证失败", undefined, validation.errors);
    }

    const { title, content } = body;

    const { data: post, error } = await fromTable(supabase, "posts")
      .insert({
        author_id: user.id,
        title: title.trim(),
        content: content.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error("Create post error:", error);
      throw new Error("发帖失败，请稍后重试");
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Create post error:", error);
    const errRes = toErrorResponse(error);
    const status = errRes.code === "VALIDATION_ERROR" ? 400 : 
                   errRes.code === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json(errRes, { status });
  }
}
