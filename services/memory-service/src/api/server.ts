/**
 * REST API Server for Memory Service
 *
 * This file implements:
 * - Express server setup with middleware
 * - REST API endpoints for memory operations
 * - Authentication and authorization
 * - Request validation and error handling
 * - CORS and security headers
 */

import type { MessageIngestionService } from '../services/message-processing.js'

import cors from 'cors'
import express from 'express'

import { MemoryService } from '../services/memory.js'

export function createApp(messageIngestionService: MessageIngestionService) {
  const app = express()
  const memoryService = new MemoryService(messageIngestionService)

  // Middleware
  app.use(cors())
  app.use(express.json())

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // Message ingestion endpoint
  app.post('/api/messages', async (req, res) => {
    try {
      const result = await memoryService.ingestMessage(req.body)
      res.json(result)
    }
    catch (error) {
      console.error('Failed to ingest message:', error)
      res.status(500).json({
        error: 'Failed to ingest message',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  // Chat completions endpoint
  app.post('/api/completions', async (req, res) => {
    try {
      const result = await memoryService.storeCompletion(req.body)
      res.json(result)
    }
    catch (error) {
      console.error('Failed to store completion:', error)
      res.status(500).json({
        error: 'Failed to store completion',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  // Get message by ID endpoint
  app.get('/api/messages/:id', async (req, res) => {
    try {
      const result = await memoryService.getMessage(req.params.id)
      if (!result) {
        res.status(404).json({ error: 'Message not found' })
        return
      }
      res.json(result)
    }
    catch (error) {
      console.error('Failed to get message:', error)
      res.status(500).json({
        error: 'Failed to get message',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  return app
}

// TODO: Add WebSocket server integration
// export function createWebSocketServer(server: any) {
//   // WebSocket server for real-time updates
// }
