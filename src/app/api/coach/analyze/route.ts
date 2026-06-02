import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const analysisSchema: any = {
  type: "object",
  properties: {
    strengths: {
      type: "array",
      items: { type: "string" },
      description: "List of 2-3 dietary strengths today."
    },
    weaknesses: {
      type: "array",
      items: { type: "string" },
      description: "List of 2-3 dietary weaknesses today."
    },
    macroAssessment: {
      type: "string",
      description: "Assessment of macronutrients (protein, carbs, fat)."
    },
    calorieAssessment: {
      type: "string",
      description: "Assessment of calorie intake relative to target."
    },
    nextMealRecommendation: {
      type: "string",
      description: "Personalized next meal recommendation based on remaining goals."
    },
    actionablePlan: {
      type: "array",
      items: { type: "string" },
      description: "List of 2-3 concrete actionable steps for the next day."
    }
  },
  required: [
    "strengths",
    "weaknesses",
    "macroAssessment",
    "calorieAssessment",
    "nextMealRecommendation",
    "actionablePlan"
  ]
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

    const body = await request.json();
    const { localMidnight } = body;

    // Get today's range in UTC
    const today = localMidnight ? new Date(localMidnight) : new Date();
    if (!localMidnight) {
      today.setHours(0, 0, 0, 0);
    }

    // Get date string (YYYY-MM-DD)
    const todayStr = today.toISOString().split("T")[0];

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

    // 2. Fetch today's meals
    const { data: todayMeals } = await supabase
      .from("meals")
      .select("food_name, meal_type, calories, protein, carbs, fat")
      .eq("user_id", user.id)
      .gte("logged_at", today.toISOString());

    const consumedCalories = todayMeals?.reduce((sum, m) => sum + m.calories, 0) ?? 0;
    const consumedProtein = todayMeals?.reduce((sum, m) => sum + m.protein, 0) ?? 0;
    const consumedCarbs = todayMeals?.reduce((sum, m) => sum + m.carbs, 0) ?? 0;
    const consumedFat = todayMeals?.reduce((sum, m) => sum + m.fat, 0) ?? 0;

    const remainingCalories = Math.max(targetCalories - consumedCalories, 0);
    const remainingProtein = Math.max(targetProtein - consumedProtein, 0);
    const remainingCarbs = Math.max(targetCarbs - consumedCarbs, 0);
    const remainingFat = Math.max(targetFat - consumedFat, 0);

    const loggedMealsText = todayMeals && todayMeals.length > 0
      ? todayMeals.map(m => `- ${m.food_name} (${m.meal_type}): ${m.calories} kcal (P: ${m.protein}g, C: ${m.carbs}g, F: ${m.fat}g)`).join("\n")
      : "No meals logged today yet.";

    let analysis: any = null;

    if (genAI) {
      const prompt = `
You are an expert AI Dietitian and Nutrition Analyst. Analyze the user's daily goals, current logs, and consumed macronutrients to generate a detailed daily diet analysis.

Daily Goals:
- Calorie Goal: ${targetCalories} kcal
- Protein Goal: ${targetProtein}g
- Carbs Goal: ${targetCarbs}g
- Fat Goal: ${targetFat}g

Today's Progress:
- Calories Consumed: ${consumedCalories} kcal (${remainingCalories} kcal remaining)
- Protein Consumed: ${consumedProtein}g (${remainingProtein}g remaining)
- Carbs Consumed: ${consumedCarbs}g (${remainingCarbs}g remaining)
- Fat Consumed: ${consumedFat}g (${remainingFat}g remaining)

Today's Logged Meals:
${loggedMealsText}

Instructions:
1. Provide 2-3 specific strengths of today's diet (e.g. hit protein target, stayed under fat limit, ate a balanced breakfast).
2. Provide 2-3 specific weaknesses of today's diet (e.g. low protein intake, exceeded carb limit, skipped breakfast, didn't track meals).
3. Evaluate their macronutrient balance (protein, carbs, fat) and how it affects their health/muscle targets.
4. Evaluate their calorie budget adherence.
5. Suggest a next meal or snack that perfectly balances their remaining calorie/macro budget for the day.
6. Provide a list of 2-3 actionable improvement steps for tomorrow (e.g. increase lean protein sources, limit refined sugars, plan meals ahead).
7. Output MUST strictly match the requested JSON schema.
`;

      const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];
      for (const modelName of modelsToTry) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: analysisSchema,
            }
          });
          const result = await model.generateContent(prompt);
          const text = result.response.text();
          if (text) {
            analysis = JSON.parse(text);
            break;
          }
        } catch (err) {
          console.error(`Gemini analysis model ${modelName} failed:`, err);
        }
      }
    }

    // Fallback to offline rule-based analysis if AI is busy
    if (!analysis) {
      const strengths = [];
      const weaknesses = [];
      let macroAssessment = "";
      let calorieAssessment = "";
      let nextMealRecommendation = "";
      const actionablePlan = [];

      if (todayMeals && todayMeals.length > 0) {
        // Strengths
        if (consumedProtein >= targetProtein * 0.8) {
          strengths.push("Excellent work meeting your daily protein targets.");
        } else {
          strengths.push("Good effort logging your meals to track your nutrition progress.");
        }
        if (consumedFat <= targetFat) {
          strengths.push("Successfully stayed within your fat budget today.");
        }

        // Weaknesses
        if (consumedProtein < targetProtein * 0.6) {
          weaknesses.push("Protein intake is currently below optimal muscle recovery levels.");
        }
        if (consumedCalories > targetCalories) {
          weaknesses.push("Total calorie consumption has exceeded your daily target.");
        } else if (consumedCalories < targetCalories * 0.6) {
          weaknesses.push("Calories are significantly below target, focus on healthy calorie density.");
        }

        // Assessments
        macroAssessment = `Macros Consumed today: Protein: ${consumedProtein}g/${targetProtein}g, Carbs: ${consumedCarbs}g/${targetCarbs}g, Fat: ${consumedFat}g/${targetFat}g. ${
          consumedProtein < targetProtein ? "Focus on increasing lean protein." : "Macronutrient balance looks good!"
        }`;

        calorieAssessment = `You consumed ${consumedCalories} kcal out of a ${targetCalories} kcal budget. ${
          remainingCalories > 0 ? `You have ${remainingCalories} kcal left for the day.` : `You are over budget by ${consumedCalories - targetCalories} kcal.`
        }`;

        // Recommendations
        if (remainingProtein > 20) {
          nextMealRecommendation = "A high-protein, low-fat snack such as Greek yogurt, boiled egg whites, or a whey protein shake.";
        } else {
          nextMealRecommendation = "A balanced plate of baked salmon or grilled tofu with mixed green salad and avocado.";
        }

        // Actionable Plan
        actionablePlan.push("Plan your lunch or dinner protein portion ahead of time tomorrow.");
        actionablePlan.push("Add a serving of green leafy vegetables to your main meals.");
      } else {
        strengths.push("Ready to start tracking logs.");
        weaknesses.push("No meals logged for today yet.");
        macroAssessment = "No macro logs found for today.";
        calorieAssessment = `Total intake is 0 kcal out of a ${targetCalories} kcal budget.`;
        nextMealRecommendation = "A balanced breakfast such as oatmeal with scoop of protein powder, banana, and almonds.";
        actionablePlan.push("Log your breakfast first thing in the morning to start your tracking habit.");
        actionablePlan.push("Incorporate a source of protein in every meal tomorrow.");
      }

      analysis = {
        strengths,
        weaknesses,
        macroAssessment,
        calorieAssessment,
        nextMealRecommendation,
        actionablePlan
      };
    }

    // 3. Save to Supabase
    const { error: dbError } = await supabase
      .from("diet_analyses")
      .upsert({
        user_id: user.id,
        analysis_date: todayStr,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        macro_assessment: analysis.macroAssessment,
        calorie_assessment: analysis.calorieAssessment,
        next_meal_recommendation: analysis.nextMealRecommendation,
        actionable_plan: analysis.actionablePlan,
        created_at: new Date().toISOString()
      }, { onConflict: "user_id, analysis_date" });

    if (dbError) {
      console.error("Failed to save diet analysis to database:", dbError);
    }

    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error: any) {
    console.error("AI Diet Analyzer Route Error:", error);
    return NextResponse.json(
      { success: false, error: "Analysis engine failed. Please try again." },
      { status: 500 }
    );
  }
}
