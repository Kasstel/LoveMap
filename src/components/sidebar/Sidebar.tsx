import { useMapStore } from "../../stores/mapStore";
import { useMemoryStore } from "../../stores/memoryStore";
import { EmptyState } from "../shared/EmptyState";
import { InkFrame } from "../shared/InkFrame";
import { MemoryCard } from "./MemoryCard";

export function Sidebar(){
  const memories = useMemoryStore((state)=> state.memories)

  const activeMemoryId = useMapStore((state)=> state.activeMemoryId)
  const setActiveMemoryId = useMapStore((state)=> state.setActiveMemoryId)

  return(
    <>
      <div>
        <h2 className="font-display text-xl text-ink">Воспоминания</h2>
        <InkFrame variant="underline" className="mt-1 h-2.5 w-28 text-ink-faint" />
        <p className="mt-2 text-sm text-ink-subtle">Сейчас у вас {memories.length}</p>
      </div>

      {memories.length === 0 ? (
        <EmptyState icon="🗺️"
        title="Пока пусто"
        hint="Нажми «+ Добавить воспоминание» и кликни на карту" />
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {memories.map((memory) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              isActive={memory.id === activeMemoryId}
              onSelect={setActiveMemoryId}
            />
          ))}
          </div>)
        }
    </>
  )

}
