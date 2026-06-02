"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  Camera, 
  Brain, 
  Activity, 
  Download, 
  ChevronDown, 
  ChevronRight, 
  Check, 
  Zap, 
  Flame, 
  Scale, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Predefined foods for the interactive scanner playground
const DEMO_FOODS = [
  {
    name: "Avocado Salmon Plate",
    img: "/images/salmon_salad.png",
    calories: 420,
    protein: 28,
    carbs: 12,
    fat: 18,
    confidence: 96,
    tags: ["Salmon", "Avocado", "Spinach", "Seeds"]
  },
  {
    name: "Idli Sambar Combo",
    img: "/images/placeholder_food.png", // fallback placeholder
    calories: 240,
    protein: 8,
    carbs: 48,
    fat: 2,
    confidence: 92,
    tags: ["Rice Idli", "Lentil Soup", "Spices"]
  },
  {
    name: "Grilled Chicken Rice",
    img: "/images/avocado_toast.png",
    calories: 520,
    protein: 42,
    carbs: 45,
    fat: 8,
    confidence: 98,
    tags: ["Chicken Breast", "Brown Rice", "Broccoli"]
  }
];

export default function LandingPage() {
  const [activeDemoFood, setActiveDemoFood] = useState(0);
  const [coachInput, setCoachInput] = useState("");
  const [coachMessages, setCoachMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    { role: "assistant", text: "Hello! Ask me any question about your diet, or click one of the quick actions below to see how I analyze metrics." }
  ]);
  const [coachTyping, setCoachTyping] = useState(false);
  const [faqOpen, setFaqOpen] = useState<{ [key: number]: boolean }>({});

  const handleFAQToggle = (idx: number) => {
    setFaqOpen(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handleSendCoachDemo = (text: string) => {
    if (!text.trim() || coachTyping) return;

    setCoachMessages(prev => [...prev, { role: "user", text }]);
    setCoachInput("");
    setCoachTyping(true);

    // Simulate AI response stream
    setTimeout(() => {
      let reply = "";
      if (text.toLowerCase().includes("protein")) {
        reply = "To hit your protein goals today, I recommend adding 150g of Grilled Chicken Breast (46g Protein) or 200g of Low-Fat Greek Yogurt (20g Protein). This fits perfectly into your remaining calorie allowance!";
      } else if (text.toLowerCase().includes("diet") || text.toLowerCase().includes("analyze")) {
        reply = "Looking at your log summary: your protein is on track (85g consumed), but you are currently 300 kcal over your target carb limit. For dinner, aim for a low-carb, high-protein meal like salmon or baked tofu.";
      } else if (text.toLowerCase().includes("plan") || text.toLowerCase().includes("meal")) {
        reply = "Here is an optimized meal plan for tomorrow:\n- Breakfast: Scrambled egg whites with spinach\n- Lunch: Quinoa chicken bowl\n- Dinner: Seared tuna salad\n- Snack: Whey protein isolate shake";
      } else {
        reply = "Great question! Tracking macros consistently is the number one variable linked to sustained fat loss and muscle hypertrophy. Let's make sure we hit your targets today!";
      }

      setCoachMessages(prev => [...prev, { role: "assistant", text: reply }]);
      setCoachTyping(false);
    }, 1500);
  };

  const activeFood = DEMO_FOODS[activeDemoFood];

  return (
    <div className="space-y-24 pb-20 select-none text-white bg-[#020617]">
      
      {/* 1. Header Navigation */}
      <header className="flex justify-between items-center py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-green to-brand-sky flex items-center justify-center shadow-lg">
            <Sparkles className="w-4 h-4 text-black font-black" />
          </div>
          <span className="font-outfit font-black text-sm tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Aura Fitness AI
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <Link 
            href="/login" 
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            Log In
          </Link>
          <Link 
            href="/signup" 
            className="bg-brand-green hover:bg-emerald-600 text-black font-bold text-xs px-4 py-2.5 rounded-xl shadow-glow transition-all"
          >
            Get Started Free
          </Link>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="text-center max-w-3xl mx-auto space-y-6 pt-10">
        <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest inline-flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-450 fill-current animate-pulse" />
          Venture-Backed Fitness Technology
        </span>

        <h1 className="font-outfit text-4xl sm:text-6xl font-black tracking-tight leading-[1.08] text-white">
          Unlock Your Elite Physical Potential With{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00ff88] via-[#00e5ff] to-[#8b5cf6]">
            Vision AI
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl mx-auto">
          Skip manual logging. Snap a photo of your plate, consult your dedicated AI health coach drawer, and export weekly executive summaries.
        </p>

        <div className="pt-4 flex flex-wrap gap-4 justify-center">
          <Link 
            href="/signup" 
            className="bg-gradient-to-r from-brand-green to-emerald-600 hover:from-brand-green hover:to-emerald-500 text-black font-bold text-sm px-6 py-4 rounded-xl shadow-glow active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <span>Start Free Transformation</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link 
            href="/login" 
            className="bg-slate-900 border border-white/10 hover:bg-slate-850 text-white font-bold text-sm px-6 py-4 rounded-xl active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <span>Access Member Portal</span>
          </Link>
        </div>
      </section>

      {/* 3. Value Props Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            icon: Camera,
            title: "Computer Vision Scanner",
            desc: "Instantly segments ingredients, extracts portion size, and logs macronutrients from photos.",
            color: "text-brand-green bg-brand-green/10 border-brand-green/20"
          },
          {
            icon: Brain,
            title: "24/7 AI Health Companion",
            desc: "Always-active coach drawer mapped to your goals. Analyzes patterns and answers queries.",
            color: "text-purple-400 bg-purple-500/10 border-purple-500/20"
          },
          {
            icon: TrendingUp,
            title: "30-Day Deficit Forecasts",
            desc: "Predicts body mass changes with a confidence level based on calorie logging consistency.",
            color: "text-brand-sky bg-brand-sky/10 border-brand-sky/20"
          },
          {
            icon: Download,
            title: "Executive PDF Reports",
            desc: "Weekly reports compile macro ratios, health scores, and AI recommendations into documents.",
            color: "text-pink-400 bg-pink-500/10 border-pink-500/20"
          }
        ].map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <div 
              key={idx}
              className="glass-panel rounded-3xl p-6 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-300"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${feat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="mt-8 space-y-2">
                <h3 className="font-outfit text-base font-bold text-white leading-tight">{feat.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* 4. Interactive Scanner Demo */}
      <section className="glass-panel rounded-[32px] p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-brand-sky/20 bg-gradient-to-br from-slate-900/40 to-slate-950/20 shadow-premium-dark">
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] text-brand-sky font-extrabold uppercase tracking-widest block">Interactive Demonstration</span>
            <h2 className="font-outfit text-2xl sm:text-3xl font-black tracking-tight leading-none text-white">Food Recognition Overlay</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Click a food button below to preview how our neural network detects items, calculates confidence indexes, and estimates daily nutritional progress.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            {DEMO_FOODS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setActiveDemoFood(idx)}
                className={`w-full p-3.5 rounded-2xl border transition-all text-left flex justify-between items-center cursor-pointer ${
                  activeDemoFood === idx 
                    ? "border-brand-sky bg-brand-sky/15 text-white" 
                    : "border-white/5 bg-slate-950/40 text-slate-400 hover:border-white/10"
                }`}
              >
                <span className="text-xs font-bold">{item.name}</span>
                <span className="text-[10px] font-extrabold text-brand-sky uppercase tracking-wider">{item.calories} kcal</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mock Scan Overlay Card Visual */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-sm bg-slate-950 rounded-[28px] overflow-hidden border border-white/10 shadow-2xl relative">
            <div className="h-56 w-full relative bg-slate-900 flex items-center justify-center">
              {/* Simulated scan overlay borders */}
              <div className="absolute top-8 left-8 w-24 h-24 border-t-2 border-l-2 border-brand-sky rounded-tl-xl opacity-80" />
              <div className="absolute top-8 right-8 w-24 h-24 border-t-2 border-r-2 border-brand-sky rounded-tr-xl opacity-80" />
              <div className="absolute bottom-8 left-8 w-24 h-24 border-b-2 border-l-2 border-brand-sky rounded-bl-xl opacity-80" />
              <div className="absolute bottom-8 right-8 w-24 h-24 border-b-2 border-r-2 border-brand-sky rounded-br-xl opacity-80" />

              <div className="text-center px-6">
                <Camera className="w-10 h-10 text-brand-sky mx-auto animate-pulse mb-2.5" />
                <span className="font-outfit text-sm font-bold text-white block">{activeFood.name}</span>
                <span className="text-[9px] text-brand-sky font-bold uppercase tracking-wider block mt-1">Confidence Score: {activeFood.confidence}%</span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <span className="text-[8px] text-slate-400 uppercase font-bold block">Calories</span>
                  <span className="font-outfit text-xs font-extrabold text-brand-green block mt-1">{activeFood.calories} kcal</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-400 uppercase font-bold block">Protein</span>
                  <span className="font-outfit text-xs font-extrabold text-white block mt-1">{activeFood.protein}g</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-400 uppercase font-bold block">Carbs</span>
                  <span className="font-outfit text-xs font-extrabold text-brand-sky block mt-1">{activeFood.carbs}g</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-400 uppercase font-bold block">Fat</span>
                  <span className="font-outfit text-xs font-extrabold text-brand-coral block mt-1">{activeFood.fat}g</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
                {activeFood.tags.map((tag, i) => (
                  <span key={i} className="bg-white/5 border border-white/10 text-[9px] font-bold text-slate-300 px-2.5 py-1 rounded-xl">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. AI Coach Playground Demo */}
      <section className="glass-panel rounded-[32px] p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-purple-500/20 bg-gradient-to-bl from-slate-900/40 to-slate-950/20 shadow-premium-dark">
        {/* Chat window simulator */}
        <div className="lg:col-span-7 flex justify-center order-2 lg:order-1">
          <div className="w-full max-w-md bg-[#050816] rounded-3xl border border-white/8 flex flex-col h-[340px] shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-3.5 border-b border-white/5 bg-slate-950/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="font-outfit text-xs font-bold text-white">Fitness AI Coach Simulator</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>

            {/* Chat message display */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-none text-[11px]">
              {coachMessages.map((m, idx) => (
                <div key={idx} className={`flex gap-2 max-w-[85%] ${m.role === "assistant" ? "mr-auto" : "ml-auto flex-row-reverse"}`}>
                  <div className={`p-2.5 rounded-2xl ${m.role === "assistant" ? "bg-white/5 border border-white/6 text-slate-100" : "bg-purple-500/15 border border-purple-500/25 text-white"}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {coachTyping && (
                <div className="flex gap-2 mr-auto animate-pulse">
                  <div className="bg-white/5 border border-white/6 px-3 py-2 rounded-2xl flex gap-1">
                    <span className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" />
                    <span className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Actions list */}
            <div className="px-3 py-1.5 border-t border-white/5 bg-slate-950/20 flex overflow-x-auto gap-2 scrollbar-none">
              <button 
                onClick={() => handleSendCoachDemo("How was my diet today? Analyze logs.")}
                className="bg-purple-500/10 border border-purple-500/25 text-[9px] font-bold text-purple-300 px-2.5 py-1 rounded-full shrink-0 cursor-pointer"
              >
                Analyze Diet
              </button>
              <button 
                onClick={() => handleSendCoachDemo("Create a protein meal plan.")}
                className="bg-purple-500/10 border border-purple-500/25 text-[9px] font-bold text-purple-300 px-2.5 py-1 rounded-full shrink-0 cursor-pointer"
              >
                Protein Plan
              </button>
              <button 
                onClick={() => handleSendCoachDemo("Suggest a quick snack.")}
                className="bg-purple-500/10 border border-purple-500/25 text-[9px] font-bold text-purple-300 px-2.5 py-1 rounded-full shrink-0 cursor-pointer"
              >
                Snack Suggestion
              </button>
            </div>

            {/* Input form */}
            <div className="p-2 border-t border-white/5 bg-slate-950/40 flex gap-1.5">
              <input 
                type="text"
                value={coachInput}
                onChange={(e) => setCoachInput(e.target.value)}
                placeholder="Ask simulator about protein..."
                className="flex-1 bg-slate-900 border border-white/6 rounded-lg px-3 py-1.5 outline-none text-white placeholder-slate-600"
                onKeyDown={(e) => e.key === "Enter" && handleSendCoachDemo(coachInput)}
              />
              <button 
                onClick={() => handleSendCoachDemo(coachInput)}
                className="bg-purple-650 hover:bg-purple-600 text-white font-bold text-[10px] px-3.5 rounded-lg cursor-pointer"
              >
                Ask
              </button>
            </div>
          </div>
        </div>

        {/* Copy */}
        <div className="lg:col-span-5 space-y-6 order-1 lg:order-2">
          <div className="space-y-2">
            <span className="text-[10px] text-purple-400 font-extrabold uppercase tracking-widest block">Context-Aware AI</span>
            <h2 className="font-outfit text-2xl sm:text-3xl font-black tracking-tight leading-none text-white">Dedicated Health Coach</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Consult the AI wellness drawer from any screen. Ask for protein recipes, weekly forecasts, or dynamic meal plans customized to your goal targets.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-purple-500/5 border border-purple-500/20 p-4.5 rounded-2xl">
            <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0" />
            <p className="text-[11px] text-slate-300 leading-snug">
              Securely connected via Supabase Auth and database tables, linking your history dynamically.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Pricing Tier Cards */}
      <section className="space-y-10">
        <div className="text-center max-w-md mx-auto space-y-2">
          <span className="text-[10px] text-brand-green font-extrabold uppercase tracking-widest block">No Hidden Costs</span>
          <h2 className="font-outfit text-2xl sm:text-3xl font-black tracking-tight text-white">Select Your Level</h2>
          <p className="text-xs text-slate-405 leading-relaxed">Start scanning meals and unlocking streaks for free. Upgrade as you scale.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto items-stretch">
          {/* Free Tier */}
          <div className="glass-panel rounded-[32px] p-6 sm:p-8 flex flex-col justify-between border-white/5 bg-slate-900/10">
            <div className="space-y-5">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Freemium Plan</span>
                <h3 className="font-outfit text-xl font-bold text-white mt-1">Athlete Basic</h3>
              </div>
              <div className="font-outfit text-3xl font-black text-white">
                $0 <span className="text-xs font-semibold text-slate-400">/ forever</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-350 border-t border-white/5 pt-4">
                {["10 scans per day", "Standard calorie tracking", "7-day tracking streaks", "Standard community dashboard"].map((li, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-brand-green" />
                    <span>{li}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link 
              href="/signup" 
              className="mt-8 bg-slate-900 border border-white/10 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl text-center block transition-all"
            >
              Sign Up Free
            </Link>
          </div>

          {/* Premium Tier */}
          <div className="glass-panel rounded-[32px] p-6 sm:p-8 flex flex-col justify-between border-brand-green/30 bg-gradient-to-b from-[#050816] to-[#0f172a]/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-brand-green text-black font-extrabold text-[8px] uppercase tracking-widest px-3 py-1 rounded-bl-xl">
              Recommended
            </div>
            
            <div className="space-y-5">
              <div>
                <span className="text-[10px] text-brand-green font-bold uppercase tracking-widest block">Premium Plan</span>
                <h3 className="font-outfit text-xl font-bold text-white mt-1">Athlete Elite</h3>
              </div>
              <div className="font-outfit text-3xl font-black text-brand-green">
                $19 <span className="text-xs font-semibold text-slate-405">/ month</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 border-t border-white/5 pt-4">
                {["Unlimited AI scans", "Dedicated AI coach drawer chat", "Weekly PDF summaries & downloads", "30-day deficit projection engine", "Gamified badges & achievements"].map((li, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-brand-green" />
                    <span className="font-semibold">{li}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link 
              href="/signup" 
              className="mt-8 bg-brand-green hover:bg-emerald-600 text-black font-bold text-xs py-3.5 rounded-xl text-center block shadow-glow transition-all"
            >
              Start 7-Day Elite Trial
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Collapsible FAQ */}
      <section className="space-y-8 max-w-2xl mx-auto">
        <div className="text-center space-y-2">
          <span className="text-[10px] text-purple-400 font-extrabold uppercase tracking-widest block">Common Queries</span>
          <h2 className="font-outfit text-2xl sm:text-3xl font-black tracking-tight text-white font-sans">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3.5">
          {[
            {
              q: "How accurate is the computer vision scanner?",
              a: "Our food scanning neural networks parse culinary boundaries, plate geometries, and ingredient compositions to deliver estimates within 90-95% accuracy compared to clinical database scales."
            },
            {
              q: "Does the AI coach remember my historical chat logs?",
              a: "Yes! Coach messages are written directly to your dedicated Supabase database table. When you consult the coach, it reviews your last 7 days of eating habits to customize recommendations."
            },
            {
              q: "How does the weight prediction engine calculate forecasts?",
              a: "By mapping your daily calorie consumption against target parameters logged in Supabase. It uses metabolic modeling, where a cumulative 7,700 kcal deficit translates to 1 kg fat reduction."
            },
            {
              q: "Can I edit estimated macros manually?",
              a: "Absolutely. If the AI estimate needs adjustment, simply click 'Adjust Macros' on the scan results screen to manually tweak calories, carbs, protein, and fat sliders before logging."
            }
          ].map((faq, idx) => {
            const isOpen = !!faqOpen[idx];
            return (
              <div 
                key={idx}
                className="glass-panel rounded-2xl overflow-hidden border-white/5 transition-all duration-300"
              >
                <button
                  onClick={() => handleFAQToggle(idx)}
                  className="w-full p-4.5 text-left flex justify-between items-center font-outfit font-bold text-xs hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <span className="text-white font-sans">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180 text-white" : ""}`} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="px-4.5 pb-4.5 text-xs text-slate-400 leading-relaxed border-t border-white/5 pt-2">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="border-t border-white/5 pt-8 text-center text-[10px] text-slate-550 space-y-3">
        <p className="font-semibold uppercase tracking-widest text-[9px] bg-clip-text text-transparent bg-gradient-to-r from-emerald-450 to-brand-sky">
          Aura AI • Venture Capital Demo ready
        </p>
        <p>Copyright © 2026 Aura Wellness. All rights reserved. Calculations verified in metabolic models.</p>
      </footer>

    </div>
  );
}
