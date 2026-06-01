"use client";

import React, { useState } from "react";
import { Camera, Image as ImageIcon, Sparkles, UploadCloud } from "lucide-react";
import Link from "next/link";

export default function CameraPage() {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div>
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">AI Scanner</span>
        <h2 className="font-outfit text-2xl font-bold tracking-tight">Scan Food Photo</h2>
        <p className="text-xs text-slate-400 mt-1">Upload a photo or capture your plate to estimate macros.</p>
      </div>

      {/* Main Upload Area */}
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        className={`border-2 border-dashed rounded-[32px] p-8 flex flex-col items-center justify-center min-h-[300px] transition-all bg-white dark:bg-slate-900 ${
          isDragActive 
            ? "border-brand-green bg-brand-green/5" 
            : "border-slate-200 dark:border-slate-800"
        }`}
      >
        <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-3xl mb-4 text-slate-400 dark:text-slate-500">
          <UploadCloud className="w-10 h-10" />
        </div>
        <h3 className="font-outfit text-sm font-bold mb-1">Drag and drop your food photo</h3>
        <p className="text-[11px] text-slate-400 text-center max-w-[200px] mb-6">
          Supports PNG, JPG, or HEIC files from your device.
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-2.5 w-full max-w-xs">
          <label className="bg-brand-green hover:bg-emerald-600 text-white font-semibold text-xs py-3 px-4 rounded-xl shadow-glow active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer">
            <ImageIcon className="w-4 h-4" />
            <span>Choose from Gallery</span>
            <input type="file" accept="image/*" className="hidden" />
          </label>
          <button className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs py-3 px-4 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <Camera className="w-4 h-4" />
            <span>Open Device Camera</span>
          </button>
        </div>
      </div>

      {/* Simulated Redirect to AI page */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-premium dark:shadow-premium-dark flex justify-between items-center">
        <div>
          <h4 className="font-outfit text-sm font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-250">
            <Sparkles className="w-4 h-4 text-brand-green fill-brand-green/20" />
            Simulate analysis results
          </h4>
          <p className="text-[11px] text-slate-400 mt-1">Directly view a mock AI analysis page.</p>
        </div>
        <Link 
          href="/analysis"
          className="bg-brand-sky hover:bg-sky-600 text-white font-semibold text-xs py-2 px-3 rounded-xl active:scale-95 transition-all"
        >
          Mock AI
        </Link>
      </div>

    </div>
  );
}
