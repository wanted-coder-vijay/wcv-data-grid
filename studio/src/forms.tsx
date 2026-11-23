import { useId, useState } from 'react'
import type {
  FormSchema,
  FormField,
  FormValues,
  FieldType,
  SaveProps,
} from './types'
import {
  fieldVisible,
  formSubmission,
  validateForm,
  validateFormSchema,
  newId,
  moveItem,
  errorMessage,
} from './core'
import { Empty, JsonExport, Notice } from './shared'
export interface FormBuilderProps extends SaveProps<FormSchema> {
  onSubmit?: (values: FormValues) => void | Promise<void>
}
const fieldTypes: FieldType[] = [
  'text',
  'email',
  'number',
  'textarea',
  'select',
  'checkbox',
  'date',
]
export function FormBuilder({ value, onChange, onSubmit }: FormBuilderProps) {
  const prefix = useId(),
    [selected, setSelected] = useState(value.fields[0]?.id ?? ''),
    [mode, setMode] = useState<'design' | 'preview'>('design'),
    [step, setStep] = useState(0)
  const [values, setValues] = useState<FormValues>({}),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [failed, setFailed] = useState(false)
  const field = value.fields.find((item) => item.id === selected),
    schemaErrors = validateFormSchema(value)
  function update(patch: Partial<FormField>) {
    if (field)
      onChange({
        ...value,
        fields: value.fields.map((item) =>
          item.id === field.id ? { ...item, ...patch } : item
        ),
      })
  }
  function add(type: FieldType) {
    const id = newId('field')
    onChange({
      ...value,
      fields: [
        ...value.fields,
        {
          id,
          type,
          label:
            type === 'checkbox' ? 'I agree to the terms' : `New ${type} field`,
          step: Math.min(step, value.steps.length - 1),
          ...(type === 'select'
            ? { options: ['Option one', 'Option two'] }
            : {}),
        },
      ],
    })
    setSelected(id)
  }
  async function next() {
    if (busy) return
    const current = validateForm(value, values, step)
    setErrors(current)
    setMessage('')
    if (Object.keys(current).length) return
    if (step < value.steps.length - 1) {
      setStep(step + 1)
      return
    }
    const all = validateForm(value, values)
    setErrors(all)
    if (Object.keys(all).length) {
      setStep(value.fields.find((item) => all[item.id])?.step ?? 0)
      return
    }
    setBusy(true)
    setFailed(false)
    try {
      await onSubmit?.(formSubmission(value, values))
      setMessage(
        onSubmit
          ? 'Response submitted.'
          : 'Response validated. Connect onSubmit to store it.'
      )
    } catch (error) {
      setFailed(true)
      setMessage(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="ds-tool ds-forms" aria-label="Form builder">
      <div className="ds-toolbar">
        <div className="ds-segment">
          <button
            aria-pressed={mode === 'design'}
            onClick={() => {
              setMode('design')
              setMessage('')
            }}
          >
            Design
          </button>
          <button
            aria-pressed={mode === 'preview'}
            onClick={() => {
              setMode('preview')
              setStep(0)
              setErrors({})
              setMessage('')
            }}
          >
            Preview form
          </button>
        </div>
        <span>
          {value.fields.length} fields / {value.steps.length} steps
        </span>
        <JsonExport value={value} filename="form-schema" />
      </div>
      {schemaErrors.length > 0 && (
        <Notice error>{schemaErrors.join(' ')}</Notice>
      )}
      {mode === 'design' ? (
        <div className="ds-builder-grid">
          <aside className="ds-panel ds-palette">
            <h3>Add a field</h3>
            {fieldTypes.map((type) => (
              <button key={type} onClick={() => add(type)}>
                ＋ {type[0].toUpperCase() + type.slice(1)}
              </button>
            ))}
            <h3>Form settings</h3>
            <label>
              Form title
              <input
                value={value.title}
                onChange={(e) => onChange({ ...value, title: e.target.value })}
              />
            </label>
            <label>
              Description
              <textarea
                value={value.description}
                onChange={(e) =>
                  onChange({ ...value, description: e.target.value })
                }
              />
            </label>
            <label>
              Steps (one per line)
              <textarea
                value={value.steps.join('\n')}
                onChange={(e) =>
                  onChange({ ...value, steps: e.target.value.split('\n') })
                }
              />
            </label>
          </aside>
          <div className="ds-form-canvas">
            <h2>{value.title || 'Untitled form'}</h2>
            <p>{value.description}</p>
            {value.steps.map((title, index) => (
              <section key={index}>
                <h3 className="ds-step-title">
                  <span>{index + 1}</span>
                  {title || 'Untitled step'}
                </h3>
                {value.fields
                  .filter((item) => item.step === index)
                  .map((item) => {
                    const position = value.fields.findIndex(
                      (f) => f.id === item.id
                    )
                    const previous = value.fields.reduce(
                      (found, f, i) =>
                        i < position && f.step === item.step ? i : found,
                      -1
                    )
                    const next = value.fields.findIndex(
                      (f, i) => i > position && f.step === item.step
                    )
                    return (
                      <div
                        key={item.id}
                        className={`ds-field-card ${selected === item.id ? 'is-selected' : ''}`}
                        draggable
                        onDragStart={(e) =>
                          e.dataTransfer.setData('text/plain', item.id)
                        }
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault()
                          const from = value.fields.findIndex(
                            (f) => f.id === e.dataTransfer.getData('text/plain')
                          )
                          if (from >= 0)
                            onChange({
                              ...value,
                              fields: moveItem(
                                value.fields,
                                from,
                                position
                              ).map((f) =>
                                f.id === value.fields[from].id
                                  ? { ...f, step: item.step }
                                  : f
                              ),
                            })
                        }}
                      >
                        <button
                          className="ds-field-select"
                          onClick={() => setSelected(item.id)}
                          aria-pressed={selected === item.id}
                        >
                          <strong>
                            {item.label}
                            {item.required && ' *'}
                          </strong>
                          <span>
                            {item.type}
                            {item.visibleWhen ? ' · conditional' : ''}
                          </span>
                          <div className="ds-field-placeholder">
                            {item.type === 'checkbox'
                              ? '□'
                              : item.type === 'select'
                                ? 'Choose an option…'
                                : 'Your response…'}
                          </div>
                        </button>
                        <div className="ds-inline-actions">
                          <button
                            aria-label={`Move ${item.label} up`}
                            disabled={previous < 0}
                            onClick={() =>
                              onChange({
                                ...value,
                                fields: moveItem(
                                  value.fields,
                                  position,
                                  previous
                                ),
                              })
                            }
                          >
                            ↑
                          </button>
                          <button
                            aria-label={`Move ${item.label} down`}
                            disabled={next < 0}
                            onClick={() =>
                              onChange({
                                ...value,
                                fields: moveItem(value.fields, position, next),
                              })
                            }
                          >
                            ↓
                          </button>
                          <button
                            aria-label={`Delete ${item.label}`}
                            onClick={() => {
                              onChange({
                                ...value,
                                fields: value.fields
                                  .filter((f) => f.id !== item.id)
                                  .map((f) =>
                                    f.visibleWhen?.fieldId === item.id
                                      ? { ...f, visibleWhen: undefined }
                                      : f
                                  ),
                              })
                              if (selected === item.id) setSelected('')
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )
                  })}
                {!value.fields.some((item) => item.step === index) && (
                  <Empty>Add a field to this step.</Empty>
                )}
              </section>
            ))}
          </div>
          <aside className="ds-panel">
            <h3>Field settings</h3>
            {field ? (
              <>
                <label>
                  Field label
                  <input
                    value={field.label}
                    onChange={(e) => update({ label: e.target.value })}
                  />
                </label>
                <label>
                  Field type
                  <select
                    value={field.type}
                    onChange={(e) =>
                      update({ type: e.target.value as FieldType })
                    }
                  >
                    {fieldTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Step
                  <select
                    value={field.step}
                    onChange={(e) => update({ step: Number(e.target.value) })}
                  >
                    {value.steps.map((title, index) => (
                      <option key={index} value={index}>
                        {title || `Step ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="ds-check">
                  <input
                    type="checkbox"
                    checked={!!field.required}
                    onChange={(e) => update({ required: e.target.checked })}
                  />
                  Required
                </label>
                <label>
                  Help text
                  <input
                    value={field.help ?? ''}
                    onChange={(e) => update({ help: e.target.value })}
                  />
                </label>
                {field.type === 'select' && (
                  <label>
                    Options (one per line)
                    <textarea
                      value={(field.options ?? []).join('\n')}
                      onChange={(e) =>
                        update({ options: e.target.value.split('\n') })
                      }
                    />
                  </label>
                )}
                {field.type === 'number' && (
                  <div className="ds-two">
                    <label>
                      Minimum
                      <input
                        type="number"
                        value={field.min ?? ''}
                        onChange={(e) =>
                          update({
                            min:
                              e.target.value === ''
                                ? undefined
                                : Number(e.target.value),
                          })
                        }
                      />
                    </label>
                    <label>
                      Maximum
                      <input
                        type="number"
                        value={field.max ?? ''}
                        onChange={(e) =>
                          update({
                            max:
                              e.target.value === ''
                                ? undefined
                                : Number(e.target.value),
                          })
                        }
                      />
                    </label>
                  </div>
                )}
                <h3>Conditional visibility</h3>
                <label>
                  Show when
                  <select
                    value={field.visibleWhen?.fieldId ?? ''}
                    onChange={(e) =>
                      update({
                        visibleWhen: e.target.value
                          ? { fieldId: e.target.value, equals: '' }
                          : undefined,
                      })
                    }
                  >
                    <option value="">Always visible</option>
                    {value.fields
                      .filter((item) => item.id !== field.id)
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                  </select>
                </label>
                {field.visibleWhen && (
                  <label>
                    Equals
                    <input
                      value={field.visibleWhen.equals}
                      onChange={(e) =>
                        update({
                          visibleWhen: {
                            ...field.visibleWhen!,
                            equals: e.target.value,
                          },
                        })
                      }
                    />
                  </label>
                )}
              </>
            ) : (
              <Empty>Select a field to edit its settings.</Empty>
            )}
          </aside>
        </div>
      ) : (
        <form
          className="ds-form-preview"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            void next()
          }}
        >
          <h2>{value.title}</h2>
          <p>{value.description}</p>
          <ol className="ds-stepper">
            {value.steps.map((title, index) => (
              <li
                key={index}
                aria-current={index === step ? 'step' : undefined}
              >
                {title}
              </li>
            ))}
          </ol>
          <h3>{value.steps[step]}</h3>
          <fieldset disabled={busy || !!schemaErrors.length}>
            {value.fields
              .filter(
                (item) =>
                  item.step === step && fieldVisible(item, values, value.fields)
              )
              .map((item) => {
                const id = prefix + item.id
                return (
                  <div key={item.id} className="ds-form-input">
                    <label htmlFor={id}>
                      {item.label}
                      {item.required ? ' *' : ''}
                    </label>
                    {item.type === 'select' ? (
                      <select
                        id={id}
                        value={String(values[item.id] ?? '')}
                        aria-invalid={!!errors[item.id]}
                        aria-describedby={id + '-help'}
                        onChange={(e) =>
                          setValues({ ...values, [item.id]: e.target.value })
                        }
                      >
                        <option value="">Choose an option</option>
                        {item.options?.map((option, index) => (
                          <option key={index}>{option}</option>
                        ))}
                      </select>
                    ) : item.type === 'textarea' ? (
                      <textarea
                        id={id}
                        value={String(values[item.id] ?? '')}
                        aria-invalid={!!errors[item.id]}
                        aria-describedby={id + '-help'}
                        onChange={(e) =>
                          setValues({ ...values, [item.id]: e.target.value })
                        }
                      />
                    ) : (
                      <input
                        id={id}
                        type={item.type}
                        required={item.required}
                        min={item.min}
                        max={item.max}
                        checked={
                          item.type === 'checkbox'
                            ? values[item.id] === true
                            : undefined
                        }
                        value={
                          item.type === 'checkbox'
                            ? undefined
                            : String(values[item.id] ?? '')
                        }
                        aria-invalid={!!errors[item.id]}
                        aria-describedby={id + '-help'}
                        onChange={(e) =>
                          setValues({
                            ...values,
                            [item.id]:
                              item.type === 'checkbox'
                                ? e.target.checked
                                : e.target.value,
                          })
                        }
                      />
                    )}
                    <small
                      id={id + '-help'}
                      className={errors[item.id] ? 'ds-error-text' : ''}
                    >
                      {errors[item.id] ?? item.help}
                    </small>
                  </div>
                )
              })}
            <div className="ds-toolbar">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setStep(step - 1)
                    setErrors({})
                  }}
                >
                  Back
                </button>
              )}
              <button className="ds-primary" type="submit">
                {busy
                  ? 'Submitting…'
                  : step < value.steps.length - 1
                    ? 'Continue'
                    : 'Submit response'}
              </button>
            </div>
          </fieldset>
          {message && <Notice error={failed}>{message}</Notice>}
        </form>
      )}
    </section>
  )
}
