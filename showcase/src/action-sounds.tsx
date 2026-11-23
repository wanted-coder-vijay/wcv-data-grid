import { useEffect, useRef, useState } from "react"
import { Volume2, VolumeX } from "lucide-react"

const pitches = { activate: 440, navigate: 554, change: 494, type: 330, lift: 392, shift: 523, drop: 659, cancel: 294 }
type Cue = keyof typeof pitches

export function ActionSoundToggle() {
  const [enabled, setEnabled] = useState(true)
  const context = useRef<AudioContext | null>(null)
  useEffect(() => {
    try { setEnabled(localStorage.getItem("dynostack-sound") !== "off") } catch { /* private browsing */ }
    return () => { void context.current?.close(); context.current = null }
  }, [])
  useEffect(() => {
    if (!enabled) return
    let last = -Infinity
    function play(name: Cue) {
      const now = performance.now()
      if (now - last < (name === "type" ? 75 : 25)) return
      try {
        const audio = context.current ??= new AudioContext()
        if (audio.state === "suspended") void audio.resume().catch(() => {})
        const tone = audio.createOscillator()
        const gain = audio.createGain()
        const t = audio.currentTime
        tone.frequency.setValueAtTime(pitches[name], t)
        tone.frequency.exponentialRampToValueAtTime(pitches[name] * (name === "drop" ? .72 : 1.08), t + .075)
        gain.gain.setValueAtTime(.0001, t)
        gain.gain.exponentialRampToValueAtTime(name === "type" ? .016 : .045, t + .007)
        gain.gain.exponentialRampToValueAtTime(.0001, t + .09)
        tone.connect(gain).connect(audio.destination)
        tone.onended = () => { tone.disconnect(); gain.disconnect() }
        tone.start(t)
        tone.stop(t + .1)
        last = now
      } catch { /* Audio support varies by browser. */ }
    }
    function click(e: MouseEvent) {
      const control = e.target instanceof Element && e.target.closest('a,button,input,select,summary,[role=button],[role=menuitem],[role=option],[role=tab],[role=checkbox],[role=switch]')
      if (control && !control.matches(':disabled,[aria-disabled=true],.grid-row-grip,[data-sound-toggle]')) play(control.matches("a") ? "navigate" : "activate")
    }
    function input(e: Event) { play(e instanceof InputEvent ? "type" : "change") }
    function key(e: KeyboardEvent) {
      if (e.target instanceof Element && e.target.closest(".grid-row-grip")) return
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Home","End","Tab"].includes(e.key)) play("navigate")
      else if (e.key === "Enter" || e.key === "F2" || e.key === "Delete") play("activate")
      else if (e.key === "Escape") play("cancel")
    }
    let pointer: { id: number; x: number; y: number } | undefined
    function press(e: PointerEvent) {
      if (e.isPrimary && e.button === 0 && e.target instanceof Element && !e.target.closest(".grid-row-grip")) {
        pointer = { id: e.pointerId, x: e.clientX, y: e.clientY }
      }
    }
    function release(e: PointerEvent) {
      if (pointer?.id === e.pointerId && Math.hypot(e.clientX - pointer.x, e.clientY - pointer.y) > 6) play("drop")
      pointer = undefined
    }
    function nativeDrop() { pointer = undefined; play("drop") }
    function doubleClick(e: MouseEvent) { if (e.target instanceof Element && e.target.closest("td,th,[contenteditable]")) play("change") }
    function submit() { play("activate") }
    function drag(e: Event) {
      const name = (e as CustomEvent<Cue>).detail
      if (Object.hasOwn(pitches, name)) play(name)
    }
    document.addEventListener("pointerdown", press, true)
    document.addEventListener("pointerup", release, true)
    document.addEventListener("drop", nativeDrop, true)
    document.addEventListener("dblclick", doubleClick, true)
    document.addEventListener("submit", submit, true)
    document.addEventListener("click", click, true)
    document.addEventListener("input", input, true)
    document.addEventListener("keydown", key, true)
    document.addEventListener("dynostack-row-motion", drag)
    return () => {
      document.removeEventListener("pointerdown", press, true)
      document.removeEventListener("pointerup", release, true)
      document.removeEventListener("drop", nativeDrop, true)
      document.removeEventListener("dblclick", doubleClick, true)
      document.removeEventListener("submit", submit, true)
      document.removeEventListener("click", click, true)
      document.removeEventListener("input", input, true)
      document.removeEventListener("keydown", key, true)
      document.removeEventListener("dynostack-row-motion", drag)
    }
  }, [enabled])
  const label = enabled ? "Mute action sounds" : "Enable action sounds"
  return <button type="button" className="mode-toggle" data-sound-toggle="" title={label} aria-label={label}
    aria-pressed={enabled} onClick={() => {
      setEnabled(!enabled)
      try { localStorage.setItem("dynostack-sound", enabled ? "off" : "on") } catch { /* storage optional */ }
    }}>{enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}</button>
}
