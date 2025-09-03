/**
 * Memory Service Business Logic
 *
 * This file implements:
 * - Memory CRUD operations
 * - Vector similarity search
 * - Memory consolidation algorithms
 * - Memory decay calculations
 * - Session management
 */

import type { MessageIngestionService } from './message-processing.js'

import { eq } from 'drizzle-orm'

import { useDrizzle } from '../db/index.js'
import { chatMessagesTable } from '../db/schema.js'

export interface IngestMessageRequest {
  content: string
  platform: string
  platform_message_id?: string
  from_id?: string
  from_name?: string
  in_chat_id?: string
  is_reply?: boolean
  reply_to_name?: string
  reply_to_id?: string
}

export interface MessageResponse {
  id: string
  content: string
  platform: string
  created_at: number
}

export interface CompletionRequest {
  prompt: string
  response: string
  platform: string
  task?: string
}

export interface CompletionResponse {
  id: string
  prompt: string
  response: string
  platform: string
  created_at: number
}

export interface SearchOptions {
  query: string
  limit?: number
  similarity_threshold?: number
  platform?: string
}

export class MemoryService {
  private db = useDrizzle()
  private messageIngestion: MessageIngestionService

  constructor(messageIngestion: MessageIngestionService) {
    this.messageIngestion = messageIngestion
  }

  /**
   * Ingest a new message (store raw message for later processing)
   */
  async ingestMessage(data: IngestMessageRequest): Promise<MessageResponse> {
    try {
      // TODO: Generate embeddings for the content
      // For now, we'll store without embeddings
      const embedding_1536 = null // TODO: Generate embedding
      const embedding_1024 = null // TODO: Generate embedding
      const embedding_768 = null // TODO: Generate embedding

      // Insert the message into chatMessagesTable
      const [result] = await this.db.insert(chatMessagesTable).values({
        platform: data.platform,
        content: data.content,
        is_processed: false, // Mark as unprocessed initially
        created_at: Date.now(),
        updated_at: Date.now(),
        content_vector_1536: embedding_1536,
        content_vector_1024: embedding_1024,
        content_vector_768: embedding_768,
      }).returning({
        id: chatMessagesTable.id,
        content: chatMessagesTable.content,
        platform: chatMessagesTable.platform,
        created_at: chatMessagesTable.created_at,
      })

      // Mark message for processing
      await this.messageIngestion.markMessageForProcessing(result.id)

      return {
        id: result.id,
        content: result.content,
        platform: result.platform,
        created_at: result.created_at,
      }
    }
    catch (error) {
      console.error('Failed to create memory:', error)
      throw new Error(`Failed to create memory: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get message by ID
   */
  async getMessage(id: string): Promise<MessageResponse | null> {
    try {
      const [result] = await this.db
        .select({
          id: chatMessagesTable.id,
          content: chatMessagesTable.content,
          platform: chatMessagesTable.platform,
          created_at: chatMessagesTable.created_at,
        })
        .from(chatMessagesTable)
        .where(eq(chatMessagesTable.id, id))

      if (!result)
        return null

      return {
        id: result.id,
        content: result.content,
        platform: result.platform,
        created_at: result.created_at,
      }
    }
    catch (error) {
      console.error('Failed to get message:', error)
      throw new Error(`Failed to get message: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Store a chat completion (AI response with prompt)
   */
  async storeCompletion(data: CompletionRequest): Promise<CompletionResponse> {
    try {
      // Import the completions table schema
      const { chatCompletionsHistoryTable } = await import('../db/schema.js')

      // Insert the completion into chatCompletionsHistoryTable
      const [result] = await this.db.insert(chatCompletionsHistoryTable).values({
        prompt: data.prompt,
        response: data.response,
        task: 'chat', // Default task type
        created_at: Date.now(),
      }).returning({
        id: chatCompletionsHistoryTable.id,
        prompt: chatCompletionsHistoryTable.prompt,
        response: chatCompletionsHistoryTable.response,
        task: chatCompletionsHistoryTable.task,
        created_at: chatCompletionsHistoryTable.created_at,
      })

      return {
        id: result.id,
        prompt: result.prompt,
        response: data.response,
        platform: data.platform, // Store platform in our response
        created_at: result.created_at,
      }
    }
    catch (error) {
      console.error('Failed to store completion:', error)
      throw new Error(`Failed to store completion: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Clean up resources
   */
  async close(): Promise<void> {
    // Redis connection cleanup handled by RedisQueueService singleton
  }

  // TODO: Implement memory search
  // async searchMemories(query: string, options: SearchOptions): Promise<MemoryResponse[]> {
  //   // This would use vector similarity search with pgvector
  //   // For now, return empty array
  //   return []
  // }
}
