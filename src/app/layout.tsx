import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import BottomNavigation from "@/components/layout/BottomNavigation";
import FloatingAICoach from "@/components/layout/FloatingAICoachWrapper";
import QueryProvider from "@/components/layout/QueryProvider";
import { AppProvider } from "@/lib/context/AppContext";

import { createClient } from "@/lib/supabase/server";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Calorie Tracker | Premium Macro Tracking",
  description: "Track your food intake using advanced AI image analysis, daily diaries, and streak rewards.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Sync profile data server-side on layout render
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Parallelize profile, goals, and streaks existence checks
      const [profileRes, goalsRes, streaksRes] = await Promise.all([
        supabase.from("users").select("id").eq("id", user.id).maybeSingle(),
        supabase.from("goals").select("id").eq("id", user.id).maybeSingle(),
        supabase.from("streaks").select("id").eq("id", user.id).maybeSingle()
      ]);

      const profile = profileRes.data;
      const goals = goalsRes.data;
      const streaks = streaksRes.data;

      const syncTasks: PromiseLike<any>[] = [];

      if (!profile) {
        console.log("Server Layout Sync: Profile missing, auto-creating...");
        syncTasks.push(
          supabase.from("users").insert({
            id: user.id,
            email: user.email,
            display_name: user.user_metadata?.display_name || user.user_metadata?.full_name || "User",
            age: 25,
            gender: "male",
            height_cm: 175,
            current_weight: 70,
            target_weight: 70,
            activity_level: "Moderately Active",
            goal_type: "Maintenance",
            daily_calorie_target: 2000,
            protein_goal: 150,
            carbs_goal: 200,
            fat_goal: 65,
            onboarding_completed: false
          })
        );
      }

      if (!goals) {
        console.log("Server Layout Sync: Goals missing, auto-creating...");
        const goalsPayload = {
          id: user.id,
          user_id: user.id,
          calories: 2000,
          protein: 150,
          carbs: 200,
          fat: 65,
          calorie_target: 2000,
          protein_target: 150,
          carb_target: 200,
          fat_target: 65
        };
        console.log("GOALS UPSERT PAYLOAD", goalsPayload);
        if (!goalsPayload.user_id) {
          throw new Error("Cannot save goals: user_id is null or undefined.");
        }
        syncTasks.push(
          supabase.from("goals").insert(goalsPayload)
        );
      }

      if (!streaks) {
        console.log("Server Layout Sync: Streaks missing, auto-creating...");
        syncTasks.push(
          supabase.from("streaks").insert({
            id: user.id,
            current_streak: 0,
            longest_streak: 0
          })
        );
      }

      // Execute insertions in parallel if anything is missing
      if (syncTasks.length > 0) {
        await Promise.all(syncTasks);
      }
    }
  } catch (err: any) {
    if (err?.message?.includes("Dynamic server usage") || err?.digest === "DYNAMIC_SERVER_USAGE") {
      // Ignore Next.js dynamic pre-rendering warnings
    } else {
      console.error("Server Layout Sync: Failed to sync user tables:", err);
    }
  }

  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#020617] text-white font-sans pb-24">
        <QueryProvider>
          <AppProvider>
            <main className="flex-1 w-full max-w-md md:max-w-2xl lg:max-w-6xl mx-auto px-4 py-6">
              {children}
            </main>
            <FloatingAICoach />
            <BottomNavigation />
          </AppProvider>
        </QueryProvider>
      </body>
    </html>
  );
}



