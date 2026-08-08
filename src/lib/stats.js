// Günün ili istatistikleri (localStorage). Pratik mod istatistiği etkilemez.
const KEY = 'iller-globle:stats'

function defaults() {
  return {
    lastWin: null, // 'YYYY-MM-DD'
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessSum: 0, // kazanılan oyunlardaki toplam tahmin (ortalama için)
  }
}

export function loadStats() {
  try {
    return { ...defaults(), ...(JSON.parse(localStorage.getItem(KEY)) || {}) }
  } catch {
    return defaults()
  }
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
  const next = {
    lastWin: dateKey,
    gamesWon: s.gamesWon + 1,
    currentStreak: streak,
    maxStreak: Math.max(s.maxStreak, streak),
    guessSum: s.guessSum + guessCount,
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {}
  return next
}

/** Ortalama tahmin (kazanılan oyunlar). */
export function avgGuesses(s) {
  return s.gamesWon ? Math.round((s.guessSum / s.gamesWon) * 10) / 10 : 0
}
