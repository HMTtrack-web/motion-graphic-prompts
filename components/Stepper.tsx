'use client'

import { usePathname } from 'next/navigation'
import { useProjectStore } from '@/store/useProjectStore'

const STEPS = [
  { num: 1, label: 'Topic', short: 'Topic' },
  { num: 2, label: 'Script', short: 'Script' },
  { num: 3, label: 'Background', short: 'Theme' },
  { num: 4, label: 'Image Prompts', short: 'Images' },
  { num: 5, label: 'Motion Prompts', short: 'Motion' },
]

function getStageFromPath(pathname: string): number {
  const match = pathname.match(/\/stage\/(\d)/)
  return match ? parseInt(match[1]) : 0
}

export default function Stepper({ sticky = true }: { sticky?: boolean } = {}) {
  const pathname = usePathname()
  const current_stage = useProjectStore((s) => s.current_stage)
  const activeStep = getStageFromPath(pathname) || current_stage

  return (
    <div className={`${sticky ? 'sticky top-0 z-50' : 'relative z-40'} bg-white border-b border-[#E0E0E0] shadow-sm`}>
      <div className="max-w-[860px] mx-auto px-4 py-3">
        {/* Mobile view */}
        <div className="flex items-center justify-between sm:hidden">
          <span className="text-xs font-semibold text-[#555555] uppercase tracking-wider">
            Step {activeStep} of 5
          </span>
          <span className="text-sm font-bold text-[#C62828]">
            {STEPS[activeStep - 1]?.label}
          </span>
          <div className="flex gap-1">
            {STEPS.map((step) => (
              <div
                key={step.num}
                className={`h-1.5 w-5 rounded-full transition-colors ${
                  step.num < activeStep
                    ? 'bg-[#C62828]'
                    : step.num === activeStep
                    ? 'bg-[#C62828]'
                    : 'bg-[#E0E0E0]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Desktop view */}
        <div className="hidden sm:flex items-center justify-between">
          {STEPS.map((step, index) => {
            const isCompleted = step.num < activeStep
            const isActive = step.num === activeStep
            const isInactive = step.num > activeStep

            return (
              <div key={step.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                      ${isCompleted ? 'bg-[#C62828] text-white' : ''}
                      ${isActive ? 'bg-[#C62828] text-white ring-4 ring-[#FFEBEE]' : ''}
                      ${isInactive ? 'bg-[#E0E0E0] text-[#BDBDBD]' : ''}
                    `}
                  >
                    {isCompleted ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      step.num
                    )}
                  </div>
                  <span
                    className={`
                      mt-1 text-[11px] font-semibold uppercase tracking-wide
                      ${isActive ? 'text-[#C62828]' : isCompleted ? 'text-[#C62828]' : 'text-[#BDBDBD]'}
                    `}
                  >
                    {step.short}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 transition-colors ${
                      step.num < activeStep ? 'bg-[#C62828]' : 'bg-[#E0E0E0]'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
