export const INVITE_CODE_LENGTH = 8

// алфавит кода из generate_invite_code() в schema.sql: заглавные без I и O, цифры 2–9.
// \b — код отдельным словом: так из сообщения не выдернется кусок другого слова
const INVITE_CODE_PATTERN = /\b[A-HJ-NP-Z2-9]{8}\b/

export function buildInviteMessage(code: string): string {
  return `Присоединяйся к нашей карте воспоминаний Love Map!\nКод приглашения: ${code}\n${window.location.origin}`
}

// Вставили всё сообщение из мессенджера → достаём из него код.
// Печатают вручную (в том числе строчными) → чистим и обрезаем до длины кода.
export function normalizeInviteCode(value: string): string {
  const codeInText = value.match(INVITE_CODE_PATTERN)
  if (codeInText) {
    return codeInText[0]
  }
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, INVITE_CODE_LENGTH)
}
