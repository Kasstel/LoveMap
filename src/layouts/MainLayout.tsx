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
import { PassePartout } from "../components/shared/PassePartout"
import { Counter } from "../components/shared/Counter"

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
    // бархат на всю страницу — направление kiss.jpg; светлая карта на бордовом и есть приём.
    // фон и текстура — те же, что на AuthPage (.bg-velvet-page), чтобы экраны не расходились по тону
    <div className="bg-velvet-page relative h-screen overflow-hidden">
      <PaperTexture variant="velvet" />
      <PassePartout />

      {/* цепочку высот не рвём: h-screen → flex-1 → min-h-0, отступы паспарту висят здесь, а не на MapContainer */}
      <div className="relative flex h-full flex-col px-9 py-9">
        <Header />
        <div className="flex min-h-0 flex-1 gap-6">
          <main className="flex min-h-0 flex-1 flex-col">
            {/* свой positioned-контекст для AddMemoryButton — иначе top/right считались бы от края паспарту, а не от самой карты */}
            <div className="relative min-h-0 flex-1">
              <MapView />
              <AddMemoryButton/>
            </div>
            <div className="pt-4 text-center">
              <Counter/>
            </div>
          </main>
          {/* тень — на внешней обёртке: clip-path у DeckleEdge обрезал бы box-shadow */}
          <aside className="relative z-10 w-80 shrink-0 shadow-modal">
            {/* внутренняя тень вдоль торца — эту DeckleEdge не обрезает: inset-тень не выходит за свою же рамку */}
            <DeckleEdge
              edges={['left']}
              className="relative h-full bg-surface shadow-[inset_10px_0_16px_-14px_rgba(74,0,17,0.4)]"
            >
              {/* текстура — в нескроллящемся слое: внутри overflow-y-auto она уезжала бы вместе со списком */}
              <PaperTexture opacity={0.32} className="pointer-events-none absolute inset-0 h-full w-full" />
              <div className="relative h-full overflow-y-auto p-6">
                <Sidebar/>
              </div>
            </DeckleEdge>
          </aside>
        </div>
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
