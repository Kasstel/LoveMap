import { useEffect, useRef, useState } from 'react'

interface PlaylistSlotProps {
  /** Путь к аудиофайлу. Сейчас — файл из public/, позже URL из Supabase Storage. */
  src: string
  variant?: 'velvet' | 'paper'
  className?: string
}

const VINYL_CX = 22
const VINYL_CY = 22
const VINYL_R = 25

// Ниточка: выходит из-под пластинки и слегка провисает вправо, как настоящая нить
const THREAD_PATH = 'M48,22 C70,15 96,29 124,22 C150,16 172,26 200,21'

/**
 * Плейлист в хедере: чернильная пластинка крутится, пока играет,
 * прогресс трека разматывается по ниточке (stroke-dashoffset, как в InkLoader).
 *
 * Вращение — через animation-play-state: паузa замирает на текущем угле,
 * а не отпрыгивает в ноль (что было бы при включении/выключении самой анимации).
 *
 * Прогресс — через requestAnimationFrame, а не событие timeupdate:
 * последнее срабатывает ~4 раза в секунду, и нить росла бы рывками.
 *
 * Автозапуск со звуком блокируется браузерами — пластинка стартует
 * неподвижной, это её нормальное состояние.
 */
export function PlaylistSlot({ src, variant = 'velvet', className }: PlaylistSlotProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const threadRef = useRef<SVGPathElement>(null)
  const frameRef = useRef<number | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(0.6)
  const [threadLength, setThreadLength] = useState(0)

  const inkColor = variant === 'velvet' ? 'var(--color-on-velvet)' : 'var(--color-ink)'
  const mutedColor =
    variant === 'velvet' ? 'var(--color-on-velvet-muted)' : 'var(--color-ink-subtle)'
  const accentColor =
    variant === 'velvet' ? 'var(--color-danger-soft)' : 'var(--color-primary)'

  // Длина нити для dasharray
  useEffect(() => {
    if (threadRef.current) setThreadLength(threadRef.current.getTotalLength())
  }, [])

  // Громкость применяется к элементу напрямую, минуя ререндер
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  // Плавный прогресс
  useEffect(() => {
    if (!isPlaying) {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
      return
    }
    const tick = () => {
      const audio = audioRef.current
      if (audio && audio.duration > 0) {
        setProgress(audio.currentTime / audio.duration)
      }
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    }
  }, [isPlaying])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      // play() возвращает промис и может быть отклонён политикой автозапуска
      audio.play().then(
        () => setIsPlaying(true),
        () => setIsPlaying(false)
      )
    }
  }

  // Перемотка: нить идёт слева направо, доля по X — достаточная точность
  const seek = (event: React.MouseEvent<SVGRectElement>) => {
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    audio.currentTime = ratio * audio.duration
    setProgress(ratio)
  }

  const dashOffset = threadLength * (1 - progress)

  return (
    <div className={`flex items-center gap-3 ${className ?? ''}`}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onEnded={() => {
          setIsPlaying(false)
          setProgress(0)
        }}
      />

      <svg
        viewBox="0 0 202 44"
        className="h-11 w-[230px] overflow-visible"
        role="group"
        aria-label="Плейлист пары"
      >
        {/* Пластинка */}
        <g
          className="playlist-vinyl"
          style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
          onClick={toggle}
        >
          <circle
            cx={VINYL_CX}
            cy={VINYL_CY}
            r={VINYL_R}
            fill="none"
            stroke={inkColor}
            strokeWidth={1.2}
            vectorEffect="non-scaling-stroke"
          />
          <circle
            cx={VINYL_CX}
            cy={VINYL_CY}
            r={16}
            fill="none"
            stroke={mutedColor}
            strokeWidth={0.6}
            vectorEffect="non-scaling-stroke"
          />
          <circle
            cx={VINYL_CX}
            cy={VINYL_CY}
            r={10}
            fill="none"
            stroke={mutedColor}
            strokeWidth={0.6}
            vectorEffect="non-scaling-stroke"
          />
          {/* метка оборота — без неё вращение не читается */}
          <line
            x1={VINYL_CX}
            y1={VINYL_CY - 22}
            x2={VINYL_CX}
            y2={VINYL_CY - 11 }
            stroke={accentColor}
            strokeWidth={1}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <circle cx={VINYL_CX} cy={VINYL_CY} r={3} fill={inkColor} />
          {/* прозрачная зона клика — по всей пластинке, а не только по линиям */}
          <circle cx={VINYL_CX} cy={VINYL_CY} r={VINYL_R} fill="transparent" />
        </g>

        {/* Нить: фон */}
        <path
          ref={threadRef}
          d={THREAD_PATH}
          fill="none"
          stroke={mutedColor}
          strokeWidth={0.8}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {/* Нить: пройденная часть */}
        <path
          d={THREAD_PATH}
          fill="none"
          stroke={accentColor}
          strokeWidth={1.4}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          style={{
            strokeDasharray: threadLength || 1,
            strokeDashoffset: threadLength ? dashOffset : 1,
          }}
        />
        {/* Узелок на месте текущей позиции */}
        {threadLength > 0 && progress > 0 && (
          <circle
            r={2.4}
            fill={accentColor}
            style={{
              offsetPath: `path('${THREAD_PATH}')`,
              offsetDistance: `${progress * 100}%`,
            }}
          />
        )}

        {/* Зона перемотки */}
        <rect
          x={42}
          y={6}
          width={158}
          height={32}
          fill="transparent"
          className="cursor-pointer"
          onClick={seek}
        />
      </svg>

      {/* Громкость */}
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={(event) => setVolume(Number(event.target.value))}
        aria-label="Громкость"
        className="playlist-volume w-16"
        style={{ accentColor: 'var(--color-primary)' }}
      />

      <style>{`
        .playlist-vinyl {
          cursor: pointer;
          transform-box: fill-box;
          transform-origin: center;
          animation: playlist-spin 4s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .playlist-vinyl { animation: none; }
        }
        @keyframes playlist-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .playlist-volume {
          height: 2px;
          appearance: none;
          background: ${'var(--color-line)'};
          border-radius: 2px;
          cursor: pointer;
        }
        .playlist-volume::-webkit-slider-thumb {
          appearance: none;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: ${'var(--color-line)'};
        }
        .playlist-volume::-moz-range-thumb {
          width: 9px;
          height: 9px;
          border: none;
          border-radius: 50%;
          background: ${'var(--color-primary)'};
        }
      `}</style>
    </div>
  )
}