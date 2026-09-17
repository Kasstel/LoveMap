import { useState } from "react"
import { useAuthStore } from "../../stores/authStore"
import { useMemoryStore } from "../../stores/memoryStore"
import { Counter } from "./Counter"
import { InviteButton } from "./InviteButton"

export const Header = ()=>{

  const couple = useMemoryStore((state) => state.couple)
  const signOut = useAuthStore((state) => state.signOut)

  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    try {
      // после выхода onAuthStateChange обнулит user, и App сам уведёт на /auth
      await signOut()
    } catch (error) {
      console.error('Не получилось выйти:', error)
      setSigningOut(false)
    }
  }

  return(
    // <header>, а не фрагмент: в MainLayout родитель — flex-col,
    // и без обёртки каждый кусок шапки встал бы отдельной строкой
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft bg-surface px-4 py-3">
      {/* min-w-0 + truncate: длинные имена обрежутся многоточием, а не растолкают кнопки */}
      <div className="min-w-0">
        <div className="font-display text-lg font-semibold text-primary">Love Map</div>
        {couple && (
          <div className="truncate text-sm text-ink-subtle">
            {couple.partner_1} & {couple.partner_2}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Counter/>
        <InviteButton/>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="rounded-control border border-line px-3 py-1 text-sm text-primary hover:bg-tint disabled:opacity-50"
        >
          {signingOut ? 'Выходим...' : 'Выйти'}
        </button>
      </div>
    </header>
  )
}
