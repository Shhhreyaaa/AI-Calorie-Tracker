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

const LOCAL_DATABASE: { [key: string]: any } = {
  idli: {
    meal_name: "Idli",
    calories: 120,
    protein: 4,
    carbs: 24,
    fat: 1,
    confidence: 0.85,
    ingredients: ["Rice flour", "Urad dal", "Salt"],
    health_score: 90,
    good_for: "clean digestion",
    suggestions: ["Good clean breakfast carb option."]
  },
  dosa: {
    meal_name: "Dosa",
    calories: 168,
    protein: 4,
    carbs: 29,
    fat: 4,
    confidence: 0.85,
    ingredients: ["Rice", "Urad dal", "Oil"],
    health_score: 85,
    good_for: "sustained energy",
    suggestions: ["Keep oil minimal to reduce fat content."]
  },
  rice: {
    meal_name: "Rice",
    calories: 130,
    protein: 3,
    carbs: 28,
    fat: 0.3,
    confidence: 0.90,
    ingredients: ["White Rice"],
    health_score: 80,
    good_for: "fast absorption energy",
    suggestions: ["Mix with dal or protein source to lower glycemic index."]
  },
  chicken: {
    meal_name: "Chicken Breast",
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    confidence: 0.95,
    ingredients: ["Chicken Breast", "Spices"],
    health_score: 95,
    good_for: "muscle gain",
    suggestions: ["Excellent high-protein lean source."]
  },
  paneer: {
    meal_name: "Paneer",
    calories: 265,
    protein: 18,
    carbs: 1.2,
    fat: 20.8,
    confidence: 0.90,
    ingredients: ["Paneer (Cottage Cheese)"],
    health_score: 88,
    good_for: "vegetarian muscle building",
    suggestions: ["Good source of casein protein and healthy fats."]
  },
  egg: {
    meal_name: "Egg",
    calories: 70,
    protein: 6,
    carbs: 0.6,
    fat: 5,
    confidence: 0.95,
    ingredients: ["Egg"],
    health_score: 92,
    good_for: "muscle gain & fats",
    suggestions: ["Egg whites can be added to increase protein density."]
  },
  milk: {
    meal_name: "Milk",
    calories: 120,
    protein: 8,
    carbs: 12,
    fat: 5,
    confidence: 0.90,
    ingredients: ["Milk"],
    health_score: 85,
    good_for: "bone density",
    suggestions: ["Good calcium and recovery protein."]
  },
  banana: {
    meal_name: "Banana",
    calories: 105,
    protein: 1.3,
    carbs: 27,
    fat: 0.3,
    confidence: 0.95,
    ingredients: ["Banana"],
    health_score: 90,
    good_for: "pre-workout carbs",
    suggestions: ["Excellent potassium and recovery carbs."]
  },
  oats: {
    meal_name: "Oats",
    calories: 190,
    protein: 7,
    carbs: 32,
    fat: 3,
    confidence: 0.90,
    ingredients: ["Rolled Oats", "Water"],
    health_score: 94,
    good_for: "heart health",
    suggestions: ["High beta-glucan fiber content."]
  },
  roti: {
    meal_name: "Roti",
    calories: 120,
    protein: 3,
    carbs: 24,
    fat: 0.5,
    confidence: 0.90,
    ingredients: ["Whole wheat flour"],
    health_score: 85,
    good_for: "complex carbs",
    suggestions: ["Made from whole wheat grain for digestion fiber."]
  },
  dal: {
    meal_name: "Dal",
    calories: 150,
    protein: 8,
    carbs: 24,
    fat: 2.5,
    confidence: 0.88,
    ingredients: ["Lentils", "Spices", "Oil"],
    health_score: 92,
    good_for: "vegetarian protein & fiber",
    suggestions: ["Combine with rice or roti for complete amino profile."]
  }
};
 
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
    const maxRetries = 3;
    let attempt = 0;
 
    console.log("-----------------------------------------");
    console.log(`[Gemini Request] Model: ${modelName} | Scheduling up to ${maxRetries} attempts`);
 
    while (attempt < maxRetries) {
      attempt++;
      try {
        console.log(`[Gemini Request Attempt] ${attempt}/${maxRetries} starting...`);
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
          console.log(`[Gemini Success] Model: ${modelName} | Attempt ${attempt} succeeded.`);
          break;
        }
      } catch (err: any) {
        console.error(`[Gemini Error] Attempt ${attempt} failed:`, err.message || err);
        lastError = err;
        if (attempt < maxRetries) {
          const backoff = Math.pow(2, attempt) * 1000;
          console.log(`[Gemini Retry] Waiting ${backoff}ms before next retry...`);
          await new Promise((resolve) => setTimeout(resolve, backoff));
        }
      }
    }
 
    // Fallback if Gemini retries are completely exhausted
    if (!responseText) {
      console.warn("Gemini retries exhausted. Attempting fallback local database lookup...");
      const filename = file.name.toLowerCase();
      let matchedKey = "";
      
      for (const key of Object.keys(LOCAL_DATABASE)) {
        if (filename.includes(key)) {
          matchedKey = key;
          break;
        }
      }
      
      const fallbackResult = matchedKey 
        ? LOCAL_DATABASE[matchedKey]
        : {
            meal_name: "Assorted Meal",
            calories: 250,
            protein: 8,
            carbs: 35,
            fat: 9,
            confidence: 0.5,
            ingredients: ["Rice", "Vegetables", "Spices"],
            health_score: 80,
            good_for: "general energy",
            suggestions: ["Log more meals for better AI insights."]
          };
      
      // Log fallback usage
      await supabase.from("gemini_api_logs").insert({
        user_id: userId,
        image_hash: imageHash,
        model_used: "fallback-db",
        status: "FALLBACK"
      });
 
      return NextResponse.json({
        success: true,
        modelUsed: "fallback-db",
        data: fallbackResult
      });
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
    
    const supabaseFallback = await createClient();
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
