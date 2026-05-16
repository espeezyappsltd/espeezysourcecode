import type { z } from 'zod'

/**
 * AIService Abstraction Layer
 * 
 * Future-proofs the application by decoupling logic from specific AI providers.
 * Allows easy switching between Gemini, OpenAI, or local models.
 */

export type AIMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export type AIOptions = {
  temperature?: number
  maxTokens?: number
  topP?: number
  stopSequences?: string[]
}

export interface IAIProvider {
  generateText(prompt: string, options?: AIOptions): Promise<string>
  generateChat(messages: AIMessage[], options?: AIOptions): Promise<string>
  extractStructuredData<T>(prompt: string, schema: z.ZodType<T> | Record<string, unknown>): Promise<T>
}

// Current Implementation (Gemini/Firebase AI Logic)
export class GeminiProvider implements IAIProvider {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async generateText(prompt: string, options?: AIOptions): Promise<string> {
    // Implementation for Gemini via REST or Firebase AI Logic
    console.log('Generating text with Gemini...', prompt)
    // Placeholder for actual API call
    return "Gemini Response"
  }

  async generateChat(messages: AIMessage[], options?: AIOptions): Promise<string> {
    console.log('Generating chat with Gemini...', messages)
    return "Gemini Chat Response"
  }

  async extractStructuredData<T>(prompt: string, schema: z.ZodType<T> | Record<string, unknown>): Promise<T> {
    console.log('Extracting structured data with Gemini...', prompt)
    return {} as T
  }
}

export class AIService {
  private static instance: AIService
  private provider: IAIProvider

  private constructor(provider: IAIProvider) {
    this.provider = provider
  }

  static getInstance(): AIService {
    if (!this.instance) {
      // Default to Gemini (or based on ENV)
      const provider = new GeminiProvider(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')
      this.instance = new AIService(provider)
    }
    return this.instance
  }

  async generate(prompt: string, options?: AIOptions): Promise<string> {
    return this.provider.generateText(prompt, options)
  }

  async chat(messages: AIMessage[], options?: AIOptions): Promise<string> {
    return this.provider.generateChat(messages, options)
  }

  async extract<T>(prompt: string, schema: z.ZodType<T> | Record<string, unknown>): Promise<T> {
    return this.provider.extractStructuredData<T>(prompt, schema)
  }
}
