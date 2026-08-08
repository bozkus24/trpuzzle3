import { useMemo } from 'react'
import { geoMercator, geoPath } from 'd3-geo'
import { geo } from '../lib/provinces'

const WIDTH = 1000
const HEIGHT = 440

/**
 * Türkiye il haritası. `colors` = { ilAdı: renk } eşlemesi.
 * Tahmin edilen iller renklenir, hedef bulunduysa vurgulanır.
 */
export default function TurkeyMap({ colors = {}, target = null, revealed = false, onPick }) {
  const { paths, projection } = useMemo(() => {
    const projection = geoMercator().fitSize([WIDTH, HEIGHT], geo)
    const pathGen = geoPath(projection)
    const paths = geo.features.map((f) => ({
      name: f.properties.name,
      d: pathGen(f),
    }))
    return { paths, projection }
  }, [])

  return (
    <div className="map-wrap">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="tr-map"
        role="img"
        aria-label="Türkiye il haritası"
      >
        <g>
          {paths.map((p) => {
            const fill = colors[p.name]
            const isTarget = revealed && target && p.name === target.name
            return (
              <path
                key={p.name}
                d={p.d}
                className={'province' + (fill ? ' guessed' : '') + (isTarget ? ' target' : '')}
                fill={isTarget ? '#22c55e' : fill || 'var(--map-empty)'}
                onClick={onPick ? () => onPick(p.name) : undefined}
                style={onPick ? { cursor: 'pointer' } : undefined}
              >
                <title>{fill || isTarget ? p.name : ''}</title>
              </path>
            )
          })}
        </g>
      </svg>
    </div>
  )
}
