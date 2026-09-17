import { useCounter } from "../../hooks/useCounter"
import { useMemoryStore } from "../../stores/memoryStore"
import { pluralizeDays } from "../../utils/dates"

export const Counter = ()=>{
  const couple = useMemoryStore((state)=> state.couple)

  const counter = useCounter(couple?.start_date ?? null)
  if (counter === null) return null
  const couple_time = pluralizeDays(counter)
  return(
    <div className="flex items-baseline gap-1">
      <span className="font-hand text-2xl leading-none text-ink">{counter}</span>
      <span className="text-xs text-ink-subtle">{couple_time}</span>
    </div>
  )
}