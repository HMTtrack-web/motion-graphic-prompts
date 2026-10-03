import { useState, useEffect } from 'react'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Theme, SceneImagePrompt, SceneMotionPrompt, ScenePlanItem } from '@/types'

interface ProjectState {
  topic: string
  selected_idea: string
  script: string
  scene_plan: ScenePlanItem[]
  theme: Theme | null
  image_prompts: SceneImagePrompt[]
  motion_prompts: SceneMotionPrompt[]
  current_stage: number
  loading: boolean
  error: string | null
  isDirectScript: boolean
  // Setters
  setTopic: (topic: string) => void
  setSelectedIdea: (idea: string) => void
  setScript: (script: string) => void
  setScenePlan: (plan: ScenePlanItem[]) => void
  setTheme: (theme: Theme | null) => void
  setImagePrompts: (prompts: SceneImagePrompt[]) => void
  setMotionPrompts: (prompts: SceneMotionPrompt[]) => void
  setCurrentStage: (stage: number) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setIsDirectScript: (isDirectScript: boolean) => void
  reset: () => void
}

const initialState = {
  topic: '',
  selected_idea: '',
  script: '',
  scene_plan: [],
  theme: null,
  image_prompts: [],
  motion_prompts: [],
  current_stage: 1,
  loading: false,
  error: null,
  isDirectScript: false,
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      ...initialState,
      setTopic: (topic) => set({ topic }),
      setSelectedIdea: (idea) => set({ selected_idea: idea }),
      setScript: (script) =>
        set((state) =>
          state.script === script
            ? { script }
            : // Script changed: everything derived from the old script is now stale
              { script, scene_plan: [], image_prompts: [], motion_prompts: [] }
        ),
      setScenePlan: (plan) => set({ scene_plan: plan }),
      setTheme: (theme) => set({ theme }),
      setImagePrompts: (prompts) => set({ image_prompts: prompts }),
      setMotionPrompts: (prompts) => set({ motion_prompts: prompts }),
      setCurrentStage: (stage) => set({ current_stage: stage }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setIsDirectScript: (isDirectScript) => set({ isDirectScript }),
      reset: () => set(initialState),
    }),
    {
      name: 'mgp-session',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') {
          return sessionStorage
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      }),
    }
  )
)

export function useHasHydrated() {
  const [hasHydrated, setHasHydrated] = useState(false)

  useEffect(() => {
    if (useProjectStore.persist.hasHydrated()) {
      setHasHydrated(true)
      return
    }

    const unsub = useProjectStore.persist.onFinishHydration(() => {
      setHasHydrated(true)
    })
    setHasHydrated(useProjectStore.persist.hasHydrated())
    return () => unsub()
  }, [])

  return hasHydrated
}

