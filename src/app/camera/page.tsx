"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Camera, 
  Image as ImageIcon, 
  Sparkles, 
  UploadCloud, 
  X, 
  Trash2, 
  RotateCw,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";

// Local database of common foods for fallback estimation
const LOCAL_DATABASE: { 
  [key: string]: { 
    meal_name: string; 
    calories: number; 
    protein: number; 
    carbs: number; 
    fat: number; 
    ingredients: string[]; 
  } 
} = {
  idli: {
    meal_name: "Idli",
    calories: 120,
    protein: 4,
    carbs: 24,
    fat: 1,
    ingredients: ["Rice flour", "Urad dal", "Salt"]
  },
  dosa: {
    meal_name: "Dosa",
    calories: 168,
    protein: 4,
    carbs: 29,
    fat: 4,
    ingredients: ["Rice", "Urad dal", "Oil"]
  },
  rice: {
    meal_name: "Rice",
    calories: 130,
    protein: 3,
    carbs: 28,
    fat: 0.3,
    ingredients: ["White Rice"]
  },
  chicken: {
    meal_name: "Chicken Breast",
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    ingredients: ["Chicken Breast", "Spices"]
  },
  paneer: {
    meal_name: "Paneer",
    calories: 265,
    protein: 18,
    carbs: 1.2,
    fat: 20.8,
    ingredients: ["Paneer (Cottage Cheese)"]
  },
  egg: {
    meal_name: "Egg",
    calories: 70,
    protein: 6,
    carbs: 0.6,
    fat: 5,
    ingredients: ["Egg"]
  },
  milk: {
    meal_name: "Milk",
    calories: 120,
    protein: 8,
    carbs: 12,
    fat: 5,
    ingredients: ["Milk"]
  },
  banana: {
    meal_name: "Banana",
    calories: 105,
    protein: 1.3,
    carbs: 27,
    fat: 0.3,
    ingredients: ["Banana"]
  },
  oats: {
    meal_name: "Oats",
    calories: 190,
    protein: 7,
    carbs: 32,
    fat: 3,
    ingredients: ["Rolled Oats", "Water"]
  },
  roti: {
    meal_name: "Roti",
    calories: 120,
    protein: 3,
    carbs: 24,
    fat: 0.5,
    ingredients: ["Whole wheat flour"]
  },
  dal: {
    meal_name: "Dal",
    calories: 150,
    protein: 8,
    carbs: 24,
    fat: 2.5,
    ingredients: ["Lentils", "Spices", "Oil"]
  }
};

function getLocalEstimate(filename: string) {
  const normalized = filename.toLowerCase();
  if (normalized.includes("idli")) return LOCAL_DATABASE.idli;
  if (normalized.includes("dosa")) return LOCAL_DATABASE.dosa;
  if (normalized.includes("chicken")) return LOCAL_DATABASE.chicken;
  if (normalized.includes("paneer")) return LOCAL_DATABASE.paneer;
  if (normalized.includes("egg")) return LOCAL_DATABASE.egg;
  if (normalized.includes("milk")) return LOCAL_DATABASE.milk;
  if (normalized.includes("banana")) return LOCAL_DATABASE.banana;
  if (normalized.includes("oats")) return LOCAL_DATABASE.oats;
  if (normalized.includes("roti")) return LOCAL_DATABASE.roti;
  if (normalized.includes("dal")) return LOCAL_DATABASE.dal;
  if (normalized.includes("rice")) return LOCAL_DATABASE.rice;
  
  // Default fallback if no match
  return {
    meal_name: "Assorted Meal",
    calories: 250,
    protein: 8,
    carbs: 35,
    fat: 9,
    ingredients: ["Rice", "Vegetables", "Spices"]
  };
}

export default function CameraPage() {
  const router = useRouter();

  // State management
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFilename, setImageFilename] = useState<string>("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<string>("");
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);

  // Compress image on the client side before uploading
  const compressImage = (
    dataUrl: string,
    maxDim: number,
    quality: number
  ): Promise<{ compressedDataUrl: string; compressedSize: number }> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
          const compressedSize = Math.round((compressedDataUrl.length * 3) / 4);
          resolve({ compressedDataUrl, compressedSize });
        } else {
          resolve({ compressedDataUrl: dataUrl, compressedSize: Math.round((dataUrl.length * 3) / 4) });
        }
      };
      img.onerror = () => {
        resolve({ compressedDataUrl: dataUrl, compressedSize: Math.round((dataUrl.length * 3) / 4) });
      };
      img.src = dataUrl;
    });
  };

  // References for WebRTC camera stream
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Start Device Camera
  const startCamera = async () => {
    setIsCameraActive(true);
    setImagePreview(null);
    setImageFilename("");
    setErrorMsg(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Prioritize back camera on phones
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Unable to access camera. Please check browser permissions.");
      setIsCameraActive(false);
    }
  };

  // Stop Device Camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  // Capture Snapshot from Camera Stream
  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      
      if (context) {
        // Set canvas boundaries to match video stream
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        // Draw frame onto canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Save as base64 data URI
        const dataUrl = canvas.toDataURL("image/png");
        const rawSize = Math.round((dataUrl.length * 3) / 4);
        setOriginalSize(rawSize);

        const { compressedDataUrl, compressedSize: compSize } = await compressImage(dataUrl, 1024, 0.75);
        setImagePreview(compressedDataUrl);
        setCompressedSize(compSize);
        setImageFilename("captured_plate.jpg");
        stopCamera();
      }
    }
  };

  // Handle Drag Events for File Upload
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  // Process File Select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFilename(file.name);
      setOriginalSize(file.size);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawDataUrl = reader.result as string;
        const { compressedDataUrl, compressedSize: compSize } = await compressImage(rawDataUrl, 1024, 0.75);
        setImagePreview(compressedDataUrl);
        setCompressedSize(compSize);
        setIsCameraActive(false);
        setErrorMsg(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Process File Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setImageFilename(file.name);
      setOriginalSize(file.size);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawDataUrl = reader.result as string;
        const { compressedDataUrl, compressedSize: compSize } = await compressImage(rawDataUrl, 1024, 0.75);
        setImagePreview(compressedDataUrl);
        setCompressedSize(compSize);
        setIsCameraActive(false);
        setErrorMsg(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper to convert Data URL (base64) to a File object
  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  // Connects uploader directly to Gemini Vision API route
  const handleAnalyze = async () => {
    if (!imagePreview) return;
    setIsLoading(true);
    setErrorMsg(null);
    setLoadingStatus("Analyzing your meal...");

    try {
      const file = dataURLtoFile(imagePreview, imageFilename || "meal_image.png");
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Success, cached or live from Gemini
        sessionStorage.setItem("latest_analysis", JSON.stringify(result.data));
        sessionStorage.setItem("latest_image", imagePreview);
        if (result.modelUsed) {
          sessionStorage.setItem("latest_model_used", result.modelUsed);
        } else {
          sessionStorage.removeItem("latest_model_used");
        }
      } else {
        // Failed (e.g. quota exceeded)
        throw new Error(result.error || "Failed to analyze image");
      }
    } catch (err: any) {
      console.warn("API Analysis failed, using local fallback:", err.message);
      // Trigger local fallback for instant analysis on the report page
      const estimate = getLocalEstimate(imageFilename);
      const fallbackResult = {
        meal_name: estimate.meal_name,
        calories: estimate.calories,
        protein: estimate.protein,
        carbs: estimate.carbs,
        fat: estimate.fat,
        confidence: 0.5,
        ingredients: estimate.ingredients,
        health_score: 80,
        good_for: "general health",
        suggestions: ["Log more meals for better AI insights."],
        isFallback: true
      };
      
      sessionStorage.setItem("latest_analysis", JSON.stringify(fallbackResult));
      sessionStorage.setItem("latest_image", imagePreview);
      sessionStorage.removeItem("latest_model_used");
    } finally {
      setIsLoading(false);
      // Redirect instantly after handling
      router.push("/analysis");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header Info */}
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] text-slate-405 font-bold uppercase tracking-wider block">AI Scanner</span>
          <h2 className="font-outfit text-2xl font-bold tracking-tight">Scan Food Photo</h2>
          <p className="text-xs text-slate-400 mt-1">Upload a photo or capture your plate to estimate macros.</p>
        </div>
      </div>

      {/* Core Upload Canvas Workspace */}
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-[32px] overflow-hidden min-h-[340px] flex flex-col items-center justify-center transition-all bg-white dark:bg-slate-900 ${
          isDragActive 
            ? "border-brand-green bg-brand-green/5" 
            : "border-slate-200 dark:border-slate-800"
        }`}
      >
        
        {/* State A: Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-30 bg-white/90 dark:bg-slate-905/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <Loader2 className="w-12 h-12 text-brand-green animate-spin mb-4" />
            <h3 className="font-outfit text-base font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-green fill-brand-green/20" />
              Gemini Vision AI Analysis
            </h3>
            <p className="text-[11px] text-slate-450 mt-1 max-w-[200px]">
              {loadingStatus || "Analyzing your meal..."}
            </p>
          </div>
        )}

        {/* State B: Active Camera Feed */}
        {isCameraActive && !imagePreview && (
          <div className="absolute inset-0 z-10 bg-black flex flex-col justify-between">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover flex-1"
            />
            {/* Camera actions bar */}
            <div className="bg-black/80 backdrop-blur-md p-4 flex justify-between items-center px-8 border-t border-white/10">
              <button 
                onClick={stopCamera}
                className="text-white hover:text-red-400 p-2.5 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <button 
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full border-4 border-white bg-white/20 hover:bg-white/40 active:scale-95 transition-all flex items-center justify-center"
              >
                <div className="w-12 h-12 rounded-full bg-white" />
              </button>
              <div className="w-10" /> {/* Spacer */}
            </div>
          </div>
        )}

        {/* State C: Captured or Uploaded Image Preview */}
        {imagePreview && (
          <div className="absolute inset-0 z-10 bg-slate-50 dark:bg-slate-950 flex flex-col justify-between p-4">
            <div className="relative flex-1 rounded-[24px] overflow-hidden border border-slate-100 dark:border-slate-800">
              <img 
                src={imagePreview} 
                alt="Uploaded plate preview" 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Compression Metrics Pill */}
            {originalSize && compressedSize && (
              <div className="mt-3 flex items-center justify-between bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-500">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-405 uppercase font-bold">Orig:</span>
                  <span className="text-slate-700 dark:text-slate-350">{(originalSize / 1024).toFixed(1)} KB</span>
                </div>
                <div className="w-px h-3 bg-slate-200 dark:bg-slate-800" />
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-brand-green uppercase font-bold">Opt:</span>
                  <span className="text-brand-green">{(compressedSize / 1024).toFixed(1)} KB</span>
                </div>
                <div className="w-px h-3 bg-slate-200 dark:bg-slate-800" />
                <div className="bg-brand-green/10 text-brand-green px-2 py-0.5 rounded-lg text-[10px] font-black">
                  -{Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))}% Size
                </div>
              </div>
            )}
            
            {/* User Friendly Error UI */}
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-3 text-xs mt-3 flex items-start gap-2.5 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <div className="flex-1 text-red-500 font-semibold leading-relaxed">
                  {errorMsg}
                </div>
              </div>
            )}

            {/* Preview controls */}
            <div className="flex gap-3 mt-4">
              <button 
                onClick={() => {
                  setImagePreview(null);
                  setErrorMsg(null);
                }}
                className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-4 py-3.5 rounded-xl font-semibold text-xs active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Remove
              </button>
              <button 
                onClick={handleAnalyze}
                className="flex-1 bg-brand-green hover:bg-emerald-600 text-white font-semibold text-xs py-3.5 px-4 rounded-xl shadow-glow active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 fill-white/25" /> {errorMsg ? "Retry Analysis" : "Analyze with Gemini AI"}
              </button>
            </div>
          </div>
        )}

        {/* State D: Default Upload / Camera Trigger Panel */}
        {!imagePreview && !isCameraActive && (
          <div className="flex flex-col items-center p-6 text-center">
            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-[24px] mb-4 text-slate-400 dark:text-slate-500">
              <UploadCloud className="w-10 h-10" />
            </div>
            <h3 className="font-outfit text-sm font-bold mb-1">Drag and drop your food photo</h3>
            <p className="text-[11px] text-slate-400 text-center max-w-[200px] mb-6">
              Drop files here, or use the selection methods below
            </p>

            <div className="flex flex-col gap-2.5 w-full max-w-xs px-4">
              <label className="bg-brand-green hover:bg-emerald-600 text-white font-semibold text-xs py-3 px-4 rounded-xl shadow-glow active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer">
                <ImageIcon className="w-4 h-4" />
                <span>Upload Food Photo</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange}
                  className="hidden" 
                />
              </label>
              <button 
                onClick={startCamera}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-850 dark:text-slate-200 font-semibold text-xs py-3 px-4 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>Capture Plate Snapshot</span>
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
