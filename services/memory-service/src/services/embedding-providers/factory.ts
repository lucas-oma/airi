import { SettingsService } from '../settings'
import { GeminiEmbeddingProvider } from './gemini'
import { OpenAIEmbeddingProvider } from './openai'

export class EmbeddingProviderFactory {
  private static instance: EmbeddingProviderFactory
  private settingsService = SettingsService.getInstance()
  private currentProvider: OpenAIEmbeddingProvider | GeminiEmbeddingProvider | null = null

  private constructor() {}

  static getInstance(): EmbeddingProviderFactory {
    if (!EmbeddingProviderFactory.instance) {
      EmbeddingProviderFactory.instance = new EmbeddingProviderFactory()
    }
    return EmbeddingProviderFactory.instance
  }

  private async getProvider() {
    const settings = await this.settingsService.getSettings()
    const provider = settings.mem_embedding_provider.toLowerCase()
    const apiKey = settings.mem_embedding_api_key

    // If we already have a provider of the right type, reuse it
    if (
      (this.currentProvider instanceof OpenAIEmbeddingProvider && provider === 'openai')
      || (this.currentProvider instanceof GeminiEmbeddingProvider && provider === 'gemini')
    ) {
      console.warn('Reusing existing embedding provider')
      return this.currentProvider
    }

    console.warn(`Creating embedding provider: ${provider} for dimensions: ${settings.mem_embedding_dimensions}`)

    switch (provider) {
      case 'openai':
        if (!apiKey) {
          console.warn('OpenAI embedding provider requested but no API key provided in settings')
          throw new Error('OpenAI API key is required')
        }
        console.warn('Initializing OpenAI embedding provider...')
        this.currentProvider = new OpenAIEmbeddingProvider(apiKey)
        return this.currentProvider

      case 'gemini':
        if (!apiKey) {
          console.warn('Gemini embedding provider requested but no API key provided in settings')
          throw new Error('Gemini API key is required')
        }
        console.warn('Initializing Gemini embedding provider...')
        this.currentProvider = new GeminiEmbeddingProvider(apiKey)
        return this.currentProvider

      default:
        console.warn(`Unknown embedding provider in settings: ${provider}`)
        throw new Error(`Unsupported embedding provider: ${provider}`)
    }
  }

  async generateEmbedding(text: string): Promise<{
    content_vector_1536: number[] | null
    content_vector_1024: number[] | null
    content_vector_768: number[] | null
  }> {
    const settings = await this.settingsService.getSettings()
    const provider = await this.getProvider()

    console.warn(`Generating ${settings.mem_embedding_dimensions}-dimensional embedding...`)
    const mainEmbedding = await provider.generateEmbedding(text, settings.mem_embedding_dimensions)
    console.warn('Embedding generated successfully')

    return {
      content_vector_1536: settings.mem_embedding_dimensions === 1536 ? mainEmbedding : null,
      content_vector_1024: settings.mem_embedding_dimensions === 1024 ? mainEmbedding : null,
      content_vector_768: settings.mem_embedding_dimensions === 768 ? mainEmbedding : null,
    }
  }
}
