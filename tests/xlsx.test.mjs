import { test } from 'node:test'
import assert from 'node:assert/strict'
import ExcelJS from 'exceljs'
import { createXlsxWorkbook } from '../dist/xlsx.js'
test('native workbook round-trip preserves cell types, literal formulas, formatting and sheets', async () => {
  const date = new Date('2026-10-07T00:00:00Z')
  const bytes = await createXlsxWorkbook([
    { name: 'Data', headers: ['Text', 'Amount', 'Enabled', 'Date'], rows: [['=SUM(A1:A3)', -123.5, true, date]], formats: { 1: '$#,##0.00', 3: 'yyyy-mm-dd' } },
    { name: 'Info', headers: ['Scope'], rows: [['Filtered loaded rows']] },
  ])
  assert.equal(Buffer.from(bytes).subarray(0, 2).toString(), 'PK')
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(Buffer.from(bytes))
  assert.equal(workbook.worksheets.length, 2)
  const sheet = workbook.getWorksheet('Data')
  assert.equal(sheet.getCell('A2').value, '=SUM(A1:A3)')
  assert.equal(sheet.getCell('A2').type, ExcelJS.ValueType.String)
  assert.equal(sheet.getCell('B2').value, -123.5)
  assert.equal(sheet.getCell('B2').numFmt, '$#,##0.00')
  assert.equal(sheet.getCell('C2').value, true)
  assert.equal(sheet.getCell('D2').value.toISOString(), date.toISOString())
  assert.equal(sheet.getCell('A1').font.bold, true)
  assert.equal(sheet.views[0].state, 'frozen')
  assert.equal(workbook.getWorksheet('Info').getCell('A2').value, 'Filtered loaded rows')
  await assert.rejects(createXlsxWorkbook([]))
  await assert.rejects(createXlsxWorkbook([{ name: 'Bad/name', headers: [], rows: [] }]))
})
