import type { ButtonHTMLAttributes, ReactNode } from "react"
import { InkFrame } from "./InkFrame"

interface VelvetButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

/**
 * Основная кнопка на бархатных экранах: без плашки, тот же цвет, что у полей формы
 * (on-velvet-muted, не акцентный primary — кнопка не должна спорить с полями по цвету).
 * Вместо заливки — округлая обводка InkFrame, будто текст обвели от руки.
 */
export function VelvetButton({ children, className, ...buttonProps }: VelvetButtonProps) {
  return (
    <button
      {...buttonProps}
      className={`group relative block w-full bg-transparent px-4 py-3 text-center text-sm font-medium text-on-velvet-muted transition-opacity disabled:opacity-40 ${className ?? ''}`}
    >
      <InkFrame
        variant="loop"
        className="pointer-events-none absolute inset-0 h-full w-full text-on-velvet-muted/70 transition-colors group-hover:text-on-velvet-muted"
      />
      <span className="relative">{children}</span>
    </button>
  )
}
