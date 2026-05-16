import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('comp_plans')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  const { data: userData } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!userData) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('comp_plans')
    .insert({
      org_id: userData.org_id,
      name: body.name,
      dsl: body.dsl,
      effective_from: body.effectiveFrom,
      effective_to: body.effectiveTo,
      period: body.period ?? 'monthly',
      status: body.status ?? 'draft',
      source_prompts: body.sourcePrompts ?? [],
      llm_confidence: body.llmConfidence,
      requires_review: body.requiresReview ?? false,
      review_notes: body.reviewNotes ?? [],
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
