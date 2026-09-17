interface EmptyStateProps{
  icon?: string,
  title: string,
  hint?: string
}

export function EmptyState({ icon, title, hint }: EmptyStateProps){
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      {icon && <div className="text-4xl">{icon}</div>}
      <div className="mt-3 text-base font-medium text-ink-soft">{title}</div>
      {hint && <div className="mt-1 text-sm text-ink-subtle">{hint}</div>}
    </div>
  )
}
