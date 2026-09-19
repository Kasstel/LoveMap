import { useIsMobile } from "../../app/viewport";
import { useMapStore } from "../../stores/mapStore";
import { useMemoryStore } from "../../stores/memoryStore";
import { BottomSheet } from "../shared/BottomSheet";
import { DeckleEdge } from "../shared/DeckleEdge";
import { EmptyState } from "../shared/EmptyState";
import { InkFrame } from "../shared/InkFrame";
import { PaperTexture } from "../shared/PaperTexture";
import { MemoryCard } from "./MemoryCard";

/**
 * Список воспоминаний в двух оболочках: на десктопе — правая страница-aside,
 * на телефоне — лист, выезжающий снизу поверх карты.
 *
 * Переключение через контекст, а не классами: это разные компоненты и разная
 * разметка, скрыть одну из них display:none означало бы держать в дереве два
 * списка карточек сразу.
 */
export function Sidebar() {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <BottomSheet header={<SheetHeading />}>
        <MemoryList />
      </BottomSheet>
    )
  }

  return (
    // тень — на внешней обёртке: clip-path у DeckleEdge обрезал бы box-shadow
    <aside className="relative z-10 w-80 shrink-0 shadow-modal">
      {/* внутренняя тень вдоль торца — эту DeckleEdge не обрезает: inset-тень не выходит за свою же рамку */}
      <DeckleEdge
        edges={['left']}
        className="relative h-full bg-surface shadow-[inset_10px_0_16px_-14px_rgba(74,0,17,0.4)]"
      >
        {/* текстура — в нескроллящемся слое: внутри overflow-y-auto она уезжала бы вместе со списком */}
        <PaperTexture opacity={0.32} className="pointer-events-none absolute inset-0 h-full w-full" />
        <div className="relative h-full overflow-y-auto p-6">
          <SidebarHeading />
          <MemoryList />
        </div>
      </DeckleEdge>
    </aside>
  )
}

/** Шапка страницы-aside: заголовок, росчерк и счётчик в три строки */
function SidebarHeading() {
  const count = useMemoryStore((state) => state.memories.length)

  return (
    <div>
      <h2 className="font-display text-xl text-ink">Воспоминания</h2>
      <InkFrame variant="underline" className="mt-1 h-2.5 w-28 text-ink-faint" />
      <p className="mt-2 text-sm text-ink-subtle">Сейчас у вас {count}</p>
    </div>
  )
}

/**
 * Шапка листа: то же самое в одну строку. В свёрнутом состоянии на неё
 * приходится вся видимая высота, поэтому росчерк и отдельная строка счётчика не влезают
 */
function SheetHeading() {
  const count = useMemoryStore((state) => state.memories.length)

  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line-soft pb-2">
      <h2 className="font-display text-lg text-ink">Воспоминания</h2>
      <span className="shrink-0 text-sm text-ink-subtle">{count}</span>
    </div>
  )
}

function MemoryList() {
  const memories = useMemoryStore((state) => state.memories)
  const activeMemoryId = useMapStore((state) => state.activeMemoryId)
  const setActiveMemoryId = useMapStore((state) => state.setActiveMemoryId)

  if (memories.length === 0) {
    return (
      <EmptyState
        icon="🗺️"
        title="Пока пусто"
        hint="Нажми «+ Добавить воспоминание» и кликни на карту"
      />
    )
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      {memories.map((memory) => (
        <MemoryCard
          key={memory.id}
          memory={memory}
          isActive={memory.id === activeMemoryId}
          onSelect={setActiveMemoryId}
        />
      ))}
    </div>
  )
}
