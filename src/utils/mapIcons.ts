import { divIcon, type DivIcon } from 'leaflet'

// emoji подставляется в HTML как есть, без экранирования —
// передавать только свои строки (CATEGORY_MAP, '📍'), не ввод пользователя
export function createEmojiIcon(emoji: string): DivIcon {
  return divIcon({
    html: `<span style="font-size: 28px; line-height: 32px">${emoji}</span>`,
    className: '',          // иначе Leaflet добавит свой белый квадрат с рамкой
    iconSize: [32, 32],
    iconAnchor: [16, 32],   // какая точка иконки указывает на координату: низ по центру
    popupAnchor: [0, -32],  // попап открывается над иконкой, а не поверх неё
  })
}
