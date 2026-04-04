/**
 * Multi-Provider AI Client Factory
 * Handles Gemini and OpenAI APIs with optimizations
 */

import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import {
  AIProvider,
  AIProviderRotator,
  ProviderModelRotator,
  getModelsForProvider,
  PROVIDER_CONFIG
} from "./aiProviders";

export interface AIRequestOptions {
  message?: string;
  prompt?: string;
  systemInstruction?: string;
  contextText?: string;
  maxTokens?: number;
  temperature?: number;
  useCase?: "TEXT_GENERATION" | "VISION" | "JSON_OUTPUT" | "STREAMING";
  cacheKey?: string; // For response caching
}

export interface AIResponse {
  text: string;
  provider: AIProvider;
  model: string;
  tokensUsed?: number;
  cached?: boolean;
}

export interface StreamChunk {
  text: string;
  provider: AIProvider;
  model: string;
}

/**
 * Optimized Multi-Provider AI Client with caching and performance improvements
 */
export class AIClient {
  private providerRotator: AIProviderRotator;
  private modelRotators: Map<AIProvider, ProviderModelRotator> = new Map();
  private geminiClient: GoogleGenAI | null = null;
  private openaiClient: OpenAI | null = null;
  
  // Performance optimizations
  private responseCache = new Map<string, { response: AIResponse; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100;
  private requestQueue = new Map<string, Promise<AIResponse>>();
  private rateLimiters = new Map<AIProvider, { requests: number; resetTime: number }>();

  constructor() {
    this.providerRotator = new AIProviderRotator();
    this.initializeClients();
    this.initializeModelRotators();
    
    // Clean cache periodically
    setInterval(() => this.cleanCache(), this.CACHE_TTL);
  }

  private initializeClients(): void {
    if (process.env.GEMINI_API_KEY) {
      this.geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }

    if (process.env.OPENAI_API_KEY) {
      this.openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
  }

  private initializeModelRotators(): void {
    const providers = [AIProvider.GEMINI, AIProvider.OPENAI];
    
    providers.forEach(provider => {
      const models = getModelsForProvider(provider, "TEXT_GENERATION");
      if (models.length > 0) {
        this.modelRotators.set(provider, new ProviderModelRotator(models));
      }
    });
  }

  /**
   * Generate text response with automatic provider fallback and caching
   */
  async generateText(options: AIRequestOptions): Promise<AIResponse> {
    // Check cache first
    if (options.cacheKey) {
      const cached = this.getCachedResponse(options.cacheKey);
      if (cached) {
        return { ...cached, cached: true };
      }
    }

    // Check if request is already in progress (deduplication)
    const requestKey = this.getRequestKey(options);
    if (this.requestQueue.has(requestKey)) {
      return this.requestQueue.get(requestKey)!;
    }

    // Create and queue the request
    const requestPromise = this.executeRequest(options);
    this.requestQueue.set(requestKey, requestPromise);

    try {
      const response = await requestPromise;
      
      // Cache the response
      if (options.cacheKey) {
        this.setCachedResponse(options.cacheKey, response);
      }
      
      return response;
    } finally {
      // Clean up the queue
      this.requestQueue.delete(requestKey);
    }
  }

  /**
   * Execute the actual AI request with fallback logic
   */
  private async executeRequest(options: AIRequestOptions): Promise<AIResponse> {
    const providers = this.providerRotator.getAvailableProviders();
    let lastError: Error | null = null;

    for (const provider of providers) {
      // Check rate limits
      if (this.isRateLimited(provider)) {
        console.log(`[AI] Provider ${provider} rate limited, skipping`);
        continue;
      }

      try {
        console.log(`[AI] Attempting with provider: ${provider}`);
        const response = await this.generateWithProvider(provider, options);
        this.providerRotator.markProviderWorking(provider);
        this.updateRateLimit(provider, false); // Success
        return response;
      } catch (error: any) {
        console.error(`[AI] Provider ${provider} failed:`, error.message);
        this.providerRotator.markProviderFailed(provider);
        this.updateRateLimit(provider, true); // Failure
        lastError = error;
      }
    }

    throw lastError || new Error("All AI providers failed");
  }

  /**
   * Generate text with a specific provider
   */
  private async generateWithProvider(
    provider: AIProvider,
    options: AIRequestOptions
  ): Promise<AIResponse> {
    const model = this.getNextModel(provider);
    
    if (!model) {
      throw new Error(`No available models for provider: ${provider}`);
    }

    switch (provider) {
      case AIProvider.GEMINI:
        return await this.generateWithGemini(model, options);
      case AIProvider.OPENAI:
        return await this.generateWithOpenAI(model, options);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Cache management methods
   */
  private getCachedResponse(cacheKey: string): AIResponse | null {
    const cached = this.responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.response;
    }
    this.responseCache.delete(cacheKey);
    return null;
  }

  private setCachedResponse(cacheKey: string, response: AIResponse): void {
    if (this.responseCache.size >= this.MAX_CACHE_SIZE) {
      // Remove oldest entry
      const firstKey = this.responseCache.keys().next().value;
      this.responseCache.delete(firstKey);
    }
    this.responseCache.set(cacheKey, { response, timestamp: Date.now() });
  }

  private cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.responseCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.responseCache.delete(key);
      }
    }
  }

  /**
   * Rate limiting methods
   */
  private isRateLimited(provider: AIProvider): boolean {
    const limiter = this.rateLimiters.get(provider);
    if (!limiter) return false;
    
    if (Date.now() > limiter.resetTime) {
      this.rateLimiters.delete(provider);
      return false;
    }
    
    return limiter.requests >= 10; // 10 requests per minute
  }

  private updateRateLimit(provider: AIProvider, failed: boolean): void {
    const now = Date.now();
    const resetTime = now + 60 * 1000; // 1 minute window
    
    const limiter = this.rateLimiters.get(provider) || { requests: 0, resetTime };
    
    if (now > limiter.resetTime) {
      limiter.requests = 0;
      limiter.resetTime = resetTime;
    }
    
    limiter.requests++;
    this.rateLimiters.set(provider, limiter);
  }

  /**
   * Generate request key for deduplication
   */
  private getRequestKey(options: AIRequestOptions): string {
    return `${options.message || options.prompt || ''}_${options.systemInstruction || ''}_${options.maxTokens || 0}_${options.temperature || 0}`;
  }

  /**
   * Generate with Gemini
   */
  private async generateWithGemini(
    model: string,
    options: AIRequestOptions
  ): Promise<AIResponse> {
    if (!this.geminiClient) {
      throw new Error("Gemini client not initialized");
    }

    const prompt = options.message || options.prompt || "";

    const response = await this.geminiClient.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      config: {
        systemInstruction: options.systemInstruction,
        maxOutputTokens: options.maxTokens || 2048,
        temperature: options.temperature || 0.7
      }
    });

    return {
      text: response.text || "",
      provider: AIProvider.GEMINI,
      model
    };
  }

  /**
   * Generate with OpenAI
   */
  private async generateWithOpenAI(
    model: string,
    options: AIRequestOptions
  ): Promise<AIResponse> {
    if (!this.openaiClient) {
      throw new Error("OpenAI client not initialized");
    }

    const messages: any[] = [];
    
    if (options.systemInstruction) {
      messages.push({
        role: "system",
        content: options.systemInstruction
      });
    }

    messages.push({
      role: "user",
      content: options.message || options.prompt || ""
    });

    const response = await this.openaiClient.chat.completions.create({
      model,
      messages,
      max_tokens: options.maxTokens || 2048,
      temperature: options.temperature || 0.7
    });

    const text = response.choices[0]?.message?.content || "";

    return {
      text,
      provider: AIProvider.OPENAI,
      model,
      tokensUsed: response.usage?.total_tokens
    };
  }

  /**
   * Stream text response
   */
  async *streamText(options: AIRequestOptions): AsyncGenerator<StreamChunk> {
    const providers = this.providerRotator.getAvailableProviders();

    for (const provider of providers) {
      try {
        yield* this.streamWithProvider(provider, options);
        this.providerRotator.markProviderWorking(provider);
        return;
      } catch (error: any) {
        console.error(`[AI] Provider ${provider} failed during streaming:`, error.message);
        this.providerRotator.markProviderFailed(provider);
      }
    }

    throw new Error("All AI providers failed for streaming");
  }

  /**
   * Stream with a specific provider
   */
  private async *streamWithProvider(
    provider: AIProvider,
    options: AIRequestOptions
  ): AsyncGenerator<StreamChunk> {
    const model = this.getNextModel(provider);
    
    if (!model) {
      throw new Error(`No available models for provider: ${provider}`);
    }

    switch (provider) {
      case AIProvider.GEMINI:
        yield* this.streamWithGemini(model, options);
        break;
      case AIProvider.OPENAI:
        yield* this.streamWithOpenAI(model, options);
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Stream with Gemini
   */
  private async *streamWithGemini(
    model: string,
    options: AIRequestOptions
  ): AsyncGenerator<StreamChunk> {
    if (!this.geminiClient) {
      throw new Error("Gemini client not initialized");
    }

    const prompt = options.message || options.prompt || "";
    const response = await this.geminiClient.models.generateContentStream({
      model,
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      config: {
        systemInstruction: options.systemInstruction,
        maxOutputTokens: options.maxTokens || 2048,
        temperature: options.temperature || 0.7
      }
    });

    for await (const chunk of response) {
      const text = chunk.text || "";
      if (text) {
        yield {
          text,
          provider: AIProvider.GEMINI,
          model
        };
      }
    }
  }

  /**
   * Stream with OpenAI
   */
  private async *streamWithOpenAI(
    model: string,
    options: AIRequestOptions
  ): AsyncGenerator<StreamChunk> {
    if (!this.openaiClient) {
      throw new Error("OpenAI client not initialized");
    }

    const messages: any[] = [];
    
    if (options.systemInstruction) {
      messages.push({
        role: "system",
        content: options.systemInstruction
      });
    }

    messages.push({
      role: "user",
      content: options.message || options.prompt || ""
    });

    const stream = await this.openaiClient.chat.completions.create({
      model,
      messages,
      max_tokens: options.maxTokens || 2048,
      temperature: options.temperature || 0.7,
      stream: true
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || "";
      if (text) {
        yield {
          text,
          provider: AIProvider.OPENAI,
          model
        };
      }
    }
  }

  /**
   * Get next available model for provider
   */
  private getNextModel(provider: AIProvider): string {
    const rotator = this.modelRotators.get(provider);
    if (!rotator) {
      const models = getModelsForProvider(provider);
      if (models.length === 0) {
        throw new Error(`No models available for provider: ${provider}`);
      }
      return models[0];
    }
    return rotator.getCurrentModel();
  }

  /**
   * Get provider statistics
   */
  getStats() {
    return {
      availableProviders: this.providerRotator.getAvailableProviders(),
      failedProviders: this.providerRotator.getFailedProviders(),
      providers: {
        gemini: PROVIDER_CONFIG.gemini.enabled,
        openai: PROVIDER_CONFIG.openai.enabled
      }
    };
  }
}

// Singleton instance
let aiClientInstance: AIClient | null = null;

export function getAIClient(): AIClient {
  if (!aiClientInstance) {
    aiClientInstance = new AIClient();
  }
  return aiClientInstance;
}
