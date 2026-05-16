import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export const STRIPE_PRICES = {
  starter: process.env.STRIPE_PRICE_STARTER_MONTHLY!,
  growth: process.env.STRIPE_PRICE_GROWTH_MONTHLY!,
  pro: process.env.STRIPE_PRICE_PRO_MONTHLY!,
} as const

export type PlanTier = keyof typeof STRIPE_PRICES

export const PLAN_LIMITS = {
  starter: { seats: 10, plans: 3 },
  growth: { seats: 50, plans: 10 },
  pro: { seats: 500, plans: 999 },
} as const
