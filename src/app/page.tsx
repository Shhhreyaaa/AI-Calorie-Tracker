import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LandingPage from "@/components/landing/LandingPage";

export const dynamic = "force-dynamic";

export default async function Home() {
  let user = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch (err) {
    console.error("Root Auth Session Check failed:", err);
  }

  if (user) {
    redirect("/dashboard");
  }

  return <LandingPage />;
}
