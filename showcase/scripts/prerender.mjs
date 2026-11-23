import { readFile, writeFile, mkdir } from "node:fs/promises"
import { build } from "vite"
// Bundle local React consumers so server rendering uses one React instance.
await build({
  build: { ssr: "src/entry-server.tsx", outDir: ".prerender", emptyOutDir: true },
  ssr: { noExternal: ["@dynostack/react-grid", "lucide-react", "radix-ui", /@radix-ui\//, "@tanstack/react-table", "@tanstack/react-virtual", "@tanstack/virtual-core"] },
})
const { renderPage, pages } = await import("../.prerender/entry-server.js")
const template = await readFile("dist/index.html", "utf8")
if (!template.includes('<div id="root"></div>') || !template.includes("<!-- seo:start -->")) {
  throw new Error("Prerender requires a fresh Vite client build. Run npm run build.")
}
for (const path of Object.keys(pages)) {
  const { head, body } = renderPage(path)
  const html = template.replace(/<!-- seo:start -->[\s\S]*?<!-- seo:end -->/, () => head)
    .replace('<div id="root"></div>', () => `<div id="root">${body}</div>`)
  const directory = path === "/" ? "dist" : `dist${path}`
  await mkdir(directory, { recursive: true })
  await writeFile(`${directory}/index.html`, html)
  console.log(`Prerendered ${path}`)
}
