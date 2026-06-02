/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// JSON schema for Gemini structured output
const insightsSchema: any = {
  type: "object",
  properties: {
    nutritionScore: {
      type: "integer",
      description: "A dynamic score from 0 to 100 representing how well the user is meeting their daily calorie and macro goals."
    },
    nutritionLabel: {
      type: "string",
      description: "Label representing the nutrition score: 'Excellent' (score >= 85), 'Good' (score >= 60 and < 85), 'Needs Improvement' (score < 60)."
    },
    topRecommendation: {
      type: "string",
      description: "The single most important recommendation for the user based on their current logs."
    },
    macroAlert: {
      type: "string",
      description: "An alert about carbs, fat, sugar or calorie excess/deficit, or 'No alerts today. Great balance!' if everything is good."
    },
    hydrationReminder: {
      type: "string",
      description: "A helpful custom hydration suggestion or reminder."
    },
    proteinReminder: {
      type: "string",
      description: "Advice on protein intake based on how much is consumed vs target."
    },
    dailySummary: {
      type: "string",
      description: "A summary paragraph describing their logged meals and energy intake so far."
    },
    doingWell: {
      type: "string",
      description: "What the user did well today (e.g. hitting protein targets, eating balanced meals)."
    },
    nutrientsLacking: {
      type: "string",
      description: "Nutrients or macros that are currently lacking today."
    },
    nutrientsExcessive: {
      type: "string",
      description: "Nutrients or macros that are in excess today."
    },
    recommendedNextMeal: {
      type: "string",
      description: "A detailed suggestion for their next meal to balance their remaining budget."
    },
    recommendedProteinIntake: {
      type: "string",
      description: "Recommended protein in grams for their next meal."
    },
    recommendedCalorieIntake: {
      type: "string",
      description: "Recommended calories in kcal for their next meal."
    },
    healthSuggestions: {
      type: "array",
      items: { type: "string" },
      description: "A list of 2-3 specific health suggestions for the day."
    }
  },
  required: [
    "nutritionScore",
    "nutritionLabel",
    "topRecommendation",
    "macroAlert",
    "hydrationReminder",
    "proteinReminder",
    "dailySummary",
    "doingWell",
    "nutrientsLacking",
    "nutrientsExcessive",
    "recommendedNextMeal",
    "recommendedProteinIntake",
    "recommendedCalorieIntake",
    "healthSuggestions"
  ]
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const localMidnight = searchParams.get("localMidnight");
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

    // 2. Fetch today's meals
    const today = localMidnight ? new Date(localMidnight) : new Date();
    if (!localMidnight) {
      today.setHours(0, 0, 0, 0);
    }

    const { data: todayMeals } = await supabase
      .from("meals")
      .select("food_name, meal_type, calories, protein, carbs, fat")
      .eq("user_id", user.id)
      .gte("logged_at", today.toISOString());

    // 3. Fetch streak
    const { data: streakData } = await supabase
      .from("streaks")
      .select("current_streak")
      .eq("id", user.id)
      .single();

    const currentStreak = streakData?.current_streak ?? 0;

    const consumedCalories = todayMeals?.reduce((sum, m) => sum + m.calories, 0) ?? 0;
    const consumedProtein = todayMeals?.reduce((sum, m) => sum + m.protein, 0) ?? 0;
    const consumedCarbs = todayMeals?.reduce((sum, m) => sum + m.carbs, 0) ?? 0;
    const consumedFat = todayMeals?.reduce((sum, m) => sum + m.fat, 0) ?? 0;

    const remainingCalories = Math.max(targetCalories - consumedCalories, 0);
    const remainingProtein = Math.max(targetProtein - consumedProtein, 0);
    const remainingCarbs = Math.max(targetCarbs - consumedCarbs, 0);
    const remainingFat = Math.max(targetFat - consumedFat, 0);

    // Format list of meals today for prompt
    const loggedMealsText = todayMeals && todayMeals.length > 0
      ? todayMeals.map(m => `- ${m.food_name} (${m.meal_type}): ${m.calories} kcal (P: ${m.protein}g, C: ${m.carbs}g, F: ${m.fat}g)`).join("\n")
      : "No meals logged today yet.";

    let responseText = "";

    if (genAI) {
      const systemPrompt = `
You are an expert AI Nutrition Coach. Analyze the user's daily goals, current logs, and current streak to generate structured insights and a nutrition score out of 100.

User Information and Targets:
- Daily Calorie Target: ${targetCalories} kcal
- Daily Protein Target: ${targetProtein}g
- Daily Carbs Target: ${targetCarbs}g
- Daily Fat Target: ${targetFat}g

Today's Progress:
- Calories Consumed: ${consumedCalories} kcal (${remainingCalories} kcal remaining)
- Protein Consumed: ${consumedProtein}g (${remainingProtein}g remaining)
- Carbs Consumed: ${consumedCarbs}g (${remainingCarbs}g remaining)
- Fat Consumed: ${consumedFat}g (${remainingFat}g remaining)

Today's Logged Meals:
${loggedMealsText}

Current Active Logging Streak: ${currentStreak} days

Instructions:
1. Calculate a "nutritionScore" out of 100 based on their targets vs actual values. If no meals are logged, score should be 0. If meals are logged, assign a score based on calorie and macronutrient balance.
2. The "nutritionLabel" must match the score:
   - >= 85: "Excellent"
   - >= 60 and < 85: "Good"
   - < 60: "Needs Improvement"
3. Provide helpful reminders and highly personalized suggestions. Be encouraging and realistic.
4. Output MUST adhere strictly to the JSON schema.
`;

      // Try fallback models
      const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];
      let lastError: any = null;
      const maxRetries = 3;

      for (const modelName of modelsToTry) {
        let attempt = 0;
        let shouldFallback = false;

        while (attempt < maxRetries) {
          attempt++;
          try {
            console.log(`[Insights Gemini Request] Model: ${modelName} | Attempt: ${attempt}/${maxRetries}`);
            
            const model = genAI.getGenerativeModel({
              model: modelName,
              generationConfig: {
                responseMimeType: "application/json",
                responseSchema: insightsSchema,
              }
            });

            console.log(`=== BEFORE INSIGHTS GEMINI API CALL (Model: ${modelName}, Attempt: ${attempt}) ===`);
            const result = await model.generateContent(systemPrompt);
            console.log(`=== AFTER INSIGHTS GEMINI API CALL (Model: ${modelName}, Attempt: ${attempt}) ===`);
            
            responseText = result.response.text();
            if (responseText) {
              break; // Succeeded! Break the retry loop.
            }
          } catch (err: any) {
            console.log(`=== AFTER INSIGHTS GEMINI API CALL (FAILED) (Model: ${modelName}, Attempt: ${attempt}) ===`);
            console.error(`Insights Model ${modelName} failed on attempt ${attempt}. Error:`, err.message || err);
            lastError = err;

            const statusMatch = err.message ? err.message.match(/\[(\d+)\]/) : null;
            const status = err.status || err.statusCode || (statusMatch ? parseInt(statusMatch[1], 10) : null);
            
            const isFallbackEligible = !status || [429, 500, 502, 503, 504].includes(status);
            if (!isFallbackEligible) {
              shouldFallback = false;
              break;
            }
            shouldFallback = true;

            if (attempt < maxRetries) {
              const backoffMs = Math.pow(2, attempt - 1) * 1000;
              await new Promise((resolve) => setTimeout(resolve, backoffMs));
            } else {
              break;
            }
          }
        }

        if (responseText) {
          break; // Succeeded! Break the fallback loop.
        }
        if (!shouldFallback) {
          break;
        }
      }
    }

    if (responseText) {
      const insights = JSON.parse(responseText);
      return NextResponse.json({
        success: true,
        insights
      });
    }

    // Fall back to offline dynamic calculations if all else fails (e.g. no key or quota exceeded)
    throw new Error("Gemini AI Engine is currently offline or out of quota.");

  } catch (error: any) {
    console.error("AI Coach Insights Route Error:", error);

    // Calculate score dynamically offline based on Supabase DB values
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let targetCalories = 2000;
    let targetProtein = 150;
    let targetCarbs = 200;
    let targetFat = 65;

    let consumedCalories = 0;
    let consumedProtein = 0;
    let consumedCarbs = 0;
    let consumedFat = 0;
    let currentStreak = 0;
    let loggedMealsCount = 0;

    if (user) {
      const { data: goals } = await supabase.from("goals").select("*").eq("id", user.id).single();
      if (goals) {
        targetCalories = goals.calorie_target ?? goals.calories ?? 2000;
        targetProtein = goals.protein_target ?? goals.protein ?? 150;
        targetCarbs = goals.carb_target ?? goals.carbs ?? 200;
        targetFat = goals.fat_target ?? goals.fat ?? 65;
      }

      const today = localMidnight ? new Date(localMidnight) : new Date();
      if (!localMidnight) {
        today.setHours(0, 0, 0, 0);
      }
      const { data: todayMeals } = await supabase.from("meals").select("calories, protein, carbs, fat").eq("user_id", user.id).gte("logged_at", today.toISOString());
      
      if (todayMeals) {
        loggedMealsCount = todayMeals.length;
        consumedCalories = todayMeals.reduce((sum, m) => sum + m.calories, 0);
        consumedProtein = todayMeals.reduce((sum, m) => sum + m.protein, 0);
        consumedCarbs = todayMeals.reduce((sum, m) => sum + m.carbs, 0);
        consumedFat = todayMeals.reduce((sum, m) => sum + m.fat, 0);
      }

      const { data: streakData } = await supabase.from("streaks").select("current_streak").eq("id", user.id).single();
      if (streakData) {
        currentStreak = streakData.current_streak;
      }
    }

    const remainingCalories = Math.max(targetCalories - consumedCalories, 0);
    const remainingProtein = Math.max(targetProtein - consumedProtein, 0);
    const remainingCarbs = Math.max(targetCarbs - consumedCarbs, 0);
    const remainingFat = Math.max(targetFat - consumedFat, 0);

    let dynamicScore = 0;
    let dynamicLabel: "Excellent" | "Good" | "Needs Improvement" = "Needs Improvement";
    let topRecommendation = "Keep tracking your meals to get personalized coaching recommendations.";
    let macroAlert = "AI coach insights are currently offline. Check back soon!";
    let proteinReminder = "Track your meals to monitor your protein intake.";
    let doingWell = "Keep checking your macros!";
    let nutrientsLacking = "Track meals to see what you need.";
    let nutrientsExcessive = "None";
    let recommendedNextMeal = "A balanced meal with protein and complex carbs.";
    let recommendedProteinIntake = "25-35g";
    let recommendedCalorieIntake = "400-600 kcal";

    if (loggedMealsCount > 0) {
      const calorieDiff = Math.abs(consumedCalories - targetCalories);
      const calorieScore = Math.max(100 - (calorieDiff / targetCalories) * 100, 0);

      const proteinDiff = Math.abs(consumedProtein - targetProtein);
      const proteinScore = Math.max(100 - (proteinDiff / targetProtein) * 100, 0);

      const carbsDiff = Math.abs(consumedCarbs - targetCarbs);
      const carbsScore = Math.max(100 - (carbsDiff / targetCarbs) * 100, 0);

      const fatDiff = Math.abs(consumedFat - targetFat);
      const fatScore = Math.max(100 - (fatDiff / targetFat) * 100, 0);

      dynamicScore = Math.round((calorieScore * 0.4) + (proteinScore * 0.3) + (carbsScore * 0.15) + (fatScore * 0.15));

      if (dynamicScore >= 85) {
        dynamicLabel = "Excellent";
      } else if (dynamicScore >= 60) {
        dynamicLabel = "Good";
      } else {
        dynamicLabel = "Needs Improvement";
      }

      if (consumedCalories < targetCalories) {
        topRecommendation = `You are currently ${targetCalories - consumedCalories} kcal under your calorie target. Focus on nutrient-dense foods to close the gap.`;
      } else {
        topRecommendation = `You have reached your daily calorie target of ${targetCalories} kcal. Prioritize lean protein and leafy greens to keep macros balanced.`;
      }

      if (remainingProtein > 20) {
        proteinReminder = `You need ${remainingProtein}g more protein today to hit your muscle-building target.`;
        recommendedNextMeal = "Grilled chicken breast or paneer stir-fry with quinoa.";
        recommendedProteinIntake = `${Math.min(remainingProtein, 35)}g`;
        recommendedCalorieIntake = "350-500 kcal";
      } else {
        proteinReminder = "Excellent work on hitting your protein target today!";
        recommendedNextMeal = "A light dinner with salmon, mixed salad, and avocado.";
        recommendedProteinIntake = "15-25g";
        recommendedCalorieIntake = "300-450 kcal";
      }

      if (consumedCarbs > targetCarbs) {
        macroAlert = `Carbohydrates are slightly high (+${consumedCarbs - targetCarbs}g). Try restricting starches for the rest of the day.`;
        nutrientsExcessive = `Carbs (+${consumedCarbs - targetCarbs}g)`;
      } else if (consumedFat > targetFat) {
        macroAlert = `Fats are slightly high (+${consumedFat - targetFat}g). Limit heavy oils and cheeses tonight.`;
        nutrientsExcessive = `Fat (+${consumedFat - targetFat}g)`;
      } else {
        macroAlert = "Your macronutrients are exceptionally balanced today. Great job!";
      }

      doingWell = consumedProtein >= targetProtein * 0.8
        ? "You did an excellent job focusing on protein-dense foods today."
        : "You started tracking your food logs early and logged multiple items.";

      nutrientsLacking = `${remainingProtein > 0 ? `${remainingProtein}g protein, ` : ""}${remainingCarbs > 0 ? `${remainingCarbs}g carbs, ` : ""}${remainingFat > 0 ? `${remainingFat}g fat` : ""}`.replace(/,\s*$/, "");
      if (!nutrientsLacking) nutrientsLacking = "None";
    } else {
      topRecommendation = "Start logging your meals today to get personalized recommendations and macro assessments.";
      proteinReminder = "Track your meals to see protein recommendations.";
    }

    const dailySummary = loggedMealsCount > 0
      ? `So far today, you have logged ${loggedMealsCount} meal(s) totaling ${consumedCalories} kcal out of your ${targetCalories} kcal budget. Your macros are currently: Protein: ${consumedProtein}g/${targetProtein}g, Carbs: ${consumedCarbs}g/${targetCarbs}g, Fat: ${consumedFat}g/${targetFat}g.`
      : "No food logs found for today. Once you add items to your diary, your dynamic nutritional summary will render here.";

    return NextResponse.json({
      success: false,
      error: "Unable to reach AI Coach. Using offline calculation.",
      insights: {
        nutritionScore: dynamicScore,
        nutritionLabel: dynamicLabel,
        topRecommendation,
        macroAlert,
        hydrationReminder: "Drink water regularly throughout the day. Aim for 8-12 glasses.",
        proteinReminder,
        dailySummary,
        doingWell,
        nutrientsLacking,
        nutrientsExcessive,
        recommendedNextMeal,
        recommendedProteinIntake,
        recommendedCalorieIntake,
        healthSuggestions: [
          "Drink 8-10 glasses of water.",
          "Aim for a balance of protein, carbs, and fats in every meal.",
          "Keep logging consistent to establish habits."
        ]
      }
    });
  }
}
