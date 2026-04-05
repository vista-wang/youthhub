import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout";
import { AnnouncementsPage } from "./AnnouncementsPage";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPageRoute() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { username: string; avatar_url: string | null } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", user.id)
      .single();
    profile = data as { username: string; avatar_url: string | null } | null;
  }

  return (
    <>
      <Navbar 
        user={user} 
        username={profile?.username} 
        avatarUrl={profile?.avatar_url}
      />
      <AnnouncementsPage />
    </>
  );
}
