import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

interface PairedTitleProps {
  /** Верхняя строка, обычный шрифт — «Карта воспоминаний» */
  primary: string
  /** Нижняя строка, скрипт, наезжает поверх верхней — «Никитка & Алёнка» */
  secondary: string
  primaryFont?: string
  secondaryFont?: string
  primarySize?: number
  secondarySize?: number
  /** Цвет обеих строк */
  color?: string
  /** Ширина прозрачного зазора вокруг скрипта, в единицах viewBox */
  knockout?: number
  /** Насколько нижняя строка наезжает вверх на верхнюю */
  overlap?: number
  /** Горизонтальный сдвиг нижней строки вправо */
  shiftX?: number
  className?: string
}

const PADDING = 8

/**
 * Две строки заголовка: нижняя (скрипт) наезжает поверх верхней и отделяется
 * от неё прозрачным зазором — не заливкой цветом фона, а настоящей дырой
 * через SVG-маску. Поэтому сквозь зазор видно фон как есть: текстуру бархата,
 * градиент, что угодно.
 *
 * Маска: белый прямоугольник = видно, чёрный толстый контур скрипта = вырезано.
 * paintOrder="stroke" рисует обводку под заливкой, чтобы контур шёл ровно
 * по внешнему краю глифов.
 *
 * viewBox считается по фактическим размерам текста после загрузки шрифтов,
 * поэтому имена любой длины ложатся без ручной подгонки координат.
 */
export function PairedTitle({
  primary,
  secondary,
  primaryFont = 'ZTNeueRalewe',
  secondaryFont = 'FloriselScript',
  primarySize = 64,
  secondarySize = 78,
  color = 'var(--color-on-velvet)',
  knockout = 4,
  overlap = 26,
  shiftX = 90,
  className,
}: PairedTitleProps) {
  const maskId = useId()
  const primaryRef = useRef<SVGTextElement>(null)
  const secondaryRef = useRef<SVGTextElement>(null)
  const [box, setBox] = useState({ x: 0, y: 0, width: 1000, height: 220 })

  const primaryBaseline = primarySize
  const secondaryBaseline = primaryBaseline + secondarySize - overlap

  const measure = () => {
    const a = primaryRef.current
    const b = secondaryRef.current
    if (!a || !b) return

    const boxA = a.getBBox()
    const boxB = b.getBBox()

    // объединяем габариты обеих строк, с запасом на обводку маски
    const minX = Math.min(boxA.x, boxB.x) - knockout - PADDING
    const minY = Math.min(boxA.y, boxB.y) - knockout - PADDING
    const maxX = Math.max(boxA.x + boxA.width, boxB.x + boxB.width) + knockout + PADDING
    const maxY = Math.max(boxA.y + boxA.height, boxB.y + boxB.height) + knockout + PADDING

    setBox({ x: minX, y: minY, width: maxX - minX, height: maxY - minY })
  }

  useLayoutEffect(() => {
    measure()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primary, secondary, primarySize, secondarySize, overlap, shiftX, knockout])

  // Шрифты подключаются асинхронно: до их загрузки getBBox вернёт габариты
  // фолбэка, и viewBox будет неверным. Пересчитываем, когда шрифты готовы.
  useEffect(() => {
    let cancelled = false
    document.fonts?.ready.then(() => {
      if (!cancelled) measure()
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primary, secondary])

  const viewBox = `${box.x} ${box.y} ${box.width} ${box.height}`

  return (
    <svg
      viewBox={viewBox}
      className={className}
      role="img"
      aria-label={`${primary}. ${secondary}`}
      style={{ display: 'block', width: '100%', height: 'auto', overflow: 'visible' }}
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          {/* белое = видно */}
          <rect
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
            fill="white"
          />
          {/* чёрный толстый контур скрипта = вырезано из верхней строки */}
          <text
            x={shiftX}
            y={secondaryBaseline}
            fontFamily={secondaryFont}
            fontSize={secondarySize}
            fill="black"
            stroke="black"
            strokeWidth={knockout * 2}
            strokeLinejoin="round"
            paintOrder="stroke"
          >
            {secondary}
          </text>
        </mask>
      </defs>

      {/* верхняя строка — с вырезом под скрипт */}
      <text
        ref={primaryRef}
        x={0}
        y={primaryBaseline}
        fontFamily={primaryFont}
        fontSize={primarySize}
        fill={color}
        mask={`url(#${maskId})`}
      >
        {primary}
      </text>

      {/* нижняя строка — поверх, без обводки */}
      <text
        ref={secondaryRef}
        x={shiftX}
        y={secondaryBaseline}
        fontFamily={secondaryFont}
        fontSize={secondarySize}
        fill={color}
      >
        {secondary}
      </text>
    </svg>
  )
}