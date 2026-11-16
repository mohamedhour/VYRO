import React, { useState } from 'react'
import { CheckCircle2, LogOut, ShieldCheck, UserRound, X } from 'lucide-react'
import { CustomerSession, loginCustomer, registerCustomer } from '../lib/customerAuth'

interface AccountModalProps {
  session: CustomerSession | null
  onClose: () => void
  onAuthenticated: (session: CustomerSession) => void
  onLogout: () => void
}

export const AccountModal: React.FC<AccountModalProps> = ({ session, onClose, onAuthenticated, onLogout }) => {
  const [mode, setMode] = useState<'register' | 'login'>('register')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Use a password with at least 8 characters.')
      return
    }

    setBusy(true)
    try {
      const result = mode === 'register'
        ? await registerCustomer({ fullName, email, password })
        : await loginCustomer({ email, password })
      onAuthenticated(result)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not sign in right now.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section role="dialog" aria-modal="true" aria-labelledby="account-title" className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0B0E16] p-6 shadow-2xl sm:p-8">
        <button type="button" onClick={onClose} aria-label="Close account" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-white/10 text-zinc-400 transition hover:bg-white/10 hover:text-white">
          <X className="h-4 w-4" />
        </button>

        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400"><UserRound className="h-5 w-5" /></span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-500">VYRO MEMBERS</p>
            <h2 id="account-title" className="mt-1 font-product text-xl font-extrabold uppercase text-white">Your account</h2>
          </div>
        </div>

        {session ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
              <p className="font-semibold text-white">{session.profile.fullName}</p>
              <p className="mt-1 text-sm text-zinc-400">{session.profile.email}</p>
            </div>
            <div className="flex gap-3 rounded-xl border border-rose-500/20 bg-rose-500/[0.07] p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
              <div>
                <p className="text-sm font-semibold text-white">{session.profile.discountedOrdersRemaining > 0 ? `20% off your next ${session.profile.discountedOrdersRemaining} order${session.profile.discountedOrdersRemaining === 1 ? '' : 's'}` : 'Welcome offer used'}</p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">{session.profile.discountedOrdersRemaining > 0 ? 'Your first five account orders each get 20% off.' : 'You have used all five welcome discounts.'}</p>
              </div>
            </div>
            <button type="button" onClick={onLogout} className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"><LogOut className="h-4 w-4" /> Sign out</button>
          </div>
        ) : (
          <>
            <div className="mb-5 grid grid-cols-2 rounded-lg border border-white/10 bg-black/20 p-1" role="tablist" aria-label="Account action">
              {(['register', 'login'] as const).map((choice) => (
                <button key={choice} type="button" role="tab" aria-selected={mode === choice} onClick={() => { setMode(choice); setError('') }} className={`rounded-md px-3 py-2 text-xs font-bold uppercase tracking-wider transition ${mode === choice ? 'bg-rose-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
                  {choice === 'register' ? 'Create account' : 'Sign in'}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === 'register' && (
                <label className="block text-xs font-medium text-zinc-300">Full name
                  <input required minLength={2} maxLength={120} value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" className="mt-1.5 h-11 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-rose-500" placeholder="Your name" />
                </label>
              )}
              <label className="block text-xs font-medium text-zinc-300">Email
                <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="mt-1.5 h-11 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-rose-500" placeholder="you@example.com" />
              </label>
              <label className="block text-xs font-medium text-zinc-300">Password
                <input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} className="mt-1.5 h-11 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-rose-500" placeholder="At least 8 characters" />
              </label>
              {mode === 'register' && (
                <label className="block text-xs font-medium text-zinc-300">Confirm password
                  <input required type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" className="mt-1.5 h-11 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-rose-500" placeholder="Enter it again" />
                </label>
              )}
              {error && <p role="alert" className="text-xs leading-relaxed text-red-400">{error}</p>}
              <button type="submit" disabled={busy} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 text-sm font-bold text-white transition hover:bg-rose-500 disabled:cursor-wait disabled:opacity-60">
                {session ? <CheckCircle2 className="h-4 w-4" /> : null}{busy ? 'Please wait…' : mode === 'register' ? 'Create account · get 20% off' : 'Sign in'}
              </button>
              {mode === 'register' && <p className="text-center text-[11px] leading-relaxed text-zinc-500">One account per email. Get 20% off each of your first five orders.</p>}
            </form>
          </>
        )}
      </section>
    </div>
  )
}
