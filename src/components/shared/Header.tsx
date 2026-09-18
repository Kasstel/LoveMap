import { useState } from "react"
import { useAuthStore } from "../../stores/authStore"
import { useMemoryStore } from "../../stores/memoryStore"
import { InviteButton } from "./InviteButton"
import { PairedTitle } from "./PairedTitle"
import { PlaylistSlot } from "./PlaylistSlot"

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
    <header className="flex flex-wrap items-center justify-between gap-3 pb-1">
      {/* min-w-0 + truncate: длинные имена обрежутся многоточием, а не растолкают кнопки */}
      <div className="min-w-0 shrink">
    {couple ? (
      <PairedTitle
        primary="Карта воспоминаний"
        secondary={`${couple.partner_1} & ${couple.partner_2}`}
        color="var(--color-on-velvet)"
        primarySize={64}
        secondarySize={72}
        overlap={18}
        shiftX={70}
        knockout={3.5}
        className="w-full max-w-[320px]"
      />
    ) : (
      <div className="font-display text-xl text-on-velvet">Love Map</div>
    )}

      </div>
      
      {/* BASE_URL уже со слешем на конце: в dev это "/", на Pages — "/LoveMap/" */}
      <PlaylistSlot src={`${import.meta.env.BASE_URL}playlist/theme.mp3`} variant="velvet"/>

      <div className="flex shrink-0 items-center gap-2">
        
          <p className="font-display text-s text-on-velvet">Код для второй половинки:</p>
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
