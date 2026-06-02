import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const grocerySchema: any = {
  type: "object",
  properties: {
    categories: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          items: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["name", "items"]
      }
    },
    reasoning: { type: "string" }
  },
  required: ["categories", "reasoning"]
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

    // Fetch user goals
    const { data: goals } = await supabase
      .from("goals")
      .select("*")
      .eq("id", user.id)
      .single();

    const targetCalories = goals?.calorie_target ?? goals?.calories ?? 2000;
    const targetProtein = goals?.protein_target ?? goals?.protein ?? 150;
    const targetCarbs = goals?.carb_target ?? goals?.carbs ?? 200;
    const targetFat = goals?.fat_target ?? goals?.fat ?? 65;

    let groceryList: any = null;

    if (genAI) {
      const prompt = `
You are an expert AI Nutritionist. Generate a structured grocery shopping list optimized for the user's personal daily fitness and macronutrient targets.

User Daily Goals:
- Calories: ${targetCalories} kcal
- Protein: ${targetProtein}g
- Carbs: ${targetCarbs}g
- Fat: ${targetFat}g

Instructions:
1. Divide the items into logical categories such as: Proteins, Carbohydrates, Fruits & Vegetables, Healthy Fats, and Pantry Staples.
2. Focus on clean, wholesome options (such as lean chicken, fish, eggs, tofu, paneer, oats, quinoa, brown rice, broccoli, spinach, almonds, olive oil, etc.).
3. Tailor the items to fit the high-protein/low-fat/balanced macros specified by the goals. If their protein goal is high, suggest additional protein-dense foods.
4. Give a short reasoning paragraph explaining how this grocery list supports their targets.
5. Output MUST strictly match the requested JSON schema.
`;

      const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];
      for (const modelName of modelsToTry) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: grocerySchema,
            }
          });
          const result = await model.generateContent(prompt);
          const text = result.response.text();
          if (text) {
            groceryList = JSON.parse(text);
            break;
          }
        } catch (err) {
          console.error(`Gemini grocery model ${modelName} failed:`, err);
        }
      }
    }

    // Fallback if AI fails
    if (!groceryList) {
      groceryList = {
        categories: [
          {
            name: "Proteins",
            items: [
              "Chicken breast or Lean turkey",
              "Wild-caught salmon or white fish",
              "Eggs or Liquid egg whites",
              "Low-fat paneer or Tofu",
              "Greek yogurt (unsweetened)",
              "Whey or plant-based protein powder"
            ]
          },
          {
            name: "Carbohydrates & Fibers",
            items: [
              "Rolled oats",
              "Brown rice or Quinoa",
              "Sweet potatoes",
              "Whole wheat roti/bread",
              "Lentils / Dal / Chickpeas"
            ]
          },
          {
            name: "Fruits & Vegetables",
            items: [
              "Spinach, kale, and mixed salad greens",
              "Broccoli and Brussels sprouts",
              "Bananas (great for pre-workout)",
              "Apples and mixed berries",
              "Cucumbers, tomatoes, and bell peppers"
            ]
          },
          {
            name: "Healthy Fats",
            items: [
              "Raw almonds or Walnuts",
              "Chia seeds or Flaxseeds",
              "Extra virgin olive oil",
              "Avocado"
            ]
          }
        ],
        reasoning: `Based on your daily goal of ${targetProtein}g protein and ${targetCalories} kcal, this grocery list focuses heavily on lean proteins, fiber-rich complex carbohydrates, and essential healthy fats to sustain your energy and support muscle synthesis.`
      };
    }

    return NextResponse.json({
      success: true,
      groceryList
    });

  } catch (error: any) {
    console.error("AI Grocery List Route Error:", error);
    return NextResponse.json(
      { success: false, error: "Grocery engine failed. Please try again." },
      { status: 500 }
    );
  }
}
