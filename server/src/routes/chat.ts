import { Router, Request, Response } from 'express'
import type { ChatMessage } from '../types.js'

const router = Router()

/** Prefer Gemini when GEMINI_API_KEY is set; else OpenAI; else stub */
async function getAiResponse(messages: ChatMessage[]): Promise<ChatMessage> {
  const geminiKey = process.env.GEMINI_API_KEY
  if (geminiKey) {
    try {
      const contents = messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))
      const res = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': geminiKey,
          },
          body: JSON.stringify({
            contents,
            generationConfig: { maxOutputTokens: 500 },
          }),
        }
      )
      if (!res.ok) {
        const err = await res.text()
        throw new Error(err || res.statusText)
      }
      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
      }
      const text =
        data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? 'No response.'
      return { role: 'assistant', content: text }
    } catch (e) {
      console.error('Gemini error:', e)
      return {
        role: 'assistant',
        content: `AI is temporarily unavailable: ${e instanceof Error ? e.message : 'Unknown error'}. Please try again later.`,
      }
    }
  }

  const openaiKey = process.env.OPENAI_API_KEY
  if (openaiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          max_tokens: 500,
        }),
      })
      if (!res.ok) {
        const err = await res.text()
        throw new Error(err || res.statusText)
      }
      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
      const content = data.choices?.[0]?.message?.content ?? 'No response.'
      return { role: 'assistant', content }
    } catch (e) {
      console.error('OpenAI error:', e)
      return {
        role: 'assistant',
        content: `AI is temporarily unavailable: ${e instanceof Error ? e.message : 'Unknown error'}. Please try again later.`,
      }
    }
  }

  const lastUser = messages.filter((m) => m.role === 'user').pop()
  const reply = lastUser
    ? `You said: "${lastUser.content}". This is a stub response. Set GEMINI_API_KEY or OPENAI_API_KEY in the server .env for real AI.`
    : 'Send a message to get a response.'
  return { role: 'assistant', content: reply }
}

router.post('/', async (req: Request, res: Response) => {
  const { messages } = req.body as { messages: ChatMessage[] }
  try {
    const message = await getAiResponse(messages)
    res.json({ message })
  } catch (err) {
    console.error('Chat error:', err)
    res.status(500).json({
      message: err instanceof Error ? err.message : 'Chat request failed',
    })
  }
})

export default router
