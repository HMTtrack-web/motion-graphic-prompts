'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProjectStore, useHasHydrated } from '@/store/useProjectStore'

const MIN_WORDS = 20

// Script-flow stepper: Script → Theme → Images → Motion (step 1 active)
const STEPS = ['Script', 'Theme', 'Images', 'Motion']
const ACTIVE_STEP = 1

function countWords(text: string): number {
  const trimmed = text.trim()
  return trimmed === '' ? 0 : trimmed.split(/\s+/).filter(Boolean).length
}

function ScriptStepper() {
  return (
    <div className="sticky top-0 z-50 bg-white border-b border-[#E0E0E0] shadow-sm">
      <div className="max-w-[860px] mx-auto px-4 py-3">
        {/* Mobile view */}
        <div className="flex items-center justify-between sm:hidden">
          <span className="text-xs font-semibold text-[#555555] uppercase tracking-wider">
            Step {ACTIVE_STEP} of {STEPS.length}
          </span>
          <span className="text-sm font-bold text-[#C62828]">{STEPS[ACTIVE_STEP - 1]}</span>
          <div className="flex gap-1">
            {STEPS.map((label, i) => (
              <div
                key={label}
                className={`h-1.5 w-5 rounded-full transition-colors ${
                  i + 1 <= ACTIVE_STEP ? 'bg-[#C62828]' : 'bg-[#E0E0E0]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Desktop view */}
        <div className="hidden sm:flex items-center justify-between">
          {STEPS.map((label, index) => {
            const num = index + 1
            const isActive = num === ACTIVE_STEP
            const isInactive = num > ACTIVE_STEP
            return (
              <div key={label} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      isActive ? 'bg-[#C62828] text-white ring-4 ring-[#FFEBEE]' : ''
                    } ${isInactive ? 'bg-[#E0E0E0] text-[#BDBDBD]' : ''}`}
                  >
                    {num}
                  </div>
                  <span
                    className={`mt-1 text-[11px] font-semibold uppercase tracking-wide ${
                      isActive ? 'text-[#C62828]' : 'text-[#BDBDBD]'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {index < STEPS.length - 1 && <div className="flex-1 h-0.5 mx-2 bg-[#E0E0E0]" />}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function ScriptInputPage() {
  const router = useRouter()
  const {
    script,
    isDirectScript,
    setScript,
    setSelectedIdea,
    setTopic,
    setIsDirectScript,
    setCurrentStage,
    setImagePrompts,
    setMotionPrompts,
  } = useProjectStore()

  const hasHydrated = useHasHydrated()

  // Scroll reset to top on stage mount
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Prefill when returning here via Back from Stage 3 or from session rehydration
  const [localScript, setLocalScript] = useState(isDirectScript ? script : '')

  useEffect(() => {
    if (hasHydrated && isDirectScript && script && !localScript) {
      setLocalScript(script)
    }
  }, [hasHydrated, isDirectScript, script, localScript])

  const wordCount = countWords(localScript)
  const seconds = Math.round(wordCount / 2.7)
  const canProceed = wordCount >= MIN_WORDS

  const getWordCountStatus = () => {
    if (wordCount < MIN_WORDS) {
      return {
        text: 'Too short — add more content',
        className: 'text-[#C62828]',
      }
    }
    if (wordCount <= 100) {
      return {
        text: 'Short video (under 30s)',
        className: 'text-[#666666]',
      }
    }
    if (wordCount <= 300) {
      return {
        text: 'Medium video (30s-2min)',
        className: 'text-[#2E7D32]',
      }
    }
    return {
      text: 'Long video — will generate multiple scenes',
      className: 'text-[#1565C0]',
    }
  }

  const wordStatus = getWordCountStatus()

  // Liquid cursor orb (same effect as homepage)
  useEffect(() => {
    const cursor = document.getElementById('liquid-cursor')
    const move = (e: MouseEvent) => {
      if (cursor) {
        cursor.style.left = e.clientX + 'px'
        cursor.style.top = e.clientY + 'px'
      }
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

  const handleGenerate = () => {
    if (!canProceed) return
    const finalScript = localScript.trim()

    // If the script changed, drop prompts generated from the old one
    if (finalScript !== script) {
      setImagePrompts([])
      setMotionPrompts([])
    }

    setScript(finalScript)
    setSelectedIdea('Custom Script')
    setTopic('User Script')
    setIsDirectScript(true)
    setCurrentStage(3)
    router.push('/stage/3')
  }

  return (
    <div className="relative min-h-screen bg-white">
      <div id="liquid-cursor" />
      <ScriptStepper />

      <div className="relative z-10 max-w-[860px] mx-auto px-4 sm:px-6 py-8 sm:py-10 fade-in">
        {/* Back */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-[13px] text-[#555555] hover:text-[#111111] mb-6 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <h1 className="text-[26px] sm:text-[32px] font-bold text-[#111111] mb-2">Paste Your Script</h1>
        <p className="text-[15px] text-[#555555] mb-6">
          We&apos;ll turn it into scene-by-scene motion graphic prompts
        </p>

        <div className="glass-card hover:!transform-none p-4 sm:p-6">
          <textarea
            value={localScript}
            onChange={(e) => setLocalScript(e.target.value)}
            placeholder={`Paste your narration script here...\ne.g. Everyone is chasing shortcuts. But here is the truth. There is no magic pill. Hard work and daily grind builds success.`}
            className="w-full min-h-[200px] resize-y bg-white/70 border border-[#E0E0E0] focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/15 outline-none rounded-xl px-4 py-3 text-[15px] leading-relaxed text-[#111111] placeholder-[#9E9E9E] transition-colors"
          />

          {/* Live word count */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <p className="text-[13px] font-semibold text-[#111111]">
              {wordCount} words · approx {seconds}s video
            </p>
            <p className={`text-[12.5px] font-semibold ${wordStatus.className}`}>
              {wordStatus.text}
            </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!canProceed}
            className="mt-5 w-full bg-[#C62828] hover:bg-[#B71C1C] disabled:bg-[#E0E0E0] disabled:text-[#BDBDBD] disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl transition-all text-[15px]"
          >
            Generate Prompts →
          </button>
        </div>
      </div>
    </div>
  )
}
