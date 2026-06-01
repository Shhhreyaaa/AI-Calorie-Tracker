import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Gemini client setup
    if (!genAI) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY environment variable is not configured." },
        { status: 500 }
      );
    }

    // 2. Authenticate user via Supabase server-side client
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to chat with your coach." },
        { status: 401 }
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request. Message history is required." },
        { status: 400 }
      );
    }

    // 4. Query user goals
    const { data: goals } = await supabase
      .from("goals")
      .select("*")
      .eq("id", user.id)
      .single();

    const targetCalories = goals?.calories ?? 2000;
    const targetProtein = goals?.protein ?? 150;
    const targetCarbs = goals?.carbs ?? 200;
    const targetFat = goals?.fat ?? 65;

    // 5. Query today's meals to calculate daily totals
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayMeals } = await supabase
      .from("meals")
      .select("*")
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

    // 6. Query recent meal logs (last 7 days) for context
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentMeals } = await supabase
      .from("meals")
      .select("food_name, calories, protein, carbs, fat, logged_at, meal_type")
      .eq("user_id", user.id)
      .gte("logged_at", sevenDaysAgo.toISOString())
      .order("logged_at", { ascending: false });

    // Format recent meals list for the prompt
    const recentMealsText = recentMeals && recentMeals.length > 0
      ? recentMeals.map(m => `- ${m.food_name} (${m.meal_type}): ${m.calories} kcal (P: ${m.protein}g, C: ${m.carbs}g, F: ${m.fat}g) on ${new Date(m.logged_at).toLocaleDateString()}`).join("\n")
      : "No recent meals logged in the last 7 days.";

    // 7. Construct dynamic system prompt with user context
    const systemPrompt = `
You are an expert AI Nutrition Coach, dietitian, and supportive fitness guide. Your goal is to help the user achieve their health and calorie goals.

Here is the current real-time nutritional context for the user:
- User Email: ${user.email}
- Daily Goal Targets:
  * Calories: ${targetCalories} kcal
  * Protein: ${targetProtein}g
  * Carbs: ${targetCarbs}g
  * Fat: ${targetFat}g

- Today's Consumed Totals:
  * Calories: ${consumedCalories} kcal (${remainingCalories} kcal remaining)
  * Protein: ${consumedProtein}g (${remainingProtein}g remaining)
  * Carbs: ${consumedCarbs}g (${remainingCarbs}g remaining)
  * Fat: ${consumedFat}g (${remainingFat}g remaining)

- Today's Logged Meals:
${todayMeals && todayMeals.length > 0 
  ? todayMeals.map(m => `  * ${m.food_name} (${m.meal_type}): ${m.calories} kcal (P: ${m.protein}g, C: ${m.carbs}g, F: ${m.fat}g)`).join("\n")
  : "  * No meals logged today yet."}

- Recent Logs (Past 7 Days):
${recentMealsText}

Instruction Guidelines:
1. Provide highly personalized, actionable advice based on the user's goals, remaining macro targets, and recent eating patterns.
2. Be supportive, concise, energetic, and professional.
3. If they ask about hitting protein, suggest specific high-protein foods or snacks that fit their remaining calorie/fat budgets.
4. If they ask if they are eating enough, evaluate their calorie targets vs actual intake, and comment on nutritional density.
5. If they ask for dinner/meal suggestions, look at what they have already eaten today and suggest a meal that balances out their remaining macros. For example, if they are low on protein and high on carbs, suggest a high-protein, low-carb meal.
6. Keep recommendations realistic, focusing on whole foods.
7. Respond using clean, simple markdown. Do not include markdown code block syntax around the entire text, just normal text styling.
`;

    // 8. Call Gemini client
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt,
    });

    // Format chat history for Google Generative AI SDK
    // SDK expects: { role: 'user'|'model', parts: [{ text: string }] }[]
    const chatHistory = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // Separate history from the latest message
    const latestMessage = chatHistory[chatHistory.length - 1];
    const historicalMessages = chatHistory.slice(0, -1);

    const chat = model.startChat({
      history: historicalMessages,
    });

    const result = await chat.sendMessage(latestMessage.parts[0].text);
    const responseText = result.response.text();

    return NextResponse.json({
      success: true,
      reply: responseText,
    });

  } catch (error: any) {
    console.error("AI Coach API Route Error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred in the coach api." },
      { status: 500 }
    );
  }
}
