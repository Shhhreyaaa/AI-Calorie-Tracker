"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Scale, 
  ArrowLeft, 
  Sparkles, 
  TrendingDown, 
  TrendingUp, 
  Award, 
  Flame, 
  Calendar, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Loader2, 
  ChevronRight,
  TrendingUp as TrendUpIcon,
  CheckCircle
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { getAndUpdateActiveStreak } from "@/app/meals/actions";

export default function TransformationCenter() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [goals, setGoals] = useState<any>(null);
  const [streakInfo, setStreakInfo] = useState<any>(null);
  const [weightLogs, setWeightLogs] = useState<any[]>([]);

  // Input states
  const [newWeight, setNewWeight] = useState("");
  const [loggingWeight, setLoggingWeight] = useState(false);

  const fetchTransformationData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      // Fetch goals, streaks, and weight logs in parallel
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const [goalRes, streakData, weightRes] = await Promise.all([
        supabase.from("goals").select("*").eq("id", user.id).maybeSingle(),
        getAndUpdateActiveStreak(tz).catch(err => {
          console.error("Streak calculation error:", err);
          return null;
        }),
        supabase.from("weight_logs").select("id, weight, created_at").eq("user_id", user.id).order("created_at", { ascending: true })
      ]);

      setGoals(goalRes.data);
      setStreakInfo(streakData);
      setWeightLogs(weightRes.data || []);

    } catch (err) {
      console.error("Failed to load transformation data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransformationData();
  }, []);

  const handleLogWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight || isNaN(Number(newWeight))) {
      alert("Please enter a valid number for weight.");
      return;
    }

    try {
      setLoggingWeight(true);
      const supabase = createClient();
      const { error } = await supabase.from("weight_logs").insert({
        user_id: user.id,
        weight: Number(newWeight),
        created_at: new Date().toISOString()
      });

      if (error) throw error;
      setNewWeight("");
      await fetchTransformationData();
    } catch (err: any) {
      alert(err.message || "Failed to save weight entry.");
    } finally {
      setLoggingWeight(false);
    }
  };

  const handleDeleteWeight = async (id: string) => {
    if (!confirm("Are you sure you want to delete this weight log?")) return;
    try {
      const supabase = createClient();
      const { error } = await supabase.from("weight_logs").delete().eq("id", id);
      if (error) throw error;
      await fetchTransformationData();
    } catch (err: any) {
      alert(err.message || "Failed to delete weight log.");
    }
  };

  // Helper calculations
  const metadata = user?.user_metadata || {};
  const goalType = metadata.goal || "Lose Fat";
  const startingWeight = Number(metadata.starting_weight) || (weightLogs.length > 0 ? Number(weightLogs[0].weight) : 75);
  const targetWeight = Number(metadata.target_weight) || 70;
  const currentWeight = weightLogs.length > 0 ? Number(weightLogs[weightLogs.length - 1].weight) : startingWeight;

  const totalChange = currentWeight - startingWeight;
  const targetChange = targetWeight - startingWeight;
  const progressToTarget = targetChange !== 0 ? Math.min(Math.max((totalChange / targetChange) * 100, 0), 100) : 0;

  // Project weight change rate (assume 0.5 kg change per week safely)
  const isLoss = targetWeight < startingWeight;
  const remainingWeight = Math.abs(currentWeight - targetWeight);
  const weeksToTarget = remainingWeight / 0.5;
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + Math.round(weeksToTarget * 7));

  // Milestones calculation
  const milestones = [
    {
      title: "First Steps",
      desc: "Log your starting biometrics and weight log.",
      unlocked: weightLogs.length >= 1,
      icon: "⚖️"
    },
    {
      title: "Consistent Builder",
      desc: "Record at least 3 separate weight logs.",
      unlocked: weightLogs.length >= 3,
      icon: "📈"
    },
    {
      title: "Progress Milestone",
      desc: `Achieved 1kg of weight ${isLoss ? "loss" : "gain"}.`,
      unlocked: isLoss ? totalChange <= -1 : totalChange >= 1,
      icon: "🎉"
    },
    {
      title: "Hyper-Focus",
      desc: "Maintain a tracking streak of 3 days.",
      unlocked: (streakInfo?.current_streak || 0) >= 3,
      icon: "🔥"
    },
    {
      title: "Ultimate Goal",
      desc: `Reach your final target weight of ${targetWeight} kg.`,
      unlocked: isLoss ? currentWeight <= targetWeight : currentWeight >= targetWeight,
      icon: "🏆"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
        <span className="text-xs text-slate-400 font-semibold">Loading body metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard" 
            className="bg-slate-900 border border-white/10 p-2 rounded-xl text-slate-350 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Portfolio Showcase</span>
            <h2 className="font-outfit text-2xl font-bold tracking-tight text-white">Body Transformation Center</h2>
          </div>
        </div>
      </div>

      {/* Goal Summary Header Card */}
      <div className="glass-panel border-brand-green/20 bg-gradient-to-br from-slate-900/40 via-slate-950/20 to-emerald-950/15 rounded-[32px] p-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="space-y-4 flex-1">
          <div>
            <span className="bg-brand-green/10 text-brand-green text-[9px] font-bold px-2.5 py-0.5 rounded-lg border border-brand-green/20 uppercase tracking-widest inline-block">
              {goalType} Target Active
            </span>
            <h3 className="font-outfit text-xl font-bold text-white mt-2">
              Goal: {targetWeight} kg
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-lg leading-relaxed">
              Tracking starting weight of <strong className="text-white">{startingWeight} kg</strong> against current weight of <strong className="text-white">{currentWeight} kg</strong>. 
              {totalChange !== 0 ? (
                <span> You have successfully changed <strong className="text-brand-green">{Math.abs(totalChange).toFixed(1)} kg</strong> so far!</span>
              ) : (
                <span> Log your weight daily to monitor calorie adjustments.</span>
              )}
            </p>
          </div>

          {/* Goal progress meter */}
          <div className="space-y-1.5 max-w-sm">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
              <span>Goal Progress</span>
              <span>{Math.round(progressToTarget)}%</span>
            </div>
            <div className="w-full bg-slate-950/60 border border-white/5 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-brand-green to-brand-sky h-full rounded-full transition-all duration-500" 
                style={{ width: `${progressToTarget}%` }}
              />
            </div>
          </div>
        </div>

        {/* Target Date Pill */}
        <div className="shrink-0 bg-slate-950/60 border border-white/5 p-4 rounded-2xl text-center min-w-[140px]">
          <span className="text-[9px] text-slate-405 font-bold uppercase tracking-wider block mb-1">Target Date Forecast</span>
          <div className="font-outfit text-base font-extrabold text-white flex justify-center items-center gap-1.5">
            <Calendar className="w-4 h-4 text-brand-green" />
            <span>
              {targetDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
          <span className="text-[9px] text-slate-450 block mt-1">At healthy 0.5 kg/week change rate</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Starting Weight */}
        <div className="glass-panel rounded-2xl p-4.5 text-center">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Starting Weight</span>
          <span className="font-outfit text-xl font-bold mt-1 text-white block">{startingWeight} kg</span>
          <span className="text-[9px] text-slate-500 block mt-0.5">Biometrics recorded</span>
        </div>

        {/* Current Weight */}
        <div className="glass-panel rounded-2xl p-4.5 text-center border-brand-green/15">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Current Weight</span>
          <span className="font-outfit text-xl font-bold mt-1 text-white block">{currentWeight} kg</span>
          <span className="text-[9px] text-slate-500 block mt-0.5">Last log entry</span>
        </div>

        {/* Target Weight */}
        <div className="glass-panel rounded-2xl p-4.5 text-center">
          <span className="text-[9px] text-slate-405 font-bold uppercase tracking-wider block">Target weight</span>
          <span className="font-outfit text-xl font-bold mt-1 text-white block">{targetWeight} kg</span>
          <span className="text-[9px] text-slate-500 block mt-0.5">MSJ Goal Target</span>
        </div>

      </div>

      {/* Weight Trend Chart */}
      <div className="glass-panel rounded-[32px] p-5 space-y-4">
        <h3 className="font-outfit text-sm font-bold flex items-center gap-1.5 text-white">
          <TrendUpIcon className="w-4.5 h-4.5 text-brand-sky" /> Weight Progression Trend
        </h3>

        <div className="h-64 w-full text-[10px] font-semibold">
          {weightLogs.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightLogs.map(w => ({
                date: new Date(w.created_at).toLocaleDateString([], { month: "short", day: "numeric" }),
                weight: Number(w.weight)
              }))} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.05)" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} domain={["dataMin - 1", "dataMax + 1"]} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#0F172A', color: '#FFF' }} />
                <Line type="monotone" dataKey="weight" stroke="#0ea5e9" strokeWidth={2.5} dot={{ fill: "#0ea5e9", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center border border-dashed border-white/5 rounded-2xl text-slate-400 italic text-xs">
              Log at least 2 weights to plot your transformation curve
            </div>
          )}
        </div>

        {/* Quick Log Inline Form */}
        <form onSubmit={handleLogWeightSubmit} className="flex gap-2">
          <input 
            type="number"
            step="0.1"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            placeholder="Log today's weight (e.g. 74.8 kg)"
            required
            className="flex-1 glass-input rounded-xl px-4 py-2.5 text-xs outline-none text-white focus:border-brand-sky placeholder-slate-500"
          />
          <button 
            type="submit"
            disabled={loggingWeight}
            className="bg-brand-sky hover:bg-sky-600 disabled:bg-slate-800 text-white font-bold px-5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-glow"
          >
            {loggingWeight ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>Log Weight</span>
          </button>
        </form>
      </div>

      {/* Grid: Milestones vs Historical weight logs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Milestones Panel */}
        <div className="glass-panel rounded-[32px] p-6 space-y-4">
          <h3 className="font-outfit text-sm font-bold flex items-center gap-1.5 text-white">
            <Award className="w-4.5 h-4.5 text-brand-green" /> Transformation Milestones
          </h3>
          
          <div className="space-y-3">
            {milestones.map((mil, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-2xl border flex items-center gap-3.5 transition-all duration-300 ${
                  mil.unlocked 
                    ? "bg-slate-950/40 border-white/10" 
                    : "bg-slate-950/10 border-white/5 opacity-40"
                }`}
              >
                <div className="text-xl shrink-0">{mil.icon}</div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-205 flex items-center gap-1">
                    {mil.title}
                    {mil.unlocked && <CheckCircle className="w-3.5 h-3.5 text-brand-green fill-brand-green/10" />}
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-snug mt-0.5">{mil.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Historical Logs List */}
        <div className="glass-panel rounded-[32px] p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-outfit text-sm font-bold flex items-center gap-1.5 text-white">
              <Scale className="w-4.5 h-4.5 text-brand-sky" /> Logging History
            </h3>
            
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {weightLogs.length === 0 ? (
                <p className="text-xs text-slate-405 italic py-6 text-center">No weight entries recorded yet.</p>
              ) : (
                weightLogs.slice().reverse().map((w) => (
                  <div key={w.id} className="flex justify-between items-center text-xs bg-slate-950/50 p-2.5 rounded-xl border border-white/5 hover:border-brand-sky/20 transition-colors">
                    <span className="text-slate-400 font-semibold">{new Date(w.created_at).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-outfit font-extrabold text-white">{w.weight} kg</span>
                      <button 
                        onClick={() => handleDeleteWeight(w.id)}
                        className="text-rose-500 hover:text-rose-600 cursor-pointer text-[10px]"
                        title="Delete log entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="text-[9px] text-slate-450 leading-relaxed border-t border-white/5 pt-3 flex items-start gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-brand-sky shrink-0 mt-0.5" />
            <span>Weight logs are stored securely in Supabase. Deleting an entry will recalculate average weight differentials.</span>
          </div>
        </div>

      </div>

    </div>
  );
}
