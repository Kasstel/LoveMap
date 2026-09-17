import type { InputHTMLAttributes } from "react"
import { InkFrame } from "./InkFrame"

interface VelvetFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  /** класс на сам input — для выравнивания и моноширинного кода */
  inputClassName?: string
}

/**
 * Поле ввода для бархатных экранов: прозрачное, без плашки,
 * вместо нижней границы — рисованный росчерк InkFrame, он же реагирует на фокус.
 *
 * peer/peer-focus: подчёркивание — сосед input'а, поэтому цвет меняется без состояния в React.
 * color-scheme: dark нужен полям с нативным пикером (date) — иначе иконка календаря
 * остаётся тёмной и пропадает на бордовом.
 */
export function VelvetField({ label, inputClassName, ...inputProps }: VelvetFieldProps) {
  return (
    <label className="block">
      <span className="block text-sm text-on-velvet-muted">{label}</span>
      <div className="relative">
        <input
          {...inputProps}
          className={`peer w-full bg-transparent px-1 pt-1 pb-0.5 text-on-velvet placeholder:text-on-velvet-muted/50 focus:outline-none [color-scheme:dark] ${inputClassName ?? ''}`}
        />
        <InkFrame
          variant="underline"
          className="block h-3 w-full text-on-velvet-muted/55 transition-colors peer-focus:text-danger-soft"
        />
      </div>
    </label>
  )
}
