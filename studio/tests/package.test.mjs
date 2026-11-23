import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
const require = createRequire(import.meta.url)
const components = {
  forms: 'FormBuilder',
  scheduler: 'Scheduler',
  dashboard: 'DashboardBuilder',
  workflow: 'WorkflowDesigner',
  gantt: 'GanttPlanner',
  document: 'DocumentEditor',
  charts: 'ChartExplorer',
  application: 'ApplicationDesigner',
}
test('all published subpaths contain ESM, CJS, declarations and standalone CSS', async () => {
  const pkg = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  )
  for (const [subpath, entry] of Object.entries(pkg.exports)) {
    for (const file of typeof entry === 'string'
      ? [entry]
      : Object.values(entry))
      assert.equal(
        existsSync(new URL('../' + file, import.meta.url)),
        true,
        `${subpath}: ${file}`
      )
    if (components[subpath.slice(2)]) {
      const esm = await import(new URL('../' + entry.import, import.meta.url))
      const cjs = require(
        new URL('../' + entry.require, import.meta.url).pathname.replace(
          /^\/([A-Za-z]:)/,
          '$1'
        )
      )
      assert.equal(typeof esm[components[subpath.slice(2)]], 'function')
      assert.equal(typeof cjs[components[subpath.slice(2)]], 'function')
    }
  }
  assert.equal(existsSync(new URL('../LICENSE', import.meta.url)), true)
  assert.deepEqual(Object.keys(pkg.peerDependencies).sort(), [
    'react',
    'react-dom',
  ])
})
test('all modules render on the server without window, storage or browser APIs', async () => {
  const values = {
    application: {version:1,title:"Architecture",description:"",notes:"",nodes:[],connectors:[]},
    forms: {
      version: 1,
      title: 'Form',
      description: '',
      steps: ['Details'],
      fields: [],
    },
    scheduler: { version: 1, resources: [], events: [] },
    dashboard: { version: 1, title: 'Dashboard', widgets: [] },
    workflow: { version: 1, title: 'Workflow', nodes: [], edges: [] },
    gantt: { version: 1, title: 'Plan', tasks: [] },
    document: { version: 1, title: 'Document', blocks: [], attachments: [] },
    charts: {
      version: 1,
      title: 'Chart',
      kind: 'line',
      series: [],
      points: [],
    },
  }
  for (const [module, component] of Object.entries(components)) {
    const imported = await import(
      new URL(`../dist/${module}.js`, import.meta.url)
    )
    const html = renderToString(
      createElement(imported[component], {
        value: values[module],
        onChange: () => {},
        anchorDate: '2026-10-08',
      })
    )
    assert.match(html, /ds-tool/)
    assert.doesNotMatch(html, /NaN|Invalid Date/)
  }
})
