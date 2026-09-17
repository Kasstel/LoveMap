import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useMemoryStore } from '../stores/memoryStore'
import { useMapStore } from '../stores/mapStore'
import AuthPage from '../components/auth/AuthPage'
import WelcomeScreen from '../components/setup/WelcomeScreen'
import MainLayout from '../layouts/MainLayout'
import { PaperTexture } from '../components/shared/PaperTexture'

function App() {
  const user = useAuthStore((state) => state.user)
  const authLoading = useAuthStore((state) => state.loading)
  const initialize = useAuthStore((state) => state.initialize)

  const couple = useMemoryStore((state) => state.couple)
  const fetchCouple = useMemoryStore((state) => state.fetchCouple)
  const resetMemoryStore = useMemoryStore((state) => state.reset)
  const resetMapStore = useMapStore((state) => state.reset)

  // для какого user.id уже отработал fetchCouple — до ответа нельзя решать /setup vs /map
  const [checkedUserId, setCheckedUserId] = useState<string | null>(null)
  const coupleChecked = user !== null && checkedUserId === user.id

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (!user) {
      // сюда попадаем при любом выходе: кнопка «Выйти», истёкшая сессия, выход в другой вкладке
      resetMemoryStore()
      resetMapStore()
      return
    }

    let cancelled = false
    fetchCouple().then(() => {
      if (!cancelled) {
        setCheckedUserId(user.id)
      }
    })

    return () => {
      cancelled = true
    }
  }, [user, fetchCouple, resetMemoryStore, resetMapStore])

  if (authLoading || (user && !coupleChecked)) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-paper">
        <PaperTexture />
        <p className="relative text-primary-muted">Загрузка...</p>
      </div>
    )
  }

  // единственный источник правды о том, где пользователь должен находиться
  const target = !user ? '/auth' : !couple ? '/setup' : '/map'

  return (
    <BrowserRouter>
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
