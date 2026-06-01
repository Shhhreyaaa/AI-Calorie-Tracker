"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Sparkles, Key, Mail, User, AlertCircle, ArrowRight } from "lucide-react";
import { signup } from "../auth/actions";

function SignupForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-6">
      
      {/* Brand Icon Banner */}
      <div className="flex flex-col items-center text-center mb-8">
        <span className="bg-brand-green/10 text-brand-green p-3 rounded-2xl flex items-center justify-center mb-3">
          <Sparkles className="w-6 h-6 fill-current" />
        </span>
        <h2 className="font-outfit text-2xl font-bold tracking-tight">Get Started</h2>
        <p className="text-xs text-slate-400 mt-1">Create an account to unlock AI food recognition</p>
      </div>

      {/* Error Alert Box */}
      {error && (
        <div className="bg-brand-coral/10 border border-brand-coral/20 text-brand-coral p-4 rounded-2xl text-xs font-semibold flex items-start gap-2 mb-6">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{decodeURIComponent(error)}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-6 shadow-premium dark:shadow-premium-dark">
        <form action={signup} className="space-y-4">
          
          {/* Display Name Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Full Name</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input 
                type="text" 
                name="displayName"
                required
                placeholder="Alex Mercer" 
                className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 focus:border-brand-green dark:focus:border-brand-green rounded-xl pl-11 pr-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input 
                type="email" 
                name="email"
                required
                placeholder="you@example.com" 
                className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 focus:border-brand-green dark:focus:border-brand-green rounded-xl pl-11 pr-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Password</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Key className="w-4 h-4" />
              </span>
              <input 
                type="password" 
                name="password"
                required
                placeholder="••••••••" 
                className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 focus:border-brand-green dark:focus:border-brand-green rounded-xl pl-11 pr-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit"
            className="w-full bg-brand-green hover:bg-emerald-600 text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-glow active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
          >
            Create Account <ArrowRight className="w-4 h-4" />
          </button>

        </form>
      </div>

      {/* Footer Login Prompt */}
      <div className="text-center mt-6 text-xs text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-green font-bold hover:underline">
          Sign In
        </Link>
      </div>

    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-pulse text-xs text-slate-400">Loading Form...</div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
