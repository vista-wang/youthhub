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

    const isAdmin = profile?.role === "admin" || profile?.role === "moderator";
    const isBanned = profile?.is_banned === true;

    return NextResponse.json({ 
      isAdmin: isAdmin && !isBanned,
      role: profile?.role || "user",
      isBanned
    });
  } catch (error) {
    return NextResponse.json({ isAdmin: false });
  }
}
