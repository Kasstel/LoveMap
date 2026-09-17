import { InkFrame } from "./InkFrame"

/**
 * Рамка паспарту по периметру страницы: двойная обводка и угловые росчерки.
 * Чисто декоративная — pointer-events none, чтобы не перехватывать клики по карте.
 */
export function PassePartout() {
  return (
    <div className="pointer-events-none absolute inset-2 z-20 rounded-[6px] border border-on-velvet-muted/55">
      <div className="absolute inset-[5px] rounded-[4px] border-[0.5px] border-on-velvet-muted/35" />

      {/* один и тот же росчерк, зеркалим трансформами под остальные три угла */}
      <InkFrame variant="flourish" className="absolute -top-[-4px] -left-[-4px] h-[34px] w-[46px] text-danger-soft" />
      <InkFrame variant="flourish" className="absolute -top-[-4px] -right-[-4px] h-[34px] w-[46px] -scale-x-100 text-danger-soft" />
      <InkFrame variant="flourish" className="absolute -bottom-[-4px] -left-[-4px] h-[34px] w-[46px] -scale-y-100 text-danger-soft" />
      <InkFrame variant="flourish" className="absolute -right-[-4px] -bottom-[-4px] h-[34px] w-[46px] -scale-x-100 -scale-y-100 text-danger-soft" />
    </div>
  )
}
