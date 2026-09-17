import { useState } from 'react'
import { useMemoryStore } from '../../stores/memoryStore'
import { toDateInputValue } from '../../utils/dates'
import { INVITE_CODE_LENGTH, normalizeInviteCode } from '../../utils/invite'

const fieldClassName = 'mt-1 w-full rounded-control border border-line px-3 py-2'

function WelcomeScreen() {
  const [partner1, setPartner1] = useState('')
  const [partner2, setPartner2] = useState('')
  const [startDate, setStartDate] = useState('')
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [inviteCode, setInviteCode] = useState('')
  // error в сторе общий для обеих форм: показываем его только после отправки текущей,
  // иначе ошибка создания пары переедет под поле кода
  const [submitted, setSubmitted] = useState(false)

  const joinCouple = useMemoryStore((state) => state.joinCouple)
  const setupCouple = useMemoryStore((state) => state.setupCouple)
  const loading = useMemoryStore((state) => state.loading)
  const error = useMemoryStore((state) => state.error)

  // "2024-03-15" — формат, который отдаёт <input type="date"> и ждёт колонка date
  const today = toDateInputValue(new Date())
  const visibleError = submitted ? error : null

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    // setupCouple сам пишет error/loading в стор, а при успехе кладёт couple —
    // App увидит пару и переведёт на /map без navigate
    await setupCouple(partner1.trim(), partner2.trim(), startDate)
  }

  async function handleJoin(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    // при успехе — тот же путь: couple в сторе → App переводит на /map
    await joinCouple(inviteCode)
  }

  function handleToggleMode() {
    setMode(mode === 'create' ? 'join' : 'create')
    setSubmitted(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-tint px-4">
      <div className="w-full max-w-sm rounded-panel bg-surface p-8 shadow-panel">
        <h1 className="font-display text-2xl font-semibold text-primary">Добро пожаловать 💕</h1>
        <p className="mt-2 text-sm text-ink-subtle">
          {mode === 'create' ? 'Расскажите немного о вашей паре' : 'Введи код, который прислал партнёр'}
        </p>

        {mode === 'create' && (
          <form onSubmit={handleSubmit} className="mt-6">
            <label className="block text-sm text-ink-muted">
              Первый партнёр
              <input
                type="text"
                required
                value={partner1}
                onChange={(event) => setPartner1(event.target.value)}
                placeholder="Имя"
                className={fieldClassName}
              />
            </label>

            <label className="mt-3 block text-sm text-ink-muted">
              Второй партнёр
              <input
                type="text"
                required
                value={partner2}
                onChange={(event) => setPartner2(event.target.value)}
                placeholder="Имя"
                className={fieldClassName}
              />
            </label>

            <label className="mt-3 block text-sm text-ink-muted">
              Вместе с
              <input
                type="date"
                required
                max={today}
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className={fieldClassName}
              />
            </label>

            {visibleError && <p className="mt-3 text-sm text-danger">{visibleError}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-5 w-full rounded-control bg-primary py-2 text-on-primary disabled:bg-primary-disabled"
            >
              {loading ? 'Секунду...' : 'Начать'}
            </button>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin} className="mt-6">
            <label className="block text-sm text-ink-muted">
              Код от партнёра
              <input
                required
                // minLength: браузер сам скажет «слишком короткий», не отправляя запрос.
                // maxLength не ставим: браузер обрезал бы вставленное сообщение до 8 символов
                // («Присоеди») ещё до onChange, и код из него было бы не достать
                minLength={INVITE_CODE_LENGTH}
                value={inviteCode}
                onChange={(event) => setInviteCode(normalizeInviteCode(event.target.value))}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="K7MQ4XRP"
                className={`${fieldClassName} text-center font-mono text-lg tracking-widest`}
              />
            </label>

            {visibleError && <p className="mt-3 text-sm text-danger">{visibleError}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-5 w-full rounded-control bg-primary py-2 text-on-primary disabled:bg-primary-disabled"
            >
              {loading ? 'Секунду...' : 'Присоединиться'}
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={handleToggleMode}
          disabled={loading}
          className="mt-3 w-full text-sm text-primary-muted hover:text-primary disabled:opacity-50"
        >
          {mode === 'create' ? 'У меня есть код от партнёра' : 'Создать новую пару'}
        </button>
      </div>
    </div>
  )
}

export default WelcomeScreen
