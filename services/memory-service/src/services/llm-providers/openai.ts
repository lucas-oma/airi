import OpenAI from 'openai'
import type { LLMProvider } from './base.js'
import type { ProcessingBatch } from '../background-trigger.js'
import type { StructuredLLMResponse } from '../llm-memory-manager.js'

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI
  private model: string

  constructor(apiKey: string, model: string = 'gpt-4-turbo-preview') {
    this.client = new OpenAI({ apiKey })
    this.model = model
  }

  getProviderName(): string {
    return 'OpenAI'
  }

  async processBatch(batch: ProcessingBatch): Promise<StructuredLLMResponse> {
    const messages = batch.messages.map(msg => ({
      role: 'user' as const,
      content: msg.content
    }))

    const systemPrompt = `You are an AI memory manager. Analyze the following messages and extract structured information.

Please provide a JSON response with exactly this structure:
{
  "memoryFragments": [
    {
      "content": "Brief description of the memory",
      "memoryType": "working|short_term|long_term|muscle",
      "category": "work|personal|relationships|ideas|emotions|general",
      "importance": 1-10,
      "emotionalImpact": -10 to 10,
      "tags": ["tag1", "tag2"]
    }
  ],
  "goals": [
    {
      "title": "Goal title",
      "description": "Goal description",
      "priority": 1-10,
      "deadline": null or timestamp,
      "category": "work|personal|relationships|general"
    }
  ],
  "ideas": [
    {
      "content": "Idea description",
      "sourceType": "conversation|reflection|dream",
      "excitement": 1-10,
      "status": "new|developing|implemented|abandoned"
    }
  ]
}

Memory types:
- working: Immediate tasks, current focus
- short_term: Recent events, conversations
- long_term: Important memories, goals, plans
- muscle: How-to knowledge, procedures

Categories: work, personal, relationships, ideas, emotions, general
Source types: conversation, reflection, dream
Status: new, developing, implemented, abandoned

Analyze the semantic meaning, not just keywords.`

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3, // Lower temperature for more consistent structured output
        max_tokens: 2000
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response content from OpenAI')
      }

      const parsed = JSON.parse(content) as StructuredLLMResponse
      
      // Validate the response structure
      this.validateResponse(parsed)
      
      return parsed
    } catch (error) {
      console.error('OpenAI API error:', error)
      throw new Error(`OpenAI processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private validateResponse(response: any): asserts response is StructuredLLMResponse {
    if (!response.memoryFragments || !Array.isArray(response.memoryFragments)) {
      throw new Error('Invalid response: missing or invalid memoryFragments')
    }
    if (!response.goals || !Array.isArray(response.goals)) {
      throw new Error('Invalid response: missing or invalid goals')
    }
    if (!response.ideas || !Array.isArray(response.ideas)) {
      throw new Error('Invalid response: missing or invalid ideas')
    }
  }
} 