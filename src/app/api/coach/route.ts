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
      supabase.from("users").select("daily_calorie_target, protein_goal, carbs_goal, fat_goal, goal_type, age, height_cm, current_weight, target_weight, activity_level, diet_preference, medical_conditions, coach_memory").eq("id", user.id).maybeSingle(),
      supabase.from("weight_logs").select("weight, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("meals").select("food_name, meal_type, calories, protein, carbs, fat, logged_at").eq("user_id", user.id).gte("logged_at", (localMidnight ? new Date(localMidnight) : (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })()).toISOString()),
      supabase.from("meals").select("food_name, calories, protein, carbs, fat, logged_at, meal_type").eq("user_id", user.id).gte("logged_at", (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; })().toISOString()).order("logged_at", { ascending: false })
    ]);

    const profile: any = profileResult.data || {};
    const weightLogs = weightResult.data || [];
    const todayMeals = todayMealsResult.data || [];
    const recentMeals = recentMealsResult.data || [];

    const dietPreference = profile.diet_preference || "Non-Vegetarian";
    const medicalConditions = profile.medical_conditions || [];
    const savedMemory = profile.coach_memory || {};

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
      ? recentMeals.slice(0, 10).map(m => `- ${m.food_name} (${m.meal_type}): ${m.calories} kcal (P: ${m.protein}g, C: ${m.carbs}g, F: ${m.fat}g) on ${new Date(m.logged_at).toLocaleDateString()}`).join("\n")
      : "No recent meals logged.";

    const metadata = user.user_metadata || {};
    const goal = profile?.goal_type || metadata.goal || "Maintenance";
    const age = profile?.age || metadata.age || 25;
    const height = profile?.height_cm || metadata.height || 175;
    const gender = profile?.gender || metadata.gender || "male";
    const startingWeight = profile?.current_weight || metadata.starting_weight || 75;
    const targetWeight = profile?.target_weight || metadata.target_weight || 70;
    const activity = profile?.activity_level || metadata.activity || "Moderately Active";

    const currentWeight = weightLogs && weightLogs.length > 0 ? Number(weightLogs[0].weight) : startingWeight;
    const totalWeightLogs = weightLogs?.length || 0;

    // Calculate weekly weight change from logs
    let weeklyWeightChangeText = "No weight logged yet or insufficient data.";
    let weeklyPace = 0.5; // fallback pace (kg/week)
    if (weightLogs && weightLogs.length >= 2) {
      const latestW = Number(weightLogs[0].weight);
      const sevenDaysAgoTime = new Date().getTime() - 7 * 24 * 60 * 60 * 1000;
      const pastLog = weightLogs.find(wl => new Date(wl.created_at).getTime() <= sevenDaysAgoTime) || weightLogs[weightLogs.length - 1];
      if (pastLog) {
        const change = latestW - Number(pastLog.weight);
        weeklyPace = Math.abs(change);
        if (change < 0) {
          weeklyWeightChangeText = `Weight dropped ${Math.abs(change).toFixed(1)}kg this week.`;
        } else if (change > 0) {
          weeklyWeightChangeText = `Weight increased ${change.toFixed(1)}kg this week.`;
        } else {
          weeklyWeightChangeText = `Weight remained unchanged this week.`;
        }
      }
    }

    // Dynamic Behavioral Memory extraction
    const foodCounts: Record<string, number> = {};
    recentMeals.forEach((m: any) => {
      const name = m.food_name.trim();
      foodCounts[name] = (foodCounts[name] || 0) + 1;
    });
    const favoriteFoods = Object.entries(foodCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    const mealTypeCounts: Record<string, number> = {};
    recentMeals.forEach((m: any) => {
      const type = m.meal_type;
      mealTypeCounts[type] = (mealTypeCounts[type] || 0) + 1;
    });

    const dailyProtein: Record<string, number> = {};
    const todayStr = new Date().toDateString();
    recentMeals.forEach((m: any) => {
      const dateStr = new Date(m.logged_at).toDateString();
      if (dateStr !== todayStr) {
        dailyProtein[dateStr] = (dailyProtein[dateStr] || 0) + m.protein;
      }
    });
    const lowProteinDays = Object.values(dailyProtein).filter(p => p < targetProtein).length;
    const totalDaysLogged = Object.keys(dailyProtein).length;
    const proteinStrugglesText = totalDaysLogged > 0 && (lowProteinDays / totalDaysLogged) > 0.5
      ? `User struggles with hitting protein target (missed target on ${lowProteinDays}/${totalDaysLogged} logged days).`
      : `User hits protein goals regularly.`;

    // Mathematical Body Analysis calculations
    const heightM = height / 100;
    const bmi = currentWeight / (heightM * heightM);
    const healthyWeightMin = Math.round(18.5 * heightM * heightM);
    const healthyWeightMax = Math.round(24.9 * heightM * heightM);

    const heightInches = height / 2.54;
    const inchesOver5Feet = Math.max(0, heightInches - 60);
    let idealWeight = gender === "male"
      ? 50.0 + 2.3 * inchesOver5Feet
      : 45.5 + 2.3 * inchesOver5Feet;
    idealWeight = Math.round(idealWeight);

    const uBmr = 10 * currentWeight + 6.25 * height - 5 * age + (gender === "male" ? 5 : -161);
    const activityMultipliers: Record<string, number> = {
      "Sedentary": 1.2,
      "Lightly Active": 1.375,
      "Moderately Active": 1.55,
      "Very Active": 1.725,
      "Athlete": 1.9
    };
    const maintenanceCalories = Math.round(uBmr * (activityMultipliers[activity] || 1.55));
    const fatLossCalories = Math.max(1200, Math.round(maintenanceCalories - 500));
    const muscleGainCalories = Math.round(maintenanceCalories + 300);

    let calculatedProtein = Math.round(goal === "Fat Loss" ? 2.0 * currentWeight : (goal === "Muscle Gain" ? 2.2 * currentWeight : 1.8 * currentWeight));
    let calculatedFat = Math.round((targetCalories * 0.25) / 9);
    let calculatedCarbs = Math.round((targetCalories - (calculatedProtein * 4 + calculatedFat * 9)) / 4);

    let waterTarget = (35 * currentWeight) / 1000;
    if (activity === "Very Active" || activity === "Athlete") waterTarget += 1.0;
    else if (activity === "Moderately Active") waterTarget += 0.5;
    waterTarget = Number(waterTarget.toFixed(1));

    const userMessageContentLower = (userMessageContent || "").toLowerCase().trim();
    const isAnalyzeBody = userMessageContentLower === "analyze my body" || userMessageContentLower.includes("analyze my body");
    const isAnalyzeDay = userMessageContentLower === "analyze my day" || userMessageContentLower.includes("analyze my day");

    // Medical conditions adaptations
    const medicalGuidelines = [];
    if (medicalConditions.includes("Diabetes")) {
      medicalGuidelines.push("- Adapt recommendations for Diabetes: Focus on lower refined carbs, higher dietary fiber, and low GI (Glycemic Index) foods. Prioritize blood sugar stability.");
    }
    if (medicalConditions.includes("Hypertension")) {
      medicalGuidelines.push("- Adapt recommendations for Hypertension: Recommend lower sodium intake and potassium-rich foods (e.g. leafy greens, bananas, avocados).");
    }
    if (medicalConditions.includes("High Cholesterol")) {
      medicalGuidelines.push("- Adapt recommendations for High Cholesterol: Focus on reducing saturated fats and increasing soluble dietary fiber (e.g. oats, legumes, berries).");
    }
    if (medicalConditions.includes("PCOS")) {
      medicalGuidelines.push("- Adapt recommendations for PCOS: Prioritize recommendations that support stable blood sugar and insulin sensitivity (e.g., balanced meals combining protein, healthy fats, and fiber-rich slow carbs).");
    }
    if (medicalConditions.includes("Hypothyroidism")) {
      medicalGuidelines.push("- Adapt recommendations for Hypothyroidism: Recommend balanced energy distribution, ensuring adequate selenium, zinc, and iodine-dense whole food options.");
    }
    if (medicalConditions.includes("Kidney Disease")) {
      medicalGuidelines.push("- Adapt recommendations for Kidney Disease: Advise moderate, controlled protein intake to minimize kidney strain, and closely watch phosphorus and sodium levels.");
    }
    if (medicalConditions.includes("Other")) {
      medicalGuidelines.push("- Adapt recommendations: Take into account any general health conditions the user mentions, recommending clean whole foods and consulting a physician.");
    }

    const medicalGuidelinesText = medicalGuidelines.length > 0
      ? medicalGuidelines.join("\n")
      : "No specific medical conditions logged.";

    // Medical disclaimer
    const hasMedicalConditions = medicalConditions.length > 0;

    // 7. Construct dynamic system prompt with user context
    const systemPrompt = `
You are an expert AI Nutrition Coach, dietitian, and supportive fitness guide. Your goal is to help the user achieve their health, diet, and fitness goals.

Here is the current real-time health profile, nutritional context, and memory for the user:
- Profile & Goals:
  * User Email: ${user.email}
  * Age: ${age} years old
  * Gender: ${gender}
  * Height: ${height} cm
  * Current Weight: ${currentWeight ? `${currentWeight} kg` : "Not set"}
  * Target Weight: ${targetWeight ? `${targetWeight} kg` : "Not set"}
  * Activity Index: ${activity}
  * Primary Goal: ${goal}
  * Diet Preference: ${dietPreference}
  * Medical Conditions: ${medicalConditions.join(", ") || "None"}

- Medical Conditions Adaptation Guidelines (CRITICAL):
${medicalGuidelinesText}
${hasMedicalConditions ? "Always append the medical disclaimer exactly at the very end of your response." : ""}

- Dynamically Analyzed Long-Term Memory (Behavior Logs):
  * Favorite Foods: ${favoriteFoods.join(", ") || "None"}
  * Protein Struggles Context: ${proteinStrugglesText}
  * Weight Progress Trend: ${weeklyWeightChangeText}
  * Conversation History Memory: ${JSON.stringify(savedMemory.history_notes || "None")}
  * User specific memory notes: ${JSON.stringify(savedMemory.user_notes || "None")}

- Mathematical calculations for user's body parameters (Mifflin MSJ):
  * BMI: ${bmi.toFixed(1)}
  * Healthy Weight Range: ${healthyWeightMin} - ${healthyWeightMax} kg
  * Ideal Weight Estimate: ${idealWeight} kg
  * Maintenance Calories (TDEE): ${maintenanceCalories} kcal/day
  * Fat Loss Calories Target: ${fatLossCalories} kcal/day
  * Muscle Gain Calories Target: ${muscleGainCalories} kcal/day
  * Custom target calories: ${targetCalories} kcal
  * Macro Targets: Protein: ${calculatedProtein}g, Carbs: ${calculatedCarbs}g, Fat: ${calculatedFat}g
  * Water Intake Target: ${waterTarget}L/day

- Today's Consumed Totals:
  * Calories: ${consumedCalories} kcal (${remainingCalories} kcal remaining)
  * Protein: ${consumedProtein}g (${remainingProtein}g remaining)
  * Carbs: ${consumedCarbs}g (${remainingCarbs}g remaining)
  * Fat: ${consumedFat}g (${remainingFat}g remaining)

- Today's Logged Meals:
${todayMeals && todayMeals.length > 0 
  ? todayMeals.map(m => `  * ${m.food_name} (${m.meal_type}): ${m.calories} kcal (P: ${m.protein}g, C: ${m.carbs}g, F: ${m.fat}g)`).join("\n")
  : "  * No meals logged today yet."}

- Recent Logs (Past 30 Days):
${recentMealsText}

Instruction Guidelines:
1. Provide highly personalized, actionable advice based on the user's goals, remaining macro targets, diet preference, medical conditions, and recent eating patterns.
2. Be supportive, concise, energetic, and professional. Do not diagnose disease or prescribe treatments.
3. If they ask "Analyze my body" (or click the Analyze My Body button), calculate and explain: BMI, healthy weight range, ideal weight, maintenance calories, fat loss calories, muscle gain calories, protein/carb/fat targets, and water intake. And include the custom weight and forecast visual card JSON blocks.
4. To show visual progress, you MUST include one or more custom JSON code blocks in your responses when relevant to the user's query:

   - **Protein progress card** (when user is short of protein, asks about protein, or logs protein-heavy foods):
\`\`\`card-protein
{
  "current": ${consumedProtein},
  "target": ${targetProtein},
  "need": ${remainingProtein},
  "sources": ["Chicken Breast", "Greek Yogurt", "Whey Protein"]
}
\`\`\`

   - **Weight Goal card** (when body analysis is triggered, or user asks about weight progress):
\`\`\`card-weight
{
  "current": ${currentWeight},
  "target": ${targetWeight},
  "pace": ${weeklyPace.toFixed(1)},
  "weeks": ${goal === "Fat Loss" ? Math.max(1, Math.ceil(Math.abs(currentWeight - targetWeight) / 0.5)) : Math.max(1, Math.ceil(Math.abs(currentWeight - targetWeight) / 0.25))}
}
\`\`\`

   - **Nutrition progress card** (when user asks "Analyze my day" or asks about remaining calories/macros):
\`\`\`card-nutrition
{
  "calories": ${consumedCalories},
  "caloriesTarget": ${targetCalories},
  "protein": ${consumedProtein},
  "proteinTarget": ${targetProtein},
  "carbs": ${consumedCarbs},
  "carbsTarget": ${targetCarbs},
  "fat": ${consumedFat},
  "fatTarget": ${targetFat}
}
\`\`\`

   - **Progress Forecast card** (when user triggers "Analyze my body", or asks about weight predictions/forecasts):
\`\`\`card-forecast
{
  "trend": ${goal === "Fat Loss" ? -0.5 : (goal === "Muscle Gain" ? 0.25 : 0)},
  "days30": ${goal === "Fat Loss" ? (currentWeight - 2).toFixed(1) : (goal === "Muscle Gain" ? (currentWeight + 1).toFixed(1) : currentWeight.toFixed(1))},
  "days60": ${goal === "Fat Loss" ? (currentWeight - 4).toFixed(1) : (goal === "Muscle Gain" ? (currentWeight + 2).toFixed(1) : currentWeight.toFixed(1))},
  "days90": ${goal === "Fat Loss" ? (currentWeight - 6).toFixed(1) : (goal === "Muscle Gain" ? (currentWeight + 3).toFixed(1) : currentWeight.toFixed(1))}
}
\`\`\`

5. Respond using clean markdown. Surround the custom cards in the triple backtick tags as shown above. The UI will parse and render them.
6. If the user has a medical condition, ALWAYS append this exact disclaimer at the end:
"Educational guidance only. Not medical advice. Consult a healthcare professional for diagnosis or treatment."
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

        // Analyze conversation and update coach memory (Phase 5)
        try {
          const updatedMemory = { ...savedMemory };
          const msg = userMessageContentLower;
          if (msg.includes("vegetarian")) {
            updatedMemory.diet_preference = "Vegetarian";
          } else if (msg.includes("vegan")) {
            updatedMemory.diet_preference = "Vegan";
          } else if (msg.includes("keto")) {
            updatedMemory.diet_preference = "Keto";
          } else if (msg.includes("low carb")) {
            updatedMemory.diet_preference = "Low Carb";
          }
          
          const foodKeywords = ["love", "like", "favorite food", "prefer"];
          foodKeywords.forEach(keyword => {
            if (msg.includes(keyword)) {
              const foods = ["salmon", "chicken", "eggs", "tofu", "paneer", "steak", "rice", "sweet potato", "greek yogurt", "protein shake", "oats"];
              foods.forEach(f => {
                if (msg.includes(f)) {
                  if (!updatedMemory.favorite_foods) updatedMemory.favorite_foods = [];
                  if (!updatedMemory.favorite_foods.includes(f)) {
                    updatedMemory.favorite_foods.push(f);
                  }
                }
              });
            }
          });

          if (msg.includes("struggle with protein") || msg.includes("hard to get protein") || msg.includes("too much protein") || msg.includes("protein is hard")) {
            updatedMemory.protein_struggles = "User reports finding it difficult to hit daily protein targets.";
          }

          // Also store a short summary or last topic notes
          if (!updatedMemory.history_notes) updatedMemory.history_notes = [];
          const dateStr = new Date().toLocaleDateString();
          updatedMemory.history_notes.push(`Chatted about: "${userMessageContent.slice(0, 50)}..." on ${dateStr}`);
          if (updatedMemory.history_notes.length > 5) {
            updatedMemory.history_notes = updatedMemory.history_notes.slice(-5); // keep last 5 notes
          }

          // Save memory back to Supabase users table
          const { error: memErr } = await supabase
            .from("users")
            .update({ coach_memory: updatedMemory })
            .eq("id", user.id);
          if (memErr) {
            console.error("Failed to update coach memory in DB:", memErr);
          }
        } catch (memEx) {
          console.error("Memory saving exception:", memEx);
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
