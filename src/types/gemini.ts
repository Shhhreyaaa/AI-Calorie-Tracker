export interface GeminiAnalysisResult {
  meal_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
  ingredients: string[];
}

export interface AnalyzeAPIResponse {
  success: boolean;
  data?: GeminiAnalysisResult;
  error?: string;
}
