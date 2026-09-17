
// "2025-02-14" → Date в местном времени (new Date("2025-02-14") дал бы полночь по UTC)
export function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month-1, day)
}

export function daysSince(startDate: string): number {
  const start = parseLocalDate(startDate)

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const MS_IN_DAY = 1000 * 60 * 60 * 24
  return Math.round((today.getTime() - start.getTime()) / MS_IN_DAY)

}

const pluralRules = new Intl.PluralRules('ru-RU')

export function pluralizeDays(count: number): string {
  const form = pluralRules.select(count)
  if (form==='one'){
    return 'день'
  }
  else if (form==='few'){
    return 'дня'
  }
  else{
    return 'дней'
  }
}

const dateFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

// "2025-02-14" → "14 февраля 2025 г."
export function formatDate(value: string): string {
  return dateFormatter.format(parseLocalDate(value))
}

// Date → "2026-09-15" в местном времени, формат для <input type="date">.
// toISOString() не подходит: он отдаёт дату по UTC, и в Москве до 03:00 это ещё вчера
export function toDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
