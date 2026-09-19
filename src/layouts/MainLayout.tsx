import { useEffect } from "react"
import { MapView } from "../components/map/MapView"
import { Header } from "../components/shared/Header"
import { useMemoryStore } from "../stores/memoryStore"
import { AddMemoryButton } from "../components/map/AddMemoryButton"
import { useMapStore } from "../stores/mapStore"
import { MemoryFormModal } from "../components/map/MemoryFormModal"
import { Sidebar } from "../components/sidebar/Sidebar"
import { PaperTexture } from "../components/shared/PaperTexture"
import { PassePartout } from "../components/shared/PassePartout"
import { Counter } from "../components/shared/Counter"
import { useIsMobileViewport } from "../hooks/useMediaQuery"
import { ViewportContext } from "../app/viewport"

// TODO: Header + карта + sidebar (Этап 1-2)
function MainLayout() {
  // единственный вызов на приложение: ниже значение раздаётся через контекст.
  // Пока никто не читает — layout меняем следующим шагом
  const isMobile = useIsMobileViewport()

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
    // React 19: контекст сам себе провайдер, .Provider больше не нужен.
    // Значение — примитив, мемоизировать нечего
    <ViewportContext value={isMobile}>
    {/* бархат на всю страницу — направление kiss.jpg; светлая карта на бордовом и есть приём.
        фон и текстура — те же, что на AuthPage (.bg-velvet-page), чтобы экраны не расходились по тону */}
    <div className="bg-velvet-page relative h-dvh overflow-hidden">
      <PaperTexture variant="velvet" />
      <PassePartout />

      {/* цепочку высот не рвём: h-dvh → flex-1 → min-h-0 → MapContainer h-full.
          Отступы паспарту висят здесь, а не на MapContainer, и только на десктопе */}
      <div className="relative flex h-full min-h-0 flex-col px-4 py-4 desktop:px-9 desktop:py-9">
        <Header />
        <div className="flex min-h-0 flex-1 desktop:gap-6">
          <main className="flex min-h-0 flex-1 flex-col">
            {/* свой positioned-контекст для AddMemoryButton — иначе top/right считались бы от края паспарту, а не от самой карты */}
            <div className="relative min-h-0 flex-1">
              <MapView />
              <AddMemoryButton/>
            </div>
            {/* на телефоне счётчик стоит строкой в шапке (Header) */}
            <div className="hidden pt-4 text-center desktop:block">
              <Counter/>
            </div>
          </main>
          {/* на десктопе это правая страница-aside, на телефоне — лист снизу поверх карты (fixed, вне потока) */}
          <Sidebar/>
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
    </ViewportContext>
  )
}

export default MainLayout
