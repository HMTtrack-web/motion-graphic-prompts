import { NextRequest, NextResponse } from 'next/server'
import { callGeminiJSON } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json()
    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    const trimmedTopic = topic.trim()

    try {
      const system = ``

      const user = `You are a viral short-form video strategist with deep knowledge of
human psychology and content trends. The user's topic is: '${trimmedTopic}'

Before writing titles, think deeply:
- What is the most COUNTERINTUITIVE truth about '${trimmedTopic}'?
- What do 90% of people completely misunderstand about '${trimmedTopic}'?
- What HIDDEN MECHANISM drives '${trimmedTopic}' that nobody talks about?
- What EMOTION does '${trimmedTopic}' secretly trigger — fear, shame, hope?
- What would make someone watching say 'I never thought of it that way'?

Now generate 5 viral video titles about '${trimmedTopic}' specifically.

STRICT RULES:
- Never use fill-in-blank templates like 'The Hidden Cost of ___'
- Every title must be written as if a top human creator spent 30 minutes
  thinking ONLY about '${trimmedTopic}'
- Each title must reveal a specific insight unique to '${trimmedTopic}'
- Titles must make the viewer question something they assumed was true
- Each title must be emotionally different (curiosity / fear / regret /
  surprise / hope — one emotion per title)
- Maximum 9 words per title
- Zero generic words: 'Hidden', 'Real', 'Truth', 'Secret' are BANNED
- Titles must feel specific, not broad

Output: a valid JSON array of exactly 5 strings. Nothing else.`

      const ideas = await callGeminiJSON<string[]>(system, user)

      if (Array.isArray(ideas) && ideas.length >= 3) {
        return NextResponse.json({ ideas: ideas.slice(0, 5) })
      }
    } catch (apiErr) {
      console.warn('Gemini ideas call failed, using formula generator fallback:', apiErr)
    }

    // High quality fallback formula titles so the user is never blocked
    const fallbackIdeas = [
      `The Truth About ${trimmedTopic}`,
      `Why ${trimmedTopic} Feels So Hard`,
      `Nobody Tells You This About ${trimmedTopic}`,
      `The Hidden Cost of ${trimmedTopic}`,
      `The Real Reason Behind ${trimmedTopic}`,
    ]

    return NextResponse.json({ ideas: fallbackIdeas })
  } catch (err) {
    console.error('/api/generate/ideas unhandled error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
