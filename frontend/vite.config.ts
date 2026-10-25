import { defineConfig, loadEnv } from 'vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import { nitro } from 'nitro/vite'

import viteReact from '@vitejs/plugin-react'

import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // Server-only settings (no VITE_ prefix, e.g. API_INTERNAL_URL) are read from .env in
  // development so server functions can use process.env. In production the host sets them.
  const env = loadEnv(mode, process.cwd(), '')
  for (const [key, value] of Object.entries(env)) {
    if (!(key in process.env)) process.env[key] = value
  }

  return {
    resolve: { tsconfigPaths: true },
    // nitro() packages the server for the host: on Vercel it detects the build and produces
    // Vercel's own output, anywhere else a plain Node server (.output/server/index.mjs).
    plugins: [tailwindcss(), tanstackStart(), nitro(), viteReact()],
  }
})
