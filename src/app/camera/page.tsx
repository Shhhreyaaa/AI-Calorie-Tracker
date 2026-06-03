"use client";
 
import React, { useState, useRef, useEffect } from "react";
import { 
  Camera, 
  Image as ImageIcon, 
  Sparkles, 
  UploadCloud, 
  X, 
  Trash2, 
  Loader2, 
  AlertCircle,
  RefreshCw
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
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
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
 
  // Recursively compress image under 1MB target
  const compressImageUnderLimit = async (
    dataUrl: string
  ): Promise<{ compressedDataUrl: string; compressedSize: number }> => {
    let maxDim = 1200;
    let quality = 0.85;
    let attempts = 0;
    
    while (attempts < 5) {
      attempts++;
      const { compressedDataUrl, compressedSize } = await compressImage(dataUrl, maxDim, quality);
      if (compressedSize < 1000000) {
        return { compressedDataUrl, compressedSize };
      }
      maxDim = Math.round(maxDim * 0.8);
      quality = Math.max(quality - 0.15, 0.45);
    }
    
    // Final desperate compression attempt
    const { compressedDataUrl, compressedSize } = await compressImage(dataUrl, 600, 0.35);
    if (compressedSize >= 1048576) {
      throw new Error("Image is too large. Even after optimization, it exceeds the 1MB size limit. Please upload a smaller image.");
    }
    return { compressedDataUrl, compressedSize };
  };
 
  // References for WebRTC camera stream (as fallback)
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

  // Bind camera stream to video element when active and mounted
  useEffect(() => {
    if (isCameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => {
        console.error("Error starting video playback:", err);
      });
    }
  }, [isCameraActive, stream]);
 
  // Start Device Camera (WebRTC)
  const startCamera = async (mode = facingMode) => {
    setIsCameraActive(true);
    setImagePreview(null);
    setImageFilename("");
    setErrorMsg(null);

    // 1. Check if navigator.mediaDevices and getUserMedia are supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg("Camera not supported: Browser does not support MediaDevices API.");
      setIsCameraActive(false);
      openNativeCamera();
      return;
    }

    try {
      // Stop current stream if active to prevent locks
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }

      // 2. Request camera with selected facingMode
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      setStream(mediaStream);
    } catch (err: any) {
      console.error("Camera access error:", err);
      
      // 3. Set user-friendly error messages based on error type
      let message = "Camera unavailable.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        message = "Camera permission denied. Please allow camera access in your browser settings.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        message = "Camera not found or unavailable. Please ensure your camera is connected.";
      } else if (err.name === "NotSupportedError" || err.name === "ConstraintNotSatisfiedError") {
        message = "Camera not supported by browser constraints.";
      }
      
      setErrorMsg(message);
      setIsCameraActive(false);
      
      // 4. Fallback: trigger native image picker
      openNativeCamera();
    }
  };

  const toggleFacingMode = () => {
    const newMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newMode);
    if (isCameraActive) {
      startCamera(newMode);
    }
  };
 
  // Trigger Native Mobile Camera directly with rear orientation
  const openNativeCamera = () => {
    const input = document.getElementById("native-camera-input");
    if (input) {
      (input as HTMLInputElement).value = "";
      input.click();
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
      
      if (video.readyState < 2) {
        console.warn("Video metadata/frame not ready yet.");
        return;
      }

      if (context && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/png");
        const rawSize = Math.round((dataUrl.length * 3) / 4);
        setOriginalSize(rawSize);
        setIsLoading(true);
        setLoadingStatus("Optimizing captured photo...");
 
        try {
          const { compressedDataUrl, compressedSize: compSize } = await compressImageUnderLimit(dataUrl);
          setImagePreview(compressedDataUrl);
          setCompressedSize(compSize);
          setImageFilename("captured_plate.jpg");
          setErrorMsg(null);
        } catch (compErr: any) {
          setErrorMsg(compErr.message);
        } finally {
          setIsLoading(false);
          stopCamera();
        }
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
 
  // Process the selected image file, supporting HEIC and iterative compression
  const handleFileProcess = async (file: File) => {
    setErrorMsg(null);
    setIsLoading(true);
    
    // HEIC Check
    const isHeic = file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif") || file.type === "image/heic";
    
    if (isHeic) {
      setLoadingStatus("Converting HEIC format to JPEG...");
      try {
        const heic2anyModule = await import("heic2any");
        const heic2any = heic2anyModule.default || heic2anyModule;
        const convertedBlob = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.8
        });
        const blobToProcess = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
        const convertedFile = new File([blobToProcess], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
          type: "image/jpeg"
        });
        file = convertedFile;
      } catch (heicErr: any) {
        console.error("HEIC conversion error:", heicErr);
        setErrorMsg("Failed to convert HEIC format. Please select a standard JPEG/PNG image.");
        setIsLoading(false);
        return;
      }
    }
 
    setImageFilename(file.name);
    setOriginalSize(file.size);
    setLoadingStatus("Optimizing image size...");
 
    const reader = new FileReader();
    reader.onloadend = async () => {
      const rawDataUrl = reader.result as string;
      try {
        const { compressedDataUrl, compressedSize: compSize } = await compressImageUnderLimit(rawDataUrl);
        setImagePreview(compressedDataUrl);
        setCompressedSize(compSize);
        setIsCameraActive(false);
        setErrorMsg(null);
      } catch (compErr: any) {
        setErrorMsg(compErr.message);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };
 
  // Process File Select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };
 
  // Process File Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
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
        sessionStorage.setItem("latest_analysis", JSON.stringify(result.data));
        sessionStorage.setItem("latest_image", imagePreview);
        if (result.modelUsed) {
          sessionStorage.setItem("latest_model_used", result.modelUsed);
        } else {
          sessionStorage.removeItem("latest_model_used");
        }
      } else {
        throw new Error(result.error || "Failed to analyze image");
      }
    } catch (err: any) {
      console.warn("API Analysis failed, using local fallback:", err.message);
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
      router.push("/analysis");
    }
  };
 
  return (
    <div className="space-y-6">
      
      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />
 
      {/* Hidden inputs to trigger mobile capture and files picker */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        id="native-camera-input" 
        className="hidden" 
        onChange={handleFileChange} 
      />
 
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
        className={`relative border-2 border-dashed rounded-[32px] overflow-hidden flex flex-col items-center justify-center transition-all bg-white dark:bg-slate-900 ${
          isCameraActive || imagePreview ? "h-[450px] border-none animate-fade-in" : "min-h-[340px]"
        } ${
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
          <div className="absolute inset-0 z-10 bg-black flex flex-col justify-end items-center overflow-hidden rounded-[30px]">
            {/* Live Video Stream */}
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover z-0"
            />

            {/* Gradient Overlay for controls visibility */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/85 via-black/45 to-transparent z-10 pointer-events-none" />

            {/* Camera actions overlay */}
            <div className="absolute bottom-4 inset-x-0 z-20 flex justify-between items-center px-6">
              
              {/* Left action: Cancel */}
              <button 
                onClick={stopCamera}
                className="bg-black/60 border border-white/10 text-white hover:text-red-400 p-3 rounded-full hover:bg-black/80 transition-colors cursor-pointer"
                title="Cancel"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Center action: Capture circular shutter button */}
              <button 
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full border-4 border-white bg-white/20 hover:bg-white/40 active:scale-90 transition-all flex items-center justify-center cursor-pointer shadow-lg animate-pulse-glow"
                title="Capture Photo"
              >
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                  <Camera className="w-5 h-5 text-black stroke-[2.5px]" />
                </div>
              </button>

              {/* Right action: Switch Camera toggle (facingMode toggle for mobile) */}
              <button 
                onClick={toggleFacingMode}
                className="bg-black/60 border border-white/10 text-white hover:text-brand-green p-3 rounded-full hover:bg-black/80 transition-colors cursor-pointer"
                title="Switch Camera"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              
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
              <div className="mt-3 flex items-center justify-between bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-505">
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
            <div className="flex gap-3 mt-4 shrink-0">
              <button 
                onClick={() => {
                  setImagePreview(null);
                  setErrorMsg(null);
                  if (typeof window !== "undefined" && navigator.mediaDevices) {
                    startCamera();
                  }
                }}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-4 py-3.5 rounded-xl font-semibold text-xs active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4 text-red-400" /> Retake Photo
              </button>
              <button 
                onClick={handleAnalyze}
                className="flex-1 bg-brand-green hover:bg-emerald-600 text-white font-semibold text-xs py-3.5 px-4 rounded-xl shadow-glow active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 fill-white/25" /> {errorMsg ? "Retry Analysis" : "Analyze Photo"}
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
            
            {/* Display camera error message if any */}
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-505 rounded-xl p-3 text-xs mb-6 flex items-start gap-2.5 max-w-xs text-left animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <div className="flex-1 text-red-550 font-semibold leading-relaxed">
                  {errorMsg}
                </div>
              </div>
            )}
 
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
                onClick={() => startCamera()}
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
