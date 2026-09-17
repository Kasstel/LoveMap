import { useState } from "react"
import { useAuthStore } from "../../stores/authStore"
import { useMemoryStore } from "../../stores/memoryStore"
import { Counter } from "./Counter"
import { InviteButton } from "./InviteButton"
import { DeckleEdge } from "./DeckleEdge"

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
    // деккельный край только снизу — будто страница лежит на карте;
    // relative z-10, чтобы рваный край перекрывал карту, а не прятался под ней
    <DeckleEdge edges={['bottom']} className="relative z-10 border-b border-line bg-surface">
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        {/* min-w-0 + truncate: длинные имена обрежутся многоточием, а не растолкают кнопки */}
        <div className="min-w-0">
          <div className="font-display text-lg text-primary">Love Map</div>
          {couple && (
            <div className="truncate text-sm text-ink-muted">
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
            className="rounded-control border border-line px-3 py-1 text-sm text-ink-soft hover:bg-tint disabled:opacity-50"
          >
            {signingOut ? 'Выходим...' : 'Выйти'}
          </button>
        </div>
      </header>
    </DeckleEdge>
  )
}
