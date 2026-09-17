import { Marker } from "react-leaflet";
import { useMapStore } from "../../stores/mapStore";
import { createEmojiIcon } from "../../utils/mapIcons";

const newPinIcon = createEmojiIcon('📍')

export function NewPinMarker(){
  const newPinCoords = useMapStore((state)=> state.newPinCoords)
  if (newPinCoords === null) return null
  
  return (
    <Marker position={[newPinCoords.lat, newPinCoords.lng]} icon={newPinIcon} interactive={false}/>
  )

}