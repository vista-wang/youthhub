import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout";
import { CreatePostPage } from "./CreatePostPage";

export const dynamic = "force-dynamic";

export default async function CreatePost() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?auth_required=true&redirect=/create");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <>
      <Navbar 
        user={user} 
        username={profile?.username} 
        avatarUrl={profile?.avatar_url}
      />
      <CreatePostPage />
    </>
  );
}
