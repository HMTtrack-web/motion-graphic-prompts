import { SceneImagePrompt, SceneMotionPrompt, ScenePlanItem, Theme } from '@/types'

/** The full accumulated "brain" sent with every per-scene generation call. */
export interface SceneContext {
  topic: string
  selected_idea: string
  script: string
  theme: Theme
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  let data: (T & { error?: string }) | null = null
  try {
    data = await res.json()
  } catch {
    // non-JSON response
  }
  if (!res.ok || !data || data.error) {
    throw new Error(data?.error || `Request failed (${res.status})`)
  }
  return data
}

export async function fetchScenePlan(script: string): Promise<ScenePlanItem[]> {
  const data = await postJSON<{ scene_plan: ScenePlanItem[] }>('/api/generate/scene-plan', { script })
  if (!Array.isArray(data.scene_plan) || data.scene_plan.length === 0) {
    throw new Error('Scene planning returned no scenes')
  }
  return data.scene_plan
}

export async function fetchImagePrompt(scene: ScenePlanItem, ctx: SceneContext): Promise<SceneImagePrompt> {
  const data = await postJSON<SceneImagePrompt>('/api/generate/image-prompts', {
    scene,
    theme: ctx.theme,
    topic: ctx.topic,
    selected_idea: ctx.selected_idea,
    script: ctx.script,
  })
  return {
    scene_number: scene.scene_number,
    script_line: scene.script_line,
    image_prompt: data.image_prompt,
    typography_text: data.typography_text,
  }
}

export async function fetchMotionPrompt(
  scene: ScenePlanItem,
  image: SceneImagePrompt,
  ctx: SceneContext
): Promise<SceneMotionPrompt> {
  const data = await postJSON<SceneMotionPrompt>('/api/generate/motion-prompts', {
    scene: { ...scene, typography_text: image.typography_text },
    image_prompt: image.image_prompt,
    theme: ctx.theme,
    topic: ctx.topic,
    selected_idea: ctx.selected_idea,
    script: ctx.script,
  })
  return { scene_number: scene.scene_number, motion_prompt: data.motion_prompt }
}

/**
 * The planning data for a scene. Falls back to what the image prompt itself carries
 * for projects restored from older history entries that have no stored scene plan.
 */
export function planItemFor(
  plan: ScenePlanItem[],
  image: Pick<SceneImagePrompt, 'scene_number' | 'script_line'>
): ScenePlanItem {
  return (
    plan.find((p) => p.scene_number === image.scene_number) ?? {
      scene_number: image.scene_number,
      script_line: image.script_line,
      emotion: 'curiosity',
      key_visual_concept: 'a single specific hero object that embodies this line',
    }
  )
}
