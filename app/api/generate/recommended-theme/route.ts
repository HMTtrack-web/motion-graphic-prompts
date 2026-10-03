import { NextRequest, NextResponse } from 'next/server'
import { callGemini } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const { topic, selected_idea, script } = await req.json()
    if (!script || typeof script !== 'string') {
      return NextResponse.json({ error: 'script is required' }, { status: 400 })
    }

    const system = `You are a creative director who matches visual aesthetic styles to script content.`

    // topic / selected_idea are used when provided (always sent by the app now)
    const context = [
      typeof topic === 'string' && topic.trim() ? `Topic: '${topic.trim()}'` : '',
      typeof selected_idea === 'string' && selected_idea.trim() ? `Chosen video title: '${selected_idea.trim()}'` : '',
    ]
      .filter(Boolean)
      .join('\n')

    const user = `${context ? `${context}\n` : ''}Video script: '${script.trim()}'

Considering the topic, the chosen title, and the script together (their subject matter, tone and emotional feel), which visual theme suits this video best? Reply with only one word: Editorial, Technical, or Academic.`

    const raw = await callGemini(system, user)
    const lower = raw.toLowerCase().trim()
    let theme: 'Editorial' | 'Technical' | 'Academic' = 'Editorial'
    if (lower.includes('technical')) theme = 'Technical'
    else if (lower.includes('academic')) theme = 'Academic'
    else theme = 'Editorial'

    return NextResponse.json({ theme })
  } catch (err) {
    console.error('/api/generate/recommended-theme error:', err)
    return NextResponse.json(
      { error: 'Failed to determine recommended theme.' },
      { status: 500 }
    )
  }
}
