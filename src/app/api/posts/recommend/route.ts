import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { postService } from "@/lib/services";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ posts: [], reason: "not_logged_in" });
    }

    const result = await postService.getRecommendedPosts(user.id, 10);
    return NextResponse.json(
      { posts: result.posts, keywords: result.keywords },
      { headers: { "Cache-Control": "private, s-maxage=60, stale-while-revalidate=120" } }
    );
  } catch (error) {
    console.error("Recommend posts error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
