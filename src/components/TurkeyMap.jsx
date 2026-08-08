import { useMemo } from 'react'
import { geoPath, geoTransform } from 'd3-geo'
import { geo } from '../lib/provinces'
import { TARGET_COLOR } from '../lib/game'
import { SAT, SAT_BOUNDS } from '../data/satellite'
import { LAND } from '../data/land'

const { west, east, north, south } = SAT_BOUNDS
const HEIGHT = 440
// Doğal en-boy: boylamı orta enlemin kosinüsüyle sıkıştır (Mercator hissi)
const latMid = ((north + south) / 2) * (Math.PI / 180)
const WIDTH = Math.round(
  (HEIGHT * (east - west) * Math.cos(latMid)) / (north - south)
)
const DEPTH = 4 // 3B kabarma yüksekliği (px)

// lon/lat -> uydu görselinin piksel kutusuyla birebir aynı doğrusal eşleme
const projection = geoTransform({
  point(lon, lat) {
    const x = ((lon - west) / (east - west)) * WIDTH
    const y = ((north - lat) / (north - south)) * HEIGHT
    this.stream.point(x, y)
  },
})
const pathGen = geoPath(projection)

function darken(c, f) {
  const m = c.match(/\d+/g)
  const [r, g, b] = m ? m.slice(0, 3).map(Number) : [20, 20, 20]
  return `rgb(${Math.round(r * f)}, ${Math.round(g * f)}, ${Math.round(b * f)})`
}

/**
 * Gerçekçi uydu zeminli Türkiye haritası.
 * Uydu görseli il siluetine kırpılır (kıyı keskin), üstüne 3B boyalı iller gelir.
 */
export default function TurkeyMap({ colors = {}, target = null, revealed = false }) {
  const { paths, cy } = useMemo(() => {
    const paths = geo.features.map((f) => ({ name: f.properties.name, d: pathGen(f) }))
    const cy = {}
    for (const f of geo.features) cy[f.properties.name] = pathGen.centroid(f)[1]
    return { paths, cy }
  }, [])

  // Kara maskesi (Türkiye + komşular) — relief'i karaya kırpar, deniz mavi kalır
  const landPath = useMemo(
    () => pathGen({ type: 'MultiPolygon', coordinates: LAND }),
    []
  )

  const raised = useMemo(() => {
    const nameSet = new Set(
      paths
        .map((p) => p.name)
        .filter((n) => colors[n] || (revealed && target && n === target.name))
    )
    const list = paths
      .filter((p) => nameSet.has(p.name))
      .map((p) => {
        const isTarget = revealed && target && p.name === target.name
        const top = isTarget ? TARGET_COLOR : colors[p.name]
        return { ...p, top, side: darken(top, 0.45), outline: '#000000' }
      })
    return list.sort((a, b) => cy[a.name] - cy[b.name])
  }, [paths, colors, target, revealed, cy])

  return (
    <div className="map-wrap">
      <svg
        viewBox={`0 ${-DEPTH} ${WIDTH} ${HEIGHT + DEPTH + 14}`}
        className="tr-map"
        role="img"
        aria-label="Türkiye uydu haritası"
      >
        <defs>
          <clipPath id="land-mask">
            <path d={landPath} />
          </clipPath>
          <filter id="lift" x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="1" dy="3" stdDeviation="2" floodColor="#000000" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* Deniz zemini (üst/alt marjları da kaplasın) */}
        <rect x="0" y={-DEPTH} width={WIDTH} height={HEIGHT + DEPTH + 14} fill="#2f6fb2" />

        {/* Kabartma zemin karaya kırpılı: Türkiye + komşu kara; deniz mavi kalır */}
        <image
          href={SAT}
          x="0"
          y="0"
          width={WIDTH}
          height={HEIGHT}
          preserveAspectRatio="none"
          clipPath="url(#land-mask)"
        />

        {/* Yükseltilmiş katman: boyalı iller 3B kabarık (iki geçiş) */}
        <g className="raised" filter="url(#lift)">
          {raised.map((p) => (
            <g key={'s-' + p.name}>
              {Array.from({ length: DEPTH }).map((_, i) => (
                <path key={i} d={p.d} fill={p.side} transform={`translate(0, ${-i})`} />
              ))}
            </g>
          ))}
          {raised.map((p) => (
            <path
              key={'t-' + p.name}
              d={p.d}
              fill={p.top}
              transform={`translate(0, ${-DEPTH})`}
              stroke={p.outline}
              strokeWidth={1.8}
              strokeLinejoin="round"
            >
              <title>{p.name}</title>
            </path>
          ))}
        </g>
      </svg>
    </div>
  )
}
