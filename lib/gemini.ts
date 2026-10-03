import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai'

const API_KEY = process.env.GEMINI_API_KEY
if (!API_KEY) {
  console.warn('GEMINI_API_KEY is not set in environment variables')
}

const genAI = new GoogleGenerativeAI(API_KEY || '')

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
]

// Working active models in priority order (fastest & most stable first)
const CANDIDATE_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.8-flash',
  'gemini-3.5-flash',
]

export async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  let lastError: unknown = null

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        safetySettings,
      })

      const result = await model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
        ],
      })

      const text = result.response.text()
      if (text && text.trim().length > 0) {
        return text.trim()
      }
    } catch (err) {
      console.warn(`Model ${modelName} failed, falling back:`, (err as Error)?.message || err)
      lastError = err
    }
  }

  throw lastError || new Error('All Gemini candidate models failed')
}

export async function callGeminiJSON<T>(systemPrompt: string, userPrompt: string): Promise<T> {
  const raw = await callGemini(systemPrompt, userPrompt)
  
  // Clean markdown fences
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  try {
    return JSON.parse(cleaned) as T
  } catch (parseErr) {
    const jsonMatch = cleaned.match(/(\[[\s\S]*\]|\{[\s\S]*\})/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]) as T
    }
    throw parseErr
  }
}
