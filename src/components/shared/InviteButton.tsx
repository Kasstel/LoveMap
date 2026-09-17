import { useState } from 'react'
import { useMemoryStore } from '../../stores/memoryStore'
import { buildInviteMessage } from '../../utils/invite'

const COPIED_VISIBLE_MS = 2000

// на телефоне удобнее системное «Поделиться» (сразу в Telegram/iMessage),
// на компьютере — копирование: окно «Поделиться» в Windows неудобное
function prefersShareSheet(): boolean {
  return 'share' in navigator && window.matchMedia('(pointer: coarse)').matches
}

export function InviteButton() {
  // у пары, загруженной до fix_invite_codes.sql, кода нет — до перезагрузки страницы
  const inviteCode = useMemoryStore((state) => state.couple?.invite_code)
  const [copied, setCopied] = useState(false)

  if (!inviteCode) {
    return null
  }

  const code = inviteCode

  async function handleInvite() {
    // полное сообщение: поле кода на экране партнёра само достанет из него код
    const text = buildInviteMessage(code)

    if (prefersShareSheet()) {
      try {
        await navigator.share({ title: 'Love Map', text })
        return
      } catch (error) {
        // пользователь просто закрыл меню «Поделиться» — это не ошибка
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
        // любая другая ошибка — пробуем скопировать
      }
    }

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), COPIED_VISIBLE_MS)
    } catch {
      // буфер обмена недоступен (запрет браузера) — покажем код, чтобы его можно было выделить вручную
      window.prompt('Скопируй код приглашения:', code)
    }
  }

  return (
    <button
      type="button"
      onClick={handleInvite}
      title="Отправить код партнёру"
      className="rounded-control border border-line px-3 py-1 text-sm text-ink-soft hover:bg-tint"
    >
      {copied ? 'Скопировано' : (
        <span className="font-mono tracking-wider">{code}</span>
      )}
    </button>
  )
}
