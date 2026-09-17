import { useMapStore } from "../../stores/mapStore";
import { useMemoryStore } from "../../stores/memoryStore";
import { EmptyState } from "../shared/EmptyState";
import { MemoryCard } from "./MemoryCard";

export function Sidebar(){
  const memories = useMemoryStore((state)=> state.memories)

  const activeMemoryId = useMapStore((state)=> state.activeMemoryId)
  const setActiveMemoryId = useMapStore((state)=> state.setActiveMemoryId)

  return(
    <>
      <h2>Воспоминания</h2>
      <h3>Сейчас у вас {memories.length}</h3>

      {memories.length === 0 ? (
        <EmptyState icon="🗺️"
        title="Пока пусто"
        hint="Нажми «+ Добавить воспоминание» и кликни на карту" />
      ) : (
        <div className="mt-3 flex flex-col gap-1">
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