import { useEffect, useState } from 'react'
import { daysSince } from '../utils/dates'

export function useCounter(startDate: string | null): number | null {
  // значение не нужно — setTick только будит компонент в полночь
  const [, setTick] = useState(0)

  useEffect(()=>{
    let timeoutId: ReturnType<typeof setTimeout>
    function plan(){
      const now = new Date()
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      const msUntilMidnight = nextMidnight.getTime() - now.getTime()
      // +1000: таймер может сработать чуть раньше полуночи и посчитать вчерашний день
      timeoutId = setTimeout(()=>{
        setTick((prev)=> prev+1)
        plan()
      }, msUntilMidnight + 1000)
    }
    plan()
    return () => clearTimeout(timeoutId)
  },[])

  if (!startDate) return null
  return daysSince(startDate)
}
