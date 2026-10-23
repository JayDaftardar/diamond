import { defineConfig, loadEnv } from 'vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Server-only settings (no VITE_ prefix, e.g. API_INTERNAL_URL) are read from .env in
  // development so server functions can use process.env. In production the host sets them.
  const env = loadEnv(mode, process.cwd(), '')
  for (const [key, value] of Object.entries(env)) {
    if (!(key in process.env)) process.env[key] = value
  }

  return {
    resolve: { tsconfigPaths: true },
    plugins: [tanstackStart(), viteReact()],
  }
})
