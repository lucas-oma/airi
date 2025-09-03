/**
 * LLM Memory Manager
 *
 * This service handles:
 * - Processing batches of messages with LLM
 * - Creating memory fragments, goals, ideas, etc.
 * - Updating memory tables with structured data
 */

// TODO [lucas-oma]: remove console.log comments

import type { ProcessingBatch } from './background-trigger.js'
import type { LLMProvider } from './llm-providers/base.js'

import { inArray } from 'drizzle-orm'

import { useDrizzle } from '../db/index.js'
import {
  memoryFragmentsTable,
  memoryLongTermGoalsTable,
  memoryShortTermIdeasTable,
  memoryTagRelationsTable,
  memoryTagsTable,
} from '../db/schema.js'
import { LLMProviderFactory } from './llm-providers/factory.js'

// NOTE: This interface defines the structured JSON output we expect from the LLM.
export interface StructuredLLMResponse {
  memoryFragments: {
    content: string
    memoryType: 'working' | 'short_term' | 'long_term' | 'muscle'
    category: string
    importance: number
    emotionalImpact: number
    tags: string[]
  }[]
  goals: {
    title: string
    description: string
    priority: number
    deadline?: number
    category: string
  }[]
  ideas: {
    content: string
    sourceType: 'conversation' | 'reflection' | 'dream'
    excitement: number
    status: 'new' | 'developing' | 'implemented' | 'abandoned'
  }[]
  // The LLM can also infer and return associations between new and existing memories.
  // TODO: This is a placeholder for that advanced logic.
  // associations: { sourceId: string; targetId: string; associationType: string }[]
}

export class LLMMemoryManager {
  private db = useDrizzle()
  private llmProvider: LLMProvider

  constructor() {
    this.llmProvider = LLMProviderFactory.createProvider()
  }

  /**
   * Processes an entire batch of messages with a single, structured LLM call.
   */
  async processBatch(batch: ProcessingBatch): Promise<void> {
    // console.log(`🚀 LLM Memory Manager processing batch of ${batch.messages.length} messages`)
    // console.log(`🆔 Batch ID: ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
    // console.log(`📋 Message IDs: ${batch.messageIds.join(', ')}`)
    // console.log(`📝 Message contents: ${batch.messages.map(m => m.content.substring(0, 50)).join(' | ')}`)

    // Skip processing if batch is empty
    if (batch.messages.length === 0) {
      // console.log('Skipping empty batch')
      return
    }

    try {
      // console.log(`💰 Making LLM API call for batch...`)
      // const startTime = Date.now()

      // 1. Get a single, structured JSON response from the LLM for the entire batch.
      const structuredData = await this.llmProvider.processBatch(batch)

      // const endTime = Date.now()
      // console.log(`✅ LLM API call completed in ${endTime - startTime}ms`)
      // console.log(`📊 LLM Response: ${JSON.stringify(structuredData).substring(0, 200)}...`)

      // 2. Perform all database operations in a single transaction for efficiency.
      // console.log(`💾 Updating memory tables...`)
      await this.updateMemoryTables(structuredData)

      // console.log(`🎯 Successfully processed batch and updated memory tables.`)
    }
    catch (error) {
      console.error('❌ An error occurred during batch processing:', error)
      throw error // Re-throw to allow the background trigger to handle the failure.
    }
  }

  /**
   * Updates all memory tables in a single, efficient transaction.
   */
  private async updateMemoryTables(structuredData: StructuredLLMResponse): Promise<void> {
    // console.log(`🔍 Processing ${structuredData.memoryFragments.length} memory fragments`)
    // console.log(`🏷️ Processing ${structuredData.goals.length} goals`)
    // console.log(`💡 Processing ${structuredData.ideas.length} ideas`)

    const memoryFragments = structuredData.memoryFragments.map(f => ({
      ...f,
      emotional_impact: f.emotionalImpact, // Drizzle expects snake_case
      memory_type: f.memoryType,
      access_count: 1,
      created_at: Date.now(),
      last_accessed: Date.now(),
      metadata: {},
    }))

    const tagsToCreate = new Set(structuredData.memoryFragments.flatMap(f => f.tags))

    // Get existing tags first to avoid duplicates
    const existingTags = await this.db
      .select({ id: memoryTagsTable.id, name: memoryTagsTable.name })
      .from(memoryTagsTable)
      .where(inArray(memoryTagsTable.name, Array.from(tagsToCreate)))

    const existingTagMap = new Map(existingTags.map(tag => [tag.name, tag.id]))

    // Only create tags that don't already exist
    const newTagNames = Array.from(tagsToCreate).filter(name => !existingTagMap.has(name))
    const newTags = newTagNames.map(name => ({
      name,
      description: `Auto-generated tag for ${name}`,
      created_at: Date.now(),
    }))

    // Defer memory fragment insertion to the transaction below to avoid double insertions

    // Insert only new tags and get their IDs (only if we have tags)
    let createdTags: typeof existingTags = []
    if (newTags.length > 0) {
      createdTags = await this.db.insert(memoryTagsTable).values(newTags).returning()
    }

    // Combine existing and new tags into a single map
    const allTagMap = new Map<string, string>(existingTagMap)
    for (const tag of createdTags) {
      allTagMap.set(tag.name, tag.id)
    }

    // Tag relations will be created inside the transaction after fragment insertion
    // to ensure we have the fragment IDs aligned with the original order.

    // Prepare goals and ideas for insertion
    const goals = structuredData.goals.map(g => ({
      title: g.title,
      description: g.description,
      priority: g.priority,
      deadline: g.deadline,
      category: g.category,
      created_at: Date.now(),
      updated_at: Date.now(),
    }))

    const ideas = structuredData.ideas.map(i => ({
      content: i.content,
      source_type: i.sourceType,
      excitement: i.excitement,
      status: i.status,
      created_at: Date.now(),
      updated_at: Date.now(),
    }))

    // console.log(`💾 Starting database transaction...`)
    await this.db.transaction(async (tx) => {
      // Create fragments in bulk and then tag relations for the created fragments
      if (memoryFragments.length > 0) {
        // console.log(`📝 Inserting ${memoryFragments.length} memory fragments...`)
        const createdFragments = await tx.insert(memoryFragmentsTable).values(memoryFragments).returning({ id: memoryFragmentsTable.id })
        // console.log(`✅ Memory fragments inserted`)

        // Build tag relations using returned fragment IDs in order
        const tagRelations: Array<{ memory_id: string, tag_id: string, created_at: number }> = []
        for (let i = 0; i < structuredData.memoryFragments.length; i++) {
          const f = structuredData.memoryFragments[i]
          const fragmentId = createdFragments[i]?.id
          if (!fragmentId)
            continue
          for (const tagName of f.tags) {
            const tagId = allTagMap.get(tagName)
            if (tagId) {
              tagRelations.push({ memory_id: fragmentId, tag_id: tagId, created_at: Date.now() })
            }
          }
        }

        if (tagRelations.length > 0) {
          // console.log(`🔗 Inserting ${tagRelations.length} tag relations...`)
          await tx.insert(memoryTagRelationsTable).values(tagRelations)
          // console.log(`✅ Tag relations inserted`)
        }
      }

      // Create goals in bulk
      if (goals.length > 0) {
        // console.log(`🎯 Inserting ${goals.length} goals...`)
        await tx.insert(memoryLongTermGoalsTable).values(goals)
        // console.log(`✅ Goals inserted`)
      }

      // Create ideas in bulk
      if (ideas.length > 0) {
        // console.log(`💭 Inserting ${ideas.length} ideas...`)
        await tx.insert(memoryShortTermIdeasTable).values(ideas)
        // console.log(`✅ Ideas inserted`)
      }
    })
    // console.log(`🎉 Database transaction completed successfully`)
  }
}
