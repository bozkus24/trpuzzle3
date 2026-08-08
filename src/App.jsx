import { useState, useMemo, useEffect, useCallback } from 'react'
import TurkeyMap from './components/TurkeyMap'
import GuessInput from './components/GuessInput'
import { findProvince, MAX_BORDER_KM } from './lib/provinces'
import {
  dailyProvince,
  randomProvince,
  todayKey,
  evaluateGuess,
  proximity,
  heatColor,
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

  // Görünüm ayarı: sıralama (tahmin sırası mı, yakınlık mı)
  const [byGuessOrder, setByGuessOrder] = useState(false)

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

  // En yakın sınır mesafesine göre yakınlık ve renk
  const evals = useMemo(
    () =>
      evaluations.map((e) => {
        const prox = proximity(e.borderKm, MAX_BORDER_KM)
        return { ...e, dist: e.borderKm, prox, color: heatColor(prox, e.isTarget) }
      }),
    [evaluations]
  )

  // Harita için renk eşlemesi
  const colors = useMemo(() => {
    const m = {}
    for (const e of evals) m[e.province.name] = e.color
    return m
  }, [evals])

  // Yakınlığa göre sıralı (doğru il en üstte)
  const byDist = useMemo(
    () =>
      [...evals].sort(
        (a, b) => (b.isTarget ? 1 : 0) - (a.isTarget ? 1 : 0) || a.dist - b.dist
      ),
    [evals]
  )
  const display = byGuessOrder ? evals : byDist
  // Bilgi satırı yalnızca SON yazılan ile göre yorum yapar
  const last = evals.length ? evals[evals.length - 1] : null

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
    const head = mode === 'daily' ? `İller Globle — ${dateKey}` : `İller Globle — Pratik`
    const result = won ? `${n} tahminde buldum.` : `Bulamadım.`
    const text = `${head}\n${result}`
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
        <h1>İller Globle</h1>
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

      {finished && (
        <div className={'result ' + (won ? 'win' : 'lose')}>
          {won ? (
            <p>
              <b>{target.name}</b>! {guesses.length} tahminde buldun.
            </p>
          ) : (
            <p>
              Doğru cevap: <b>{target.name}</b> (plaka {target.plate}).
            </p>
          )}
          <div className="result-actions">
            <button onClick={share}>{copied ? 'Kopyalandı' : 'Sonucu paylaş'}</button>
            {mode === 'practice' && <button onClick={newPractice}>Yeni oyun</button>}
          </div>
        </div>
      )}

      {guesses.length > 0 && (
        <section className="panel">
          <div className="panel-head">En yakın</div>

          <div className="name-list">
            {display.map((e) => (
              <span key={e.province.name} className={e.isTarget ? 'nm hit' : 'nm'}>
                {e.province.name}
              </span>
            ))}
          </div>

          <div className="controls">
            <span className="metric">
              En yakın sınır: <b>{last ? `${last.dist} km` : '—'}</b>
            </span>

            <button className="linkbtn" onClick={() => setByGuessOrder((v) => !v)}>
              {byGuessOrder ? 'Yakınlığa göre sırala' : 'Tahmin sırasına göre sırala'}
            </button>

            {!finished && (
              <button className="linkbtn giveup" onClick={giveUp}>
                Pes et
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
