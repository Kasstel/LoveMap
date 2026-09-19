import { createContext, useContext } from 'react'

/**
 * Мобильный ли экран — для компонентов, где одними CSS-классами не обойтись:
 * другой компонент (bottom sheet вместо aside), другой набор пропсов Leaflet,
 * портал в другое место. Там, где разница только в стилях, контекст не нужен —
 * хватит вариантов desktop: / max-desktop: в className.
 *
 * Провайдер один, в MainLayout. Почему контекст, а не вызов useIsMobileViewport
 * в каждом компоненте: одно значение на всё дерево в пределах рендера
 * (включая порталы — они внутри дерева React) и одна точка, где его можно подменить.
 *
 * Значение по умолчанию — false: вне провайдера (AuthPage, WelcomeScreen)
 * компонент ведёт себя как на десктопе.
 */
export const ViewportContext = createContext<boolean>(false)

export function useIsMobile(): boolean {
  return useContext(ViewportContext)
}
