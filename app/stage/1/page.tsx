'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProjectStore } from '@/store/useProjectStore'
import Stepper from '@/components/Stepper'
import IdeaCard from '@/components/IdeaCard'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function Stage1() {
  const router = useRouter()
  const {
    topic, setTopic,
    selected_idea, setSelectedIdea,
    setScript, setCurrentStage,
    setLoading,
  } = useProjectStore()

  const [localTopic, setLocalTopic] = useState(topic)
  const [ideas, setIdeas] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setLocalError] = useState<string | null>(null)
  const [hasGenerated, setHasGenerated] = useState(false)

  // Scroll reset & restore state on mount
  useEffect(() => {
    window.scrollTo(0, 0)
    setCurrentStage(1)
  }, [setCurrentStage])

  useEffect(() => {
    if (topic && !localTopic) {
      setLocalTopic(topic)
    }
  }, [topic, localTopic])

  const handleGenerate = async () => {
    const trimmed = localTopic.trim()
    if (!trimmed) {
      setLocalError('Please enter a topic first.')
      return
    }
    setLocalError(null)
    setGenerating(true)
    setLoading(true)
    setSelectedIndex(null)
    setSelectedIdea('')
    setScript('') // Clear previous script on new idea generation

    try {
      const res = await fetch('/api/generate/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: trimmed }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to generate ideas')
      setIdeas(data.ideas)
      setHasGenerated(true)
      setTopic(trimmed)
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : 'Generation failed. Check your API key or try again.')
    } finally {
      setGenerating(false)
      setLoading(false)
    }
  }

  const handleSelectIdea = (index: number) => {
    setSelectedIndex(index)
    setSelectedIdea(ideas[index])
  }

  const handleNext = () => {
    if (selectedIndex === null) return
    setCurrentStage(2)
    router.push('/stage/2')
  }

  const wordCount = localTopic.trim().split(/\s+/).filter(Boolean).length

  return (
    <div className="min-h-screen bg-white">
      <Stepper />

      <div className="max-w-[860px] mx-auto px-6 py-10 fade-in">
        {/* Back to home */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-[13px] text-[#555555] hover:text-[#111111] mb-6 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Home
        </button>

        <h1 className="text-[32px] font-bold text-[#111111] mb-2">What is your video about?</h1>
        <p className="text-[15px] text-[#555555] mb-8">
          Describe your topic briefly and we&apos;ll generate 5 viral title ideas for you.
        </p>

        {/* Topic Input */}
        <div className="mb-2">
          <textarea
            value={localTopic}
            onChange={(e) => setLocalTopic(e.target.value)}
            placeholder="e.g. why people procrastinate, the psychology of money, how habits are formed..."
            rows={3}
            className="w-full border-2 border-[#E0E0E0] focus:border-[#C62828] outline-none rounded-xl px-4 py-3 text-[15px] text-[#111111] placeholder-[#BDBDBD] resize-none transition-colors bg-white"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleGenerate()
              }
            }}
          />
        </div>
        <div className="flex items-center justify-between mb-6">
          <p className={`text-[12px] ${wordCount > 10 ? 'text-[#C62828]' : 'text-[#555555]'}`}>
            Keep it short — 3 to 10 words works best &nbsp;·&nbsp;{' '}
            <span className={wordCount > 10 ? 'font-semibold' : ''}>{wordCount} words</span>
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 bg-[#FFEBEE] border border-[#C62828] border-opacity-40 rounded-xl p-3 flex items-center justify-between">
            <p className="text-[13px] text-[#C62828] font-semibold">{error}</p>
            <button
              onClick={handleGenerate}
              className="text-[12px] font-bold text-[#C62828] hover:underline ml-4"
            >
              Retry
            </button>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={generating || !localTopic.trim()}
          className="w-full bg-[#C62828] hover:bg-[#B71C1C] disabled:bg-[#E0E0E0] disabled:text-[#BDBDBD] disabled:cursor-not-allowed text-white font-bold text-[15px] px-6 py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating Ideas...
            </>
          ) : (
            <>
              Generate Ideas
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>

        {/* Loading State */}
        {generating && (
          <div className="mt-6">
            <LoadingSpinner message="Crafting viral ideas for your topic..." />
          </div>
        )}

        {/* Ideas Display */}
        {hasGenerated && !generating && ideas.length > 0 && (
          <div className="mt-10 fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[22px] font-bold text-[#111111]">Choose your angle:</h2>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-[#555555] hover:text-[#111111] hover:bg-[#F5F5F5] px-3 py-1.5 rounded-lg transition-colors border border-[#E0E0E0]"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M1 4v6h6M23 20v-6h-6" />
                  <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4-4.64 4.36A9 9 0 013.51 15" />
                </svg>
                Regenerate Ideas
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 mb-6">
              {ideas.map((idea, index) => (
                <IdeaCard
                  key={index}
                  title={idea}
                  selected={selectedIndex === index}
                  onSelect={() => handleSelectIdea(index)}
                  index={index}
                />
              ))}
            </div>

            {/* Next button */}
            <div className="flex items-center justify-between">
              <p className="text-[13px] text-[#555555]">
                {selectedIndex === null ? 'Select an idea to continue' : ''}
              </p>
              <button
                onClick={handleNext}
                disabled={selectedIndex === null}
                className="flex items-center gap-2 bg-[#C62828] hover:bg-[#B71C1C] disabled:bg-[#E0E0E0] disabled:text-[#BDBDBD] disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl transition-all text-[15px]"
              >
                Next: Generate Script
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
