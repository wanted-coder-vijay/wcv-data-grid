import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.SEO_BASE_URL || 'http://127.0.0.1:5182'
const canonical = 'https://dynostack-react-grid.vercel.app'
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true })
try {
  const staticContext = await browser.newContext({ javaScriptEnabled: false })
  const staticPage = await staticContext.newPage()
  for (const path of ['/', '/playground', '/docs']) {
    const response = await staticPage.goto(base + path)
    assert.equal(response.status(), 200)
    assert.match(await staticPage.title(), /Dynostack/)
    assert.equal(await staticPage.locator('link[rel=canonical]').getAttribute('href'), canonical + path)
    assert.equal(await staticPage.locator('h1').count(), 1)
    assert.equal(await staticPage.locator('h1').isVisible(), true)
    assert.ok((await staticPage.locator('body').innerText()).length > 1000)
    console.log(`PASS ${path} readable with JavaScript disabled`)
  }
  await staticContext.close()
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(base)
  const nav = page.getByRole('navigation', { name: 'Main navigation' })
  await nav.getByRole('link', { name: 'Documentation', exact: true }).click()
  await page.waitForFunction(() => document.title.includes('Documentation'))
  assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), canonical + '/docs')
  await nav.getByRole('link', { name: 'Playground', exact: true }).click()
  await page.waitForFunction(() => document.title.includes('Playground'))
  assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), canonical + '/playground')
  await page.goBack()
  await page.waitForFunction(() => document.title.includes('Documentation'))
  await page.goForward()
  await page.waitForFunction(() => document.title.includes('Playground'))
  for (const selector of ['title', 'link[rel=canonical]', 'meta[name=description]', 'meta[property="og:url"]', '#dynostack-schema']) {
    assert.equal(await page.locator(selector).count(), 1, selector)
  }
  const schema = JSON.parse(await page.locator('#dynostack-schema').textContent())
  assert.ok(schema['@graph'].some(node => node['@type'] === 'WebPage' && node.url.endsWith('/playground')))
  await page.goto(base + '/docs')
  await page.waitForFunction(() => document.title.includes('Documentation'))
  assert.deepEqual(errors, [])
  await mkdir('evidence', { recursive: true })
  await page.screenshot({ path: 'evidence/seo-docs-verified.png', fullPage: true })
  console.log('PASS client navigation, history, direct routes and metadata stay consistent; no browser errors')
} finally { await browser.close() }
