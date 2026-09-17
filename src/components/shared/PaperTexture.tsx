import { useId } from "react"

type PaperTextureVariant = "paper" | "velvet"

interface PaperTextureProps {
  className?: string
  /** 'paper' — тёмное зерно на светлом, 'velvet' — светлая ворсинка на тёмном */
  variant?: PaperTextureVariant
  /** общая видимость текстуры; крупный рельефный слой держим слабее мелкого зерна */
  opacity?: number
}

/*
  На тёмном фоне multiply не работает: он только уводит цвет в чёрный, зерна не видно.
  Поэтому у бархата зерно идёт через screen (светлая ворсинка), рельеф — через soft-light,
  и непрозрачность выше: тёмный фон съедает контраст сильнее светлого.
*/
const VARIANTS: Record<PaperTextureVariant, {
  opacity: number
  reliefBlend: "overlay" | "soft-light"
  grainBlend: "multiply" | "screen"
  /** цвет зерна в долях 0..1 — им красим шум целиком, свой цвет турбулентности не нужен */
  grainTint: [number, number, number]
}> = {
  paper: {
    opacity: 0.16,
    reliefBlend: "overlay",
    grainBlend: "multiply",
    grainTint: [0.478, 0.357, 0.29],
  },
  // screen на тёмном виден уже при малой непрозрачности: на 0.3 он уводил бордовый
  // в пыльно-розовый, и экран карты переставал совпадать по тону с AuthPage
  velvet: {
    opacity: 0.12,
    reliefBlend: "soft-light",
    grainBlend: "screen",
    grainTint: [0.95, 0.906, 0.836],
  },
}

/**
 * Бумага держится на двух SVG-слоях шума, а не на растровой текстуре —
 * растровая текстура на весь экран била бы по производительности рядом с Leaflet.
 *
 * Крупный слой — рельеф волокна: feTurbulence низкой частоты идёт в feDiffuseLighting
 * с боковым feDistantLight, свет и тень от «бугров» и дают шероховатость.
 * Мелкий слой — тонкое зерно поверх.
 */
export function PaperTexture({ className, variant = "paper", opacity }: PaperTextureProps) {
  const reliefFilterId = useId()
  const grainFilterId = useId()

  const preset = VARIANTS[variant]
  const grainOpacity = opacity ?? preset.opacity
  // крупный рельефный слой слабее мелкого зерна — иначе волокно спорит с текстом поверх
  const reliefOpacity = grainOpacity * 0.7
  const [tintR, tintG, tintB] = preset.grainTint

  return (
    <div aria-hidden="true" className={className ?? "pointer-events-none fixed inset-0 h-full w-full"}>
      <svg
        className="absolute inset-0 h-full w-full"
        style={{ mixBlendMode: preset.reliefBlend, opacity: reliefOpacity }}
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
        style={{ mixBlendMode: preset.grainBlend, opacity: grainOpacity }}
      >
        <defs>
          <filter id={grainFilterId}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} stitchTiles="stitch" />
            {/* игнорируем цвет шума, красим постоянным тоном; альфа-канал шума задаёт зерно */}
            <feColorMatrix
              type="matrix"
              values={`0 0 0 0 ${tintR}
                       0 0 0 0 ${tintG}
                       0 0 0 0 ${tintB}
                       0 0 0 1 0`}
            />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter={`url(#${grainFilterId})`} />
      </svg>
    </div>
  )
}
