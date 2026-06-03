"use client";

import React, { useState, useEffect } from "react";
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
  TrendingUp,
  User,
  Bot,
  Smartphone,
  CheckCircle2,
  Dumbbell,
  Lock,
  MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Demo foods for previewing overlay
const DEMO_FOODS = [
  {
    name: "Avocado Salmon Plate",
    calories: 420,
    protein: 28,
    carbs: 12,
    fat: 18,
    confidence: 96,
    tags: ["Salmon", "Avocado", "Spinach", "Seeds"]
  },
  {
    name: "Idli Sambar Combo",
    calories: 240,
    protein: 8,
    carbs: 48,
    fat: 2,
    confidence: 92,
    tags: ["Rice Idli", "Lentil Soup", "Spices"]
  },
  {
    name: "Grilled Chicken Rice",
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
    { role: "assistant", text: "Hello! Ask me any question about your diet, or click one of the quick action pills below to see how I analyze metrics." }
  ]);
  const [coachTyping, setCoachTyping] = useState(false);
  const [faqOpen, setFaqOpen] = useState<{ [key: number]: boolean }>({});

  const handleFAQToggle = (idx: number) => {
    setFaqOpen(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // Typing streaming simulation for the AI coach playground
  const simulateStreamingResponse = (fullText: string) => {
    setCoachTyping(true);
    let displayedText = "";
    let currentIndex = 0;

    // Create placeholder for the streaming message
    setCoachMessages(prev => [...prev, { role: "assistant", text: "" }]);

    const interval = setInterval(() => {
      if (currentIndex < fullText.length) {
        displayedText += fullText.charAt(currentIndex);
        setCoachMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = { role: "assistant", text: displayedText };
          }
          return updated;
        });
        currentIndex++;
      } else {
        clearInterval(interval);
        setCoachTyping(false);
      }
    }, 15);
  };

  const handleSendCoachDemo = (text: string) => {
    if (!text.trim() || coachTyping) return;

    setCoachMessages(prev => [...prev, { role: "user", text }]);
    setCoachInput("");

    // Formulate answer to stream
    setTimeout(() => {
      let reply = "";
      const lower = text.toLowerCase();
      if (lower.includes("protein")) {
        reply = "To hit your protein goals today, I recommend adding 150g of Grilled Chicken Breast (46g Protein) or 200g of Low-Fat Greek Yogurt (20g Protein). This fits perfectly into your remaining calorie allowance!";
      } else if (lower.includes("diet") || lower.includes("analyze") || lower.includes("log")) {
        reply = "Looking at your log summary: your protein is on track (85g consumed), but you are currently 300 kcal over your target carb limit. For dinner, aim for a low-carb, high-protein meal like salmon or baked tofu.";
      } else if (lower.includes("plan") || lower.includes("meal")) {
        reply = "Here is an optimized meal plan for tomorrow:\n- Breakfast: Scrambled egg whites with spinach\n- Lunch: Quinoa chicken bowl\n- Dinner: Seared tuna salad\n- Snack: Whey protein isolate shake";
      } else {
        reply = "Great question! Tracking macros consistently is the number one variable linked to sustained fat loss and muscle hypertrophy. Let's make sure we hit your targets today!";
      }

      simulateStreamingResponse(reply);
    }, 800);
  };

  const activeFood = DEMO_FOODS[activeDemoFood];

  return (
    <div className="space-y-28 pb-20 select-none text-white bg-[#020617] font-sans overflow-x-hidden relative">
      
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-20%] w-[600px] h-[600px] bg-brand-green/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[20%] right-[-20%] w-[600px] h-[600px] bg-brand-sky/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-10%] w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* 1. Header Navigation */}
      <header className="flex justify-between items-center py-6 border-b border-white/5 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-green via-emerald-500 to-brand-sky flex items-center justify-center shadow-lg relative overflow-hidden">
            <Sparkles className="w-4 h-4 text-black font-black" />
          </div>
          <span className="font-outfit font-black text-base tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            Aura Fitness AI
          </span>
        </div>
        
        <div className="flex items-center gap-5">
          <Link 
            href="/login" 
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            Log In
          </Link>
          <Link 
            href="/signup" 
            className="bg-brand-green hover:bg-emerald-400 text-black font-bold text-xs px-4 py-2.5 rounded-xl shadow-glow transition-all hover:scale-[1.03] active:scale-95"
          >
            Get Started Free
          </Link>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-8 z-10">
        <div className="lg:col-span-7 space-y-6 text-left">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-brand-green/10 text-brand-green border border-brand-green/20 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-green fill-current animate-pulse" />
            Metabolic Intelligence System
          </motion.span>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-outfit text-4xl sm:text-6xl font-black tracking-tight leading-[1.05] text-white"
          >
            Track nutrition with<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-green via-brand-sky to-purple-400">
              zero friction.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg"
          >
            Snap plates to instantly log macros via Vision AI. Converse with a dedicated 24/7 AI coach drawer that tracks protein consistency, and download premium weekly executive PDF reports.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="pt-4 flex flex-wrap gap-4"
          >
            <Link 
              href="/signup" 
              className="bg-brand-green hover:bg-emerald-450 text-black font-bold text-xs px-6 py-4 rounded-xl shadow-glow active:scale-[0.98] transition-all flex items-center gap-2 hover:scale-[1.02]"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/login" 
              className="bg-slate-900/80 border border-white/10 hover:bg-slate-850 hover:border-white/20 text-white font-bold text-xs px-6 py-4 rounded-xl active:scale-[0.98] transition-all"
            >
              Access Dashboard
            </Link>
          </motion.div>
        </div>

        {/* 3. Interactive CSS Phone Mockup Area */}
        <div className="lg:col-span-5 flex justify-center relative">
          
          {/* Ambient Glows around the phone */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-green/20 rounded-full blur-3xl pointer-events-none z-0" />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="w-[280px] h-[550px] rounded-[48px] border-[10px] border-slate-800 bg-[#070b19] relative shadow-2xl flex flex-col overflow-hidden z-10 border-double"
          >
            {/* Dynamic Island Notch */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-900 rounded-full z-30 flex items-center justify-between px-3 border border-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
              <div className="w-10 h-1 bg-slate-850 rounded-full" />
            </div>

            {/* Mobile Header Bar */}
            <div className="px-5 pt-8 pb-3 border-b border-white/5 flex justify-between items-center bg-slate-950/40 relative z-20">
              <div>
                <span className="text-[7px] text-slate-450 font-bold block uppercase tracking-wider">Aura Plate</span>
                <span className="text-[10px] font-black text-white font-outfit">Today&apos;s Intake</span>
              </div>
              <div className="w-5 h-5 rounded-full bg-brand-green/20 text-brand-green flex items-center justify-center">
                <Flame className="w-3 h-3 fill-current" />
              </div>
            </div>

            {/* Mobile Content Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-20 scrollbar-none bg-[#030712]/30">
              
              {/* Dial Progress Widget */}
              <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-3 text-center space-y-2">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="40" cy="40" r="34" className="stroke-slate-800" strokeWidth="5" fill="transparent" />
                    <circle cx="40" cy="40" r="34" className="stroke-brand-green" strokeWidth="5" strokeDasharray={2 * Math.PI * 34} strokeDashoffset={2 * Math.PI * 34 * (1 - 1420 / 2000)} strokeLinecap="round" fill="transparent" />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-xs font-black text-white">1,420</span>
                    <span className="text-[6px] text-slate-450 uppercase font-bold">/ 2,000 kcal</span>
                  </div>
                </div>

                <div className="flex justify-between text-[7px] text-slate-300 font-bold uppercase pt-1 border-t border-white/5">
                  <span className="text-brand-green">P: 105g/150g</span>
                  <span className="text-brand-sky">C: 135g/200g</span>
                  <span className="text-brand-coral">F: 48g/65g</span>
                </div>
              </div>

              {/* Logged items */}
              <div className="space-y-2">
                <span className="text-[7px] text-slate-450 uppercase font-bold tracking-wider block">Logged Foods</span>
                
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5 flex justify-between items-center">
                  <div className="min-w-0">
                    <span className="text-[9px] text-slate-100 font-bold block truncate">Avocado Salmon Plate</span>
                    <span className="text-[7px] text-slate-450 block">Breakfast &bull; P: 28g C: 12g F: 18g</span>
                  </div>
                  <span className="text-[9px] text-brand-green font-bold shrink-0">420 kcal</span>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5 flex justify-between items-center">
                  <div className="min-w-0">
                    <span className="text-[9px] text-slate-100 font-bold block truncate">Idli Sambar Combo</span>
                    <span className="text-[7px] text-slate-450 block">Lunch &bull; P: 8g C: 48g F: 2g</span>
                  </div>
                  <span className="text-[9px] text-brand-green font-bold shrink-0">240 kcal</span>
                </div>
              </div>
            </div>

            {/* Mobile Navigation bar */}
            <div className="px-6 py-3 border-t border-white/5 bg-slate-950/60 flex justify-between items-center relative z-20 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-green" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            </div>
          </motion.div>

          {/* Floating badge left */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="absolute -left-12 top-20 bg-slate-950/90 border border-white/10 p-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2.5 z-20 max-w-[160px]"
          >
            <div className="p-1.5 bg-brand-sky/10 text-brand-sky rounded-lg">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider block">Forecast (30d)</span>
              <span className="text-[10px] font-black text-white font-outfit mt-0.5 block">-2.4 kg weight loss</span>
            </div>
          </motion.div>

          {/* Floating badge right */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="absolute -right-12 bottom-20 bg-slate-950/90 border border-purple-500/20 p-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2.5 z-20 max-w-[160px]"
          >
            <div className="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider block">AI Coach Guide</span>
              <span className="text-[9px] font-black text-slate-200 mt-0.5 block leading-tight">Add 25g protein to satisfy daily targets.</span>
            </div>
          </motion.div>

        </div>
      </section>

      {/* 4. Value Props / Grid Showcase */}
      <section className="space-y-12 relative z-10">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-[10px] text-brand-sky font-extrabold uppercase tracking-widest block">Premium Architecture</span>
          <h2 className="font-outfit text-3xl font-black tracking-tight text-white font-sans uppercase">Smarter Tracking Utilities</h2>
          <p className="text-xs text-slate-400 leading-relaxed">Engineered with high performance client caching and advanced artificial intelligence.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Camera,
              title: "Native Camera Scan",
              desc: "Deep integration with camera. Programmatic fallback triggers quality compression under 1MB.",
              color: "text-brand-green bg-brand-green/10 border-brand-green/20"
            },
            {
              icon: Brain,
              title: "Streaming AI Advisor",
              desc: "Consult your AI dietitian drawer with zero wait time. Message queuing keeps inputs fluid.",
              color: "text-purple-400 bg-purple-500/10 border-purple-500/20"
            },
            {
              icon: TrendingUp,
              title: "Deficit Predictions",
              desc: "Forecasts weight curves based on logged statistics, calculating metabolic confidence metrics.",
              color: "text-brand-sky bg-brand-sky/10 border-brand-sky/20"
            },
            {
              icon: Download,
              title: "Multi-Page PDF Report",
              desc: "Stitches high-resolution covers, progress charts, and macro assessments into an A4 document.",
              color: "text-pink-400 bg-pink-500/10 border-pink-500/20"
            }
          ].map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div 
                key={idx}
                className="glass-panel rounded-3xl p-6 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-300 bg-slate-900/10"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${feat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="mt-8 space-y-2">
                  <h3 className="font-outfit text-sm font-bold text-slate-205 leading-tight">{feat.title}</h3>
                  <p className="text-xs text-slate-450 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Interactive Scanner Showcase */}
      <section className="glass-panel rounded-[32px] p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-white/5 bg-gradient-to-br from-slate-900/30 to-slate-950/10 shadow-premium-dark relative z-10">
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] text-brand-green font-extrabold uppercase tracking-widest block">Interactive Demonstration</span>
            <h2 className="font-outfit text-2xl sm:text-3xl font-black tracking-tight leading-none text-white">Food Recognition Overlay</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Click a meal below to experience how Aura&apos;s neural network scans photos, calculates verification confidence scores, and updates daily nutrient models.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            {DEMO_FOODS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setActiveDemoFood(idx)}
                className={`w-full p-3.5 rounded-2xl border transition-all text-left flex justify-between items-center cursor-pointer ${
                  activeDemoFood === idx 
                    ? "border-brand-green bg-brand-green/10 text-white" 
                    : "border-white/5 bg-slate-950/40 text-slate-400 hover:border-white/10"
                }`}
              >
                <span className="text-xs font-bold">{item.name}</span>
                <span className="text-[10px] font-extrabold text-brand-green uppercase tracking-wider">{item.calories} kcal</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scan overlay mockup card */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-sm bg-slate-950 rounded-[28px] overflow-hidden border border-white/10 shadow-2xl relative">
            <div className="h-52 w-full relative bg-slate-900/40 flex items-center justify-center p-6 border-b border-white/5">
              {/* Corner brackets */}
              <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-brand-green rounded-tl-lg opacity-80" />
              <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-brand-green rounded-tr-lg opacity-80" />
              <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-brand-green rounded-bl-lg opacity-80" />
              <div className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-brand-green rounded-br-lg opacity-80" />

              <div className="text-center space-y-2">
                <Camera className="w-8 h-8 text-brand-green mx-auto mb-1 animate-pulse" />
                <span className="font-outfit text-sm font-bold text-white block">{activeFood.name}</span>
                <span className="text-[9px] text-brand-green font-bold uppercase tracking-wider block">Confidence Score: {activeFood.confidence}%</span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <span className="text-[8px] text-slate-405 uppercase font-bold block">Calories</span>
                  <span className="font-outfit text-xs font-extrabold text-brand-green block mt-1">{activeFood.calories} kcal</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-405 uppercase font-bold block">Protein</span>
                  <span className="font-outfit text-xs font-extrabold text-white block mt-1">{activeFood.protein}g</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-405 uppercase font-bold block">Carbs</span>
                  <span className="font-outfit text-xs font-extrabold text-brand-sky block mt-1">{activeFood.carbs}g</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-405 uppercase font-bold block">Fat</span>
                  <span className="font-outfit text-xs font-extrabold text-brand-coral block mt-1">{activeFood.fat}g</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5 justify-center">
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

      {/* 6. AI Coach Drawer Streaming Playground */}
      <section className="glass-panel rounded-[32px] p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-white/5 bg-gradient-to-bl from-slate-900/30 to-slate-950/10 shadow-premium-dark relative z-10">
        
        {/* Chat Simulator */}
        <div className="lg:col-span-7 flex justify-center order-2 lg:order-1">
          <div className="w-full max-w-md bg-[#050816] rounded-3xl border border-white/8 flex flex-col h-[360px] shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-3.5 border-b border-white/5 bg-slate-950/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <span className="font-outfit text-xs font-bold text-white">AI Coach Live Simulator (Streaming)</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-none text-[11px]">
              {coachMessages.map((m, idx) => {
                const isAssistant = m.role === "assistant";
                return (
                  <div key={idx} className={`flex gap-2 max-w-[85%] ${isAssistant ? "mr-auto" : "ml-auto flex-row-reverse"}`}>
                    <div className={`p-2.5 rounded-2xl ${isAssistant ? "bg-white/5 border border-white/6 text-slate-100 rounded-tl-none" : "bg-purple-500/15 border border-purple-500/25 text-white rounded-tr-none"}`}>
                      {m.text.split("\n").map((par, i) => (
                        <p key={i} className={i > 0 ? "mt-1.5" : ""}>{par}</p>
                      ))}
                    </div>
                  </div>
                );
              })}
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

            {/* Quick action pills */}
            <div className="px-3 py-2 border-t border-white/5 bg-slate-950/20 flex overflow-x-auto gap-2 scrollbar-none shrink-0">
              <button 
                onClick={() => handleSendCoachDemo("Analyze my diet consistency logs.")}
                className="bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40 text-[9px] font-bold text-purple-300 px-3 py-1 rounded-full shrink-0 cursor-pointer transition-colors"
              >
                Analyze Diet
              </button>
              <button 
                onClick={() => handleSendCoachDemo("Generate a high-protein dinner meal plan.")}
                className="bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40 text-[9px] font-bold text-purple-300 px-3 py-1 rounded-full shrink-0 cursor-pointer transition-colors"
              >
                High-Protein Plan
              </button>
              <button 
                onClick={() => handleSendCoachDemo("Am I drinking enough water daily?")}
                className="bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40 text-[9px] font-bold text-purple-300 px-3 py-1 rounded-full shrink-0 cursor-pointer transition-colors"
              >
                Water Goals
              </button>
            </div>

            {/* Chat Input form */}
            <div className="p-2 border-t border-white/5 bg-slate-950/40 flex gap-1.5 shrink-0">
              <input 
                type="text"
                value={coachInput}
                onChange={(e) => setCoachInput(e.target.value)}
                placeholder="Ask simulator about protein..."
                className="flex-1 bg-slate-900 border border-white/6 rounded-lg px-3 py-2 outline-none text-xs text-white placeholder-slate-600"
                onKeyDown={(e) => e.key === "Enter" && handleSendCoachDemo(coachInput)}
              />
              <button 
                onClick={() => handleSendCoachDemo(coachInput)}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] px-4 rounded-lg cursor-pointer transition-all active:scale-95"
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
            <h2 className="font-outfit text-2xl sm:text-3xl font-black tracking-tight leading-none text-white uppercase">Dedicated AI Health Coach</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Experience zero wait times. Aura Coach responds using chunked streaming transfer encoding, outputting advice character-by-character while syncing logs.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-purple-500/5 border border-purple-500/20 p-4.5 rounded-2xl">
            <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0" />
            <p className="text-[10px] text-slate-300 leading-snug">
              Securely connected via database policies. Coach audits your previous 7 days of inputs to suggest customized dietary recipes.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Feature Showcase */}
      <section className="space-y-12 relative z-10 max-w-5xl mx-auto">
        <div className="text-center max-w-md mx-auto space-y-2">
          <span className="text-[10px] text-brand-green font-extrabold uppercase tracking-widest block">Core Engine</span>
          <h2 className="font-outfit text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">Intelligent Features</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Everything you need to hit your macro targets, optimize performance, and stay consistent.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          
          {/* Card 1: AI Food Scanner */}
          <motion.div 
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="glass-panel rounded-[28px] p-6 border-white/5 bg-slate-900/10 hover:border-brand-green/20 flex flex-col justify-between group transition-all"
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center border border-brand-green/20 group-hover:bg-brand-green group-hover:text-black transition-all">
                <Camera className="w-5 h-5 stroke-[2px]" />
              </div>
              <div className="space-y-1">
                <h3 className="font-outfit text-sm font-bold text-white tracking-tight">AI Food Scanner</h3>
                <p className="text-[11px] text-slate-450 leading-relaxed">
                  Analyze and identify meals instantly using computer vision.
                </p>
              </div>
              <ul className="space-y-2 text-[10px] text-slate-300 border-t border-white/5 pt-3">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-brand-green" />
                  <span>Scan meals instantly</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-brand-green" />
                  <span>Automatic calorie estimation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-brand-green" />
                  <span>Macro breakdown</span>
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Card 2: AI Fitness Coach */}
          <motion.div 
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="glass-panel rounded-[28px] p-6 border-white/5 bg-slate-900/10 hover:border-purple-400/20 flex flex-col justify-between group transition-all"
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 group-hover:bg-purple-500 group-hover:text-white transition-all">
                <Bot className="w-5 h-5 stroke-[2px]" />
              </div>
              <div className="space-y-1">
                <h3 className="font-outfit text-sm font-bold text-white tracking-tight">AI Fitness Coach</h3>
                <p className="text-[11px] text-slate-450 leading-relaxed">
                  Your context-aware personal coach responding dynamically.
                </p>
              </div>
              <ul className="space-y-2 text-[10px] text-slate-300 border-t border-white/5 pt-3">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-400" />
                  <span>Personalized nutrition guidance</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-400" />
                  <span>Daily recommendations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-400" />
                  <span>Goal-based coaching</span>
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Card 3: Progress Analytics */}
          <motion.div 
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="glass-panel rounded-[28px] p-6 border-white/5 bg-slate-900/10 hover:border-brand-sky/20 flex flex-col justify-between group transition-all"
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-brand-sky/10 text-brand-sky flex items-center justify-center border border-brand-sky/20 group-hover:bg-brand-sky group-hover:text-black transition-all">
                <Activity className="w-5 h-5 stroke-[2px]" />
              </div>
              <div className="space-y-1">
                <h3 className="font-outfit text-sm font-bold text-white tracking-tight">Progress Analytics</h3>
                <p className="text-[11px] text-slate-450 leading-relaxed">
                  Real-time streak metrics and weight logs visualization.
                </p>
              </div>
              <ul className="space-y-2 text-[10px] text-slate-300 border-t border-white/5 pt-3">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-brand-sky" />
                  <span>Streak tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-brand-sky" />
                  <span>Weight trends</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-brand-sky" />
                  <span>Performance score</span>
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Card 4: Weekly Reports */}
          <motion.div 
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="glass-panel rounded-[28px] p-6 border-white/5 bg-slate-900/10 hover:border-pink-400/20 flex flex-col justify-between group transition-all"
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center border border-pink-500/20 group-hover:bg-pink-500 group-hover:text-white transition-all">
                <Download className="w-5 h-5 stroke-[2px]" />
              </div>
              <div className="space-y-1">
                <h3 className="font-outfit text-sm font-bold text-white tracking-tight">Weekly Reports</h3>
                <p className="text-[11px] text-slate-450 leading-relaxed">
                  Stitched multi-page PDF summary and nutritionist audit.
                </p>
              </div>
              <ul className="space-y-2 text-[10px] text-slate-300 border-t border-white/5 pt-3">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-pink-400" />
                  <span>PDF export</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-pink-400" />
                  <span>Nutrition insights</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-pink-400" />
                  <span>Progress summaries</span>
                </li>
              </ul>
            </div>
          </motion.div>

        </div>
      </section>

      {/* 8. FAQ Accordion section */}
      <section className="space-y-8 max-w-2xl mx-auto relative z-10">
        <div className="text-center space-y-2">
          <span className="text-[10px] text-purple-400 font-extrabold uppercase tracking-widest block">Answers</span>
          <h2 className="font-outfit text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">Frequently Asked Queries</h2>
        </div>

        <div className="space-y-3.5">
          {[
            {
              q: "How precise is the computer vision scanner?",
              a: "Our food scanning neural networks parse culinary shapes, plate geometries, and ingredient compositions to deliver estimates within 90-95% accuracy compared to standard nutrition indices."
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

      {/* 9. Structured Footer */}
      <footer className="border-t border-white/5 pt-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12 text-left">
          
          {/* Col 1 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-brand-green to-brand-sky flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-black" />
              </div>
              <span className="font-outfit font-black text-xs tracking-wider uppercase text-white">Aura AI</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Venture-backed physical health intelligence models. Track plates, forecast weight paths, and optimize nutrition.
            </p>
          </div>

          {/* Col 2 */}
          <div className="space-y-3.5">
            <h4 className="font-outfit font-extrabold text-[10px] text-white uppercase tracking-wider">Features</h4>
            <ul className="space-y-2 text-xs text-slate-450 font-medium">
              <li><Link href="/signup" className="hover:text-white transition-colors">Vision AI Scan</Link></li>
              <li><Link href="/coach" className="hover:text-white transition-colors">AI Coaching Drawer</Link></li>
              <li><Link href="/analytics" className="hover:text-white transition-colors">Deficit Forecasts</Link></li>
              <li><Link href="/analytics" className="hover:text-white transition-colors">PDF Export Reports</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3.5">
            <h4 className="font-outfit font-extrabold text-[10px] text-white uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2 text-xs text-slate-450 font-medium">
              <li><span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Security Standards</span></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-3.5">
            <h4 className="font-outfit font-extrabold text-[10px] text-white uppercase tracking-wider">Developer Links</h4>
            <div className="flex gap-4">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noreferrer"
                className="p-2 bg-slate-900 border border-white/10 rounded-xl hover:text-white text-slate-400 transition-all hover:border-white/25 flex items-center justify-center cursor-pointer"
                title="GitHub"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noreferrer"
                className="p-2 bg-slate-900 border border-white/10 rounded-xl hover:text-white text-slate-400 transition-all hover:border-white/25 flex items-center justify-center cursor-pointer"
                title="LinkedIn"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 py-6 text-center text-[10px] text-slate-550 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>Copyright &copy; 2026 Aura Fitness AI. All rights reserved.</p>
          <p className="font-semibold uppercase tracking-widest text-[8px] bg-clip-text text-transparent bg-gradient-to-r from-brand-green to-brand-sky">
            Aura AI &bull; Premium Physical System
          </p>
        </div>
      </footer>

    </div>
  );
}
