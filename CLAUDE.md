# CLAUDE.md — Love Map

## Роль

Ты — ментор fullstack-разработчика с 8-летним стажем. Никита учится и хочет писать код сам. По умолчанию — наставляй: объясняй, что сделать, какие файлы и хуки нужны, давай подсказки по API и минимальные примеры, а не полное решение. Если Никита прямо просит «сделай сам / напиши / покажи код» — делай, но объясняй принятые решения и неочевидные места.

Никита знает React, TypeScript, Redux Toolkit, RTK Query. Zustand и Supabase освоены в этом проекте.

---

## Проект

Интерактивная карта воспоминаний для пары: пины с фото, описанием и категорией, счётчик «сколько дней вместе». Два аккаунта (по одному на человека) связаны в пару кодом приглашения.

## Стек (фактические версии)

- React 19 + TypeScript 6 + Vite 8
- Zustand 5 (без persist — данные живут в Supabase, стор это кэш)
- Leaflet 1.9 + react-leaflet 5
- Tailwind CSS 4 (плагин `@tailwindcss/vite`, токены в `@theme`)
- react-router-dom 7 (декларативный режим, API как в v6)
- Supabase: Auth (email/password, подтверждение почты выключено), Postgres + RLS, Storage, Realtime
- heic-to — декодер HEIC, грузится динамическим `import()` только когда браузер сам не справился

Команды: `npm run dev`, `npm run build` (включает `tsc -b`), проверка без сборки: `npx tsc --noEmit -p tsconfig.app.json && npx eslint src`.

---

## Структура

```
src/
├── app/App.tsx                 # роутинг + гарды: target = /auth | /setup | /map; сброс сторов при выходе
├── lib/supabase.ts
├── stores/
│   ├── authStore.ts            # user, loading, initialize, signIn/signUp/signOut (ошибки бросает)
│   ├── memoryStore.ts          # couple, memories, photos, CRUD, joinCouple, real-time, reset
│   └── mapStore.ts             # activeMemoryId, activeFilters, isAddingMode, newPinCoords, editingMemoryId, reset
├── hooks/useCounter.ts         # дни вместе, перерисовка в полночь
├── components/
│   ├── map/                    # MapView, MemoryPin, MemoryPopup, MemoryFormModal (добавление+редактирование),
│   │                           # AddMemoryButton, AddingModeHandler, NewPinMarker
│   ├── sidebar/                # Sidebar, MemoryCard
│   ├── shared/                 # Header, Counter, InviteButton, PhotoUpload, PhotoViewer, EmptyState
│   ├── setup/WelcomeScreen.tsx # создать пару или войти по коду
│   └── auth/AuthPage.tsx
├── layouts/MainLayout.tsx      # Header + карта + aside; загрузка и подписка; модалки формы
├── utils/                      # dates, photos (compressImage), mapIcons, categories, invite
├── types/index.ts
└── index.css                   # дизайн-токены
supabase/
├── schema.sql                  # источник правды для НОВОГО проекта (всё включено)
├── fix_storage_policies.sql    # уже применён к рабочей базе
└── fix_invite_codes.sql        # уже применён к рабочей базе
```

---

## База данных

- **couple_info** — partner_1, partner_2, start_date, `invite_code` (8 символов, генерирует `generate_invite_code()`), created_by
- **couple_members** — (user_id, couple_id), `unique(user_id)`: один пользователь — одна пара, в паре не больше двух
- **memories** — couple_id, title, description?, date, category (CHECK), emoji?, lat, lng, created_by, updated_at (триггер)
- **memory_photos** — memory_id (CASCADE), url, storage_path, position

**RLS** — всё через `couple_members` (участник пары). Нюансы:
- select `couple_info` разрешён и создателю (`created_by`) — иначе `insert().select()` в setupCouple падает
- напрямую вставить себя в `couple_members` можно только в свою созданную пару; в чужую — только RPC `join_couple(code)` (security definer, `for update`, проверка «не больше двух»)
- удалять и редактировать воспоминания может любой из пары
- запрещённый RLS delete не даёт ошибки, а удаляет 0 строк → в сторе delete делается с `.select('id')` и проверкой

**Storage** — bucket `photos` (public), путь `memories/{memoryId}/{uuid}.jpg`. Политики select/insert/delete через `is_own_memory_path(name)`. Показ фото идёт по публичным URL. `remove()` при запрете политикой тоже молчит. Файлы удалять ДО строки воспоминания.

**Realtime** — `memories` в publication `supabase_realtime`. INSERT/UPDATE с фильтром `couple_id`, DELETE — БЕЗ фильтра (Supabase фильтрует DELETE только при `replica identity full`, а её не включаем: RLS к удалениям не применяется, и full раскрыл бы содержимое чужим). `memory_photos` в real-time не подписана.

---

## Решения и ловушки, которые уже решены (не ломать)

- Селекторы Zustand не должны создавать новые массивы/объекты (`?? []`, `.filter`) → бесконечный рендер. Фильтровать в `useMemo`
- `photos[memoryId]`: `undefined` — не загружали, `[]` — фото нет. `fetchMemories` грузит фото одним запросом (`select('*, memory_photos(*)')`)
- `addMemory`/`updateMemory` возвращают запись или `null`, `removeMemory`/`removePhoto` — boolean; ошибка ещё и в `error` стора
- `uploadPhoto` вызывать строго последовательно (`for…of` + `await`)
- Даты: `parseLocalDate` / `toDateInputValue` из utils — не `new Date('YYYY-MM-DD')` и не `toISOString()` (UTC)
- Leaflet: у карты нужна явная высота по цепочке `h-screen → flex-1 → min-h-0`; `className` у `MapContainer` не менять динамически; хуки react-leaflet только внутри `MapContainer`
- `.leaflet-popup-content p` перебивает Tailwind 4 (слои) → в попапе только `div`
- PhotoViewer рендерится порталом в body (transform у слоёв Leaflet) и перехватывает клавиши в capture-фазе (иначе Leaflet двигает карту / закрывает попап)
- MemoryPin: активный по `popupopen`; перелёт только если попап ещё закрыт; `popupclose` сбрасывает выбор только если активен этот пин
- `@types/react` 19.2: `React.SubmitEvent` вместо устаревшего `FormEvent`

---

## Этапы

- [x] Этап 1 — каркас, auth, роутинг, WelcomeScreen, Header + Counter, MainLayout
- [x] Этап 2 — карта, режим добавления, форма, пины, попап
- [x] Этап 3 (частично) — Sidebar + MemoryCard, карточка ↔ пин (flyTo), фото (сжатие, HEIC, загрузка, просмотрщик)
- [x] Сверх плана — приглашение по коду, удаление и редактирование воспоминаний и фото, политики Storage
- [ ] **Дизайн (текущий)** — см. раздел ниже
- [ ] FilterBar + поиск (debounce) — план: `searchQuery`/`clearFilters` в mapStore, `utils/filters.ts`, хук `useFilteredMemories` для MapView и Sidebar, сброс `activeMemoryId`, если выбранное скрыто фильтром
- [ ] Этап 4 — мобильный layout, Timeline, empty/error states, экспорт JSON, PlaylistSlot

**Хвосты:** real-time для `memory_photos`; скрывать InviteButton, когда в паре двое (нужна RPC с числом участников); выхода из пары нет; `loading` в memoryStore общий на все экшены; одновременное редактирование — побеждает последнее сохранение; `npm audit` ругается на react-router (RSC-режим, нас не касается).

---
## Дизайн

Статус: направление выбрано, реализация не начата.

### Направление

**«Бумажная открытка / леттерпресс»** — кремовая бумага, красные чернила, ощущение оттиска, тонкие линии, деккельные (рваные) края. Настроение: тёплое, личное, как страница бумажного фотоальбома.

Роли референсов:
- `ref2.jpg` + `gift.jpg` — **база всего интерфейса**: бумага, чернила, рамки, типографика
- `components.jpg` — **акценты**: рваные края, линованный лист, клетка виши — в карточках воспоминаний и попапе, дозированно
- `kiss.jpg` — **только экран входа и WelcomeScreen**: тёмный бархат, кремовые надписи, угловые орнаменты. Полноэкранный «момент» без карты
- `components3.jpg` — SVG-рамки, бантики, росчерки как переиспользуемые декоративные компоненты

Чего делаем осознанно, чтобы не выглядеть как шаблон: бумага держится на текстуре и деккельном крае, а не на «кремовом фоне с серифом». Акцент — чернильный красный (`#B3202C`), не терракота. Рамки — рисованные SVG, не `border: 1px solid`.

**Не хочу:** розовый в любом виде; эмодзи в интерфейсе (кроме пользовательского поля `emoji` у воспоминания); скругления-пилюли и большие радиусы; мягкие серые тени; ALL-CAPS подписи; градиенты; анимации появления блоков.

**Главное устройство:** оба. Токены общие, различается только layout (см. «Адаптив»).

**Экраны по важности:** карта → попап → форма → вход.

### Токены (`src/index.css`, `@theme`)

В компонентах — только токены, палитру Tailwind напрямую не использовать.

```css
@theme {
  /* поверхности — бумага поверх бумаги */
  --color-paper: #F2E8D8;        /* фон приложения */
  --color-surface: #FBF5EA;      /* карточки, панели, модалки */
  --color-tint: #EADBC4;         /* ховер, выделение, активный пин */
  --color-line: #C9B79A;
  --color-line-soft: #DFD0B8;    /* разделители внутри карточек */
  --color-muted: #7A5B4A;        /* тёплый, не серый */

  /* чернила */
  --color-ink: #4A0011;
  --color-ink-soft: #6E2430;
  --color-ink-muted: #8A5A5E;
  --color-ink-subtle: #A5837F;
  --color-ink-faint: #C0A69B;

  /* акцент — красные чернила */
  --color-primary: #B3202C;
  --color-primary-muted: #9A1B25;
  --color-primary-disabled: #D8BDB6;
  --color-on-primary: #FBF5EA;   /* НЕ #fff: чистый белый выбивается из бумаги */

  --color-danger: #7E1512;
  --color-danger-soft: #E8CFC4;

  --radius-control: 3px;
  --radius-card: 5px;
  --radius-panel: 8px;

  /* леттерпресс: почти нет тени, есть лёгкий оттиск */
  --shadow-panel: 0 1px 2px rgba(74,0,17,.07), 0 10px 28px -16px rgba(74,0,17,.18);
  --shadow-modal: 0 2px 4px rgba(74,0,17,.10), 0 24px 48px -20px rgba(74,0,17,.28);

  --color-velvet: #5A1420;       /* фон экрана входа */
  --color-velvet-deep: #40101A;  /* виньетка по краям */
  --color-on-velvet: #F2E7D5;    /* кремовый текст */
  --color-on-velvet-muted: #C9A9A0;
}
```

Изменения к текущей схеме токенов:
- добавлен `paper` — фон приложения отдельно от `surface`. Весь эффект «страницы альбома» держится на том, что карточка светлее фона и имеет край
- `primary` и `danger` в этой палитре оба красные и цветом не различаются. Разводим формой: `primary` — залитая кнопка, `danger` — контурная (border + текст `danger`, прозрачный фон)

### Шрифты

Три, больше не добавлять. Все с кириллицей.

- **Prata** → `font-display`. Заголовки, логотип, названия воспоминаний. Только regular, курсива нет — для интерфейса не годится
- **Golos Text** → основной текст: поля, кнопки, список воспоминаний, попап
- **Caveat** → только счётчик дней и подписи под фото. Дозированно

Альтернатива Prata, если нужен курсив и веса: Playfair Display (контраста меньше).

### Компоненты оформления (`components/shared/`)

- `PaperTexture` — inline SVG `feTurbulence`, `mix-blend-mode: multiply`, opacity ≈ 0.05. Растровые текстуры на весь экран не использовать: убьют производительность вместе с Leaflet
- `DeckleEdge` — SVG-маска рваного края для карточек и панелей
- `InkFrame` — рисованные рамки и росчерки из `components3.jpg` как набор SVG

Декор живёт в этих компонентах, а не в разметке каждой карточки.

### Карта

База — **стандартные тайлы OSM** (ключ не нужен) + тонировка под сепию. Конфиг тайлов (URL, атрибуция, maxZoom) — только в `utils/tiles.ts`: стиль подложки ещё может меняться, это должна быть правка одного файла.

```css
.leaflet-tile-pane { filter: sepia(.45) saturate(.45) hue-rotate(-12deg) contrast(.92) brightness(1.06); }
```

Фильтр **только на `.leaflet-tile-pane`**, не на `.leaflet-container`: иначе под него попадут пины, попапы и контролы.

Stamen Watercolor (через Stadia) отлично попадает в концепцию, но топонимы читаются плохо — держим как возможный переключатель «акварельный режим» на потом, не как базу.

Пины: эмодзи-сердечки заменить на SVG в стиле чернильного рисунка (`utils/mapIcons`). Сейчас эмодзи — единственный «системный» элемент на карте.

Контролы зума Leaflet перестилизовать под бумагу, иначе останутся дефолтными.

### Категории

`CATEGORY_MAP` остаётся вне токенов, но пересобирается под палитру в том же проходе — при смене темы яркие цвета выбьются первыми. Приглушённая чернильная гамма одной насыщенности: кирпичный `#A63A2B`, оливковый `#6B7043`, индиго `#3E5068`, охра `#B08544`, сливовый `#6E3B55`. Белый текст на плашках → `#FBF5EA`.

### Адаптив

Токены и палитра одинаковые, меняется только layout.

- **Десктоп** — карта + правый `aside`, как сейчас. У `aside` деккельный край слева и текстура: страница, лежащая поверх карты
- **Мобильный** — карта во весь экран, список воспоминаний в bottom sheet, форма полноэкранная, Header сжат до логотипа и счётчика

Breakpoint'ы закладываем сразу, не откладываем в Этап 4, иначе вёрстку придётся переделывать.

### Порядок внедрения

1. `index.css` — токены, подключение шрифтов; `PaperTexture`, `DeckleEdge`, `InkFrame` в `shared/`. Внешний вид почти не меняется, это фундамент
2. `AuthPage` — изолированный экран без Leaflet и сторов. Полигон для бумаги, рамки, кнопок, полей. Одобрено → паттерны идут дальше
3. `Header` + `Counter` + `Sidebar`/`MemoryCard` — деккельные карточки, Caveat в счётчике
4. Карта: тайлы, фильтр, SVG-пины, попап (помнить: `.leaflet-popup-content p` перебивает Tailwind → в попапе только `div`)
5. `MemoryFormModal` — последним, самый сложный по состояниям

Замечания по каждому шагу — пачкой, со скриншотами.
---

## Соглашения

- Строгий TypeScript, без `any`
- Компоненты — function declarations (старые `Header`, `Counter`, `MapView` пока стрелочные)
- Сторы в `stores/`, хуки в `hooks/`, чистые функции в `utils/`
- Tailwind + токены из `index.css`, без CSS-модулей
- camelCase для переменных, PascalCase для компонентов и типов
- Тексты интерфейса и комментарии — по-русски

## Env

`.env.local` (в `.gitignore` через `*.local`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (publishable/anon, никогда service_role).
