import { useState, useMemo, useEffect, useCallback } from 'react'
import TurkeyMap from './components/TurkeyMap'
import GuessInput from './components/GuessInput'
import { findProvince } from './lib/provinces'
import {
  dailyProvince,
  randomProvince,
  todayKey,
  evaluateGuess,
} from './lib/game'

const DAILY_STORE = (key) => `iller-globle:daily:${key}`

export default function App() {
  const [mode, setMode] = useState('daily') // 'daily' | 'practice'
  const dateKey = useMemo(() => todayKey(), [])

  // Hedef il moda göre
  const [practiceTarget, setPracticeTarget] = useState(() => randomProvince())
  const target = mode === 'daily' ? dailyProvince(dateKey) : practiceTarget

  const [guesses, setGuesses] = useState([]) // il nesneleri (tahmin sırası)
  const [won, setWon] = useState(false)
  const [gaveUp, setGaveUp] = useState(false)

  // Günün ili ilerlemesini yükle
  useEffect(() => {
    if (mode !== 'daily') return
    try {
      const raw = localStorage.getItem(DAILY_STORE(dateKey))
      if (raw) {
        const data = JSON.parse(raw)
        const gs = (data.guesses || []).map(findProvince).filter(Boolean)
        setGuesses(gs)
        setWon(!!data.won)
        setGaveUp(!!data.gaveUp)
        return
      }
    } catch {}
    setGuesses([])
    setWon(false)
    setGaveUp(false)
  }, [mode, dateKey])

  // Günün ili ilerlemesini kaydet
  const persistDaily = useCallback(
    (gs, w, g) => {
      try {
        localStorage.setItem(
          DAILY_STORE(dateKey),
          JSON.stringify({ guesses: gs.map((p) => p.name), won: w, gaveUp: g })
        )
      } catch {}
    },
    [dateKey]
  )

  const finished = won || gaveUp

  const handleGuess = useCallback(
    (province) => {
      if (finished) return
      if (guesses.some((g) => g.name === province.name)) return
      const next = [...guesses, province]
      setGuesses(next)
      const isWin = province.name === target.name
      if (isWin) setWon(true)
      if (mode === 'daily') persistDaily(next, isWin, false)
    },
    [finished, guesses, target, mode, persistDaily]
  )

  const evaluations = useMemo(
    () => guesses.map((g) => evaluateGuess(g, target)),
    [guesses, target]
  )

  // Harita için renk eşlemesi
  const colors = useMemo(() => {
    const m = {}
    for (const e of evaluations) m[e.province.name] = e.color
    return m
  }, [evaluations])

  // Yakınlığa göre sıralı: doğru il her zaman en üstte, sonra en yakın sınır
  const sorted = useMemo(
    () =>
      [...evaluations].sort(
        (a, b) => (b.isTarget ? 1 : 0) - (a.isTarget ? 1 : 0) || a.borderKm - b.borderKm
      ),
    [evaluations]
  )

  const closest = sorted[0]

  function newPractice() {
    setPracticeTarget(randomProvince(practiceTarget))
    setGuesses([])
    setWon(false)
    setGaveUp(false)
  }

  function giveUp() {
    setGaveUp(true)
    if (mode === 'daily') persistDaily(guesses, false, true)
  }

  function switchMode(m) {
    setMode(m)
    if (m === 'practice') {
      setGuesses([])
      setWon(false)
      setGaveUp(false)
      setPracticeTarget(randomProvince())
    }
  }

  const [copied, setCopied] = useState(false)
  function share() {
    const n = guesses.length
    const head =
      mode === 'daily'
        ? `İller Globle — ${dateKey}`
        : `İller Globle — Pratik`
    const result = won ? `${n} tahminde buldum! 🇹🇷` : `Bulamadım 😅`
    // Tahminlerin sıcaklık şeridi
    const bar = evaluations
      .map((e) => (e.isTarget ? '🟩' : e.proximity > 0.7 ? '🟥' : e.proximity > 0.45 ? '🟧' : '⬜'))
      .join('')
    const text = `${head}\n${result}\n${bar}`
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1800)
      },
      () => {}
    )
  }

  const guessedNames = useMemo(() => new Set(guesses.map((g) => g.name)), [guesses])

  return (
    <div className="app">
      <header className="header">
        <h1>
          <span className="flag">🇹🇷</span> İller Globle
        </h1>
        <p className="tagline">Gizli ili tahmin et — her tahmin seni ısıtır ya da soğutur.</p>
      </header>

      <div className="modes">
        <button
          className={mode === 'daily' ? 'active' : ''}
          onClick={() => switchMode('daily')}
        >
          Günün İli
        </button>
        <button
          className={mode === 'practice' ? 'active' : ''}
          onClick={() => switchMode('practice')}
        >
          Sınırsız Pratik
        </button>
      </div>

      <TurkeyMap colors={colors} target={target} revealed={finished} />

      {!finished && (
        <GuessInput onGuess={handleGuess} disabled={finished} guessedNames={guessedNames} />
      )}

      {closest && !finished && (
        <div className="status">
          En yakın sınır: <b>{closest.province.name}</b> — {closest.borderKm} km
        </div>
      )}

      {finished && (
        <div className={'result ' + (won ? 'win' : 'lose')}>
          {won ? (
            <p>
              🎉 <b>{target.name}</b>! {guesses.length} tahminde buldun.
            </p>
          ) : (
            <p>
              Doğru cevap: <b>{target.name}</b> (plaka {target.plate}).
            </p>
          )}
          <div className="result-actions">
            <button onClick={share}>{copied ? 'Kopyalandı ✓' : 'Sonucu paylaş'}</button>
            {mode === 'practice' && <button onClick={newPractice}>Yeni oyun</button>}
          </div>
        </div>
      )}

      {!finished && guesses.length > 0 && (
        <div className="toolbar">
          <span className="count">{guesses.length} tahmin</span>
          <button className="giveup" onClick={giveUp}>
            Pes et
          </button>
        </div>
      )}

      <ul className="guess-list">
        {sorted.map((e) => (
          <li key={e.province.name} className={e.isTarget ? 'hit' : ''}>
            <span className="swatch" style={{ background: e.color }} />
            <span className="pname">{e.province.name}</span>
            <span className="dist">{e.isTarget ? 'Doğru!' : `${e.borderKm} km`}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
