import { stripe } from '@/lib/stripe/client'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import type Stripe from 'stripe'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return new Response('Missing stripe-signature', { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return new Response('Webhook signature verification failed', { status: 400 })
  }

  const data = event.data.object as Stripe.Subscription & { customer: string }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      await supabase
        .from('organizations')
        .update({
          stripe_subscription_id: data.id,
          subscription_status: data.status,
          plan_tier: extractTier(data),
        })
        .eq('stripe_customer_id', data.customer)
      break
    }
    case 'customer.subscription.deleted': {
      await supabase
        .from('organizations')
        .update({ subscription_status: 'canceled' })
        .eq('stripe_customer_id', data.customer)
      break
    }
  }

  return new Response('ok')
}

function extractTier(subscription: Stripe.Subscription): string {
  const priceId = subscription.items.data[0]?.price.id
  const { STRIPE_PRICES } = require('@/lib/stripe/client')
  if (priceId === STRIPE_PRICES.starter) return 'starter'
  if (priceId === STRIPE_PRICES.growth) return 'growth'
  if (priceId === STRIPE_PRICES.pro) return 'pro'
  return 'starter'
}
