"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { 
  Flame, 
  Plus, 
  Camera, 
  Check, 
  TrendingUp, 
  Info, 
  Calendar, 
  ChevronRight, 
  Copy, 
  Sparkles,
  Droplet
} from "lucide-react";

export default function DesignSystemShowcase() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "colors" | "typography" | "forms">("dashboard");
  const [streak, setStreak] = useState(5);
  const [calories, setCalories] = useState(1320);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-hide toast messages
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label}: ${text}`);
  };

  // Helper macro values
  const targetCalories = 2000;
  const protein = 92;
  const targetProtein = 150;
  const carbs = 114;
  const targetCarbs = 200;
  const fat = 48;
  const targetFat = 65;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] text-[#0F172A] dark:text-[#F8FAFC] transition-colors duration-300 font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#0F172A] text-white dark:bg-[#F8FAFC] dark:text-[#020617] px-4 py-3 rounded-xl shadow-xl transition-all duration-300 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <header className="border-b border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-brand-green/10 text-brand-green p-1.5 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 fill-current" />
              </span>
              <h1 className="font-outfit text-2xl font-bold tracking-tight">AI Calorie Tracker</h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              App Store-Quality Premium Design System Playground
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a 
              href="/docs/architecture.md" 
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
            >
              System Docs
            </a>
            <a 
              href="/docs/design_system.md" 
              className="bg-slate-900 dark:bg-white text-white dark:text-[#020617] px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              Design System Spec
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 bg-slate-200/50 dark:bg-slate-800/40 p-1.5 rounded-2xl mb-8 max-w-fit border border-slate-200/30 dark:border-slate-800/20 scrollbar-none">
          <button 
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${activeTab === "dashboard" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"}`}
          >
            ✨ Live Dashboard Mock
          </button>
          <button 
            onClick={() => setActiveTab("colors")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${activeTab === "colors" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"}`}
          >
            🎨 Colors & Theme
          </button>
          <button 
            onClick={() => setActiveTab("typography")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${activeTab === "typography" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"}`}
          >
            ✍️ Typography Scale
          </button>
          <button 
            onClick={() => setActiveTab("forms")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${activeTab === "forms" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"}`}
          >
            ⚙️ Buttons & Forms
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: LIVE DASHBOARD MOCK */}
        {/* ============================================================== */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="font-outfit text-xl font-bold tracking-tight flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-green" />
                Premium Widgets Preview
              </h2>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Click elements to interact
              </div>
            </div>

            {/* Grid Layout of Apple Health style widgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Widget 1: Calorie Ring Tracker */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-premium dark:shadow-premium-dark flex flex-col justify-between min-h-[220px]">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-outfit text-sm font-semibold text-slate-400 uppercase tracking-wider">Calories</h3>
                    <div className="font-outfit text-3xl font-bold tracking-tight mt-1">
                      {targetCalories - calories} <span className="text-xs font-medium text-slate-400">kcal left</span>
                    </div>
                  </div>
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg font-semibold">
                    Goal: 2000
                  </span>
                </div>

                {/* Animated Calorie Progress Bar */}
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Consumed: {calories} kcal</span>
                    <span className="text-brand-green">{Math.round((calories/targetCalories)*100)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-brand-green h-full rounded-full transition-all duration-500" 
                      style={{ width: `${(calories/targetCalories)*100}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button 
                    onClick={() => {
                      setCalories(prev => Math.min(prev + 150, targetCalories));
                      showToast("Simulated Meal Consumed (+150 kcal)");
                    }}
                    className="flex-1 bg-brand-green hover:bg-emerald-600 text-white font-semibold text-xs py-2 px-3 rounded-xl shadow-glow active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Eat 150 kcal
                  </button>
                  <button 
                    onClick={() => setCalories(1320)}
                    className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs py-2 px-3 rounded-xl active:scale-95 transition-all"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Widget 2: Streak Tracking Flame Widget */}
              <div 
                onClick={() => {
                  setStreak(prev => prev + 1);
                  showToast("Streak updated successfully! Keep logging daily 🔥");
                }}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-premium dark:shadow-premium-dark flex flex-col justify-between min-h-[220px] cursor-pointer hover:border-brand-coral/30 hover:scale-[1.01] transition-all group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-outfit text-sm font-semibold text-slate-400 uppercase tracking-wider">Active Streak</h3>
                    <p className="text-xs text-slate-400 mt-1">Tap to simulate logging today</p>
                  </div>
                  <span className="bg-brand-coral/10 text-brand-coral p-2 rounded-xl group-hover:scale-110 transition-transform">
                    <Flame className="w-5 h-5 fill-current" />
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mt-4">
                  <span className="font-outfit text-5xl font-extrabold tracking-tight text-brand-coral group-hover:animate-pulse">
                    {streak}
                  </span>
                  <span className="font-outfit text-lg font-bold text-slate-500">Days Active</span>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  Log daily meal photos to claim macro rewards.
                </div>
              </div>

              {/* Widget 3: Macronutrients Stack */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-premium dark:shadow-premium-dark flex flex-col justify-between min-h-[220px]">
                <h3 className="font-outfit text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Macro Breakdown</h3>
                
                <div className="space-y-3.5">
                  {/* Protein */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600 dark:text-slate-300">Protein</span>
                      <span className="text-slate-500">{protein}g / {targetProtein}g</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-brand-green h-full rounded-full" style={{ width: `${(protein/targetProtein)*100}%` }} />
                    </div>
                  </div>

                  {/* Carbs */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600 dark:text-slate-300">Carbohydrates</span>
                      <span className="text-slate-500">{carbs}g / {targetCarbs}g</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-brand-sky h-full rounded-full" style={{ width: `${(carbs/targetCarbs)*100}%` }} />
                    </div>
                  </div>

                  {/* Fat */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600 dark:text-slate-300">Fat</span>
                      <span className="text-slate-500">{fat}g / {targetFat}g</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-brand-coral h-full rounded-full" style={{ width: `${(fat/targetFat)*100}%` }} />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Core Card Section: Premium Glass Food Mock Card */}
            <div className="mt-8">
              <h3 className="font-outfit text-base font-semibold mb-4 flex items-center gap-2">
                <Camera className="w-4 h-4 text-brand-sky" />
                Gemini Vision AI Analysis Card
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Visual Card */}
                <div className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[32px] overflow-hidden shadow-premium dark:shadow-premium-dark group">
                  <div className="relative h-64 w-full">
                    <Image 
                      src="/images/salmon_salad.png" 
                      alt="Avocado Salmon Salad" 
                      fill 
                      priority
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-700"
                    />
                    {/* Time Stamp Tag */}
                    <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Today, 12:42 PM
                    </div>
                  </div>

                  {/* Glassmorphic Macro Specs Panel */}
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-outfit text-xl font-bold tracking-tight">Avocado Salmon Salad</h4>
                        <p className="text-xs text-slate-400 mt-1">Recognized ingredients: Smoked salmon, avocado chunks, spinach leaves, olive oil dressing.</p>
                      </div>
                      <div className="bg-brand-green/10 text-brand-green px-3 py-1 rounded-xl text-sm font-bold font-outfit">
                        420 kcal
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-6">
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-850/50 flex flex-col items-center">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Protein</span>
                        <span className="font-outfit text-base font-bold mt-1 text-slate-800 dark:text-slate-200">28g</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-850/50 flex flex-col items-center">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Carbs</span>
                        <span className="font-outfit text-base font-bold mt-1 text-slate-800 dark:text-slate-200">12g</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-850/50 flex flex-col items-center">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fat</span>
                        <span className="font-outfit text-base font-bold mt-1 text-slate-800 dark:text-slate-200">18g</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Explanation specifications */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[32px] p-6 shadow-premium dark:shadow-premium-dark flex flex-col justify-between">
                  <div className="space-y-4">
                    <h4 className="font-outfit text-lg font-bold">Why this Card is Premium</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Taking inspiration from modern iOS apps like **Cal AI** and **Apple Health**, this component is designed to present maximum information within a compact, beautiful frame:
                    </p>
                    <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-brand-green mt-0.5" />
                        <span><strong>24px & 32px Squircle Radius:</strong> Extremely smooth corners that perfectly match mobile screen shapes.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-brand-green mt-0.5" />
                        <span><strong>Time Overlay:</strong> Translucent absolute overlay elements with background blur (backdrop-filter) for readability over dynamic images.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-brand-green mt-0.5" />
                        <span><strong>Unified Nutrition Badges:</strong> Separated grid blocks that present macronutrients cleanly, using soft grey backgrounds.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button 
                      onClick={() => showToast("Meal successfully logged to daily diary")}
                      className="w-full bg-[#0F172A] hover:bg-[#1E293B] dark:bg-white dark:hover:bg-slate-100 dark:text-[#020617] text-white font-semibold text-xs py-3.5 px-4 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      Log Meal to Diary <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: COLORS & THEME */}
        {/* ============================================================== */}
        {activeTab === "colors" && (
          <div className="space-y-8 animate-fade-in">
            <h2 className="font-outfit text-xl font-bold tracking-tight">Active Color Palette Tokens</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              
              {/* Brand Green Swatch */}
              <div 
                onClick={() => copyToClipboard("hsl(142 70% 45%)", "Vital Emerald")}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 shadow-premium dark:shadow-premium-dark cursor-pointer hover:translate-y-[-2px] transition-all group"
              >
                <div className="w-full h-24 bg-brand-green rounded-xl mb-3 shadow-inner" />
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Vital Emerald</h4>
                    <span className="text-[10px] text-slate-400 font-semibold font-mono">hsl(142 70% 45%)</span>
                  </div>
                  <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
                </div>
              </div>

              {/* Brand Coral Swatch */}
              <div 
                onClick={() => copyToClipboard("hsl(350 89% 60%)", "Vibrant Coral")}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 shadow-premium dark:shadow-premium-dark cursor-pointer hover:translate-y-[-2px] transition-all group"
              >
                <div className="w-full h-24 bg-brand-coral rounded-xl mb-3 shadow-inner" />
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Vibrant Coral</h4>
                    <span className="text-[10px] text-slate-400 font-semibold font-mono">hsl(350 89% 60%)</span>
                  </div>
                  <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
                </div>
              </div>

              {/* Brand Sky Swatch */}
              <div 
                onClick={() => copyToClipboard("hsl(199 89% 48%)", "Sky Aqua")}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 shadow-premium dark:shadow-premium-dark cursor-pointer hover:translate-y-[-2px] transition-all group"
              >
                <div className="w-full h-24 bg-brand-sky rounded-xl mb-3 shadow-inner" />
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Sky Aqua</h4>
                    <span className="text-[10px] text-slate-400 font-semibold font-mono">hsl(199 89% 48%)</span>
                  </div>
                  <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
                </div>
              </div>

              {/* Slate Dark Base Swatch */}
              <div 
                onClick={() => copyToClipboard("hsl(224 71% 4%)", "Slate Dark Base")}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 shadow-premium dark:shadow-premium-dark cursor-pointer hover:translate-y-[-2px] transition-all group"
              >
                <div className="w-full h-24 bg-[#020617] rounded-xl mb-3 border border-slate-800" />
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Navy Canvas</h4>
                    <span className="text-[10px] text-slate-400 font-semibold font-mono">hsl(224 71% 4%)</span>
                  </div>
                  <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: TYPOGRAPHY */}
        {/* ============================================================== */}
        {activeTab === "typography" && (
          <div className="space-y-8 animate-fade-in bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[32px] p-6 shadow-premium dark:shadow-premium-dark">
            <h2 className="font-outfit text-xl font-bold tracking-tight">Typography Scale & Font Weights</h2>
            
            <div className="space-y-6 pt-4">
              
              <div className="border-b border-slate-100 dark:border-slate-800 pb-6">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Display Metric (Outfit)</span>
                <div className="font-outfit text-5xl font-extrabold tracking-tight text-slate-800 dark:text-white mt-2">
                  2,480 kcal
                </div>
              </div>

              <div className="border-b border-slate-100 dark:border-slate-800 pb-6">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Headline H1 (Outfit)</span>
                <div className="font-outfit text-3xl font-bold tracking-tight text-slate-800 dark:text-white mt-2">
                  Track Your Daily Vital Nutrition
                </div>
              </div>

              <div className="border-b border-slate-100 dark:border-slate-800 pb-6">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sub-Headline H2 (Outfit)</span>
                <div className="font-outfit text-xl font-semibold tracking-tight text-slate-800 dark:text-white mt-2">
                  Breakfast Log Breakdown
                </div>
              </div>

              <div className="border-b border-slate-100 dark:border-slate-800 pb-6">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Body copy & descriptions (Inter)</span>
                <p className="font-sans text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed max-w-2xl">
                  Our algorithm automatically segments and recognizes foods from pictures. Place your plate in a well-lit area to ensure precise macronutrient and vitamin calculations.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: BUTTONS & FORMS */}
        {/* ============================================================== */}
        {activeTab === "forms" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
            
            {/* Buttons Showcase */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[32px] p-6 shadow-premium dark:shadow-premium-dark flex flex-col justify-between">
              <div>
                <h3 className="font-outfit text-lg font-bold mb-6">Interactive Button States</h3>
                
                <div className="space-y-4">
                  {/* Primary Vital Button */}
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Primary Emerald active button</label>
                    <button 
                      onClick={() => showToast("Primary action clicked")}
                      className="w-full bg-brand-green hover:bg-emerald-600 active:scale-[0.98] text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-glow transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" /> Save Nutrition Goal
                    </button>
                  </div>

                  {/* Dark/Slate Button */}
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Secondary slate button</label>
                    <button 
                      onClick={() => showToast("Secondary action clicked")}
                      className="w-full bg-[#0F172A] hover:bg-[#1E293B] dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-[0.98] text-white font-semibold text-sm py-3 px-4 rounded-xl transition-all"
                    >
                      Back to History
                    </button>
                  </div>

                  {/* Neutral Button */}
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Tertiary neutral button</label>
                    <button 
                      onClick={() => showToast("Neutral action clicked")}
                      className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 active:scale-[0.98] text-semibold text-sm py-3 px-4 rounded-xl transition-all"
                    >
                      Edit Profiles
                    </button>
                  </div>

                </div>
              </div>
            </div>

            {/* Forms Showcase */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[32px] p-6 shadow-premium dark:shadow-premium-dark">
              <h3 className="font-outfit text-lg font-bold mb-6">Premium Form Layout</h3>
              
              <form onSubmit={(e) => { e.preventDefault(); showToast("Form submitted successfully!"); }} className="space-y-5">
                
                {/* Text Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Custom Food Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Scrambled eggs with salmon" 
                    className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 focus:border-brand-green dark:focus:border-brand-green rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Number Inputs Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Calories (kcal)</label>
                    <input 
                      type="number" 
                      required
                      placeholder="350" 
                      className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 focus:border-brand-green dark:focus:border-brand-green rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Protein (g)</label>
                    <input 
                      type="number" 
                      required
                      placeholder="25" 
                      className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 focus:border-brand-green dark:focus:border-brand-green rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Selection Row */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Meal Category</label>
                  <div className="flex gap-2">
                    {["Breakfast", "Lunch", "Dinner"].map((cat) => (
                      <button 
                        key={cat}
                        type="button"
                        onClick={() => showToast(`Selected category: ${cat}`)}
                        className="flex-1 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-brand-green dark:hover:border-brand-green rounded-xl py-2 px-3 text-xs font-semibold transition-all text-slate-700 dark:text-slate-300"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit button inside form */}
                <button 
                  type="submit"
                  className="w-full bg-brand-green hover:bg-emerald-600 text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-glow transition-all"
                >
                  Log Custom Food Entry
                </button>

              </form>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
