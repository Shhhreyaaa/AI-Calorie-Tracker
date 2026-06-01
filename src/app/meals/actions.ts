"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface MealData {
  food_name: string;
  image_url?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export async function saveMealLog(meal: MealData) {
  const supabase = await createClient();

  // 1. Fetch authenticated user session safely on the server
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("User session not found. Please log in.");
  }

  // 2. Insert record into PostgreSQL 'meals' table
  const { data, error } = await supabase.from("meals").insert({
    user_id: user.id,
    food_name: meal.food_name,
    image_url: meal.image_url || null,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
  }).select();

  if (error) {
    console.error("Database insert error:", error);
    throw new Error(`Failed to save meal: ${error.message}`);
  }

  // 3. Update User Streak status if logging first meal today
  try {
    const todayStr = new Date().toISOString().split("T")[0];
    
    // Fetch user profile streak info
    const { data: streakData } = await supabase
      .from("streaks")
      .select("current_streak, longest_streak, last_logged_date")
      .eq("id", user.id)
      .single();

    if (streakData) {
      let currentStreak = streakData.current_streak;
      let longestStreak = streakData.longest_streak;
      const lastLogged = streakData.last_logged_date;

      if (lastLogged !== todayStr) {
        // Logged yesterday?
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        if (lastLogged === yesterdayStr) {
          // Increment streak
          currentStreak += 1;
        } else if (lastLogged === null || lastLogged < yesterdayStr) {
          // Reset streak to 1
          currentStreak = 1;
        }

        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }

        // Update streak details
        await supabase
          .from("streaks")
          .update({
            current_streak: currentStreak,
            longest_streak: longestStreak,
            last_logged_date: todayStr,
            updated_at: new Date().toISOString()
          })
          .eq("id", user.id);
      }
    }
  } catch (streakErr) {
    // Non-blocking error for streak updates
    console.error("Failed to calculate streak update:", streakErr);
  }

  // 4. Revalidate cache endpoints to trigger automatic UI updates
  revalidatePath("/dashboard");
  revalidatePath("/diary");
  revalidatePath("/analytics");
  revalidatePath("/streaks");

  return { success: true, data };
}
