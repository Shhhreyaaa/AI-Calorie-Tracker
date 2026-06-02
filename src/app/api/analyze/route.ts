import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AnalyzeAPIResponse } from "@/types/gemini";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// JSON Schema definition to enforce structured Gemini output
const responseSchema: any = {
  type: "object",
  properties: {
    meal_name: {
      type: "string",
      description: "Name of the recognized meal. If no food is recognized, write 'Unknown'."
    },
    calories: {
      type: "integer",
      description: "Estimated total calories in kcal."
    },
    protein: {
      type: "integer",
      description: "Estimated protein in grams."
    },
    carbs: {
      type: "integer",
      description: "Estimated carbohydrates in grams."
    },
    fat: {
      type: "integer",
      description: "Estimated fat in grams."
    },
    confidence: {
      type: "number",
      description: "Confidence float score between 0.0 and 1.0."
    },
    ingredients: {
      type: "array",
      items: { type: "string" },
      description: "List of recognized ingredients in the meal."
    },
    health_score: {
      type: "integer",
      description: "Health score between 0 and 100 based on nutritional density and balance."
    },
    good_for: {
      type: "string",
      description: "Short phrase classifying the meal (e.g. 'muscle gain', 'fat loss', 'maintenance', 'pre-workout')."
    },
    suggestions: {
      type: "array",
      items: { type: "string" },
      description: "1-3 actionable AI suggestions (e.g. 'Add 20g protein to improve this meal', 'High carb, low protein')."
    }
  },
  required: ["meal_name", "calories", "protein", "carbs", "fat", "confidence", "ingredients", "health_score", "good_for", "suggestions"]
};

export async function POST(request: NextRequest): Promise<NextResponse<AnalyzeAPIResponse>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || null;
  let imageHash = "unknown";

  try {
    // 1. Check API credentials
    if (!genAI) {
      return NextResponse.json(
        { success: false, error: "GEMINI_API_KEY environment variable is not configured." },
        { status: 500 }
      );
    }

    // 2. Parse uploaded file from request body
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No image file provided in request." },
        { status: 400 }
      );
    }

    // 3. Convert File to base64 buffer for Gemini SDK and calculate hash
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Calculate SHA-256 hash of the image buffer
    imageHash = crypto.createHash("sha256").update(buffer).digest("hex");

    // 4. Check if we already have this image analyzed in the cache
    const { data: cachedResult, error: cacheError } = await supabase
      .from("image_analysis_cache")
      .select("analysis_result")
      .eq("image_hash", imageHash)
      .maybeSingle();

    if (cachedResult && cachedResult.analysis_result) {
      console.log(`[Cache Hit] Serving cached result for image hash ${imageHash}`);
      
      // Log cache hit
      await supabase.from("gemini_api_logs").insert({
        user_id: userId,
        image_hash: imageHash,
        model_used: "cache",
        status: "CACHE_HIT"
      });

      return NextResponse.json({
        success: true,
        modelUsed: "cache",
        data: cachedResult.analysis_result
      });
    }

    if (cacheError) {
      console.error("Error querying image cache:", cacheError);
      // Proceed to normal API call if cache fails
    }

    const inlineData = {
      inlineData: {
        data: buffer.toString("base64"),
        mimeType: file.type
      }
    };

    const prompt = `
      You are a professional dietitian and food recognition engine.
      Analyze the provided meal photo and identify the food.
      Estimate the calories, protein (g), carbs (g), and fat (g) based on the observed ingredients and standard portion sizes.
      Assign a health_score from 0-100.
      Determine what this meal is good_for (e.g., 'muscle gain', 'fat loss', 'maintenance').
      Provide 1-3 short suggestions to improve it (e.g., 'Add 20g protein', 'Good pre-workout meal').
      If there is no food in the image, return 'Unknown' for meal_name and 0 for all metrics.
    `;

    let responseText = "";
    let lastError: any = null;
    const modelName = "gemini-2.5-flash";

    console.log("-----------------------------------------");
    console.log(`[Gemini Request] Model: ${modelName} | Executing exactly 1 attempt`);
    
    // Add logging to explicitly count Gemini calls (Target: max 1 per scan)
    console.log("[Gemini Metrics] Total Gemini API Calls for this scan: 1");

    try {
      // Initialize Gemini model with structured output configs
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        }
      });

      const result = await model.generateContent([prompt, inlineData]);
      responseText = result.response.text();
      
      if (responseText) {
        console.log(`[Gemini Success] Model: ${modelName} | Status: 200 OK`);
      }
    } catch (err: any) {
      console.error(`[Gemini Error] Model ${modelName} failed on single attempt. Error:`, err.message || err);
      lastError = err;
    }

    if (!responseText) {
      const errorMessage = lastError?.message || "Failed to get a response from Gemini.";
      console.error("Gemini Analysis Pipeline Error:", errorMessage);
      
      // Log the failure
      await supabase.from("gemini_api_logs").insert({
        user_id: userId,
        image_hash: imageHash,
        model_used: "failed",
        status: "ERROR",
        error_message: errorMessage
      });

      return NextResponse.json({ 
        success: false, 
        error: process.env.NODE_ENV === "development" ? errorMessage : "AI service is temporarily busy or out of quota. Please try again later."
      }, { status: 503 }); // Returning 503 so frontend handles as error and initiates fallback
    }

    // Parse structured JSON response
    const parsedData = JSON.parse(responseText);

    // Save to cache
    await supabase.from("image_analysis_cache").insert({
      image_hash: imageHash,
      analysis_result: parsedData
    });

    // Log success
    await supabase.from("gemini_api_logs").insert({
      user_id: userId,
      image_hash: imageHash,
      model_used: modelName,
      status: "SUCCESS"
    });

    return NextResponse.json({
      success: true,
      modelUsed: modelName,
      data: parsedData
    });

  } catch (error: any) {
    console.error("Gemini API Route Error:", error);
    
    // Log unexpected API route errors
    const supabaseFallback = await createClient(); // re-init to ensure it works
    await supabaseFallback.from("gemini_api_logs").insert({
      user_id: userId,
      image_hash: imageHash,
      model_used: "failed",
      status: "EXCEPTION",
      error_message: error.message || String(error)
    });

    return NextResponse.json({
      success: false,
      error: process.env.NODE_ENV === "development" ? (error.message || String(error)) : "AI service busy. Please try again in a moment."
    }, { status: 500 });
  }
}
