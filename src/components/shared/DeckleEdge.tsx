import { useId, useMemo, type ReactNode } from "react"

type DeckleSide = "top" | "right" | "bottom" | "left"

interface DeckleEdgeProps {
  children: ReactNode
  className?: string
  /** какие стороны рвать; остальные остаются ровными. По умолчанию — все четыре */
  edges?: DeckleSide[]
  /** разные seed дают разный рисунок разрыва на одинаковых карточках */
  seed?: number
}

const SEGMENTS = 8
const AMPLITUDE = 0.025 // разброс в долях от стороны — деккельный край, а не зубцы

// mulberry32: маленький детерминированный PRNG, чтобы край не пересчитывался случайно на каждый рендер
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function sideOffsets(rng: () => number, torn: boolean) {
  const offsets: number[] = []
  for (let i = 1; i < SEGMENTS; i++) {
    offsets.push(torn ? (rng() * 2 - 1) * AMPLITUDE : 0)
  }
  return offsets
}

// clipPathUnits="objectBoundingBox" — путь в долях 0..1, поэтому один и тот же
// clipPath масштабируется под любой размер карточки без пересчёта
function buildClipPath(edges: Set<DeckleSide>, seed: number): string {
  const rng = mulberry32(seed)
  const top = sideOffsets(rng, edges.has("top"))
  const right = sideOffsets(rng, edges.has("right"))
  const bottom = sideOffsets(rng, edges.has("bottom"))
  const left = sideOffsets(rng, edges.has("left"))

  const points: [number, number][] = [[0, 0]]

  top.forEach((j, i) => points.push([(i + 1) / SEGMENTS, j]))
  points.push([1, 0])

  right.forEach((j, i) => points.push([1 + j, (i + 1) / SEGMENTS]))
  points.push([1, 1])

  bottom.forEach((j, i) => points.push([1 - (i + 1) / SEGMENTS, 1 + j]))
  points.push([0, 1])

  left.forEach((j, i) => points.push([j, 1 - (i + 1) / SEGMENTS]))
  points.push([0, 0])

  return (
    points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(4)},${y.toFixed(4)}`).join(" ") + " Z"
  )
}

const ALL_EDGES: DeckleSide[] = ["top", "right", "bottom", "left"]

export function DeckleEdge({ children, className, edges = ALL_EDGES, seed = 1 }: DeckleEdgeProps) {
  const clipId = useId()
  const edgesKey = edges.join(",")
  // зависим от edgesKey, а не от edges: массив-литерал в дефолтном параметре
  // меняет ссылку на каждый рендер, из-за строки пересчёт не будет лишним
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const path = useMemo(() => buildClipPath(new Set(edges), seed), [edgesKey, seed])

  return (
    <div className={className} style={{ clipPath: `url(#${clipId})` }}>
      <svg aria-hidden="true" width="0" height="0" className="absolute">
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            <path d={path} />
          </clipPath>
        </defs>
      </svg>
      {children}
    </div>
  )
}
