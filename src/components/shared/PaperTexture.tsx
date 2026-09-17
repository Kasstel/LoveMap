import { useId } from "react"

interface PaperTextureProps {
  className?: string
  /** общая видимость текстуры: 0.12–0.22, крупный рельефный слой держим слабее мелкого зерна */
  opacity?: number
}

const DEFAULT_OPACITY = 0.16

/**
 * Бумага держится на двух SVG-слоях шума, а не на растровой текстуре —
 * растровая текстура на весь экран била бы по производительности рядом с Leaflet.
 *
 * Крупный слой — рельеф волокна: feTurbulence низкой частоты идёт в feDiffuseLighting
 * с боковым feDistantLight, свет и тень от «бугров» и дают шероховатость.
 * Один multiply поверх плоского шума такого эффекта не даёт, только пачкает цвет.
 * Мелкий слой — тонкое зерно поверх, как и раньше, через multiply.
 */
export function PaperTexture({ className, opacity = DEFAULT_OPACITY }: PaperTextureProps) {
  const reliefFilterId = useId()
  const grainFilterId = useId()

  // крупный рельефный слой слабее мелкого зерна — иначе волокно спорит с текстом поверх
  const reliefOpacity = opacity * 0.7
  const grainOpacity = opacity

  return (
    <div aria-hidden="true" className={className ?? "pointer-events-none fixed inset-0 h-full w-full"}>
      <svg
        className="absolute inset-0 h-full w-full"
        style={{ mixBlendMode: "overlay", opacity: reliefOpacity }}
      >
        <defs>
          <filter id={reliefFilterId} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves={3} seed={7} result="fiber" />
            <feDiffuseLighting in="fiber" surfaceScale={2} diffuseConstant={1.1} lighting-color="#ffffff" result="lit">
              <feDistantLight azimuth={235} elevation={55} />
            </feDiffuseLighting>
          </filter>
        </defs>
        <rect width="100%" height="100%" filter={`url(#${reliefFilterId})`} />
      </svg>

      <svg
        className="absolute inset-0 h-full w-full"
        style={{ mixBlendMode: "multiply", opacity: grainOpacity }}
      >
        <defs>
          <filter id={grainFilterId}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} stitchTiles="stitch" />
            {/* игнорируем цвет шума, красим постоянным чернильным тоном; альфа-канал шума задаёт зерно */}
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.478
                      0 0 0 0 0.357
                      0 0 0 0 0.290
                      0 0 0 1 0"
            />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter={`url(#${grainFilterId})`} />
      </svg>
    </div>
  )
}
