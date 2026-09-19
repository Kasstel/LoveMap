import { useCounter } from "../../hooks/useCounter"
import { useMemoryStore } from "../../stores/memoryStore"
import { pluralizeDays } from "../../utils/dates"
import { PairedTitle } from "./PairedTitle"

export const Counter = ()=>{
  const couple = useMemoryStore((state)=> state.couple)

  const counter = useCounter(couple?.start_date ?? null)
  if (counter === null) return null
  const couple_time = pluralizeDays(counter)
  return(
    // счётчик живёт под картой на бархате — отсюда и цвета
    // на телефоне счётчик стоит по центру второй строки шапки, на десктопе — прижат
    // к правому краю под картой
    <div className="flex w-full items-baseline justify-center gap-1.5 desktop:justify-end">
      <PairedTitle primary={`${counter} ${couple_time} вместе`}
        secondary={`и ни одного, который хотелось бы прожить иначе`}
        color="var(--color-on-velvet)"
        // primarySize задаёт итоговый размер цифр не напрямую: SVG растягивается по ширине
        // контейнера, а высота следует за viewBox. viewBox вытянут длинной строкой-цитатой
        // (secondarySize), поэтому крупная цифра здесь — это высокое соотношение
        // primarySize к ширине viewBox, которую цитата почти не меняет
        primarySize={78}
        secondarySize={72}
        overlap={18}
        shiftX={70}
        knockout={3.5}
        // max-h на телефоне — страховка: если измерение текста в PairedTitle собьётся,
        // SVG с height:auto не сможет вырасти в высоту на всю ширину экрана.
        // 96px с запасом выше реальной высоты (~79px при primarySize=92) — иначе сам
        // cap начинает поджимать картинку сильнее, чем задумано (meet обрезает по high)
        className="max-h-29 w-full max-w-[320px] desktop:max-h-none"/>
    </div>
  )
}