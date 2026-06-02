"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { 
  Sparkles, 
  Send, 
  X, 
  Bot, 
  User, 
  Loader2, 
  Brain, 
  Zap, 
  Activity, 
  Scale 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function FloatingAICoach() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello Athlete! 👋 I am your AI Health Companion. Ask me anything about your nutrition, log analysis, or fitness targets today."
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll chat list to bottom when open or when new message is added
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [isOpen, messages, loading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", content: text };
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
        // Simulate a typewriter streaming effect for premium feel
        simulateResponseStreaming(data.reply);
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: `I'm sorry, I hit a snag: ${data.error || "Could not retrieve recommendation."}`
          }
        ]);
        setLoading(false);
      }
    } catch (err) {
      console.error("Floating coach query failed:", err);
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "Connection issues. Please check your network and try again."
        }
      ]);
      setLoading(false);
    }
  };

  const simulateResponseStreaming = (fullText: string) => {
    let currentText = "";
    const words = fullText.split(" ");
    let i = 0;
    
    // Add empty message to be updated
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);
    setLoading(false);

    const interval = setInterval(() => {
      if (i < words.length) {
        currentText += (i === 0 ? "" : " ") + words[i];
        setMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: currentText };
          return next;
        });
        i++;
      } else {
        clearInterval(interval);
      }
    }, 45); // Speed multiplier for smooth visual streaming
  };

  const handleQuickAction = (actionKey: string) => {
    let prompt = "";
    switch (actionKey) {
      case "analyze":
        prompt = "How was my diet today? Analyze my macro logs.";
        break;
      case "plan":
        prompt = "Create a customized meal plan for tomorrow based on my goals.";
        break;
      case "protein":
        prompt = "Suggest high-protein snacks or foods to boost my protein today.";
        break;
      case "forecast":
        prompt = "Predict my weight progress and transformation forecast.";
        break;
      default:
        return;
    }
    handleSendMessage(prompt);
  };

  const hideRoutes = ["/login", "/signup", "/onboarding"];
  if (hideRoutes.includes(pathname)) {
    return null;
  }

  return (
    <div className="fixed z-[999] right-6 bottom-[108px] flex flex-col items-end">
      {/* Expandable Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 280, damping: 25 }}
            className="w-[350px] sm:w-[380px] h-[520px] max-h-[70vh] rounded-[28px] bg-[#050816]/95 border border-white/8 backdrop-blur-[24px] shadow-2xl flex flex-col mb-4 overflow-hidden"
            style={{
              boxShadow: "0 10px 50px rgba(139,92,246,0.15), 0 0 30px rgba(0,0,0,0.6)"
            }}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-gradient-to-r from-purple-950/20 via-indigo-950/20 to-slate-950/20 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-550/30 flex items-center justify-center text-purple-400">
                    <Bot className="w-4.5 h-4.5" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-[#050816]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-tight">Fitness AI Coach</h4>
                  <span className="text-[9px] text-purple-400 font-bold uppercase tracking-widest">Active Assistant</span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Message Pane */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/10 scrollbar-thin">
              {messages.map((m, i) => {
                const isAssistant = m.role === "assistant";
                return (
                  <div 
                    key={i} 
                    className={`flex gap-2.5 max-w-[85%] ${isAssistant ? "mr-auto" : "ml-auto flex-row-reverse"}`}
                  >
                    <div 
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[10px] ${
                        isAssistant 
                          ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" 
                          : "bg-cyan-500/15 border border-cyan-500/30 text-cyan-400"
                      }`}
                    >
                      {isAssistant ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                    </div>
                    <div 
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        isAssistant 
                          ? "bg-white/5 border border-white/6 text-slate-100 rounded-tl-none" 
                          : "bg-cyan-500/10 border border-cyan-500/20 text-white rounded-tr-none"
                      }`}
                    >
                      {m.content ? (
                        m.content.split("\n").map((p, idx) => (
                          <p key={idx} className={idx > 0 ? "mt-1.5" : ""}>{p}</p>
                        ))
                      ) : (
                        <div className="flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                          <span className="text-[10px] text-slate-405">Synthesizing...</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Loader */}
              {loading && (
                <div className="flex gap-2.5 max-w-[80%] mr-auto animate-pulse">
                  <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-white/5 border border-white/6 px-3 py-2.5 rounded-2xl rounded-tl-none flex items-center justify-center gap-1">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Actions Panel */}
            <div className="px-4 py-2 border-t border-white/5 bg-slate-950/20 flex overflow-x-auto gap-2 scrollbar-none shrink-0">
              <button 
                onClick={() => handleQuickAction("analyze")}
                className="bg-purple-500/10 border border-purple-500/20 hover:border-purple-400/50 text-[10px] font-bold text-purple-300 px-3 py-1.5 rounded-full shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Brain className="w-3 h-3 text-purple-400" />
                <span>Analyze Day</span>
              </button>
              <button 
                onClick={() => handleQuickAction("plan")}
                className="bg-cyan-500/10 border border-cyan-500/20 hover:border-cyan-400/50 text-[10px] font-bold text-cyan-300 px-3 py-1.5 rounded-full shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Zap className="w-3 h-3 text-cyan-400" />
                <span>Meal Plan</span>
              </button>
              <button 
                onClick={() => handleQuickAction("protein")}
                className="bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-450/50 text-[10px] font-bold text-emerald-300 px-3 py-1.5 rounded-full shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Activity className="w-3 h-3 text-emerald-400" />
                <span>Protein Boost</span>
              </button>
              <button 
                onClick={() => handleQuickAction("forecast")}
                className="bg-pink-500/10 border border-pink-500/20 hover:border-pink-400/50 text-[10px] font-bold text-pink-300 px-3 py-1.5 rounded-full shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Scale className="w-3 h-3 text-pink-405" />
                <span>Forecast</span>
              </button>
            </div>

            {/* Input Bar */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(input);
              }}
              className="p-3 border-t border-white/5 bg-slate-950/40 flex gap-2 shrink-0"
            >
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about protein, meals, targets..."
                disabled={loading}
                className="flex-1 bg-slate-900/60 border border-white/6 rounded-xl px-3 py-2 text-xs outline-none text-white placeholder-slate-500 focus:border-purple-550"
              />
              <button 
                type="submit"
                disabled={!input.trim() || loading}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-650 hover:to-indigo-700 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white p-2 rounded-xl active:scale-95 transition-all shadow-glow flex items-center justify-center cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Orb FAB */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="w-12 h-12 rounded-full border border-purple-500/20 bg-gradient-to-tr from-purple-600/90 to-indigo-600/90 text-white flex items-center justify-center shadow-lg cursor-pointer animate-orb-glow relative"
        title="Open AI Health Coach"
      >
        <Sparkles className="w-5 h-5 text-white" />
        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-cyan-400 rounded-full animate-ping pointer-events-none" />
      </motion.button>
    </div>
  );
}
