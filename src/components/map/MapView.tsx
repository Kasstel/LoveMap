import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useMemoryStore } from '../../stores/memoryStore'
import { MemoryPin } from './MemoryPin'
import { AddingModeHandler } from './AddingModeHandler'
import { NewPinMarker } from './NewPinMarker'
import { TILE_LAYER } from '../../utils/tiles'
import { MapGrainPane } from './MapGrainPane'

export const MapView = ()=>{
  const memories = useMemoryStore((state)=> state.memories)

  return(
    <MapContainer center={[55.7558, 37.6173]} zoom={5} className="h-full w-full rounded-card">
      {memories.map((memory)=> <MemoryPin key={memory.id} memory={memory}/>)}
      <TileLayer
        url={TILE_LAYER.url}
        attribution={TILE_LAYER.attribution}
        maxZoom={TILE_LAYER.maxZoom}
      />
      <MapGrainPane/>
      <AddingModeHandler/>
      <NewPinMarker/>
    </MapContainer>)
}
