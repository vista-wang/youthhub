import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout";
import { CreatePostPage } from "./CreatePostPage";

export const dynamic = "force-dynamic";

type Profile = {
  username: string | null;
  avatar_url: string | null;
};

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

  const typedProfile = profile as Profile | null;

  return (
    <>
      <Navbar 
        user={user} 
        username={typedProfile?.username} 
        avatarUrl={typedProfile?.avatar_url}
      />
      <CreatePostPage />
    </>
  );
}
