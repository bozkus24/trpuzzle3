import { geoCentroid } from 'd3-geo'
import rawGeo from '../data/provinces.geojson.json'

// Ham GeoJSON (81 il, MultiPolygon). Her feature: { properties: { name, number } }
export const geo = rawGeo

/**
 * Türkçe metni eşleştirme için normalize eder:
 * büyük/küçük harf, Türkçe karakter ve boşluk/işaret farklarını yok sayar.
 * Örn: "İSTANBUL" -> "istanbul", "Ağrı" -> "agri"
 */
export function normalize(str) {
  if (!str) return ''
  let s = String(str)
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .toLowerCase()
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
  // kalan aksanları da temizle
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return s.replace(/[^a-z0-9]/g, '')
}

// Bir ile ait yaygın alternatif/kısa adlar -> veri setindeki resmi ad
const ALIASES = {
  afyonkarahisar: 'Afyon',
  antep: 'Gaziantep',
  gantep: 'Gaziantep',
  maras: 'Kahramanmaraş',
  kmaras: 'Kahramanmaraş',
  urfa: 'Şanlıurfa',
  icel: 'Mersin',
  constantinople: 'İstanbul',
  izmit: 'Kocaeli',
  adapazari: 'Sakarya',
}

/**
 * Her il için: ad, plaka no, geojson feature'ı ve küresel centroid [lon, lat].
 * Centroid mesafe/sıcaklık ipuçları için kullanılır.
 */
export const provinces = geo.features
  .map((feature) => {
    const name = feature.properties.name
    const [lon, lat] = geoCentroid(feature)
    return {
      name,
      plate: feature.properties.number,
      key: normalize(name),
      feature,
      lon,
      lat,
    }
  })
  .sort((a, b) => a.name.localeCompare(b.name, 'tr'))

// Hızlı arama için: normalize edilmiş ad -> il
const byKey = new Map()
for (const p of provinces) byKey.set(p.key, p)

// Alias'ları da eşleme tablosuna ekle
const aliasByKey = new Map()
for (const [alias, canonical] of Object.entries(ALIASES)) {
  const p = provinces.find((x) => x.name === canonical)
  if (p) aliasByKey.set(normalize(alias), p)
}

/** Kullanıcının yazdığı metne karşılık gelen ili bul (alias'lar dahil). */
export function findProvince(input) {
  const k = normalize(input)
  if (!k) return null
  return byKey.get(k) || aliasByKey.get(k) || null
}

/** Yazarken öneri listesi (en fazla `limit` adet). */
export function suggest(input, limit = 6) {
  const k = normalize(input)
  if (!k) return []
  const starts = []
  const contains = []
  for (const p of provinces) {
    if (p.key.startsWith(k)) starts.push(p)
    else if (p.key.includes(k)) contains.push(p)
  }
  return [...starts, ...contains].slice(0, limit)
}

const R = 6371 // Dünya yarıçapı (km)
const toRad = (d) => (d * Math.PI) / 180

/** İki il arası kuş uçuşu (büyük daire) mesafesi, km. */
export function distanceKm(a, b) {
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

// Türkiye içindeki en uzak iki il arası mesafeye yakın referans (Edirne <-> Hakkari ~1600km)
export const MAX_DISTANCE_KM = 1650
