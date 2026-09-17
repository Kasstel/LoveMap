import {create} from 'zustand'
import type {Coords, MemoryCategory} from '../types/index'

interface MapStore{
  activeMemoryId: string | null,
  activeFilters: MemoryCategory[],
  isAddingMode: boolean,
  newPinCoords: Coords| null
  // id воспоминания, открытого в форме редактирования; null — форма закрыта
  editingMemoryId: string | null

  setActiveMemoryId: (id: string|null)=>void
  toggleFilter: (category: MemoryCategory) => void
  setAddingMode: (value: boolean) => void
  setNewPinCoords: (coords: Coords | null) => void
  setEditingMemoryId: (id: string | null) => void
  // при выходе: иначе следующий аккаунт получит включённый режим добавления или чужой активный пин
  reset: () => void
}

const initialState: Pick<MapStore, 'activeMemoryId' | 'activeFilters' | 'isAddingMode' | 'newPinCoords' | 'editingMemoryId'> = {
  activeMemoryId: null,
  activeFilters: [],
  isAddingMode: false,
  newPinCoords: null,
  editingMemoryId: null,
}

export const useMapStore = create<MapStore>((set, get)=>({
  ...initialState,

  setActiveMemoryId: (id)=> set({ activeMemoryId: id }),
  toggleFilter: (category)=> { if (get().activeFilters.includes(category)) {
    set({ activeFilters: get().activeFilters.filter((item)=>  item!=category)})
  }
    else {set({activeFilters: [...get().activeFilters, category]})
  }
},
  setAddingMode: (value) => set({isAddingMode: value}),
  setNewPinCoords: (coords) => set({newPinCoords: coords}),
  setEditingMemoryId: (id) => set({editingMemoryId: id}),
  reset: () => set(initialState)
}))

