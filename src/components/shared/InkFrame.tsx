type InkFrameVariant = "frame" | "corner" | "underline" | "flourish"

interface InkFrameProps {
  variant?: InkFrameVariant
  className?: string
}

/**
 * Рисованные рамки и росчерки (components3.jpg): SVG, обводка currentColor —
 * цвет и размер задаются снаружи через className (например text-primary w-24).
 * Пути — заготовка «от руки», сверить с референсами при вёрстке компонентов.
 */
export function InkFrame({ variant = "frame", className }: InkFrameProps) {
  switch (variant) {
    case "corner":
      return <CornerOrnament className={className} />
    case "underline":
      return <UnderlineFlourish className={className} />
    case "flourish":
      return <Flourish className={className} />
    case "frame":
    default:
      return <FullFrame className={className} />
  }
}

const strokeProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
}

function FullFrame({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 200 120" className={className} {...strokeProps}>
      <path d="M10,14 Q8,6 18,7 L182,5 Q194,6 193,16 L195,104 Q196,114 186,113 L16,115 Q6,116 7,106 Z" />
      <path d="M18,22 L182,20 M18,98 L182,100" strokeWidth={0.75} opacity={0.6} />
    </svg>
  )
}

function CornerOrnament({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className={className} {...strokeProps}>
      <path d="M4,44 L4,10 Q4,4 10,4 L44,4" />
      <path d="M4,20 Q16,18 18,4" strokeWidth={1} opacity={0.7} />
    </svg>
  )
}

function UnderlineFlourish({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 160 24" className={className} {...strokeProps}>
      <path d="M4,10 Q40,2 80,10 T156,9" />
      <path d="M140,4 Q152,4 154,12 Q155,18 148,18 Q142,18 143,13" strokeWidth={1.25} />
    </svg>
  )
}

function Flourish({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 60 60" className={className} {...strokeProps}>
      <path d="M6,44 Q4,20 24,12 Q44,4 50,18 Q55,30 42,32 Q32,33 34,24" />
    </svg>
  )
}
