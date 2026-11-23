import { defineConfig } from "vite"
import tailwindcss from "@tailwindcss/vite"
export default defineConfig({
  plugins: [tailwindcss(), {
    name: "prerendered-preview-routes",
    configurePreviewServer(server) {
      // Vite's default SPA fallback otherwise serves the homepage for these URLs.
      server.middlewares.use((request, _response, next) => {
        const route = request.url?.match(/^\/(playground|docs|studio|blocks|api-playground)\/?(\?.*)?$/)
        if (route) request.url = `/${route[1]}/index.html${route[2] ?? ""}`
        next()
      })
    },
  }],
  resolve: { dedupe: ["react", "react-dom", "@tanstack/react-table"] },
  optimizeDeps: { exclude: ["@dynostack/react-grid"] },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code !== "MODULE_LEVEL_DIRECTIVE") warn(warning)
      },
    },
  },
})
