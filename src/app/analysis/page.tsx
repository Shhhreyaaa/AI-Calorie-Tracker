"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowLeft, 
  Check, 
  Sparkles, 
  HelpCircle,
  AlertCircle,
  X,
  Plus,
  Sliders,
  CheckCircle,
  Percent,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { saveMealLog } from "@/app/meals/actions";

export default function AnalysisPage() {
  const router = useRouter();

  // State management
  const [mealName, setMealName] = useState("Avocado Salmon Salad");
  const [calories, setCalories] = useState(420);
  const [protein, setProtein] = useState(28);
  const [carbs, setCarbs] = useState(12);
  const [fat, setFat] = useState(18);
  const [confidence, setConfidence] = useState(0.94);
  const [ingredients, setIngredients] = useState([
    "Fresh Smoked Salmon",
    "Ripe Avocado Chunks",
    "Organic Baby Spinach",
    "Extra Virgin Olive Oil",
    "Toasted Sesame Seeds"
  ]);
  const [imageSrc, setImageSrc] = useState("/images/salmon_salad.png");
  const [mealType, setMealType] = useState<"Breakfast" | "Lunch" | "Dinner" | "Snack">("Lunch");

  const [newIngredient, setNewIngredient] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load latest Gemini analysis from sessionStorage if available
  useEffect(() => {
    try {
      const storedAnalysis = sessionStorage.getItem("latest_analysis");
      const storedImage = sessionStorage.getItem("latest_image");

      if (storedAnalysis) {
        const parsed = JSON.parse(storedAnalysis);
        setMealName(parsed.meal_name || "Unknown Meal");
        setCalories(parsed.calories || 0);
        setProtein(parsed.protein || 0);
        setCarbs(parsed.carbs || 0);
        setFat(parsed.fat || 0);
        setConfidence(parsed.confidence ?? 0.9);
        setIngredients(parsed.ingredients || []);
      }

      if (storedImage) {
        setImageSrc(storedImage);
      }

      // Automatically guess meal type by hour
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 11) {
        setMealType("Breakfast");
      } else if (hour >= 11 && hour < 16) {
        setMealType("Lunch");
      } else if (hour >= 16 && hour < 22) {
        setMealType("Dinner");
      } else {
        setMealType("Snack");
      }

    } catch (err) {
      console.error("Error loading analysis session data:", err);
    }
  }, []);

  // Remove an ingredient tag
  const removeIngredient = (index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  // Add a new ingredient tag
  const addIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (newIngredient.trim()) {
      setIngredients(prev => [...prev, newIngredient.trim()]);
      setNewIngredient("");
    }
  };

  const handleConfirmLog = async () => {
    if (saving) return;
    setSaving(true);
    try {
      // Execute database insert
      await saveMealLog({
        food_name: mealName,
        calories: calories,
        protein: protein,
        carbs: carbs,
        fat: fat,
        meal_type: mealType,
        image_url: imageSrc.startsWith("data:") ? undefined : imageSrc
      });
      
      setIsLogged(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      console.error("Failed to save meal log:", err);
      alert(err.message || "Unable to save meal log. Please verify your connection.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Alert on Successful Log */}
      {isLogged && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#0F172A] text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-5 h-5 text-brand-green fill-brand-green/10" />
          <span>Meal logged successfully! Redirecting...</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link 
            href="/camera" 
            className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-slate-550 hover:text-slate-800 dark:hover:text-slate-205 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Scan Report</span>
            <h2 className="font-outfit text-2xl font-bold tracking-tight">AI Analysis</h2>
          </div>
        </div>
        
        {/* Toggle Edit Mode */}
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            isEditing 
              ? "bg-brand-green/10 text-brand-green border-brand-green/20" 
              : "bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-350 border-slate-100 dark:border-slate-800/80 hover:bg-slate-50"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{isEditing ? "View Summary" : "Adjust"}</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-premium dark:shadow-premium-dark space-y-6 pb-6 animate-fade-in">
        
        {/* 1. Meal Image Header Banner */}
        <div className="relative h-56 w-full bg-slate-50 dark:bg-slate-950">
          <img 
            src={imageSrc} 
            alt="Recognized Meal" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end text-white">
            <div className="space-y-0.5 max-w-[70%]">
              {isEditing ? (
                <input 
                  type="text" 
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-2.5 py-1 font-outfit text-lg font-bold text-white outline-none focus:border-brand-green w-full"
                />
              ) : (
                <h3 className="font-outfit text-xl font-bold tracking-tight truncate">{mealName}</h3>
              )}
              <p className="text-[10px] text-slate-300 font-semibold tracking-wider uppercase flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-brand-green fill-brand-green/20 animate-pulse" />
                Gemini Vision Analysis
              </p>
            </div>
            
            {/* Confidence Score Pill */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-2.5 py-1.5 rounded-xl text-center shrink-0">
              <span className="text-[8px] text-slate-300 font-bold uppercase tracking-wider block">Confidence</span>
              <span className="font-outfit text-xs font-bold text-brand-green flex items-center justify-center gap-0.5">
                <Percent className="w-3 h-3" /> {Math.round(confidence * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Adjustments Screen vs Static Summary */}
        <div className="px-5 space-y-6">
          
          {isEditing ? (
            /* Editing Sliders Container */
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-500">Calories (kcal)</span>
                  <span className="font-outfit font-bold text-brand-green">{calories} kcal</span>
                </div>
                <input 
                  type="range" min="100" max="1000" value={calories} 
                  onChange={(e) => setCalories(Number(e.target.value))}
                  className="w-full accent-brand-green h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-500">Protein (g)</span>
                  <span className="font-outfit font-bold text-brand-green">{protein}g</span>
                </div>
                <input 
                  type="range" min="0" max="100" value={protein} 
                  onChange={(e) => setProtein(Number(e.target.value))}
                  className="w-full accent-brand-green h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-500">Carbs (g)</span>
                  <span className="font-outfit font-bold text-brand-sky">{carbs}g</span>
                </div>
                <input 
                  type="range" min="0" max="150" value={carbs} 
                  onChange={(e) => setCarbs(Number(e.target.value))}
                  className="w-full accent-brand-sky h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-500">Fat (g)</span>
                  <span className="font-outfit font-bold text-brand-coral">{fat}g</span>
                </div>
                <input 
                  type="range" min="0" max="80" value={fat} 
                  onChange={(e) => setFat(Number(e.target.value))}
                  className="w-full accent-brand-coral h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          ) : (
            /* Premium Summary Display */
            <div className="space-y-6">
              
              {/* Core Calorie Statistic Block */}
              <div className="bg-slate-50/50 dark:bg-slate-850/40 border border-slate-100/60 dark:border-slate-800/40 rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Estimated Energy</span>
                  <div className="font-outfit text-3xl font-extrabold tracking-tight text-brand-green mt-1">
                    {calories} <span className="text-sm font-medium text-slate-400">kcal</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="bg-brand-green/10 text-brand-green text-[10px] font-bold px-2 py-0.5 rounded-lg block">
                    Deficit Safe
                  </span>
                  <span className="text-[9px] text-slate-400 font-semibold block mt-1">AI Verified Estimate</span>
                </div>
              </div>

              {/* Macro stats blocks */}
              <div className="grid grid-cols-3 gap-3">
                {/* Protein */}
                <div className="bg-slate-50/50 dark:bg-slate-850/40 border border-slate-100/60 dark:border-slate-800/40 rounded-2xl p-3 flex flex-col items-center">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Protein</span>
                  <span className="font-outfit text-base font-bold mt-1 text-slate-805 dark:text-slate-205">{protein}g</span>
                  <div className="w-10 bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden mt-2">
                    <div className="bg-brand-green h-full rounded-full" style={{ width: `${Math.min((protein/150)*100, 100)}%` }} />
                  </div>
                </div>
                {/* Carbs */}
                <div className="bg-slate-50/50 dark:bg-slate-850/40 border border-slate-100/60 dark:border-slate-800/40 rounded-2xl p-3 flex flex-col items-center">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Carbs</span>
                  <span className="font-outfit text-base font-bold mt-1 text-slate-805 dark:text-slate-205">{carbs}g</span>
                  <div className="w-10 bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden mt-2">
                    <div className="bg-brand-sky h-full rounded-full" style={{ width: `${Math.min((carbs/200)*105, 100)}%` }} />
                  </div>
                </div>
                {/* Fat */}
                <div className="bg-slate-50/50 dark:bg-slate-850/40 border border-slate-100/60 dark:border-slate-800/40 rounded-2xl p-3 flex flex-col items-center">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Fat</span>
                  <span className="font-outfit text-base font-bold mt-1 text-slate-805 dark:text-slate-205">{fat}g</span>
                  <div className="w-10 bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden mt-2">
                    <div className="bg-brand-coral h-full rounded-full" style={{ width: `${Math.min((fat/65)*100, 100)}%` }} />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 2. Meal Type Category Selector */}
          <div className="space-y-2 pt-2 border-t border-slate-100/60 dark:border-slate-800/40">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Meal Category</span>
            <div className="grid grid-cols-4 gap-2">
              {(["Breakfast", "Lunch", "Dinner", "Snack"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMealType(type)}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold text-center border transition-all ${
                    mealType === type
                      ? "bg-brand-green border-brand-green text-white shadow-glow"
                      : "bg-slate-50 dark:bg-slate-850 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-100"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Ingredients Section */}
          <div className="space-y-3 pt-2 border-t border-slate-100/60 dark:border-slate-800/40">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Recognized Ingredients</span>
            
            {/* Ingredients Tags Wrapper */}
            <div className="flex flex-wrap gap-2">
              {ingredients.map((ing, i) => (
                <div 
                  key={i} 
                  className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1 border border-slate-100/10"
                >
                  <span>{ing}</span>
                  {isEditing && (
                    <button 
                      type="button" 
                      onClick={() => removeIngredient(i)}
                      className="text-slate-450 hover:text-slate-850 dark:hover:text-white shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Inline Add Ingredient Form */}
            {isEditing && (
              <form onSubmit={addIngredient} className="flex gap-2 mt-2">
                <input 
                  type="text" 
                  value={newIngredient}
                  onChange={(e) => setNewIngredient(e.target.value)}
                  placeholder="Add missing ingredient..." 
                  className="flex-1 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 focus:border-brand-green dark:focus:border-brand-green rounded-xl px-3.5 py-2 text-xs outline-none transition-all placeholder:text-slate-400"
                />
                <button 
                  type="submit" 
                  className="bg-brand-green hover:bg-emerald-600 text-white p-2 rounded-xl active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

          {/* Action Log Trigger Button */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <button 
              onClick={handleConfirmLog}
              disabled={isLogged || saving}
              className="w-full bg-[#0F172A] hover:bg-[#1E293B] dark:bg-white dark:hover:bg-slate-100 dark:text-[#020617] text-white font-semibold text-sm py-4 px-4 rounded-xl shadow-glow active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:bg-slate-300 dark:disabled:bg-slate-850 disabled:text-slate-450"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Logging Meal...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Log Meal to Diary
                </>
              )}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
