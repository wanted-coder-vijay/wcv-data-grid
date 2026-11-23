const workerSource = String.raw`self.onmessage=async({data})=>{try{const fn=new Function('params','change',data.code+'\nreturn '+(data.operation==='load'?'load(params)':'save(change)'));const result=await fn(data.params,data.change);self.postMessage({ok:true,result})}catch(error){self.postMessage({ok:false,error:String(error.message||error)})}}`
const bootstrap = `
let worker;
addEventListener('message', event => {
  if (event.source !== parent || event.data?.type !== 'run') return;
  worker?.terminate();
  const source = ${JSON.stringify(workerSource)};
  const url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));
  worker=new Worker(url); URL.revokeObjectURL(url);
  worker.onmessage=event=>parent.postMessage({id:requestId,...event.data},'*');
  worker.onerror=event=>parent.postMessage({id:requestId,ok:false,error:event.message||'Sandbox worker failed'},'*');
  const requestId=event.data.id; worker.postMessage(event.data);
});`
/** Each execution gets a disposable opaque-origin frame and terminable worker. */
export function runApiCode(code: string, operation: "load" | "save", params: unknown, change: unknown, signal?: AbortSignal): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(new Error("Cancelled")); return }
    const frame = document.createElement("iframe"), id = crypto.randomUUID()
    frame.setAttribute("sandbox", "allow-scripts"); frame.hidden = true; frame.title = "API code sandbox"
    frame.srcdoc = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' blob:; worker-src blob:; connect-src https: http:"><script>${bootstrap}</script>`
    const cleanup = () => { clearTimeout(timer); window.removeEventListener("message", receive); signal?.removeEventListener("abort", abort); frame.remove() }
    const abort = () => { cleanup(); reject(new Error("Cancelled")) }
    const timer = setTimeout(() => { cleanup(); reject(new Error("Execution timed out after 20 seconds")) }, 20_000)
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.contentWindow || event.data?.id !== id) return
      cleanup(); if (event.data.ok) resolve(event.data.result); else reject(new Error(String(event.data.error)))
    }
    window.addEventListener("message", receive); signal?.addEventListener("abort", abort, { once: true })
    frame.onload = () => frame.contentWindow?.postMessage({ type: "run", id, code, operation, params, change }, "*")
    document.body.appendChild(frame)
  })
}
export const exampleApiCode = `// Edit URL, headers, query serialization, response mapping and saves.
// Runs in an isolated worker. Browser CORS rules still apply.
async function load(params) {
  const response = await fetch('https://jsonplaceholder.typicode.com/todos');
  if (!response.ok) throw new Error('HTTP ' + response.status);
  const todos = await response.json();
  return todos.map(todo => ({ id: todo.id, title: todo.title,
    team: 'Team ' + todo.userId, completed: todo.completed }));
}
async function save(change) {
  // JSONPlaceholder simulates writes; changes are not durable.
  await Promise.all(change.patches.map(async patch => {
    const response = await fetch('https://jsonplaceholder.typicode.com/todos/' + patch.rowId, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [patch.columnId]: patch.value })
    });
    if (!response.ok) throw new Error('Save failed: HTTP ' + response.status);
  }));
  return { accepted: true };
}`
