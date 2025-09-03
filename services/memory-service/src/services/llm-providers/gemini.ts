import type { ProcessingBatch } from '../background-trigger.js'
import type { StructuredLLMResponse } from '../llm-memory-manager.js'
import type { LLMProvider } from './base.js'

import { GoogleGenerativeAI } from '@google/generative-ai'

export class GeminiProvider implements LLMProvider {
  private genAI: GoogleGenerativeAI
  private model: string

  constructor(apiKey: string, model: string = 'gemini-pro') {
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.model = model
  }

  getProviderName(): string {
    return 'Gemini'
  }

  async processBatch(batch: ProcessingBatch): Promise<StructuredLLMResponse> {
    const model = this.genAI.getGenerativeModel({ model: this.model })

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

    const userMessages = batch.messages.map(msg => `User: ${msg.content}`).join('\n\n')
    const fullPrompt = `${systemPrompt}\n\nMessages to analyze:\n\n${userMessages}`

    try {
      const result = await model.generateContent(fullPrompt)
      const response = await result.response
      const content = response.text()

      if (!content) {
        throw new Error('No response content from Gemini')
      }

      // Extract JSON from the response (Gemini might wrap it in markdown)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON response found in Gemini output')
      }

      const parsed = JSON.parse(jsonMatch[0]) as StructuredLLMResponse

      // Validate the response structure
      this.validateResponse(parsed)

      return parsed
    }
    catch (error) {
      console.error('Gemini API error:', error)
      throw new Error(`Gemini processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
