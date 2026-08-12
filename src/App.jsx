import { useState, useMemo, useEffect, useCallback } from 'react'
import TurkeyMap from './components/TurkeyMap'
import GuessInput from './components/GuessInput'
import StatsModal from './components/StatsModal'
import HowToModal from './components/HowToModal'
import SettingsModal from './components/SettingsModal'
import ModeModal from './components/ModeModal'
import { findProvince, MAX_BORDER_KM } from './lib/provinces'
import {
  dailyProvince,
  randomProvince,
  todayKey,
  evaluateGuess,
  proximity,
  heatColor,
  targetColorFor,
} from './lib/game'
import { loadStats, recordDailyWin, recordDailyLoss } from './lib/stats'
import logoDark from './logo-dark.png'

const DAILY_STORE = (key) => `iller-globle:daily:${key}`

export default function App() {
  const [mode, setMode] = useState('daily') // 'daily' | 'practice'
  const [showModeModal, setShowModeModal] = useState(false)
  const dateKey = useMemo(() => todayKey(), [])

  // Hedef il moda göre
  const [practiceTarget, setPracticeTarget] = useState(() => randomProvince())
  const target = mode === 'daily' ? dailyProvince(dateKey) : practiceTarget

  const [guesses, setGuesses] = useState([]) // il nesneleri (tahmin sırası)
  const [won, setWon] = useState(false)
  const [gaveUp, setGaveUp] = useState(false)

  // Görünüm ayarı: sıralama (tahmin sırası mı, yakınlık mı)
  const [byGuessOrder, setByGuessOrder] = useState(false)

  // İstatistik popup'ı
  const [stats, setStats] = useState(() => loadStats())
  const [showStats, setShowStats] = useState(false)

  // "Nasıl Oynanır" popup'ı — ilk açılışta göster (bir daha gösterme seçilmediyse)
  const HOWTO_KEY = 'iller-globle:howto-hidden'
  const [dontShowHowTo, setDontShowHowTo] = useState(() => {
    try {
      return localStorage.getItem(HOWTO_KEY) === '1'
    } catch {
      return false
    }
  })
  const [showHowTo, setShowHowTo] = useState(() => {
    try {
      return localStorage.getItem(HOWTO_KEY) !== '1'
    } catch {
      return true
    }
  })
  // ? ikonundan elle açıldı mı (o zaman "bir daha gösterme" gösterilmez)
  const [howToManual, setHowToManual] = useState(false)

  // Ayarlar + renk körü modu
  const CB_KEY = 'iller-globle:colorblind'
  const [showSettings, setShowSettings] = useState(false)
  const [colorBlind, setColorBlind] = useState(() => {
    try {
      return localStorage.getItem(CB_KEY) === '1'
    } catch {
      return false
    }
  })
  function toggleColorBlind() {
    setColorBlind((v) => {
      const next = !v
      try {
        localStorage.setItem(CB_KEY, next ? '1' : '0')
      } catch {}
      return next
    })
  }

  // Karanlık mod
  const THEME_KEY = 'iller-globle:theme'
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) === 'dark'
    } catch {
      return false
    }
  })
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    try {
      localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light')
    } catch {}
  }, [dark])
  function toggleDark() {
    setDark((v) => !v)
  }
  function toggleDontShowHowTo() {
    setDontShowHowTo((v) => {
      const next = !v
      try {
        localStorage.setItem(HOWTO_KEY, next ? '1' : '0')
      } catch {}
      return next
    })
  }

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
        if (data.won) setStats(recordDailyWin(dateKey, gs.length))
        else if (data.gaveUp) setStats(recordDailyLoss(dateKey))
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
      if (mode === 'daily') persistDaily(next, isWin, false)
      if (isWin) {
        setWon(true)
        if (mode === 'daily') setStats(recordDailyWin(dateKey, next.length))
        setShowStats(true)
      }
    },
    [finished, guesses, target, mode, persistDaily, dateKey]
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
        return { ...e, dist: e.borderKm, prox, color: heatColor(prox, e.isTarget, colorBlind) }
      }),
    [evaluations, colorBlind]
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
  // Bilgi satırı EN YAKIN (minimum sınır mesafesi) ile göre
  const closest = byDist.length ? byDist[0] : null

  function newPractice() {
    setPracticeTarget(randomProvince(practiceTarget))
    setGuesses([])
    setWon(false)
    setGaveUp(false)
    setShowStats(false)
  }

  function giveUp() {
    setGaveUp(true)
    if (mode === 'daily') {
      persistDaily(guesses, false, true)
      setStats(recordDailyLoss(dateKey))
    }
    setShowStats(true)
  }

  function switchMode(m) {
    setMode(m)
    setShowStats(false)
    if (m === 'practice') {
      setGuesses([])
      setWon(false)
      setGaveUp(false)
      setPracticeTarget(randomProvince())
    }
  }

  function onModalPrimary() {
    if (mode === 'daily') switchMode('practice')
    else newPractice()
    setShowStats(false)
  }

  const [copied, setCopied] = useState(false)
  function share() {
    const n = guesses.length
    const head = mode === 'daily' ? `Şehirle — ${dateKey}` : `Şehirle — Pratik`
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

  // Son tahmine göre "daha sıcak / daha soğuk" geri bildirimi (butonun altında)
  const feedback = useMemo(() => {
    if (!evals.length) return { text: 'Bir şehir adı yaz ve tahmine başla.', tone: 'hint' }
    const last = evals[evals.length - 1]
    if (last.isTarget) return { text: `${last.province.name} — doğru!`, tone: 'hit' }
    const word = (p) =>
      p >= 0.8 ? 'çok sıcak' : p >= 0.6 ? 'sıcak' : p >= 0.4 ? 'ılık' : p >= 0.2 ? 'soğuk' : 'çok soğuk'
    if (evals.length === 1) {
      return {
        text: `${last.province.name}: ${word(last.prox)}`,
        tone: last.prox >= 0.5 ? 'hot' : 'cold',
      }
    }
    const prev = evals[evals.length - 2]
    if (last.prox > prev.prox + 0.0005)
      return { text: `${last.province.name} daha sıcak`, tone: 'hot' }
    if (last.prox < prev.prox - 0.0005)
      return { text: `${last.province.name} daha soğuk`, tone: 'cold' }
    return { text: `${last.province.name} aynı sıcaklıkta`, tone: 'hint' }
  }, [evals])

  return (
    <>
      <div className="topbar">
        <div className="topbar-inner">
          <img className="logo" src={logoDark} alt="Şehirle logo" />
          <span className="brand">ŞEHİRLE</span>
          <div className="topbar-actions">
            <button
              className="icon-btn"
              onClick={() => setShowModeModal(true)}
              aria-label="Oyun modu"
              title="Oyun modu"
            >
              {mode === 'daily' ? (
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect
                    x="3.5"
                    y="5"
                    width="17"
                    height="15.5"
                    rx="2.5"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path d="M3.5 9.5h17" stroke="currentColor" strokeWidth="2" />
                  <path
                    d="M8 3v4M16 3v4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M9.83 9.17a4 4 0 1 0 0 5.66 10 10 0 0 0 2.17-2.83 10 10 0 0 1 2.17-2.83 4 4 0 1 1 0 5.66 10 10 0 0 1-2.17-2.83 10 10 0 0 0-2.17-2.83"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
            <button
              className="icon-btn"
              onClick={() => {
                setHowToManual(true)
                setShowHowTo(true)
              }}
              aria-label="Nasıl Oynanır"
              title="Nasıl Oynanır"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M9.2 9.3c0-1.6 1.3-2.7 2.9-2.7 1.6 0 2.8 1 2.8 2.5 0 1.3-.8 1.9-1.8 2.5-.9.6-1.2 1-1.2 2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
                <circle cx="11.9" cy="17" r="1.2" fill="currentColor" />
              </svg>
            </button>
            <button
              className="icon-btn"
              onClick={() => setShowStats(true)}
              aria-label="İstatistikler"
              title="İstatistikler"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="4" y="11" width="4.2" height="9" rx="2.1" fill="currentColor" />
                <rect x="9.9" y="4" width="4.2" height="16" rx="2.1" fill="currentColor" />
                <rect x="15.8" y="8" width="4.2" height="12" rx="2.1" fill="currentColor" />
              </svg>
            </button>
            <button
              className="icon-btn"
              onClick={() => setShowSettings(true)}
              aria-label="Ayarlar"
              title="Ayarlar"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M10.32 4.32c.43-1.76 2.93-1.76 3.36 0a1.72 1.72 0 0 0 2.57 1.06c1.54-.94 3.31.83 2.37 2.37a1.72 1.72 0 0 0 1.06 2.57c1.76.43 1.76 2.93 0 3.36a1.72 1.72 0 0 0-1.06 2.57c.94 1.54-.83 3.31-2.37 2.37a1.72 1.72 0 0 0-2.57 1.06c-.43 1.76-2.93 1.76-3.36 0a1.72 1.72 0 0 0-2.57-1.06c-1.54.94-3.31-.83-2.37-2.37a1.72 1.72 0 0 0-1.06-2.57c-1.76-.43-1.76-2.93 0-3.36a1.72 1.72 0 0 0 1.06-2.57c-.94-1.54.83-3.31 2.37-2.37 1 .61 2.3.07 2.57-1.06z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div className="app">

      {/* Tahmin kutusu haritanın ÜSTÜNDE; geri bildirim butonun altında */}
      {!finished ? (
        <>
          <GuessInput onGuess={handleGuess} disabled={finished} guessedNames={guessedNames} />
          <div className={'feedback ' + feedback.tone}>{feedback.text}</div>
        </>
      ) : (
        !showStats && (
          <div className="reveal-banner" style={{ color: targetColorFor(colorBlind) }}>
            Gizemli Şehir {target.name}!
          </div>
        )
      )}

      <TurkeyMap
        colors={colors}
        target={target}
        revealed={finished}
        targetColor={targetColorFor(colorBlind)}
      />

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
              En yakın sınır: <b>{closest ? `${closest.dist} km` : '-'}</b>
            </span>

            <button className="linkbtn" onClick={() => setByGuessOrder((v) => !v)}>
              {byGuessOrder ? 'Yakınlığa göre sırala' : 'Tahmin sırasına göre sırala'}
            </button>
          </div>

          {!finished && (
            <button className="reveal-btn" onClick={giveUp}>
              Cevabı göster
            </button>
          )}
        </section>
      )}

      {showStats && (
        <StatsModal
          stats={stats}
          guessCount={guesses.length}
          won={won}
          finished={finished}
          answer={target.name}
          mode={mode}
          onClose={() => setShowStats(false)}
          onPrimary={onModalPrimary}
          onShare={share}
          shareLabel={copied ? 'Kopyalandı' : 'Paylaş'}
        />
      )}

      {showHowTo && (
        <HowToModal
          showDontShow={!howToManual}
          dontShow={dontShowHowTo}
          onToggleDontShow={toggleDontShowHowTo}
          onClose={() => {
            setShowHowTo(false)
            setHowToManual(false)
          }}
        />
      )}

      {showSettings && (
        <SettingsModal
          colorBlind={colorBlind}
          onToggleColorBlind={toggleColorBlind}
          dark={dark}
          onToggleDark={toggleDark}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showModeModal && (
        <ModeModal
          mode={mode}
          onSelect={(m) => {
            switchMode(m)
            setShowModeModal(false)
          }}
          onClose={() => setShowModeModal(false)}
        />
      )}
      </div>
    </>
  )
}
