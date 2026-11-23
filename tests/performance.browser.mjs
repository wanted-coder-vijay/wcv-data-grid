import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width: 1214, height: 884 } })
const base = process.env.PERFORMANCE_BASE_URL || 'http://127.0.0.1:5189'
const errors = []; page.on('pageerror', error => { if (!errors.length) console.log('FIRST BROWSER ERROR', error.stack); errors.push(error.message) })
await mkdir('evidence', { recursive: true })
try {
  await page.goto(base + '/playground?config=' + encodeURIComponent(JSON.stringify({ dark: true, virtualRows: true, keyboard: true, expansion: true, features: { pagination: false } })))
  await page.getByRole('button', { name: 'Expand row', exact: true }).first().waitFor()
  await page.evaluate(() => {
    window.performanceProbe = { frames: 0, tasks: [], maxRows: 0 }
    const observer = new PerformanceObserver(list => window.performanceProbe.tasks.push(...list.getEntries().map(entry => entry.duration)))
    observer.observe({ type: 'longtask', buffered: false })
    function frame() {
      window.performanceProbe.frames++
      window.performanceProbe.maxRows = Math.max(window.performanceProbe.maxRows, document.querySelectorAll('tbody tr[data-index]').length)
      requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  })
  const started = Date.now()
  await page.getByLabel('Sample rows', { exact: true }).selectOption('50000')
  await page.getByRole('status').filter({ hasText: 'Preparing rows' }).waitFor()
  const responseMs = await page.evaluate(() => {
    const start = performance.now()
    const input = Array.from(document.querySelectorAll('label.switch-row')).find(label => label.textContent.includes('Striped rows')).querySelector('input')
    input.click()
    return performance.now() - start
  })
  await page.waitForFunction(() => document.querySelector('table[aria-label="Project workspace"]')?.getAttribute('aria-rowcount') === '50001')
  const loadMs = Date.now() - started
  const loading = await page.evaluate(() => window.performanceProbe)
  assert.ok(loading.frames > 5, 'preparation must yield frames')
  assert.ok(loading.maxRows < 100, 'all records must never mount')
  assert.ok(responseMs < 300, 'controls must respond during preparation')
  await page.getByRole('button', { name: 'Project ID', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Pin to left', exact: true }).click()
  const pinViewport = page.locator('[data-grid-scrollbar]').filter({ has: page.locator('table[aria-label="Project workspace"]') })
  await pinViewport.evaluate(element => { element.scrollLeft = 500 })
  const pinned = await page.locator('[data-nav-row="PRJ-001"][data-nav-column="id"]').boundingBox()
  const pinHeader = await page.locator('th[data-col-id="id"]').boundingBox()
  const pinBounds = await pinViewport.boundingBox()
  assert.ok(Math.abs(pinned.x - pinBounds.x) < 3)
  assert.ok(Math.abs(pinHeader.x - pinned.x) < 3)
  await pinViewport.evaluate(element => { element.scrollLeft = 0 })
  await page.getByRole('button', { name: 'Expand row', exact: true }).first().click()
  await page.locator('[data-virtual-detail]').waitFor()
  assert.ok(await page.locator('tbody tr[data-index]').count() < 100)
  await page.screenshot({ path: "evidence/virtual-50000-expanded.png" })
  const viewport = page.locator('[data-grid-scrollbar]').filter({ has: page.locator('table[aria-label="Project workspace"]') })
  const ordinary = await viewport.evaluate(async element => {
    const frames = []; let previous = performance.now()
    for (let index = 0; index < 120; index++) {
      await new Promise(resolve => requestAnimationFrame(resolve))
      const now = performance.now(); frames.push(now - previous); previous = now
      element.scrollTop = index * 120
    }
    return { averageFrameMs: frames.reduce((a,b) => a+b,0)/frames.length, maxFrameMs: Math.max(...frames) }
  })
  assert.ok(ordinary.averageFrameMs < 35, "ordinary scrolling must avoid sustained slow frames")
  await viewport.evaluate(element => { element.scrollTop = 0 })
  const scroll = await viewport.evaluate(async element => {
    const frames = [], counts = []; let previous = performance.now()
    for (let index = 0; index < 120; index++) {
      await new Promise(resolve => requestAnimationFrame(resolve))
      const now = performance.now(); frames.push(now - previous); previous = now
      element.scrollTop = index * 600
      counts.push(element.querySelectorAll('tbody tr[data-index]').length)
    }
    return { maxMounted: Math.max(...counts), averageFrameMs: frames.reduce((a,b) => a+b,0)/frames.length, maxFrameMs: Math.max(...frames) }
  })
  assert.ok(scroll.maxMounted < 100)
  await viewport.evaluate(element => { element.scrollTop = element.scrollHeight })
  await page.getByText('PRJ-50000', { exact: true }).waitFor()
  const last = page.locator('[data-nav-row="PRJ-50000"][data-nav-column="name"]')
  await last.focus(); await last.press('F2')
  const input = page.locator('tbody input[type=text]').first()
  await input.fill('Last row retained')
  await viewport.evaluate(element => { element.scrollTop = 0 })
  assert.equal(await input.inputValue(), 'Last row retained')
  assert.ok(await page.locator('tbody tr[data-index]').count() < 100)
  await input.press('Escape')
  await page.getByLabel('Sample rows', { exact: true }).selectOption('10000')
  await page.getByLabel('Sample rows', { exact: true }).selectOption('48')
  await page.waitForFunction(() => document.querySelector('table[aria-label="Project workspace"]')?.getAttribute('aria-rowcount') === '49')
  await page.waitForTimeout(1000)
  assert.equal(await page.locator('table[aria-label="Project workspace"]').getAttribute('aria-rowcount'), '49')
  const report = { loadMs, responseMs, preparationFrames: loading.frames, maxPreparationTaskMs: Math.max(0, ...loading.tasks), ...scroll, ordinaryAverageFrameMs: ordinary.averageFrameMs, ordinaryMaxFrameMs: ordinary.maxFrameMs }
  await writeFile('evidence/performance-50000.json', JSON.stringify(report, null, 2))
  console.log('PASS 50,000 rows, interactive preparation, bounded DOM with expansion, scrolling, last-row editing and canceled stale preparation', report)
  const menu = page.getByRole('button', { name: 'Open row actions', exact: true }).first()
  await menu.scrollIntoViewIfNeeded()
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  await menu.click(); await page.getByRole('button', { name: 'Edit', exact: true }).click()
  assert.equal(await page.locator('tbody select, tbody input[type=date]').count(), 0)
  const sizing = await page.locator('tbody [data-row-editing=true]').evaluate(row => Array.from(row.querySelectorAll('[data-cell-editor]')).map(editor => ({ field: editor.getBoundingClientRect(), cell: editor.closest('td').getBoundingClientRect() })))
  for (const size of sizing) assert.ok(size.field.width <= size.cell.width, 'editors must fit their columns')
  await page.locator('tbody [data-slot=select-trigger]').first().click()
  await page.getByRole('option', { name: 'Done', exact: true }).click()
  assert.match(await page.locator('tbody [data-slot=select-trigger]').first().innerText(), /Done/)
  await page.getByRole('button', { name: 'Date editor: Due date', exact: true }).click()
  await page.getByRole('grid', { name: 'October 2026', exact: true }).waitFor()
  await page.getByRole('gridcell', { name: '2026-10-15', exact: true }).click()
  assert.match(await page.getByRole('button', { name: 'Date editor: Due date', exact: true }).innerText(), /2026-10-15/)
  await page.getByRole('button', { name: 'Save row', exact: true }).click()
  await page.getByText('Row saved.', { exact: true }).waitFor()
  await page.locator('[data-nav-row="PRJ-001"][data-nav-column="date"]').focus()
  await page.keyboard.press('F2')
  await page.getByRole('gridcell', { name: '2026-10-15', exact: true }).waitFor()
  await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '2026-10-15')
  await page.keyboard.press('ArrowRight')
  await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '2026-10-16')
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), '2026-10-16')
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => document.activeElement?.getAttribute('data-nav-column') === 'date')
  await page.keyboard.press('F2')
  const contrast = await page.getByRole('gridcell', { name: '2026-10-15', exact: true }).evaluate(element => {
    const probe = document.createElement('span'); probe.style.backgroundColor = 'var(--primary)'; element.parentElement.append(probe)
    const expected = getComputedStyle(probe).backgroundColor, actual = getComputedStyle(element).backgroundColor
    probe.remove(); return { expected, actual }
  })
  assert.equal(contrast.actual, contrast.expected)
  await page.screenshot({ path: 'evidence/themed-calendar.png' })
  await page.keyboard.press('Escape')
  await page.keyboard.press('F2')
  await page.getByRole('combobox', { name: 'Year', exact: true }).click()
  await page.getByRole('option', { name: '2028', exact: true }).click()
  await page.getByRole('combobox', { name: 'Month', exact: true }).click()
  await page.getByRole('option', { name: 'Jan', exact: true }).click()
  await page.getByRole('gridcell', { name: '2028-01-31', exact: true }).click()
  await page.getByText('2028-01-31', { exact: true }).waitFor()
  await page.locator('[data-nav-row="PRJ-001"][data-nav-column="date"]').focus()
  await page.keyboard.press('F2')
  await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '2028-01-31')
  await page.keyboard.press('PageDown')
  await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '2028-02-29')
  await page.keyboard.press('Enter')
  await page.getByText('2028-02-29', { exact: true }).waitFor()
  console.log('PASS themed selectors/date calendar, row draft save, calendar keyboard and Escape focus restoration')
  await page.goto(base + '/docs#doc-16')
  await page.getByLabel('Search API', { exact: true }).fill('onRowSave')
  assert.ok(await page.locator('.api-declaration[open]').count() > 0)
  assert.match(await page.locator('.api-declaration').first().innerText(), /Promise<unknown>/)
  await page.getByLabel('Search API', { exact: true }).fill('virtualOverscan')
  assert.match(await page.locator('.api-declaration').first().innerText(), /number/)
  await page.screenshot({ path: 'evidence/api-reference.png' })
  assert.deepEqual(errors, [])
  console.log('PASS searchable source-generated API contracts')
} catch (error) { await page.screenshot({ path: 'evidence/performance-failure.png' }); throw error }
finally { await browser.close() }
