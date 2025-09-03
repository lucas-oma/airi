<script setup lang="ts">
import { FieldInput } from '@proj-airi/ui'
import { useLocalStorage } from '@vueuse/core'
import { onMounted, ref } from 'vue'

// Use localStorage for persistence, following the same pattern as other settings
const memoryServiceEnabled = useLocalStorage('settings/memory/enabled', false)
const memoryServiceUrl = useLocalStorage('settings/memory/service-url', 'http://localhost:3001')
const apiKey = useLocalStorage('settings/memory/api-key', '')
const isConnected = ref(false)
const isTesting = ref(false)
const connectionStatus = ref('Click "Test Connection" to verify service')
const connectionMessage = ref('')
const connectionMessageType = ref<'success' | 'error'>('')
const connectionError = ref('')

// Test connection to memory service
async function testConnection() {
  try {
    isTesting.value = true

    // Test with a protected endpoint to verify API key authentication
    const headers: Record<string, string> = {}
    if (apiKey.value.trim()) {
      headers.Authorization = `Bearer ${apiKey.value}`
    }

    const response = await fetch(`${memoryServiceUrl.value}/api/test-auth`, {
      method: 'GET',
      headers,
    })

    if (response.ok) {
      isConnected.value = true
      connectionStatus.value = 'Connected to Memory Service ✅'
      connectionMessage.value = 'Successfully connected with API key!'
      connectionMessageType.value = 'success'
      connectionError.value = ''
    }
    else if (response.status === 401) {
      isConnected.value = false
      connectionStatus.value = 'Memory Service requires API key ❌'
      connectionMessage.value = 'Connection failed: API key required'
      connectionMessageType.value = 'error'
      connectionError.value = 'The memory service requires a valid API key for authentication'
    }
    else if (response.status === 403) {
      isConnected.value = false
      connectionStatus.value = 'Memory Service rejected API key ❌'
      connectionMessage.value = 'Connection failed: Invalid API key'
      connectionMessageType.value = 'error'
      connectionError.value = 'The provided API key is invalid or expired'
    }
    else {
      isConnected.value = false
      connectionStatus.value = 'Memory Service responded with error ❌'
      connectionMessage.value = `Connection failed: Server responded with status ${response.status}`
      connectionMessageType.value = 'error'
      connectionError.value = `HTTP ${response.status}: ${response.statusText}`
    }
  }
  catch (error) {
    isConnected.value = false
    connectionStatus.value = 'Cannot connect to Memory Service ❌'
    connectionMessage.value = 'Connection failed: Network error'
    connectionMessageType.value = 'error'
    connectionError.value = error instanceof Error ? error.message : 'Unknown connection error'
  }
  finally {
    isTesting.value = false
  }
}

// Reset settings to defaults
function resetSettings() {
  memoryServiceEnabled.value = false
  memoryServiceUrl.value = 'http://localhost:3001'
  apiKey.value = ''
  connectionMessage.value = ''
  connectionError.value = ''
  connectionStatus.value = 'Settings reset to defaults'
  isConnected.value = false
  connectionMessageType.value = 'success'
}

onMounted(() => {
  // Don't auto-test connection on mount to avoid errors
  // User can manually test when ready
})
</script>

<template>
  <div flex flex-col gap-5 pb-12>
    <!-- Help Info Section -->
    <div class="rounded-lg bg-primary-500/10 p-4 dark:bg-primary-800/25">
      <div class="mb-2 text-xl text-primary-800 font-semibold dark:text-primary-100">
        Memory Service Configuration
      </div>
      <div class="text-primary-700 dark:text-primary-300">
        Configure the connection to your AI memory service for intelligent message analysis and memory creation.
      </div>
    </div>

    <!-- Connection Status Section -->
    <div flex="~ row items-center gap-2">
      <div i-solar:leaf-bold-duotone text="neutral-500 dark:neutral-400 4xl" />
      <div>
        <div>
          <span text="neutral-300 dark:neutral-500">Memory Service Status</span>
        </div>
        <div flex text-nowrap text-3xl font-normal>
          <div>
            {{ connectionStatus }}
          </div>
        </div>
      </div>
    </div>

    <!-- Service Configuration Section -->
    <div class="border border-neutral-200 rounded-lg bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
      <div class="mb-4">
        <h3 class="text-lg text-neutral-900 font-semibold dark:text-neutral-100">
          Service Configuration
        </h3>
        <p class="text-sm text-neutral-600 dark:text-neutral-400">
          Configure the memory service connection and authentication
        </p>
      </div>

      <div class="mb-4">
        <label class="flex cursor-pointer items-center gap-3">
          <input
            v-model="memoryServiceEnabled"
            type="checkbox"
            class="h-4 w-4 border-gray-300 rounded bg-gray-100 text-blue-600 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
          >
          <span class="text-sm text-neutral-700 font-medium dark:text-neutral-300">
            Enable Memory Service Integration
          </span>
        </label>
        <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          When enabled, all chat messages and AI responses will be automatically stored in the memory service
        </p>
      </div>

      <div class="mb-4">
        <label class="mb-2 block text-sm text-neutral-700 font-medium dark:text-neutral-300">
          Memory Service URL
        </label>
        <FieldInput
          v-model="memoryServiceUrl"
          placeholder="http://localhost:3001"
          class="w-full"
          :disabled="!memoryServiceEnabled"
        />
        <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          The URL where your memory service is running
        </p>
      </div>

      <div class="mb-4">
        <label class="mb-2 block text-sm text-neutral-700 font-medium dark:text-neutral-300">
          API Key (Optional)
        </label>
        <FieldInput
          v-model="apiKey"
          type="password"
          placeholder="Enter API key if authentication is required"
          class="w-full"
          :disabled="!memoryServiceEnabled"
        />
        <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Leave empty if no authentication is required
        </p>
        <p class="mt-2 text-xs text-green-600 dark:text-green-400">
          ✓ Settings are automatically saved to your browser
        </p>
        <p class="mt-2 text-xs text-blue-600 dark:text-blue-400">
          ℹ Make sure your memory service is running before testing the connection
        </p>
      </div>

      <div class="mb-4 border border-blue-200 rounded-lg bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
        <h4 class="mb-2 text-sm text-blue-900 font-medium dark:text-blue-100">
          How It Works
        </h4>
        <ul class="text-xs text-blue-800 space-y-1 dark:text-blue-200">
          <li>• <strong>Toggle Control:</strong> Enable/disable memory service integration with the checkbox above</li>
          <li>• <strong>User Messages:</strong> Automatically sent to memory service when you chat (if enabled)</li>
          <li>• <strong>AI Responses:</strong> Stored with their prompts for context retrieval (if enabled)</li>
          <li>• <strong>Memory Building:</strong> Background processing consolidates messages into long-term memories</li>
          <li>• <strong>RAG Context:</strong> Recent messages can be retrieved for better AI responses</li>
          <li>• <strong>Fail-Safe:</strong> If connection fails, chat continues normally without memory storage</li>
        </ul>
      </div>

      <div class="flex gap-2">
        <button
          class="w-full rounded-lg bg-neutral-200 px-4 py-2 transition-colors sm:w-auto disabled:cursor-not-allowed dark:bg-neutral-700 hover:bg-neutral-300 disabled:opacity-50 dark:hover:bg-neutral-600"
          :disabled="!memoryServiceEnabled || isTesting"
          @click="testConnection"
        >
          {{ isTesting ? 'Testing...' : 'Test Connection' }}
        </button>

        <button
          class="w-full border border-neutral-300 rounded-lg px-4 py-2 transition-colors sm:w-auto disabled:cursor-not-allowed dark:border-neutral-600 hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-700"
          :disabled="!memoryServiceEnabled"
          @click="resetSettings"
        >
          Reset to Defaults
        </button>
      </div>

      <div v-if="connectionMessage" class="mt-2 text-sm" :class="connectionMessageType === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
        {{ connectionMessage }}
      </div>

      <div v-if="connectionError" class="mt-2 text-sm text-red-600 dark:text-red-400">
        {{ connectionError }}
      </div>
    </div>

    <!-- Configuration Info Section -->
    <div class="border border-neutral-200 rounded-lg bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
      <div class="mb-4">
        <h3 class="text-lg text-neutral-900 font-semibold dark:text-neutral-100">
          How It Works
        </h3>
        <p class="text-sm text-neutral-600 dark:text-neutral-400">
          The memory service automatically processes messages and creates structured memory data:
        </p>
      </div>

      <ul class="list-disc list-inside text-sm text-neutral-600 space-y-2 dark:text-neutral-400">
        <li>Messages are ingested and stored in the database</li>
        <li>Background processing analyzes content using configured LLM providers</li>
        <li>Structured data (fragments, goals, ideas, tags) is automatically created</li>
        <li>Memory consolidation algorithms strengthen or weaken memories over time</li>
      </ul>
    </div>

    <!-- LLM Configuration Info -->
    <div class="border border-neutral-200 rounded-lg bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
      <div class="mb-4">
        <h3 class="text-lg text-neutral-900 font-semibold dark:text-neutral-100">
          LLM Configuration
        </h3>
        <p class="text-sm text-neutral-600 dark:text-neutral-400">
          LLM providers are configured via environment variables on the server:
        </p>
      </div>

      <div class="rounded bg-neutral-100 p-3 text-xs font-mono dark:bg-neutral-700">
        <div>LLM_PROVIDER=openai|gemini|fallback</div>
        <div>LLM_MODEL=gpt-4-turbo-preview|gemini-pro</div>
        <div>LLM_API_KEY=your_api_key_here</div>
      </div>
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: settings
  stageTransition:
    name: slide
    pageSpecificAvailable: true
</route>
