import { divIcon, type DivIcon } from 'leaflet'
import { CATEGORY_MAP, type MemoryCategory } from '../types'

// emoji подставляется в HTML как есть, без экранирования —
// передавать только свои строки, не ввод пользователя
export function createEmojiIcon(emoji: string): DivIcon {
  return divIcon({
    html: `<span style="font-size: 28px; line-height: 32px">${emoji}</span>`,
    className: '',          // иначе Leaflet добавит свой белый квадрат с рамкой
    iconSize: [32, 32],
    iconAnchor: [16, 32],   // какая точка иконки указывает на координату: низ по центру
    popupAnchor: [0, -32],  // попап открывается над иконкой, а не поверх неё
  })
}

/*
  Булавка во viewBox 32×40: головка — окружность с центром (16, 15) и r = 12,
  острие — (16, 36). Силуэты рисуются в сетке 14×14 и сдвигаются так,
  чтобы центр сетки совпал с центром головки, и увеличиваются в 1.15 раза —
  так силуэт занимает головку, но не касается её контура.
*/
const VIEW_W = 32
const VIEW_H = 40
const TIP_X = 16
const TIP_Y = 36
const HEAD_TOP_Y = 3
const GLYPH_SCALE = 1.15
const GLYPH_TRANSFORM = `translate(16 15) scale(${GLYPH_SCALE}) translate(-7 -7)`

const PIN_PATH = 'M16 36C13.5 32.5 4 24.5 4 15A12 12 0 0 1 28 15C28 24.5 18.5 32.5 16 36Z'

// все силуэты — только контуры в сетке 14×14, одна толщина линии
const GLYPHS: Record<MemoryCategory, string> = {
  // два бокала, наклонены навстречу друг другу
  date:
    '<g transform="rotate(8 3.5 12.5)"><path d="M1.2 1.5H5.8V4.2A2.3 2.3 0 0 1 1.2 4.2Z"/><path d="M3.5 6.5V12.5M1.8 12.5H5.2"/></g>'
    + '<g transform="rotate(-8 10.5 12.5)"><path d="M8.2 1.5H12.8V4.2A2.3 2.3 0 0 1 8.2 4.2Z"/><path d="M10.5 6.5V12.5M8.8 12.5H12.2"/></g>',
  // самолёт сверху, нос вверх-вправо
  travel:
    '<path transform="rotate(45 7 7)" d="M7 1C7.8 1 8.2 1.8 8.2 2.8V5.6L13 8.4V9.8L8.2 8.4V11L9.8 12.4V13.4L7 12.6L4.2 13.4V12.4L5.8 11V8.4L1 9.8V8.4L5.8 5.6V2.8C5.8 1.8 6.2 1 7 1Z"/>',
  // тарелка, слева вилка, справа нож
  food:
    '<path d="M3.7 7.5A3.3 3.3 0 1 0 10.3 7.5A3.3 3.3 0 1 0 3.7 7.5Z"/>'
    + '<path d="M0.2 1.5V3.8Q0.2 5.2 1.4 5.2Q2.6 5.2 2.6 3.8V1.5M1.4 5.2V13"/>'
    + '<path d="M11.8 13V1.5Q14 2.8 13.8 7.2H11.8"/>',
  // две ноты под общим ребром
  concert:
    '<path d="M1.7 11A1.8 1.4 0 1 0 5.3 11A1.8 1.4 0 1 0 1.7 11Z"/>'
    + '<path d="M8.7 9.5A1.8 1.4 0 1 0 12.3 9.5A1.8 1.4 0 1 0 8.7 9.5Z"/>'
    + '<path d="M5.3 11V2.5L12.3 1V9.5M5.3 4.8L12.3 3.3"/>',
  // домик с дверью
  home:
    '<path d="M1.5 6.8L7 1.8L12.5 6.8"/>'
    + '<path d="M3 5.6V12.5H11V5.6"/>'
    + '<path d="M5.8 12.5V9H8.2V12.5"/>',
  // две вершины, снежная шапка на большой
  adventure:
    '<path d="M0.8 12.5L5.3 4L8 8.8L9.8 6.3L13.2 12.5Z"/>'
    + '<path d="M3.76 6.9L4.6 7.7L5.4 6.9L6.1 7.6L6.93 6.9"/>',
  // пятиконечная звезда
  milestone:
    '<path d="M7 1.1L8.53 5.2L12.9 5.38L9.47 8.1L10.65 12.32L7 9.9L3.35 12.32L4.53 8.1L1.1 5.38L5.47 5.2Z"/>',
}

// чуть толще прежнего — тонкая линия того же цвета, что заливка, терялась под сепия-фильтром карты
const PIN_STROKE = 1.8
// толщина внутри сетки делится на её масштаб, чтобы на экране вышло те же ~1.55
const GLYPH_STROKE = 1.35

// размеры кратны viewBox с шагом 1.25: острие попадает в целые пиксели (36 и 45), без размытия
const SCALE = 1
const ACTIVE_SCALE = 1.25

// попап открыт только у активного пина, поэтому отступ считаем по крупной булавке —
// он одинаков для обоих размеров и не устаревает, когда иконка меняется при открытии
const POPUP_GAP = 2
const POPUP_ANCHOR_Y = -Math.round((TIP_Y - HEAD_TOP_Y) * ACTIVE_SCALE + POPUP_GAP)

/*
  Классы Tailwind здесь не работают: html вставляет Leaflet мимо React, поэтому всё инлайном.
  Цвет подставляется без экранирования — берётся только из CATEGORY_MAP.
  Толщина задана в единицах viewBox, у активного пина она растёт вместе с ним: 1.6→2 и ~1.55→1.94.
*/
export function createCategoryIcon(category: MemoryCategory, isActive: boolean): DivIcon {
  const color = CATEGORY_MAP[category].color
  const scale = isActive ? ACTIVE_SCALE : SCALE
  const width = VIEW_W * scale
  const height = VIEW_H * scale
  // var() понимает только style, в SVG-атрибуте fill="var(...)" не сработает.
  // обычный пин заливаем цветом категории — сплошная плашка читается на карте лучше контура.
  // обводка — ink, а не тот же цвет: сепия-фильтр карты приглушает всё к одному тону,
  // и тонкая рамка в цвет заливки на нём просто исчезает
  // активный — заливка ink: иначе на фоне ярких плашек категорий он был бы самым тусклым пином
  const pinFill = isActive ? 'var(--color-ink)' : color
  const pinStroke = isActive ? color : 'var(--color-ink)'
  // силуэт всегда surface (кремовый) — на насыщенной заливке (и цветной, и ink) он не потеряется
  const glyphColor = 'var(--color-surface)'

  return divIcon({
    html: `<svg width="${width}" height="${height}" viewBox="0 0 ${VIEW_W} ${VIEW_H}" style="display:block;overflow:visible" aria-hidden="true">`
      + `<path d="${PIN_PATH}" style="fill:${pinFill}" stroke="${pinStroke}" stroke-width="${PIN_STROKE}" stroke-linecap="round" stroke-linejoin="round"/>`
      + `<g transform="${GLYPH_TRANSFORM}" fill="transparent" stroke="${glyphColor}" stroke-width="${GLYPH_STROKE}" stroke-linecap="round" stroke-linejoin="round">`
      + GLYPHS[category]
      + `</g></svg>`,
    className: '',
    iconSize: [width, height],
    iconAnchor: [TIP_X * scale, TIP_Y * scale],
    popupAnchor: [0, POPUP_ANCHOR_Y],
  })
}
