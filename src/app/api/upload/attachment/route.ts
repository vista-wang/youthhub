import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { UnauthorizedError, toErrorResponse } from "@/lib/errors";

const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain", "text/csv", "text/markdown",
  "video/mp4", "video/webm", "video/quicktime",
  "audio/mpeg", "audio/wav", "audio/ogg", "audio/webm",
  "application/zip", "application/x-rar-compressed", "application/x-7z-compressed",
];

const MAX_SIZE = 20 * 1024 * 1024; // 20MB

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/plain": "txt", "text/csv": "csv", "text/markdown": "md",
  "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov",
  "audio/mpeg": "mp3", "audio/wav": "wav", "audio/ogg": "ogg", "audio/webm": "weba",
  "application/zip": "zip", "application/x-rar-compressed": "rar", "application/x-7z-compressed": "7z",
};

function isImage(mimeType: string): boolean {
  return mimeType.startsWith("image/");
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "请选择文件" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "不支持的文件格式" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "文件不能超过 20MB" },
        { status: 400 }
      );
    }

    const ext = MIME_TO_EXT[file.type] || file.name.split(".").pop() || "bin";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("attachments")
      .upload(filePath, file);

    if (uploadError) {
      return NextResponse.json(
        { error: "上传失败: " + uploadError.message },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage
      .from("attachments")
      .getPublicUrl(filePath);

    return NextResponse.json({
      url: urlData.publicUrl,
      type: isImage(file.type) ? "image" : "file",
      name: file.name,
      mimeType: file.type,
    });
  } catch (error) {
    const errRes = toErrorResponse(error);
    const status = errRes.code === "UNAUTHORIZED" ? 401 : 500;
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

    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "缺少 URL" }, { status: 400 });
    }

    const urlObj = new URL(url);
    const filePath = decodeURIComponent(urlObj.pathname.split("/attachments/")[1]);

    if (!filePath.startsWith(user.id + "/")) {
      return NextResponse.json({ error: "无权删除" }, { status: 403 });
    }

    const { error } = await supabase.storage
      .from("attachments")
      .remove([filePath]);

    if (error) {
      return NextResponse.json({ error: "删除失败" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const errRes = toErrorResponse(error);
    const status = errRes.code === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json(errRes, { status });
  }
}
