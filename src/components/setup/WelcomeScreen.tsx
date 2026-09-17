import { useState } from 'react'
import { useMemoryStore } from '../../stores/memoryStore'
import { toDateInputValue } from '../../utils/dates'
import { INVITE_CODE_LENGTH, normalizeInviteCode } from '../../utils/invite'
import { InkFrame } from '../shared/InkFrame'
import { PaperTexture } from '../shared/PaperTexture'
import { VelvetField } from '../shared/VelvetField'
import { VelvetButton } from '../shared/VelvetButton'

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
    <div className="bg-velvet-page relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <PaperTexture variant="velvet" />

      {/* угловые орнаменты: один и тот же рисунок, зеркалим по осям под остальные три угла */}
      <InkFrame variant="corner" className="absolute top-6 left-6 h-16 w-16 text-on-velvet-muted/70" />
      <InkFrame variant="corner" className="absolute top-6 right-6 h-16 w-16 -scale-x-100 text-on-velvet-muted/70" />
      <InkFrame variant="corner" className="absolute bottom-6 left-6 h-16 w-16 -scale-y-100 text-on-velvet-muted/70" />
      <InkFrame variant="corner" className="absolute right-6 bottom-6 h-16 w-16 -scale-x-100 -scale-y-100 text-on-velvet-muted/70" />

      <div className="relative w-full max-w-sm text-center">
        <h1 className="font-display text-3xl text-on-velvet">Добро пожаловать</h1>
        <p className="mt-2 text-sm text-on-velvet-muted">
          {mode === 'create' ? 'Расскажите немного о вашей паре' : 'Введи код, который прислал партнёр'}
        </p>

        {mode === 'create' && (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4 text-left">
            <VelvetField
              label="Первый партнёр"
              type="text"
              required
              value={partner1}
              onChange={(event) => setPartner1(event.target.value)}
              placeholder="Имя"
            />

            <VelvetField
              label="Второй партнёр"
              type="text"
              required
              value={partner2}
              onChange={(event) => setPartner2(event.target.value)}
              placeholder="Имя"
            />

            <VelvetField
              label="Вместе с"
              type="date"
              required
              max={today}
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />

            {visibleError && <p className="text-sm text-danger-soft">{visibleError}</p>}

            <VelvetButton type="submit" className="mt-2" disabled={loading}>
              {loading ? 'Секунду...' : 'Начать'}
            </VelvetButton>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin} className="mt-8 flex flex-col gap-4 text-left">
            <VelvetField
              label="Код от партнёра"
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
              inputClassName="text-center font-mono text-lg tracking-widest"
            />

            {visibleError && <p className="text-sm text-danger-soft">{visibleError}</p>}

            <VelvetButton type="submit" className="mt-2" disabled={loading}>
              {loading ? 'Секунду...' : 'Присоединиться'}
            </VelvetButton>
          </form>
        )}

        <button
          type="button"
          onClick={handleToggleMode}
          disabled={loading}
          className="mt-5 flex w-full flex-col items-center text-sm text-on-velvet-muted disabled:opacity-50"
        >
          <span>{mode === 'create' ? 'У меня есть код от партнёра' : 'Создать новую пару'}</span>
          <InkFrame variant="underline" className="mt-1 h-3 w-52 text-on-velvet-muted" />
        </button>
      </div>
    </div>
  )
}

export default WelcomeScreen
