import {test} from 'node:test'
import assert from 'node:assert/strict'
import {chartPath,parseApplicationDiagram,connectorPath,applicationSvg,applicationMarkdown} from '../dist/core.js'
const sample={version:1,title:'App',description:'Reference',notes:'Not live',nodes:[{id:'a',label:'Client',kind:'client',x:0,y:0,description:'React'},{id:'b',label:'API',kind:'service',x:300,y:100,description:'Validate'}],connectors:[{id:'c',source:'a',target:'b',kind:'https',style:'curve',label:'Request'}]}
test('smooth chart interpolation remains within each pair of values, including reversals and plateaus',()=>{
 for(const values of [[0,10,1,12,0],[3,3,3,8,8],[-10,20,-30,40], [0,.001,1000,.002]]){
 const points=values.map((y,x)=>({x:x*10,y})),path=chartPath(points),segments=[...path.matchAll(/ C([^ ]+) ([^ ]+) ([^ ]+)/g)]
 assert.equal(segments.length,points.length-1)
 segments.forEach((match,i)=>{const c1=Number(match[1].split(',')[1]),c2=Number(match[2].split(',')[1]),b=Number(match[3].split(',')[1]),a=values[i]
 for(let j=0;j<=100;j++){const t=j/100,u=1-t,y=u*u*u*a+3*u*u*t*c1+3*u*t*t*c2+t*t*t*b;assert.ok(y>=Math.min(a,b)-1e-8&&y<=Math.max(a,b)+1e-8)}})
 }
 assert.equal(chartPath([]),'');assert.equal(chartPath([{x:1,y:2}]),'M1,2');assert.match(chartPath([{x:0,y:0},{x:1,y:1}],'linear'),/ L/);assert.match(chartPath([{x:0,y:0},{x:1,y:1}],'step'),/ H.* V/)
 assert.throws(()=>chartPath([{x:1,y:0},{x:1,y:1}]),/increasing/)
})
test('diagram import supports architecture cycles but rejects broken endpoints, duplicate IDs and unbounded coordinates',()=>{
 assert.deepEqual(parseApplicationDiagram(JSON.stringify(sample)),sample)
 const cyclic=structuredClone(sample);cyclic.connectors.push({...cyclic.connectors[0],id:'back',source:'b',target:'a'});assert.equal(parseApplicationDiagram(JSON.stringify(cyclic)).connectors.length,2)
 for(const mutate of [v=>v.nodes.push(v.nodes[0]),v=>v.nodes[0].x=Infinity,v=>v.connectors[0].target='missing',v=>v.connectors[0].style='script',v=>v.connectors[0].source='b']){const v=structuredClone(sample);mutate(v);assert.throws(()=>parseApplicationDiagram(JSON.stringify(v)))}
 assert.throws(()=>parseApplicationDiagram('broken'));assert.throws(()=>parseApplicationDiagram(' '.repeat(500001)),/large/)
})
test('SVG export escapes user labels and includes portable connectors, while notes contain real newlines',()=>{
 const v=structuredClone(sample);v.title='<script>alert(1)</script>';v.nodes[0].label='<img onerror="oops">';v.connectors[0].label='A & B'
 const svg=applicationSvg(v);assert.doesNotMatch(svg,/<script|<img/);assert.match(svg,/&lt;script&gt;/);assert.match(svg,/A &amp; B/);assert.match(svg,/marker-end/);assert.match(applicationMarkdown(sample),/## Connectors\n\n- Client -> API/)
 for(const style of ['curve','straight','elbow'])assert.match(connectorPath({...sample.connectors[0],style},sample.nodes),/^M/)
 assert.equal(connectorPath({...sample.connectors[0],target:'missing'},sample.nodes),'')
})

test('vertical connectors attach to top and bottom boundaries instead of crossing node bodies',()=>{
 const nodes=[{...sample.nodes[0],x:100,y:0},{...sample.nodes[1],x:100,y:200}]
 assert.equal(connectorPath({...sample.connectors[0],style:'straight'},nodes),'M190,80 L190,200')
 assert.equal(connectorPath({...sample.connectors[0],source:'b',target:'a',style:'straight'},nodes),'M190,200 L190,80')
})
