import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RegisterPage } from "./RegisterPage";

export default async function Register() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return <RegisterPage />;
}
