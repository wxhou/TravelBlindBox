export type ServiceMode = 'rest' | 'mcp'

export interface ServiceConfig {
  mode: ServiceMode
  mcpEnabled: boolean
  fallbackEnabled: boolean
}

export const SERVICE_CONFIG: ServiceConfig = {
  mode: (import.meta.env.VITE_SERVICE_MODE as ServiceMode) || 'rest',
  mcpEnabled: import.meta.env.VITE_MCP_ENABLED === 'true',
  fallbackEnabled: import.meta.env.VITE_FALLBACK_ENABLED !== 'false'
}

export const getCurrentServiceMode = (): ServiceMode => {
  if (SERVICE_CONFIG.mode === 'mcp' && SERVICE_CONFIG.mcpEnabled) {
    return 'mcp'
  }
  return 'rest'
}

export const isMcpEnabled = (): boolean => {
  return SERVICE_CONFIG.mcpEnabled
}