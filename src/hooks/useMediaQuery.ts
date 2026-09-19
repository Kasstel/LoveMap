import { useCallback, useSyncExternalStore } from 'react'

// один MediaQueryList на строку запроса: у всех подписчиков одинаковое значение
// в пределах рендера, и браузер не заводит лишние наблюдатели
const lists = new Map<string, MediaQueryList>()

function getList(query: string): MediaQueryList {
  let list = lists.get(query)
  if (!list) {
    list = window.matchMedia(query)
    lists.set(query, list)
  }
  return list
}

/**
 * Подписка на media-запрос.
 *
 * useSyncExternalStore, а не useState + useEffect: значение читается прямо в рендере,
 * поэтому первый кадр уже правильный (вариант с эффектом успевает моргнуть
 * дефолтным значением) и не нарушает правило set-state-in-effect.
 * getServerSnapshot не передаём — приложение рендерится только в браузере.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const list = getList(query)
      list.addEventListener('change', onStoreChange)
      return () => list.removeEventListener('change', onStoreChange)
    },
    [query],
  )

  const getSnapshot = useCallback(() => getList(query).matches, [query])

  return useSyncExternalStore(subscribe, getSnapshot)
}

// значение берём из токена --breakpoint-desktop, чтобы граница жила в одном месте — в index.css.
// Лениво и один раз: getComputedStyle на каждый рендер — это принудительный пересчёт стилей,
// а к моменту первого вызова хука CSS уже подключён
let desktopQuery: string | null = null

function getDesktopQuery(): string {
  if (desktopQuery === null) {
    const breakpoint = getComputedStyle(document.documentElement)
      .getPropertyValue('--breakpoint-desktop')
      .trim()
    // запасное значение — если токен переименуют, приложение не должно молча уехать в мобильную вёрстку
    desktopQuery = `(min-width: ${breakpoint || '48rem'})`
  }
  return desktopQuery
}

/**
 * Мобильный ли сейчас экран. Единственный источник ответа для всего приложения:
 * вызывается один раз в MainLayout, остальные компоненты читают контекст (app/viewport.ts).
 *
 * Считаем от min-width и инвертируем, а не пишем max-width: ровно на 768px
 * вариант desktop: в разметке уже срабатывает, и JS не должен с ним расходиться
 */
export function useIsMobileViewport(): boolean {
  return !useMediaQuery(getDesktopQuery())
}
