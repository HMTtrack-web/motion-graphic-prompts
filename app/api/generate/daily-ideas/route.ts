import { NextResponse } from 'next/server'
import { callGeminiJSON } from '@/lib/gemini'

const DEFAULT_DAILY_IDEAS = [
  "The Truth About Why You Can't Focus Anymore",
  "Why Staying Consistent Feels So Hard",
  "Nobody Tells You How Apps Exploit Your Brain",
  "The Hidden Cost of Cheap Dopamine",
  "The Real Reason You Buy Things You Don't Need",
]

export async function GET() {
  try {
    const system = ``

    const user = `Today is ${new Date().toDateString()}.
You are a viral content curator who studies what is trending RIGHT NOW
in human psychology, finance, productivity, relationships, and social media.

Generate 5 video topic titles that feel like they were written TODAY
by a top creator who deeply understands human behavior.

STRICT RULES:
- Each title must cover a COMPLETELY DIFFERENT life domain:
  pick 5 from: money mindset, attention economy, social validation,
  habit formation, relationship dynamics, career psychology,
  digital addiction, emotional intelligence, status signaling,
  decision making, fear of failure, identity and self-image
- BANNED words in titles: 'Hidden', 'Real Truth', 'Secret', 'Cost of',
  'Nobody Talks'
- Each title must feel SPECIFIC and INSIGHTFUL, not generic
- Titles must make someone stop scrolling because they feel personally called out
- Write like a human creator, not an AI filling blanks
- Maximum 9 words per title
- Each title must trigger a DIFFERENT emotion across the 5

Output: a valid JSON array of exactly 5 strings. Nothing else.`

    const ideas = await callGeminiJSON<string[]>(system, user)

    if (!Array.isArray(ideas) || ideas.length === 0) {
      return NextResponse.json({ ideas: DEFAULT_DAILY_IDEAS })
    }

    return NextResponse.json({ ideas: ideas.slice(0, 5) })
  } catch (err) {
    console.warn('/api/generate/daily-ideas using default fallback ideas:', err)
    return NextResponse.json({ ideas: DEFAULT_DAILY_IDEAS })
  }
}
