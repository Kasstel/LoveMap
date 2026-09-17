import { useMapStore } from "../../stores/mapStore";


export function AddMemoryButton(){
  const isAddingMode = useMapStore((state)=> state.isAddingMode)
  const setAddingMode = useMapStore((state)=> state.setAddingMode)
  const setNewPinCoords = useMapStore((state)=> state.setNewPinCoords)

  function handleStart(){
    setAddingMode(true)
  }

  function handleCancel(){
    setAddingMode(false)
    setNewPinCoords(null)
  }

  return(
    <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end gap-2">
    {isAddingMode && (
    <div className="rounded-control bg-surface px-3 py-2 text-sm text-ink-soft shadow-panel">
      Кликни на карту, где это было
    </div>
    )}
      <button
        type="button"
        onClick={isAddingMode ? handleCancel : handleStart}
        className={`rounded-full px-10 py-2 text-sm font-medium shadow-panel  ${
  isAddingMode ? 'bg-[#4A0011] text-on-primary' : 'bg-[#4A0011] text-on-primary'
}`}
      >
        
        {isAddingMode ? 'Отмена' : '+ Добавить воспоминание'}
      </button>
    </div>
  )

}