export interface HealthScoreBreakdown {
  healthScore: number;
  nutrition: number;
  protein: number;
  consistency: number;
  streakScore: number;
  explanation: string;
  tips: string[];
}

export function calculateHealthScore(
  meals: any[],
  goals: { calories: number; protein: number; carbs: number; fat: number },
  streak: number,
  clientTimeZone: string = "UTC"
): HealthScoreBreakdown {
  const targetCalories = goals?.calories ?? 2000;
  const targetProtein = goals?.protein ?? 150;

  // 1. Group meals by date (YYYY-MM-DD) in user's timezone
  const todayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: clientTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const getLocalDateStr = (date: Date) => {
    try {
      const parts = todayFormatter.formatToParts(date);
      const year = parts.find(p => p.type === "year")?.value;
      const month = parts.find(p => p.type === "month")?.value;
      const day = parts.find(p => p.type === "day")?.value;
      return `${year}-${month}-${day}`;
    } catch (e) {
      return date.toISOString().split("T")[0];
    }
  };

  // Group meals by local date
  const mealsByDate: { [key: string]: { calories: number; protein: number } } = {};
  
  // Initialize last 7 days
  const last7Days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = getLocalDateStr(d);
    last7Days.push(dateStr);
    mealsByDate[dateStr] = { calories: 0, protein: 0 };
  }

  // Populate meals
  meals.forEach((m) => {
    const dateStr = getLocalDateStr(new Date(m.logged_at));
    if (mealsByDate[dateStr] !== undefined) {
      mealsByDate[dateStr].calories += m.calories || 0;
      mealsByDate[dateStr].protein += m.protein || 0;
    }
  });

  // Calculate daily scores
  let calorieScoresSum = 0;
  let proteinScoresSum = 0;
  let activeLoggingDaysCount = 0;

  last7Days.forEach((dateStr) => {
    const dayData = mealsByDate[dateStr];
    if (dayData.calories > 0 || dayData.protein > 0) {
      activeLoggingDaysCount++;
      
      // Calorie score: 100 - % difference from target
      const calDiff = Math.abs(dayData.calories - targetCalories);
      const calScore = Math.max(0, 100 - (calDiff / targetCalories) * 100);
      calorieScoresSum += calScore;

      // Protein score: % of target achieved (capped at 100)
      const protScore = Math.min(100, (dayData.protein / targetProtein) * 100);
      proteinScoresSum += protScore;
    }
  });

  // Averages (only average over days where user logged something to prevent double penalizing, or average over full 7 days? Let's average over days logged, but if they logged 0 days, score is 0).
  const nutritionScore = activeLoggingDaysCount > 0 ? Math.round(calorieScoresSum / activeLoggingDaysCount) : 0;
  const proteinScore = activeLoggingDaysCount > 0 ? Math.round(proteinScoresSum / activeLoggingDaysCount) : 0;
  
  // Consistency score: percentage of days logged in the last 7 days
  const consistencyScore = Math.round((activeLoggingDaysCount / 7) * 100);

  // Streak score: 10 points per day of streak, max 100
  const streakScore = Math.min(100, streak * 10);

  // Final Health Score: 40% Nutrition, 30% Protein, 15% Consistency, 15% Streak
  const finalScore = Math.round(
    (nutritionScore * 0.40) +
    (proteinScore * 0.30) +
    (consistencyScore * 0.15) +
    (streakScore * 0.15)
  );

  // Explanation and tips
  let explanation = "Your health score represents a balanced overview of your nutrition goals, protein targets, and tracking consistency.";
  const tips: string[] = [];

  if (finalScore >= 85) {
    explanation = "Excellent! You are maintaining an exceptionally healthy nutrition regimen and solid logging habits. Keep up the amazing work!";
    tips.push("Maintain your daily tracking streak to build long-term consistency.");
    tips.push("Experiment with new high-protein whole foods to keep meals exciting.");
  } else if (finalScore >= 60) {
    explanation = "Good job! You are doing well but have room for optimization in either macro adherence or logging consistency.";
    if (proteinScore < 70) {
      tips.push("Focus on adding a lean protein source (e.g. egg white, chicken breast, paneer) to your breakfast.");
    }
    if (nutritionScore < 75) {
      tips.push("Try planning your meals ahead to stay closer to your target calorie budget.");
    }
    if (consistencyScore < 80) {
      tips.push("Set a reminder on your phone to log your meals right after eating.");
    }
  } else {
    explanation = "Your health score is low. Focus on establishing a consistent meal tracking routine and meeting your macro targets.";
    tips.push("Start by logging at least one meal a day to rebuild your tracking habit.");
    tips.push("Prioritize reaching your protein goal to help support muscle recovery and satiety.");
    tips.push("Stay within ±200 calories of your daily target for better energy management.");
  }

  // Ensure default tips
  if (tips.length === 0) {
    tips.push("Drink 8-10 glasses of water daily.");
    tips.push("Stay consistent with daily logs to train the AI coach on your habits.");
  }

  return {
    healthScore: finalScore,
    nutrition: nutritionScore,
    protein: proteinScore,
    consistency: consistencyScore,
    streakScore,
    explanation,
    tips
  };
}
