import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { messages, dormContext } = await req.json()

    const model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
      systemInstruction: `You are the assistant for DormCheck, where students review college dorms.
Help students figure out which dorm fits them. Ask about what matters to them — AC, noise, walk to class,
social vs quiet — and point them toward schools and buildings in the list below.
Be concise and specific. Two or three sentences unless they ask for more.
Universities currently on DormCheck: ${dormContext || 'none yet'}.
If they ask about a school not in that list, say it isn't on DormCheck yet and invite them to add a dorm.`,
    })

    const prior = messages.slice(0, -1)
    const firstUser = prior.findIndex((m: { role: string }) => m.role === 'user')
    const history =
      firstUser === -1
        ? []
        : prior.slice(firstUser).map((m: { role: string; text: string }) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }],
          }))

    const chat = model.startChat({ history })
    const result = await chat.sendMessage(messages[messages.length - 1].text)

    return NextResponse.json({ text: result.response.text() })
  } catch (err) {
    console.error('Gemini error:', err)
    return NextResponse.json(
      { text: "I couldn't reach the assistant just then. Try again in a moment." },
      { status: 500 }
    )
  }
}