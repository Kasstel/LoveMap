import { Marker, Popup, useMap } from 'react-leaflet'
import type { Memory } from '../../types'
import { useEffect, useMemo, useRef } from 'react'
import { MemoryPopup } from './MemoryPopup'
import { createCategoryIcon } from '../../utils/mapIcons'
import type { Marker as LeafletMarker } from 'leaflet'
import { useMapStore } from '../../stores/mapStore'

interface MemoryPinProps {
  memory: Memory
}

const FOCUS_ZOOM = 13

export function MemoryPin({ memory }: MemoryPinProps) {
  const map = useMap()
  const markerRef = useRef<LeafletMarker>(null)

  const isActive = useMapStore((state) => state.activeMemoryId === memory.id)
  const setActiveMemoryId = useMapStore((state) => state.setActiveMemoryId)

  const icon = useMemo(()=> createCategoryIcon(memory.category, isActive), [memory.category, isActive])


  useEffect(()=>{
    const marker = markerRef.current
    if (!isActive || !marker) return

    if (marker.isPopupOpen()) return

    function handleMoveEnd(){
      marker?.openPopup()
    }

    map.once('moveend', handleMoveEnd)
    map.flyTo([memory.lat, memory.lng], Math.max(map.getZoom(), FOCUS_ZOOM))

    return () => {
      map.off('moveend', handleMoveEnd)
    }
  }, [isActive, map, memory.lat, memory.lng])

  return (
    <Marker ref={markerRef} position={[memory.lat, memory.lng]} icon={icon} eventHandlers={{
        popupopen: () => setActiveMemoryId(memory.id),
        popupclose: () => {
          // открытие другого попапа закрывает этот: не сбрасываем чужой выбор.
          // getState — значение в момент события, а не в момент последнего рендера
          if (useMapStore.getState().activeMemoryId === memory.id) {
            setActiveMemoryId(null)
          }
        },
      }}>
      <Popup>
        <MemoryPopup memory={memory} />
      </Popup>
    </Marker>
  )
}
