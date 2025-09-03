import type { LLMProvider } from './base.js'
import type { ProcessingBatch } from '../background-trigger.js'
import type { StructuredLLMResponse } from '../llm-memory-manager.js'

export class FallbackProvider implements LLMProvider {
  getProviderName(): string {
    return 'Fallback (Heuristic)'
  }

  async processBatch(batch: ProcessingBatch): Promise<StructuredLLMResponse> {
    console.log('Using fallback provider - no LLM configured')
    
    const memoryFragments: StructuredLLMResponse['memoryFragments'] = []
    const goals: StructuredLLMResponse['goals'] = []
    const ideas: StructuredLLMResponse['ideas'] = []

    for (const message of batch.messages) {
      const content = message.content.toLowerCase()
      
      // Create memory fragment
      memoryFragments.push({
        content: message.content,
        memoryType: this.determineMemoryType(content),
        category: this.determineCategory(content),
        importance: this.determineImportance(content),
        emotionalImpact: this.determineEmotionalImpact(content),
        tags: this.generateTags(content)
      })

      // Extract goals
      if (content.includes('goal') || content.includes('plan') || content.includes('want to') || content.includes('need to')) {
        goals.push({
          title: `Goal: ${message.content.substring(0, 50)}...`,
          description: message.content,
          priority: 7,
          category: 'personal'
        })
      }

      // Extract ideas
      if (content.includes('idea') || content.includes('thought') || content.includes('maybe') || content.includes('what if')) {
        ideas.push({
          content: message.content,
          sourceType: 'conversation',
          excitement: 6,
          status: 'new'
        })
      }
    }

    return { memoryFragments, goals, ideas }
  }

  private determineMemoryType(content: string): 'working' | 'short_term' | 'long_term' | 'muscle' {
    if (content.includes('goal') || content.includes('plan') || content.includes('future') || content.includes('deadline')) {
      return 'long_term'
    }
    if (content.includes('how to') || content.includes('procedure') || content.includes('steps') || content.includes('process')) {
      return 'muscle'
    }
    if (content.includes('remember') || content.includes('important') || content.includes('key') || content.includes('critical')) {
      return 'long_term'
    }
    return 'short_term'
  }

  private determineCategory(content: string): string {
    if (content.includes('work') || content.includes('job') || content.includes('project') || content.includes('meeting')) {
      return 'work'
    }
    if (content.includes('friend') || content.includes('family') || content.includes('person') || content.includes('relationship')) {
      return 'relationships'
    }
    if (content.includes('idea') || content.includes('thought') || content.includes('concept') || content.includes('innovation')) {
      return 'ideas'
    }
    if (content.includes('feeling') || content.includes('emotion') || content.includes('happy') || content.includes('sad') || content.includes('angry')) {
      return 'emotions'
    }
    return 'general'
  }

  private determineImportance(content: string): number {
    if (content.includes('critical') || content.includes('urgent') || content.includes('essential')) {
      return 9
    }
    if (content.includes('important') || content.includes('key') || content.includes('priority')) {
      return 7
    }
    if (content.includes('trivial') || content.includes('unimportant') || content.includes('minor')) {
      return 2
    }
    return 5
  }

  private determineEmotionalImpact(content: string): number {
    if (content.includes('excited') || content.includes('thrilled') || content.includes('amazing')) {
      return 8
    }
    if (content.includes('happy') || content.includes('great') || content.includes('good')) {
      return 5
    }
    if (content.includes('frustrated') || content.includes('angry') || content.includes('mad')) {
      return -7
    }
    if (content.includes('sad') || content.includes('disappointed') || content.includes('upset')) {
      return -5
    }
    return 0
  }

  private generateTags(content: string): string[] {
    const tags: string[] = []
    if (content.includes('work')) tags.push('work')
    if (content.includes('personal')) tags.push('personal')
    if (content.includes('urgent')) tags.push('urgent')
    if (content.includes('idea')) tags.push('idea')
    if (content.includes('goal')) tags.push('goal')
    if (content.includes('project')) tags.push('project')
    if (content.includes('family')) tags.push('family')
    if (content.includes('friend')) tags.push('friend')
    return tags
  }
} 