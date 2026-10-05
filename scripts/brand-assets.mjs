import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"
const root = fileURLToPath(new URL("../", import.meta.url))
const identity = JSON.parse(
  readFileSync(path.join(root, "brand/identity.json"), "utf8")
)
const dest = path.join(root, "showcase/public/brand")
mkdirSync(dest, { recursive: true })
const paths = (grid, color = "currentColor") =>
  [...identity.outerPaths, ...(grid ? identity.gridPaths : [identity.corePath])]
    .map((d) => `<path d="${d}" fill="${color}"/>`)
    .join("")
const mark = (grid, color) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${identity.viewBox}" fill="${color}"><title>Dynostack${grid ? " Grid" : ""} mark</title>${paths(grid, color)}</svg>`
const wordmark = (grid, color) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${grid ? 495 : 355} 80"><title>Dynostack${grid ? " Grid" : ""}</title><g transform="translate(0 6)">${paths(grid, color)}</g><text x="84" y="55" font-family="Arial, Helvetica, sans-serif" font-size="49" font-weight="700" letter-spacing="-2.2" fill="${color}">dynostack</text>${grid ? `<path d="M370 22V60" stroke="${color}" opacity=".25"/><text x="390" y="53" font-family="Arial, Helvetica, sans-serif" font-size="34" letter-spacing="-1" fill="${color}">Grid</text>` : ""}</svg>`
for (const grid of [false, true]) {
  const name = grid ? "dynostack-grid" : "dynostack"
  for (const [mode, color] of [
    ["light", identity.colors.ink],
    ["dark", identity.colors.paper],
  ]) {
    writeFileSync(
      path.join(dest, `${name}-mark-${mode}.svg`),
      mark(grid, color)
    )
    writeFileSync(
      path.join(dest, `${name}-wordmark-${mode}.svg`),
      wordmark(grid, color)
    )
  }
}
const board = `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1040" viewBox="0 0 1440 1040"><title>Dynostack brand identity</title><rect width="1440" height="1040" fill="#090a0b"/><text x="70" y="68" font-family="Arial,sans-serif" font-size="18" fill="#9298a1">DYNOSTACK / BRAND SYSTEM</text><text x="70" y="120" font-family="Arial,sans-serif" font-size="35" fill="#f4f5f7">One identity. Room for what comes next.</text><path d="M70 156H1370" stroke="#292c2f"/><g transform="translate(80 245) scale(2)">${paths(false, "#f4f5f7")}</g><text x="240" y="336" font-family="Arial,sans-serif" font-size="77" font-weight="700" letter-spacing="-4" fill="#f4f5f7">dynostack</text><text x="82" y="465" font-family="Arial,sans-serif" font-size="18" fill="#9298a1">The parent brand / a layered D with a forward signal.</text><g transform="translate(780 245) scale(2)">${paths(true, "#f4f5f7")}</g><text x="940" y="318" font-family="Arial,sans-serif" font-size="56" font-weight="700" letter-spacing="-3" fill="#f4f5f7">dynostack</text><text x="940" y="370" font-family="Arial,sans-serif" font-size="34" fill="#96baff">Grid</text><text x="782" y="465" font-family="Arial,sans-serif" font-size="18" fill="#9298a1">The first product / the same silhouette, a tiled core.</text><rect y="540" width="1440" height="500" fill="#fafafa"/><g transform="translate(100 665) scale(1.8)">${paths(false, "#16181c")}</g><text x="245" y="740" font-family="Arial,sans-serif" font-size="66" font-weight="700" letter-spacing="-3" fill="#16181c">dynostack</text><g transform="translate(810 665) scale(1.8)">${paths(true, "#16181c")}</g><text x="955" y="723" font-family="Arial,sans-serif" font-size="47" font-weight="700" letter-spacing="-2.5" fill="#16181c">dynostack</text><text x="955" y="773" font-family="Arial,sans-serif" font-size="32" fill="#525963">Grid</text><path d="M70 876H1370" stroke="#e2e4e7"/><text x="80" y="934" font-family="Arial,sans-serif" font-size="16" fill="#696e76">Small by design. Sharp at every size. SVG source, transparent background, light + dark variants.</text><g transform="translate(1130 930) scale(.5)">${paths(false, "#16181c")}</g><g transform="translate(1200 925) scale(.65)">${paths(true, "#16181c")}</g></svg>`
writeFileSync(path.join(dest, "identity-board.svg"), board)
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" rx="15" fill="#16181c"/><g transform="translate(11 8) scale(.9)">${paths(false, "#f4f5f7")}</g></svg>`
writeFileSync(path.join(root, "showcase/public/favicon.svg"), favicon)
console.log(
  "Created eight transparent SVG logo assets, an identity board, and favicon."
)
