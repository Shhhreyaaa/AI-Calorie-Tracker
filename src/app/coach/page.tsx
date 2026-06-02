"use client";
/* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */

import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Send, 
  User, 
  Bot, 
  ArrowLeft, 
  Loader2, 
  Flame, 
  AlertCircle, 
  Droplet, 
  Dumbbell, 
  ChevronDown, 
  ChevronUp, 
  Lightbulb, 
  Activity, 
  RefreshCw, 
  MessageSquare,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ShoppingCart,
  CalendarRange,
  CheckSquare,
  Copy,
  Download,
  Calendar
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

interface CoachInsights {
  nutritionScore: number;
  nutritionLabel: "Excellent" | "Good" | "Needs Improvement";
  topRecommendation: string;
  macroAlert: string;
  hydrationReminder: string;
  proteinReminder: string;
  dailySummary: string;
  doingWell: string;
  nutrientsLacking: string;
  nutrientsExcessive: string;
  recommendedNextMeal: string;
  recommendedProteinIntake: string;
  recommendedCalorieIntake: string;
  healthSuggestions: string[];
}

export default function CoachPage() {
  const [activeTab, setActiveTab] = useState<"chat" | "plan" | "grocery">("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [insights, setInsights] = useState<CoachInsights | null>(null);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [stats, setStats] = useState({
    calories: 0,
    target: 2000,
    protein: 0,
    targetProtein: 150,
    streak: 0
  });

  // Tomorrow Plan state
  const [tomorrowPlan, setTomorrowPlan] = useState<any>(null);
  const [loadingTomorrowPlan, setLoadingTomorrowPlan] = useState(false);

  // Grocery List state
  const [groceryList, setGroceryList] = useState<any>(null);
  const [loadingGrocery, setLoadingGrocery] = useState(false);
  const [groceryCheckedItems, setGroceryCheckedItems] = useState<{ [key: string]: boolean }>({});

  // Voice States
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-US";

        rec.onstart = () => {
          setIsListening(true);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        rec.onresult = (e: any) => {
          const transcript = e.results[0][0].transcript;
          setInput(prev => prev + (prev ? " " : "") + transcript);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please try Chrome or Safari.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const speakText = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      // Clean up markdown before speaking
      const cleanText = text.replace(/[*#_`~-]/g, "");
      const utterance = new SpeechSynthesisUtterance(cleanText);
      window.speechSynthesis.speak(utterance);
    }
  };

  // 1. Fetch Chat History from Supabase Database
  const fetchChatHistory = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("coach_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Supabase Chat History Error:", error);
        setMessages([]);
        return;
      }

      if (data && data.length > 0) {
        setMessages(data.map(m => ({
          id: m.id,
          role: m.role,
          content: m.message,
          created_at: m.created_at
        })));
      } else {
        setMessages([]);
      }
    } catch (err: any) {
      console.error("Runtime Chat History Error:", err);
      setMessages([]);
    }
  };

  // 2. Fetch Todays Stats (Calories, Protein, Streak)
  const fetchUserStats = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Goals
      const { data: goalData } = await supabase
        .from("goals")
        .select("*")
        .eq("id", user.id)
        .single();

      // Today's meals
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: mealsData } = await supabase
        .from("meals")
        .select("calories, protein")
        .eq("user_id", user.id)
        .gte("logged_at", today.toISOString());

      // Streaks
      const { data: streakData } = await supabase
        .from("streaks")
        .select("current_streak")
        .eq("id", user.id)
        .single();

      const sumCalories = mealsData?.reduce((sum, m) => sum + m.calories, 0) || 0;
      const sumProtein = mealsData?.reduce((sum, m) => sum + m.protein, 0) || 0;

      setStats({
        calories: sumCalories,
        target: goalData?.calorie_target ?? goalData?.calories ?? 2000,
        protein: sumProtein,
        targetProtein: goalData?.protein_target ?? goalData?.protein ?? 150,
        streak: streakData?.current_streak || 0
      });
    } catch (err) {
      console.error("Failed to load stats context:", err);
    }
  };

  // 3. Fetch AI Coach Insights (Today's Score & Insights Cards)
  const fetchCoachInsights = async () => {
    setLoadingInsights(true);
    setInsightsError(null);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const localMidnight = today.toISOString();

      const response = await fetch(`/api/coach/insights?localMidnight=${encodeURIComponent(localMidnight)}`);
      const data = await response.json();
      
      if (data && data.insights) {
        setInsights(data.insights);
      }
      
      if (!response.ok || !data.success) {
        setInsightsError(data?.error || "Failed to fetch AI insights. Running offline.");
      }
    } catch (err) {
      console.error("Failed to fetch coach insights:", err);
      setInsightsError("Unable to connect to AI insights service.");
    } finally {
      setLoadingInsights(false);
    }
  };

  // 4. Generate Grocery List
  const generateGroceryList = async () => {
    setLoadingGrocery(true);
    try {
      const response = await fetch("/api/coach/grocery", {
        method: "POST"
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setGroceryList(data.groceryList);
        // Clear checked list
        setGroceryCheckedItems({});
      } else {
        alert(data.error || "Failed to generate grocery list.");
      }
    } catch (err) {
      console.error("Grocery generator error:", err);
    } finally {
      setLoadingGrocery(false);
    }
  };

  // 5. Generate Tomorrow Meal Plan
  const generateTomorrowPlan = async () => {
    setLoadingTomorrowPlan(true);
    try {
      const response = await fetch("/api/coach/plan", {
        method: "POST"
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setTomorrowPlan(data.plan);
      } else {
        alert(data.error || "Failed to generate meal plan.");
      }
    } catch (err) {
      console.error("Tomorrow planner error:", err);
    } finally {
      setLoadingTomorrowPlan(false);
    }
  };

  // Tab switching side-effects
  useEffect(() => {
    if (activeTab === "plan" && !tomorrowPlan) {
      generateTomorrowPlan();
    }
    if (activeTab === "grocery" && !groceryList) {
      generateGroceryList();
    }
  }, [activeTab]);

  // Initial load
  useEffect(() => {
    fetchChatHistory();
    fetchUserStats();
    fetchCoachInsights();
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Send message handler
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = { role: "user", content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const localMidnight = today.toISOString();

      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          localMidnight
        })
      });

      const data = await response.json();
      if (response.ok && data.success && data.reply) {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
        
        // Vocalize response if unmuted
        if (!isMuted) {
          speakText(data.reply);
        }

        fetchUserStats();
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: `I'm sorry, I encountered an error: ${data.error || "Failed to process chat response."}`
          }
        ]);
      }
    } catch (err) {
      console.error("Coach message dispatch error:", err);
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "Oops! I'm having trouble connecting to the servers right now. Please verify your connection and try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestClick = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const getGroceryMarkdown = () => {
    if (!groceryList) return "";
    let md = `AI Grocery Shopping List\nReasoning: ${groceryList.reasoning}\n\n`;
    groceryList.categories.forEach((cat: any) => {
      md += `### ${cat.name}\n`;
      cat.items.forEach((item: string) => {
        md += `- [ ] ${item}\n`;
      });
      md += `\n`;
    });
    return md;
  };

  const score = insights?.nutritionScore ?? 0;
  const label = insights?.nutritionLabel ?? "Needs Improvement";

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header Bar */}
      <div className="flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard" 
            className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-slate-505 hover:text-slate-800 dark:hover:text-slate-205 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">AI Companion</span>
            <h2 className="font-outfit text-2xl font-bold tracking-tight">Nutrition Coach</h2>
          </div>
        </div>

        <button 
          onClick={() => {
            fetchUserStats();
            fetchCoachInsights();
            if (activeTab === "plan") generateTomorrowPlan();
            if (activeTab === "grocery") generateGroceryList();
          }}
          disabled={loadingInsights || loadingTomorrowPlan || loadingGrocery}
          className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingInsights || loadingTomorrowPlan || loadingGrocery ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tab selection pills */}
      <div className="flex bg-slate-205/40 dark:bg-slate-800/40 p-1 rounded-2xl border border-slate-100/50 dark:border-slate-800/30">
        <button 
          onClick={() => setActiveTab("chat")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "chat" 
              ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm" 
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat Coach</span>
        </button>
        <button 
          onClick={() => setActiveTab("plan")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "plan" 
              ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm" 
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
          }`}
        >
          <CalendarRange className="w-3.5 h-3.5" />
          <span>Plan Tomorrow</span>
        </button>
        <button 
          onClick={() => setActiveTab("grocery")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "grocery" 
              ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm" 
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Grocery List</span>
        </button>
      </div>

      {activeTab === "chat" && (
        <div className="space-y-6 animate-fade-in">
          {/* 1. Coach Dashboard Card (Score) & Insights Header Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Nutrition Score Card */}
            <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-6 shadow-premium dark:shadow-premium-dark flex flex-col items-center justify-center text-center relative overflow-hidden">
              {loadingInsights ? (
                <div className="flex flex-col items-center justify-center space-y-3 py-6">
                  <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Analyzing logs...</span>
                </div>
              ) : (
                <>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-4">Today&apos;s Nutrition Score</span>
                  
                  {/* Circular SVG Ring */}
                  <div className="relative flex items-center justify-center w-28 h-28 mb-4">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="56"
                        cy="56"
                        r="48"
                        className="stroke-slate-100 dark:stroke-slate-800"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="56"
                        cy="56"
                        r="48"
                        className={`${
                          score >= 85 ? "stroke-brand-green" : score >= 60 ? "stroke-amber-500" : "stroke-rose-500"
                        } transition-all duration-1000 ease-out`}
                        strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 48}
                        strokeDashoffset={2 * Math.PI * 48 * (1 - score / 100)}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="font-outfit text-3xl font-black text-slate-800 dark:text-slate-100">{score}</span>
                      <span className="text-[8px] font-bold uppercase text-slate-400">/ 100</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    label === "Excellent" 
                      ? "bg-brand-green/10 text-brand-green" 
                      : label === "Good" 
                        ? "bg-amber-500/10 text-amber-500" 
                        : "bg-rose-500/10 text-rose-500"
                  }`}>
                    {label}
                  </span>
                </>
              )}
            </div>

            {/* AI Key Insights Grid */}
            <div className="md:col-span-2 glass-panel rounded-[32px] p-6 flex flex-col justify-between">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block mb-4">AI Assistant Summary</span>
              
              {loadingInsights ? (
                <div className="flex-1 flex flex-col justify-center gap-3 py-4">
                  <div className="h-4 bg-slate-900/60 rounded-lg animate-pulse w-3/4" />
                  <div className="h-4 bg-slate-900/60 rounded-lg animate-pulse w-5/6" />
                  <div className="h-4 bg-slate-900/60 rounded-lg animate-pulse w-1/2" />
                </div>
              ) : (
                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start gap-2.5">
                      <Lightbulb className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-white">Top Recommendation</h4>
                        <p className="text-xs text-slate-350 mt-1 leading-relaxed">
                          {insights?.topRecommendation}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-3.5">
                    <div className="flex items-start gap-2.5">
                      <Activity className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-white">Nutrients Assessment</h4>
                        <p className="text-xs text-slate-350 mt-1 leading-relaxed">
                          {insights?.doingWell ? `${insights.doingWell} ` : ""}
                          {insights?.nutrientsLacking ? `Lacking: ${insights.nutrientsLacking}. ` : ""}
                          {insights?.nutrientsExcessive ? `Excessive: ${insights.nutrientsExcessive}.` : ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Accordion Daily Summary Box */}
                  <div className="border-t border-white/5 pt-3.5">
                    <button 
                      onClick={() => setShowSummary(!showSummary)}
                      className="flex items-center justify-between w-full text-left text-xs font-bold text-brand-green hover:underline"
                    >
                      <span>Read Full Daily Log Summary</span>
                      {showSummary ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {showSummary && (
                      <p className="text-xs text-slate-350 mt-2 leading-relaxed bg-slate-950/40 p-3.5 rounded-2xl border border-white/5 animate-fade-in">
                        {insights?.dailySummary}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Micro Insights Grid Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Ideal Next Meal */}
            <div className="glass-panel rounded-2xl p-3.5 flex items-start gap-2.5 min-h-[120px] min-w-[220px] w-full">
              <div className="p-2 rounded-xl bg-brand-green/10 text-brand-green shrink-0 flex items-center justify-center mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest block whitespace-nowrap">Ideal Next Meal</span>
                {loadingInsights ? (
                  <div className="space-y-1.5 mt-1.5 w-full">
                    <div className="h-2 bg-slate-900/60 rounded animate-pulse w-full" />
                    <div className="h-2 bg-slate-900/60 rounded animate-pulse w-4/5" />
                  </div>
                ) : (
                  <span className="text-[11px] font-bold text-white mt-0.5 block leading-snug">
                    {insights?.recommendedNextMeal || "A balanced dinner"}
                  </span>
                )}
              </div>
            </div>

            {/* Macro Alert Card */}
            <div className="glass-panel rounded-2xl p-3.5 flex items-start gap-2.5 min-h-[120px] min-w-[220px] w-full">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0 flex items-center justify-center mt-0.5">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest block whitespace-nowrap">Macro Alert</span>
                {loadingInsights ? (
                  <div className="space-y-1.5 mt-1.5 w-full">
                    <div className="h-2 bg-slate-900/60 rounded animate-pulse w-full" />
                    <div className="h-2 bg-slate-900/60 rounded animate-pulse w-4/5" />
                  </div>
                ) : (
                  <span className="text-[11px] font-bold text-white mt-0.5 block leading-snug">
                    {insights?.macroAlert || "No alerts"}
                  </span>
                )}
              </div>
            </div>

            {/* Protein Reminder Card */}
            <div className="glass-panel rounded-2xl p-3.5 flex items-start gap-2.5 min-h-[120px] min-w-[220px] w-full">
              <div className="p-2 rounded-xl bg-brand-coral/10 text-brand-coral shrink-0 flex items-center justify-center mt-0.5">
                <Dumbbell className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest block whitespace-nowrap">Protein Guide</span>
                {loadingInsights ? (
                  <div className="space-y-1.5 mt-1.5 w-full">
                    <div className="h-2 bg-slate-900/60 rounded animate-pulse w-full" />
                    <div className="h-2 bg-slate-900/60 rounded animate-pulse w-4/5" />
                  </div>
                ) : (
                  <span className="text-[11px] font-bold text-white mt-0.5 block leading-snug">
                    {insights?.proteinReminder || "Log meals to track"}
                  </span>
                )}
              </div>
            </div>

            {/* Hydration Reminder Card */}
            <div className="glass-panel rounded-2xl p-3.5 flex items-start gap-2.5 min-h-[120px] min-w-[220px] w-full">
              <div className="p-2 rounded-xl bg-brand-sky/10 text-brand-sky shrink-0 flex items-center justify-center mt-0.5">
                <Droplet className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest block whitespace-nowrap">Hydration</span>
                {loadingInsights ? (
                  <div className="space-y-1.5 mt-1.5 w-full">
                    <div className="h-2 bg-slate-900/60 rounded animate-pulse w-full" />
                    <div className="h-2 bg-slate-900/60 rounded animate-pulse w-4/5" />
                  </div>
                ) : (
                  <span className="text-[11px] font-bold text-white mt-0.5 block leading-snug">
                    {insights?.hydrationReminder || "Drink water regularly"}
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* 3. Conversational Coach Chat Pane */}
          <div className="glass-panel rounded-[32px] flex flex-col h-[500px]">
            
            {/* Chat Header */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-950/20 rounded-t-[32px]">
              <h3 className="font-outfit text-xs font-bold flex items-center gap-1.5 text-white">
                <MessageSquare className="w-4 h-4 text-brand-green" /> Chat Conversation Memory
              </h3>
              
              <div className="flex items-center gap-2">
                {/* Voice Speaker Control */}
                <button 
                  type="button"
                  onClick={() => {
                    const newMute = !isMuted;
                     setIsMuted(newMute);
                    if (newMute) {
                      if (typeof window !== "undefined") window.speechSynthesis.cancel();
                    } else {
                      speakText("Voice response enabled!");
                    }
                  }}
                  className={`p-1.5 rounded-lg border transition-colors flex items-center justify-center cursor-pointer ${
                    isMuted 
                      ? "border-white/5 text-slate-400 hover:text-slate-300" 
                      : "border-brand-green bg-brand-green/10 text-brand-green"
                  }`}
                  title={isMuted ? "Enable speech synthesis response" : "Disable voice response"}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>

                <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full text-[9px] font-bold text-brand-green uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-ping" />
                  <span>Memory Active</span>
                </div>
              </div>
            </div>

            {/* Messages List Area */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/5 ${messages.length === 0 ? "flex flex-col items-center justify-center" : ""}`}>
              {messages.length === 0 ? (
                <div className="text-center py-10 flex flex-col items-center justify-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center shadow-premium">
                    <Bot className="w-5 h-5 animate-pulse" />
                  </div>
                  <h4 className="font-outfit text-xs font-bold text-slate-200">
                    Start your first conversation with the AI Coach
                  </h4>
                  <p className="text-[10px] text-slate-450 max-w-[200px]">
                    Ask questions about protein, meals, macros, or getting a personalized meal plan.
                  </p>
                </div>
              ) : (
                messages.map((m, i) => {
                  const isAssistant = m.role === "assistant";
                  return (
                    <div 
                      key={i} 
                      className={`flex gap-3 max-w-[85%] ${isAssistant ? "mr-auto" : "ml-auto flex-row-reverse"}`}
                    >
                      {/* Avatar indicator */}
                      <div 
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                          isAssistant 
                            ? "bg-brand-green/10 text-brand-green border border-brand-green/20" 
                            : "bg-brand-sky/20 border border-brand-sky/30 text-brand-sky"
                        }`}
                      >
                        {isAssistant ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                      </div>

                      {/* Message Bubble */}
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <div 
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isAssistant 
                              ? "glass-panel text-slate-100 rounded-tl-sm border-brand-green/15" 
                              : "bg-brand-sky/15 border border-brand-sky/30 text-white rounded-tr-sm"
                          }`}
                        >
                          {m.content.split("\n").map((paragraph, index) => (
                            <p key={index} className={index > 0 ? "mt-2" : ""}>
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {loading && (
                <div className="flex gap-3 max-w-[80%] mr-auto animate-pulse">
                  <div className="w-7 h-7 rounded-lg bg-brand-green/10 text-brand-green border border-brand-green/20 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="glass-panel border-brand-green/15 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center justify-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-brand-green rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-brand-green rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-brand-green rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Suggestion Chips */}
            {messages.length <= 1 && !loading && (
              <div className="p-3 border-t border-white/5 flex flex-wrap gap-2 justify-center bg-slate-950/10">
                <button 
                  onClick={() => handleSuggestClick("What should I eat tonight based on my remaining macros?")}
                  className="bg-slate-900/60 border border-white/5 hover:border-brand-green/25 text-xs font-semibold px-3 py-1.5 rounded-full text-slate-300 transition-colors shadow-sm shrink-0 cursor-pointer"
                >
                  🍽️ What should I eat tonight?
                </button>
                <button 
                  onClick={() => handleSuggestClick("Give me a protein-focused muscle gain meal plan.")}
                  className="bg-slate-900/60 border border-white/5 hover:border-brand-green/25 text-xs font-semibold px-3 py-1.5 rounded-full text-slate-300 transition-colors shadow-sm shrink-0 cursor-pointer"
                >
                  💪 Muscle gain meal plan
                </button>
                <button 
                  onClick={() => handleSuggestClick("Am I eating too many carbs today?")}
                  className="bg-slate-900/60 border border-white/5 hover:border-brand-green/25 text-xs font-semibold px-3 py-1.5 rounded-full text-slate-300 transition-colors shadow-sm shrink-0 cursor-pointer"
                >
                  🥗 Am I eating too many carbs?
                </button>
              </div>
            )}

            {/* Chat Input form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(input);
              }}
              className="p-3 border-t border-white/5 bg-slate-950/20 rounded-b-[32px] flex gap-2 shrink-0"
            >
              {/* Mic Input Trigger */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                  isListening 
                    ? "bg-red-500/20 border-red-500/50 text-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.3)]" 
                    : "border-white/5 text-slate-400 hover:text-slate-200"
                }`}
                title={isListening ? "Listening... click to stop" : "Use microphone to dictate"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening..." : "Ask about protein, weight loss meal plan, hydration..."}
                disabled={loading}
                className="flex-1 glass-input rounded-xl px-4 py-2.5 text-xs outline-none text-white placeholder-slate-500"
              />
              <button 
                type="submit"
                disabled={!input.trim() || loading}
                className="bg-brand-green hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 text-white px-4 rounded-xl active:scale-95 transition-all shadow-glow flex items-center justify-center font-bold text-xs"
              >
                <Send className="w-3.5 h-3.5 mr-1" /> Send
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === "plan" && (
        <div className="space-y-6 animate-fade-in">
          <div className="glass-panel rounded-[32px] p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div>
                <h3 className="font-outfit text-base font-bold text-white">Tomorrow Meal Plan</h3>
                <p className="text-xs text-slate-400 mt-0.5">Optimized based on user daily goals & preferences</p>
              </div>
              <button 
                onClick={generateTomorrowPlan}
                disabled={loadingTomorrowPlan}
                className="flex items-center gap-1 bg-brand-green/10 text-brand-green border border-brand-green/20 font-bold text-[10px] py-1.5 px-3 rounded-lg hover:bg-brand-green/20 cursor-pointer"
              >
                {loadingTomorrowPlan ? <Loader2 className="w-3 h-3 animate-spin" /> : "Re-Plan"}
              </button>
            </div>

            {loadingTomorrowPlan ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Generating structure...</span>
              </div>
            ) : tomorrowPlan ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Here is tomorrow's structured plan. Try to follow the estimates to meet your macronutrient goals.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {["breakfast", "lunch", "dinner", "snacks"].map((mealKey) => {
                    const meal = tomorrowPlan[mealKey];
                    const labelMap: any = {
                      breakfast: "Breakfast 🥣",
                      lunch: "Lunch 🍛",
                      dinner: "Dinner 🍲",
                      snacks: "Snack & Drink 🍎"
                    };
                    return (
                      <div key={mealKey} className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-2">
                        <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                          <span className="font-outfit font-extrabold text-xs text-slate-200">{labelMap[mealKey]}</span>
                          <span className="text-brand-green font-bold text-xs">{meal?.calories} kcal</span>
                        </div>
                        <h4 className="text-xs text-slate-300 font-semibold leading-relaxed">{meal?.name}</h4>
                        <div className="flex justify-between items-center text-[9px] text-slate-450 font-bold uppercase tracking-wider mt-1.5">
                          <span>P: {meal?.protein}g</span>
                          <span>C: {meal?.carbs}g</span>
                          <span>F: {meal?.fat}g</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2 pt-3 border-t border-white/5">
                  <button 
                    onClick={() => {
                      let text = `AI Tomorrow's Meal Plan\n\n`;
                      ["breakfast", "lunch", "dinner", "snacks"].forEach(k => {
                        const m = tomorrowPlan[k];
                        text += `${k.toUpperCase()}: ${m.name} (${m.calories} kcal, P: ${m.protein}g, C: ${m.carbs}g, F: ${m.fat}g)\n`;
                      });
                      handleCopyText(text);
                    }}
                    className="flex-1 bg-slate-900/60 border border-white/5 hover:bg-slate-800 text-slate-300 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Plan Text</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-405 italic text-center py-6">Could not load tomorrow's meal plan.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "grocery" && (
        <div className="space-y-6 animate-fade-in">
          <div className="glass-panel rounded-[32px] p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div>
                <h3 className="font-outfit text-base font-bold text-white">AI Shopping Grocery List</h3>
                <p className="text-xs text-slate-400 mt-0.5">Optimized for your protein & energy targets</p>
              </div>
              <button 
                onClick={generateGroceryList}
                disabled={loadingGrocery}
                className="flex items-center gap-1 bg-brand-green/10 text-brand-green border border-brand-green/20 font-bold text-[10px] py-1.5 px-3 rounded-lg hover:bg-brand-green/20 cursor-pointer"
              >
                {loadingGrocery ? <Loader2 className="w-3 h-3 animate-spin" /> : "Re-Generate"}
              </button>
            </div>

            {loadingGrocery ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Compiling grocery items...</span>
              </div>
            ) : groceryList ? (
              <div className="space-y-5">
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-white/5">
                  {groceryList.reasoning}
                </p>

                {groceryList.categories.map((category: any, catIndex: number) => (
                  <div key={catIndex} className="space-y-2">
                    <h4 className="font-outfit font-extrabold text-xs text-brand-green border-b border-white/5 pb-1 uppercase tracking-wider">
                      {category.name}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {category.items.map((item: string, itemIndex: number) => {
                        const itemKey = `${catIndex}-${itemIndex}`;
                        const isChecked = !!groceryCheckedItems[itemKey];
                        return (
                          <div 
                            key={itemIndex}
                            onClick={() => {
                              setGroceryCheckedItems(prev => ({
                                ...prev,
                                [itemKey]: !isChecked
                              }));
                            }}
                            className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                              isChecked 
                                ? "bg-brand-green/5 border-brand-green/20 text-slate-450 line-through" 
                                : "bg-slate-950/50 border border-white/5 hover:border-brand-green/20 text-slate-200"
                            }`}
                          >
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="accent-brand-green rounded"
                            />
                            <span className="text-xs font-semibold">{item}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="flex gap-2 pt-3 border-t border-white/5">
                  <button 
                    onClick={() => handleCopyText(getGroceryMarkdown())}
                    className="flex-1 bg-slate-900/60 border border-white/5 hover:bg-slate-800 text-slate-300 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Shopping List</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-6">Could not load grocery list.</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
