import { useCounter } from "../../hooks/useCounter"
import { useMemoryStore } from "../../stores/memoryStore"
import { pluralizeDays } from "../../utils/dates"

export const Counter = ()=>{
  const couple = useMemoryStore((state)=> state.couple)

  const counter = useCounter(couple?.start_date ?? null)
  if (counter === null) return null
  const couple_time = pluralizeDays(counter)
  return(
    // счётчик живёт под картой на бархате — отсюда и цвета
    <div className="flex items-baseline justify-center gap-1.5">
      <span className="font-hand text-3xl leading-none text-on-velvet">{counter}</span>
      <span className="font-hand text-on-velvet-muted">{couple_time} вместе</span>
    </div>
  )
}