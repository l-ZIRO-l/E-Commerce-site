import { NextRequest, NextResponse } from 'next/server'
import { computeCartQuote } from '@/lib/pricing'

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const items =
    body && typeof body === 'object'
      ? (body as { items?: unknown }).items
      : undefined

  const quote = await computeCartQuote(items)
  return NextResponse.json(quote)
}
