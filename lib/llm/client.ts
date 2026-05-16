import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const MODEL = 'claude-sonnet-4-6'

// Prompt caching: mark static blocks as ephemeral to reduce cost on repeated calls
export const CACHE_CONTROL = { type: 'ephemeral' } as const
