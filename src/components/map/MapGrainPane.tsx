import { useEffect, useId, useState } from "react"
import { Pane, useMap } from "react-leaflet"

const GRAIN_OPACITY = 0.12

/*
  Зерно поверх тайлов, но под пинами — z-index 400 (между .leaflet-tile-pane 200
  и .leaflet-marker-pane 600, см. leaflet.css). Обычный дефолт .leaflet-pane и без того 400,
  но задаём явно, чтобы не зависеть от совпадения со значением по умолчанию.

  Собственный Pane, а не mix-blend-mode на .leaflet-container: блендинг на контейнере
  создал бы новый stacking context и вынес бы из него позиционирование пинов и попапов.

  У .leaflet-map-pane нет собственных width/height (Leaflet только двигает его transform'ом),
  поэтому inset:0 схлопнется в 0×0 — размер приходится брать у карты явно и держать
  в актуальном состоянии через ResizeObserver.
*/
export function MapGrainPane() {
  const map = useMap()
  const [size, setSize] = useState(() => map.getSize())
  const filterId = useId()

  useEffect(() => {
    const container = map.getContainer()
    const observer = new ResizeObserver(() => setSize(map.getSize()))
    observer.observe(container)
    return () => observer.disconnect()
  }, [map])

  return (
    <Pane name="grain" style={{ zIndex: 400, pointerEvents: "none" }}>
      <svg
        aria-hidden="true"
        width={size.x}
        height={size.y}
        style={{ position: "absolute", left: 0, top: 0, mixBlendMode: "multiply", opacity: GRAIN_OPACITY }}
      >
        <defs>
          <filter id={filterId}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} stitchTiles="stitch" />
            {/* тот же чернильный тон, что и в PaperTexture: игнорируем цвет шума, красим постоянным */}
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.478
                      0 0 0 0 0.357
                      0 0 0 0 0.290
                      0 0 0 1 0"
            />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter={`url(#${filterId})`} />
      </svg>
    </Pane>
  )
}
