import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

type InkLoaderVariant = 'velvet' | 'paper'

export interface InkLoaderCouple {
  name1: string
  name2: string
}

interface InkLoaderProps {
  variant: InkLoaderVariant
  couple: InkLoaderCouple | null
  size?: number
}

const DRAW_MS = 400
const HOLD_MS = 400
const FADE_MS = 600
const CYCLE_MS = DRAW_MS + HOLD_MS + FADE_MS

const LETTERS_START_MS = 200
const LETTER_STEP_MS = 30
const LETTER_REVEAL_MS = 100

// Один непрерывный росчерк с мелкими отклонениями в контрольных точках,
// чтобы линия дрожала как от руки. Начало (49,17) и конец (52,18) не совпадают —
// перо не дотянуло до начала, зазор виден только при увеличении.
// Добавлены промежуточные кубические сегменты с микро-сбоями для шероховатости.
const HEART_PATH =
  'M49,17 C46,12 42,6 36,3 C30,0 22,-1 15,4 C8,9 2,17 1,26 C0,35 3,44 8,52 ' +
  'C13,60 21,68 30,76 C36,81 43,85 49,88 ' +
  'C55,85 62,81 69,76 C78,68 86,60 91,52 ' +
  'C96,44 99,35 98,26 C97,17 91,9 84,4 C77,-1 69,0 63,3 C57,6 53,12 52,18'

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = () => setReduced(query.matches)
    query.addEventListener('change', handler)
    return () => query.removeEventListener('change', handler)
  }, [])

  return reduced
}

/**
 * Чернильный лоадер — сердце обрисовывается пером, внутри появляются инициалы пары.
 *
 * Эффект чернил: feTurbulence + feDisplacementMap шероховят край линии,
 * два наложенных пути с разной толщиной имитируют нажим пера.
 *
 * Инициалы живут внутри SVG как <text>, масштабируются вместе с viewBox
 * и не вылезают за контейнер.
 *
 * key={cycle} перезапускает одноразовые CSS-анимации свежим DOM-узлом.
 */
export function InkLoader({ variant, couple, size = 48 }: InkLoaderProps) {
  const reducedMotion = usePrefersReducedMotion()
  const [cycle, setCycle] = useState(0)
  const bodyRef = useRef<SVGPathElement>(null)
  const edgeRef = useRef<SVGPathElement>(null)
  const filterId = useId()

  // Вычислить длину пути после каждого remount (key={cycle})
  useLayoutEffect(() => {
    const body = bodyRef.current
    const edge = edgeRef.current
    if (!body || !edge) return
    const length = String(body.getTotalLength())
    body.style.setProperty('--ink-len', length)
    edge.style.setProperty('--ink-len', length)
  }, [cycle])

  // Перезапуск цикла
  useEffect(() => {
    if (reducedMotion) return
    const id = setTimeout(() => setCycle((c) => c + 1), CYCLE_MS)
    return () => clearTimeout(id)
  }, [cycle, reducedMotion])

  const strokeColor =
    variant === 'velvet' ? 'var(--color-on-velvet)' : 'var(--color-primary)'
  const mutedColor =
    variant === 'velvet' ? 'var(--color-on-velvet-muted)' : 'var(--color-ink-muted)'

  let char1 = couple?.name1.trim().charAt(0).toUpperCase() ?? null
  let char2 = couple?.name2.trim().charAt(0).toUpperCase() ?? null

 if (couple === null){
    char1 = '.'
    char2 = '.'
 }
  
  return (
    <div
      key={cycle}
      className="ink-loader-root inline-block"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="-8 -8 116 108"
        className="ink-loader-svg h-full w-full overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <filter
            id={filterId}
            x="-5%"
            y="-5%"
            width="110%"
            height="110%"
          >
            <feTurbulence
              type="turbulence"
              baseFrequency="0.04"
              numOctaves="4"
              seed={2}
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={1.5}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>

        {/* Группа с фильтром шероховатости */}
        <g filter={`url(#${filterId})`}>
          {/* Нижний слой — «тело» мазка, имитация нажима */}
          <path
            ref={bodyRef}
            className="ink-loader-stroke"
            d={HEART_PATH}
            fill="none"
            stroke={strokeColor}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            opacity={0.3}
          />
          {/* Верхний слой — чёткий край пера */}
          <path
            ref={edgeRef}
            className="ink-loader-stroke"
            d={HEART_PATH}
            fill="none"
            stroke={strokeColor}
            strokeWidth={1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </g>

        {/* Инициалы внутри SVG — масштабируются с viewBox, не обрезаются */}
        
        {char1 && char2 && (
          <text
            x="50"
            y="46"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="Caveat, cursive"
            fontSize="18"
            className="ink-loader-initials"
          >
            <tspan className="ink-loader-letter ink-loader-letter-0" fill={strokeColor}>
              {char1}
            </tspan>
            <tspan className="ink-loader-letter ink-loader-letter-1" fill={mutedColor} dx="2">
              {couple === null ? '.' : '&'}
            </tspan>
            <tspan className="ink-loader-letter ink-loader-letter-2" fill={strokeColor} dx="2">
              {char2}
            </tspan>
          </text>
        )}
      </svg>

      <style>{`
        .ink-loader-stroke {
          stroke-dasharray: var(--ink-len, 1);
          stroke-dashoffset: 0;
        }
        .ink-loader-letter {
          opacity: 1;
        }

        @media (prefers-reduced-motion: no-preference) {
          .ink-loader-svg {
            animation: ink-fade ${FADE_MS}ms ease-in-out ${DRAW_MS + HOLD_MS}ms both;
          }
          .ink-loader-stroke {
            stroke-dashoffset: var(--ink-len, 1);
            animation: ink-draw ${DRAW_MS}ms ease-in-out both;
          }
          .ink-loader-letter {
            opacity: 0;
            animation: ink-letter ${LETTER_REVEAL_MS}ms ease-out both;
          }
          .ink-loader-letter-0 {
            animation-delay: ${LETTERS_START_MS}ms;
          }
          .ink-loader-letter-1 {
            animation-delay: ${LETTERS_START_MS + LETTER_STEP_MS}ms;
          }
          .ink-loader-letter-2 {
            animation-delay: ${LETTERS_START_MS + LETTER_STEP_MS * 2}ms;
          }
        }

        @keyframes ink-draw {
          from { stroke-dashoffset: var(--ink-len, 1); }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes ink-fade {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes ink-letter {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  )
}