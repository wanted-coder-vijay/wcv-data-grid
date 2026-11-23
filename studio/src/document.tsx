import { useRef, useState, type ReactNode } from 'react'
import type {
  StudioDocument,
  DocumentBlock,
  BlockKind,
  DocumentAttachment,
  SaveProps,
} from './types'
import { errorMessage, moveItem, newId } from './core'
import { Empty, JsonExport, Notice, downloadText, useSave } from './shared'
export interface DocumentEditorProps extends SaveProps<StudioDocument> {
  onSave?: (document: StudioDocument) => void | Promise<void>
  onAttach?: (file: File) => Promise<DocumentAttachment> | DocumentAttachment
  templates?: { name: string; document: StudioDocument }[]
  mentions?: string[]
}
export function renderInline(text: string): ReactNode[] {
  // All text is rendered through React. HTML, scripts and arbitrary links are not interpreted.
  return text
    .split(/(\*\*[^*]+\*\*|\*[^*]+\*|@[\w.-]+)/g)
    .map((part, index) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={index}>{part.slice(2, -2)}</strong>
      ) : part.startsWith('*') && part.endsWith('*') ? (
        <em key={index}>{part.slice(1, -1)}</em>
      ) : part.startsWith('@') ? (
        <mark key={index}>{part}</mark>
      ) : (
        part
      )
    )
}
export function documentMarkdown(value: StudioDocument): string {
  return (
    `# ${value.title}\n\n` +
    value.blocks
      .map(
        (block) =>
          `${block.kind === 'heading' ? '## ' : block.kind === 'subheading' ? '### ' : block.kind === 'bullet' ? '- ' : block.kind === 'quote' ? '> ' : ''}${block.text}`
      )
      .join('\n\n')
  )
}
export function DocumentEditor({
  value,
  onChange,
  onSave,
  onAttach,
  templates = [],
  mentions = ['alex', 'priya', 'sam'],
}: DocumentEditorProps) {
  const [selected, setSelected] = useState(value.blocks[0]?.id ?? ''),
    [preview, setPreview] = useState(false),
    [template, setTemplate] = useState(''),
    [attachmentBusy, setAttachmentBusy] = useState(false),
    [attachmentError, setAttachmentError] = useState('')
  const refs = useRef<Record<string, HTMLTextAreaElement | null>>({}),
    save = useSave(value, onSave),
    block = value.blocks.find((item) => item.id === selected),
    words = value.blocks.reduce(
      (total, item) => total + (item.text.trim().match(/\S+/g)?.length ?? 0),
      0
    )
  function update(patch: Partial<DocumentBlock>) {
    if (block)
      onChange({
        ...value,
        blocks: value.blocks.map((item) =>
          item.id === block.id ? { ...item, ...patch } : item
        ),
      })
  }
  function add(kind: BlockKind = 'paragraph') {
    const id = newId('block'),
      index = value.blocks.findIndex((item) => item.id === selected),
      blocks = [...value.blocks]
    blocks.splice(index < 0 ? blocks.length : index + 1, 0, {
      id,
      kind,
      text: '',
    })
    onChange({ ...value, blocks })
    setSelected(id)
    requestAnimationFrame(() => refs.current[id]?.focus())
  }
  function format(marker: string, insert?: string) {
    if (!block) return
    const textarea = refs.current[block.id],
      from = textarea?.selectionStart ?? block.text.length,
      to = textarea?.selectionEnd ?? block.text.length,
      content = insert ?? (block.text.slice(from, to) || 'text'),
      next =
        block.text.slice(0, from) +
        marker +
        content +
        marker +
        block.text.slice(to)
    update({ text: next })
    requestAnimationFrame(() => {
      textarea?.focus()
      textarea?.setSelectionRange(
        from + marker.length,
        from + marker.length + content.length
      )
    })
  }
  async function attach(files: FileList | null) {
    if (!files?.length || attachmentBusy) return
    const file = files[0]
    if (file.size > 10 * 1024 * 1024) {
      setAttachmentError('Attachments must be 10 MB or smaller.')
      return
    }
    setAttachmentBusy(true)
    setAttachmentError('')
    try {
      const attachment = onAttach
        ? await onAttach(file)
        : {
            id: newId('attachment'),
            name: file.name,
            size: file.size,
            type: file.type,
          }
      onChange({ ...value, attachments: [...value.attachments, attachment] })
    } catch (err) {
      setAttachmentError(errorMessage(err))
    } finally {
      setAttachmentBusy(false)
    }
  }
  return (
    <section className="ds-tool ds-document" aria-label="Document editor">
      <div className="ds-toolbar">
        <div className="ds-segment">
          <button aria-pressed={!preview} onClick={() => setPreview(false)}>
            Write
          </button>
          <button aria-pressed={preview} onClick={() => setPreview(true)}>
            Read
          </button>
        </div>
        <span>
          {words} words / {Math.max(1, Math.ceil(words / 200))} min read
        </span>
        {onSave && (
          <button
            className="ds-primary"
            disabled={save.saving || attachmentBusy || !value.title.trim()}
            onClick={save.run}
          >
            {save.saving ? 'Saving…' : 'Save document'}
          </button>
        )}
        <button
          onClick={() =>
            downloadText(
              'document.md',
              documentMarkdown(value),
              'text/markdown;charset=utf-8'
            )
          }
        >
          Export Markdown
        </button>
        <JsonExport value={value} filename="document" />
      </div>
      {save.message && <Notice error={save.failed}>{save.message}</Notice>}
      {attachmentError && <Notice error>{attachmentError}</Notice>}
      <div className="ds-document-layout">
        <div>
          {!preview && (
            <div className="ds-format-toolbar">
              <label className="ds-inline-label">
                Block style
                <select
                  aria-label="Block style"
                  disabled={!block || save.saving || attachmentBusy}
                  value={block?.kind ?? 'paragraph'}
                  onChange={(e) =>
                    update({ kind: e.target.value as BlockKind })
                  }
                >
                  {[
                    'paragraph',
                    'heading',
                    'subheading',
                    'bullet',
                    'quote',
                  ].map((kind) => (
                    <option key={kind}>{kind}</option>
                  ))}
                </select>
              </label>
              <button
                disabled={!block || save.saving || attachmentBusy}
                onClick={() => format('**')}
              >
                <strong>Bold</strong>
              </button>
              <button
                disabled={!block || save.saving || attachmentBusy}
                onClick={() => format('*')}
              >
                <em>Italic</em>
              </button>
              <label className="ds-inline-label">
                Mention
                <select
                  aria-label="Insert mention"
                  value=""
                  disabled={!block || save.saving || attachmentBusy}
                  onChange={(e) => {
                    if (e.target.value) format('', '@' + e.target.value)
                  }}
                >
                  <option value="">Choose teammate</option>
                  {mentions.map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
              </label>
              <button
                disabled={save.saving || attachmentBusy}
                onClick={() => add()}
              >
                ＋ Block
              </button>
            </div>
          )}
          <article className="ds-document-paper">
            {preview ? (
              <h1>{value.title}</h1>
            ) : (
              <input
                className="ds-document-title"
                aria-label="Document title"
                disabled={save.saving || attachmentBusy}
                value={value.title}
                placeholder="Untitled document"
                onChange={(e) => onChange({ ...value, title: e.target.value })}
              />
            )}
            {value.blocks.map((item, index) =>
              preview ? (
                <div
                  key={item.id}
                  className={`ds-prose-block ds-prose-${item.kind}`}
                >
                  {item.kind === 'heading' ? (
                    <h2>{renderInline(item.text)}</h2>
                  ) : item.kind === 'subheading' ? (
                    <h3>{renderInline(item.text)}</h3>
                  ) : item.kind === 'quote' ? (
                    <blockquote>{renderInline(item.text)}</blockquote>
                  ) : item.kind === 'bullet' ? (
                    <ul>
                      <li>{renderInline(item.text)}</li>
                    </ul>
                  ) : (
                    <p>{renderInline(item.text)}</p>
                  )}
                </div>
              ) : (
                <div
                  key={item.id}
                  className={`ds-document-block ds-prose-${item.kind} ${selected === item.id ? 'is-selected' : ''}`}
                >
                  <textarea
                    ref={(element) => {
                      refs.current[item.id] = element
                    }}
                    aria-label={`Block ${index + 1} text`}
                    disabled={save.saving || attachmentBusy}
                    placeholder={
                      item.kind === 'heading'
                        ? 'Section heading…'
                        : 'Write something…'
                    }
                    value={item.text}
                    rows={Math.max(
                      2,
                      Math.min(12, Math.ceil(item.text.length / 75))
                    )}
                    onFocus={() => setSelected(item.id)}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        blocks: value.blocks.map((b) =>
                          b.id === item.id ? { ...b, text: e.target.value } : b
                        ),
                      })
                    }
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                        e.preventDefault()
                        format('**')
                      }
                      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                        e.preventDefault()
                        format('*')
                      }
                    }}
                  />
                  <div className="ds-inline-actions">
                    <span>{item.kind}</span>
                    <button
                      disabled={save.saving || attachmentBusy || index === 0}
                      aria-label={`Move block ${index + 1} up`}
                      onClick={() =>
                        onChange({
                          ...value,
                          blocks: moveItem(value.blocks, index, index - 1),
                        })
                      }
                    >
                      ↑
                    </button>
                    <button
                      disabled={
                        save.saving ||
                        attachmentBusy ||
                        index === value.blocks.length - 1
                      }
                      aria-label={`Move block ${index + 1} down`}
                      onClick={() =>
                        onChange({
                          ...value,
                          blocks: moveItem(value.blocks, index, index + 1),
                        })
                      }
                    >
                      ↓
                    </button>
                    <button
                      disabled={save.saving || attachmentBusy}
                      aria-label={`Delete block ${index + 1}`}
                      onClick={() => {
                        onChange({
                          ...value,
                          blocks: value.blocks.filter((b) => b.id !== item.id),
                        })
                        if (selected === item.id) setSelected('')
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )
            )}
            {!value.blocks.length && (
              <Empty>
                {preview
                  ? 'This document has no content yet.'
                  : 'Add a block to start writing.'}
              </Empty>
            )}
          </article>
        </div>
        <aside className="ds-panel">
          <h3>Document outline</h3>
          <nav aria-label="Document outline">
            {value.blocks
              .filter(
                (item) => item.kind === 'heading' || item.kind === 'subheading'
              )
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setPreview(false)
                    setSelected(item.id)
                    requestAnimationFrame(() => {
                      refs.current[item.id]?.scrollIntoView({
                        block: 'center',
                        behavior: 'instant',
                      })
                      refs.current[item.id]?.focus()
                    })
                  }}
                >
                  {item.text || 'Untitled section'}
                </button>
              ))}
          </nav>
          {templates.length > 0 && (
            <>
              <h3>Start from a template</h3>
              <label>
                Template
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                >
                  <option value="">Choose a template</option>
                  {templates.map((item, index) => (
                    <option key={index} value={index}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                disabled={template === '' || save.saving || attachmentBusy}
                onClick={() => {
                  const source = templates[Number(template)]
                  if (source) {
                    const next = structuredClone(source.document)
                    next.blocks = next.blocks.map((item) => ({
                      ...item,
                      id: newId('block'),
                    }))
                    onChange(next)
                    setSelected(next.blocks[0]?.id ?? '')
                    setPreview(false)
                  }
                }}
              >
                Replace with template
              </button>
              <p className="ds-muted">
                Applying a template replaces this draft. Export it first if you
                want to keep a copy.
              </p>
            </>
          )}
          <h3>Attachments</h3>
          <label className="ds-file-input">
            {attachmentBusy ? 'Adding attachment…' : 'Add attachment'}
            <input
              aria-label="Add attachment"
              disabled={attachmentBusy || save.saving || preview}
              type="file"
              onChange={(e) => {
                void attach(e.target.files)
                e.target.value = ''
              }}
            />
          </label>
          <ul className="ds-attachments">
            {value.attachments.map((item) => (
              <li key={item.id}>
                <span>
                  <strong>{item.name}</strong>
                  <small>{(item.size / 1024).toFixed(1)} KB</small>
                </span>
                <button
                  aria-label={`Remove attachment ${item.name}`}
                  disabled={attachmentBusy || save.saving || preview}
                  onClick={() =>
                    onChange({
                      ...value,
                      attachments: value.attachments.filter(
                        (a) => a.id !== item.id
                      ),
                    })
                  }
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <p className="ds-muted">
            {onAttach
              ? 'Attachments are handled by your upload callback.'
              : 'Attachment names and sizes are stored in the draft. Connect onAttach to upload the files.'}
          </p>
          <h3>Writing shortcuts</h3>
          <p className="ds-muted">
            Select text, then use Bold or Italic. Ctrl/Cmd+B and Ctrl/Cmd+I work
            in blocks. Read mode shows formatting and mentions.
          </p>
        </aside>
      </div>
    </section>
  )
}
