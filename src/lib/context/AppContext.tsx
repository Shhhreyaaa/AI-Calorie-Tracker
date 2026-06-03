"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getAndUpdateActiveStreak } from "@/app/meals/actions";

export interface AppContextType {
  user: any;
  profile: any;
  goals: any;
  streak: any;
  meals: any[];
  weightLogs: any[];
  loading: boolean;
  refreshAll: () => Promise<void>;
  optimisticAddMeal: (meal: any) => void;
  optimisticDeleteMeal: (mealId: string) => void;
  optimisticAddWeight: (weight: number) => void;
  updateProfileState: (updatedProfileFields: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  // 1. Fetch and listen to user auth changes
  useEffect(() => {
    // Get initial session user
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (authUser) {
        setUser(authUser);
      }
    });

    // Listen to changes to clear/set query state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const sessionUser = session?.user || null;
      setUser(sessionUser);
      if (event === "SIGNED_OUT") {
        queryClient.clear();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, queryClient]);

  // 2. Fetch User Profile
  const { data: profile, isLoading: isProfileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from("users").select("*").eq("id", user.id).maybeSingle();
      if (!data) {
        // Fallback default profile if not configured yet
        return {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.display_name || "Athlete",
          avatar_url: null,
          age: 25,
          gender: "male",
          height_cm: 175,
          current_weight: 70,
          target_weight: 70,
          activity_level: "Moderately Active",
          goal_type: "Maintenance",
          diet_preference: "Non-Vegetarian",
          medical_conditions: [],
          coach_memory: {},
          daily_calorie_target: 2000,
          protein_goal: 150,
          carbs_goal: 200,
          fat_goal: 65,
          onboarding_completed: false,
          theme_preference: "dark"
        };
      }
      return data;
    },
    enabled: !!user?.id
  });
 
  // 2.5. Fetch Goals
  const { data: goals, isLoading: isGoalsLoading, refetch: refetchGoals } = useQuery({
    queryKey: ["goals", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from("goals").select("*").eq("user_id", user.id).maybeSingle();
      if (!data) {
        return {
          id: user.id,
          user_id: user.id,
          calorie_target: 2000,
          protein_target: 150,
          carb_target: 200,
          fat_target: 65,
          calories: 2000,
          protein: 150,
          carbs: 200,
          fat: 65
        };
      }
      return data;
    },
    enabled: !!user?.id
  });

  // 3. Fetch Streaks
  const { data: streak, isLoading: isStreakLoading, refetch: refetchStreak } = useQuery({
    queryKey: ["streak", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      try {
        return await getAndUpdateActiveStreak(tz);
      } catch (err) {
        console.error("Streak calculation error:", err);
        return null;
      }
    },
    enabled: !!user?.id
  });

  // 4. Fetch Meals
  const { data: meals, isLoading: isMealsLoading, refetch: refetchMeals } = useQuery({
    queryKey: ["meals", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("meals")
        .select("*")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false });
      return data || [];
    },
    enabled: !!user?.id
  });

  // 5. Fetch Weight Logs
  const { data: weightLogs, isLoading: isWeightLogsLoading, refetch: refetchWeightLogs } = useQuery({
    queryKey: ["weightLogs", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("weight_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user?.id
  });

  const loading = !user ? false : (isProfileLoading || isStreakLoading || isMealsLoading || isWeightLogsLoading || isGoalsLoading);
 
  const refreshAll = useCallback(async () => {
    if (!user?.id) return;
    await Promise.all([
      refetchProfile(),
      refetchGoals(),
      refetchStreak(),
      refetchMeals(),
      refetchWeightLogs()
    ]);
  }, [user?.id, refetchProfile, refetchGoals, refetchStreak, refetchMeals, refetchWeightLogs]);

  // Optimistic Mutations updating the query cache instantly
  const optimisticAddMeal = useCallback((mealPayload: any) => {
    if (!user?.id) return;
    const tempId = `temp-meal-${Date.now()}`;
    const newMeal = {
      id: tempId,
      food_name: mealPayload.food_name,
      calories: Number(mealPayload.calories),
      protein: Number(mealPayload.protein),
      carbs: Number(mealPayload.carbs),
      fat: Number(mealPayload.fat),
      image_url: mealPayload.image_url || null,
      meal_type: mealPayload.meal_type || "Snack",
      logged_at: new Date().toISOString(),
      user_id: user.id
    };

    // Update query cache instantly
    queryClient.setQueryData(["meals", user.id], (oldMeals: any[] | undefined) => {
      return [newMeal, ...(oldMeals || [])];
    });

    // Invalidate queries to sync with Supabase in the background
    queryClient.invalidateQueries({ queryKey: ["meals", user.id] });
    queryClient.invalidateQueries({ queryKey: ["streak", user.id] });
  }, [user?.id, queryClient]);

  const optimisticDeleteMeal = useCallback((mealId: string) => {
    if (!user?.id) return;
    queryClient.setQueryData(["meals", user.id], (oldMeals: any[] | undefined) => {
      return (oldMeals || []).filter(m => m.id !== mealId);
    });
    queryClient.invalidateQueries({ queryKey: ["meals", user.id] });
    queryClient.invalidateQueries({ queryKey: ["streak", user.id] });
  }, [user?.id, queryClient]);

  const optimisticAddWeight = useCallback((weight: number) => {
    if (!user?.id) return;
    const tempId = `temp-weight-${Date.now()}`;
    const newLog = {
      id: tempId,
      weight: Number(weight),
      created_at: new Date().toISOString(),
      user_id: user.id
    };

    queryClient.setQueryData(["weightLogs", user.id], (oldLogs: any[] | undefined) => {
      return [newLog, ...(oldLogs || [])];
    });

    queryClient.invalidateQueries({ queryKey: ["weightLogs", user.id] });
  }, [user?.id, queryClient]);

  const updateProfileState = useCallback((updatedProfileFields: any) => {
    if (!user?.id) return;
    queryClient.setQueryData(["profile", user.id], (oldProfile: any) => {
      return {
        ...oldProfile,
        ...updatedProfileFields
      };
    });
    queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
  }, [user?.id, queryClient]);

  const value = useMemo(() => ({
    user,
    profile,
    goals,
    streak,
    meals: meals || [],
    weightLogs: weightLogs || [],
    loading,
    refreshAll,
    optimisticAddMeal,
    optimisticDeleteMeal,
    optimisticAddWeight,
    updateProfileState
  }), [
    user,
    profile,
    goals,
    streak,
    meals,
    weightLogs,
    loading,
    refreshAll,
    optimisticAddMeal,
    optimisticDeleteMeal,
    optimisticAddWeight,
    updateProfileState
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

