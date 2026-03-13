import { Router, Request, Response } from 'express'
import type { ChatMessage } from '../types.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// Stub: replace with real AI (OpenAI, etc.) when API key is configured
async function getAiResponse(messages: ChatMessage[]): Promise<ChatMessage> {
  const apiKey = process.env.OPENAI_API_KEY
  if (apiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
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
  // Stub response when no API key
  const lastUser = messages.filter((m) => m.role === 'user').pop()
  const reply = lastUser
    ? `You said: "${lastUser.content}". This is a stub response. Set OPENAI_API_KEY for real AI.`
    : 'Send a message to get a response.'
  return { role: 'assistant', content: reply }
}

router.post('/', requireAuth, async (req: Request, res: Response) => {
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
