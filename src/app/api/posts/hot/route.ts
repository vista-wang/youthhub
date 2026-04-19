import { NextResponse } from "next/server";
import { postService } from "@/lib/services";

export async function GET() {
  try {
    const posts = await postService.getHotPosts(10);
    return NextResponse.json(
      { posts },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
