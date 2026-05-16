import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { planId, periodStart, periodEnd } = await request.json()

  const { data: userData } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!userData) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: run, error } = await supabase
    .from('calculation_runs')
    .insert({
      org_id: userData.org_id,
      plan_id: planId,
      period_start: periodStart,
      period_end: periodEnd,
      triggered_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // TODO: trigger Supabase Edge Function to run calculations async
  // await supabase.functions.invoke('run-calculation', { body: { runId: run.id } })

  return NextResponse.json({ runId: run.id, status: 'pending' }, { status: 201 })
}
