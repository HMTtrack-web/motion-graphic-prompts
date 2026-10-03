import { NextRequest, NextResponse } from 'next/server'
import { callGeminiJSON } from '@/lib/gemini'
import { Theme } from '@/types'

interface MotionScene {
  scene_number: number
  script_line: string
  emotion?: string
  key_visual_concept?: string
  typography_text?: string
}

interface RequestBody {
  scene?: MotionScene
  image_prompt?: string
  theme?: Theme
  topic?: string
  selected_idea?: string
  script?: string
}

export async function POST(req: NextRequest) {
  try {
    const { scene, image_prompt, theme, topic, selected_idea, script } = (await req.json()) as RequestBody

    if (!scene || typeof scene.script_line !== 'string' || !image_prompt || !theme) {
      return NextResponse.json({ error: 'scene, image_prompt and theme are required' }, { status: 400 })
    }

    const sceneNumber = Number(scene.scene_number) || 1
    const emotion = scene.emotion?.trim() || 'curiosity'

    const system = `You are a motion graphic video director creating precise, natural-language animation prompts optimized for Google Flow (Veo model). Write in plain cinematic language — no After Effects jargon, no technical curves, no plugin names. Describe motion exactly as a director would describe it to a cinematographer.`

    const user = `Write the motion prompt for ONE scene of a motion graphic video. Use ALL the context below.

VIDEO CONTEXT
- Topic: "${topic?.trim() || 'n/a'}"
- Chosen title / creative direction: "${selected_idea?.trim() || 'n/a'}"
- Full script (for continuity): "${script?.trim() || scene.script_line}"
- Visual theme: ${theme.name} (background ${theme.bg_color}, accent ${theme.accent_color})

THIS SCENE (scene ${sceneNumber})
- Exact script line: "${scene.script_line}"
- Emotion / emotional arc of this scene: ${emotion}${scene.key_visual_concept ? `\n- Planned visual concept: ${scene.key_visual_concept}` : ''}${scene.typography_text ? `\n- On-screen typography: "${scene.typography_text}"` : ''}
- Image prompt this clip animates (the still the video starts from):
"${image_prompt}"

Write a motion prompt describing a 6-second video clip that animates THAT image. It must reference the actual hero object, accents and typography described in the image prompt, match the "${emotion}" emotion, and use motion that reinforces the meaning of the script line. It must include:
- BACKGROUND: Exactly 2 slow-drifting soft diagonal translucent lines behind everything, color derived from the locked background (low contrast, barely visible, environmental motion only)
- ENTRY (0–3.5s): How the hero object enters the frame (slide from direction, scale pop from center, or drop from above), with spring settle and very slight motion blur. How typography text appears (letter-by-letter reveal, masked slide-in, or scale pop). Describe stagger timing if multiple elements.
- HOLD (3.5–4.7s): Describe micro-motion on the settled elements (gentle floating sine-wave oscillation, slow 3D Y-axis rotation, soft ambient light shimmer). Background diagonal lines continue their slow drift.
- EXIT (4.7–6s): How elements leave frame (smooth downward glide, scale-out to 0%, or vertical mask wipe). Describe the transition that prepares for the next scene.
- CAMERA: Choose one — locked-off static, slow 3% push-in, or subtle parallax drift (foreground and background move at different speeds)
- SFX ONLY (no music, no voiceover): Describe 1 or 2 ambient sound effects timed to key moments (paper whoosh on entry, soft UI click on typography pop, low air swell during hold, gentle thud on hero landing)
- VIDEO SPEC: 9:16 vertical, 1080x1920, 24fps, cinematic motion, no camera shake

Output: a single valid JSON object with exactly one string key: "motion_prompt". No extra text. No markdown. Raw JSON only.`

    let parsed: { motion_prompt?: unknown }
    try {
      parsed = await callGeminiJSON<{ motion_prompt?: unknown }>(system, user)
    } catch (apiErr) {
      console.warn('Gemini motion-prompts call failed:', apiErr)
      return NextResponse.json({ error: `Failed to generate motion prompt for scene ${sceneNumber}.` }, { status: 502 })
    }

    if (!parsed || typeof parsed.motion_prompt !== 'string' || parsed.motion_prompt.trim() === '') {
      return NextResponse.json({ error: `Unusable response for scene ${sceneNumber}. Please retry.` }, { status: 502 })
    }

    return NextResponse.json({ scene_number: sceneNumber, motion_prompt: parsed.motion_prompt.trim() })
  } catch (err) {
    console.error('/api/generate/motion-prompts unhandled error:', err)
    return NextResponse.json({ error: 'Failed to generate motion prompt.' }, { status: 500 })
  }
}
