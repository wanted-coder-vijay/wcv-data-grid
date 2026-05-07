import { defineConfig } from "tsup"
import { copyFile } from "node:fs/promises"
import { resolve } from "node:path"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "@tanstack/react-table",
    "radix-ui",
    "lucide-react",
    "class-variance-authority",
    "clsx",
    "tailwind-merge",
  ],
  banner: {
    js: '"use client";',
  },
  async onSuccess() {
    // Ship the default-tokens stylesheet.
    await copyFile(
      resolve("src/styles.css"),
      resolve("dist/styles.css")
    )
  },
})
