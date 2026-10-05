import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs"
import path from "node:path"
const root = process.cwd()
const files = []
function add(file, source = file) {
  files.push({
    file: file.replaceAll("\\", "/"),
    data: readFileSync(path.join(root, source)).toString("base64"),
    encoding: "base64",
  })
}
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const item = path.join(dir, name)
    if (statSync(item).isDirectory()) walk(item)
    else add(path.relative(root, item))
  }
}
walk(path.join(root, "src"))
walk(path.join(root, "showcase", "src"))
walk(path.join(root, "brand"))
walk(path.join(root, "showcase", "public", "brand"))
add("showcase/public/brand.html")
for (const file of [
  "package.json",
  "package-lock.json",
  "tsup.config.ts",
  "tsconfig.json",
  "showcase/package.json",
  "showcase/package-lock.json",
  "showcase/vite.config.ts",
  "showcase/tsconfig.json",
  "showcase/index.html",
  "showcase/public/favicon.svg",
])
  add(file)
for (const name of [
  "grid-dark.png",
  "grid-light.png",
  "grid-filter.png",
  "grid-selection.png",
])
  add(`showcase/public/table-images/${name}`)
const config = JSON.parse(readFileSync("showcase/vercel.json", "utf8"))
delete config.framework
config.buildCommand =
  "npm run build && npm install --prefix showcase && npm run build --prefix showcase"
config.outputDirectory = "showcase/dist"
files.push({
  file: "vercel.json",
  data: JSON.stringify(config),
  encoding: "utf-8",
})
writeFileSync("deployment-payload.json", JSON.stringify(files))
console.log(
  JSON.stringify({
    files: files.length,
    bytes: statSync("deployment-payload.json").size,
  })
)
