import { NextRequest, NextResponse } from 'next/server'
import { callGeminiJSON } from '@/lib/gemini'
import { ScenePlanItem, Theme } from '@/types'

interface RequestBody {
  scene?: ScenePlanItem
  theme?: Theme
  topic?: string
  selected_idea?: string
  script?: string
}

export async function POST(req: NextRequest) {
  try {
    const { scene, theme, topic, script } = (await req.json()) as RequestBody

    if (!scene || typeof scene.script_line !== 'string' || !scene.script_line.trim() || !theme) {
      return NextResponse.json({ error: 'scene (with script_line) and theme are required' }, { status: 400 })
    }

    const sceneNumber = Number(scene.scene_number) || 1
    const scriptLine = scene.script_line.trim()
    const emotion = scene.emotion?.trim() || 'curiosity'
    const visualConcept = scene.key_visual_concept?.trim() || 'a single specific hero object that embodies this line'
    const fullScript = script?.trim() || scriptLine
    const videoTopic = topic?.trim() || 'n/a'

    const system = ``

    const user = `You are a motion graphic art director. Your job is to create a
CONCEPTUALLY ACCURATE image generation prompt for this specific
scene from a video script.

Full script context: '${fullScript}'
This scene's exact line: '${scriptLine}'
Scene emotion: '${emotion}'
Key visual concept identified: '${visualConcept}'
Video topic: '${videoTopic}'
Visual theme: ${theme.name} — background color: ${theme.bg_color},
accent color: ${theme.accent_color}

TASK: Create an image prompt where the HERO OBJECT directly represents
the MEANING and CONCEPT of '${scriptLine}' specifically.

RULES FOR HERO OBJECT SELECTION:
- Ask yourself: what does THIS LINE literally or metaphorically mean?
- If the line is about speaking up → a mouth, microphone, or speech bubble
- If the line is about career growth → a ladder, briefcase, or upward graph
- If the line is about fear → a shadowy figure, locked door, or wall
- If the line is about learning → an open book, pencil, or light path
- If the line is about money → coins, wallet, or falling currency
- If the line is about time running out → a calendar, deadline clock
- If the line is about social pressure → crowd silhouettes, eyes watching
- NEVER use a generic lightbulb, hourglass, or sand timer unless
  the script literally talks about time or ideas
- The hero object must feel like it was chosen BY A HUMAN who read
  THIS SPECIFIC LINE

Output format:
'A high-end mixed-media editorial collage for a motion graphic video,
9:16 vertical composition, ultra-detailed, 8K resolution.
Base background is ${theme.bg_color} with a delicate cross-dot grid pattern.
Single hero object: [SPECIFIC OBJECT that represents the script line concept].
Two supporting vector accents: [accents that reinforce the concept].
Asymmetric composition, editorial studio lighting with soft drop shadows,
${theme.accent_color} accent color, kinetic motion graphic aesthetic.'

Output: JSON object with keys image_prompt and typography_text only.
typography_text must be 2-3 words MAX that capture the emotional core
of the script line — not a description, an IMPACT PHRASE.`

    let parsed: { image_prompt?: unknown; typography_text?: unknown }
    try {
      parsed = await callGeminiJSON<{ image_prompt?: unknown; typography_text?: unknown }>(system, user)
    } catch (apiErr) {
      console.warn('Gemini image-prompts call failed:', apiErr)
      return NextResponse.json({ error: `Failed to generate image prompt for scene ${sceneNumber}.` }, { status: 502 })
    }

    if (
      !parsed ||
      typeof parsed.image_prompt !== 'string' ||
      parsed.image_prompt.trim() === '' ||
      typeof parsed.typography_text !== 'string'
    ) {
      return NextResponse.json({ error: `Unusable response for scene ${sceneNumber}. Please retry.` }, { status: 502 })
    }

    return NextResponse.json({
      scene_number: sceneNumber,
      script_line: scriptLine,
      image_prompt: parsed.image_prompt.trim(),
      typography_text: parsed.typography_text.trim(),
    })
  } catch (err) {
    console.error('/api/generate/image-prompts unhandled error:', err)
    return NextResponse.json({ error: 'Failed to generate image prompt.' }, { status: 500 })
  }
}
