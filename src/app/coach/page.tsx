"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Send, 
  User, 
  Bot, 
  ArrowLeft,
  Loader2,
  Calendar,
  Flame,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am your AI Nutrition Coach. 🥗 I have access to your daily goals, recent meal logs, and streak status. Ask me anything about your diet, macro targets, or what you should eat next!"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    calories: 0,
    target: 2000,
    protein: 0,
    targetProtein: 150,
    streak: 0
  });

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch real-time user context to show in a premium header card
  const fetchUserContext = async () => {
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
        target: goalData?.calories || 2000,
        protein: sumProtein,
        targetProtein: goalData?.protein || 150,
        streak: streakData?.current_streak || 0
      });

    } catch (err) {
      console.error("CoachPage failed to load user context:", err);
    }
  };

  useEffect(() => {
    fetchUserContext();
  }, []);

  // Auto-scroll chat to bottom when messages list changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = { role: "user", content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        })
      });

      const data = await response.json();
      if (response.ok && data.reply) {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
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
      console.error("Coach communication error:", err);
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

  const remainingCals = Math.max(stats.target - stats.calories, 0);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] space-y-4">
      
      {/* 1. Header Bar */}
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

        {/* Coach online status indicator */}
        <div className="flex items-center gap-2 bg-emerald-500/10 dark:bg-emerald-500/20 px-3 py-1.5 rounded-xl text-[10px] font-bold text-brand-green uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-brand-green animate-ping" />
          <span>Coach Online</span>
        </div>
      </div>

      {/* 2. Premium Real-Time Context Banner */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-100 dark:border-slate-800/80 rounded-2xl p-3.5 shadow-premium dark:shadow-premium-dark shrink-0 grid grid-cols-3 gap-2.5 text-center text-xs">
        <div>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Today Energy</span>
          <span className="font-outfit font-extrabold text-slate-800 dark:text-slate-200 block mt-0.5">
            {stats.calories} / {stats.target} <span className="text-[9px] text-slate-400 font-normal">kcal</span>
          </span>
        </div>
        <div className="border-x border-slate-100 dark:border-slate-850">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Remaining</span>
          <span className={`font-outfit font-extrabold block mt-0.5 ${remainingCals > 0 ? "text-brand-green" : "text-brand-coral"}`}>
            {remainingCals} <span className="text-[9px] text-slate-400 font-normal">kcal</span>
          </span>
        </div>
        <div>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Active Streak</span>
          <span className="font-outfit font-extrabold text-brand-coral flex items-center justify-center gap-1 mt-0.5">
            <Flame className="w-3.5 h-3.5 fill-current" /> {stats.streak} Days
          </span>
        </div>
      </div>

      {/* 3. Conversations Screen / Message Timeline */}
      <div className="flex-1 overflow-y-auto bg-slate-100/30 dark:bg-slate-900/20 border border-slate-100/60 dark:border-slate-800/40 rounded-[28px] p-4 space-y-4">
        {messages.map((m, i) => {
          const isAssistant = m.role === "assistant";
          return (
            <div 
              key={i} 
              className={`flex gap-3 max-w-[85%] ${isAssistant ? "mr-auto" : "ml-auto flex-row-reverse"}`}
            >
              {/* Avatar indicator */}
              <div 
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                  isAssistant 
                    ? "bg-brand-green/10 text-brand-green border border-brand-green/20" 
                    : "bg-slate-800 text-white"
                }`}
              >
                {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div 
                className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  isAssistant 
                    ? "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 text-slate-800 dark:text-slate-200 rounded-tl-sm shadow-premium dark:shadow-premium-dark" 
                    : "bg-brand-green text-white font-medium rounded-tr-sm shadow-glow"
                }`}
              >
                {m.content.split("\n").map((paragraph, index) => (
                  <p key={index} className={index > 0 ? "mt-2" : ""}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          );
        })}

        {/* Typing Loader Indicator */}
        {loading && (
          <div className="flex gap-3 max-w-[80%] mr-auto">
            <div className="w-8 h-8 rounded-xl bg-brand-green/10 text-brand-green border border-brand-green/20 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-3.5 rounded-2xl rounded-tl-sm flex items-center justify-center gap-1.5 shadow-premium">
              <div className="w-2 h-2 bg-brand-green rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-brand-green rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-brand-green rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* 4. Suggestion Prompts Helper Chips */}
      {messages.length === 1 && !loading && (
        <div className="space-y-1.5 shrink-0 px-1">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Ask your Coach</span>
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => handleSuggestClick("How can I hit my protein goal today?")}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 text-left text-xs font-semibold px-4 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 transition-colors shadow-sm w-full truncate"
            >
              💡 How can I hit my protein goal today?
            </button>
            <button 
              onClick={() => handleSuggestClick("Am I eating enough calories and nutrients?")}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 text-left text-xs font-semibold px-4 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 transition-colors shadow-sm w-full truncate"
            >
              🥗 Am I eating enough calories and nutrients?
            </button>
            <button 
              onClick={() => handleSuggestClick("Suggest a healthy dinner based on my remaining macros today.")}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 text-left text-xs font-semibold px-4 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 transition-colors shadow-sm w-full truncate"
            >
              🍽️ Suggest a healthy dinner based on my macros.
            </button>
          </div>
        </div>
      )}

      {/* 5. Message Input Bar */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(input);
        }}
        className="flex gap-2 shrink-0 bg-white/80 dark:bg-slate-905/80 backdrop-blur-md p-1.5 border border-slate-105/60 dark:border-slate-800/60 rounded-2xl shadow-premium"
      >
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about protein, meals, macros..."
          disabled={loading}
          className="flex-1 bg-transparent px-3 py-2 text-xs outline-none dark:text-white placeholder:text-slate-400"
        />
        <button 
          type="submit"
          disabled={!input.trim() || loading}
          className="bg-brand-green hover:bg-emerald-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white p-2.5 rounded-xl active:scale-95 transition-all shadow-glow flex items-center justify-center"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

    </div>
  );
}
