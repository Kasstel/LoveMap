import { useEffect } from "react"
import { MapView } from "../components/map/MapView"
import { Header } from "../components/shared/Header"
import { useMemoryStore } from "../stores/memoryStore"
import { AddMemoryButton } from "../components/map/AddMemoryButton"
import { useMapStore } from "../stores/mapStore"
import { MemoryFormModal } from "../components/map/MemoryFormModal"
import { Sidebar } from "../components/sidebar/Sidebar"
import { PaperTexture } from "../components/shared/PaperTexture"
import { DeckleEdge } from "../components/shared/DeckleEdge"

// TODO: Header + карта + sidebar (Этап 1-2)
function MainLayout() {
  const coupleId = useMemoryStore((state)=> state.couple?.id)
  const fetchMemories = useMemoryStore((state)=> state.fetchMemories)
  const subscribeToChanges = useMemoryStore((state)=> state.subscribeToChanges)
  const newPinCoords = useMapStore((state)=> state.newPinCoords)
  const setNewPinCoords = useMapStore((state)=> state.setNewPinCoords)
  const editingMemoryId = useMapStore((state)=> state.editingMemoryId)
  const setEditingMemoryId = useMapStore((state)=> state.setEditingMemoryId)
  // find возвращает объект из стора как есть (ту же ссылку) — селектор безопасен.
  // если партнёр удалит воспоминание, пока форма открыта, тут станет undefined и форма закроется
  const editingMemory = useMemoryStore((state)=>
    editingMemoryId ? state.memories.find((memory)=> memory.id === editingMemoryId) : undefined
  )

  useEffect(()=>{
    if (!coupleId) return
    fetchMemories()

    const unsubscribe = subscribeToChanges()

    return unsubscribe
  }, [coupleId, fetchMemories, subscribeToChanges])
  return (
    // мягкий смещённый радиальный градиент вместо плоской заливки — лист под лампой, а не залитый цвет
    <div
      className="flex h-screen flex-col"
      style={{ background: 'radial-gradient(120% 100% at 32% 22%, var(--color-surface) 0%, var(--color-paper) 65%)' }}
    >
      <PaperTexture />
      <Header />
      <div className="flex min-h-0 flex-1">
        {/* 20px паспарту: вокруг карты виден текстурный paper-фон, будто фото вклеено в альбом */}
        <main className="relative flex-1 p-5">
          {/* свой positioned-контекст для AddMemoryButton — иначе top/right считались бы от внешнего края паспарту, а не от самой карты */}
          <div className="relative h-full w-full">
            <MapView />
            <AddMemoryButton/>
          </div>
        </main>
        {/* тень — на внешней обёртке: clip-path у DeckleEdge обрезал бы box-shadow */}
        <aside className="relative z-10 w-80 shrink-0 shadow-panel">
          <DeckleEdge edges={['left']} className="h-full overflow-y-auto bg-surface p-4">
            <Sidebar/>
          </DeckleEdge>
        </aside>
      </div>
      {newPinCoords && (
        <MemoryFormModal coords={newPinCoords} onClose={() => setNewPinCoords(null)}/>
      )}
      {editingMemory && (
        // key: при переходе к другому воспоминанию форма монтируется заново с его данными
        <MemoryFormModal
          key={editingMemory.id}
          memory={editingMemory}
          coords={{ lat: editingMemory.lat, lng: editingMemory.lng }}
          onClose={() => setEditingMemoryId(null)}
        />
      )}
    </div>
  )
}

export default MainLayout
