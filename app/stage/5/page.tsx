'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProjectStore } from '@/store/useProjectStore'
import Stepper from '@/components/Stepper'
import SceneCard from '@/components/SceneCard'
import SceneErrorCard from '@/components/SceneErrorCard'
import GenerationProgress from '@/components/GenerationProgress'
import CopyButton from '@/components/CopyButton'
import { saveToHistory } from '@/lib/localStorage'
import { SceneMotionPrompt } from '@/types'
import { SceneContext, fetchMotionPrompt, planItemFor } from '@/lib/sceneApi'
import SceneSkeletonCard from '@/components/SceneSkeletonCard'
import StageActionPanel from '@/components/StageActionPanel'

export default function Stage5() {
  const router = useRouter()
  const {
    topic,
    selected_idea,
    script,
    theme,
    scene_plan,
    image_prompts,
    motion_prompts,
    setMotionPrompts,
    setCurrentStage,
    reset,
  } = useProjectStore()

  const [motions, setMotions] = useState<SceneMotionPrompt[]>(motion_prompts)
  const [status, setStatus] = useState<'idle' | 'generating' | 'done'>(
    motion_prompts.length > 0 ? 'done' : 'idle'
  )
  const [currentGeneratingIndex, setCurrentGeneratingIndex] = useState<number>(0)
  const [errors, setErrors] = useState<Record<number, string>>({})
  const [globalError, setGlobalError] = useState<string | null>(null)

  const hasStarted = useRef(false)
  const isGeneratingRef = useRef(false)
  const hasSavedHistory = useRef(false)

  // Redirect if prerequisite state is missing
  useEffect(() => {
    if (!image_prompts || image_prompts.length === 0 || !theme) {
      router.replace('/stage/4')
      return
    }
    setCurrentStage(5)

    if (motion_prompts.length === 0 && !hasStarted.current) {
      hasStarted.current = true
      startStreamingMotions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync local motions to store
  useEffect(() => {
    setMotionPrompts(motions)
  }, [motions, setMotionPrompts])

  // Save to history once all motions are ready
  useEffect(() => {
    if (
      motions.length > 0 &&
      motions.length === image_prompts.length &&
      !hasSavedHistory.current &&
      theme
    ) {
      hasSavedHistory.current = true
      saveToHistory({
        topic,
        selected_title: selected_idea,
        script,
        theme,
        image_prompts,
        motion_prompts: motions,
        current_stage: 5,
        scene_plan,
      })

      // Trigger celebration confetti
      if (typeof window !== 'undefined') {
        import('canvas-confetti').then((confettiModule) => {
          const confetti = confettiModule.default
          setTimeout(() => {
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.3 },
              colors: ['#C62828', '#FFEBEE', '#111111', '#FFFFFF', '#B71C1C'],
            })
          }, 300)
        })
      }
    }
  }, [motions, image_prompts, topic, selected_idea, script, theme, scene_plan])

  const startStreamingMotions = async () => {
    if (isGeneratingRef.current || !theme) return
    isGeneratingRef.current = true
    setGlobalError(null)
    setErrors({})
    setStatus('generating')
    setMotions([])
    setMotionPrompts([])

    const collected: SceneMotionPrompt[] = []
    const ctx: SceneContext = {
      topic,
      selected_idea,
      script,
      theme,
    }

    for (let i = 0; i < image_prompts.length; i++) {
      const imagePrompt = image_prompts[i]
      setCurrentGeneratingIndex(i + 1)
      const planItem = planItemFor(scene_plan, imagePrompt)

      try {
        const motion = await fetchMotionPrompt(planItem, imagePrompt, ctx)
        collected.push(motion)
        setMotions([...collected])
        setMotionPrompts([...collected])
      } catch (err: unknown) {
        console.error(`Failed motion for scene ${imagePrompt.scene_number}:`, err)
        const msg = err instanceof Error ? err.message : 'Motion prompt generation failed. Please retry.'
        setErrors((prev) => ({ ...prev, [imagePrompt.scene_number]: msg }))
      }
    }

    setStatus('done')
    isGeneratingRef.current = false
  }

  const handleRegenerateMotion = async (sceneNumber: number) => {
    if (!theme) return
    const imagePrompt = image_prompts.find((s) => s.scene_number === sceneNumber)
    if (!imagePrompt) return

    const planItem = planItemFor(scene_plan, imagePrompt)
    const ctx: SceneContext = { topic, selected_idea, script, theme }

    const updated = await fetchMotionPrompt(planItem, imagePrompt, ctx)
    setMotions((prev) => prev.map((m) => (m.scene_number === sceneNumber ? updated : m)))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[sceneNumber]
      return next
    })
  }

  const handleRetryMotion = async (sceneNumber: number) => {
    if (!theme) return
    const imagePrompt = image_prompts.find((s) => s.scene_number === sceneNumber)
    if (!imagePrompt) return

    const planItem = planItemFor(scene_plan, imagePrompt)
    const ctx: SceneContext = { topic, selected_idea, script, theme }

    const updated = await fetchMotionPrompt(planItem, imagePrompt, ctx)
    setMotions((prev) => {
      const filtered = prev.filter((m) => m.scene_number !== sceneNumber)
      const next = [...filtered, updated].sort((a, b) => a.scene_number - b.scene_number)
      return next
    })
    setErrors((prev) => {
      const next = { ...prev }
      delete next[sceneNumber]
      return next
    })
  }

  const allMotionsText = motions
    .map((m) => `Scene ${m.scene_number}:\n${m.motion_prompt}`)
    .join('\n\n---\n\n')

  const totalScenes = image_prompts.length
  const completedCount = motions.length
  const hasErrors = Object.keys(errors).length > 0
  const isAllReady = status === 'done' && !hasErrors && motions.length > 0 && motions.length === totalScenes

  // SKELETON SEQUENCE CALCULATION:
  // Starts with 3 skeleton cards in the first row. As 4th card generates, 4th slot appears, etc.
  const visibleCount =
    status === 'done'
      ? totalScenes
      : Math.min(totalScenes, Math.max(3, currentGeneratingIndex))

  const handleCopyAll = async () => {
    if (!allMotionsText) return
    await navigator.clipboard.writeText(allMotionsText)
  }

  const handleStartNew = () => {
    reset()
    router.push('/')
  }

  const handleBack = () => {
    router.push('/stage/4')
  }

  const handleRegenerateAll = () => {
    startStreamingMotions()
  }

  return (
    <div className="min-h-screen bg-white">
      <Stepper sticky={false} />

      {/* STICKY PROGRESS BAR: Stays at very top (z-index:50) with backdrop blur, above both panels */}
      {(status === 'generating' || (status === 'done' && totalScenes > 0)) && (
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
                status === 'generating'
                  ? `Generating motion for scene ${currentGeneratingIndex} of ${totalScenes}...`
                  : hasErrors
                  ? `Ready with ${completedCount} of ${totalScenes} motion prompts`
                  : 'All motion prompts ready! ✓'
              }
              subLabel={
                status === 'generating'
                  ? 'Synthesizing camera movement, physics, and cinematography for each scene'
                  : hasErrors
                  ? 'Some scenes had issues. You can retry individual scenes below.'
                  : `Generated ${completedCount} motion prompts for your scenes.`
              }
              current={completedCount}
              total={totalScenes}
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
          {/* Global Error Banner */}
          {globalError && (
            <div className="mb-6 bg-[#FFEBEE] border border-[#C62828] border-opacity-40 rounded-xl p-3 flex items-center justify-between">
              <p className="text-[13px] text-[#C62828] font-semibold">{globalError}</p>
              <button
                onClick={startStreamingMotions}
                className="text-[12px] font-bold text-[#C62828] hover:underline ml-4"
              >
                Retry
              </button>
            </div>
          )}

          {/* Success Banner */}
          {status === 'done' && !hasErrors && motions.length > 0 && (
            <div className="bg-[#F1F8E9] border border-[#2E7D32] border-opacity-40 rounded-xl p-4 mb-6 flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <p className="text-[15px] font-bold text-[#2E7D32]">Your complete prompt package is ready!</p>
                <p className="text-[13px] text-[#555555]">All scenes generated and saved to your history.</p>
              </div>
            </div>
          )}

          <h1 className="text-[30px] font-bold text-[#111111] mb-2">Scene-by-Scene Motion Prompts</h1>
          <p className="text-[14px] text-[#555555] mb-6">
            Optimized for <span className="font-semibold text-[#111111]">Google Flow (Veo model)</span>.
            Use with your generated images for image-to-video.
          </p>

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
              const imagePrompt = image_prompts.find((s) => s.scene_number === sceneNum)
              const motion = motions.find((m) => m.scene_number === sceneNum)
              const sceneErr = errors[sceneNum]
              const isGenerating = status === 'generating' && currentGeneratingIndex === sceneNum

              if (motion && imagePrompt) {
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
                    <SceneCard
                      scene={imagePrompt}
                      showMotionPrompt
                      motionPrompt={motion.motion_prompt}
                      onRegenerate={handleRegenerateMotion}
                    />
                  </div>
                )
              }

              if (sceneErr && imagePrompt) {
                return (
                  <div key={sceneNum} className="h-full scene-content-arrive">
                    <SceneErrorCard
                      sceneNumber={sceneNum}
                      scriptLine={imagePrompt.script_line}
                      message={sceneErr}
                      onRetry={handleRetryMotion}
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
        totalCount={totalScenes}
        isReady={isAllReady}
        isGenerating={status === 'generating'}
        nextLabel="Next: Done →"
        onNext={handleStartNew}
        onCopyAll={handleCopyAll}
        onRegenerateAll={handleRegenerateAll}
        onBack={handleBack}
      />
    </div>
  )
}
