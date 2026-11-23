import assert from 'node:assert/strict'
import { mkdir, readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.STUDIO_BASE_URL || 'http://127.0.0.1:5192'
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || 'msedge',
  headless: true,
})
const page = await browser.newPage({ viewport: { width: 1512, height: 1050 } })
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
await mkdir('evidence/studio', { recursive: true })
const tool = () => page.locator('.ds-tool')
async function choose(name) {
  await page
    .getByRole('navigation', { name: 'Studio tools' })
    .getByRole('button', { name, exact: true })
    .click()
}
async function screenshot(name) {
  await page.screenshot({ path: `evidence/studio/${name}.png`, fullPage: true })
}
async function download(button, filename) {
  const promise = page.waitForEvent('download')
  await button.click()
  const item = await promise
  await item.saveAs(`evidence/studio/${filename}`)
  return readFile(`evidence/studio/${filename}`, 'utf8')
}
try {
  await page.goto(base + '/studio')
  await page
    .getByRole('heading', { name: 'Form builder', exact: true })
    .waitFor()
  await page.getByRole('button', { name: 'Switch to light mode' }).click()
  await screenshot('forms-design')
  await tool().getByRole('button', { name: 'Preview form' }).click()
  await tool().getByRole('button', { name: 'Continue', exact: true }).click()
  await tool().getByText('Project name is required.', { exact: true }).waitFor()
  await tool()
    .getByLabel('Project name', { exact: false })
    .fill('Studio launch')
  await tool()
    .getByLabel('Department', { exact: false })
    .selectOption('Engineering')
  await tool().getByLabel('Estimated budget', { exact: false }).fill('12500')
  await tool()
    .getByLabel('Target platform', { exact: true })
    .selectOption('Web')
  await tool().getByLabel('Department', { exact: false }).selectOption('Design')
  assert.equal(
    await tool().getByLabel('Target platform', { exact: true }).count(),
    0
  )
  await tool().getByRole('button', { name: 'Continue', exact: true }).click()
  await tool()
    .getByLabel('Work email', { exact: false })
    .fill('team@example.com')
  await tool().getByLabel('I agree to be contacted', { exact: false }).check()
  await page.getByLabel('Simulate save failure').check()
  await tool().getByRole('button', { name: 'Submit response' }).click()
  await tool()
    .getByText(/Demo save failed/)
    .waitFor()
  assert.equal(
    await tool().getByLabel('Work email', { exact: false }).inputValue(),
    'team@example.com'
  )
  await page.getByLabel('Simulate save failure').uncheck()
  await tool().getByRole('button', { name: 'Submit response' }).click()
  await tool().getByText('Response submitted.', { exact: true }).waitFor()
  const response = JSON.parse(
    await page.locator('.ds-studio-responses pre').innerText()
  )
  assert.equal(response.project, 'Studio launch')
  assert.equal('platform' in response, false)
  console.log(
    'PASS forms: required validation, multistep preview, conditional payload, async failure retention and retry'
  )
  await choose('Scheduler')
  await screenshot('scheduler')
  await tool()
    .getByRole('button', { name: 'New appointment', exact: true })
    .click()
  await tool().getByLabel('Appointment title').fill('QA session')
  await tool()
    .getByLabel('Start (UTC)', { exact: true })
    .fill('2026-10-05T04:30')
  await tool().getByLabel('End (UTC)', { exact: true }).fill('2026-10-05T05:30')
  await tool()
    .getByRole('button', { name: 'Save appointment', exact: true })
    .click()
  await tool()
    .getByText(/already has an appointment/)
    .waitFor()
  await tool()
    .getByLabel('Start (UTC)', { exact: true })
    .fill('2026-10-08T06:00')
  await tool().getByLabel('End (UTC)', { exact: true }).fill('2026-10-08T07:00')
  await page.getByLabel('Simulate save failure').check()
  await tool()
    .getByRole('button', { name: 'Save appointment', exact: true })
    .click()
  await tool()
    .getByText(/Demo save failed/)
    .waitFor()
  assert.equal(
    await tool().getByLabel('Appointment title').inputValue(),
    'QA session'
  )
  await page.getByLabel('Simulate save failure').uncheck()
  await tool()
    .getByRole('button', { name: 'Save appointment', exact: true })
    .click()
  await tool()
    .getByRole('button', { name: /QA session/ })
    .waitFor()
  await tool().getByLabel('Timezone', { exact: true }).selectOption('UTC')
  await tool().getByRole('button', { name: 'Agenda', exact: true }).click()
  assert.match(
    await tool()
      .getByRole('button', { name: /QA session/ })
      .innerText(),
    /06:00/
  )
  await tool().getByRole('button', { name: 'Week', exact: true }).click()
  console.log(
    'PASS scheduling: conflict rejection, UTC timezone display, async save failure and retry'
  )
  await choose('Dashboard builder')
  await screenshot('dashboard')
  await tool().getByRole('button', { name: '＋ Metric', exact: true }).click()
  await tool().getByLabel('Widget title', { exact: true }).fill('Retention')
  await tool().getByLabel('Metric value', { exact: true }).fill('87')
  await tool().getByLabel('Unit', { exact: true }).fill('%')
  await tool()
    .getByRole('button', { name: 'Resize Retention', exact: true })
    .click()
  await tool()
    .getByRole('button', { name: 'Move Retention earlier', exact: true })
    .click()
  const config = JSON.parse(
    await download(
      tool().getByRole('button', { name: 'Export JSON', exact: true }),
      'dashboard.json'
    )
  )
  assert.equal(config.widgets[4].title, 'Retention')
  assert.equal(config.widgets[4].width, 2)
  await page.getByLabel('Simulate save failure').check()
  await tool().getByRole('button', { name: 'Save layout' }).click()
  await tool()
    .getByText(/Demo save failed/)
    .waitFor()
  assert.equal(
    await tool().getByLabel('Widget title').inputValue(),
    'Retention'
  )
  await page.getByLabel('Simulate save failure').uncheck()
  await tool().getByRole('button', { name: 'Save layout' }).click()
  await tool().getByText('Saved successfully.').waitFor()
  console.log(
    'PASS dashboards: widget editing, reorder, resize, configuration download and save recovery'
  )
  await choose('Workflow designer')
  await screenshot('workflow')
  await tool().getByRole('button', { name: 'Run simulation' }).click()
  await tool().getByText('Completed simulation', { exact: true }).waitFor()
  assert.match(
    await tool().locator('.ds-simulation ol').innerText(),
    /Finance review/
  )
  await tool().getByLabel('Sample input').fill('{"amount": 100}')
  await tool().getByRole('button', { name: 'Run simulation' }).click()
  assert.doesNotMatch(
    await tool().locator('.ds-simulation ol').innerText(),
    /Finance review/
  )
  await tool().getByLabel('Sample input').fill('{"amount": 20000}')
  await tool().getByLabel('Reviewer decision').selectOption('rejected')
  await tool().getByRole('button', { name: 'Run simulation' }).click()
  await tool().getByText('Rejected by Priya Shah', { exact: true }).waitFor()
  const node = tool().getByRole('button', {
    name: 'Select Budget check',
    exact: true,
  })
  await node.focus()
  await node.press('ArrowRight')
  assert.equal(await node.evaluate((element) => element.style.left), '325px')
  await tool().getByLabel('Diagram zoom', { exact: true }).selectOption('1')
  await node.scrollIntoViewIfNeeded()
  const nodeBox = await node.boundingBox()
  await page.mouse.move(nodeBox.x + 90, nodeBox.y + 35)
  await page.mouse.down()
  await page.mouse.move(nodeBox.x + 150, nodeBox.y + 35, { steps: 8 })
  await page.mouse.up()
  assert.equal(await node.evaluate((element) => element.style.left), '385px')
  await tool().getByRole('button', { name: 'Fit diagram' }).click()
  await tool()
    .getByRole('button', { name: '＋ Condition', exact: true })
    .click()
  assert.equal(
    await tool().getByRole('button', { name: 'Save workflow' }).isDisabled(),
    true
  )
  await tool().getByRole('button', { name: 'Delete step', exact: true }).click()
  assert.equal(
    await tool().getByRole('button', { name: 'Save workflow' }).isEnabled(),
    true
  )
  console.log(
    'PASS workflows: yes/no paths, approval rejection, keyboard node moves and invalid graph save gate'
  )
  await choose('Gantt planner')
  await screenshot('gantt')
  await tool().getByRole('button', { name: 'Capture baseline' }).click()
  const research = tool().getByRole('button', {
    name: /Discovery & research, 2026-10-05/,
  })
  await research.focus()
  await research.press('ArrowRight')
  await tool()
    .getByRole('button', { name: /Discovery & research, 2026-10-06/ })
    .waitFor()
  await tool()
    .getByRole('button', { name: /Interface design, 2026-10-09/ })
    .waitFor()
  assert.equal(await tool().locator('.ds-baseline').count(), 6)
  await tool()
    .getByRole('button', { name: /Launch, 2026-10-24/ })
    .waitFor()
  await screenshot('gantt-rescheduled')
  const movedResearch = tool().getByRole('button', {
    name: /Discovery & research, 2026-10-06/,
  })
  await movedResearch.scrollIntoViewIfNeeded()
  const barBox = await movedResearch.boundingBox()
  await page.mouse.move(barBox.x + 30, barBox.y + 12)
  await page.mouse.down()
  await page.mouse.move(barBox.x + 110, barBox.y + 12, { steps: 12 })
  await page.mouse.up()
  await tool()
    .getByRole('button', { name: /Discovery & research, 2026-10-08/ })
    .waitFor()
  console.log(
    'PASS Gantt: keyboard movement cascades through dependencies and baseline stays fixed'
  )
  await choose('Document editor')
  await screenshot('document-write')
  const paragraph = tool().getByLabel('Block 1 text', { exact: true })
  await paragraph.fill('Safe <img src=x onerror=alert(1)> content')
  await paragraph.evaluate((element) => {
    element.focus()
    element.setSelectionRange(0, 4)
  })
  await paragraph.press('Control+b')
  assert.match(await paragraph.inputValue(), /^\*\*Safe\*\*/)
  await tool()
    .getByLabel('Add attachment', { exact: true })
    .setInputFiles({
      name: 'brief.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Attached draft'),
    })
  await tool().getByText('brief.txt', { exact: true }).waitFor()
  await page.getByLabel('Simulate save failure').check()
  await tool()
    .getByRole('button', { name: 'Save document', exact: true })
    .click()
  await tool()
    .getByText(/Demo save failed/)
    .waitFor()
  assert.match(await paragraph.inputValue(), /^\*\*Safe\*\*/)
  await page.getByLabel('Simulate save failure').uncheck()
  await tool()
    .getByRole('button', { name: 'Save document', exact: true })
    .click()
  await tool().getByText('Saved successfully.').waitFor()
  await tool().getByRole('button', { name: 'Read', exact: true }).click()
  assert.equal(await tool().locator('.ds-document-paper img').count(), 0)
  assert.equal(
    await tool()
      .locator('.ds-document-paper strong')
      .getByText('Safe', { exact: true })
      .count(),
    1
  )
  const markdown = await download(
    tool().getByRole('button', { name: 'Export Markdown' }),
    'document.md'
  )
  assert.match(markdown, /\*\*Safe\*\*/)
  await screenshot('document-read')
  console.log(
    'PASS documents: keyboard formatting, safe HTML rendering, attachment metadata, export and failed-save retention'
  )
  await choose('Chart explorer')
  await screenshot('charts')
  await tool().getByRole('button', { name: 'Jan', exact: true }).focus()
  assert.match(await tool().locator('.ds-chart-readout').innerText(), /18,000/)
  await tool().getByRole('button', { name: 'Jan', exact: true }).click()
  await tool().getByLabel('Chart type', { exact: true }).selectOption('bar')
  await tool()
    .getByRole('button', { name: 'Operating costs', exact: true })
    .click()
  const range = tool().getByLabel('Chart range start', { exact: true })
  await range.fill('3')
  const csv = await download(
    tool().getByRole('button', { name: 'Export visible CSV' }),
    'chart.csv'
  )
  assert.match(csv, /Apr/)
  assert.doesNotMatch(csv, /Jan/)
  await tool().getByRole('button', { name: 'Revenue', exact: true }).click()
  await tool()
    .getByText('Enable a series to display the chart.', { exact: true })
    .waitFor()
  console.log(
    'PASS charts: keyboard point inspection, drill-down, chart types, series toggles, range and CSV export'
  )
  await page
    .getByRole('button', { name: 'Integration docs', exact: true })
    .click()
  assert.match(
    await page.locator('.ds-studio-example code').innerText(),
    /react-studio\/charts/
  )
  await page
    .getByRole('button', { name: 'Playground', exact: true })
    .last()
    .click()
  await tool().getByRole('button', { name: 'Revenue', exact: true }).click()
  await page.setViewportSize({ width: 390, height: 844 })
  for (const name of [
    'Form builder',
    'Scheduler',
    'Dashboard builder',
    'Workflow designer',
    'Gantt planner',
    'Document editor',
    'Chart explorer',
  ]) {
    await choose(name)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    )
    assert.equal(overflow, false, `${name} overflows mobile viewport`)
    await screenshot('mobile-' + name.split(' ')[0].toLowerCase())
  }
  await page.setViewportSize({ width: 1512, height: 1050 })
  await page.getByRole('button', { name: 'Switch to dark mode' }).click()
  await choose('Dashboard builder')
  await screenshot('dashboard-dark')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await choose('Workflow designer')
  await screenshot('workflow-dark-reduced-motion')
  assert.deepEqual(errors, [])
  console.log('PASS all seven mobile layouts and zero browser runtime errors')
} catch (error) {
  await screenshot('failure')
  console.log((await page.locator('body').innerText()).slice(-5000))
  throw error
} finally {
  await browser.close()
}
