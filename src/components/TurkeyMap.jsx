import { useMemo } from 'react'
import { geoMercator, geoPath } from 'd3-geo'
import { geo, provinces, areNeighbors } from '../lib/provinces'
import { TARGET_COLOR } from '../lib/game'

const WIDTH = 1000
const HEIGHT = 440
const DEPTH = 5 // 3B kabarma yüksekliği (px)

const byName = new Map(provinces.map((p) => [p.name, p]))

// "rgb(r,g,b)" veya "#rrggbb" -> [r,g,b]
function parseColor(c) {
  if (c[0] === '#') {
    return [
      parseInt(c.slice(1, 3), 16),
      parseInt(c.slice(3, 5), 16),
      parseInt(c.slice(5, 7), 16),
    ]
  }
  const m = c.match(/\d+/g)
  return m ? m.slice(0, 3).map(Number) : [200, 200, 200]
}

// Yan duvar için koyulaştırılmış renk
function darken(c, f = 0.55) {
  const [r, g, b] = parseColor(c)
  return `rgb(${Math.round(r * f)}, ${Math.round(g * f)}, ${Math.round(b * f)})`
}

/**
 * Türkiye il haritası. `colors` = { ilAdı: renk } eşlemesi.
 * İç sınır çizilmez; yalnızca tahmin edilen iller boyanır ve
 * yerden yükselmiş gibi 3B (ekstrüzyon + gölge) görünür.
 */
export default function TurkeyMap({ colors = {}, target = null, revealed = false, onPick }) {
  const { paths, cy } = useMemo(() => {
    const projection = geoMercator().fitSize([WIDTH, HEIGHT], geo)
    const pathGen = geoPath(projection)
    const paths = geo.features.map((f) => ({
      name: f.properties.name,
      d: pathGen(f),
    }))
    // Painter's algorithm için her ilin ekran-y merkezi
    const cy = {}
    for (const f of geo.features) cy[f.properties.name] = pathGen.centroid(f)[1]
    return { paths, cy }
  }, [])

  // Yükseltilecek (boyalı) iller — kuzeyden güneye sırala ki 3B üst üste doğru binsin
  const raised = useMemo(() => {
    const names = paths
      .map((p) => p.name)
      .filter((n) => colors[n] || (revealed && target && n === target.name))
    const nameSet = new Set(names)
    const list = paths
      .filter((p) => nameSet.has(p.name))
      .map((p) => {
        const isTarget = revealed && target && p.name === target.name
        const top = isTarget ? TARGET_COLOR : colors[p.name]
        // Bu boyalı ilin, boyalı başka bir ille sınırdaş olup olmadığı
        const me = byName.get(p.name)
        const hasNeighbor =
          me != null &&
          names.some((n) => n !== p.name && areNeighbors(me, byName.get(n)))
        return { ...p, top, side: darken(top), hasNeighbor }
      })
    return list.sort((a, b) => cy[a.name] - cy[b.name])
  }, [paths, colors, target, revealed, cy])

  return (
    <div className="map-wrap">
      <svg
        viewBox={`0 ${-DEPTH} ${WIDTH} ${HEIGHT + DEPTH + 14}`}
        className="tr-map"
        role="img"
        aria-label="Türkiye il haritası"
      >
        <defs>
          <filter id="lift" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.55" />
          </filter>
          <filter id="land" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Zemin: tüm ülke tek parça, iç sınır yok */}
        <g className="base" filter="url(#land)">
          {paths.map((p) => (
            <path
              key={p.name}
              d={p.d}
              className="province"
              fill="var(--map-empty)"
              onClick={onPick ? () => onPick(p.name) : undefined}
              style={onPick ? { cursor: 'pointer' } : undefined}
            />
          ))}
        </g>

        {/* Yükseltilmiş katman: boyalı iller 3B kabarık */}
        <g className="raised" filter="url(#lift)">
          {raised.map((p) => (
            <g key={p.name}>
              {/* yan duvarlar (aşağıdan yukarı) */}
              {Array.from({ length: DEPTH }).map((_, i) => (
                <path key={i} d={p.d} fill={p.side} transform={`translate(0, ${-i})`} />
              ))}
              {/* üst yüzey — sınırdaş boyalı il varsa ince ayırıcı çizgi */}
              <path
                d={p.d}
                fill={p.top}
                transform={`translate(0, ${-DEPTH})`}
                stroke={p.hasNeighbor ? darken(p.top, 0.5) : 'none'}
                strokeWidth={p.hasNeighbor ? 1 : 0}
                strokeLinejoin="round"
              >
                <title>{p.name}</title>
              </path>
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}
