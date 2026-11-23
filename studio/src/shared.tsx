import { useEffect, useState, type ReactNode } from 'react'
import { errorMessage } from './core'
export function Notice({
  children,
  error = false,
}: {
  children: ReactNode
  error?: boolean
}) {
  return (
    <p
      className={`ds-notice ${error ? 'ds-error' : ''}`}
      role={error ? 'alert' : 'status'}
    >
      {children}
    </p>
  )
}
export function Empty({ children }: { children: ReactNode }) {
  return <div className="ds-empty">{children}</div>
}
export function downloadText(
  name: string,
  text: string,
  type = 'application/json'
) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export function useSave<T>(
  value: T,
  save?: (value: T) => Promise<void> | void
) {
  const [saving, setSaving] = useState(false),
    [message, setMessage] = useState(''),
    [failed, setFailed] = useState(false)
  useEffect(() => {
    setMessage('')
    setFailed(false)
  }, [value])
  async function run() {
    if (!save || saving) return
    setSaving(true)
    setMessage('')
    setFailed(false)
    try {
      await save(value)
      setMessage('Saved successfully.')
    } catch (error) {
      setFailed(true)
      setMessage(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }
  return { saving, message, failed, run }
}
export function JsonExport({
  value,
  filename,
}: {
  value: unknown
  filename: string
}) {
  const [open, setOpen] = useState(false),
    [message, setMessage] = useState('')
  const text = JSON.stringify(value, null, 2)
  return (
    <div className="ds-export">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}>
        Configuration
      </button>
      <button
        type="button"
        onClick={() => downloadText(filename + '.json', text)}
      >
        Export JSON
      </button>
      {open && (
        <div className="ds-code">
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(text)
                setMessage('Copied configuration.')
              } catch {
                setMessage(
                  'Clipboard unavailable. Select the JSON or export it.'
                )
              }
            }}
          >
            Copy JSON
          </button>
          <pre tabIndex={0}>{text}</pre>
          {message && <Notice>{message}</Notice>}
        </div>
      )}
    </div>
  )
}
