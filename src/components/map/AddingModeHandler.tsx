import { useMapEvents } from "react-leaflet";
import { useMapStore } from "../../stores/mapStore";
import { useEffect } from "react";

export function AddingModeHandler():null{
  const isAddingMode = useMapStore((state)=> state.isAddingMode)
  const setAddingMode = useMapStore((state)=> state.setAddingMode)
  const setNewPinCoords = useMapStore((state)=> state.setNewPinCoords)

  const map = useMapEvents({
    click(event) {
      if (!isAddingMode) return

      setNewPinCoords({lat: event.latlng.lat, lng: event.latlng.lng})
      setAddingMode(false)
    }
  })

  useEffect(() => {
  const container = map.getContainer()
  container.classList.toggle('leaflet-crosshair', isAddingMode)

  return () => {
    container.classList.remove('leaflet-crosshair')
  }
}, [map, isAddingMode])

return null

}