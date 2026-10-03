export interface Theme {
  name: 'Editorial' | 'Technical' | 'Academic' | 'Custom'
  description: string
  bg_color: string
  accent_color: string
  grid_style: string
  custom_description?: string
}

export interface SceneImagePrompt {
  scene_number: number
  script_line: string
  image_prompt: string
  typography_text: string
}

export interface SceneMotionPrompt {
  scene_number: number
  motion_prompt: string
}

export interface ScenePlanItem {
  scene_number: number
  script_line: string
  emotion: string
  key_visual_concept: string
}

export interface ProjectHistory {
  id: string
  topic: string
  selected_title: string
  script: string
  theme: Theme
  image_prompts: SceneImagePrompt[]
  motion_prompts: SceneMotionPrompt[]
  created_at: string
  current_stage: number
  isDirectScript?: boolean
  scene_plan?: ScenePlanItem[]
}

export const PREDEFINED_THEMES: Theme[] = [
  {
    name: 'Editorial',
    description: 'Warm off-white background, dashed modular grid, deep royal purple shape accents, bold black and purple typography',
    bg_color: '#FAF8F5',
    accent_color: '#5E35B1',
    grid_style: 'dashed modular grid',
  },
  {
    name: 'Technical',
    description: 'Muted slate-charcoal grid surface, neon teal geometric accents, crisp white and teal typography',
    bg_color: '#1A1A2E',
    accent_color: '#00BCD4',
    grid_style: 'geometric slate grid',
  },
  {
    name: 'Academic',
    description: 'Pale cream background, cross-dot thin grid, deep terracotta curved shapes, rich charcoal and orange typography',
    bg_color: '#FFFDE7',
    accent_color: '#E64A19',
    grid_style: 'cross-dot thin grid',
  },
]
