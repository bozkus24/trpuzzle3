// Günün ili istatistikleri (localStorage). Pratik mod istatistiği etkilemez.
const KEY = 'iller-globle:stats'

// Tahmin dağılımı kovaları (kazanılan oyunlar için)
export const DIST_BUCKETS = [
  { label: '1–2', min: 1, max: 2 },
  { label: '3–4', min: 3, max: 4 },
  { label: '5–6', min: 5, max: 6 },
  { label: '7–9', min: 7, max: 9 },
  { label: '10–14', min: 10, max: 14 },
  { label: '15+', min: 15, max: Infinity },
]

export function bucketIndex(guessCount) {
  return DIST_BUCKETS.findIndex((b) => guessCount >= b.min && guessCount <= b.max)
}

function defaults() {
  return {
    lastWin: null, // 'YYYY-MM-DD' — son kazanılan gün (seri için)
    lastPlayed: null, // 'YYYY-MM-DD' — biten son gün (oynanan gün sayımı için)
    gamesPlayed: 0, // tamamlanan günlük oyun (kazanma + pes)
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessSum: 0, // kazanılan oyunlardaki toplam tahmin (ortalama için)
    bestGuesses: 0, // en az tahminle kazanma (0 = yok)
    dist: [0, 0, 0, 0, 0, 0], // kazanılan oyunların tahmin dağılımı
  }
}

export function loadStats() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY)) || {}
    const s = { ...defaults(), ...raw }
    // Eski kayıtlarda dist eksikse tamamla
    if (!Array.isArray(s.dist) || s.dist.length !== DIST_BUCKETS.length) {
      s.dist = [0, 0, 0, 0, 0, 0]
    }
    return s
  } catch {
    return defaults()
  }
}

function save(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {}
  return s
}

// 'YYYY-MM-DD' -> bir önceki gün
function prevDay(key) {
  const [y, m, d] = key.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() - 1)
  const p = (n) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`
}

/** Günün ili kazanımını kaydeder. Aynı gün için tekrar sayılmaz. */
export function recordDailyWin(dateKey, guessCount) {
  const s = loadStats()
  if (s.lastWin === dateKey) return s // zaten sayıldı
  const streak = s.lastWin === prevDay(dateKey) ? s.currentStreak + 1 : 1
  const dist = s.dist.slice()
  const bi = bucketIndex(guessCount)
  if (bi >= 0) dist[bi] += 1
  const alreadyPlayed = s.lastPlayed === dateKey // pes edip sonra girdiyse çift sayma
  return save({
    ...s,
    lastWin: dateKey,
    lastPlayed: dateKey,
    gamesPlayed: alreadyPlayed ? s.gamesPlayed : s.gamesPlayed + 1,
    gamesWon: s.gamesWon + 1,
    currentStreak: streak,
    maxStreak: Math.max(s.maxStreak, streak),
    guessSum: s.guessSum + guessCount,
    bestGuesses: s.bestGuesses ? Math.min(s.bestGuesses, guessCount) : guessCount,
    dist,
  })
}

/** Günün ilinde pes etmeyi kaydeder (oynanan oyun sayılır, seri sıfırlanır). */
export function recordDailyLoss(dateKey) {
  const s = loadStats()
  if (s.lastPlayed === dateKey) return s // bugün zaten sayıldı
  return save({
    ...s,
    lastPlayed: dateKey,
    gamesPlayed: s.gamesPlayed + 1,
    currentStreak: 0,
  })
}

/** Ortalama tahmin (kazanılan oyunlar). */
export function avgGuesses(s) {
  return s.gamesWon ? Math.round((s.guessSum / s.gamesWon) * 10) / 10 : 0
}

/** Kazanma yüzdesi (tamamlanan günlük oyunlara göre). */
export function winPct(s) {
  return s.gamesPlayed ? Math.round((s.gamesWon / s.gamesPlayed) * 100) : 0
}
