import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginPage } from "./LoginPage";

export default async function Login() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return <LoginPage />;
}
