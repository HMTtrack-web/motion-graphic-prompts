'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useProjectStore } from '@/store/useProjectStore'
import Stepper from '@/components/Stepper'
import LoadingSpinner from '@/components/LoadingSpinner'

function estimateDuration(wordCount: number): string {
  const seconds = Math.round(wordCount / 2.7)
  if (seconds <= 0) return '—'
  return `~${seconds}s video`
}

function getWordCountColor(count: number): string {
  if (count === 0) return 'text-[#BDBDBD]'
  if (count < 35 || count > 90) return 'text-[#C62828]'
  return 'text-[#2E7D32]'
}

export default function Stage2() {
  const router = useRouter()
  const {
    topic, selected_idea, script, setScript,
    setCurrentStage, setLoading,
  } = useProjectStore()

  const [localScript, setLocalScript] = useState(script)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasFetched = useRef(false)

  const wordCount = localScript.trim() === '' ? 0 : localScript.trim().split(/\s+/).filter(Boolean).length

  // Redirect if no idea selected
  useEffect(() => {
    if (!selected_idea) {
      router.replace('/stage/1')
      return
    }
    setCurrentStage(2)
    // Auto-generate script on first load if empty
    if (!script && !hasFetched.current) {
      hasFetched.current = true
      generateScript()
    } else if (script) {
      setLocalScript(script)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Save script to store on change
  useEffect(() => {
    setScript(localScript)
  }, [localScript, setScript])

  const generateScript = useCallback(async () => {
    setGenerating(true)
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/generate/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected_title: selected_idea, original_topic: topic }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Script generation failed')
      setLocalScript(data.script)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Generation failed. Check your API key or try again.')
    } finally {
      setGenerating(false)
      setLoading(false)
    }
  }, [selected_idea, topic, setLoading])

  const handleNext = () => {
    if (wordCount === 0) return
    setCurrentStage(3)
    router.push('/stage/3')
  }

  return (
    <div className="min-h-screen bg-white">
      <Stepper />

      <div className="max-w-[860px] mx-auto px-6 py-10 fade-in">
        {/* Back */}
        <button
          onClick={() => router.push('/stage/1')}
          className="flex items-center gap-1.5 text-[13px] text-[#555555] hover:text-[#111111] mb-6 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Selected idea badge */}
        {selected_idea && (
          <div className="inline-flex items-center gap-2 bg-[#FFEBEE] text-[#C62828] text-[13px] font-semibold px-3 py-1.5 rounded-full mb-6">
            📌 {selected_idea}
          </div>
        )}

        <h1 className="text-[32px] font-bold text-[#111111] mb-2">Your Narration Script</h1>
        <p className="text-[15px] text-[#555555] mb-8">
          Edit freely — every change is auto-saved. Aim for 38–85 words for a 15–30 second video.
        </p>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 bg-[#FFEBEE] border border-[#C62828] border-opacity-40 rounded-xl p-3 flex items-center justify-between">
            <p className="text-[13px] text-[#C62828] font-semibold">{error}</p>
            <button onClick={generateScript} className="text-[12px] font-bold text-[#C62828] hover:underline ml-4">
              Retry
            </button>
          </div>
        )}

        {/* Loading */}
        {generating && (
          <LoadingSpinner message="Writing your script..." />
        )}

        {/* Script Textarea */}
        {!generating && (
          <>
            <div className="relative mb-1">
              <textarea
                value={localScript}
                onChange={(e) => setLocalScript(e.target.value)}
                placeholder="Your script will appear here..."
                className="w-full border-2 border-[#E0E0E0] focus:border-[#C62828] outline-none rounded-xl px-4 py-3 text-[14px] font-mono text-[#111111] placeholder-[#BDBDBD] resize-y transition-colors bg-white min-h-[200px]"
                style={{ minHeight: '200px' }}
              />
              {localScript && (
                <span className="absolute top-3 right-3 text-[11px] font-semibold text-[#BDBDBD] bg-white px-1">
                  ✏️ Editing (auto-saved)
                </span>
              )}
            </div>

            {/* Word count */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className={`text-[13px] font-semibold ${getWordCountColor(wordCount)}`}>
                  {wordCount} words · {estimateDuration(wordCount)}
                </span>
                <span className="text-[12px] text-[#BDBDBD]">
                  Target: 38–85 words (15–30 second video)
                </span>
              </div>
            </div>

            {/* Buttons row */}
            <div className="flex items-center gap-3 mb-8 flex-wrap">
              <button
                onClick={generateScript}
                disabled={generating}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-[#555555] hover:text-[#111111] hover:bg-[#F5F5F5] px-4 py-2.5 rounded-xl transition-colors border border-[#E0E0E0]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M1 4v6h6M23 20v-6h-6" />
                  <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4-4.64 4.36A9 9 0 013.51 15" />
                </svg>
                Regenerate Script
              </button>
            </div>
          </>
        )}

        {/* Navigation */}
        {!generating && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/stage/1')}
              className="flex items-center gap-1.5 text-[14px] font-semibold text-[#555555] hover:text-[#111111] px-4 py-2.5 rounded-xl border border-[#E0E0E0] hover:bg-[#F5F5F5] transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={wordCount === 0}
              className="flex items-center gap-2 bg-[#C62828] hover:bg-[#B71C1C] disabled:bg-[#E0E0E0] disabled:text-[#BDBDBD] disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl transition-all text-[15px]"
            >
              Next: Choose Background
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
