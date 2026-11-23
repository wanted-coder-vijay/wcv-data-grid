import test from 'node:test'
import assert from 'node:assert/strict'
import { createGridTransaction, replayGridTransaction, matchesGridFilter, parseGridClipboard, gridRangePatches, applyGridUpdates, summarizeGridValues, toggleGridRow, isGridRowSelected, DataTable } from '../dist/index.js'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
const rows = [{id:1, team:'A', amount:10}, {id:2, team:'A', amount:20}, {id:3, team:'B', amount:30}]
const editable = (_row, column) => column === 'amount'
test('bulk validation rejects the whole transaction and receives merged drafts', async () => {
  await assert.rejects(createGridTransaction(rows, [{rowId:'1',columnId:'amount',value:99},{rowId:'2',columnId:'amount',value:-1}], {editable, validate:v=>v<0?'Positive only':undefined}), /Positive only/)
  assert.equal(rows[0].amount,10)
  const change=await createGridTransaction(rows,[{rowId:'1',columnId:'amount',value:99}],{editable})
  assert.equal(change.after[0].amount,99); assert.equal(change.after[1],rows[1])
})
test('identity and prototype fields cannot be patched', async () => {
  for (const columnId of ['id','__proto__','constructor','missing']) await assert.rejects(createGridTransaction(rows,[{rowId:'1',columnId,value:2}],{editable:()=>true}), /not editable/)
})
test('undo preserves new rows and unrelated live changes, rejects field conflicts', async () => {
  const change=await createGridTransaction(rows,[{rowId:'1',columnId:'amount',value:99}],{editable})
  const live=[{...change.after[0],team:'C'}, ...change.after.slice(1),{id:4,amount:40,team:'D'}]
  const undone=replayGridTransaction(live,change,'undo'); assert.equal(undone[0].amount,10); assert.equal(undone[0].team,'C'); assert.equal(undone.length,4)
  assert.throws(()=>replayGridTransaction([{...live[0],amount:100},...live.slice(1)],change,'undo'), /Concurrent change/)
})
test('nested cross-column OR/AND filters preserve typed equality', () => {
  const f={operator:'and',children:[{column:'team',operator:'eq',value:'A'},{operator:'or',children:[{column:'amount',operator:'gt',value:15},{column:'amount',operator:'eq',value:10}]}]}
  assert.equal(rows.filter(row=>matchesGridFilter(row,f)).length,2)
  assert.equal(matchesGridFilter(rows[0],{column:'amount',operator:'eq',value:'10'}),false)
  assert.throws(()=>matchesGridFilter(rows[0],{operator:'xor',children:[]}), /Invalid/)
})
test('clipboard quoting and rectangle bounds', () => {
  assert.deepEqual(parseGridClipboard('"a\tb"\t"c""d"\r\n5\t6\n'),[['a\tb','c"d'],['5','6']])
  assert.throws(()=>parseGridClipboard('"unclosed'),/Unclosed/)
  assert.deepEqual(gridRangePatches(rows,['amount'],{row:1,column:0},[[50]]),[{rowId:'2',columnId:'amount',value:50}])
  assert.throws(()=>gridRangePatches(rows,['amount'],{row:2,column:0},[[1],[2]]),/beyond/)
  assert.throws(()=>gridRangePatches(rows,['amount'],{row:NaN,column:0},[[1]]),/beyond/)
})
test('query selection carries exclusions and invalidates a changed query', () => {
  const s=toggleGridRow({mode:'query',queryKey:'team=A',excludedIds:[]},'2',false,'team=A')
  assert.equal(isGridRowSelected(s,'1000','team=A'),true); assert.equal(isGridRowSelected(s,'2','team=A'),false); assert.equal(isGridRowSelected(s,'1','team=B'),false)
})
test('live updates report dirty conflicts instead of overwriting edits', () => {
  const result=applyGridUpdates(rows,[{type:'upsert',row:{id:1,amount:999,team:'A'}},{type:'delete',id:2},{type:'upsert',row:{id:4,amount:5,team:'C'}}],['1'])
  assert.equal(result.conflicts.length,1); assert.equal(result.rows[0].amount,10); assert.equal(result.rows.length,3)
})
test('summaries ignore invalid numbers and handle empty sets', () => {
  assert.equal(summarizeGridValues([1,2,NaN,null],'mean'),1.5); assert.equal(summarizeGridValues([],'sum'),0); assert.equal(summarizeGridValues([],'min'),null)
  assert.equal(summarizeGridValues(Array.from({length:100_000},(_,i)=>i),'max'),99999)
})
test('grouping renders sums and avoids actions on synthetic rows', () => {
  const html=renderToStaticMarkup(createElement(DataTable,{data:rows,columns:[{accessorKey:'team'},{accessorKey:'amount',aggregationFn:'sum'}],initialGrouping:['team'],features:{grouping:true},rowActions:['edit'],ariaLabel:'Grouped sample'}))
  assert.match(html,/Expand group A/); assert.match(html,/>30</); assert.match(html,/Clear grouping/)
})
test('virtual loading renders one correctly sized skeleton per visible column', () => {
  const html=renderToStaticMarkup(createElement(DataTable,{data:[],columns:[{accessorKey:'team',size:150},{accessorKey:'amount',size:200}],isLoading:true,virtualizeRows:true,enableSelection:false,rowActions:[],initialPageSize:2}))
  assert.equal((html.match(/data-loading-row/g)||[]).length,2); assert.match(html,/width:200px;flex-shrink:0/)
})
