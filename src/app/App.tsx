import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useMemoryStore } from '../stores/memoryStore'
import { useMapStore } from '../stores/mapStore'
import AuthPage from '../components/auth/AuthPage'
import WelcomeScreen from '../components/setup/WelcomeScreen'
import MainLayout from '../layouts/MainLayout'
import { PaperTexture } from '../components/shared/PaperTexture'
import { InkLoader, type InkLoaderCouple } from '../components/shared/InkLoader'

function App() {
  const user = useAuthStore((state) => state.user)
  const authLoading = useAuthStore((state) => state.loading)
  const initialize = useAuthStore((state) => state.initialize)

  const couple = useMemoryStore((state) => state.couple)
  const fetchCouple = useMemoryStore((state) => state.fetchCouple)
  const resetMemoryStore = useMemoryStore((state) => state.reset)
  const resetMapStore = useMapStore((state) => state.reset)

  // «для кого уже проверили пару» живёт в сторе: reset при выходе обнуляет метку заодно с couple.
  // Локальный стейт тут не годился — после повторного входа тем же аккаунтом он оставался
  // валидным, couple был уже пуст, и до ответа fetchCouple успевал мелькнуть /setup
  const coupleCheckedFor = useMemoryStore((state) => state.coupleCheckedFor)
  // id, а не объект user: Supabase отдаёт новый объект на каждое обновление токена,
  // и эффект перезапрашивал бы пару без причины
  const userId = user?.id ?? null
  const coupleChecked = userId !== null && coupleCheckedFor === userId

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (!userId) {
      // сюда попадаем при любом выходе: кнопка «Выйти», истёкшая сессия, выход в другой вкладке
      resetMemoryStore()
      resetMapStore()
      return
    }

    fetchCouple()
  }, [userId, fetchCouple, resetMemoryStore, resetMapStore])

  
  // единственный источник правды о том, где пользователь должен находиться
  const target = !user ? '/auth' : !couple ? '/setup' : '/map'

  const coupleData: InkLoaderCouple | null = target === '/map' 
  ? { 
      name1: couple?.partner_1 ?? '', 
      name2: couple?.partner_2 ?? '' 
    } 
  : null;

  if (authLoading || (user && !coupleChecked)) {
    return (
      <div className="bg-velvet-page relative flex min-h-screen items-center justify-center">
        <PaperTexture variant="velvet" />
        <InkLoader variant="velvet" couple={coupleData} size={96} />
      </div>
    )
  }


  return (
    // basename: без него Navigate to="/map" уводит на kasstel.github.io/map, мимо приложения
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route
          path="/auth"
          element={target === '/auth' ? <AuthPage /> : <Navigate to={target} replace />}
        />
        <Route
          path="/setup"
          element={target === '/setup' ? <WelcomeScreen /> : <Navigate to={target} replace />}
        />
        <Route
          path="/map"
          element={target === '/map' ? <MainLayout /> : <Navigate to={target} replace />}
        />
        <Route path="*" element={<Navigate to={target} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
