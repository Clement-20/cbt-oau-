/**
 * Multi-Provider AI System
 * Supports Gemini and OpenAI with intelligent fallback
 */

// Gemini Model Configuration
export const GEMINI_MODELS = {
  TEXT_GENERATION: [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro"
  ],
  VISION: [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro"
  ],
  JSON_OUTPUT: [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro"
  ],
  STREAMING: [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro"
  ]
};

// OpenAI Model Configuration
export const OPENAI_MODELS = {
  TEXT_GENERATION: [
    "gpt-4o-mini",
    "gpt-3.5-turbo"
  ],
  VISION: [
    "gpt-4o",
    "gpt-4o-mini"
  ],
  JSON_OUTPUT: [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-3.5-turbo"
  ],
  STREAMING: [
    "gpt-4o-mini",
    "gpt-3.5-turbo"
  ]
};

// Provider Configuration
export enum AIProvider {
  GEMINI = "gemini",
  OPENAI = "openai"
}

export interface ProviderConfig {
  enabled: boolean;
  apiKey: string | null;
  priority: number;
}

export const PROVIDER_CONFIG: Record<AIProvider, ProviderConfig> = {
  [AIProvider.GEMINI]: {
    enabled: !!process.env.GEMINI_API_KEY,
    apiKey: process.env.GEMINI_API_KEY || null,
    priority: 1
  },
  [AIProvider.OPENAI]: {
    enabled: !!process.env.OPENAI_API_KEY,
    apiKey: process.env.OPENAI_API_KEY || null,
    priority: 2
  }
};

/**
 * Get available providers sorted by priority
 */
export function getAvailableProviders(): AIProvider[] {
  return Object.entries(PROVIDER_CONFIG)
    .filter(([_, config]) => config.enabled)
    .sort(([_, configA], [__, configB]) => configA.priority - configB.priority)
    .map(([provider]) => provider as AIProvider);
}

/**
 * Model Rotator for a specific provider
 */
export class ProviderModelRotator {
  private models: string[];
  private failedModels: Set<string> = new Set();
  private currentIndex: number = 0;

  constructor(models: string[]) {
    this.models = models;
  }

  getCurrentModel(): string {
    return this.models[this.currentIndex];
  }

  getNextModel(): string | null {
    for (let i = 1; i < this.models.length; i++) {
      const nextIndex = (this.currentIndex + i) % this.models.length;
      const model = this.models[nextIndex];
      if (!this.failedModels.has(model)) {
        this.currentIndex = nextIndex;
        return model;
      }
    }
    return null;
  }

  markModelFailed(model: string): void {
    this.failedModels.add(model);
  }

  markModelWorking(model: string): void {
    this.failedModels.delete(model);
  }

  canRetry(): boolean {
    return this.failedModels.size < this.models.length;
  }

  reset(): void {
    this.failedModels.clear();
    this.currentIndex = 0;
  }

  getFailedModels(): string[] {
    return Array.from(this.failedModels);
  }
}

/**
 * Provider Rotator - switches between AI providers
 */
export class AIProviderRotator {
  private providers: AIProvider[];
  private failedProviders: Set<AIProvider> = new Set();
  private currentIndex: number = 0;

  constructor() {
    this.providers = getAvailableProviders();
  }

  getCurrentProvider(): AIProvider | null {
    if (this.providers.length === 0) return null;
    return this.providers[this.currentIndex];
  }

  getNextProvider(): AIProvider | null {
    for (let i = 1; i < this.providers.length; i++) {
      const nextIndex = (this.currentIndex + i) % this.providers.length;
      const provider = this.providers[nextIndex];
      if (!this.failedProviders.has(provider)) {
        this.currentIndex = nextIndex;
        return provider;
      }
    }
    return null;
  }

  markProviderFailed(provider: AIProvider): void {
    this.failedProviders.add(provider);
  }

  markProviderWorking(provider: AIProvider): void {
    this.failedProviders.delete(provider);
  }

  canRetry(): boolean {
    return this.failedProviders.size < this.providers.length;
  }

  reset(): void {
    this.failedProviders.clear();
    this.currentIndex = 0;
  }

  getAvailableProviders(): AIProvider[] {
    return this.providers.filter(p => !this.failedProviders.has(p));
  }

  getFailedProviders(): AIProvider[] {
    return Array.from(this.failedProviders);
  }
}

/**
 * Get model list for a specific provider and use case
 */
export function getModelsForProvider(
  provider: AIProvider,
  useCase: "TEXT_GENERATION" | "VISION" | "JSON_OUTPUT" | "STREAMING" = "TEXT_GENERATION"
): string[] {
  switch (provider) {
    case AIProvider.GEMINI:
      return GEMINI_MODELS[useCase];
    case AIProvider.OPENAI:
      return OPENAI_MODELS[useCase];
    default:
      return [];
  }
}
