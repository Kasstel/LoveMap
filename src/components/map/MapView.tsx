import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useMemoryStore } from '../../stores/memoryStore'
import { MemoryPin } from './MemoryPin'
import { AddingModeHandler } from './AddingModeHandler'
import { NewPinMarker } from './NewPinMarker'

export const MapView = ()=>{
  const memories = useMemoryStore((state)=> state.memories)

  return(
    <MapContainer center={[55.7558, 37.6173]} zoom={5} className="h-full w-full">
      {memories.map((memory)=> <MemoryPin key={memory.id} memory={memory}/>)}
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <AddingModeHandler/>
      <NewPinMarker/>
    </MapContainer>)
}
