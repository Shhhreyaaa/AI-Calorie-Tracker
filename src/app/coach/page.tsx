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
import { useApp } from "@/lib/context/AppContext";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  reactions?: any[];
  created_at?: string;
}

export default function CoachPage() {
  const { profile } = useApp();
  const medicalConditions = profile?.medical_conditions || [];
  const hasMedical = medicalConditions.length > 0;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [messageQueue, setMessageQueue] = useState<string[]>([]);

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
          reactions: m.reactions || [],
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

  // Initial load - ONLY chat history
  useEffect(() => {
    fetchChatHistory();
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Send message handler
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = { role: "user", content: textToSend, reactions: [] };
    setInput("");

    if (loading || isStreaming) {
      // Append user message immediately and queue the API request
      setMessages(prev => [...prev, userMsg]);
      setMessageQueue(prev => [...prev, textToSend]);
    } else {
      // Append user message and run the stream directly
      setMessages(prev => {
        const updated = [...prev, userMsg];
        startChatStream(textToSend, updated);
        return updated;
      });
    }
  };

  const startChatStream = async (textToSend: string, currentHistory: Message[]) => {
    setLoading(true);
    setIsStreaming(true);

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const localMidnight = today.toISOString();

      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: textToSend }],
          localMidnight
        })
      });

      if (!response.ok) {
        throw new Error("Failed to connect to the AI Coach");
      }

      // Add a placeholder message for the assistant
      setMessages(prev => [...prev, { role: "assistant", content: "", reactions: [] }]);
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedText = "";
      let isFirstChunk = true;

      while (!done && reader) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          if (isFirstChunk) {
            setLoading(false);
            isFirstChunk = false;
          }
          const chunk = decoder.decode(value, { stream: !done });
          accumulatedText += chunk;
          
          setMessages(prev => {
            const updated = [...prev];
            if (updated.length > 0) {
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: accumulatedText
              };
            }
            return updated;
          });
        }
      }

      // Sync history to load final database-saved message (with ID)
      await fetchChatHistory();

      // Vocalize response if unmuted
      if (!isMuted && accumulatedText) {
        speakText(accumulatedText);
      }
    } catch (err) {
      console.error("Coach message dispatch error:", err);
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "Oops! I'm having trouble connecting to the servers right now. Please verify your connection and try again.",
          reactions: []
        }
      ]);
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  };

  // Queue runner
  useEffect(() => {
    if (!isStreaming && !loading && messageQueue.length > 0) {
      const nextMsg = messageQueue[0];
      setMessageQueue(prev => prev.slice(1));
      startChatStream(nextMsg, messages);
    }
  }, [isStreaming, loading, messageQueue, messages]);

  const handleSuggestClick = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to clear your chat history?")) return;
    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { error } = await supabase
        .from("coach_messages")
        .delete()
        .eq("user_id", user.id);
        
      if (error) throw error;
      setMessages([]);
    } catch (err) {
      console.error("Failed to clear messages:", err);
      alert("Error clearing history.");
    } finally {
      setLoading(false);
    }
  };

  // Toggling reactions and saving to Supabase
  const toggleReaction = async (msgId: string, emoji: string) => {
    if (!msgId) return;
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const msg = messages.find(m => m.id === msgId);
      if (!msg) return;

      const currentReactions: any[] = msg.reactions || [];
      const existingReactionIndex = currentReactions.findIndex(r => r.emoji === emoji && r.userId === user.id);
      
      let updatedReactions = [...currentReactions];
      if (existingReactionIndex > -1) {
        updatedReactions.splice(existingReactionIndex, 1);
      } else {
        updatedReactions.push({ emoji, userId: user.id });
      }

      // Optimistic UI Update
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reactions: updatedReactions } : m));

      // Save reaction array to coach_messages table
      const { error } = await supabase
        .from("coach_messages")
        .update({ reactions: updatedReactions })
        .eq("id", msgId);
      
      if (error) {
        console.error("Failed to update message reaction in Supabase:", error);
      }
    } catch (ex) {
      console.error("Reaction toggle exception:", ex);
    }
  };

  // Dynamic Suggestion Chips
  const getSuggestedFollowups = () => {
    if (messages.length === 0) {
      return [
        "What should I eat next?",
        "Why am I not losing weight?",
        "Analyze today's meals"
      ];
    }
    
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === "user") return []; // hide while thinking
    
    const contentLower = lastMsg.content.toLowerCase();
    if (contentLower.includes("protein")) {
      return [
        "How much protein do I still need?",
        "Show me high-protein snack ideas",
        "Can I eat too much protein?"
      ];
    }
    if (contentLower.includes("weight") || contentLower.includes("bmi") || contentLower.includes("calories")) {
      return [
        "Why am I not losing weight?",
        "How do I break a weight plateau?",
        "Create tomorrow's meal plan"
      ];
    }
    if (contentLower.includes("meal") || contentLower.includes("groceries") || contentLower.includes("grocery")) {
      return [
        "Create a grocery list",
        "Plan tomorrow's meals",
        "Give me a quick dinner idea"
      ];
    }
    return [
      "What should I eat next?",
      "Analyze today's meals",
      "Create tomorrow's meal plan"
    ];
  };

  // Visual AI Custom Cards Parsing and Rendering
  const renderCardPart = (partContent: string) => {
    let cardType = "";
    if (partContent.includes("```card-protein")) cardType = "protein";
    else if (partContent.includes("```card-weight")) cardType = "weight";
    else if (partContent.includes("```card-nutrition")) cardType = "nutrition";
    else if (partContent.includes("```card-forecast")) cardType = "forecast";
    
    if (!cardType) return null;
    
    const rawJson = partContent
      .replace(/```card-\w+/g, "")
      .replace(/```/g, "")
      .trim();
      
    try {
      const data = JSON.parse(rawJson);
      
      if (cardType === "protein") {
        const pct = Math.min(100, Math.round((data.current / data.target) * 100)) || 0;
        return (
          <div className="glass-panel p-5 rounded-2xl border-brand-green/20 bg-slate-950/40 my-3 space-y-4 text-left">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-white uppercase tracking-wider block">Protein Progress</span>
              <span className="text-[10px] font-bold text-brand-green bg-brand-green/10 border border-brand-green/20 px-2 py-0.5 rounded-lg">{pct}%</span>
            </div>
            
            <div className="flex justify-between items-end">
              <div className="font-outfit text-2xl font-black text-white">
                {data.current}g <span className="text-xs text-slate-400">/ {data.target}g</span>
              </div>
              <div className="text-[10px] text-brand-coral font-bold">
                Need: {data.need}g More
              </div>
            </div>
            
            <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-white/5">
              <div style={{ width: `${pct}%` }} className="h-full bg-brand-green shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
            </div>
            
            {data.sources && data.sources.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Suggested Sources</span>
                <div className="flex flex-wrap gap-1.5">
                  {data.sources.map((s: string, idx: number) => (
                    <span key={idx} className="bg-white/5 border border-white/10 text-[9px] font-bold px-2 py-0.5 rounded-md text-slate-200">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }
      
      if (cardType === "weight") {
        return (
          <div className="glass-panel p-5 rounded-2xl border-brand-sky/20 bg-slate-950/40 my-3 space-y-4 text-left">
            <span className="text-xs font-black text-white uppercase tracking-wider block">Weight Goal Status</span>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/4 border border-white/5 p-3 rounded-xl">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Current Weight</span>
                <span className="font-outfit text-lg font-black text-white mt-1 block">{data.current} kg</span>
              </div>
              <div className="bg-white/4 border border-white/5 p-3 rounded-xl">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Target Weight</span>
                <span className="font-outfit text-lg font-black text-brand-sky mt-1 block">{data.target} kg</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-350 pt-1">
              <div>Pace: <span className="text-white">{data.pace} kg/week</span></div>
              <div>Est. Time: <span className="text-brand-green">{data.weeks} Weeks</span></div>
            </div>
          </div>
        );
      }
      
      if (cardType === "nutrition") {
        const calPct = Math.min(100, Math.round((data.calories / data.caloriesTarget) * 100)) || 0;
        const remainingCals = Math.max(0, data.caloriesTarget - data.calories);
        return (
          <div className="glass-panel p-5 rounded-2xl border-white/10 bg-slate-950/40 my-3 space-y-4 text-left">
            <span className="text-xs font-black text-white uppercase tracking-wider block">Daily Nutrition Balance</span>
            
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-slate-200">Calories: {data.calories} / {data.caloriesTarget} kcal</span>
                <span className="text-brand-green">Remaining: {remainingCals} kcal</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden border border-white/5">
                <div style={{ width: `${calPct}%` }} className="h-full bg-brand-green shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2.5 pt-2 text-center text-xs">
              <div className="bg-white/4 border border-white/5 p-2 rounded-xl">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Protein</span>
                <span className="font-black text-white block mt-0.5">{data.protein} / {data.proteinTarget}g</span>
              </div>
              <div className="bg-white/4 border border-white/5 p-2 rounded-xl">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Carbs</span>
                <span className="font-black text-brand-sky block mt-0.5">{data.carbs} / {data.carbsTarget}g</span>
              </div>
              <div className="bg-white/4 border border-white/5 p-2 rounded-xl">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Fat</span>
                <span className="font-black text-brand-coral block mt-0.5">{data.fat} / {data.fatTarget}g</span>
              </div>
            </div>
          </div>
        );
      }
      
      if (cardType === "forecast") {
        return (
          <div className="glass-panel p-5 rounded-2xl border-brand-coral/20 bg-slate-950/40 my-3 space-y-4 text-left">
            <span className="text-xs font-black text-white uppercase tracking-wider block">Weight Progress Forecast</span>
            
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 border-b border-white/5 pb-2">
              <span>Current Trend</span>
              <span className={data.trend < 0 ? "text-brand-green" : "text-brand-coral"}>{data.trend} kg/week</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2.5 text-center text-xs font-bold pt-1">
              <div className="bg-white/4 border border-white/5 p-2.5 rounded-xl">
                <span className="text-[9px] text-slate-400 block uppercase tracking-wider">30 Days</span>
                <span className="text-white block mt-1 font-black">{data.days30} kg</span>
              </div>
              <div className="bg-white/4 border border-white/5 p-2.5 rounded-xl">
                <span className="text-[9px] text-slate-400 block uppercase tracking-wider">60 Days</span>
                <span className="text-white block mt-1 font-black">{data.days60} kg</span>
              </div>
              <div className="bg-white/4 border border-white/5 p-2.5 rounded-xl">
                <span className="text-[9px] text-slate-400 block uppercase tracking-wider">90 Days</span>
                <span className="text-white block mt-1 font-black">{data.days90} kg</span>
              </div>
            </div>
          </div>
        );
      }
    } catch (e) {
      // Stream skeletal loader
      return (
        <div className="glass-panel p-5 rounded-2xl border-white/5 bg-slate-950/40 my-3 animate-pulse space-y-3">
          <div className="h-4 w-28 bg-slate-800 rounded" />
          <div className="h-8 w-24 bg-slate-800 rounded" />
          <div className="h-2.5 w-full bg-slate-800 rounded" />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header Bar */}
      <div className="flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard" 
            className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-slate-550 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">AI Companion</span>
            <h2 className="font-outfit text-2xl font-bold tracking-tight text-white">Nutrition Coach</h2>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={fetchChatHistory}
            disabled={loading}
            className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>
          
          <button 
            onClick={handleClearHistory}
            disabled={loading}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* Top Action Chips (Phase 3) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button 
          onClick={() => handleSendMessage("Analyze my day")}
          disabled={loading || isStreaming}
          className="flex items-center justify-center gap-2 bg-gradient-to-br from-slate-900/40 via-slate-950/20 to-emerald-950/15 hover:from-slate-900/60 hover:to-emerald-950/30 text-white rounded-2xl py-3 px-3 text-xs font-bold border border-emerald-500/20 hover:border-brand-green/40 shadow-premium active:scale-[0.98] transition-all cursor-pointer text-center"
        >
          <Activity className="w-4 h-4 text-brand-green shrink-0" />
          <span>Analyze My Day</span>
        </button>

        <button 
          onClick={() => handleSendMessage("Analyze my body")}
          disabled={loading || isStreaming}
          className="flex items-center justify-center gap-2 bg-gradient-to-br from-slate-900/40 via-slate-950/20 to-sky-950/15 hover:from-slate-900/60 hover:to-sky-950/30 text-white rounded-2xl py-3 px-3 text-xs font-bold border border-sky-500/20 hover:border-brand-sky/40 shadow-premium active:scale-[0.98] transition-all cursor-pointer text-center"
        >
          <Dumbbell className="w-4 h-4 text-brand-sky shrink-0" />
          <span>Analyze My Body</span>
        </button>
        
        <button 
          onClick={() => handleSendMessage("Create tomorrow's meal plan")}
          disabled={loading || isStreaming}
          className="flex items-center justify-center gap-2 bg-gradient-to-br from-slate-900/40 via-slate-950/20 to-purple-950/15 hover:from-slate-900/60 hover:to-purple-950/30 text-white rounded-2xl py-3 px-3 text-xs font-bold border border-purple-500/20 hover:border-purple-400/40 shadow-premium active:scale-[0.98] transition-all cursor-pointer text-center"
        >
          <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
          <span>Plan Tomorrow</span>
        </button>
        
        <button 
          onClick={() => handleSendMessage("Create a grocery list")}
          disabled={loading || isStreaming}
          className="flex items-center justify-center gap-2 bg-gradient-to-br from-slate-900/40 via-slate-950/20 to-amber-950/15 hover:from-slate-900/60 hover:to-amber-950/30 text-white rounded-2xl py-3 px-3 text-xs font-bold border border-amber-500/20 hover:border-amber-450/40 shadow-premium active:scale-[0.98] transition-all cursor-pointer text-center"
        >
          <ShoppingCart className="w-4 h-4 text-amber-455 shrink-0" />
          <span>Grocery List</span>
        </button>
      </div>

      {/* Large AI Chat Interface */}
      <div className="glass-panel border-white/5 bg-slate-950/10 rounded-[32px] flex flex-col h-[550px] sm:h-[600px] shadow-premium-dark overflow-hidden">
        
        {/* Chat Panel Subheader */}
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-brand-green" />
            <span className="text-[10px] text-slate-350 font-bold uppercase tracking-wider">AI Nutritionist Response</span>
          </div>
          
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
        </div>

        {/* Messages List Area */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/5 ${messages.length === 0 ? "flex flex-col items-center justify-center" : ""}`}>
          {messages.length === 0 ? (
            <div className="text-center py-10 flex flex-col items-center justify-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center shadow-premium">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <h4 className="font-outfit text-xs font-bold text-slate-200">
                Talk to your Nutrition AI Coach
              </h4>
              <p className="text-[10px] text-slate-450 max-w-[240px] leading-relaxed">
                Click one of the premium action chips above or ask any custom question about protein, hydration, caloric deficits, or workouts.
              </p>
            </div>
          ) : (
            messages.map((m, i) => {
              const isAssistant = m.role === "assistant";
              if (isAssistant && !m.content) return null;
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

                  {/* Message Bubble container */}
                  <div className="flex flex-col gap-1 min-w-0">
                    <div 
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isAssistant 
                          ? "glass-panel text-slate-100 rounded-tl-sm border-brand-green/15" 
                          : "bg-brand-sky/15 border border-brand-sky/30 text-white rounded-tr-sm"
                      }`}
                    >
                      {isAssistant ? (
                        (() => {
                          // Match card tags, allowing incomplete block for streaming
                          const parts = m.content.split(/(```card-\w+[\s\S]*?(?:```|$))/g);
                          return parts.map((part, index) => {
                            if (part.startsWith("```card-")) {
                              return <React.Fragment key={index}>{renderCardPart(part)}</React.Fragment>;
                            } else {
                              const cleanText = part.replace(/```/g, "").trim();
                              if (!cleanText) return null;
                              return cleanText.split("\n").map((paragraph, pIdx) => (
                                <p key={`${index}-${pIdx}`} className={pIdx > 0 ? "mt-2" : ""}>
                                  {paragraph}
                                </p>
                              ));
                            }
                          });
                        })()
                      ) : (
                        m.content.split("\n").map((paragraph, index) => (
                          <p key={index} className={index > 0 ? "mt-2" : ""}>
                            {paragraph}
                          </p>
                        ))
                      )}
                    </div>
                    {isAssistant && m.id && (
                      <div className="flex items-center gap-2 mt-1 self-start">
                        {/* Reaction Bar (Phase 7) */}
                        <div className="flex gap-1 bg-white/4 border border-white/5 px-2 py-0.5 rounded-lg shadow-sm">
                          {["👍", "👎", "❤️", "🔥", "🧘"].map(emoji => {
                            const supabase = createClient();
                            const authUser = supabase.auth.getUser(); // dummy load fallback
                            const reactions = m.reactions || [];
                            const count = reactions.filter((r: any) => r.emoji === emoji).length;
                            const hasReacted = reactions.some((r: any) => r.emoji === emoji && r.userId === profile?.id);
                            return (
                              <button
                                key={emoji}
                                onClick={() => toggleReaction(m.id!, emoji)}
                                className={`text-[10px] px-1 hover:scale-125 transition-transform flex items-center gap-0.5 cursor-pointer ${
                                  hasReacted ? "filter drop-shadow-[0_0_2px_rgba(0,255,136,0.6)]" : "opacity-60 hover:opacity-100"
                                }`}
                              >
                                <span>{emoji}</span>
                                {count > 0 && <span className="font-extrabold text-[9px]">{count}</span>}
                              </button>
                            );
                          })}
                        </div>
                        <button 
                          onClick={() => handleCopyText(m.content)}
                          className="flex items-center gap-1 text-[10px] text-slate-450 hover:text-slate-300 transition-colors bg-transparent border-0 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </button>
                      </div>
                    )}
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

          {/* Queue indicator */}
          {messageQueue.length > 0 && (
            <div className="flex gap-3 max-w-[80%] mr-auto animate-pulse">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-3 rounded-2xl rounded-tl-sm text-xs font-semibold text-amber-500">
                Queued (Est. wait time: ~{messageQueue.length * 4}s)
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Dynamic Suggested follow-ups (Phase 7) */}
        {!loading && (
          <div className="p-3 border-t border-white/5 flex flex-wrap gap-2 justify-center bg-slate-950/20">
            {getSuggestedFollowups().map((prompt, idx) => (
              <button 
                key={idx}
                onClick={() => handleSuggestClick(prompt)}
                className="bg-slate-900/60 border border-white/5 hover:border-brand-green/25 text-xs font-semibold px-3 py-1.5 rounded-full text-slate-350 hover:text-white transition-colors shadow-sm shrink-0 cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Health Aware Disclaimer overlay at bottom (Phase 6) */}
        {hasMedical && (
          <div className="px-4 py-2 bg-purple-950/15 border-t border-purple-500/10 text-[9px] text-slate-450 flex items-center justify-center gap-1.5 leading-relaxed text-center">
            <AlertCircle className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>Educational guidance only. Not medical advice. Consult a healthcare professional for diagnosis or treatment.</span>
          </div>
        )}

        {/* Chat Input form */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(input);
          }}
          className="p-3 border-t border-white/5 bg-slate-950/40 rounded-b-[32px] flex gap-2 shrink-0"
        >
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
            className="bg-brand-green hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 text-white px-4 rounded-xl active:scale-95 transition-all shadow-glow flex items-center justify-center font-bold text-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 mr-1" /> Send
          </button>
        </form>
      </div>

    </div>
  );
}
