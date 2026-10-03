import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { agentosApiMiddleware } from './server/api'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'agentos-api-server',
      configureServer(server) {
        server.middlewares.use(agentosApiMiddleware);
      },
      configurePreviewServer(server) {
        server.middlewares.use(agentosApiMiddleware);
      }
    }
  ],
  server: {
    port: 5173,
    host: true,
  },
})
