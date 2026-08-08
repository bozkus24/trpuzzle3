import { provinces, distanceKm, MAX_DISTANCE_KM } from './provinces'

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
 * Mesafeyi 0..1 yakınlık oranına çevirir (1 = tam isabet).
 */
export function proximity(distKm) {
  if (distKm <= 0) return 1
  const p = 1 - distKm / MAX_DISTANCE_KM
  return Math.max(0, Math.min(1, p))
}

/**
 * Yakınlığa göre "sıcaklık" rengi.
 * Uzak = koyu/soğuk (mor-mavi), yakın = sıcak (turuncu-kırmızı), isabet = yeşil.
 */
export function heatColor(prox, isTarget = false) {
  if (isTarget) return '#22c55e' // doğru il
  // 0 -> koyu mavi, 0.5 -> turuncu, 1'e yakın -> kırmızı
  const stops = [
    [0.0, [30, 41, 90]],    // çok uzak — koyu indigo
    [0.35, [67, 56, 202]],  // uzak — mor
    [0.6, [220, 100, 40]],  // ılık — turuncu
    [0.8, [225, 60, 30]],   // sıcak — kırmızı-turuncu
    [1.0, [200, 20, 20]],   // çok sıcak — kırmızı
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

/** Bir tahmini değerlendirir: mesafe, yakınlık, renk, isabet. */
export function evaluateGuess(guess, target) {
  const dist = distanceKm(guess, target)
  const isTarget = guess.name === target.name
  const prox = proximity(dist)
  return {
    province: guess,
    distanceKm: Math.round(dist),
    proximity: prox,
    color: heatColor(prox, isTarget),
    isTarget,
  }
}

export { distanceKm }
