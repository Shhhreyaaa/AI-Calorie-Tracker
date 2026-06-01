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
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function CameraPage() {
  const router = useRouter();

  // State management
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

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
  const capturePhoto = () => {
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
        setImagePreview(dataUrl);
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setIsCameraActive(false);
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setIsCameraActive(false);
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
    try {
      // 1. Prepare image file
      const file = dataURLtoFile(imagePreview, "meal_image.png");
      const formData = new FormData();
      formData.append("file", file);

      // 2. Fetch analyze API route
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // 3. Save result and image to sessionStorage
        sessionStorage.setItem("latest_analysis", JSON.stringify(result.data));
        sessionStorage.setItem("latest_image", imagePreview);
        
        // 4. Redirect to Report page
        router.push("/analysis");
      } else {
        alert(result.error || "Gemini AI was unable to recognize food in this image. Please try again with a clearer photo.");
      }
    } catch (err) {
      console.error("Analysis request failed:", err);
      alert("Failed to connect to the Gemini AI analysis service. Please try again.");
    } finally {
      setIsLoading(false);
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
              Analyzing image contents, matching ingredients, and estimating macro portions...
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
            {/* Preview controls */}
            <div className="flex gap-3 mt-4">
              <button 
                onClick={() => setImagePreview(null)}
                className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-4 py-3.5 rounded-xl font-semibold text-xs active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Remove
              </button>
              <button 
                onClick={handleAnalyze}
                className="flex-1 bg-brand-green hover:bg-emerald-600 text-white font-semibold text-xs py-3.5 px-4 rounded-xl shadow-glow active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 fill-white/25" /> Analyze with Gemini AI
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
