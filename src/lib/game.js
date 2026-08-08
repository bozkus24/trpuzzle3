import {
  provinces,
  borderDistanceKm,
  MAX_BORDER_KM,
  NEIGHBOR_EPS_KM,
} from './provinces'

/** YYYY-MM-DD (yerel saat) — "günün ili" için tohum. */
export function todayKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Basit deterministik hash (string -> 32bit int)
function hashStr(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Belirli bir güne ait hedef il — herkes için aynı. */
export function dailyProvince(key = todayKey()) {
  const idx = hashStr('iller-globle-' + key) % provinces.length
  return provinces[idx]
}

/** Rastgele hedef il (sınırsız pratik modu). */
export function randomProvince(exclude) {
  let p
  do {
    p = provinces[Math.floor(Math.random() * provinces.length)]
  } while (exclude && p.name === exclude.name)
  return p
}

/**
 * En yakın sınır mesafesini 0..1 yakınlık oranına çevirir (1 = sınırdaş/isabet).
 * Eğri (gamma>1) uzak illeri hızla beyaza iterken, yakın/komşuları kırmızı tutar.
 */
export function proximity(borderKm) {
  if (borderKm <= 0) return 1
  const x = Math.min(1, borderKm / MAX_BORDER_KM)
  return Math.max(0, (1 - x) ** 1.4)
}

// Doğru il rengi — koyu yeşil
export const TARGET_COLOR = '#166534'

/**
 * Yakınlığa göre "sıcaklık" rengi. Mavi yok.
 * Uzak = beyaza yakın, yaklaştıkça = kırmızı, isabet = koyu yeşil.
 */
export function heatColor(prox, isTarget = false) {
  if (isTarget) return TARGET_COLOR // doğru il — koyu yeşil
  // 0 -> beyaza yakın, 1'e yakın -> kırmızı
  const stops = [
    [0.0, [242, 240, 238]], // çok uzak — kirli beyaz
    [0.3, [246, 202, 190]], // uzak — açık pembe
    [0.55, [235, 145, 115]],// ılık — somon
    [0.75, [219, 84, 62]],  // sıcak — kiremit kırmızısı
    [1.0, [190, 20, 20]],   // çok sıcak — kırmızı
  ]
  let lo = stops[0]
  let hi = stops[stops.length - 1]
  for (let i = 0; i < stops.length - 1; i++) {
    if (prox >= stops[i][0] && prox <= stops[i + 1][0]) {
      lo = stops[i]
      hi = stops[i + 1]
      break
    }
  }
  const t = hi[0] === lo[0] ? 0 : (prox - lo[0]) / (hi[0] - lo[0])
  const c = lo[1].map((v, i) => Math.round(v + (hi[1][i] - v) * t))
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`
}

/** Bir tahmini değerlendirir: en yakın sınır mesafesi, komşuluk, yakınlık, renk. */
export function evaluateGuess(guess, target) {
  const border = borderDistanceKm(guess, target)
  const isTarget = guess.name === target.name
  const neighbor = !isTarget && border <= NEIGHBOR_EPS_KM
  const prox = proximity(border)
  return {
    province: guess,
    borderKm: Math.round(border),
    neighbor,
    proximity: prox,
    color: heatColor(prox, isTarget),
    isTarget,
  }
}
