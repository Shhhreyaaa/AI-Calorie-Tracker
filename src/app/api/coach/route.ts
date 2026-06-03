import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(request: NextRequest) {
  try {
    if (!genAI) {
      console.warn("GEMINI_API_KEY environment variable is not configured. Proceeding to offline mode.");
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
    const { messages, localMidnight } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request. Message history is required." },
        { status: 400 }
      );
    }

    // Save the user's latest message to the database
    const userMessageContent = messages[messages.length - 1]?.content;
    if (userMessageContent) {
      const { error: dbInsertErr } = await supabase
        .from("coach_messages")
        .insert({
          user_id: user.id,
          role: "user",
          message: userMessageContent
        });
      if (dbInsertErr) {
        console.error("Failed to insert user message to DB:", dbInsertErr);
      }
    }

    // Fetch profile, weight logs, and meals in parallel using Promise.all to optimize performance
    const [profileResult, weightResult, todayMealsResult, recentMealsResult] = await Promise.all([
      supabase.from("users").select("daily_calorie_target, protein_goal, carbs_goal, fat_goal, goal_type, age, height_cm, current_weight, target_weight, activity_level").eq("id", user.id).maybeSingle(),
      supabase.from("weight_logs").select("weight, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("meals").select("food_name, meal_type, calories, protein, carbs, fat").eq("user_id", user.id).gte("logged_at", (localMidnight ? new Date(localMidnight) : (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })()).toISOString()),
      supabase.from("meals").select("food_name, calories, protein, carbs, fat, logged_at, meal_type").eq("user_id", user.id).gte("logged_at", (() => { const d = new Date(); d.setDate(d.getDate() - 7); return d; })().toISOString()).order("logged_at", { ascending: false })
    ]);

    const profile = profileResult.data;
    const weightLogs = weightResult.data;
    const todayMeals = todayMealsResult.data;
    const recentMeals = recentMealsResult.data;

    // Fallback logic for legacy goals if profile doesn't have targets
    let targetCalories = profile?.daily_calorie_target;
    let targetProtein = profile?.protein_goal;
    let targetCarbs = profile?.carbs_goal;
    let targetFat = profile?.fat_goal;

    if (targetCalories === undefined || targetCalories === null) {
      const { data: legacyGoal } = await supabase.from("goals").select("*").eq("id", user.id).maybeSingle();
      targetCalories = legacyGoal?.calorie_target ?? legacyGoal?.calories ?? 2000;
      targetProtein = legacyGoal?.protein_target ?? legacyGoal?.protein ?? 150;
      targetCarbs = legacyGoal?.carb_target ?? legacyGoal?.carbs ?? 200;
      targetFat = legacyGoal?.fat_target ?? legacyGoal?.fat ?? 65;
    }

    const consumedCalories = todayMeals?.reduce((sum, m) => sum + m.calories, 0) ?? 0;
    const consumedProtein = todayMeals?.reduce((sum, m) => sum + m.protein, 0) ?? 0;
    const consumedCarbs = todayMeals?.reduce((sum, m) => sum + m.carbs, 0) ?? 0;
    const consumedFat = todayMeals?.reduce((sum, m) => sum + m.fat, 0) ?? 0;

    const remainingCalories = Math.max(targetCalories - consumedCalories, 0);
    const remainingProtein = Math.max(targetProtein - consumedProtein, 0);
    const remainingCarbs = Math.max(targetCarbs - consumedCarbs, 0);
    const remainingFat = Math.max(targetFat - consumedFat, 0);

    // Format recent meals list for the prompt
    const recentMealsText = recentMeals && recentMeals.length > 0
      ? recentMeals.map(m => `- ${m.food_name} (${m.meal_type}): ${m.calories} kcal (P: ${m.protein}g, C: ${m.carbs}g, F: ${m.fat}g) on ${new Date(m.logged_at).toLocaleDateString()}`).join("\n")
      : "No recent meals logged in the last 7 days.";

    const metadata = user.user_metadata || {};
    const goal = profile?.goal_type || metadata.goal || "Not set";
    const age = profile?.age || metadata.age || "Not set";
    const height = profile?.height_cm || metadata.height || "Not set";
    const startingWeight = profile?.current_weight || metadata.starting_weight || null;
    const targetWeight = profile?.target_weight || metadata.target_weight || null;
    const activity = profile?.activity_level || metadata.activity || "Not set";

    const currentWeight = weightLogs && weightLogs.length > 0 ? Number(weightLogs[0].weight) : startingWeight;
    const totalWeightLogs = weightLogs?.length || 0;

    // Calculate exact weekly weight change
    let weeklyWeightChangeText = "No weight logged yet or insufficient data.";
    if (weightLogs && weightLogs.length >= 2) {
      const latestW = Number(weightLogs[0].weight);
      const sevenDaysAgoTime = new Date().getTime() - 7 * 24 * 60 * 60 * 1000;
      const pastLog = weightLogs.find(wl => new Date(wl.created_at).getTime() <= sevenDaysAgoTime) || weightLogs[weightLogs.length - 1];
      if (pastLog) {
        const change = latestW - Number(pastLog.weight);
        if (change < 0) {
          weeklyWeightChangeText = `Weight dropped ${Math.abs(change).toFixed(1)}kg this week.`;
        } else if (change > 0) {
          weeklyWeightChangeText = `Weight increased ${change.toFixed(1)}kg this week.`;
        } else {
          weeklyWeightChangeText = `Weight remained unchanged this week.`;
        }
      }
    }

    // Construct the protein deficit text
    const proteinDeficitText = remainingProtein > 0 
      ? `User is exactly ${remainingProtein}g short of protein today.` 
      : "User has hit their daily protein target.";

    // 7. Construct dynamic system prompt with user context
    const systemPrompt = `
You are an expert AI Nutrition Coach, dietitian, and supportive fitness guide. Your goal is to help the user achieve their health and calorie goals.

Here is the current real-time nutritional context for the user:
- User Email: ${user.email}
- Onboarding Biometrics & Goals:
  * Goal Target: ${goal}
  * Age: ${age} years old
  * Height: ${height} cm
  * Starting Weight: ${startingWeight ? `${startingWeight} kg` : "Not set"}
  * Target Weight: ${targetWeight ? `${targetWeight} kg` : "Not set"}
  * Activity Index: ${activity}
- Weight Track Trends:
  * Current Weight: ${currentWeight ? `${currentWeight} kg` : "No weight logged yet"}
  * Starting Weight: ${startingWeight ? `${startingWeight} kg` : "N/A"}
  * Logged Entries Count: ${totalWeightLogs}
  * Weight Progress: ${startingWeight && currentWeight ? `${(startingWeight - currentWeight).toFixed(1)} kg lost` : "N/A"}
  * Weekly Trend: ${weeklyWeightChangeText}

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
  * Protein Deficit Context: ${proteinDeficitText}

- Today's Logged Meals:
${todayMeals && todayMeals.length > 0 
  ? todayMeals.map(m => `  * ${m.food_name} (${m.meal_type}): ${m.calories} kcal (P: ${m.protein}g, C: ${m.carbs}g, F: ${m.fat}g)`).join("\n")
  : "  * No meals logged today yet."}

- Recent Logs (Past 7 Days):
${recentMealsText}

Instruction Guidelines:
1. Provide highly personalized, actionable advice based on the user's goals, remaining macro targets, and recent eating patterns.
2. Be supportive, concise, energetic, and professional.
3. INSTEAD OF GENERIC CHAT, provide specific, mathematically precise recommendations based on the calculations.
   - If they have a protein shortfall, tell them exactly how much they are short of, and suggest a specific food option to resolve it (e.g. "You're 22g short of protein today. Add 100g chicken breast tonight.")
   - If their weight dropped or increased, state the trend directly and give advice (e.g. "Weight dropped 0.7kg this week. Keep calories unchanged.")
4. If they ask about hitting protein, suggest specific high-protein foods or snacks that fit their remaining calorie/fat budgets.
5. If they ask if they are eating enough, evaluate their calorie targets vs actual intake, and comment on nutritional density.
6. If they ask for dinner/meal suggestions, look at what they have already eaten today and suggest a meal that balances out their remaining macros. For example, if they are low on protein and high on carbs, suggest a high-protein, low-carb meal.
7. Keep recommendations realistic, focusing on whole foods.
8. Respond using clean, simple markdown. Do not include markdown code block syntax around the entire text, just normal text styling.
`;

    // 8. Call Gemini client with fallback models and retry logic
    const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];
    const maxRetries = 3;

    // Query the database to get the actual history including the message we just inserted
    const { data: dbMessages, error: dbQueryErr } = await supabase
      .from("coach_messages")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (dbQueryErr) {
      console.error("Failed to query messages from DB:", dbQueryErr);
    }

    // Format chat history for Google Generative AI SDK
    const chatHistory = (dbMessages || []).map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.message }],
    }));

    // Separate history from the latest message (or use the last logged if history is empty)
    const latestMessage = chatHistory.length > 0 
      ? chatHistory[chatHistory.length - 1] 
      : { role: "user", parts: [{ text: userMessageContent || "" }] };
    const historicalMessages = chatHistory.length > 1 
      ? chatHistory.slice(0, -1) 
      : [];

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let streamStarted = false;
        let fullResponseText = "";
        let modelUsed = "";

        try {
          if (genAI) {
            for (const modelName of modelsToTry) {
              if (streamStarted) break;
              let attempt = 0;

              while (attempt < maxRetries) {
                attempt++;
                try {
                  console.log("-----------------------------------------");
                  console.log(`[Coach Gemini Stream Request] Model: ${modelName} | Attempt: ${attempt}/${maxRetries}`);
                  
                  const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: systemPrompt,
                  });

                  const chat = model.startChat({
                    history: historicalMessages,
                  });

                  const resultStream = await chat.sendMessageStream(latestMessage.parts[0].text);
                  
                  for await (const chunk of resultStream.stream) {
                    const text = chunk.text();
                    if (text) {
                      fullResponseText += text;
                      controller.enqueue(encoder.encode(text));
                      streamStarted = true;
                    }
                  }
                  
                  modelUsed = modelName;
                  break; // Succeeded! Break the retry loop
                } catch (err: any) {
                  console.error(`[Coach Gemini Stream Error] Model ${modelName} failed on attempt ${attempt}:`, err.message || err);
                  if (streamStarted) {
                    // Already streamed some content to client, cannot fall back or retry safely.
                    break;
                  }
                  if (attempt < maxRetries) {
                    const backoffMs = Math.pow(2, attempt - 1) * 1000;
                    await new Promise((resolve) => setTimeout(resolve, backoffMs));
                  }
                }
              }
            }
          }
        } catch (streamErr) {
          console.error("Stream reader loop error:", streamErr);
        }

        // Fallback offline response if no stream ever outputted text
        if (!fullResponseText) {
          const fallbackReply = `Hello! It looks like my AI engine is currently busy or out of quota. However, looking at your current logs:
- Consumed: ${consumedCalories} kcal / Target: ${targetCalories} kcal
- Protein: ${consumedProtein}g / Target: ${targetProtein}g
- Carbs: ${consumedCarbs}g / Target: ${targetCarbs}g
- Fat: ${consumedFat}g / Target: ${targetFat}g

Based on this, ${
            remainingProtein > 20 
              ? `I suggest focusing on protein for your next meal (you need ${remainingProtein}g more). Try adding some chicken breast, turkey, eggs, fish, paneer, or Greek yogurt to hit your target.` 
              : `your protein is looking good today! Keep up the healthy choices.`
          } Let me know if you have any questions or when my server is back online!`;

          fullResponseText = fallbackReply;
          controller.enqueue(encoder.encode(fallbackReply));
          modelUsed = "offline-fallback";
        }

        // Save final compiled reply to the database
        try {
          const { error: dbAssistantInsertErr } = await supabase
            .from("coach_messages")
            .insert({
              user_id: user.id,
              role: "assistant",
              message: fullResponseText
            });
          if (dbAssistantInsertErr) {
            console.error("Failed to insert assistant message to DB from stream:", dbAssistantInsertErr);
          }
        } catch (dbErr) {
          console.error("Database save exception from stream:", dbErr);
        }

        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });

  } catch (error: any) {
    console.error("AI Coach API Route Error:", error);
    return NextResponse.json(
      { success: false, error: "AI service is temporarily busy. Please try again in a few moments." },
      { status: 500 }
    );
  }
}
