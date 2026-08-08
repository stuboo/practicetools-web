/// <reference types="vitest" />
import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // @vitejs/plugin-react injects a Fast Refresh preamble through the HTML
  // transform. Vitest never loads index.html, so under `mode: test` the
  // plugin's runtime check for that preamble throws on the first component
  // import. Component tests do not need Fast Refresh, so the plugin is simply
  // left out there; dev and build are unaffected.
  plugins: mode === 'test' ? [] : [react()],
  esbuild: mode === 'test' ? { jsx: 'automatic' } : undefined,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // The search page debounces its input by a second, so its tests spend
    // real time waiting rather than the default 5s budget.
    testTimeout: 15000,
  },
}))
