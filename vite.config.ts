import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/mcp': {
        target: 'https://mcp.amap.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mcp/, ''),
      },
    },
  },
  define: {
    __MCP_CONFIG__: {
      amap: {
        url: 'https://mcp.amap.com/sse?key=9f8e5af62cebb2c124583e5023c19fe4',
        webKey: '9f8e5af62cebb2c124583e5023c19fe4',
      },
    },
  },
})
