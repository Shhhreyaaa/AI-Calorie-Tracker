"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface MealData {
  food_name: string;
  image_url?: string;
  meal_type?: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// 1. Save a new meal log and increment streak
export async function saveMealLog(meal: MealData) {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("User session not found. Please log in.");
  }

  const { data, error } = await supabase.from("meals").insert({
    user_id: user.id,
    food_name: meal.food_name,
    image_url: meal.image_url || null,
    meal_type: meal.meal_type || "Snack",
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
  }).select();

  if (error) {
    console.error("Database insert error:", error);
    throw new Error(`Failed to save meal: ${error.message}`);
  }

  // Update User Streak status if logging first meal today
  try {
    const todayStr = new Date().toISOString().split("T")[0];
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
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        if (lastLogged === yesterdayStr) {
          currentStreak += 1;
        } else if (lastLogged === null || lastLogged < yesterdayStr) {
          currentStreak = 1;
        }

        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }

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
    console.error("Failed to calculate streak update:", streakErr);
  }

  revalidatePath("/dashboard");
  revalidatePath("/diary");
  revalidatePath("/analytics");
  revalidatePath("/streaks");

  return { success: true, data };
}

// 2. Delete an existing meal log
export async function deleteMealLog(mealId: string) {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("Unauthorized. Please log in.");
  }

  const { error } = await supabase
    .from("meals")
    .delete()
    .eq("id", mealId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Database delete error:", error);
    throw new Error(`Failed to delete meal: ${error.message}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/diary");
  revalidatePath("/analytics");
  revalidatePath("/streaks");

  return { success: true };
}

// 3. Update an existing meal log
export async function updateMealLog(mealId: string, updated: Partial<MealData>) {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("Unauthorized. Please log in.");
  }

  const { data, error } = await supabase
    .from("meals")
    .update({
      food_name: updated.food_name,
      meal_type: updated.meal_type,
      calories: updated.calories,
      protein: updated.protein,
      carbs: updated.carbs,
      fat: updated.fat,
    })
    .eq("id", mealId)
    .eq("user_id", user.id)
    .select();

  if (error) {
    console.error("Database update error:", error);
    throw new Error(`Failed to update meal: ${error.message}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/diary");
  revalidatePath("/analytics");
  revalidatePath("/streaks");

  return { success: true, data };
}

// 4. Fetch and update active streaks dynamically (checks if a day was missed)
export async function getAndUpdateActiveStreak() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("Unauthorized. Please log in.");
  }

  const { data: streakData, error } = await supabase
    .from("streaks")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !streakData) {
    return { current_streak: 0, longest_streak: 0, last_logged_date: null };
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const lastLogged = streakData.last_logged_date;

  if (lastLogged) {
    const today = new Date(todayStr);
    const lastLoggedDate = new Date(lastLogged);
    
    // Calculate difference in milliseconds and convert to days
    const diffTime = today.getTime() - lastLoggedDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 65 * 24)); // check if older than 24 hours

    if (diffDays > 1) {
      // User missed a day! Reset active streak to 0 in database
      const { data: updatedData } = await supabase
        .from("streaks")
        .update({
          current_streak: 0,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id)
        .select()
        .single();
        
      if (updatedData) {
        return updatedData;
      }
    }
  }

  return streakData;
}
