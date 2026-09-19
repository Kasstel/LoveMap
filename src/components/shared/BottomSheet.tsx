import { useRef, useState, type ReactNode } from "react"
import { InkFrame } from "./InkFrame"
import { PaperTexture } from "./PaperTexture"

export type SheetState = "peek" | "half" | "full"

interface BottomSheetProps {
  /** видно всегда, в свёрнутом состоянии — единственное, что видно кроме ручки */
  header: ReactNode
  /** прокручивается внутри листа, страница при этом стоит на месте */
  children: ReactNode
}

// высоты состояний. peek подобран под ручку и шапку в одну строку.
// dvh, а не vh: на телефоне vh считается по «большому» экрану без адресной строки,
// и снапы разъезжались бы с window.innerHeight, по которому мы тянем
const PEEK_PX = 80
const HALF_DVH = 40
const FULL_DVH = 85

const CSS_HEIGHT: Record<SheetState, string> = {
  peek: `${PEEK_PX}px`,
  half: `${HALF_DVH}dvh`,
  full: `${FULL_DVH}dvh`,
}

const ORDER: SheetState[] = ["peek", "half", "full"]

// рывок короче соседней точки, но длиннее порога, всё равно переключает состояние:
// иначе уверенное короткое движение вверх откатывалось бы назад
const FLICK_PX = 40

function snapHeights(): Record<SheetState, number> {
  return {
    peek: PEEK_PX,
    half: (window.innerHeight * HALF_DVH) / 100,
    full: (window.innerHeight * FULL_DVH) / 100,
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Лист, выезжающий снизу поверх карты: три состояния, переключаются перетаскиванием
 * за ручку. Бэкдропа нет намеренно — карта под свёрнутым листом остаётся кликабельной.
 *
 * Тянем высоту, а не transform: тогда область прокрутки внутри всегда равна видимой
 * части листа. При transform лист был бы всегда 85dvh, и в свёрнутом виде список
 * прокручивался бы за экраном.
 *
 * Высоту на старте перетаскивания снимаем с самого элемента (getBoundingClientRect),
 * поэтому dvh не нужно переводить в пиксели вручную и пересчитывать на resize.
 */
export function BottomSheet({ header, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<SheetState>("peek")
  // пока тянем — высота в пикселях, в покое null и высоту задаёт состояние
  const [dragHeight, setDragHeight] = useState<number | null>(null)
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null)
  // после перетаскивания браузер всё равно шлёт click по ручке — этим флагом его отличаем от тапа
  const movedRef = useRef(false)

  function handleTouchStart(event: React.TouchEvent) {
    const sheet = sheetRef.current
    if (!sheet) return
    movedRef.current = false
    dragRef.current = {
      startY: event.touches[0].clientY,
      startHeight: sheet.getBoundingClientRect().height,
    }
  }

  function handleTouchMove(event: React.TouchEvent) {
    const drag = dragRef.current
    if (!drag) return
    // палец вверх — clientY уменьшается, а высота должна расти, отсюда минус
    const shift = event.touches[0].clientY - drag.startY
    if (Math.abs(shift) > 4) movedRef.current = true
    const next = drag.startHeight - shift
    const limits = snapHeights()
    setDragHeight(clamp(next, limits.peek, limits.full))
  }

  function handleTouchEnd() {
    const drag = dragRef.current
    dragRef.current = null
    // палец не двинулся — это тап, его обработает onClick ручки
    if (drag === null || dragHeight === null) return

    setState(pickSnap(dragHeight, dragHeight - drag.startHeight))
    setDragHeight(null)
  }

  function pickSnap(height: number, delta: number): SheetState {
    const heights = snapHeights()
    const nearest = ORDER.reduce((best, candidate) =>
      Math.abs(heights[candidate] - height) < Math.abs(heights[best] - height) ? candidate : best,
    )

    // не дотянули до соседней точки, но дёрнули уверенно — всё равно шагаем в сторону движения
    if (nearest === state && Math.abs(delta) > FLICK_PX) {
      const step = ORDER.indexOf(state) + (delta > 0 ? 1 : -1)
      return ORDER[clamp(step, 0, ORDER.length - 1)]
    }
    return nearest
  }

  // тап и клавиатура: перетаскивание мышью и с клавиатуры недоступно, поэтому ручка ещё и кнопка
  function cycleState() {
    // click прилетает и в конце перетаскивания — тогда состояние уже выбрано в handleTouchEnd
    if (movedRef.current) {
      movedRef.current = false
      return
    }
    setState((current) => ORDER[(ORDER.indexOf(current) + 1) % ORDER.length])
  }

  const dragging = dragHeight !== null

  return (
    // тень на внешней обёртке, как у десктопного aside: внутри она попала бы под скругление и текстуру.
    // fixed, а не absolute: лист считается от экрана, а не от колонки с картой.
    // z-[1000]: .leaflet-container не создаёт своего контекста наложения, поэтому его панели
    // (z-index 400…1000) конкурируют с нашими элементами напрямую — всё поверх карты идёт от 1000
    <div
      ref={sheetRef}
      className={`fixed inset-x-0 bottom-0 z-[1000] rounded-t-panel border-t border-line bg-surface shadow-modal ${
        dragging ? "" : "transition-[height] duration-300 ease-out motion-reduce:transition-none"
      }`}
      style={{ height: dragging ? `${dragHeight}px` : CSS_HEIGHT[state] }}
    >
      {/* overflow-hidden — чтобы текстура и содержимое не вылезали за скруглённые углы */}
      <div className="relative flex h-full flex-col overflow-hidden rounded-t-panel">
        <PaperTexture opacity={0.32} className="pointer-events-none absolute inset-0 h-full w-full" />

        {/* touch-none: за ручку тянем мы, браузер не должен считать это прокруткой или зумом */}
        <button
          type="button"
          onClick={cycleState}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          aria-expanded={state !== "peek"}
          aria-label="Список воспоминаний: потяни или нажми, чтобы развернуть"
          className="relative w-full shrink-0 touch-none px-5 pt-2 pb-1"
        >
          {/* росчерк вместо серой «пилюли»: скругления-пилюли в этом направлении не используем */}
          <InkFrame variant="underline" className="mx-auto h-2.5 w-16 text-line" />
        </button>

        <div className="relative shrink-0 px-5">{header}</div>

        {/* min-h-0 — иначе flex-элемент не даст себя сжать и прокрутки не будет.
            overscroll-contain: докрутив список до края, не тянем за собой страницу */}
        <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-2 pb-6">
          {children}
        </div>
      </div>
    </div>
  )
}
