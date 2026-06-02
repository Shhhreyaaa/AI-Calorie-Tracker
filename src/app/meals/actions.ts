"use server";
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

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
export async function saveMealLog(meal: MealData, clientTimeZone?: string) {
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
    await recalculateAndSyncStreak(supabase, user.id, clientTimeZone);
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
export async function deleteMealLog(mealId: string, clientTimeZone?: string) {
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

  // Recalculate streak after deletion
  try {
    await recalculateAndSyncStreak(supabase, user.id, clientTimeZone);
  } catch (streakErr) {
    console.error("Failed to calculate streak update after deletion:", streakErr);
  }

  revalidatePath("/dashboard");
  revalidatePath("/diary");
  revalidatePath("/analytics");
  revalidatePath("/streaks");

  return { success: true };
}

// 3. Update an existing meal log
export async function updateMealLog(mealId: string, updated: Partial<MealData>, clientTimeZone?: string) {
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

  // Recalculate streak after update
  try {
    await recalculateAndSyncStreak(supabase, user.id, clientTimeZone);
  } catch (streakErr) {
    console.error("Failed to calculate streak update after update:", streakErr);
  }

  revalidatePath("/dashboard");
  revalidatePath("/diary");
  revalidatePath("/analytics");
  revalidatePath("/streaks");

  return { success: true, data };
}

// 4. Fetch and update active streaks dynamically (checks if a day was missed)
// 4. Fetch and update active streaks dynamically (recalculates from all meals)
export async function getAndUpdateActiveStreak(clientTimeZone?: string) {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("Unauthorized. Please log in.");
  }

  return recalculateAndSyncStreak(supabase, user.id, clientTimeZone);
}

// Helper function to recalculate streak dynamically and sync with the Database
export async function recalculateAndSyncStreak(supabase: any, userId: string, clientTimeZone?: string) {
  const timeZone = clientTimeZone || "UTC";

  // 1. Fetch all meals for this user
  const { data: mealsData, error: mealsError } = await supabase
    .from("meals")
    .select("logged_at")
    .eq("user_id", userId);

  if (mealsError) {
    console.error("Failed to fetch meals for streak calculation:", mealsError);
    return {
      current_streak: 0,
      longest_streak: 0,
      last_logged_date: null,
      days_with_meals: 0,
      total_tracked_days: 1,
      target_rate: 0,
      unique_logged_days: []
    };
  }

  // 2. Format all logged_at dates into unique YYYY-MM-DD strings in the user's timezone
  const todayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const getLocalDateStr = (date: Date) => {
    try {
      const parts = todayFormatter.formatToParts(date);
      const year = parts.find(p => p.type === "year")?.value;
      const month = parts.find(p => p.type === "month")?.value;
      const day = parts.find(p => p.type === "day")?.value;
      return `${year}-${month}-${day}`;
    } catch (e) {
      return date.toISOString().split("T")[0];
    }
  };

  const uniqueDatesArray = Array.from(new Set(
    (mealsData || []).map((m: any) => getLocalDateStr(new Date(m.logged_at)))
  ));

  const sortedDates = uniqueDatesArray.sort();
  const uniqueDatesSet = new Set(sortedDates);

  // 3. Compute current streak (consecutive days ending today or yesterday)
  let currentStreak = 0;
  const today = new Date();
  const todayStr = getLocalDateStr(today);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateStr(yesterday);

  const checkDate = new Date();

  if (uniqueDatesSet.has(todayStr)) {
    currentStreak = 1;
    while (true) {
      checkDate.setDate(checkDate.getDate() - 1);
      if (uniqueDatesSet.has(getLocalDateStr(checkDate))) {
        currentStreak++;
      } else {
        break;
      }
    }
  } else if (uniqueDatesSet.has(yesterdayStr)) {
    currentStreak = 1;
    checkDate.setDate(checkDate.getDate() - 1); // point to yesterday
    while (true) {
      checkDate.setDate(checkDate.getDate() - 1);
      if (uniqueDatesSet.has(getLocalDateStr(checkDate))) {
        currentStreak++;
      } else {
        break;
      }
    }
  } else {
    currentStreak = 0;
  }

  // 4. Compute longest streak (max consecutive days run in entire history)
  let maxStreak = 0;
  let currentRun = 0;
  let prevDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const currentDate = new Date(dateStr + "T00:00:00");
    if (prevDate === null) {
      currentRun = 1;
    } else {
      const diffTime = currentDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentRun++;
      } else if (diffDays > 1) {
        maxStreak = Math.max(maxStreak, currentRun);
        currentRun = 1;
      }
    }
    prevDate = currentDate;
  }
  maxStreak = Math.max(maxStreak, currentRun);

  const lastLoggedDate = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : null;

  // 5. Update the database table
  const { error: updateError } = await supabase
    .from("streaks")
    .upsert({
      id: userId,
      current_streak: currentStreak,
      longest_streak: maxStreak,
      last_logged_date: lastLoggedDate,
      updated_at: new Date().toISOString()
    });

  if (updateError) {
    console.error("Failed to update streaks table:", updateError);
  }

  // 6. Compute total tracked days (days since user profile created)
  const { data: userData } = await supabase
    .from("users")
    .select("created_at")
    .eq("id", userId)
    .single();

  let totalTrackedDays = 1;
  if (userData) {
    const createdDate = new Date(userData.created_at);
    createdDate.setHours(0, 0, 0, 0);
    const todayZero = new Date();
    todayZero.setHours(0, 0, 0, 0);
    totalTrackedDays = Math.max(1, Math.floor((todayZero.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  } else if (sortedDates.length > 0) {
    const firstMealDate = new Date(sortedDates[0] + "T00:00:00");
    const todayZero = new Date();
    todayZero.setHours(0, 0, 0, 0);
    totalTrackedDays = Math.max(1, Math.floor((todayZero.getTime() - firstMealDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  }

  const daysWithMeals = sortedDates.length;
  const targetRate = totalTrackedDays > 0 ? (daysWithMeals / totalTrackedDays) : 0;

  return {
    id: userId,
    current_streak: currentStreak,
    longest_streak: maxStreak,
    last_logged_date: lastLoggedDate,
    days_with_meals: daysWithMeals,
    total_tracked_days: totalTrackedDays,
    target_rate: targetRate,
    unique_logged_days: sortedDates
  };
}
