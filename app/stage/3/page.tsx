'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProjectStore } from '@/store/useProjectStore'
import Stepper from '@/components/Stepper'
import ThemeCard from '@/components/ThemeCard'
import { PREDEFINED_THEMES, Theme } from '@/types'

export default function Stage3() {
  const router = useRouter()
  const { topic, selected_idea, script, theme, setTheme, setCurrentStage, setImagePrompts, isDirectScript } = useProjectStore()

  const backPath = isDirectScript ? '/script-input' : '/stage/2'
  const handleBack = () => router.push(backPath)

  const [selectedThemeName, setSelectedThemeName] = useState<string>(theme?.name || '')
  const [recommendedTheme, setRecommendedTheme] = useState<string>('')
  const [loadingRecommend, setLoadingRecommend] = useState(false)

  // Custom theme state
  const [customBg, setCustomBg] = useState(theme?.name === 'Custom' ? theme.bg_color : '#ffffff')
  const [customAccent, setCustomAccent] = useState(theme?.name === 'Custom' ? theme.accent_color : '#C62828')
  const [customDescription, setCustomDescription] = useState(theme?.custom_description || '')

  useEffect(() => {
    if (!script) {
      router.replace(backPath)
      return
    }
    setCurrentStage(3)
    // Fetch recommended theme
    setLoadingRecommend(true)
    fetch('/api/generate/recommended-theme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, selected_idea, script }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.theme) setRecommendedTheme(data.theme)
      })
      .catch(() => {})
      .finally(() => setLoadingRecommend(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSelectTheme = (name: string) => {
    setSelectedThemeName(name)
    setImagePrompts([]) // Clear image prompts when theme changes
  }

  const handleNext = () => {
    if (!selectedThemeName) return

    let selectedTheme: Theme
    if (selectedThemeName === 'Custom') {
      selectedTheme = {
        name: 'Custom',
        description: customDescription || 'Custom color scheme',
        bg_color: customBg,
        accent_color: customAccent,
        grid_style: 'subtle grid pattern',
        custom_description: customDescription,
      }
    } else {
      const found = PREDEFINED_THEMES.find((t) => t.name === selectedThemeName)!
      selectedTheme = found
    }

    setTheme(selectedTheme)
    setCurrentStage(4)
    router.push('/stage/4')
  }

  const customThemePreview: Theme = {
    name: 'Custom',
    description: customDescription || 'Your custom style',
    bg_color: customBg,
    accent_color: customAccent,
    grid_style: 'subtle grid pattern',
    custom_description: customDescription,
  }

  const allThemes = [...PREDEFINED_THEMES, customThemePreview]

  return (
    <div className="min-h-screen bg-white">
      <Stepper />

      <div className="max-w-[860px] mx-auto px-6 py-10 fade-in">
        {/* Back */}
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-[13px] text-[#555555] hover:text-[#111111] mb-6 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <h1 className="text-[32px] font-bold text-[#111111] mb-2">Choose Your Visual Theme</h1>
        <p className="text-[15px] text-[#555555] mb-8">
          This sets the color language for all your scene prompts.
          {loadingRecommend && <span className="ml-2 text-[#C62828]">Analyzing your script...</span>}
          {recommendedTheme && !loadingRecommend && (
            <span className="ml-2 text-[#2E7D32] font-semibold">
              ⭐ Recommended: {recommendedTheme}
            </span>
          )}
        </p>

        {/* Theme Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          {allThemes.map((t) => (
            <ThemeCard
              key={t.name}
              theme={t}
              selected={selectedThemeName === t.name}
              recommended={!loadingRecommend && recommendedTheme === t.name}
              onSelect={() => handleSelectTheme(t.name)}
            >
              {/* Custom color pickers (only shown inside the Custom card) */}
              {t.name === 'Custom' && selectedThemeName === 'Custom' && (
                <div className="mt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-3">
                    <label className="text-[12px] font-semibold text-[#555555] w-28">Background Color</label>
                    <input
                      type="color"
                      value={customBg}
                      onChange={(e) => setCustomBg(e.target.value)}
                      className="w-10 h-8 rounded cursor-pointer border border-[#E0E0E0]"
                    />
                    <span className="text-[12px] text-[#555555] font-mono">{customBg}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-[12px] font-semibold text-[#555555] w-28">Accent Color</label>
                    <input
                      type="color"
                      value={customAccent}
                      onChange={(e) => setCustomAccent(e.target.value)}
                      className="w-10 h-8 rounded cursor-pointer border border-[#E0E0E0]"
                    />
                    <span className="text-[12px] text-[#555555] font-mono">{customAccent}</span>
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-[#555555] block mb-1">Style Description (optional)</label>
                    <input
                      type="text"
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      placeholder="e.g. minimalist black and gold, cyberpunk neon..."
                      className="w-full border border-[#E0E0E0] focus:border-[#C62828] outline-none rounded-lg px-3 py-2 text-[13px] text-[#111111] placeholder-[#BDBDBD] transition-colors"
                    />
                  </div>
                </div>
              )}
            </ThemeCard>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-[14px] font-semibold text-[#555555] hover:text-[#111111] px-4 py-2.5 rounded-xl border border-[#E0E0E0] hover:bg-[#F5F5F5] transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!selectedThemeName}
            className="flex items-center gap-2 bg-[#C62828] hover:bg-[#B71C1C] disabled:bg-[#E0E0E0] disabled:text-[#BDBDBD] disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl transition-all text-[15px]"
          >
            Next: Generate Image Prompts
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
