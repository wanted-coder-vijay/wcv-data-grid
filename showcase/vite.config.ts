import { defineConfig } from "vite"
import tailwindcss from "@tailwindcss/vite"
export default defineConfig({
  plugins: [tailwindcss()],
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
