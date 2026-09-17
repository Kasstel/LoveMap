import { useEffect } from "react"
import { MapView } from "../components/map/MapView"
import { Header } from "../components/shared/Header"
import { useMemoryStore } from "../stores/memoryStore"
import { AddMemoryButton } from "../components/map/AddMemoryButton"
import { useMapStore } from "../stores/mapStore"
import { MemoryFormModal } from "../components/map/MemoryFormModal"
import { Sidebar } from "../components/sidebar/Sidebar"

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
    <div className="flex h-screen flex-col bg-tint">
      <Header />
      <div className="flex min-h-0 flex-1">
        <main className="relative flex-1">
          <MapView />
          <AddMemoryButton/>
        </main>
        <aside className="overflow-y-auto w-80 border-l border-line-soft bg-surface p-4">
          <Sidebar/>
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
