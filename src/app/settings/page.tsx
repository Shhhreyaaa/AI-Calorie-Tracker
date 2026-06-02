"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  User, 
  Mail, 
  Calendar, 
  ChevronRight, 
  Loader2, 
  Check, 
  Sliders, 
  Shield, 
  Activity, 
  Sparkles, 
  Target, 
  Scale, 
  Trash2, 
  Download, 
  Bell, 
  Moon, 
  LogOut, 
  AlertCircle,
  FileText,
  Award,
  Heart,
  Droplet,
  Smartphone,
  Eye,
  Lock,
  ChevronDown
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type GoalType = "Weight Loss" | "Lean Muscle Gain" | "Maintenance" | "Body Recomposition";
type ActivityLevel = "Sedentary" | "Lightly Active" | "Moderately Active" | "Very Active";
type MealPreference = "Vegetarian" | "Non-Vegetarian" | "Vegan";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Profile Fields
  const [fullName, setFullName] = useState("Shreya Somi");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [height, setHeight] = useState(175); // cm
  const [weight, setWeight] = useState(75); // kg (current)
  const [targetWeight, setTargetWeight] = useState(70); // kg
  const [activity, setActivity] = useState<ActivityLevel>("Moderately Active");
  const [goal, setGoal] = useState<GoalType>("Lean Muscle Gain");
  const [mealPreference, setMealPreference] = useState<MealPreference>("Non-Vegetarian");
  const [createdDate, setCreatedDate] = useState("June 2026");

  // Daily nutrition targets (from goals table)
  const [calories, setCalories] = useState(2000);
  const [protein, setProtein] = useState(150);
  const [carbs, setCarbs] = useState(200);
  const [fat, setFat] = useState(65);

  // Personalization Toggles
  const [aiCoaching, setAiCoaching] = useState(true);
  const [weeklyEmails, setWeeklyEmails] = useState(true);
  const [mealReminders, setMealReminders] = useState(true);
  const [waterReminders, setWaterReminders] = useState(true);
  const [achievements, setAchievements] = useState(true);
  const [darkTheme, setDarkTheme] = useState(true);

  const [loggingOut, setLoggingOut] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Load targets from Supabase on mount
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }
        setUser(user);
        setEmail(user.email || "");

        // Format Member Since
        if (user.created_at) {
          const date = new Date(user.created_at);
          setCreatedDate(date.toLocaleDateString("en-US", { month: "long", year: "numeric" }));
        }

        // Fetch User Profile, nutrition goals, and latest weight log in parallel
        const [profileRes, goalRes, weightRes] = await Promise.all([
          supabase.from("users").select("*").eq("id", user.id).maybeSingle(),
          supabase.from("goals").select("*").eq("id", user.id).maybeSingle(),
          supabase.from("weight_logs").select("weight").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1)
        ]);

        const profile = profileRes.data;
        const goalData = goalRes.data;
        const weightData = weightRes.data;

        if (profile && profile.daily_calorie_target !== undefined && profile.daily_calorie_target !== null) {
          setCalories(profile.daily_calorie_target);
          setProtein(profile.protein_goal || 150);
          setCarbs(profile.carbs_goal || 200);
          setFat(profile.fat_goal || 65);
        } else if (goalData) {
          setCalories(goalData.calorie_target ?? goalData.calories);
          setProtein(goalData.protein_target ?? goalData.protein);
          setCarbs(goalData.carb_target ?? goalData.carbs);
          setFat(goalData.fat_target ?? goalData.fat);
        }

        // 3. Load biometrics from users table primarily, falling back to Auth metadata
        const metadata = user.user_metadata || {};
        setFullName(profile?.full_name || profile?.display_name || metadata.display_name || metadata.full_name || "Shreya Somi");
        setAge(profile?.age ?? (metadata.age ? Number(metadata.age) : 25));
        setGender(profile?.gender || metadata.gender || "male");
        setHeight(profile?.height_cm ?? (metadata.height ? Number(metadata.height) : 175));
        setTargetWeight(profile?.target_weight ?? (metadata.target_weight ? Number(metadata.target_weight) : 70));
        
        // Map activity level
        const currentActivity = profile?.activity_level || metadata.activity;
        if (currentActivity) {
          if (currentActivity === "Moderate") setActivity("Moderately Active");
          else if (currentActivity === "Active") setActivity("Very Active");
          else if (currentActivity === "Light") setActivity("Lightly Active");
          else if (currentActivity === "Sedentary") setActivity("Sedentary");
          else setActivity(currentActivity as any);
        }

        // Map goal type
        const currentGoal = profile?.goal_type || metadata.goal;
        if (currentGoal) {
          if (currentGoal === "Lose Fat") setGoal("Weight Loss");
          else if (currentGoal === "Gain Muscle") setGoal("Lean Muscle Gain");
          else if (currentGoal === "Maintain") setGoal("Maintenance");
          else setGoal(currentGoal as any);
        }

        setMealPreference(profile?.diet_preference || metadata.meal_preference || "Non-Vegetarian");

        if (weightData && weightData.length > 0) {
          setWeight(Number(weightData[0].weight));
        } else {
          setWeight(profile?.current_weight ?? (metadata.weight ? Number(metadata.weight) : 70));
        }

        // Personalization preferences
        if (profile?.theme_preference) {
          setDarkTheme(profile.theme_preference === "dark");
        } else if (metadata.preferences) {
          setAiCoaching(metadata.preferences.ai_coaching ?? true);
          setWeeklyEmails(metadata.preferences.weekly_emails ?? true);
          setMealReminders(metadata.preferences.meal_reminders ?? true);
          setWaterReminders(metadata.preferences.water_reminders ?? true);
          setAchievements(metadata.preferences.achievements ?? true);
          setDarkTheme(metadata.preferences.dark_theme ?? true);
        } else {
          const localPrefs = localStorage.getItem(`prefs_${user.id}`);
          if (localPrefs) {
            try {
              const parsed = JSON.parse(localPrefs);
              setAiCoaching(parsed.ai_coaching ?? true);
              setWeeklyEmails(parsed.weekly_emails ?? true);
              setMealReminders(parsed.meal_reminders ?? true);
              setWaterReminders(parsed.water_reminders ?? true);
              setAchievements(parsed.achievements ?? true);
              setDarkTheme(parsed.dark_theme ?? true);
            } catch (e) {
              console.error("Local preferences load issue:", e);
            }
          }
        }
      } catch (err) {
        console.error("Settings load error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadUserSettings();
  }, []);

  // Save profile and goals settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || saving) return;
    setSaving(true);
    setSaved(false);

    try {
      const supabase = createClient();

      // 1. Sync weight changes to weight_logs table if updated
      console.log("QUERY START", {
        operation: "select weight_logs",
        userId: user.id
      });

      const { data: latestLog, error: latestLogError } = await supabase
        .from("weight_logs")
        .select("weight")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      console.log("SUPABASE RESPONSE", {
        data: latestLog,
        error: latestLogError,
        errorMessage: latestLogError?.message,
        errorDetails: latestLogError?.details,
        errorHint: latestLogError?.hint,
        errorCode: latestLogError?.code
      });

      if (latestLogError) {
        throw new Error(
          JSON.stringify({
            message: latestLogError.message,
            details: latestLogError.details,
            hint: latestLogError.hint,
            code: latestLogError.code
          })
        );
      }

      const previousWeight = latestLog && latestLog.length > 0 ? Number(latestLog[0].weight) : null;
      if (previousWeight === null || previousWeight !== Number(weight)) {
        const payload = {
          user_id: user.id,
          weight: Number(weight),
          created_at: new Date().toISOString()
        };

        console.log("QUERY START", {
          operation: "insert weight_logs",
          payload
        });

        const { data: insertWeightData, error: insertWeightError } = await supabase
          .from("weight_logs")
          .insert(payload)
          .select();

        console.log("SUPABASE RESPONSE", {
          data: insertWeightData,
          error: insertWeightError,
          errorMessage: insertWeightError?.message,
          errorDetails: insertWeightError?.details,
          errorHint: insertWeightError?.hint,
          errorCode: insertWeightError?.code
        });

        if (insertWeightError) {
          throw new Error(
            JSON.stringify({
              message: insertWeightError.message,
              details: insertWeightError.details,
              hint: insertWeightError.hint,
              code: insertWeightError.code
            })
          );
        }
      }

      // 2. Sync profile details to users table (including all editable biometrics and macro goals)
      // Note: We mapped full_name to display_name and removed diet_preference & theme_preference columns
      const usersPayload = { 
        display_name: fullName,
        age: Number(age),
        gender,
        height_cm: Number(height),
        current_weight: Number(weight),
        target_weight: Number(targetWeight),
        activity_level: activity,
        goal_type: goal,
        daily_calorie_target: Number(calories),
        protein_goal: Number(protein),
        carbs_goal: Number(carbs),
        fat_goal: Number(fat),
        updated_at: new Date().toISOString()
      };

      console.log("QUERY START", {
        operation: "update users",
        payload: usersPayload,
        userId: user.id
      });

      const { data: updateUserData, error: profileError } = await supabase
        .from("users")
        .update(usersPayload)
        .eq("id", user.id)
        .select();

      console.log("SUPABASE RESPONSE", {
        data: updateUserData,
        error: profileError,
        errorMessage: profileError?.message,
        errorDetails: profileError?.details,
        errorHint: profileError?.hint,
        errorCode: profileError?.code
      });

      if (profileError) {
        throw new Error(
          JSON.stringify({
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
            code: profileError.code
          })
        );
      }

      // 3. Save Nutrition Goals targets in goals table
      const goalsPayload = {
        id: user.id,
        user_id: user.id,
        calorie_target: Number(calories),
        protein_target: Number(protein),
        carb_target: Number(carbs),
        fat_target: Number(fat),
        updated_at: new Date().toISOString()
      };

      console.log("GOALS UPSERT PAYLOAD", goalsPayload);

      if (!goalsPayload.user_id) {
        throw new Error("Cannot save goals: user_id is null or undefined.");
      }

      console.log("QUERY START", {
        operation: "upsert goals",
        payload: goalsPayload
      });

      const { data: upsertGoalsData, error: goalsError } = await supabase
        .from("goals")
        .upsert(goalsPayload, { onConflict: "user_id" })
        .select();

      console.log("SUPABASE RESPONSE", {
        data: upsertGoalsData,
        error: goalsError,
        errorMessage: goalsError?.message,
        errorDetails: goalsError?.details,
        errorHint: goalsError?.hint,
        errorCode: goalsError?.code
      });

      if (goalsError) {
        throw new Error(
          JSON.stringify({
            message: goalsError.message,
            details: goalsError.details,
            hint: goalsError.hint,
            code: goalsError.code
          })
        );
      }

      // 4. Update Supabase Auth user metadata
      const authPayload = {
        data: {
          display_name: fullName,
          age: Number(age),
          gender,
          height: Number(height),
          starting_weight: Number(weight),
          activity,
          goal,
          target_weight: Number(targetWeight),
          meal_preference: mealPreference,
          preferences: {
            ai_coaching: aiCoaching,
            weekly_emails: weeklyEmails,
            meal_reminders: mealReminders,
            water_reminders: waterReminders,
            achievements,
            dark_theme: darkTheme
          }
        }
      };

      console.log("QUERY START", {
        operation: "update auth user",
        payload: authPayload
      });

      const { data: authData, error: authError } = await supabase.auth.updateUser(authPayload);

      console.log("SUPABASE RESPONSE", {
        data: authData,
        error: authError,
        errorMessage: authError?.message,
        errorDetails: (authError as any)?.details,
        errorHint: (authError as any)?.hint,
        errorCode: (authError as any)?.code
      });

      if (authError) {
        throw new Error(
          JSON.stringify({
            message: authError.message,
            details: (authError as any).details,
            hint: (authError as any).hint,
            code: (authError as any).code
          })
        );
      }



      // Update localStorage backup
      localStorage.setItem(`prefs_${user.id}`, JSON.stringify({
        ai_coaching: aiCoaching,
        weekly_emails: weeklyEmails,
        meal_reminders: mealReminders,
        water_reminders: waterReminders,
        achievements,
        dark_theme: darkTheme
      }));

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      console.error("FULL SETTINGS ERROR:", err);

      const errorMessage =
        err?.message ||
        err?.error_description ||
        err?.details ||
        JSON.stringify(err);

      alert(`Settings Save Failed:\n${errorMessage}`);

      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Sign out session
  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout error:", err);
      window.location.href = "/login";
    }
  };

  // Delete profile data and log out
  const handleDeleteAccount = async () => {
    if (!user || deletingAccount) return;
    setDeletingAccount(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("users").delete().eq("id", user.id);
      if (error) throw error;
      await supabase.auth.signOut();
      window.location.href = "/signup";
    } catch (err: any) {
      alert(err.message || "Could not complete account deletion.");
      setDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  // Compile full user profile, goals, meals list, and weight logs as a downloadable JSON file
  const handleExportData = async () => {
    if (!user) return;
    try {
      const supabase = createClient();
      const [mealsRes, weightRes, goalsRes, streakRes] = await Promise.all([
        supabase.from("meals").select("*").eq("user_id", user.id),
        supabase.from("weight_logs").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
        supabase.from("goals").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("streaks").select("*").eq("id", user.id).maybeSingle()
      ]);

      const dataPackage = {
        app_name: "Fitness AI Portal",
        export_date: new Date().toISOString(),
        profile: {
          id: user.id,
          email: user.email,
          fullName,
          age,
          gender,
          height,
          currentWeight: weight,
          targetWeight,
          activity,
          goal,
          mealPreference,
          preferences: {
            aiCoaching,
            weeklyEmails,
            mealReminders,
            waterReminders,
            achievements,
            darkTheme
          }
        },
        goals: goalsRes.data || null,
        streak: streakRes.data || null,
        weight_history: weightRes.data || [],
        meal_logs: mealsRes.data || []
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataPackage, null, 2));
      const dlLink = document.createElement("a");
      dlLink.setAttribute("href", dataStr);
      dlLink.setAttribute("download", `fitness_ai_export_${fullName.toLowerCase().replace(/\s+/g, "_")}.json`);
      document.body.appendChild(dlLink);
      dlLink.click();
      dlLink.remove();
    } catch (err) {
      console.error("Export failure:", err);
      alert("Failed to export your health database. Please try again.");
    }
  };

  // Download simple text-based weekly summaries
  const handleDownloadWeeklyReport = () => {
    const textReport = `
==================================================
        FITNESS AI PREMIUM WEEKLY SUMMARY
==================================================
Generated At: ${new Date().toLocaleString()}
User: ${fullName} (${email})
Membership Started: ${createdDate}
Primary Objective: ${goal}

BIOMETRIC MATRIX:
--------------------------------------------------
- Age: ${age} years
- Gender: ${gender.toUpperCase()}
- Height: ${height} cm
- Weight: ${weight} kg
- Target Weight: ${targetWeight} kg
- BMI Score: ${bmi.toFixed(1)} (${bmiCategory})
- Maintenance Calories (TDEE): ${maintenanceCalories} kcal/day

NUTRITIONAL SPLIT TARGETS:
--------------------------------------------------
- Daily Energy Goal: ${calories} kcal
- Daily Protein: ${protein}g (${proteinPercentage}% of calories)
- Daily Carbs: ${carbs}g (${carbsPercentage}% of calories)
- Daily Fat: ${fat}g (${fatPercentage}% of calories)

AI NUTRITIONAL INSIGHTS:
--------------------------------------------------
- Consume clean proteins split across 3-4 feeds.
- Align carbs around your active workout times.
- Keep drinking water to assist with muscle density and fat mobilization.
==================================================
`;
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(textReport);
    const dlLink = document.createElement("a");
    dlLink.setAttribute("href", dataStr);
    dlLink.setAttribute("download", `weekly_summary_${fullName.toLowerCase().replace(/\s+/g, "_")}.txt`);
    document.body.appendChild(dlLink);
    dlLink.click();
    dlLink.remove();
  };

  // Download visual progress card as a text layout
  const handleDownloadProgressCard = () => {
    const progressCard = `
**************************************************
          FITNESS AI PROGRESS CARD
**************************************************
Athlete: ${fullName}
Member Since: ${createdDate}
Objective: ${goal}

LATEST RECORDINGS:
- Height: ${height} cm
- Current weight: ${weight} kg
- Target weight: ${targetWeight} kg
- BMI Score: ${bmi.toFixed(1)} [${bmiCategory}]

DAILY TARGET METRICS:
- Calorie Budget: ${calories} kcal
- Protein Intake: ${protein}g
- Carbs Intake: ${carbs}g
- Fat Intake: ${fat}g

"Success is built daily. Let's conquer the next log."
**************************************************
`;
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(progressCard);
    const dlLink = document.createElement("a");
    dlLink.setAttribute("href", dataStr);
    dlLink.setAttribute("download", `progress_card_${fullName.toLowerCase().replace(/\s+/g, "_")}.txt`);
    document.body.appendChild(dlLink);
    dlLink.click();
    dlLink.remove();
  };

  // Mifflin-St Jeor computations
  const bmi = height > 0 ? weight / Math.pow(height / 100, 2) : 0;
  let bmiCategory = "Normal";
  let bmiColor = "text-emerald-400";
  let bmiBg = "bg-emerald-500/10 border-emerald-500/20";
  if (bmi < 18.5) {
    bmiCategory = "Underweight";
    bmiColor = "text-sky-400";
    bmiBg = "bg-sky-500/10 border-sky-500/20";
  } else if (bmi >= 25 && bmi < 30) {
    bmiCategory = "Overweight";
    bmiColor = "text-amber-400";
    bmiBg = "bg-amber-500/10 border-amber-500/20";
  } else if (bmi >= 30) {
    bmiCategory = "Obese";
    bmiColor = "text-rose-500";
    bmiBg = "bg-rose-500/10 border-rose-500/20";
  }

  const bmr = 10 * weight + 6.25 * height - 5 * age + (gender === "male" ? 5 : -161);
  const activityMultipliers = {
    Sedentary: 1.2,
    "Lightly Active": 1.375,
    "Moderately Active": 1.55,
    "Very Active": 1.725
  };
  const maintenanceCalories = Math.round(bmr * activityMultipliers[activity] || bmr * 1.55);

  // Macro calorie distributions
  const pKcal = protein * 4;
  const cKcal = carbs * 4;
  const fKcal = fat * 9;
  const totalMacroKcal = pKcal + cKcal + fKcal;
  const proteinPercentage = totalMacroKcal > 0 ? Math.round((pKcal / totalMacroKcal) * 100) : 0;
  const carbsPercentage = totalMacroKcal > 0 ? Math.round((cKcal / totalMacroKcal) * 100) : 0;
  const fatPercentage = totalMacroKcal > 0 ? Math.round((fKcal / totalMacroKcal) * 100) : 0;

  // Custom Neon Toggle Switch
  const NeonToggle = ({ 
    checked, 
    onChange, 
    label, 
    description 
  }: { 
    checked: boolean, 
    onChange: (val: boolean) => void, 
    label: string, 
    description: string 
  }) => {
    return (
      <div className="flex items-center justify-between p-3 rounded-2xl bg-white/4 border border-white/5 hover:border-white/10 transition-all">
        <div className="min-w-0 flex-1 pr-4">
          <span className="text-xs font-bold text-slate-205 block">{label}</span>
          <span className="text-[10px] text-slate-400 mt-0.5 block leading-tight">{description}</span>
        </div>
        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-300 focus:outline-none relative flex items-center shrink-0 cursor-pointer ${
            checked ? "bg-brand-green shadow-[0_0_12px_rgba(0,255,136,0.35)]" : "bg-slate-900 border border-white/10"
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-md ${
              checked ? "translate-x-4.5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    );
  };

  // Preference Button Selector
  const PreferenceCardGroup = <T extends string>({
    options,
    value,
    onChange,
    label
  }: {
    options: { key: T, label: string, desc?: string }[],
    value: T,
    onChange: (val: T) => void,
    label: string
  }) => {
    return (
      <div className="space-y-2">
        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{label}</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {options.map((opt) => {
            const isSelected = value === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => onChange(opt.key)}
                className={`p-3 rounded-xl border text-left transition-all hover:scale-[1.01] flex flex-col justify-center cursor-pointer ${
                  isSelected
                    ? "bg-brand-green/10 border-brand-green shadow-[0_0_12px_rgba(0,255,136,0.15)] text-white"
                    : "bg-slate-950/60 border-white/5 text-slate-400 hover:text-white"
                }`}
              >
                <span className="text-xs font-bold block">{opt.label}</span>
                {opt.desc && <span className="text-[9px] text-slate-450 mt-0.5 block leading-tight">{opt.desc}</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-20 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-3 w-16 bg-slate-800 rounded" />
            <div className="h-6 w-36 bg-slate-800 rounded" />
          </div>
          <div className="h-8 w-24 bg-slate-800 rounded-xl" />
        </div>

        {/* Input Cards Skeletons */}
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="glass-panel rounded-2xl p-5 h-20 bg-slate-900/10 border-white/5" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header title */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">PREFERENCES</span>
          <h2 className="font-outfit text-2xl font-bold tracking-tight text-white">System Settings</h2>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="bg-white/5 border border-white/10 hover:border-white/20 text-slate-350 hover:text-white transition-all text-[11px] font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
        >
          {loggingOut ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
          <span>Sign Out</span>
        </button>
      </div>

      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Profile & Body Metrics */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* PROFILE CARD */}
          <div className="glass-panel rounded-[32px] p-6 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full" />
            
            {/* Top Info row */}
            <div className="flex gap-4 items-center">
              {/* Profile Avatar with glow */}
              <div 
                className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-650 via-indigo-650 to-cyan-500 flex items-center justify-center text-white font-outfit text-xl font-black shrink-0"
                style={{
                  boxShadow: "0 0 20px rgba(139,92,246,0.35), inset 0 0 10px rgba(255,255,255,0.2)"
                }}
              >
                {fullName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "AT"}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-outfit text-lg font-black text-white leading-tight truncate">{fullName}</h3>
                <p className="text-[10px] text-slate-400 mt-1 truncate">{email}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="bg-brand-green/10 text-brand-green text-[9px] font-bold px-2 py-0.5 rounded-lg border border-brand-green/20 uppercase tracking-widest inline-block">
                    {goal}
                  </span>
                  <span className="bg-slate-900 border border-white/5 text-slate-400 text-[8px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wide inline-block">
                    Since {createdDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="space-y-4 pt-2 border-t border-white/5 text-xs font-semibold">
              
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Full Name</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="e.g. Aadi Shah"
                  className="w-full glass-input rounded-xl px-4 py-2.5 outline-none text-white focus:border-brand-green text-xs"
                />
              </div>

              {/* Grid: Age & Gender */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Age (years)</label>
                  <input 
                    type="number" 
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    required
                    min="1" max="120"
                    className="w-full glass-input rounded-xl px-4 py-2.5 outline-none text-white focus:border-brand-green text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Gender</label>
                  <select 
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full glass-input rounded-xl px-4 py-2.5 outline-none text-white focus:border-brand-green text-xs bg-slate-950"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              {/* Grid: Height & Current Weight */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Height (cm)</label>
                  <input 
                    type="number" 
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    required
                    min="50" max="250"
                    className="w-full glass-input rounded-xl px-4 py-2.5 outline-none text-white focus:border-brand-green text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Current Weight (kg)</label>
                  <input 
                    type="number" 
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    required
                    min="20" max="300"
                    className="w-full glass-input rounded-xl px-4 py-2.5 outline-none text-white focus:border-brand-green text-xs"
                  />
                </div>
              </div>

              {/* Target Weight */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Target Weight (kg)</label>
                <input 
                  type="number" 
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(Number(e.target.value))}
                  required
                  min="20" max="300"
                  className="w-full glass-input rounded-xl px-4 py-2.5 outline-none text-white focus:border-brand-green text-xs"
                />
              </div>

              {/* Goal Type selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Fitness Goal</label>
                <select 
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as any)}
                  className="w-full glass-input rounded-xl px-4 py-2.5 outline-none text-white focus:border-brand-green text-xs bg-slate-950"
                >
                  <option value="Weight Loss">Weight Loss</option>
                  <option value="Lean Muscle Gain">Lean Muscle Gain</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Body Recomposition">Body Recomposition</option>
                </select>
              </div>

            </div>
          </div>

          {/* BODY METRICS */}
          <div className="space-y-3">
            <h4 className="font-outfit text-xs font-bold text-slate-350 uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-brand-green" /> Body Metrics
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              
              {/* BMI Card */}
              <div className="glass-panel p-4.5 rounded-2xl relative overflow-hidden group hover:scale-[1.01]">
                <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 blur-2xl rounded-full" />
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Body Mass Index (BMI)</span>
                <div className="font-outfit text-xl font-black text-white mt-1.5">{bmi.toFixed(1)}</div>
                <div className={`text-[9px] font-bold ${bmiColor} mt-1.5 flex items-center gap-1`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  <span>{bmiCategory}</span>
                </div>
              </div>

              {/* Current Weight Card */}
              <div className="glass-panel p-4.5 rounded-2xl relative overflow-hidden group hover:scale-[1.01]">
                <div className="absolute top-0 right-0 w-20 h-20 bg-sky-500/5 blur-2xl rounded-full" />
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Body Weight</span>
                <div className="font-outfit text-xl font-black text-white mt-1.5">{weight} kg</div>
                <div className="text-[9px] text-slate-400 mt-1.5 leading-tight">
                  {weight - targetWeight > 0 ? (
                    <span>Lose <strong className="text-brand-coral">{(weight - targetWeight).toFixed(1)} kg</strong> to goal</span>
                  ) : weight - targetWeight < 0 ? (
                    <span>Gain <strong className="text-brand-green">{Math.abs(weight - targetWeight).toFixed(1)} kg</strong> to goal</span>
                  ) : (
                    <span className="text-brand-green font-bold">Goal Achieved!</span>
                  )}
                </div>
              </div>

              {/* Target Weight Card */}
              <div className="glass-panel p-4.5 rounded-2xl relative overflow-hidden group hover:scale-[1.01]">
                <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 blur-2xl rounded-full" />
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Target Weight</span>
                <div className="font-outfit text-xl font-black text-white mt-1.5">{targetWeight} kg</div>
                <div className="text-[9px] text-slate-400 mt-1.5 leading-tight">Mifflin-St Jeor Target</div>
              </div>

              {/* Maintenance Calories TDEE Card */}
              <div className="glass-panel p-4.5 rounded-2xl relative overflow-hidden group hover:scale-[1.01]">
                <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 blur-2xl rounded-full" />
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Maintenance Calories</span>
                <div className="font-outfit text-base font-black text-brand-green mt-1.5">{maintenanceCalories} kcal</div>
                <div className="text-[9px] text-slate-450 mt-1.5 leading-tight">Estimated TDEE</div>
              </div>

            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Nutrition Targets, Personalization, Fitness preferences, Privacy & Data */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* NUTRITION TARGETS */}
          <div className="glass-panel rounded-[32px] p-6 space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="font-outfit text-sm font-bold flex items-center gap-1.5 text-white">
                <Sliders className="w-4.5 h-4.5 text-brand-green" /> Nutrition Target Modifiers
              </h3>
              {saved && (
                <span className="bg-brand-green/10 border border-brand-green/20 text-brand-green text-[9px] font-bold px-2 py-0.5 rounded-md animate-fade-in">
                  Saved successfully
                </span>
              )}
            </div>

            {/* Visual Macro Percentage split bar */}
            <div className="space-y-2 bg-slate-950/40 p-3 rounded-2xl border border-white/5">
              <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                <span>Macro Calorie Split</span>
                <span>{proteinPercentage}% P • {carbsPercentage}% C • {fatPercentage}% F</span>
              </div>
              <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-900 border border-white/5">
                <div style={{ width: `${proteinPercentage}%` }} className="bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]" />
                <div style={{ width: `${carbsPercentage}%` }} className="bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.2)]" />
                <div style={{ width: `${fatPercentage}%` }} className="bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.2)]" />
              </div>
              <div className="flex gap-4 justify-center text-[9px] font-bold mt-1">
                <span className="flex items-center gap-1 text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Protein</span>
                <span className="flex items-center gap-1 text-sky-400"><span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> Carbs</span>
                <span className="flex items-center gap-1 text-rose-450"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Fat</span>
              </div>
            </div>

            {/* Calorie Goal Slider */}
            <div className="space-y-2 text-xs font-semibold">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Calorie Budget</span>
                <span className="font-outfit text-sm font-extrabold text-brand-green">{calories} kcal</span>
              </div>
              <input 
                type="range"
                min="1000"
                max="5000"
                step="50"
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-900 rounded-lg cursor-pointer h-1.5"
              />
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>1000 kcal</span>
                <span>5000 kcal</span>
              </div>
            </div>

            {/* Macro Goals Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
              
              {/* Protein Slider */}
              <div className="bg-slate-950/20 p-3 rounded-2xl border border-white/5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Protein Goal</span>
                  <span className="font-outfit text-xs font-extrabold text-white">{protein}g</span>
                </div>
                <input 
                  type="range"
                  min="50"
                  max="300"
                  step="5"
                  value={protein}
                  onChange={(e) => setProtein(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-slate-900 rounded-lg cursor-pointer h-1.5"
                />
                <div className="flex justify-between text-[8px] text-slate-500">
                  <span>50g</span>
                  <span>300g</span>
                </div>
              </div>

              {/* Carbs Slider */}
              <div className="bg-slate-950/20 p-3 rounded-2xl border border-white/5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Carb Goal</span>
                  <span className="font-outfit text-xs font-extrabold text-white">{carbs}g</span>
                </div>
                <input 
                  type="range"
                  min="50"
                  max="500"
                  step="5"
                  value={carbs}
                  onChange={(e) => setCarbs(Number(e.target.value))}
                  className="w-full accent-sky-400 bg-slate-900 rounded-lg cursor-pointer h-1.5"
                />
                <div className="flex justify-between text-[8px] text-slate-500">
                  <span>50g</span>
                  <span>500g</span>
                </div>
              </div>

              {/* Fat Slider */}
              <div className="bg-slate-950/20 p-3 rounded-2xl border border-white/5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Fat Goal</span>
                  <span className="font-outfit text-xs font-extrabold text-white">{fat}g</span>
                </div>
                <input 
                  type="range"
                  min="20"
                  max="150"
                  step="2"
                  value={fat}
                  onChange={(e) => setFat(Number(e.target.value))}
                  className="w-full accent-rose-500 bg-slate-900 rounded-lg cursor-pointer h-1.5"
                />
                <div className="flex justify-between text-[8px] text-slate-500">
                  <span>20g</span>
                  <span>150g</span>
                </div>
              </div>

            </div>

            <button 
              type="submit"
              disabled={saving}
              className="w-full bg-brand-green hover:bg-emerald-600 disabled:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl shadow-glow active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : saved ? (
                <>
                  <Check className="w-4 h-4" /> Calibration Success
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Calibrate Health Settings
                </>
              )}
            </button>
          </div>

          {/* PERSONALIZATION */}
          <div className="glass-panel rounded-[32px] p-6 space-y-4">
            <h3 className="font-outfit text-sm font-bold flex items-center gap-1.5 text-white">
              <Bell className="w-4.5 h-4.5 text-brand-sky" /> Personalization Parameters
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <NeonToggle 
                checked={aiCoaching} 
                onChange={setAiCoaching} 
                label="AI Daily Coaching" 
                description="Live insights from health model" 
              />
              <NeonToggle 
                checked={weeklyEmails} 
                onChange={setWeeklyEmails} 
                label="Weekly Report Emails" 
                description="Formatted digest PDF card" 
              />
              <NeonToggle 
                checked={mealReminders} 
                onChange={setMealReminders} 
                label="Meal Reminders" 
                description="Alert logs before macro intervals" 
              />
              <NeonToggle 
                checked={waterReminders} 
                onChange={setWaterReminders} 
                label="Water Reminders" 
                description="Hydration pacing notifications" 
              />
              <NeonToggle 
                checked={achievements} 
                onChange={setAchievements} 
                label="Achievements Sync" 
                description="XP tracking streaks alerts" 
              />
              <NeonToggle 
                checked={darkTheme} 
                onChange={setDarkTheme} 
                label="Dark Theme" 
                description="Premium cyberpunk visual display" 
              />
            </div>
          </div>

          {/* FITNESS PREFERENCES */}
          <div className="glass-panel rounded-[32px] p-6 space-y-4">
            <h3 className="font-outfit text-sm font-bold flex items-center gap-1.5 text-white">
              <Target className="w-4.5 h-4.5 text-purple-400" /> Fitness Preferences
            </h3>

            <PreferenceCardGroup
              label="Workout Frequency"
              value={activity}
              onChange={setActivity}
              options={[
                { key: "Sedentary", label: "Sedentary", desc: "Desk job / minimal exercise" },
                { key: "Lightly Active", label: "Light Active", desc: "Light workouts 1-3d/wk" },
                { key: "Moderately Active", label: "Moderate Active", desc: "Active exercise 3-5d/wk" },
                { key: "Very Active", label: "Very Active", desc: "Daily athletic training" }
              ]}
            />

            <PreferenceCardGroup
              label="Meal Preference"
              value={mealPreference}
              onChange={setMealPreference}
              options={[
                { key: "Vegetarian", label: "Vegetarian", desc: "Plant foods & dairy" },
                { key: "Non-Vegetarian", label: "Non-Vegetarian", desc: "Includes fish & poultry" },
                { key: "Vegan", label: "Vegan", desc: "100% plant-based inputs" }
              ]}
            />
          </div>

          {/* PRIVACY & DATA */}
          <div className="glass-panel rounded-[32px] p-6 space-y-4">
            <h3 className="font-outfit text-sm font-bold flex items-center gap-1.5 text-white">
              <Shield className="w-4.5 h-4.5 text-rose-450" /> Privacy & Data Management
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              
              {/* Export Data */}
              <div 
                onClick={handleExportData}
                className="p-3 rounded-2xl bg-white/4 border border-white/5 hover:border-brand-green/20 transition-all flex justify-between items-center cursor-pointer group"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <span className="font-bold text-slate-200 block group-hover:text-brand-green transition-colors">Export My Data</span>
                  <span className="text-[9px] text-slate-450 block mt-0.5">Download full logs history (JSON)</span>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-brand-green transition-all" />
              </div>

              {/* Download Weekly Summary */}
              <div 
                onClick={handleDownloadWeeklyReport}
                className="p-3 rounded-2xl bg-white/4 border border-white/5 hover:border-brand-sky/20 transition-all flex justify-between items-center cursor-pointer group"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <span className="font-bold text-slate-200 block group-hover:text-brand-sky transition-colors">Download Weekly Reports</span>
                  <span className="text-[9px] text-slate-450 block mt-0.5">Generate biometric reports</span>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-brand-sky transition-all" />
              </div>

              {/* Download Progress Card */}
              <div 
                onClick={handleDownloadProgressCard}
                className="p-3 rounded-2xl bg-white/4 border border-white/5 hover:border-purple-400/20 transition-all flex justify-between items-center cursor-pointer group"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <span className="font-bold text-slate-200 block group-hover:text-purple-400 transition-colors">Download Progress Card</span>
                  <span className="text-[9px] text-slate-450 block mt-0.5">Save summary milestone badge</span>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-purple-400 transition-all" />
              </div>

              {/* Delete Account */}
              <div 
                onClick={() => setShowDeleteModal(true)}
                className="p-3 rounded-2xl bg-rose-950/10 border border-rose-900/10 hover:border-rose-600/35 transition-all flex justify-between items-center cursor-pointer group"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <span className="font-bold text-rose-400 block group-hover:text-rose-500 transition-colors">Delete Account</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">Permanently purge all data</span>
                </div>
                <Trash2 className="w-4 h-4 text-rose-500 group-hover:text-rose-600 transition-all" />
              </div>

            </div>
          </div>

        </div>

      </form>

      {/* Account Deletion Confirmation Modal Overlay */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="glass-panel border-rose-500/20 rounded-[32px] max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 animate-pulse" />
            </div>
            
            <div className="space-y-1.5">
              <h4 className="font-outfit text-base font-black text-white">Permanently Delete Account?</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                This action is irreversible. All of your meal scans, weights progression, goals, and history will be permanently purged from the database.
              </p>
            </div>

            <div className="flex gap-3 text-xs font-bold pt-2">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 border border-white/5 hover:bg-slate-800 text-slate-300 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer flex items-center justify-center gap-1 shadow-glow shadow-rose-950/20"
              >
                {deletingAccount ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Delete Data"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
