'use client'

interface GenerationProgressProps {
  /** Main status line, e.g. "Generating scene 3 of 12..." */
  label: string
  /** Secondary line, e.g. "Found 12 scenes in your script." */
  subLabel?: string
  /** Scenes finished so far */
  current?: number
  total?: number
  /** Unknown-duration phase (e.g. planning) */
  indeterminate?: boolean
  /** All done: bar turns solid and label is shown as a success state */
  complete?: boolean
}

export default function GenerationProgress({
  label,
  subLabel,
  current = 0,
  total = 0,
  indeterminate = false,
  complete = false,
}: GenerationProgressProps) {
  const percent = complete ? 100 : total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0

  return (
    <div className="w-full select-none" role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className={`text-[14px] font-bold ${complete ? 'text-[#2E7D32]' : 'text-[#111111]'}`}>{label}</p>
          {subLabel && <p className="text-[12px] text-[#555555] mt-0.5">{subLabel}</p>}
        </div>
        {!indeterminate && total > 0 && (
          <span className="text-[12px] font-bold text-[#C62828] whitespace-nowrap">
            {percent}%
          </span>
        )}
      </div>

      <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[#FFEBEE]">
        {indeterminate ? (
          <div className="indeterminate-bar h-full w-1/3 rounded-full bg-[#C62828]" />
        ) : (
          <div
            className={`h-full rounded-full ${
              complete ? 'bg-[#2E7D32]' : 'bg-[#C62828]'
            }`}
            style={{
              width: `${percent}%`,
              transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        )}
      </div>
    </div>
  )
}
