import { useState } from "react"
import { useAuthStore } from "../../stores/authStore"
import { useMemoryStore } from "../../stores/memoryStore"
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
    // шапка лежит прямо на бархате: ни фона, ни границы — их роль играет рамка паспарту
    <header className="flex flex-wrap items-center justify-between gap-3 pb-6">
      {/* min-w-0 + truncate: длинные имена обрежутся многоточием, а не растолкают кнопки */}
      <div className="min-w-0">
        <div className="font-display text-xl text-on-velvet">Love Map</div>
        {couple && (
          <div className="truncate font-hand text-lg text-on-velvet-muted">
            {couple.partner_1} <span className="text-danger-soft">и</span> {couple.partner_2}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <InviteButton/>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="rounded-control border border-on-velvet-muted/50 px-3 py-1 text-sm text-on-velvet-muted hover:border-on-velvet-muted disabled:opacity-50"
        >
          {signingOut ? 'Выходим...' : 'Выйти'}
        </button>
      </div>
    </header>
  )
}
