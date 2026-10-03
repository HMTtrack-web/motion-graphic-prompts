'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProjectStore, useHasHydrated } from '@/store/useProjectStore'
import Stepper from '@/components/Stepper'
import SceneCard from '@/components/SceneCard'
import SceneErrorCard from '@/components/SceneErrorCard'
import GenerationProgress from '@/components/GenerationProgress'
import { SceneImagePrompt, ScenePlanItem } from '@/types'
import { SceneContext, fetchImagePrompt, fetchScenePlan, planItemFor } from '@/lib/sceneApi'
import SceneSkeletonCard from '@/components/SceneSkeletonCard'
import StageActionPanel from '@/components/StageActionPanel'

export default function Stage4() {
  const router = useRouter()
  const hasHydrated = useHasHydrated()
  const {
    topic,
    selected_idea,
    script,
    theme,
    scene_plan,
    setScenePlan,
    image_prompts,
    setImagePrompts,
    setCurrentStage,
  } = useProjectStore()

  const [scenes, setScenes] = useState<SceneImagePrompt[]>(image_prompts)
  const [scenePlanList, setScenePlanList] = useState<ScenePlanItem[]>(scene_plan)
  const [status, setStatus] = useState<'idle' | 'planning' | 'generating' | 'done'>(
    image_prompts.length > 0 ? 'done' : 'idle'
  )
  const [currentGeneratingIndex, setCurrentGeneratingIndex] = useState<number>(0)
  const [errors, setErrors] = useState<Record<number, string>>({})
  const [globalError, setGlobalError] = useState<string | null>(null)

  const hasStarted = useRef(false)
  const isGeneratingRef = useRef(false)

  // Scroll reset
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Redirect if prerequisite state is missing after hydration
  useEffect(() => {
    if (!hasHydrated) return
    if (!script || !theme) {
      router.replace('/stage/3')
      return
    }
    setCurrentStage(4)

    if (image_prompts.length === 0 && !hasStarted.current) {
      hasStarted.current = true
      startStreamingPipeline()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, script, theme])

  // Restore existing prompts/plan from store if hydrated
  useEffect(() => {
    if (hasHydrated && image_prompts.length > 0 && scenes.length === 0 && !hasStarted.current) {
      setScenes(image_prompts)
      setStatus('done')
    }
  }, [hasHydrated, image_prompts, scenes.length])

  useEffect(() => {
    if (hasHydrated && scene_plan.length > 0 && scenePlanList.length === 0) {
      setScenePlanList(scene_plan)
    }
  }, [hasHydrated, scene_plan, scenePlanList.length])

  // Sync scenes to Zustand store whenever scenes change once hydrated
  useEffect(() => {
    if (hasHydrated && (scenes.length > 0 || hasStarted.current)) {
      setImagePrompts(scenes)
    }
  }, [hasHydrated, scenes, setImagePrompts])

  // Sync scene plan to store whenever local plan changes once hydrated
  useEffect(() => {
    if (hasHydrated && scenePlanList.length > 0) {
      setScenePlan(scenePlanList)
    }
  }, [hasHydrated, scenePlanList, setScenePlan])

  const startStreamingPipeline = async () => {
    if (isGeneratingRef.current || !theme) return
    isGeneratingRef.current = true
    setGlobalError(null)
    setErrors({})

    let activePlan = scenePlanList
    if (!activePlan || activePlan.length === 0) {
      setStatus('planning')
      try {
        activePlan = await fetchScenePlan(script)
        setScenePlanList(activePlan)
        setScenePlan(activePlan)
      } catch (err: unknown) {
        setGlobalError(err instanceof Error ? err.message : 'Failed to analyze script and plan scenes.')
        setStatus('idle')
        isGeneratingRef.current = false
        return
      }
    }

    setStatus('generating')
    setScenes([])
    setImagePrompts([])

    const collected: SceneImagePrompt[] = []
    const ctx: SceneContext = {
      topic,
      selected_idea,
      script,
      theme,
    }

    for (let i = 0; i < activePlan.length; i++) {
      const planItem = activePlan[i]
      setCurrentGeneratingIndex(i + 1)

      try {
        const prompt = await fetchImagePrompt(planItem, ctx)
        collected.push(prompt)
        setScenes([...collected])
        setImagePrompts([...collected])
      } catch (err: unknown) {
        console.error(`Failed to generate scene ${planItem.scene_number}:`, err)
        const msg = err instanceof Error ? err.message : 'Generation failed. Please retry.'
        setErrors((prev) => ({ ...prev, [planItem.scene_number]: msg }))
      }
    }

    setStatus('done')
    isGeneratingRef.current = false
  }

  const handleRegenerateScene = async (sceneNumber: number) => {
    if (!theme) return
    const planItem = planItemFor(scenePlanList, {
      scene_number: sceneNumber,
      script_line: scenes.find((s) => s.scene_number === sceneNumber)?.script_line || '',
    })
    const ctx: SceneContext = { topic, selected_idea, script, theme }

    const updated = await fetchImagePrompt(planItem, ctx)
    setScenes((prev) => prev.map((s) => (s.scene_number === sceneNumber ? updated : s)))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[sceneNumber]
      return next
    })
  }

  const handleRetryScene = async (sceneNumber: number) => {
    if (!theme) return
    const planItem = planItemFor(scenePlanList, {
      scene_number: sceneNumber,
      script_line: scenePlanList.find((p) => p.scene_number === sceneNumber)?.script_line || '',
    })
    const ctx: SceneContext = { topic, selected_idea, script, theme }

    const updated = await fetchImagePrompt(planItem, ctx)
    setScenes((prev) => {
      const filtered = prev.filter((s) => s.scene_number !== sceneNumber)
      const next = [...filtered, updated].sort((a, b) => a.scene_number - b.scene_number)
      return next
    })
    setErrors((prev) => {
      const next = { ...prev }
      delete next[sceneNumber]
      return next
    })
  }

  const allPromptsText = scenes
    .map((s) => `Scene ${s.scene_number}:\n${s.image_prompt}\nTypography: ${s.typography_text}`)
    .join('\n\n---\n\n')

  const totalPlanned = scenePlanList.length
  const completedCount = scenes.length
  const hasErrors = Object.keys(errors).length > 0
  const isAllReady = status === 'done' && !hasErrors && scenes.length > 0 && scenes.length === totalPlanned

  // SKELETON SEQUENCE CALCULATION:
  // Starts with 3 skeleton cards in the first row. As 4th card generates, 4th slot appears, etc.
  const visibleCount =
    status === 'planning'
      ? 3
      : status === 'done'
      ? Math.max(totalPlanned, scenes.length)
      : Math.min(totalPlanned, Math.max(3, currentGeneratingIndex))

  const handleCopyAll = async () => {
    if (!allPromptsText) return
    await navigator.clipboard.writeText(allPromptsText)
  }

  const handleNext = () => {
    setCurrentStage(5)
    router.push('/stage/5')
  }

  const handleBack = () => {
    router.push('/stage/3')
  }

  const handleRegenerateAll = () => {
    startStreamingPipeline()
  }

  return (
    <div className="min-h-screen bg-white">
      <Stepper sticky={false} />

      {/* STICKY PROGRESS BAR: Stays at very top (z-index:50) with backdrop blur, above both panels */}
      {(status === 'planning' || status === 'generating' || (status === 'done' && totalPlanned > 0)) && (
        <div
          className="sticky top-0 z-50 transition-all shadow-sm"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            padding: '12px 0',
            borderBottom: '1px solid #E0E0E0',
            width: '100%',
          }}
        >
          <div style={{ width: '100%', padding: '0 16px', boxSizing: 'border-box' }}>
            <GenerationProgress
              label={
                status === 'planning'
                  ? 'Analyzing your script and planning scenes...'
                  : status === 'generating'
                  ? `Generating scene ${currentGeneratingIndex} of ${totalPlanned}...`
                  : hasErrors
                  ? `Ready with ${completedCount} of ${totalPlanned} scenes`
                  : 'All scenes ready! ✓'
              }
              subLabel={
                status === 'planning'
                  ? 'Identifying topic shifts, natural emotional beats, and scene breaks'
                  : status === 'generating'
                  ? `Found ${totalPlanned} scenes in your script. Generating prompts...`
                  : hasErrors
                  ? 'Some scenes had issues. You can retry individual scenes below.'
                  : `Generated ${completedCount} prompts perfectly matched to your script.`
              }
              current={completedCount}
              total={totalPlanned}
              indeterminate={status === 'planning'}
              complete={status === 'done' && !hasErrors}
            />
          </div>
        </div>
      )}

      {/* MAIN PAGE STRUCTURE: Full viewport width, no max-width container */}
      <div
        style={{
          display: 'flex',
          width: '100%',
          minHeight: '100vh',
          padding: '0 16px',
          gap: '20px',
          boxSizing: 'border-box',
        }}
        className="py-6 pb-24 lg:pb-8 lg:pr-[190px] fade-in"
      >
        {/* LEFT: 3-column scene grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="text-[30px] font-bold text-[#111111] mb-2">Scene-by-Scene Image Prompts</h1>
          <p className="text-[14px] text-[#555555] mb-6">
            Paste each prompt into Midjourney, Leonardo AI, or any image generator.
          </p>

          {/* Global Error Banner */}
          {globalError && (
            <div className="mb-6 bg-[#FFEBEE] border border-[#C62828] border-opacity-40 rounded-xl p-3 flex items-center justify-between">
              <p className="text-[13px] text-[#C62828] font-semibold">{globalError}</p>
              <button
                onClick={startStreamingPipeline}
                className="text-[12px] font-bold text-[#C62828] hover:underline ml-4"
              >
                Retry
              </button>
            </div>
          )}

          {/* SCENE GRID: 3 columns (>=1280px), 2 columns (<1280px), 1 column (<768px) */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start mb-8"
            style={{
              gap: '16px',
              alignItems: 'start',
            }}
          >
            {Array.from({ length: visibleCount }, (_, idx) => {
              const sceneNum = idx + 1
              const generatedScene = scenes.find((s) => s.scene_number === sceneNum)
              const sceneErr = errors[sceneNum]
              const isGenerating =
                (status === 'generating' && currentGeneratingIndex === sceneNum) ||
                (status === 'planning' && sceneNum === 1)

              if (generatedScene) {
                return (
                  <div
                    key={sceneNum}
                    className="h-full scene-content-arrive"
                    style={{
                      border: '1px solid #E0E0E0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      borderRadius: '16px',
                      transition: 'all 0.4s ease',
                    }}
                  >
                    <SceneCard scene={generatedScene} onRegenerate={handleRegenerateScene} />
                  </div>
                )
              }

              if (sceneErr) {
                return (
                  <div key={sceneNum} className="h-full scene-content-arrive">
                    <SceneErrorCard
                      sceneNumber={sceneNum}
                      scriptLine={scenePlanList.find((p) => p.scene_number === sceneNum)?.script_line || ''}
                      message={sceneErr}
                      onRetry={handleRetryScene}
                    />
                  </div>
                )
              }

              return (
                <SceneSkeletonCard
                  key={`skeleton-${sceneNum}`}
                  sceneNumber={sceneNum}
                  isGenerating={isGenerating}
                />
              )
            })}
          </div>
        </div>

        {/* RIGHT: sticky tutorial panel */}
        <aside
          className="hidden xl:block"
          style={{
            position: 'sticky',
            top: '80px',
            width: '280px',
            flexShrink: 0,
            height: 'fit-content',
          }}
        >
          {/* TODO: Replace with video when ready:
          <video src="/tutorial.mp4" autoPlay muted loop controls
            style={{width:'100%', borderRadius:'12px'}} /> */}
          <div
            className="flex flex-col items-center justify-center text-center p-3 select-none"
            style={{
              width: '100%',
              aspectRatio: '16/9',
              background: 'rgba(0,0,0,0.05)',
              border: '1.5px dashed #C62828',
              borderRadius: '12px',
              boxSizing: 'border-box',
            }}
          >
            <span
              style={{
                color: '#C62828',
                fontSize: '36px',
                lineHeight: 1,
                marginBottom: '4px',
              }}
              aria-hidden="true"
            >
              ▶
            </span>
            <p
              style={{
                fontSize: '14px',
                color: '#333333',
                fontWeight: 600,
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              Tutorial Coming Soon
            </p>
            <p
              style={{
                fontSize: '11px',
                color: '#888888',
                marginTop: '4px',
                lineHeight: 1.2,
                marginBottom: 0,
              }}
            >
              Learn how to use prompts in Google Flow
            </p>
          </div>

          <p
            style={{
              fontSize: '11px',
              color: '#888888',
              marginTop: '8px',
              paddingLeft: '4px',
              paddingRight: '4px',
            }}
          >
            📌 Follow along while you scroll
          </p>
        </aside>
      </div>

      {/* CHANGE 2 — FIXED RIGHT SIDE ACTION PANEL + MOBILE BOTTOM BAR */}
      <StageActionPanel
        completedCount={completedCount}
        totalCount={totalPlanned || 3}
        isReady={isAllReady}
        isGenerating={status === 'planning' || status === 'generating'}
        nextLabel="Next: Motion →"
        onNext={handleNext}
        onCopyAll={handleCopyAll}
        onRegenerateAll={handleRegenerateAll}
        onBack={handleBack}
      />
    </div>
  )
}
