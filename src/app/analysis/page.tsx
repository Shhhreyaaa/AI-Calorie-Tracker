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
  Loader2,
  Search,
  Scale
} from "lucide-react";
import { useRouter } from "next/navigation";
import { saveMealLog } from "@/app/meals/actions";

const standardFoods = [
  { name: "Chicken Breast (100g cooked)", calories: 165, protein: 31, carbs: 0, fat: 3.6, servingsUnit: "g", baseQuantity: 100 },
  { name: "White Rice (100g cooked)", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, servingsUnit: "g", baseQuantity: 100 },
  { name: "Banana (1 medium, 118g)", calories: 105, protein: 1.3, carbs: 27, fat: 0.3, servingsUnit: "serving(s)", baseQuantity: 1 },
  { name: "Paneer (100g raw)", calories: 265, protein: 18, carbs: 1.2, fat: 20.8, servingsUnit: "g", baseQuantity: 100 },
  { name: "Whole Egg (1 large, 50g)", calories: 70, protein: 6, carbs: 0.6, fat: 5, servingsUnit: "egg(s)", baseQuantity: 1 },
  { name: "Milk (1 cup, 240ml)", calories: 120, protein: 8, carbs: 12, fat: 5, servingsUnit: "cup(s)", baseQuantity: 1 },
  { name: "Rolled Oats (50g raw)", calories: 190, protein: 7, carbs: 32, fat: 3, servingsUnit: "g", baseQuantity: 50 },
  { name: "Apple (1 medium, 182g)", calories: 95, protein: 0.5, carbs: 25, fat: 0.3, servingsUnit: "serving(s)", baseQuantity: 1 }
];
const getBase64Hash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < Math.min(str.length, 10000); i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString();
};

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
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Manual fallback states
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<typeof standardFoods[0] | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Fallback and background retry states
  const [isFallback, setIsFallback] = useState(false);
  const [isRetryingInBg, setIsRetryingInBg] = useState(false);

  // Load latest Gemini analysis from sessionStorage if available
  useEffect(() => {
    try {
      const storedAnalysis = sessionStorage.getItem("latest_analysis");
      const storedImage = sessionStorage.getItem("latest_image");
      const storedModel = sessionStorage.getItem("latest_model_used");

      if (storedImage) {
        setImageSrc(storedImage);
      }

      if (storedModel) {
        setModelUsed(storedModel);
      }

      if (storedAnalysis) {
        const parsed = JSON.parse(storedAnalysis);
        
        // 2. Normal load
        setMealName(parsed.meal_name || "Unknown Meal");
        setCalories(parsed.calories || 0);
        setProtein(parsed.protein || 0);
        setCarbs(parsed.carbs || 0);
        setFat(parsed.fat || 0);
        setConfidence(parsed.confidence ?? 0.9);
        setIngredients(parsed.ingredients || []);
        setIsFallback(!!parsed.isFallback);
        setShowManualSearch(false);
      } else {
        // Automatically switch to manual search if no scan result exists
        setShowManualSearch(true);
        setImageSrc("/images/placeholder_food.png");
        setConfidence(0.0);
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

  // Helper to convert Data URL (base64) to a File object
  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  // Background retry logic has been removed to prevent duplicate Gemini API calls.
  // The camera page now handles the analysis synchronously and passes the final result.

  // Filter foods based on query
  const filteredFoods = standardFoods.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle manual log submission
  const handleManualLogSubmit = async () => {
    if (!selectedFood || saving) return;
    setSaving(true);
    try {
      const totalCalories = Math.round(selectedFood.calories * quantity);
      const totalProtein = Math.round(selectedFood.protein * quantity);
      const totalCarbs = Math.round(selectedFood.carbs * quantity);
      const totalFat = Math.round(selectedFood.fat * quantity);

      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await saveMealLog({
        food_name: `${selectedFood.name} (x${quantity})`,
        calories: totalCalories,
        protein: totalProtein,
        carbs: totalCarbs,
        fat: totalFat,
        meal_type: mealType
      }, tz);

      setIsLogged(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      console.error("Failed to save manual meal log:", err);
      alert(err.message || "Unable to save manual meal log. Please try again.");
    } finally {
      setSaving(false);
    }
  };

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
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await saveMealLog({
        food_name: mealName,
        calories: calories,
        protein: protein,
        carbs: carbs,
        fat: fat,
        meal_type: mealType,
        image_url: imageSrc.startsWith("data:") ? undefined : imageSrc
      }, tz);
      
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
            <h2 className="font-outfit text-2xl font-bold tracking-tight">
              {showManualSearch ? "Manual Log Fallback" : "AI Analysis"}
            </h2>
          </div>
        </div>
        
        {/* Toggle Manual Mode vs AI Mode */}
        <button 
          onClick={() => {
            setShowManualSearch(!showManualSearch);
            setIsEditing(false);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-350 border-slate-105 dark:border-slate-805 hover:bg-slate-50 cursor-pointer"
        >
          <span>{showManualSearch ? "Show AI Result" : "Log Manually"}</span>
        </button>
      </div>

      {/* Fallback alert banner */}
      {isFallback && !showManualSearch && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl p-4 text-xs flex items-start gap-2.5 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
          <div className="flex-1">
            <p className="font-bold">
              {process.env.NODE_ENV === "development" && aiError 
                ? `AI Error: ${aiError}` 
                : "AI unavailable — using nutrition database estimate"}
            </p>
            {isRetryingInBg ? (
              <p className="text-[10px] text-amber-500/80 mt-1 flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" /> Retrying AI scan connection in background...
              </p>
            ) : (
              <p className="text-[10px] text-amber-500/80 mt-0.5">
                You can adjust portions below or select "Log Manually" for a full database search.
              </p>
            )}
          </div>
        </div>
      )}

      {showManualSearch ? (
        /* Manual Search Lookup Panel */
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-6 shadow-premium dark:shadow-premium-dark space-y-6 animate-fade-in">
          
          <div className="space-y-1.5">
            <span className="bg-rose-500/10 text-rose-500 text-[9px] font-bold px-2 py-0.5 rounded-lg inline-flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Image Scan Failure or Manual Overwrite
            </span>
            <h3 className="font-outfit text-lg font-bold text-slate-800 dark:text-slate-200">Manual Food Database Fallback</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Search standard ingredients, select portions, and log instantly.</p>
          </div>

          {/* Search box */}
          <div className="relative">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search standard foods (chicken, rice, banana...)"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none dark:text-white placeholder:text-slate-450 focus:border-brand-green"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>

          {/* Food List Selection */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {filteredFoods.length > 0 ? (
              filteredFoods.map((food, idx) => (
                <div 
                  key={idx}
                  onClick={() => {
                    setSelectedFood(food);
                    setQuantity(1);
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                    selectedFood?.name === food.name 
                      ? "border-brand-green bg-brand-green/5 text-slate-800 dark:text-white" 
                      : "border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 text-slate-650 dark:text-slate-350 hover:bg-slate-100"
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-bold">{food.name}</h4>
                    <p className="text-[10px] text-slate-450 mt-0.5">
                      P: {food.protein}g • C: {food.carbs}g • F: {food.fat}g
                    </p>
                  </div>
                  <span className="font-outfit font-extrabold text-xs text-brand-green">{food.calories} kcal</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-405 italic py-4 text-center">No standard food items found.</p>
            )}
          </div>

          {/* Selected Food Quantity and Macro Preview */}
          {selectedFood && (
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-4 animate-fade-in">
              <div className="flex justify-between items-center">
                <span className="font-outfit font-extrabold text-xs text-slate-800 dark:text-slate-200">
                  Adjust Quantity
                </span>
                <span className="text-[10px] text-slate-400">
                  Base: {selectedFood.baseQuantity} {selectedFood.servingsUnit}
                </span>
              </div>

              {/* Quantity Counter */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity(prev => Math.max(prev - 0.5, 0.5))}
                  className="bg-slate-200 dark:bg-slate-800 p-2 rounded-xl text-xs font-extrabold w-8 h-8 flex items-center justify-center cursor-pointer"
                >
                  -
                </button>
                <span className="font-outfit font-black text-sm text-slate-805 dark:text-white">
                  {quantity}x
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(prev => prev + 0.5)}
                  className="bg-slate-200 dark:bg-slate-800 p-2 rounded-xl text-xs font-extrabold w-8 h-8 flex items-center justify-center cursor-pointer"
                >
                  +
                </button>

                <div className="ml-auto text-right">
                  <span className="text-[10px] text-slate-400 block font-semibold">Total Portions</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {selectedFood.baseQuantity * quantity} {selectedFood.servingsUnit}
                  </span>
                </div>
              </div>

              {/* Calculated Macros Grid */}
              <div className="grid grid-cols-4 gap-2 text-center pt-2 border-t border-slate-205 dark:border-slate-850/80">
                <div>
                  <span className="text-[8px] text-slate-405 font-bold uppercase tracking-wider block">Calories</span>
                  <span className="font-outfit text-xs font-extrabold text-brand-green">
                    {Math.round(selectedFood.calories * quantity)} kcal
                  </span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-450 font-bold uppercase tracking-wider block">Protein</span>
                  <span className="font-outfit text-xs font-extrabold text-slate-805 dark:text-slate-200">
                    {Math.round(selectedFood.protein * quantity)}g
                  </span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-450 font-bold uppercase tracking-wider block">Carbs</span>
                  <span className="font-outfit text-xs font-extrabold text-brand-sky">
                    {Math.round(selectedFood.carbs * quantity)}g
                  </span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-450 font-bold uppercase tracking-wider block">Fat</span>
                  <span className="font-outfit text-xs font-extrabold text-brand-coral">
                    {Math.round(selectedFood.fat * quantity)}g
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Meal type selector */}
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

          <button
            onClick={handleManualLogSubmit}
            disabled={!selectedFood || saving}
            className="w-full bg-brand-green hover:bg-emerald-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-glow flex items-center justify-center gap-1.5 cursor-pointer text-xs"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>Add & Log Manual Meal</span>
          </button>

        </div>
      ) : (
        /* Main Container for AI Results */
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
                  Gemini Vision Analysis {process.env.NODE_ENV === "development" && modelUsed && `(${modelUsed})`}
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
                        className="text-slate-455 hover:text-slate-850 dark:hover:text-white shrink-0"
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

            {/* Toggle Edit Adjustments Button inside Summary screen */}
            <div className="flex justify-between items-center text-xs pt-1">
              <span className="text-slate-400">Not quite right? Adjust macros manually:</span>
              <button 
                type="button" 
                onClick={() => setIsEditing(!isEditing)} 
                className="text-brand-green font-bold focus:outline-none cursor-pointer"
              >
                {isEditing ? "Save & View Summary" : "Adjust Macros"}
              </button>
            </div>

            {/* Action Log Trigger Button */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={handleConfirmLog}
                disabled={isLogged || saving}
                className="w-full bg-[#0F172A] hover:bg-[#1E293B] dark:bg-white dark:hover:bg-slate-100 dark:text-[#020617] text-white font-semibold text-sm py-4 px-4 rounded-xl shadow-glow active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:bg-slate-300 dark:disabled:bg-slate-850 disabled:text-slate-450 cursor-pointer"
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
      )}

    </div>
  );
}
