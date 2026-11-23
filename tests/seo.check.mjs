import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { test } from 'node:test'
const root = new URL('../showcase/', import.meta.url)
const origin = 'https://dynostack-react-grid.vercel.app'
const routes = ['/', '/playground', '/docs', '/studio', '/blocks', '/api-playground']
test('every public route ships distinct metadata and actual content without JavaScript', () => {
  const titles = new Set()
  for (const route of routes) {
    const html = readFileSync(new URL(`dist${route === '/' ? '' : route}/index.html`, root), 'utf8')
    const title = html.match(/<title>(.*?)<\/title>/)?.[1]
    assert.ok(title?.includes('Dynostack'))
    titles.add(title)
    assert.equal((html.match(/<title>/g) || []).length, 1)
    assert.match(html, new RegExp(`rel="canonical" href="${origin.replaceAll('.', '\\.')}\\${route}"`))
    assert.match(html, /name="description" content="[^"]{80,}"/)
    assert.match(html, /property="og:title"/)
    assert.match(html, /name="twitter:card" content="summary_large_image"/)
    assert.match(html, /<h1[ >]/)
    assert.match(html, /href="https:\/\/www.npmjs.com\/package\/@dynostack\/react-grid"/)
    assert.doesNotMatch(html, /noindex|<div id="root"><\/div>/)
    const schema = JSON.parse(html.match(/id="dynostack-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])
    assert.ok(schema['@graph'].some(node => node['@type'] === 'WebPage'))
    if (route === '/') {
      assert.ok(schema['@graph'].some(node => node['@type'] === 'WebSite' && node.name === 'Dynostack'))
      const logo = schema['@graph'].find(node => node['@type'] === 'Organization').logo
      assert.ok(existsSync(new URL(`public${new URL(logo).pathname}`, root)))
    }
  }
  assert.equal(titles.size, routes.length)
})
test('sitemap, robots and deployment routes preserve crawlable URLs', () => {
  const sitemap = readFileSync(new URL('dist/sitemap.xml', root), 'utf8')
  const robots = readFileSync(new URL('dist/robots.txt', root), 'utf8')
  assert.match(robots, /Allow: \/\r?\n/)
  assert.match(robots, /Sitemap: https:\/\/dynostack-react-grid.vercel.app\/sitemap.xml/)
  assert.deepEqual([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]), routes.map(route => origin + route))
  const config = JSON.parse(readFileSync(new URL('vercel.json', root), 'utf8'))
  for (const route of routes.slice(1)) assert.equal(config.rewrites.find(rule => rule.source === route).destination, `${route}/index.html`)
})
