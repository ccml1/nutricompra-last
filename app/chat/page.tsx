'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Menu, MessageCircle, RotateCcw, Send, Square } from 'lucide-react'
import { AppSidebar } from '@/components/app/app-sidebar'
import { Button } from '@/components/ui/button'
import { usePlan } from '@/hooks/use-plan'
import { buildChatContext } from '@/lib/chat/context'
import { pressableClass } from '@/lib/pressable'
import { askNutritionChat } from '@/services/data-service'
import type { ChatMessage } from '@/types'

/** Preguntas de ejemplo para empezar, sobre los datos que el asistente conoce. */
const suggestions = [
  '¿Cuánta proteína tiene la quinua?',
  '¿Mi menú del jueves está balanceado?',
  '¿Qué cambio en mi menú para comer menos grasa?',
  '¿Me alcanza el presupuesto esta semana?',
]

export default function ChatPage() {
  const { plan, shoppingList, budget } = usePlan()
  const context = useMemo(
    () => buildChatContext(plan, shoppingList, budget.estimatedTotal),
    [plan, shoppingList, budget.estimatedTotal],
  )
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [answering, setAnswering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abort = useRef<AbortController | null>(null)
  const bottom = useRef<HTMLDivElement>(null)

  // La conversación baja sola mientras llega la respuesta.
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' })
  }, [messages])

  // Si se sale de la página a mitad de una respuesta, se corta.
  useEffect(() => () => abort.current?.abort(), [])

  const send = async (conversation: ChatMessage[]) => {
    setError(null)
    setAnswering(true)
    setMessages([...conversation, { role: 'assistant', content: '' }])
    const controller = new AbortController()
    abort.current = controller
    try {
      await askNutritionChat(
        conversation,
        context,
        (text) =>
          setMessages((current) => {
            const last = current.at(-1)!
            return [...current.slice(0, -1), { ...last, content: last.content + text }]
          }),
        controller.signal,
      )
    } catch (problem) {
      if (!controller.signal.aborted) {
        console.error('El chat no respondió:', problem)
        setError(problem instanceof Error ? problem.message : 'No se pudo obtener una respuesta.')
        // Sin respuesta, la burbuja vacía del asistente se quita.
        setMessages((current) => (current.at(-1)?.content ? current : current.slice(0, -1)))
      }
    } finally {
      setAnswering(false)
      abort.current = null
    }
  }

  const ask = (question: string) => {
    const text = question.trim()
    if (!text || answering) return
    setDraft('')
    void send([...messages, { role: 'user', content: text }])
  }

  const retry = () => {
    // Se vuelve a enviar la conversación hasta la última pregunta del usuario.
    const lastUser = messages.findLastIndex((message) => message.role === 'user')
    if (lastUser >= 0) void send(messages.slice(0, lastUser + 1))
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <AppSidebar />
      <main className="flex min-h-screen flex-col lg:pl-64">
        <header className="border-b bg-background/90 px-5 py-5 backdrop-blur lg:px-10">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <Button variant="outline" size="icon" className="lg:hidden" aria-label="Abrir menú">
              <Menu data-icon="inline-start" />
            </Button>
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Chat nutricional</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">Pregunta sobre tu menú, tus compras y los alimentos del catálogo</p>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col px-5 py-6 lg:px-10">
          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4">
            {messages.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-5 py-10 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MessageCircle className="size-6" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-base font-semibold">¿En qué te ayudo con tu alimentación?</p>
                  <p className="mt-1 text-sm text-muted-foreground">Conozco tu menú semanal, tu lista de compras, tu presupuesto y la tabla peruana de alimentos.</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => ask(suggestion)}
                      className={`min-h-9 rounded-full bg-card px-4 text-sm font-medium text-foreground/80 shadow-sm ring-1 ring-border/70 hover:text-foreground hover:shadow-md ${pressableClass}`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div role="log" aria-live="polite" aria-label="Conversación" className="flex flex-1 flex-col gap-3">
                {messages.map((message, i) => (
                  <div key={i} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <p
                      className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
                        message.role === 'user'
                          ? 'rounded-br-md bg-primary text-primary-foreground'
                          : 'rounded-bl-md bg-card shadow-sm ring-1 ring-border/60'
                      }`}
                    >
                      {message.content || <span className="text-muted-foreground">Escribiendo…</span>}
                    </p>
                  </div>
                ))}
                {error && (
                  <p className="flex flex-wrap items-center gap-2 text-sm text-destructive">
                    {error}
                    <button type="button" onClick={retry} className="inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline">
                      <RotateCcw className="size-3.5" aria-hidden="true" /> Reintentar
                    </button>
                  </p>
                )}
                <div ref={bottom} />
              </div>
            )}

            <form
              onSubmit={(event) => {
                event.preventDefault()
                ask(draft)
              }}
              className="sticky bottom-4 flex items-end gap-2 rounded-2xl bg-card p-2 shadow-md ring-1 ring-border/70"
            >
              <label htmlFor="chat-question" className="sr-only">
                Tu pregunta
              </label>
              <textarea
                id="chat-question"
                rows={1}
                value={draft}
                maxLength={1000}
                placeholder="Escribe tu pregunta…"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  // Enter envía; Shift + Enter hace un salto de línea.
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    ask(draft)
                  }
                }}
                className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-base outline-none placeholder:text-muted-foreground"
              />
              {answering ? (
                <Button type="button" variant="outline" size="icon" className="size-11 rounded-xl" aria-label="Detener la respuesta" onClick={() => abort.current?.abort()}>
                  <Square data-icon="inline-start" />
                </Button>
              ) : (
                <Button type="submit" size="icon" className="size-11 rounded-xl" aria-label="Enviar" disabled={!draft.trim()}>
                  <Send data-icon="inline-start" />
                </Button>
              )}
            </form>

            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              Respuestas de un modelo de lenguaje de Hugging Face. Puede equivocarse y no reemplaza a un nutricionista.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
