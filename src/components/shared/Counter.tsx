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
    <div className="flex items-baseline justify-end gap-1.5">
      <PairedTitle primary={`${counter} ${couple_time} вместе`}
        secondary={`и ни одного, который хотелось бы прожить иначе`}
        color="var(--color-on-velvet)"
        primarySize={64}
        secondarySize={72}
        overlap={18}
        shiftX={70}
        knockout={3.5}
        className="w-full max-w-[400px]"/>
    </div>
  )
}