import ts from 'typescript'
import { fileURLToPath } from 'node:url'
process.chdir(fileURLToPath(new URL('../', import.meta.url)))
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
const groups = []
const files = readdirSync('src').filter(file => /\.tsx?$/.test(file) && !['progressive-row-model.ts', 'date-editor.tsx'].includes(file))
const defaults = { enableKeyboardNavigation: 'false', virtualizeRows: 'false', virtualOverscan: '8', virtualRowHeight: 'density estimate (36 / 40 / 52 px)', density: '"default"', isolate: 'false', maxHeight: '480px when virtualized; otherwise unconstrained', initialPageSize: '10', enableSelection: 'true', pageSizeOptions: '[10, 25, 50, 100]', stickyHeader: 'false', striped: 'false', exportFileName: '"export"', rowActions: '["view", "edit", "duplicate", "delete"]', confirmDelete: 'true', viewSheet: 'built-in panel', state: 'internal state', savedViews: 'disabled', features: 'see DataTableFeatures', dataSource: 'disabled', ariaLabel: '"Data table"' }
const program = ts.createProgram(['src/index.ts', 'src/xlsx.ts'], { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, skipLibCheck: true, moduleResolution: ts.ModuleResolutionKind.Bundler })
const checker = program.getTypeChecker()
const publicNames = new Set()
const entrySymbol = checker.getSymbolAtLocation(program.getSourceFile('src/index.ts'))
if (entrySymbol) for (const symbol of checker.getExportsOfModule(entrySymbol)) publicNames.add(symbol.name)
const index = ts.createSourceFile('src/index.ts', readFileSync('src/index.ts','utf8'), ts.ScriptTarget.Latest, true)
index.forEachChild(node => { if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) node.exportClause.elements.forEach(element => publicNames.add((element.propertyName ?? element.name).text)) })
publicNames.add('ColumnMeta'); publicNames.add('XlsxSheet'); publicNames.add('createXlsxWorkbook'); publicNames.add('exportToXlsx')
for (const file of files) {
 const source = program.getSourceFile('src/' + file) ?? ts.createSourceFile(file, readFileSync('src/' + file,'utf8'), ts.ScriptTarget.Latest,true)
 function visit(node) {
  const name = node.name?.getText(source)
  if (name && publicNames.has(name) && (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node))) {
   const type = ts.isTypeAliasDeclaration(node) ? node.type : node
   const members = ts.isTypeLiteralNode(type) || ts.isInterfaceDeclaration(type) ? type.members : []
   const props = members.filter(ts.isPropertySignature).map(member => ({ name: member.name.getText(source), optional: !!member.questionToken, type: member.type?.getText(source) ?? 'unknown', description: (member.jsDoc ?? []).map(doc => typeof doc.comment === 'string' ? doc.comment : '').join(' '), default: name === 'DataTableProps' ? defaults[member.name.getText(source)] ?? 'not supplied' : '' }))
   groups.push({ name, file: 'src/' + file, definition: node.getText(source), props })
  }
  if (name && publicNames.has(name) && ts.isFunctionDeclaration(node) && !/^[A-Z]/.test(name)) {
   const signature = `${name}${node.typeParameters?.length ? '<' + node.typeParameters.map(p => p.getText(source)).join(', ') + '>' : ''}(${node.parameters.map(p => p.getText(source)).join(', ')}): ${node.type?.getText(source) ?? checker.typeToString(checker.getSignatureFromDeclaration(node)?.getReturnType() ?? checker.getTypeAtLocation(node), undefined, ts.TypeFormatFlags.NoTruncation)}`
   groups.push({ name, file: 'src/' + file, definition: signature, props: [] })
  }
  if (ts.isVariableDeclaration(node) && name && publicNames.has(name)) groups.push({ name, file: 'src/' + file, definition: name + ': ' + (node.type?.getText(source) ?? checker.typeToString(checker.getTypeAtLocation(node))), props: [] })
  ts.forEachChild(node, visit)
 }
 visit(source)
}
// Inferred non-void helpers are described explicitly; signatures above retain annotated arguments.
for (const group of groups) if (group.name === 'isFilterActive') group.definition = group.definition.replace(/: void$/, ': boolean')
const order = ['DataTableProps', 'DataTableFeatures', 'ColumnMeta', 'DataTableState', 'DataTableDataSource', 'DataTableFetchParams', 'DataTableDataSourceResult', 'DataTableSavedViewsConfig', 'DataTableSavedView', 'DataTableViewState', 'ViewSheetConfig', 'ViewSheetLabels', 'ConfirmDeleteConfig', 'CustomRowAction', 'DataTableLabels']
groups.sort((a,b) => (order.indexOf(a.name) < 0 ? 100 : order.indexOf(a.name)) - (order.indexOf(b.name) < 0 ? 100 : order.indexOf(b.name)) || a.name.localeCompare(b.name))
writeFileSync('showcase/src/api-reference.ts', '// Generated from source declarations by scripts/generate-api-docs.mjs.\nexport const apiReference = ' + JSON.stringify(groups,null,2) + ' as const\n')
writeFileSync('API_REFERENCE.md', '# Dynostack React Grid API reference\n\nAPI for the 0.6.0 release. Regenerate with `node scripts/generate-api-docs.mjs`. Full usage examples are on the website docs and in ADVANCED_GRID.md.\n\n' + groups.map(group => '## ' + group.name + '\n\n```ts\n' + group.definition + '\n```\n' + (group.props.length ? '\n| Property | Optional | Default | Behavior |\n| --- | --- | --- | --- |\n' + group.props.map(p => '| `' + p.name + '` | ' + p.optional + ' | ' + p.default.replaceAll('|','\\|') + ' | ' + p.description.replaceAll('|','\\|').replaceAll('\n',' ') + ' |').join('\n') + '\n' : '')).join('\n'))
console.log(`Generated ${groups.length} API declarations, ${groups.find(g => g.name === 'DataTableProps').props.length} table props`)
