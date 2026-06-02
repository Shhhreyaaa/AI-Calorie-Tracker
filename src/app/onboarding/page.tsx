"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  Loader2, 
  Flame, 
  Scale, 
  Activity, 
  Target, 
  TrendingDown, 
  TrendingUp, 
  Check, 
  Heart,
  Brain,
  Award,
  Zap,
  Shield,
  Compass,
  AlertCircle,
  Egg,
  Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

type GoalType = 
  | "Lose Fat" 
  | "Build Muscle" 
  | "Body Recomposition" 
  | "Improve Athletic Performance" 
  | "General Health" 
  | "Healthy Weight Gain" 
  | "Improve Energy & Focus" 
  | "Custom Goal";

type ActivityLevel = "Sedentary" | "Lightly Active" | "Moderately Active" | "Very Active" | "Athlete";
type DietPreference = "Non Vegetarian" | "Vegetarian" | "Vegan" | "Eggetarian" | "No Preference";
type FitnessExperience = "Beginner" | "Intermediate" | "Advanced";
type MotivationType = "Looking Better" | "Building Strength" | "Improving Health" | "Sports Performance" | "Confidence" | "Discipline";

interface GoalAvatar {
  key: string;
  name: string;
  emoji: string;
  desc: string;
  targetGoal: GoalType;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false); // Step 5 processing loader
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // --- Step 1: Goals & Avatars ---
  const [selectedAvatar, setSelectedAvatar] = useState<string>("Fat Loss");
  const [goal, setGoal] = useState<GoalType>("Lose Fat");
  const [customGoal, setCustomGoal] = useState<string>("");

  // --- Step 2: Demographics ---
  const [fullName, setFullName] = useState<string>("");
  const [age, setAge] = useState<number>(25);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [height, setHeight] = useState<number>(175); // cm
  const [weight, setWeight] = useState<number>(75);  // kg
  const [targetWeight, setTargetWeight] = useState<number>(70); // kg

  // --- Step 3: Lifestyle & Diet ---
  const [activity, setActivity] = useState<ActivityLevel>("Moderately Active");
  const [diet, setDiet] = useState<DietPreference>("Non Vegetarian");

  // --- Step 4: Experience & Motivation ---
  const [experience, setExperience] = useState<FitnessExperience>("Intermediate");
  const [motivation, setMotivation] = useState<MotivationType>("Building Strength");

  // --- Computed Targets ---
  const [calculated, setCalculated] = useState({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65
  });

  const [loadingProgress, setLoadingProgress] = useState(0);

  // Goal Avatars list
  const goalAvatars: GoalAvatar[] = [
    { key: "Fat Loss", name: "Fat Loss", emoji: "🔥", desc: "Lean definition", targetGoal: "Lose Fat" },
    { key: "Bodybuilder", name: "Bodybuilder", emoji: "💪", desc: "Maximum hypertrophy", targetGoal: "Build Muscle" },
    { key: "Lean Athlete", name: "Lean Athlete", emoji: "⚡", desc: "Power & agility", targetGoal: "Body Recomposition" },
    { key: "Powerlifter", name: "Powerlifter", emoji: "🏋️", desc: "Raw strength", targetGoal: "Build Muscle" },
    { key: "Runner", name: "Runner", emoji: "🏃‍♂️", desc: "Cardio endurance", targetGoal: "Improve Athletic Performance" },
    { key: "Wellness", name: "Wellness", emoji: "🧘", desc: "Longevity & balance", targetGoal: "General Health" }
  ];

  // Goals list
  const goalOptions = [
    { type: "Lose Fat" as GoalType, icon: Flame, title: "Lose Fat", desc: "Reduce body fat while preserving muscle." },
    { type: "Build Muscle" as GoalType, icon: TrendingUp, title: "Build Muscle", desc: "Maximize lean muscle growth and strength." },
    { type: "Body Recomposition" as GoalType, icon: Activity, title: "Body Recomposition", desc: "Lose fat and gain muscle simultaneously." },
    { type: "Improve Athletic Performance" as GoalType, icon: Zap, title: "Improve Athletic Performance", desc: "Optimize endurance, speed, and recovery." },
    { type: "General Health" as GoalType, icon: Heart, title: "General Health", desc: "Focus on longevity, energy, and healthy habits." },
    { type: "Healthy Weight Gain" as GoalType, icon: Scale, title: "Healthy Weight Gain", desc: "Gain weight gradually with quality nutrition." },
    { type: "Improve Energy & Focus" as GoalType, icon: Brain, title: "Improve Energy & Focus", desc: "Nutrition optimized for productivity and mental focus." },
    { type: "Custom Goal" as GoalType, icon: Target, title: "Custom Goal", desc: "Define your own customized health target." }
  ];

  // Verify auth session on load
  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
        setFullName(user.user_metadata?.display_name || user.user_metadata?.full_name || "");
      }
    };
    checkUser();
  }, []);

  // Compute profile completion percentage based on current step
  const getProfileCompletion = () => {
    if (step === 1) return 20;
    if (step === 2) return 50;
    if (step === 3) return 70;
    if (step === 4) return 90;
    return 100;
  };

  const handleNextStep = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (!fullName.trim()) {
        setErrorToast("Please enter your name to personalize your plan.");
        setTimeout(() => setErrorToast(null), 3000);
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      // Calculate calorie targets & launch processing simulator
      calculateTargets();
      setStep(5);
      setLoading(true);
      setLoadingProgress(0);

      // Ticking loader simulation
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setLoading(false);
              setStep(6);
            }, 600);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }
  };

  const handlePrevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleAvatarClick = (avatar: GoalAvatar) => {
    setSelectedAvatar(avatar.key);
    setGoal(avatar.targetGoal);
  };

  const calculateTargets = () => {
    // 1. Mifflin-St Jeor BMR
    const bmr = 10 * weight + 6.25 * height - 5 * age + (gender === "male" ? 5 : -161);

    // 2. Activity Multiplier
    const activityMultipliers = {
      Sedentary: 1.2,
      "Lightly Active": 1.375,
      "Moderately Active": 1.55,
      "Very Active": 1.725,
      Athlete: 1.9
    };
    const tdee = bmr * activityMultipliers[activity];

    // 3. Goal Calorie and Macro Splitting
    let targetCalories = Math.round(tdee);
    let targetProtein = 150;
    let targetFat = 65;

    if (goal === "Lose Fat") {
      targetCalories = Math.round(tdee - 500);
      if (targetCalories < 1200) targetCalories = 1200; // safe floor
      targetProtein = Math.round(weight * 2.0); // 2.0g per kg
      targetFat = Math.round(weight * 0.8);     // 0.8g per kg
    } else if (goal === "Build Muscle") {
      targetCalories = Math.round(tdee + 300);
      targetProtein = Math.round(weight * 2.2); // 2.2g per kg
      targetFat = Math.round(weight * 1.0);     // 1.0g per kg
    } else if (goal === "Body Recomposition") {
      targetCalories = Math.round(tdee);
      targetProtein = Math.round(weight * 2.2); // high protein recomp
      targetFat = Math.round(weight * 0.9);
    } else if (goal === "Improve Athletic Performance") {
      targetCalories = Math.round(tdee);
      targetProtein = Math.round(weight * 1.8);
      targetFat = Math.round(weight * 0.9);
    } else if (goal === "Healthy Weight Gain") {
      targetCalories = Math.round(tdee + 400);
      targetProtein = Math.round(weight * 1.8);
      targetFat = Math.round(weight * 1.0);
    } else if (goal === "Improve Energy & Focus") {
      targetCalories = Math.round(tdee);
      targetProtein = Math.round(weight * 2.0); // higher protein & healthy fats
      targetFat = Math.round(weight * 1.1);
    } else {
      // General Health & Custom Goal
      targetCalories = Math.round(tdee);
      targetProtein = Math.round(weight * 1.8);
      targetFat = Math.round(weight * 0.9);
    }

    // Carbs takes remainder calories
    const proteinKcal = targetProtein * 4;
    const fatKcal = targetFat * 9;
    const carbsKcal = Math.max(targetCalories - (proteinKcal + fatKcal), 0);
    const targetCarbs = Math.round(carbsKcal / 4);

    setCalculated({
      calories: targetCalories,
      protein: targetProtein,
      carbs: targetCarbs,
      fat: targetFat
    });
  };

  const handleSaveOnboarding = async () => {
    if (!user || saving) return;
    setSaving(true);
    setErrorToast(null);

    const goalName = goal === "Custom Goal" ? `Custom: ${customGoal}` : goal;

    // Goals Payload for the goals table (only columns that exist in the goals table)
    const payload = {
      id: user.id,
      user_id: user.id,
      calories: calculated.calories,
      protein: calculated.protein,
      carbs: calculated.carbs,
      fat: calculated.fat,
      calorie_target: calculated.calories,
      protein_target: calculated.protein,
      carb_target: calculated.carbs,
      fat_target: calculated.fat,
      updated_at: new Date().toISOString()
    };

    // Debugging logs as requested
    console.log("Authenticated User:", user);

    try {
      const supabase = createClient();

      // 1. Write Onboarding biometrics and targets to public.users table
      const { error: usersError } = await supabase
        .from("users")
        .update({
          display_name: fullName,
          age: Number(age),
          gender,
          height_cm: Number(height),
          current_weight: Number(weight),
          target_weight: Number(targetWeight),
          activity_level: activity,
          goal_type: goalName,
          daily_calorie_target: calculated.calories,
          protein_goal: calculated.protein,
          carbs_goal: calculated.carbs,
          fat_goal: calculated.fat,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (usersError) {
        console.error("Users Table Update Error:", usersError);
        throw new Error(`Profile sync issue: ${usersError.message}`);
      }

      // 2. Insert/Upsert goals in public.goals table
      console.log("GOALS UPSERT PAYLOAD", payload);

      if (!payload.user_id) {
        throw new Error("Cannot save goals: user_id is null or undefined.");
      }

      const result = await supabase
        .from("goals")
        .upsert(payload, { onConflict: "user_id" })
        .select();

      console.log("Goals Insert Result:", result);

      if (result.error) {
        console.error("Goals Insert Error:", result.error);
        throw new Error(`Database permissions issue: ${result.error.message}`);
      }

      // 3. Write Auth Metadata space to prevent reloading onboarding
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          display_name: fullName,
          age: Number(age),
          gender,
          height: Number(height),
          starting_weight: Number(weight),
          activity,
          goal: goalName,
          target_weight: Number(targetWeight),
          meal_preference: diet,
          onboarding_completed: true
        }
      });
      if (authError) throw authError;

      // Successfully saved goals -> Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Onboarding Save Catch Exception:", err);
      setErrorToast(err.message || "Failed to link goals profile. RLS policy violation.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center py-10 px-4 relative">
      {/* Background Radial Glow */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      {/* Alert toast notification */}
      <AnimatePresence>
        {errorToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] max-w-md w-[calc(100%-2rem)] bg-rose-950/90 border border-rose-500/30 p-4 rounded-2xl flex items-start gap-3 shadow-2xl backdrop-blur-md"
          >
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-extrabold text-white block">Connection Alert</span>
              <span className="text-slate-300 block mt-0.5 leading-relaxed">{errorToast}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-xl">
        
        {/* Step Progress indicators */}
        <div className="flex justify-between items-center mb-8 px-4">
          {[1, 2, 3, 4, 6].map((s, idx) => {
            const displayStep = idx + 1;
            const isActive = step === s || (step === 5 && s === 6);
            const isCompleted = step > s || (step === 5 && s < 6);
            
            return (
              <React.Fragment key={s}>
                <div 
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    isActive 
                      ? "bg-brand-green text-black scale-110 shadow-[0_0_12px_rgba(0,255,136,0.4)]" 
                      : isCompleted 
                        ? "bg-purple-600 text-white" 
                        : "bg-slate-900 border border-white/10 text-slate-500"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : displayStep}
                </div>
                {idx < 4 && (
                  <div 
                    className={`flex-1 h-[2px] mx-2 transition-all ${
                      isCompleted ? "bg-purple-600/55" : "bg-white/5"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          
          {/* STEP 1: GOAL AVATARS & SELECTION GRID */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="glass-panel rounded-[32px] p-6 sm:p-8 space-y-6"
            >
              <div className="space-y-1.5 text-center">
                <span className="text-[10px] text-brand-green font-extrabold uppercase tracking-widest block">AI Onboarding • Phase 1</span>
                <h2 className="font-outfit text-2xl font-black text-white">Choose Your Destination</h2>
                <p className="text-xs text-slate-400">Select a target avatar or define a custom objective below.</p>
              </div>

              {/* Goal Avatars Horizontal Scroll Row */}
              <div className="space-y-2">
                <label className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block px-1">Goal Avatars (Click to Map)</label>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-850">
                  {goalAvatars.map((av) => {
                    const isSelected = selectedAvatar === av.key;
                    return (
                      <div
                        key={av.key}
                        onClick={() => handleAvatarClick(av)}
                        className={`p-3.5 rounded-2xl border text-center shrink-0 min-w-[110px] transition-all cursor-pointer ${
                          isSelected 
                            ? "bg-purple-500/15 border-purple-500 shadow-[0_0_15px_rgba(139,92,246,0.2)] scale-[1.02]" 
                            : "bg-slate-950/60 border-white/5 hover:border-white/10"
                        }`}
                      >
                        <div className="text-2xl mb-1.5">{av.emoji}</div>
                        <span className="text-xs font-black text-slate-100 block">{av.name}</span>
                        <span className="text-[9px] text-slate-450 block mt-0.5 truncate max-w-[90px]">{av.desc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Goal Selection 2-column Grid */}
              <div className="space-y-2.5">
                <label className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block px-1">Fitness Objectives</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {goalOptions.map((item) => {
                    const Icon = item.icon;
                    const isSelected = goal === item.type;
                    
                    return (
                      <div
                        key={item.type}
                        onClick={() => {
                          setGoal(item.type);
                          // Clear avatar highlight if custom/non-avatar target selected
                          const match = goalAvatars.find(a => a.targetGoal === item.type);
                          if (match) setSelectedAvatar(match.key);
                          else setSelectedAvatar("");
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-3 items-start group hover:scale-[1.01] ${
                          isSelected 
                            ? "bg-brand-green/10 border-brand-green shadow-[0_0_15px_rgba(0,255,136,0.15)] text-white" 
                            : "bg-slate-950/60 border-white/5 text-slate-300 hover:text-white"
                        }`}
                      >
                        <div className={`p-2 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-white/10" : "bg-slate-900"
                        }`}>
                          <Icon className={`w-4 h-4 ${isSelected ? "text-brand-green" : "text-slate-400"}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-extrabold text-white leading-tight">{item.title}</h4>
                          <p className="text-[10px] text-slate-400 mt-1 leading-snug">{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Goal description box */}
              {goal === "Custom Goal" && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-1.5 animate-fade-in"
                >
                  <label className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block px-1">Define Custom Target</label>
                  <input 
                    type="text"
                    value={customGoal}
                    onChange={(e) => setCustomGoal(e.target.value)}
                    required
                    placeholder="e.g. Recover from knee surgery and rebuild quad mass..."
                    className="w-full glass-input rounded-xl px-4 py-3 text-xs outline-none text-white focus:border-brand-green"
                  />
                </motion.div>
              )}

              <button
                onClick={handleNextStep}
                className="w-full bg-brand-green hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-glow flex items-center justify-center gap-1.5 cursor-pointer text-xs"
              >
                <span>Continue Setup</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* STEP 2: PROFILE DEMOGRAPHICS */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="glass-panel rounded-[32px] p-6 sm:p-8 space-y-5"
            >
              <div className="space-y-1.5 text-center">
                <span className="text-[10px] text-brand-green font-extrabold uppercase tracking-widest block">AI Onboarding • Phase 2</span>
                <h2 className="font-outfit text-2xl font-black text-white">About Yourself</h2>
                <p className="text-xs text-slate-400">Provide body parameters used by the Mifflin-St Jeor calculations.</p>
              </div>

              <div className="space-y-4 text-xs font-semibold">
                
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Full Name</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="e.g. Shreya Somi"
                    className="w-full glass-input rounded-xl px-4 py-3 outline-none text-white focus:border-brand-green text-xs"
                  />
                </div>

                {/* Grid: Age & Gender */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Age (years)</label>
                    <input 
                      type="number" 
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full glass-input rounded-xl px-4 py-2.5 outline-none text-white focus:border-brand-green"
                      min="1" max="120"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Gender</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["male", "female"].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGender(g as any)}
                          className={`py-2.5 rounded-xl border text-center font-bold capitalize transition-all cursor-pointer ${
                            gender === g 
                              ? "bg-white text-black border-white shadow-md" 
                              : "bg-slate-950/60 border-white/6 text-slate-400 hover:text-white"
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Height, Current Weight & Target Weight */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Height (cm)</label>
                    <input 
                      type="number" 
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="w-full glass-input rounded-xl px-4 py-2.5 outline-none text-white focus:border-brand-green"
                      min="50" max="250"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Current (kg)</label>
                    <input 
                      type="number" 
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="w-full glass-input rounded-xl px-4 py-2.5 outline-none text-white focus:border-brand-green"
                      min="20" max="300"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Target (kg)</label>
                    <input 
                      type="number" 
                      value={targetWeight}
                      onChange={(e) => setTargetWeight(Number(e.target.value))}
                      className="w-full glass-input rounded-xl px-4 py-2.5 outline-none text-white focus:border-brand-green"
                      min="20" max="300"
                    />
                  </div>
                </div>

              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3">
                <button
                  onClick={handlePrevStep}
                  className="bg-slate-900 border border-white/10 text-slate-350 font-semibold px-4 rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextStep}
                  className="flex-1 bg-brand-green hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-glow flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: LIFESTYLE & DIET PREFERENCES */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="glass-panel rounded-[32px] p-6 sm:p-8 space-y-6"
            >
              <div className="space-y-1.5 text-center">
                <span className="text-[10px] text-brand-green font-extrabold uppercase tracking-widest block">AI Onboarding • Phase 3</span>
                <h2 className="font-outfit text-2xl font-black text-white">Lifestyle & Diet</h2>
                <p className="text-xs text-slate-400">Personalize macro multipliers according to your daily energy split.</p>
              </div>

              {/* Activity Level selector cards */}
              <div className="space-y-2">
                <label className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block px-1">Activity Level</label>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  {[
                    { level: "Sedentary" as ActivityLevel, emoji: "😴", label: "Sedentary", desc: "Desk job / minimal physical movement" },
                    { level: "Lightly Active" as ActivityLevel, emoji: "🚶", label: "Lightly Active", desc: "Light workouts / walking 1-3 days/wk" },
                    { level: "Moderately Active" as ActivityLevel, emoji: "🏋️", label: "Moderately Active", desc: "Active training / exercise 3-5 days/wk" },
                    { level: "Very Active" as ActivityLevel, emoji: "🏃", label: "Very Active", desc: "Rigorous daily physical conditioning" },
                    { level: "Athlete" as ActivityLevel, emoji: "🔥", label: "Elite Athlete", desc: "Multiple competitive sports sessions daily" }
                  ].map((item) => {
                    const isSelected = activity === item.level;
                    return (
                      <div
                        key={item.level}
                        onClick={() => setActivity(item.level)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex gap-3 items-center ${
                          isSelected 
                            ? "bg-brand-green/10 border-brand-green shadow-[0_0_12px_rgba(0,255,136,0.15)] text-white" 
                            : "bg-slate-950/60 border-white/5 text-slate-300 hover:text-white"
                        }`}
                      >
                        <span className="text-xl shrink-0">{item.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-black block leading-none">{item.label}</span>
                          <span className="text-[9px] text-slate-450 block mt-1 leading-tight">{item.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Diet Preferences selection */}
              <div className="space-y-2">
                <label className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block px-1">Diet Preference</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] font-black">
                  {[
                    { key: "Non Vegetarian" as DietPreference, label: "🍗 Non-Veg" },
                    { key: "Vegetarian" as DietPreference, label: "🥦 Veg" },
                    { key: "Vegan" as DietPreference, label: "🌱 Vegan" },
                    { key: "Eggetarian" as DietPreference, label: "🥚 Eggetarian" },
                    { key: "No Preference" as DietPreference, label: "🌍 None" }
                  ].map((item) => {
                    const isSelected = diet === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setDiet(item.key)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer leading-tight truncate ${
                          isSelected
                            ? "bg-white text-black border-white shadow-md"
                            : "bg-slate-950/60 border-white/5 text-slate-400 hover:text-white"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handlePrevStep}
                  className="bg-slate-900 border border-white/10 text-slate-355 font-semibold px-4 rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextStep}
                  className="flex-1 bg-brand-green hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-glow flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: EXPERIENCE & MOTIVATION */}
          {step === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="glass-panel rounded-[32px] p-6 sm:p-8 space-y-6"
            >
              <div className="space-y-1.5 text-center">
                <span className="text-[10px] text-brand-green font-extrabold uppercase tracking-widest block">AI Onboarding • Phase 4</span>
                <h2 className="font-outfit text-2xl font-black text-white">Experience & Drive</h2>
                <p className="text-xs text-slate-400">Calibrate personalization models according to your motivation index.</p>
              </div>

              {/* Fitness Experience Selection */}
              <div className="space-y-2">
                <label className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block px-1">Fitness Experience</label>
                <div className="grid grid-cols-3 gap-3 text-xs font-black">
                  {[
                    { key: "Beginner" as FitnessExperience, desc: "New to training" },
                    { key: "Intermediate" as FitnessExperience, desc: "Active for 1-2 years" },
                    { key: "Advanced" as FitnessExperience, desc: "Sustained athletes" }
                  ].map((item) => {
                    const isSelected = experience === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setExperience(item.key)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-center ${
                          isSelected
                            ? "bg-brand-green/10 border-brand-green shadow-[0_0_12px_rgba(0,255,136,0.15)] text-white"
                            : "bg-slate-950/60 border-white/5 text-slate-400 hover:text-white"
                        }`}
                      >
                        <span className="text-xs">{item.key}</span>
                        <span className="text-[8px] text-slate-450 font-semibold block mt-0.5 leading-none">{item.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Personalization Motivators Selection */}
              <div className="space-y-2">
                <label className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block px-1">What motivates you most?</label>
                <div className="grid grid-cols-2 gap-2.5 text-xs font-black">
                  {[
                    { key: "Looking Better" as MotivationType, label: "Looking Better ✨" },
                    { key: "Building Strength" as MotivationType, label: "Building Strength 🏋️" },
                    { key: "Improving Health" as MotivationType, label: "Improving Health ❤️" },
                    { key: "Sports Performance" as MotivationType, label: "Sports Performance 🏃" },
                    { key: "Confidence" as MotivationType, label: "Confidence ⚡" },
                    { key: "Discipline" as MotivationType, label: "Discipline 🏆" }
                  ].map((opt) => {
                    const isSelected = motivation === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setMotivation(opt.key)}
                        className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? "bg-white text-black border-white shadow-md"
                            : "bg-slate-950/60 border-white/5 text-slate-405 hover:text-white"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handlePrevStep}
                  className="bg-slate-900 border border-white/10 text-slate-350 font-semibold px-4 rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextStep}
                  className="flex-1 bg-brand-green hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-glow flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                >
                  <span>Calibrate Personalization Plan</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: AI PERSONALIZATION ENGINE PROCESSING */}
          {step === 5 && loading && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel rounded-[32px] p-10 flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="relative flex items-center justify-center">
                <div className="absolute w-20 h-20 rounded-full border border-purple-500/20 animate-ping" />
                <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Sparkles className="w-8 h-8 animate-pulse text-purple-450" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-outfit text-lg font-bold text-white">Synthesizing Macro Splits</h3>
                <div className="text-xs text-slate-400 flex flex-col items-center gap-1">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-green" /> Running Mifflin-St Jeor engine... {loadingProgress}%
                  </span>
                  <span className="text-[10px] text-slate-550">Mapping target macros for {goal}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 6: COMPLETION SUMMARY & CALCULATIONS */}
          {step === 6 && (
            <motion.div
              key="step-6"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="glass-panel rounded-[32px] p-6 sm:p-8 space-y-6"
            >
              
              {/* Profile Completion Badge */}
              <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-white/5">
                <div 
                  className="w-16 h-16 rounded-full bg-emerald-500/10 border border-brand-green/30 flex items-center justify-center text-brand-green text-lg font-black"
                  style={{
                    boxShadow: "0 0 30px rgba(0,255,136,0.15), inset 0 0 10px rgba(0,255,136,0.1)"
                  }}
                >
                  100%
                </div>
                <div>
                  <span className="text-[9px] text-brand-green font-extrabold uppercase tracking-widest block">Calibration Success</span>
                  <h3 className="font-outfit text-xl font-black text-white mt-1">Profile Completed</h3>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                    Welcome to the elite tier, <strong className="text-white">{fullName}</strong>! Custom parameters have been successfully structured.
                  </p>
                </div>
              </div>

              {/* Main Calories target recap */}
              <div className="bg-slate-950/60 p-4.5 rounded-2xl border border-white/5 text-center">
                <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Recommended Calorie Budget</span>
                <div className="font-outfit text-3xl font-black text-brand-green mt-1">
                  {calculated.calories} <span className="text-xs font-semibold text-slate-400">kcal/day</span>
                </div>
              </div>

              {/* Macro values breakdown */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl text-center">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Protein</span>
                  <span className="font-outfit text-base font-extrabold text-white mt-1 block">{calculated.protein}g</span>
                </div>
                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl text-center">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Carbs</span>
                  <span className="font-outfit text-base font-extrabold text-brand-sky mt-1 block">{calculated.carbs}g</span>
                </div>
                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl text-center">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Fat</span>
                  <span className="font-outfit text-base font-extrabold text-brand-coral mt-1 block">{calculated.fat}g</span>
                </div>
              </div>

              {/* Forecast/Details info box */}
              <div className="bg-purple-950/15 border border-purple-500/20 p-4.5 rounded-2xl flex gap-3.5 items-start">
                <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl shrink-0 mt-0.5">
                  <Award className="w-4 h-4 text-purple-450" />
                </div>
                <div className="text-xs leading-relaxed text-slate-350">
                  <p className="font-bold text-white">Target Objective: {goal}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                    Calorie targets are adjusted to support {motivation.toLowerCase()} and guide you to your target weight of <strong className="text-white">{targetWeight} kg</strong>.
                  </p>
                </div>
              </div>

              {/* Action save onboarding */}
              <button
                onClick={handleSaveOnboarding}
                disabled={saving}
                className="w-full bg-brand-green hover:bg-emerald-600 disabled:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all shadow-glow flex items-center justify-center gap-1.5 cursor-pointer text-xs"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving Targets...
                  </>
                ) : (
                  <>
                    <span>Confirm & Activate Dashboard</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </div>
  );
}
