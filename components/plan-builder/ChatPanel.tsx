'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import type { CompPlan } from '@/types/icm-dsl'
import type { ExtractionMessage } from '@/lib/llm/plan-extractor'

type Message = {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

type Props = {
  onPlanExtracted: (plan: CompPlan, confidence: number, clarifyingQuestions?: string[]) => void
  currentPlan?: CompPlan
}

export function ChatPanel({ onPlanExtracted, currentPlan }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Describe your comp plan in plain English and I\'ll convert it to structured logic. For example: "Pay reps 8% commission on closed ARR, with a 12% accelerator above 100% quota. Monthly periods. Quota imported."',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [clarifyingQuestions, setClarifyingQuestions] = useState<string[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(text?: string) {
    const userText = text ?? input.trim()
    if (!userText || loading) return

    const userMsg: Message = { role: 'user', content: userText }
    const newMessages = [...messages.filter(m => !m.isStreaming), userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setClarifyingQuestions([])

    const assistantMsg: Message = { role: 'assistant', content: '', isStreaming: true }
    setMessages(prev => [...prev.filter(m => !m.isStreaming), userMsg, assistantMsg])

    const apiMessages: ExtractionMessage[] = newMessages
      .filter(m => m.role === 'user' || (m.role === 'assistant' && !m.isStreaming && m.content))
      .map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch('/api/plans/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, existingPlan: currentPlan }),
      })

      if (!res.ok) throw new Error('Failed to compose plan')

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const lines = decoder.decode(value).split('\n').filter(Boolean)
        for (const line of lines) {
          const event = JSON.parse(line)
          if (event.type === 'text') {
            assistantContent += event.content
            setMessages(prev => prev.map(m =>
              m.isStreaming ? { ...m, content: assistantContent } : m
            ))
          } else if (event.type === 'result') {
            const result = event.result
            if (result.type === 'plan') {
              onPlanExtracted(result.plan, result.confidence, result.clarifyingQuestions)
              if (!assistantContent) {
                assistantContent = result.confidence >= 0.85
                  ? 'Plan extracted successfully. Review the preview on the right.'
                  : 'Plan extracted with some uncertainties. Please review the notes.'
              }
              if (result.clarifyingQuestions?.length) {
                setClarifyingQuestions(result.clarifyingQuestions)
              }
            } else if (result.type === 'clarification') {
              if (!assistantContent) {
                assistantContent = result.partialUnderstanding
                  ? `I understand: ${result.partialUnderstanding}\n\nI have a few questions:`
                  : 'I need a few more details:'
              }
              setClarifyingQuestions(result.questions)
            }
            setMessages(prev => prev.map(m =>
              m.isStreaming ? { ...m, content: assistantContent, isStreaming: false } : m
            ))
          }
        }
      }
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.isStreaming
          ? { ...m, content: 'An error occurred. Please try again.', isStreaming: false }
          : m
      ))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-3 border-b border-gray-200 bg-white">
        <h2 className="text-sm font-semibold text-gray-900">Plan Builder</h2>
        <p className="text-xs text-gray-400">Describe your comp plan in plain English</p>
      </div>

      <div className="flex-1 overflow-auto px-5 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-200 text-gray-800'
            }`}>
              {msg.content || (msg.isStreaming && <Loader2 size={14} className="animate-spin" />)}
            </div>
          </div>
        ))}

        {clarifyingQuestions.length > 0 && (
          <div className="flex flex-col gap-2">
            {clarifyingQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="text-left bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 text-xs text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-5 py-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Describe your comp plan..."
            disabled={loading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}
