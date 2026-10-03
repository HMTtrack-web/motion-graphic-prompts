import { ProjectHistory, SceneImagePrompt, SceneMotionPrompt, ScenePlanItem, Theme } from '@/types'
import { useProjectStore } from '@/store/useProjectStore'

const HISTORY_KEY = 'mf_history'
const DAILY_IDEAS_KEY = 'mf_daily_ideas'
const DAILY_IDEAS_DATE_KEY = 'mf_daily_ideas_date'
const MAX_HISTORY = 10

function getToday(): string {
  return new Date().toISOString().slice(0, 10)
}

export function saveToHistory(project: Omit<ProjectHistory, 'id' | 'created_at'>): void {
  try {
    const existing = getHistory()
    const newProject: ProjectHistory = {
      ...project,
      isDirectScript: project.isDirectScript ?? useProjectStore.getState().isDirectScript,
      scene_plan: project.scene_plan ?? useProjectStore.getState().scene_plan,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    }
    // Remove any existing entry with same topic+title
    // (script-flow entries share one topic/title, so they must also match on script)
    const filtered = existing.filter(
      (p) =>
        !(
          p.topic === newProject.topic &&
          p.selected_title === newProject.selected_title &&
          (!newProject.isDirectScript || p.script === newProject.script)
        )
    )
    const updated = [newProject, ...filtered].slice(0, MAX_HISTORY)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
  } catch {
    // localStorage may not be available
  }
}

export function getHistory(): ProjectHistory[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    return JSON.parse(raw) as ProjectHistory[]
  } catch {
    return []
  }
}

export function getDailyIdeas(): string[] | null {
  try {
    const date = localStorage.getItem(DAILY_IDEAS_DATE_KEY)
    if (date !== getToday()) return null
    const raw = localStorage.getItem(DAILY_IDEAS_KEY)
    if (!raw) return null
    return JSON.parse(raw) as string[]
  } catch {
    return null
  }
}

export function saveDailyIdeas(ideas: string[]): void {
  try {
    localStorage.setItem(DAILY_IDEAS_KEY, JSON.stringify(ideas))
    localStorage.setItem(DAILY_IDEAS_DATE_KEY, getToday())
  } catch {
    // localStorage may not be available
  }
}

export function restoreProjectFromHistory(
  project: ProjectHistory
): {
  topic: string
  selected_idea: string
  script: string
  theme: Theme | null
  image_prompts: SceneImagePrompt[]
  motion_prompts: SceneMotionPrompt[]
  current_stage: number
  isDirectScript: boolean
  scene_plan: ScenePlanItem[]
} {
  return {
    topic: project.topic,
    selected_idea: project.selected_title,
    script: project.script,
    theme: project.theme,
    image_prompts: project.image_prompts,
    motion_prompts: project.motion_prompts,
    current_stage: project.current_stage,
    isDirectScript: project.isDirectScript ?? false,
    scene_plan: project.scene_plan ?? [],
  }
}
