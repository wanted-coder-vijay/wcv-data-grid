import assert from "node:assert/strict"
import { chromium } from "playwright"

const base = process.env.GRID_URL || "http://127.0.0.1:5196"
const browser = await chromium.launch({ channel: "msedge" })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  page.on("pageerror", e => errors.push(e.message))
  await page.addInitScript(() => {
    window.tones = 0
    const start = OscillatorNode.prototype.start
    OscillatorNode.prototype.start = function (...args) { window.tones++; return start.apply(this, args) }
  })
  await page.goto(base + "/playground")
  const grips = page.locator("button.grid-row-grip")
  await grips.first().waitFor()
  const labels = () => grips.evaluateAll(nodes => nodes.map(n => n.getAttribute("aria-label")))
  const original = await labels()
  const row = i => grips.nth(i).locator("xpath=ancestor::tr")
  await row(1).getByLabel("Select row", {exact:true}).check()
  await row(3).getByLabel("Select row", {exact:true}).check()
  await grips.first().scrollIntoViewIfNeeded()
  const center = async locator => {
    const b = await locator.boundingBox()
    return { x: b.x + b.width/2, y: b.y + b.height/2 }
  }
  const start = await center(grips.nth(3))
  const end = await center(grips.first())
  await page.mouse.move(start.x,start.y)
  await page.mouse.down()
  await page.mouse.move(end.x,end.y-5,{steps:15})
  assert.equal(await page.locator("[data-row-lifted]").count(), 2)
  assert.equal(await page.locator("[data-row-lifted]").first().evaluate(el => new DOMMatrix(getComputedStyle(el).transform).b), 0)
  if (process.env.GRID_SCREENSHOT) await page.screenshot({path:process.env.GRID_SCREENSHOT})
  await page.mouse.up()
  await page.waitForFunction(label => document.querySelector(".grid-row-grip")?.getAttribute("aria-label") === label,original[1])
  assert.deepEqual((await labels()).slice(0,4), [original[1],original[3],original[0],original[2]])
  await grips.nth(2).press("ArrowDown")
  assert.equal((await labels())[3], original[0])
  assert.ok(await page.evaluate(() => window.tones > 0))
  await page.getByRole("button",{name:"Mute action sounds"}).click()
  const muted = await page.evaluate(() => window.tones)
  await grips.nth(3).press("ArrowUp")
  assert.equal(await page.evaluate(() => window.tones), muted)
  await page.reload()
  await page.getByRole("button",{name:"Enable action sounds"}).waitFor()
  assert.deepEqual(errors, [])
  console.log("Verified horizontal multi-row drag, keyboard reorder, synthesized tones, mute and persisted preference at", base)
} finally { await browser.close() }
