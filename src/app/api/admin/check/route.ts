import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ isAdmin: false });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_banned")
      .eq("id", user.id)
      .single();

    const role = (profile as { role: string; is_banned: boolean } | null)?.role || "user";
    const isBanned = (profile as { role: string; is_banned: boolean } | null)?.is_banned === true;
    const isAdmin = role === "admin" || role === "moderator";

    return NextResponse.json({ 
      isAdmin: isAdmin && !isBanned,
      role,
      isBanned
    });
  } catch (error) {
    return NextResponse.json({ isAdmin: false });
  }
}
