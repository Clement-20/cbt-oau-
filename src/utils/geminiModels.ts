// Gemini Model Fallback System
// Tries multiple models in priority order to ensure service continuity

export const GEMINI_MODELS = {
  // Primary models (latest and most reliable)
  FLASH_2_0: "gemini-2.0-flash",
  PRO_1_5: "gemini-1.5-pro",
  FLASH_1_5: "gemini-1.5-flash",
  PRO_2_0: "gemini-2.0-pro",
  
  // Fallback order by use case (using only stable, available models)
  TEXT_GENERATION: [
    "gemini-2.0-flash",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-2.0-pro"
  ],
  
  VISION: [
    "gemini-2.0-flash",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-2.0-pro"
  ],
  
  JSON_OUTPUT: [
    "gemini-2.0-flash",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-2.0-pro"
  ],
  
  STREAMING: [
    "gemini-2.0-flash",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-2.0-pro"
  ]
};

export const getModelFallbacks = (useCase: string) => {
  const typeMap: Record<string, string> = {
    "text-gen": "TEXT_GENERATION",
    "vision": "VISION",
    "json": "JSON_OUTPUT",
    "stream": "STREAMING"
  };
  
  const modelType = typeMap[useCase] || "TEXT_GENERATION";
  
  if (modelType === "TEXT_GENERATION") return GEMINI_MODELS.TEXT_GENERATION;
  if (modelType === "VISION") return GEMINI_MODELS.VISION;
  if (modelType === "JSON_OUTPUT") return GEMINI_MODELS.JSON_OUTPUT;
  if (modelType === "STREAMING") return GEMINI_MODELS.STREAMING;
  
  return GEMINI_MODELS.TEXT_GENERATION;
};

export interface ModelConfig {
  model: string;
  retryCount: number;
  maxRetries?: number;
}

export class GeminiModelRotator {
  private models: string[] = [];
  private currentIndex: number = 0;
  private failedModels: Set<string> = new Set();
  private maxRetries: number = 3;

  constructor(models: string[], maxRetries: number = 3) {
    this.models = models;
    this.maxRetries = maxRetries;
  }

  // Get current model
  getCurrentModel(): string {
    return this.models[this.currentIndex];
  }

  // Try next model
  getNextModel(): string | null {
    const startIndex = this.currentIndex;
    
    while (true) {
      this.currentIndex = (this.currentIndex + 1) % this.models.length;
      const model = this.models[this.currentIndex];
      
      if (!this.failedModels.has(model)) {
        return model;
      }
      
      // If we've cycled through all, break
      if (this.currentIndex === startIndex) {
        break;
      }
    }
    
    return null;
  }

  // Mark model as failed
  markModelFailed(model: string): void {
    this.failedModels.add(model);
  }

  // Mark model as working (reset failures)
  markModelWorking(model: string): void {
    this.failedModels.delete(model);
    this.currentIndex = this.models.indexOf(model);
  }

  // Check if all models have failed
  allModelsFailed(): boolean {
    return this.failedModels.size === this.models.length;
  }

  // Get backup model that hasn't been tried recently
  getBackupModel(): string {
    const working = this.models.find(m => !this.failedModels.has(m));
    return working || this.models[0];
  }

  // Reset if needed (for new request batch)
  canRetry(): boolean {
    return !this.allModelsFailed();
  }

  // Get all available models
  getAvailableModels(): string[] {
    return this.models.filter(m => !this.failedModels.has(m));
  }

  // Reset rotator (call between major request batches)
  reset(): void {
    this.currentIndex = 0;
    this.failedModels.clear();
  }
}

export default {
  GEMINI_MODELS,
  getModelFallbacks,
  GeminiModelRotator
};
