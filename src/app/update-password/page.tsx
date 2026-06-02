"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Key, AlertCircle, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 1. Verify that there is an active Supabase recovery session on page load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setError("No active reset session found. Redirecting to login...");
          setTimeout(() => {
            router.push("/login");
          }, 3000);
        }
      } catch (err) {
        console.error("Failed to verify reset session:", err);
        setError("Error establishing secure session. Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } finally {
        setSessionLoading(false);
      }
    };

    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword || loading) return;

    setError(null);

    // Validation
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.error("Supabase password update failed:", updateError);
        // Show a friendly message to comply with security requirements
        if (updateError.status === 429) {
          setError("Too many requests. Please wait a moment before trying again.");
        } else {
          setError("Unable to update password. Please verify requirements and try again.");
        }
      } else {
        setSuccess(true);
        // Auto-redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
    } catch (err) {
      console.error("Runtime password update failed:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col justify-center items-center gap-2 max-w-sm mx-auto">
        <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
        <span className="text-xs text-slate-400 font-semibold animate-pulse">Establishing secure connection...</span>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-6 max-w-sm mx-auto animate-fade-in">
      
      {/* Brand Icon Banner */}
      <div className="flex flex-col items-center text-center mb-8">
        <span className="bg-brand-green/10 text-brand-green p-3 rounded-2xl flex items-center justify-center mb-3">
          <Sparkles className="w-6 h-6 fill-current animate-pulse" />
        </span>
        <h2 className="font-outfit text-2xl font-bold tracking-tight">Create New Password</h2>
        <p className="text-xs text-slate-400 mt-1">Choose a secure password for your account</p>
      </div>

      {/* Error Alert Box */}
      {error && (
        <div className="bg-brand-coral/10 border border-brand-coral/20 text-brand-coral p-4 rounded-2xl text-xs font-semibold flex items-start gap-2 mb-6">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Card / Success Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-6 shadow-premium dark:shadow-premium-dark">
        {success ? (
          <div className="text-center py-4 space-y-4 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center mx-auto shadow-premium">
              <CheckCircle className="w-6 h-6 animate-bounce" style={{ animationDuration: '2s' }} />
            </div>
            <div>
              <h3 className="font-outfit text-sm font-bold text-slate-800 dark:text-slate-200">Password Updated</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Password updated successfully. Redirecting to dashboard...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* New Password input */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-405 font-bold uppercase tracking-wider block">New Password</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Key className="w-4 h-4" />
                </span>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="••••••••" 
                  className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 focus:border-brand-green dark:focus:border-brand-green rounded-xl pl-11 pr-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 disabled:opacity-60"
                />
              </div>
            </div>

            {/* Confirm Password input */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-405 font-bold uppercase tracking-wider block">Confirm Password</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Key className="w-4 h-4" />
                </span>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="••••••••" 
                  className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 focus:border-brand-green dark:focus:border-brand-green rounded-xl pl-11 pr-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 disabled:opacity-60"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              className="w-full bg-brand-green hover:bg-emerald-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-glow active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                </>
              ) : (
                <>
                  Reset Password <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>
        )}
      </div>

    </div>
  );
}
