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

  // Initial load - ONLY chat history to optimize performance and prevent API load
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

    const userMsg: Message = { role: "user", content: textToSend };
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
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);
      
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
          content: "Oops! I'm having trouble connecting to the servers right now. Please verify your connection and try again."
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

      {/* Top Action Chips */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <button 
          onClick={() => handleSendMessage("Analyze my day")}
          disabled={loading || isStreaming}
          className="flex flex-col sm:flex-row items-center justify-center gap-1.5 bg-gradient-to-br from-slate-900/40 via-slate-950/20 to-emerald-950/15 hover:from-slate-900/60 hover:to-emerald-950/30 text-white rounded-2xl py-3 px-2 text-xs font-bold border border-emerald-500/20 hover:border-brand-green/40 shadow-premium active:scale-[0.98] transition-all cursor-pointer text-center"
        >
          <Activity className="w-4 h-4 text-brand-green shrink-0" />
          <span className="truncate">Analyze My Day</span>
        </button>
        
        <button 
          onClick={() => handleSendMessage("Create a customized meal plan for tomorrow")}
          disabled={loading || isStreaming}
          className="flex flex-col sm:flex-row items-center justify-center gap-1.5 bg-gradient-to-br from-slate-900/40 via-slate-950/20 to-sky-950/15 hover:from-slate-900/60 hover:to-sky-950/30 text-white rounded-2xl py-3 px-2 text-xs font-bold border border-sky-500/20 hover:border-brand-sky/40 shadow-premium active:scale-[0.98] transition-all cursor-pointer text-center"
        >
          <Calendar className="w-4 h-4 text-brand-sky shrink-0" />
          <span className="truncate">Plan Tomorrow</span>
        </button>
        
        <button 
          onClick={() => handleSendMessage("Create a grocery list for me based on my targets")}
          disabled={loading || isStreaming}
          className="flex flex-col sm:flex-row items-center justify-center gap-1.5 bg-gradient-to-br from-slate-900/40 via-slate-950/20 to-purple-950/15 hover:from-slate-900/60 hover:to-purple-950/30 text-white rounded-2xl py-3 px-2 text-xs font-bold border border-purple-500/20 hover:border-purple-400/40 shadow-premium active:scale-[0.98] transition-all cursor-pointer text-center"
        >
          <ShoppingCart className="w-4 h-4 text-purple-400 shrink-0" />
          <span className="truncate">Grocery List</span>
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
                      {m.content.split("\n").map((paragraph, index) => (
                        <p key={index} className={index > 0 ? "mt-2" : ""}>
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    {isAssistant && m.content && (
                      <button 
                        onClick={() => handleCopyText(m.content)}
                        className="self-start mt-1 flex items-center gap-1 text-[10px] text-slate-450 hover:text-slate-300 transition-colors bg-transparent border-0 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy Response</span>
                      </button>
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

        {/* Suggestion Chips */}
        {messages.length <= 1 && !loading && (
          <div className="p-3 border-t border-white/5 flex flex-wrap gap-2 justify-center bg-slate-950/20">
            <button 
              onClick={() => handleSuggestClick("What should I eat tonight based on my remaining macros?")}
              className="bg-slate-900/60 border border-white/5 hover:border-brand-green/25 text-xs font-semibold px-3 py-1.5 rounded-full text-slate-350 transition-colors shadow-sm shrink-0 cursor-pointer"
            >
              🍽️ What should I eat tonight?
            </button>
            <button 
              onClick={() => handleSuggestClick("Give me a protein-focused muscle gain meal plan.")}
              className="bg-slate-900/60 border border-white/5 hover:border-brand-green/25 text-xs font-semibold px-3 py-1.5 rounded-full text-slate-350 transition-colors shadow-sm shrink-0 cursor-pointer"
            >
              💪 Muscle gain meal plan
            </button>
            <button 
              onClick={() => handleSuggestClick("Am I eating too many carbs today?")}
              className="bg-slate-900/60 border border-white/5 hover:border-brand-green/25 text-xs font-semibold px-3 py-1.5 rounded-full text-slate-350 transition-colors shadow-sm shrink-0 cursor-pointer"
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
          className="p-3 border-t border-white/5 bg-slate-950/40 rounded-b-[32px] flex gap-2 shrink-0"
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
            className="bg-brand-green hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 text-white px-4 rounded-xl active:scale-95 transition-all shadow-glow flex items-center justify-center font-bold text-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 mr-1" /> Send
          </button>
        </form>
      </div>

    </div>
  );
}
