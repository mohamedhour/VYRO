import { useEffect, useMemo, useRef, useState } from 'react'
import { MessageCircle, RotateCcw, Send, Sparkles, X } from 'lucide-react'
import { useLocale } from '@/context/LocaleContext'

const ARABIC_STARTERS = [
  'ما المنتجات المتوفرة حالياً وما أسعارها؟',
  'ما المقاسات والألوان المتوفرة لديكم؟',
  'هل يتوفر الدفع عند الاستلام والتوصيل إلى جميع مدن المغرب؟',
]

const DARIJA_STARTERS = [
  'شنو كاين دابا من منتوجات وشحال الثمن ديالهم؟',
  'شنو المقاسات والألوان اللي باقين؟',
  'واش كاين الخلاص ملي توصل السلعة والتوصيل لجميع مدن المغرب؟',
]

export default function StylistChat() {
  const { locale, t } = useLocale()
  const welcomeMessage = useMemo(() => ({
    role: 'assistant',
    text: locale === 'fr'
      ? 'Bonjour ! Je suis le styliste VYRO Fashion. Je peux vous aider à trouver une tenue et la bonne taille pour votre enfant dans notre collection.'
      : locale === 'ary'
        ? 'سلام! أنا مصمم أزياء VYRO. نقدر نعاونك تلقى اللوك والمقاس المناسب لولدك ولا لبنتك من التشكيلة ديالنا.'
        : "Hi! I'm the VYRO Fashion Stylist. I can help you find the right outfit and size for your child from our available collection.",
  }), [locale])
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([welcomeMessage])
  const [history, setHistory] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [failedMessage, setFailedMessage] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, loading, open])

  useEffect(() => {
    setMessages((current) => (
      current.length === 1 && current[0].role === 'assistant'
        ? [welcomeMessage]
        : current
    ))
  }, [welcomeMessage])

  const sendMessage = async (rawMessage, { retry = false } = {}) => {
    const message = rawMessage.trim()
    if (!message || loading) return

    const priorHistory = history
    if (!retry) setMessages((current) => [...current, { role: 'user', text: message }])
    setInput('')
    setError('')
    setFailedMessage('')
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ history: priorHistory, message }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'We could not reach the stylist. Please try again.')
      if (typeof body.reply !== 'string' || !body.reply.trim()) {
        throw new Error('We did not receive a clear reply. Please try again.')
      }

      setMessages((current) => [...current, { role: 'assistant', text: body.reply }])
      setFailedMessage('')
      setHistory([
        ...priorHistory,
        { role: 'user', parts: [{ text: message }] },
        { role: 'model', parts: [{ text: body.reply }] },
      ].slice(-20))
    } catch (sendError) {
      setError(sendError.message || 'Connection problem. Make sure the chat server is running.')
      setFailedMessage(message)
    } finally {
      setLoading(false)
    }
  }

  const resetChat = () => {
    if (loading) return
    setMessages([welcomeMessage])
    setHistory([])
    setInput('')
    setError('')
    setFailedMessage('')
  }

  return (
    <div className="fixed bottom-5 right-4 z-[60] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6" dir={locale === 'ary' ? 'rtl' : 'ltr'}>
      {open && (
        <section
          role="dialog"
          aria-label={t('chat.title')}
          className="flex h-[min(620px,calc(100dvh-7.5rem))] w-[calc(100vw-2rem)] max-w-[390px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0B0E16] shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
        >
          <header className="flex items-center gap-3 border-b border-white/[0.08] bg-[#0B0E16] px-4 py-3.5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-600/15 text-rose-400">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-bold text-white">{t('chat.title')}</h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {t('chat.assistant')}
              </p>
            </div>
            <button
              type="button"
              onClick={resetChat}
              disabled={loading}
              aria-label={t('chat.reset')}
              title={t('chat.new')}
              className="grid h-9 w-9 place-items-center rounded-full text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('chat.close')}
              className="grid h-9 w-9 place-items-center rounded-full text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite" aria-relevant="additions text">
            {messages.map((message, index) => (
              <div key={`${index}-${message.role}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <p className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-6 ${message.role === 'user' ? 'rounded-tr-sm bg-rose-600 text-white' : 'rounded-tl-sm border border-white/[0.07] bg-[#131925] text-zinc-100'}`}>
                  {message.text}
                </p>
              </div>
            ))}

            {messages.length === 1 && !loading && (
              <div className="space-y-2 pt-1">
                <p className="px-1 text-[11px] font-semibold text-zinc-500">{t('chat.try')}</p>
                {(locale === 'ary' ? DARIJA_STARTERS : ARABIC_STARTERS).map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => sendMessage(starter)}
                    className={`block w-full rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2.5 text-xs leading-5 text-zinc-300 transition-colors hover:border-rose-500/40 hover:bg-rose-500/[0.07] hover:text-white ${locale === 'ary' ? 'text-right' : 'text-left'}`}
                  >
                    {starter}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="flex justify-end">
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-white/[0.07] bg-[#131925] px-4 py-3" aria-label="Stylist is typing">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-rose-400 [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-rose-400 [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-rose-400" />
                </div>
              </div>
            )}

            {error && (
              <div role="alert" className="space-y-2 rounded-xl border border-rose-500/25 bg-rose-500/[0.08] px-3 py-2.5 text-xs leading-5 text-rose-200">
                <p>{error}</p>
                {failedMessage && (
                  <button type="button" onClick={() => sendMessage(failedMessage, { retry: true })} disabled={loading} className="font-semibold text-rose-100 underline decoration-rose-300/60 underline-offset-2 hover:text-white disabled:opacity-50">
                    {t('chat.retry')}
                  </button>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              sendMessage(input)
            }}
            className="border-t border-white/[0.08] bg-[#090C13] p-3"
          >
            <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-2 transition-colors focus-within:border-rose-500/60">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    sendMessage(input)
                  }
                }}
                rows={1}
                maxLength={2000}
                placeholder={t('chat.placeholder')}
                aria-label={t('chat.type')}
                disabled={loading}
                className={`max-h-24 min-h-9 flex-1 resize-y bg-transparent px-2 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 disabled:opacity-50 ${locale === 'ary' ? 'text-right' : 'text-left'}`}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label={t('chat.send')}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-rose-600 text-white transition-colors hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-2 px-1 text-[10px] text-zinc-600">{t('chat.enter')}</p>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={open ? t('chat.close') : t('chat.open')}
        className="inline-flex h-14 items-center gap-2.5 rounded-full bg-rose-600 px-5 text-sm font-bold text-white shadow-[0_8px_30px_rgba(225,29,72,0.35)] transition-all hover:-translate-y-0.5 hover:bg-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06070B]"
      >
        {open ? <X className="h-5 w-5" aria-hidden="true" /> : <MessageCircle className="h-5 w-5" aria-hidden="true" />}
        <span>{t('chat.title')}</span>
      </button>
    </div>
  )
}
