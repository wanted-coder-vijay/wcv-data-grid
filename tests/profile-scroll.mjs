import { createRequire } from 'node:module'
import { writeFile } from 'node:fs/promises'
const require=createRequire(import.meta.url)
const {chromium}=require(process.env.PLAYWRIGHT_MODULE)
const browser=await chromium.launch({channel:'msedge',headless:true})
const page=await browser.newPage({viewport:{width:1214,height:884}})
await page.goto('http://127.0.0.1:5189/playground?config='+encodeURIComponent(JSON.stringify({virtualRows:true,count:50000,features:{pagination:false}})))
await page.waitForFunction(()=>document.querySelector('table')?.getAttribute('aria-rowcount')==='50001')
const cdp=await page.context().newCDPSession(page)
await cdp.send('Profiler.enable');await cdp.send('Performance.enable')
const before=await cdp.send('Performance.getMetrics')
console.log('heights', await page.locator('tbody tr[data-index]').evaluateAll(rows=>rows.map(row=>row.getBoundingClientRect().height)))
await cdp.send('Profiler.start')
await page.locator('[data-grid-scrollbar]').filter({has:page.locator('table')}).evaluate(async element=>{
  for(let i=0;i<120;i++){await new Promise(resolve=>requestAnimationFrame(resolve));element.scrollTop=i*120}
})
const {profile}=await cdp.send('Profiler.stop')
const after=await cdp.send('Performance.getMetrics')
await writeFile('evidence/scroll.cpuprofile',JSON.stringify(profile))
const counts={};for(const id of profile.samples??[])counts[id]=(counts[id]??0)+1
console.log(profile.nodes.map(n=>({name:n.callFrame.functionName,line:n.callFrame.lineNumber,column:n.callFrame.columnNumber,samples:counts[n.id]??0})).sort((a,b)=>b.samples-a.samples).slice(0,20))
console.log(after.metrics.filter(m=>/Duration/.test(m.name)).map(m=>({name:m.name,delta:m.value-(before.metrics.find(a=>a.name===m.name)?.value??0)})))
await browser.close()
