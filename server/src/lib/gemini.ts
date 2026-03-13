/**
 * Shared Gemini API helpers for chat, vision (image), and structured extraction.
 */

function getGeminiKey(): string | null {
  return process.env.GEMINI_API_KEY ?? null
}

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

export type GeminiPart = { text?: string } | { inlineData?: { mimeType: string; data: string } }

/** Call Gemini with text-only contents (chat style). Returns raw text. */
export async function callGeminiText(contents: Array<{ role: 'user' | 'model'; parts: GeminiPart[] }>): Promise<string> {
  const key = getGeminiKey()
  if (!key) throw new Error('GEMINI_API_KEY not set')
  const res = await fetch(`${GEMINI_BASE}/gemini-2.5-flash:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents,
      generationConfig: { maxOutputTokens: 2048, responseMimeType: 'text/plain' },
    }),
  })
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText))
  const data = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''
}

/** Call Gemini with one image + text prompt (e.g. receipt extraction). Returns raw text. */
export async function callGeminiWithImage(
  imageBase64: string,
  mimeType: string,
  textPrompt: string
): Promise<string> {
  const key = getGeminiKey()
  if (!key) throw new Error('GEMINI_API_KEY not set')
  const res = await fetch(`${GEMINI_BASE}/gemini-2.5-flash:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: imageBase64 } },
            { text: textPrompt },
          ],
        },
      ],
      generationConfig: { maxOutputTokens: 2048, responseMimeType: 'application/json' },
    }),
  })
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText))
  const data = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '{}'
}
