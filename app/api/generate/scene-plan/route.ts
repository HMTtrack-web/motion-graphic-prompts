import { NextRequest, NextResponse } from 'next/server'
import { callGeminiJSON } from '@/lib/gemini'
import {
  MAX_SCENES,
  buildFallbackScenePlan,
  countWords,
  getSceneCountRange,
  validateScenePlan,
} from '@/lib/scenePlan'
import { ScenePlanItem } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const { script } = await req.json()
    if (!script || typeof script !== 'string' || script.trim().length === 0) {
      return NextResponse.json({ error: 'script is required' }, { status: 400 })
    }

    const cleanScript = script.trim()
    const { min, max } = getSceneCountRange(countWords(cleanScript))
    const countRule =
      min === max
        ? `exactly ${min} scenes`
        : `between ${min} and ${max} scenes (never more than ${MAX_SCENES})`

    const system = ``

    const user = `Read this script completely: '${cleanScript}'

Your job is to plan scenes for a motion graphic video.
Analyze the script and identify natural scene breaks where the topic,
emotion, or idea shifts. Each scene must map to ACTUAL sentences from
the script — never paraphrase or invent.

For each scene provide:
- scene_number (integer starting from 1)
- script_line (exact sentence or short group of sentences from the script
  that belong together — copy word for word)
- emotion (one word: curiosity / inspiration / urgency / reflection /
  hope / surprise / determination)
- key_visual_concept (what visual best represents this specific line —
  be specific to the content, not generic)

Rules:
- Scene count must reflect the actual script length and complexity: plan ${countRule} for this script
- Never merge unrelated ideas into one scene
- Never split one continuous thought across multiple scenes
- The sum of all script_lines must cover the ENTIRE script with nothing skipped
- Output: valid JSON array only. No extra text.`

    // Up to two attempts with the model; each plan is validated against the real script
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const raw = await callGeminiJSON<ScenePlanItem[]>(system, user)
        const plan = validateScenePlan(raw, cleanScript)
        if (plan) {
          return NextResponse.json({ scene_plan: plan, source: 'ai' })
        }
        console.warn(`scene-plan attempt ${attempt + 1}: model output failed validation`)
      } catch (apiErr) {
        console.warn(`scene-plan attempt ${attempt + 1} failed:`, apiErr)
      }
    }

    // Deterministic fallback so the user is never blocked
    return NextResponse.json({ scene_plan: buildFallbackScenePlan(cleanScript), source: 'fallback' })
  } catch (err) {
    console.error('/api/generate/scene-plan unhandled error:', err)
    return NextResponse.json({ error: 'Failed to plan scenes.' }, { status: 500 })
  }
}
