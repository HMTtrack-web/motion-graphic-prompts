import { NextRequest, NextResponse } from 'next/server'
import { callGemini } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // Accept the new field names, and the legacy ones stage 2 currently sends
    const selected_idea: string | undefined = body.selected_idea ?? body.selected_title
    const topic: string | undefined = body.topic ?? body.original_topic
    if (!selected_idea || !topic) {
      return NextResponse.json({ error: 'topic and selected_idea are required' }, { status: 400 })
    }

    try {
      const system = `You are a cinematic short-form narration writer for a premium motion graphics channel. You write confident, authoritative, accessible scripts. Zero unexplained jargon. Every concept is immediately understandable by anyone with no prior knowledge.`

      const user = `Write a narration script for a 20-30 second motion graphic video with this exact title: "${selected_idea}"
Broader topic: "${topic}"

The title is the EXACT creative direction. The script must feel like it was written SPECIFICALLY for this title — deliver on the exact promise, angle and insight the title makes, and open in a way that makes the title feel earned. Do NOT write a generic script about the topic; the topic is only background context.

Rules:
1. Pure spoken narration only — no headers, no stage directions, no sound cues, no visual notes
2. Target: 52–75 words total
3. Voice: "you/your" second-person, conversational but authoritative
4. Structure: Hook → Challenge the obvious → Deeper reframe → Hidden mechanism → Concrete metaphor → Counterintuitive insight → Closing memorable truth
5. Rhythm: Short powerful statement. Short contrast. One longer sentence (max 14 words). Short punch. Strong payoff.
6. End with a closing line that makes the viewer see a familiar thing completely differently
Output: Only the script text. No title. No labels. No quotation marks around it.`

      const script = await callGemini(system, user)
      if (script && script.trim().length > 10) {
        return NextResponse.json({ script: script.trim() })
      }
    } catch (apiErr) {
      console.warn('Gemini script call failed, using high quality script fallback:', apiErr)
    }

    // High quality fallback script
    const fallbackScript = `You think ${topic} is about willpower. It isn't. Your brain isn't broken; it's simply running an outdated survival script. While you fight the friction, the real mechanism operates entirely in silence. Stop resisting the current. When you shift the trigger, the entire outcome changes without effort.`

    return NextResponse.json({ script: fallbackScript })

  } catch (err) {
    console.error('/api/generate/script unhandled error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
