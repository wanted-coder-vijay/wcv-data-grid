import { useState } from 'react'
import type { Schedule, ScheduleEvent, SaveProps } from './types'
import {
  expandEvents,
  validateEvent,
  shiftDate,
  newId,
  errorMessage,
} from './core'
import { Empty, JsonExport, Notice } from './shared'
export interface SchedulerProps extends SaveProps<Schedule> {
  anchorDate?: string
  timeZone?: string
  onSaveEvent?: (event: ScheduleEvent) => void | Promise<void>
}
export function Scheduler({
  value,
  onChange,
  anchorDate = new Date().toISOString().slice(0, 10),
  timeZone = 'Asia/Kolkata',
  onSaveEvent,
}: SchedulerProps) {
  const [date, setDate] = useState(anchorDate),
    [zone, setZone] = useState(timeZone),
    [resource, setResource] = useState('all'),
    [view, setView] = useState<'week' | 'agenda'>('week')
  const [draft, setDraft] = useState<ScheduleEvent | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false)
  const weekday = new Date(date + 'T00:00:00Z').getUTCDay(),
    first = shiftDate(date, -((weekday + 6) % 7)),
    days = Array.from({ length: 7 }, (_, index) => shiftDate(first, index))
  // Wider instant range accommodates offsets; group occurrences by their displayed local date.
  const occurrences = expandEvents(
    value.events,
    shiftDate(first, -2) + 'T00:00:00Z',
    shiftDate(first, 9) + 'T00:00:00Z'
  ).filter((event) => resource === 'all' || event.resourceId === resource)
  let zoneError = ''
  try {
    new Intl.DateTimeFormat('en', { timeZone: zone }).format()
  } catch {
    zoneError = 'Choose a valid IANA timezone.'
  }
  const safeZone = zoneError ? 'UTC' : zone
  const localDate = (instant: string) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: safeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date(instant))
    const part = (name: string) =>
      parts.find((item) => item.type === name)?.value
    return `${part('year')}-${part('month')}-${part('day')}`
  }
  const time = (instant: string) =>
    new Intl.DateTimeFormat('en-GB', {
      timeZone: safeZone,
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(instant))
  const weekEvents = occurrences.filter((event) =>
    days.some(
      (day) => localDate(event.start) <= day && localDate(event.end) >= day
    )
  )
  function open(event?: ScheduleEvent, day = date) {
    const base = event
      ? value.events.find((item) => item.id === event.id.split('::')[0])
      : undefined
    setDraft(
      base
        ? { ...base }
        : {
            id: newId('event'),
            title: '',
            start: day + 'T09:00:00.000Z',
            end: day + 'T10:00:00.000Z',
            resourceId: value.resources[0]?.id ?? '',
          }
    )
    setError('')
  }
  async function save() {
    if (!draft || busy) return
    const problem = validateEvent(draft, value)
    if (problem) {
      setError(problem)
      return
    }
    setBusy(true)
    setError('')
    try {
      await onSaveEvent?.(draft)
      onChange({
        ...value,
        events: value.events.some((event) => event.id === draft.id)
          ? value.events.map((event) => (event.id === draft.id ? draft : event))
          : [...value.events, draft],
      })
      setDraft(null)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }
  function eventButton(event: ScheduleEvent) {
    const owner = value.resources.find((item) => item.id === event.resourceId)
    return (
      <button
        key={event.id}
        className="ds-event"
        style={{ borderLeftColor: owner?.color ?? '#3476bd' }}
        onClick={() => open(event)}
      >
        <strong>{event.title}</strong>
        <span>
          {time(event.start)}–{time(event.end)}
        </span>
        <small>
          {owner?.name}
          {event.recurrence ? ' · weekly' : ''}
        </small>
      </button>
    )
  }
  return (
    <section className="ds-tool ds-scheduler" aria-label="Calendar scheduler">
      <div className="ds-toolbar">
        <div className="ds-inline-actions">
          <button
            aria-label="Previous week"
            onClick={() => setDate(shiftDate(date, -7))}
          >
            ←
          </button>
          <button
            aria-label="Next week"
            onClick={() => setDate(shiftDate(date, 7))}
          >
            →
          </button>
        </div>
        <label className="ds-inline-label">
          Week of
          <input
            aria-label="Calendar date"
            type="date"
            value={date}
            onChange={(e) => {
              if (e.target.value) setDate(e.target.value)
            }}
          />
        </label>
        <label className="ds-inline-label">
          Timezone
          <select
            aria-label="Timezone"
            value={safeZone}
            onChange={(e) => setZone(e.target.value)}
          >
            {[
              ...new Set([
                timeZone,
                'UTC',
                'Asia/Kolkata',
                'America/New_York',
                'Europe/London',
                'Asia/Tokyo',
              ]),
            ].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="ds-inline-label">
          Resource
          <select
            aria-label="Resource"
            value={resource}
            onChange={(e) => setResource(e.target.value)}
          >
            <option value="all">All resources</option>
            {value.resources.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <div className="ds-segment">
          <button
            aria-pressed={view === 'week'}
            onClick={() => setView('week')}
          >
            Week
          </button>
          <button
            aria-pressed={view === 'agenda'}
            onClick={() => setView('agenda')}
          >
            Agenda
          </button>
        </div>
        <button
          className="ds-primary"
          disabled={!value.resources.length}
          onClick={() => open()}
        >
          New appointment
        </button>
        <JsonExport value={value} filename="schedule" />
      </div>
      {zoneError && <Notice error>{zoneError}</Notice>}
      {!value.resources.length && (
        <Empty>
          Add resources through the controlled schedule configuration before
          booking.
        </Empty>
      )}
      {draft ? (
        <form
          className="ds-panel ds-event-editor"
          onSubmit={(e) => {
            e.preventDefault()
            void save()
          }}
        >
          <h3>
            {value.events.some((event) => event.id === draft.id)
              ? 'Edit appointment series'
              : 'New appointment'}
          </h3>
          <p>Enter UTC times. The calendar displays them in {safeZone}.</p>
          <fieldset disabled={busy}>
            <label>
              Appointment title
              <input
                required
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </label>
            <div className="ds-two">
              <label>
                Start (UTC)
                <input
                  required
                  type="datetime-local"
                  value={draft.start.slice(0, 16)}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      start: e.target.value
                        ? new Date(e.target.value + 'Z').toISOString()
                        : '',
                    })
                  }
                />
              </label>
              <label>
                End (UTC)
                <input
                  required
                  type="datetime-local"
                  value={draft.end.slice(0, 16)}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      end: e.target.value
                        ? new Date(e.target.value + 'Z').toISOString()
                        : '',
                    })
                  }
                />
              </label>
            </div>
            <label>
              Appointment resource
              <select
                value={draft.resourceId}
                onChange={(e) =>
                  setDraft({ ...draft, resourceId: e.target.value })
                }
              >
                {value.resources.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="ds-check">
              <input
                type="checkbox"
                checked={draft.recurrence === 'weekly'}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    recurrence: e.target.checked ? 'weekly' : undefined,
                    repeatUntil: e.target.checked
                      ? shiftDate(draft.start.slice(0, 10), 28)
                      : undefined,
                  })
                }
              />
              Repeat weekly at the same UTC time
            </label>
            {draft.recurrence && (
              <label>
                Repeat until
                <input
                  required
                  type="date"
                  value={draft.repeatUntil ?? ''}
                  onChange={(e) =>
                    setDraft({ ...draft, repeatUntil: e.target.value })
                  }
                />
              </label>
            )}
            {error && <Notice error>{error}</Notice>}
            <div className="ds-toolbar">
              <button className="ds-primary" type="submit">
                {busy ? 'Saving…' : 'Save appointment'}
              </button>
              <button type="button" onClick={() => setDraft(null)}>
                Cancel
              </button>
              {value.events.some((event) => event.id === draft.id) && (
                <button
                  type="button"
                  className="ds-danger"
                  onClick={() => {
                    onChange({
                      ...value,
                      events: value.events.filter(
                        (event) => event.id !== draft.id
                      ),
                    })
                    setDraft(null)
                  }}
                >
                  Delete series
                </button>
              )}
            </div>
          </fieldset>
        </form>
      ) : view === 'week' ? (
        <div className="ds-week-scroll">
          <div className="ds-week">
            {days.map((day) => (
              <section key={day} className="ds-day">
                <div className="ds-day-head">
                  <span>
                    {new Intl.DateTimeFormat('en', {
                      weekday: 'short',
                      timeZone: 'UTC',
                    }).format(new Date(day + 'T12:00:00Z'))}
                  </span>
                  <strong>{Number(day.slice(-2))}</strong>
                  <button
                    aria-label={`Add appointment on ${day}`}
                    disabled={!value.resources.length}
                    onClick={() => open(undefined, day)}
                  >
                    ＋
                  </button>
                </div>
                <div className="ds-day-body">
                  {weekEvents
                    .filter(
                      (event) =>
                        localDate(event.start) <= day &&
                        localDate(event.end) >= day
                    )
                    .map(eventButton)}
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : (
        <div className="ds-agenda">
          {weekEvents.length ? (
            weekEvents.map((event) => (
              <div key={event.id}>
                <time>{localDate(event.start)}</time>
                {eventButton(event)}
              </div>
            ))
          ) : (
            <Empty>
              No appointments this week. Create one or choose another week.
            </Empty>
          )}
        </div>
      )}
      <div className="ds-resource-legend">
        {value.resources.map((item) => (
          <span key={item.id}>
            <i style={{ background: item.color }} />
            {item.name}
          </span>
        ))}
        <span>{weekEvents.length} appointments this week</span>
      </div>
    </section>
  )
}
