import { supabase } from "../lib/supabase"
import type { CoupleInfo, Memory, MemoryPhoto, NewMemory } from "../types"
import {create} from 'zustand'

// строка memories вместе с вложенными фото из select('*, memory_photos(*)')
type MemoryWithPhotos = Memory & { memory_photos: MemoryPhoto[] }

interface MemoryStore{
  couple: CoupleInfo | null
  memories: Memory[]
  photos: Record<string, MemoryPhoto[]>   // ключ — memoryId
  loading: boolean
  error: string | null

  fetchCouple: ()=> Promise<void>
  setupCouple: (partner1: string, partner2: string, startDate: string)=> Promise<void>
  // присоединиться к паре партнёра по коду приглашения
  joinCouple: (inviteCode: string)=> Promise<void>
  fetchMemories: () => Promise<void>
  fetchPhotos: (memoryId: string)=> Promise<void>

  // возвращает созданное воспоминание (нужен id для загрузки фото) или null при ошибке
  addMemory: (data: NewMemory)=> Promise<Memory | null>
  // возвращает обновлённое воспоминание или null при ошибке
  updateMemory: (id: string, data: Partial<NewMemory>)=> Promise<Memory | null>
  // true — удалено; false — ошибка (текст в error)
  removeMemory: (id: string)=> Promise<boolean>

  // вызывать по одному фото за раз (await в цикле): параллельные вызовы перетрут друг друга
  uploadPhoto: (memoryId: string, file: File)=> Promise<MemoryPhoto | null>
  // true — удалено; false — ошибка (текст в error)
  removePhoto: (photoId: string)=> Promise<boolean>

  subscribeToChanges: ()=> () => void

  // очистить данные пары при выходе, иначе следующий аккаунт на этом устройстве увидит чужие пины
  reset: ()=> void
}

// Pick сохраняет точные типы: без него TS вывел бы memories как never[]
const initialState: Pick<MemoryStore, 'couple' | 'memories' | 'photos' | 'loading' | 'error'> = {
  couple: null,
  memories: [],
  photos: {},
  loading: false,
  error: null,
}

export const useMemoryStore= create<MemoryStore>((set, get)=> ({
  ...initialState,

  fetchCouple: async() => { set({loading: true, error: null})
    try {
      const { data: {user} } = await supabase.auth.getUser()
      if (!user) {
        set({
          loading: false,
          error: 'Пользователь не найден:('
        })
        return
      }


      const {data: member, error} = await supabase.from('couple_members').select('couple_id').eq('user_id', user.id).maybeSingle()
      if (error){
        throw error
      }

      // пары ещё нет — это не ошибка, просто юзер не прошёл setup
      if (!member) {
        set({
          loading: false,
          couple: null
        })
        return
      }

      const {data: couple, error: coupleError} = await supabase.from('couple_info').select('*').eq('id', member.couple_id).single()

      if (coupleError){
        throw coupleError
      }

      set({
        loading: false,
        couple: couple
      })
    }
    catch(error){
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Не получилось найти пару:('
      })
    }

  },

  setupCouple: async (partner1, partner2, startDate) => { set({loading: true, error: null})
    try {
      const { data: {user} } = await supabase.auth.getUser()
      if (!user) {
        set({
          loading: false,
          error: 'Пользователь не найден:('
        })
        return
      }

      const {data: couple, error} = await supabase.from('couple_info').insert({
        partner_1: partner1,
        partner_2: partner2,
        start_date: startDate,
        created_by: user.id
      }).select().single()

      if (error){
        throw error
      }

      // связка user → couple, без неё RLS не пустит к собственным же данным
      const {error: memberError} = await supabase.from('couple_members').insert({
        user_id: user.id,
        couple_id: couple.id
      })

      if (memberError){
        throw memberError
      }

      set({
        loading: false,
        couple: couple
      })
    }
    catch(error){
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Не получилось создать пару:('
      })
    }
  },

  joinCouple: async (inviteCode) => { set({loading: true, error: null})
    try {
      // проверки и вставка — в SQL-функции join_couple: там RLS не мешает найти пару по коду.
      // тексты ошибок («Пара с таким кодом не найдена» и т.д.) приходят оттуда в error.message
      const {data: couple, error} = await supabase.rpc('join_couple', { code: inviteCode })
      if (error){
        throw error
      }

      set({
        loading: false,
        couple: couple
      })
    }
    catch(error){
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Не получилось присоединиться к паре:('
      })
    }
  },

  fetchMemories: async ()=>{ set({loading: true, error: null})
    const coupleId = get().couple?.id
    if (!coupleId) {
      set({
        loading: false,
        error: 'Пара не найдена:('
      })
      return
    }

    try{
      // memory_photos(*) — Supabase подтянет фото каждого воспоминания в том же запросе
      // по внешнему ключу memory_photos.memory_id. Иначе карточки sidebar сделали бы по запросу каждая
      const {data, error} = await supabase
        .from('memories')
        .select('*, memory_photos(*)')
        .eq('couple_id', coupleId)
        .order('date', { ascending: false })
        .order('position', { referencedTable: 'memory_photos', ascending: true })
      if (error){
        throw error
      }

      // каждая строка — воспоминание с массивом своих фото внутри; раскладываем по двум полям стора
      const memories: Memory[] = []
      const photos: Record<string, MemoryPhoto[]> = {}
      for (const row of data as MemoryWithPhotos[]) {
        const { memory_photos: memoryPhotos, ...memory } = row
        memories.push(memory)
        // пустой массив у воспоминания без фото — «загружено, фото нет»:
        // попап и карточка не станут запрашивать их повторно
        photos[memory.id] = memoryPhotos
      }

      set({
        memories: memories,
        photos: photos,
        loading: false
      })
    }
    catch(error){
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Не получилось найти воспоминания:('
      })
    }


  },

  fetchPhotos: async (memoryId) => {
    try {
      const {data, error} = await supabase.from('memory_photos').select('*').eq('memory_id', memoryId).order('position', { ascending: true })
      if (error){
        throw error
      }

      set({
        photos: { ...get().photos, [memoryId]: data }
      })
    }
    catch(error){
      set({
        error: error instanceof Error ? error.message : 'Не получилось загрузить фото:('
      })
    }
  },

  addMemory: async (data) => { set({loading: true, error: null})
    const coupleId = get().couple?.id
    if (!coupleId) {
      set({
        loading: false,
        error: 'Пара не найдена:('
      })
      return null
    }

    try {
      const { data: {user} } = await supabase.auth.getUser()
      if (!user) {
        set({
          loading: false,
          error: 'Пользователь не найден:('
        })
        return null
      }

      const {data: memory, error} = await supabase.from('memories').insert({
        ...data,
        couple_id: coupleId,
        created_by: user.id
      }).select().single()

      if (error){
        throw error
      }

      set({
        memories: [...get().memories, memory].sort((a, b)=> b.date.localeCompare(a.date)),
        loading: false
      })
      return memory
    }
    catch(error){
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Не получилось добавить воспоминание:('
      })
      return null
    }
  },

  updateMemory: async (id, data) => { set({loading: true, error: null})
    try {
      // .single() сам вернёт ошибку, если RLS не дал обновить строку (ноль строк в ответе)
      const {data: memory, error} = await supabase.from('memories').update(data).eq('id', id).select().single()
      if (error){
        throw error
      }

      set({
        // дата могла измениться — пересортировываем, как в addMemory
        memories: get().memories
          .map((item)=> item.id === id ? memory : item)
          .sort((a, b)=> b.date.localeCompare(a.date)),
        loading: false
      })
      return memory
    }
    catch(error){
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Не получилось обновить воспоминание:('
      })
      return null
    }
  },

  removeMemory: async (id) => { set({loading: true, error: null})
    try {
      // строки memory_photos удалятся каскадом, но файлы в Storage — нет, чистим руками
      const {data: photoRows} = await supabase.from('memory_photos').select('storage_path').eq('memory_id', id)
      if (photoRows && photoRows.length > 0){
        await supabase.storage.from('photos').remove(photoRows.map((row)=> row.storage_path))
      }

      // select('id'): если RLS запретит удаление, Supabase не вернёт ошибку, а просто удалит ноль строк.
      // без проверки воспоминание пропало бы из стора и вернулось после перезагрузки
      const {data: deletedRows, error} = await supabase.from('memories').delete().eq('id', id).select('id')
      if (error){
        throw error
      }
      if (!deletedRows || deletedRows.length === 0){
        throw new Error('Воспоминание не найдено или нет прав на удаление:(')
      }

      const photos = { ...get().photos }
      delete photos[id]

      set({
        memories: get().memories.filter((item)=> item.id !== id),
        photos: photos,
        loading: false
      })
      return true
    }
    catch(error){
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Не получилось удалить воспоминание:('
      })
      return false
    }
  },

  uploadPhoto: async (memoryId, file) => { set({error: null})
    try {
      // фото этого воспоминания ещё не в сторе (попап не открывали) —
      // без них position посчитается с нуля и совпадёт с уже существующими
      if (get().photos[memoryId] === undefined){
        await get().fetchPhotos(memoryId)
      }

      const storagePath = `memories/${memoryId}/${crypto.randomUUID()}.jpg`

      const {error: uploadError} = await supabase.storage.from('photos').upload(storagePath, file)
      if (uploadError){
        throw uploadError
      }

      const { data: {publicUrl} } = supabase.storage.from('photos').getPublicUrl(storagePath)

      const currentPhotos = get().photos[memoryId] ?? []

      const {data: photo, error} = await supabase.from('memory_photos').insert({
        memory_id: memoryId,
        url: publicUrl,
        storage_path: storagePath,
        position: currentPhotos.length
      }).select().single()

      if (error){
        // файл уже в Storage, но строки о нём нет — удаляем, иначе он останется в бакете навсегда
        await supabase.storage.from('photos').remove([storagePath])
        throw error
      }

      set({
        photos: { ...get().photos, [memoryId]: [...currentPhotos, photo] }
      })
      return photo
    }
    catch(error){
      set({
        error: error instanceof Error ? error.message : 'Не получилось загрузить фото:('
      })
      return null
    }
  },

  removePhoto: async (photoId) => { set({error: null})
    try {
      const {data: photo, error: selectError} = await supabase.from('memory_photos').select('*').eq('id', photoId).single()
      if (selectError){
        throw selectError
      }

      const {error: storageError} = await supabase.storage.from('photos').remove([photo.storage_path])
      if (storageError){
        throw storageError
      }

      // как в removeMemory: запрещённое RLS удаление не даёт ошибки, а удаляет ноль строк
      const {data: deletedRows, error} = await supabase.from('memory_photos').delete().eq('id', photoId).select('id')
      if (error){
        throw error
      }
      if (!deletedRows || deletedRows.length === 0){
        throw new Error('Фото не найдено или нет прав на удаление:(')
      }

      const memoryPhotos = get().photos[photo.memory_id] ?? []

      set({
        photos: { ...get().photos, [photo.memory_id]: memoryPhotos.filter((item)=> item.id !== photoId) }
      })
      return true
    }
    catch(error){
      set({
        error: error instanceof Error ? error.message : 'Не получилось удалить фото:('
      })
      return false
    }
  },

  subscribeToChanges: () => {
    const coupleId = get().couple?.id
    if (!coupleId) {
      return ()=> {}
    }

    const coupleFilter = `couple_id=eq.${coupleId}`

    const channel = supabase
      .channel(`memories-${coupleId}`)
      .on<Memory>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'memories', filter: coupleFilter },
        (payload) => {
          // своё же добавление уже попало в стор через addMemory — не дублируем
          if (get().memories.some((item)=> item.id === payload.new.id)) {
            return
          }
          set({
            memories: [...get().memories, payload.new].sort((a, b)=> b.date.localeCompare(a.date))
          })
        }
      )
      .on<Memory>(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'memories', filter: coupleFilter },
        (payload) => {
          set({
            memories: get().memories.map((item)=> item.id === payload.new.id ? payload.new : item)
          })
        }
      )
      // Удаления — БЕЗ фильтра. Supabase фильтрует DELETE только при replica identity full,
      // а RLS к удалениям не применяется: с full любой, кто знает id пары, получал бы
      // содержимое наших удалённых воспоминаний. Без full в событии только id строки —
      // приходят и чужие удаления, но это просто UUID, которых у нас нет
      .on<Memory>(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'memories' },
        (payload) => {
          const removedId = payload.old.id
          if (!removedId || !get().memories.some((item)=> item.id === removedId)) {
            return
          }

          // memory_photos удалились в базе каскадом — убираем и их из стора
          const photos = { ...get().photos }
          delete photos[removedId]

          set({
            memories: get().memories.filter((item)=> item.id !== removedId),
            photos: photos
          })
        }
      )
      .subscribe()

    // функция отписки — вызывается в cleanup useEffect
    return ()=> {
      supabase.removeChannel(channel)
    }
  },

  reset: () => set(initialState)
}))
