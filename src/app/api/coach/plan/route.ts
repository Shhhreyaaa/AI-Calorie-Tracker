import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const planSchema: any = {
  type: "object",
  properties: {
    breakfast: {
      type: "object",
      properties: {
        name: { type: "string" },
        calories: { type: "integer" },
        protein: { type: "integer" },
        carbs: { type: "integer" },
        fat: { type: "integer" }
      },
      required: ["name", "calories", "protein", "carbs", "fat"]
    },
    lunch: {
      type: "object",
      properties: {
        name: { type: "string" },
        calories: { type: "integer" },
        protein: { type: "integer" },
        carbs: { type: "integer" },
        fat: { type: "integer" }
      },
      required: ["name", "calories", "protein", "carbs", "fat"]
    },
    dinner: {
      type: "object",
      properties: {
        name: { type: "string" },
        calories: { type: "integer" },
        protein: { type: "integer" },
        carbs: { type: "integer" },
        fat: { type: "integer" }
      },
      required: ["name", "calories", "protein", "carbs", "fat"]
    },
    snacks: {
      type: "object",
      properties: {
        name: { type: "string" },
        calories: { type: "integer" },
        protein: { type: "integer" },
        carbs: { type: "integer" },
        fat: { type: "integer" }
      },
      required: ["name", "calories", "protein", "carbs", "fat"]
    }
  },
  required: ["breakfast", "lunch", "dinner", "snacks"]
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // 1. Fetch user goals
    const { data: goals } = await supabase
      .from("goals")
      .select("*")
      .eq("id", user.id)
      .single();

    const targetCalories = goals?.calorie_target ?? goals?.calories ?? 2000;
    const targetProtein = goals?.protein_target ?? goals?.protein ?? 150;
    const targetCarbs = goals?.carb_target ?? goals?.carbs ?? 200;
    const targetFat = goals?.fat_target ?? goals?.fat ?? 65;

    let plan: any = null;

    if (genAI) {
      const prompt = `
You are an expert AI Nutritionist. Generate a delicious, healthy, and realistic one-day meal plan for tomorrow that strictly respects the user's daily goals.

Daily Goal Targets:
- Calories: ${targetCalories} kcal
- Protein: ${targetProtein}g
- Carbs: ${targetCarbs}g
- Fat: ${targetFat}g

Instructions:
1. Provide four meals: breakfast, lunch, dinner, and snacks.
2. For each meal, generate a realistic food name (focusing on healthy Indian meal options such as Dal, Roti, Idli, Upma, Paneer, Chicken Breast, Eggs, Sabzi, Poha, etc.).
3. Estimate the calories, protein, carbs, and fat for each meal.
4. Ensure the SUM of calories and macronutrients for all 4 meals is extremely close (within ±10%) of the target goals.
5. Output MUST strictly match the requested JSON schema.
`;

      const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];
      for (const modelName of modelsToTry) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: planSchema,
            }
          });
          const result = await model.generateContent(prompt);
          const text = result.response.text();
          if (text) {
            plan = JSON.parse(text);
            break;
          }
        } catch (err) {
          console.error(`Gemini meal planner model ${modelName} failed:`, err);
        }
      }
    }

    // Fallback to offline rule-based meal planner
    if (!plan) {
      // Divide goals: Breakfast (25%), Lunch (35%), Dinner (30%), Snacks (10%)
      const getMacrosForPct = (pct: number) => ({
        calories: Math.round(targetCalories * pct),
        protein: Math.round(targetProtein * pct),
        carbs: Math.round(targetCarbs * pct),
        fat: Math.round(targetFat * pct)
      });

      plan = {
        breakfast: {
          name: "Oatmeal with Almonds, Chia Seeds, and a scoop of Whey Protein",
          ...getMacrosForPct(0.25)
        },
        lunch: {
          name: "Grilled Chicken Breast (or Grilled Paneer) with Brown Rice and Mixed Sabzi",
          ...getMacrosForPct(0.35)
        },
        dinner: {
          name: "Roti with Yellow Dal, Tofu/Chicken Stir-fry, and Cucumber salad",
          ...getMacrosForPct(0.30)
        },
        snacks: {
          name: "Boiled Eggs (or Roasted Chickpeas) and an Apple",
          ...getMacrosForPct(0.10)
        }
      };
    }

    return NextResponse.json({
      success: true,
      plan
    });

  } catch (error: any) {
    console.error("AI Meal Planner Route Error:", error);
    return NextResponse.json(
      { success: false, error: "Meal planning engine failed. Please try again." },
      { status: 500 }
    );
  }
}
