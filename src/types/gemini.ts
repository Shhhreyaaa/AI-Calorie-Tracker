export interface GeminiAnalysisResult {
  meal_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
  ingredients: string[];
  health_score: number;
  good_for: string;
  suggestions: string[];
}

export interface AnalyzeAPIResponse {
  success: boolean;
  data?: GeminiAnalysisResult;
  error?: string;
}
