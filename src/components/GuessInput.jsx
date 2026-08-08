import { useState, useRef, useEffect } from 'react'
import { suggest, findProvince } from '../lib/provinces'

export default function GuessInput({ onGuess, disabled, guessedNames }) {
  const [value, setValue] = useState('')
  const [items, setItems] = useState([])
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)
  const boxRef = useRef(null)

  useEffect(() => {
    const onDoc = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function update(v) {
    setValue(v)
    const s = suggest(v, 6)
    setItems(s)
    setActive(0)
    setOpen(s.length > 0)
  }

  function submit(name) {
    const p = findProvince(name ?? value)
    if (!p) return
    onGuess(p)
    setValue('')
    setItems([])
    setOpen(false)
  }

  function onKeyDown(e) {
    if (!open || items.length === 0) {
      if (e.key === 'Enter') submit()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (a + 1) % items.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (a - 1 + items.length) % items.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      submit(items[active]?.name)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="guess-box" ref={boxRef}>
      <div className="guess-row">
        <input
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck="false"
          placeholder="Bir il yaz… (örn. Ankara)"
          value={value}
          disabled={disabled}
          onChange={(e) => update(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => value && setOpen(items.length > 0)}
          aria-label="İl tahmini"
        />
        <button className="guess-btn" onClick={() => submit()} disabled={disabled}>
          Tahmin
        </button>
      </div>
      {open && items.length > 0 && (
        <ul className="suggestions">
          {items.map((p, i) => {
            const already = guessedNames?.has(p.name)
            return (
              <li
                key={p.name}
                className={(i === active ? 'active ' : '') + (already ? 'used' : '')}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault()
                  submit(p.name)
                }}
              >
                <span>{p.name}</span>
                <span className="plate">{p.plate}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
