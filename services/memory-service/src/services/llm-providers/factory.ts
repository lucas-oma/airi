import type { LLMProvider } from './base.js'

import { env } from 'node:process'

import { FallbackProvider } from './fallback.js'
import { GeminiProvider } from './gemini.js'
import { OpenAIProvider } from './openai.js'

export class LLMProviderFactory {
  static createProvider(): LLMProvider {
    const provider = env.LLM_PROVIDER?.toLowerCase()
    const apiKey = env.LLM_API_KEY
    const model = env.LLM_MODEL

    switch (provider) {
      case 'openai':
        if (!apiKey) {
          console.warn('OpenAI provider requested but no API key provided, falling back to heuristic provider')
          return new FallbackProvider()
        }
        return new OpenAIProvider(apiKey, model || 'gpt-4')

      case 'gemini':
        if (!apiKey) {
          console.warn('Gemini provider requested but no API key provided, falling back to heuristic provider')
          return new FallbackProvider()
        }
        return new GeminiProvider(apiKey, model || 'gemini-pro')

      case 'fallback':
      case undefined:
        console.warn('Using fallback heuristic provider')
        return new FallbackProvider()

      default:
        console.warn(`Unknown LLM provider: ${provider}, falling back to heuristic provider`)
        return new FallbackProvider()
    }
  }
}
