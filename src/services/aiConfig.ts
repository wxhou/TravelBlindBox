export const AI_CONFIG = {
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  baseURL: import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1',
  model: import.meta.env.VITE_AI_MODEL || 'gpt-4',
  // 提高 temperature 以增加路线多样性 (0.7 -> 0.9)
  temperature: parseFloat(import.meta.env.VITE_AI_TEMPERATURE || '0.9'),
  // 增加 maxTokens 以支持完整的路线生成 (2000 -> 4000)
  maxTokens: parseInt(import.meta.env.VITE_AI_MAX_TOKENS || '4000'),
  timeout: parseInt(import.meta.env.VITE_AI_TIMEOUT || '180000'),
}

export const validateConfig = () => {
  if (!AI_CONFIG.apiKey) {
    throw new Error('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your .env file.')
  }

  if (AI_CONFIG.temperature < 0 || AI_CONFIG.temperature > 2) {
    throw new Error('AI temperature must be between 0 and 2.')
  }

  if (AI_CONFIG.maxTokens < 100 || AI_CONFIG.maxTokens > 8000) {
    throw new Error('AI max tokens must be between 100 and 8000.')
  }
}

export const isConfigured = () => {
  return Boolean(AI_CONFIG.apiKey)
}