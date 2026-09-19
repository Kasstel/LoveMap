import { useEffect, useRef, useState } from "react"
import { useAuthStore } from "../../stores/authStore"
import { useMemoryStore } from "../../stores/memoryStore"
import { InviteButton } from "./InviteButton"
import { PairedTitle } from "./PairedTitle"
import { PlaylistSlot } from "./PlaylistSlot"
import { Counter } from "./Counter"

export const Header = ()=>{

  const couple = useMemoryStore((state) => state.couple)
  const signOut = useAuthStore((state) => state.signOut)

  const [signingOut, setSigningOut] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  // обёртка кнопки и выпадашки: по ней отличаем клик внутри меню от клика мимо
  const menuRef = useRef<HTMLDivElement>(null)

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

  // закрытие меню: Escape и тап мимо. Слушатели вешаем только пока меню открыто
  useEffect(() => {
    if (!menuOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    // pointerdown, а не click: на карте Leaflet свои обработчики, и до click
    // дело может не дойти — меню останется висеть
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  return(
    // шапка лежит прямо на бархате: ни фона, ни границы — их роль играет рамка паспарту
    <header className="pb-1">
      {/* mt/mr — только телефон: уводит логотип и бургер от углового росчерка и рамки PassePartout.
          Рамка на inset-2 = 8px от края экрана, росчерк внутри нее ещё +4px и высотой 34px —
          то есть заканчивается на 46px от края. Паддинг MainLayout на телефоне даёт 16px,
          mt-10 добавляет ещё 40px: итого 56px, запас 10px. mr сужает строку справа — бургер,
          прижатый justify-between к правому краю, отходит от двойной линии рамки на те же 8-12px,
          а заодно и от такого же росчерка в правом углу */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-6 mr-3 desktop:mt-0 desktop:mr-0">
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
          // на телефоне логотип ужимаем, иначе рядом не останется места под бургер.
          // сам SVG тянется по ширине, поэтому достаточно ограничить max-w
          className="w-full max-w-[200px] desktop:max-w-[320px]"
        />
      ) : (
        <div className="font-display text-xl text-on-velvet">Love Map</div>
      )}

        </div>

        {/* плейлист ~300px в ширину — на телефоне в строку не помещается и уезжает в меню.
            Обёртка, а не класс на самом PlaylistSlot: у него в корне свой flex, и hidden с ним конфликтует */}
        <div className="hidden desktop:block">
          {/* BASE_URL уже со слешем на конце: в dev это "/", на Pages — "/LoveMap/" */}
          <PlaylistSlot src={`${import.meta.env.BASE_URL}playlist/theme.mp3`} variant="velvet"/>
        </div>

        <div className="hidden shrink-0 items-center gap-2 desktop:flex">

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

        {/* бургер и его меню — только на телефоне */}
        <div ref={menuRef} className="relative shrink-0 desktop:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
            className="rounded-control border border-on-velvet-muted/50 p-2 text-on-velvet-muted hover:border-on-velvet-muted"
          >
            {/* три чернильных штриха; при открытом меню средний убираем — видно, что состояние другое */}
            <svg width="22" height="16" viewBox="0 0 22 16" aria-hidden="true">
              <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none">
                <path d="M1.5 2.2 H20.5" />
                {!menuOpen && <path d="M1.5 8 H20.5" />}
                <path d="M1.5 13.8 H20.5" />
              </g>
            </svg>
          </button>

          {menuOpen && (
            // меню бархатное, а не бумажное: всё внутри покрашено под тёмный фон
            // и на бумаге просто пропало бы.
            // z-[1050]: выпадает поверх карты, а панели Leaflet сидят на z-index 400…1000
            // в общем контексте наложения. Выше листа снизу (1000), ниже модалки формы (1100)
            <div className="absolute right-0 top-full z-[1050] mt-2 flex w-64 flex-col items-stretch gap-3 rounded-panel border border-on-velvet-muted/30 bg-velvet-deep p-4 shadow-modal">
              <div className="flex flex-col gap-1.5">
                <p className="font-display text-sm text-on-velvet">Код для второй половинки:</p>
                <InviteButton/>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="rounded-control border border-on-velvet-muted/50 px-3 py-1 text-sm text-on-velvet-muted hover:border-on-velvet-muted disabled:opacity-50"
              >
                {signingOut ? 'Выходим...' : 'Выйти'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* строки под логотипом — только телефон: на десктопе счётчик живёт под картой,
          а плейлист стоит в той же строке, что логотип */}
      <div className="mt-2 flex justify-center desktop:hidden">
        <Counter/>
      </div>
      <div className="mt-1 mb-3 flex justify-center desktop:hidden desktop:mb-0">
        <PlaylistSlot src={`${import.meta.env.BASE_URL}playlist/theme.mp3`} variant="velvet" className="scale-[0.85]"/>
      </div>
    </header>
  )
}
