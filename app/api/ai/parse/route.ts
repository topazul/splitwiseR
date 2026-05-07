import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json()
    if (!description?.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 })
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: `You are an expense parser. Given a natural language description of a shared expense, extract structured data.
Return ONLY valid JSON with this exact schema (no markdown, no extra text):
{
  "title": "short expense title",
  "amount": 123.45,
  "category": "food|transport|home|entertainment|community|other",
  "date": "YYYY-MM-DD",
  "paidBy": "name of person who paid (or null if unclear)",
  "splits": [
    { "name": "Person Name", "amount": 30.00, "percentage": 33.3 }
  ],
  "notes": "any extra context or null"
}
Today's date is ${new Date().toISOString().split('T')[0]}.
If no date is mentioned, use today.
Split equally unless otherwise specified.
Always include the payer in the splits.`,
      messages: [{ role: 'user', content: description }]
    })

    const text = message.content.map(c => c.type === 'text' ? c.text : '').join('')
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
    return NextResponse.json(parsed)
  } catch (error: any) {
    console.error('AI parse error:', error)
    return NextResponse.json({ error: error.message ?? 'Parse failed' }, { status: 500 })
  }
}
