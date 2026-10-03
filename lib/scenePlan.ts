import { ScenePlanItem } from '@/types'

export const MAX_SCENES = 18

const EMOTIONS = [
  'curiosity',
  'surprise',
  'reflection',
  'urgency',
  'hope',
  'determination',
  'inspiration',
]

export function countWords(text: string): number {
  const trimmed = text.trim()
  return trimmed === '' ? 0 : trimmed.split(/\s+/).filter(Boolean).length
}

/** Allowed scene-count range for a script of the given word count. */
export function getSceneCountRange(wordCount: number): { min: number; max: number } {
  if (wordCount < 50) return { min: 3, max: 3 }
  if (wordCount <= 100) return { min: 4, max: 5 }
  if (wordCount <= 200) return { min: 6, max: 8 }
  if (wordCount <= 400) return { min: 8, max: 12 }
  return { min: 12, max: MAX_SCENES }
}

/** A single target inside the allowed range (used by the deterministic fallback planner). */
function pickTargetCount(wordCount: number): number {
  if (wordCount < 50) return 3
  if (wordCount <= 100) return wordCount <= 75 ? 4 : 5
  if (wordCount <= 200) return 6 + Math.round((2 * (wordCount - 100)) / 100)
  if (wordCount <= 400) return 8 + Math.round((4 * (wordCount - 200)) / 200)
  return Math.min(MAX_SCENES, 12 + Math.floor((wordCount - 400) / 80))
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Validates a plan returned by the model. Every script_line must be real text from the
 * script (in order), and together the lines must cover (nearly) the whole script.
 * Returns a cleaned, renumbered plan or null if the plan is unusable.
 */
export function validateScenePlan(raw: unknown, script: string): ScenePlanItem[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_SCENES) return null

  const normScript = normalize(script)
  let cursor = 0
  let covered = 0
  const plan: ScenePlanItem[] = []

  for (const item of raw) {
    if (!item || typeof item !== 'object') return null
    const { script_line, emotion, key_visual_concept } = item as Record<string, unknown>
    if (typeof script_line !== 'string' || script_line.trim() === '') return null

    const normLine = normalize(script_line)
    const idx = normScript.indexOf(normLine, cursor)
    if (idx === -1) return null // paraphrased, invented, or out of order
    cursor = idx + normLine.length
    covered += normLine.length

    const emotionWord =
      typeof emotion === 'string' && emotion.trim() !== ''
        ? emotion.trim().toLowerCase().split(/[\s/,]+/)[0]
        : EMOTIONS[plan.length % EMOTIONS.length]

    plan.push({
      scene_number: plan.length + 1,
      script_line: script_line.trim(),
      emotion: emotionWord,
      key_visual_concept:
        typeof key_visual_concept === 'string' && key_visual_concept.trim() !== ''
          ? key_visual_concept.trim()
          : `A single hero visual that embodies: "${script_line.trim()}"`,
    })
  }

  // Nothing may be skipped (allow small slack for dropped punctuation/whitespace)
  if (covered < normScript.length * 0.85) return null

  return plan
}

function wordsOf(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

function splitUnit(unit: string): [string, string] | null {
  const words = unit.split(/\s+/).filter(Boolean)
  if (words.length < 2) return null

  // Prefer splitting at punctuation close to the middle
  const mid = unit.length / 2
  let best = -1
  const re = /[,;:—–]\s+/g
  let m: RegExpExecArray | null
  while ((m = re.exec(unit)) !== null) {
    const cut = m.index + m[0].length
    if (cut > 0 && cut < unit.length && (best === -1 || Math.abs(cut - mid) < Math.abs(best - mid))) {
      best = cut
    }
  }
  if (best !== -1) {
    const a = unit.slice(0, best).trim()
    const b = unit.slice(best).trim()
    if (a && b) return [a, b]
  }

  const half = Math.ceil(words.length / 2)
  return [words.slice(0, half).join(' '), words.slice(half).join(' ')]
}

/**
 * Deterministic planner used when the model fails or returns an unusable plan.
 * Splits on sentence boundaries, then splits/merges to reach the target scene count.
 */
export function buildFallbackScenePlan(script: string): ScenePlanItem[] {
  const clean = script.trim()
  const target = pickTargetCount(countWords(clean))

  let units = clean
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)

  // Too few units: split the longest one repeatedly
  while (units.length < target) {
    let longest = -1
    let longestWords = 1
    units.forEach((u, i) => {
      const w = wordsOf(u)
      if (w > longestWords) {
        longestWords = w
        longest = i
      }
    })
    if (longest === -1) break
    const parts = splitUnit(units[longest])
    if (!parts) break
    units = [...units.slice(0, longest), parts[0], parts[1], ...units.slice(longest + 1)]
  }

  // Too many units: merge the adjacent pair with the smallest combined length
  while (units.length > target && units.length > 1) {
    let bestIdx = 0
    let bestWords = Infinity
    for (let i = 0; i < units.length - 1; i++) {
      const w = wordsOf(units[i]) + wordsOf(units[i + 1])
      if (w < bestWords) {
        bestWords = w
        bestIdx = i
      }
    }
    units = [
      ...units.slice(0, bestIdx),
      `${units[bestIdx]} ${units[bestIdx + 1]}`,
      ...units.slice(bestIdx + 2),
    ]
  }

  return units.map((line, i) => ({
    scene_number: i + 1,
    script_line: line,
    emotion: EMOTIONS[i % EMOTIONS.length],
    key_visual_concept: `A single hero visual that embodies: "${line}"`,
  }))
}
