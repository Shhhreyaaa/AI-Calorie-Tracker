import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AnalyzeAPIResponse } from "@/types/gemini";

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
    }
  },
  required: ["meal_name", "calories", "protein", "carbs", "fat", "confidence", "ingredients"]
};

export async function POST(request: NextRequest): Promise<NextResponse<AnalyzeAPIResponse>> {
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

    // 3. Convert File to base64 buffer for Gemini SDK
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const inlineData = {
      inlineData: {
        data: buffer.toString("base64"),
        mimeType: file.type
      }
    };

    // 4. Initialize Gemini model with structured output configs
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const prompt = `
      You are a professional dietitian and food recognition engine.
      Analyze the provided meal photo and identify the food.
      Estimate the calories, protein (g), carbs (g), and fat (g) based on the observed ingredients and standard portion sizes.
      If there is no food in the image, return 'Unknown' for meal_name and 0 for all calorie/macro metrics.
    `;

    // 5. Generate content using Gemini Vision
    const result = await model.generateContent([prompt, inlineData]);
    const responseText = result.response.text();

    if (!responseText) {
      return NextResponse.json(
        { success: false, error: "Empty response received from Gemini AI." },
        { status: 502 }
      );
    }

    // 6. Parse structured JSON response
    const parsedData = JSON.parse(responseText);

    return NextResponse.json({
      success: true,
      data: parsedData
    });

  } catch (error: any) {
    console.error("Gemini API Route Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred during analysis." },
      { status: 500 }
    );
  }
}
