"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Mail, AlertCircle, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const redirectUrl = `${window.location.origin}/update-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (resetError) {
        // Log the actual error internally for developer debugging
        console.error("Supabase password reset request failed:", resetError);
        
        // Check for specific rate-limiting or network block errors, but show a user-friendly generic fallback
        if (resetError.status === 429) {
          setError("Too many requests. Please wait a moment before trying again.");
          setLoading(false);
          return;
        }
      }

      // Proactively mark as success regardless of user existence (to prevent user enumeration attacks)
      setSuccess(true);
    } catch (err) {
      console.error("Runtime password reset request failed:", err);
      // Fallback success to prevent account enumeration leaks
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-6 max-w-sm mx-auto">
      
      {/* Brand Icon Banner */}
      <div className="flex flex-col items-center text-center mb-8">
        <span className="bg-brand-green/10 text-brand-green p-3 rounded-2xl flex items-center justify-center mb-3">
          <Sparkles className="w-6 h-6 fill-current animate-pulse" />
        </span>
        <h2 className="font-outfit text-2xl font-bold tracking-tight">Reset Password</h2>
        <p className="text-xs text-slate-400 mt-1">We will send you a secure link to log back in</p>
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
              <h3 className="font-outfit text-sm font-bold text-slate-800 dark:text-slate-200">Reset Link Sent</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Check your email for a reset link. Click the link to update your password.
              </p>
            </div>
            <Link 
              href="/login" 
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-green hover:underline mt-2"
            >
              Back to Sign In <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email input */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-405 font-bold uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="you@example.com" 
                  className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 focus:border-brand-green dark:focus:border-brand-green rounded-xl pl-11 pr-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 disabled:opacity-60"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full bg-brand-green hover:bg-emerald-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-glow active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Sending Link...
                </>
              ) : (
                <>
                  Send Reset Link <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>
        )}
      </div>

      {/* Footer Back to Login Prompt */}
      {!success && (
        <div className="text-center mt-6 text-xs text-slate-500">
          Remembered your password?{" "}
          <Link href="/login" className="text-brand-green font-bold hover:underline">
            Sign In
          </Link>
        </div>
      )}

    </div>
  );
}
