import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { apiFetch } from '../lib/api'
import { Button } from '../components/nocturne'

const EDITOR_ID = '84a5a947-c586-4097-9a26-8f358865e96c'

function GuestContactForm() {
  const [nick, setNick] = useState('')
  const [contact, setContact] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState('')

  const submit = async () => {
    if (message.trim().length < 5) {
      setStatus('error')
      setErrorMsg('Napisz chociaż kilka słów.')
      return
    }
    setStatus('sending')
    setErrorMsg('')
    try {
      await fetch('/api/contact-guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nick, contact, message, website }),
      }).then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.message || 'Nie udało się wysłać.')
        }
      })
      setStatus('sent')
      setMessage('')
    } catch (e) {
      setStatus('error')
      setErrorMsg(e?.message || 'Nie udało się wysłać. Spróbuj ponownie.')
    }
  }

  if (status === 'sent') {
    return <p className="text-body-md text-primary-container font-semibold">Wysłane — dzięki, dam znać.</p>
  }

  const inputClass = "w-full box-border bg-surface-container border border-outline-variant/30 px-4 py-3 text-on-surface font-body text-body-md outline-none focus:border-primary-container/50"

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Twój nick lub imię (opcjonalnie)"
        value={nick}
        onChange={(e) => setNick(e.target.value)}
        className={inputClass}
      />
      <input
        type="text"
        placeholder="Kontakt zwrotny — e-mail, Telegram (opcjonalnie)"
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        className={inputClass}
      />
      <textarea
        placeholder="Wiadomość"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className={`${inputClass} min-h-[110px]`}
      />
      {/* Honeypot — hidden from real visitors, bots fill every field. */}
      <input
        type="text"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
        aria-hidden="true"
      />
      {status === 'error' && <p className="text-body-sm text-red-400">{errorMsg}</p>}
      <Button onClick={submit} disabled={status === 'sending'}>
        {status === 'sending' ? 'Wysyłanie…' : 'Wyślij'}
      </Button>
    </div>
  )
}

export function Kontakt({ user }) {
  return (
    <div className="bg-background min-h-screen text-on-surface">
      <Helmet><title>Kontakt – ExtraFun</title></Helmet>
      <div className="max-w-lg mx-auto px-6 py-10">
        <h1 className="font-display text-headline-lg mb-2">Kontakt</h1>
        <p className="text-on-surface-variant text-body-md mb-8">
          Coś do zgłoszenia, pytanie, pomysł na artykuł? Napisz — sprawdzam
          wiadomości codziennie kilka razy.
        </p>

        <div className="border border-outline-variant/20 bg-surface-container p-6 mb-4">
          <h2 className="font-display text-headline-sm mb-2">Napisz do redakcji</h2>
          {user ? (
            <>
              <p className="text-body-sm text-on-surface-variant mb-4">
                Wiadomość trafi bezpośrednio do redakcji, ze swojego konta.
              </p>
              <a href={`/wiadomosci?to=${EDITOR_ID}&name=${encodeURIComponent('Redakcja ExtraFun')}`}>
                <Button>Napisz wiadomość</Button>
              </a>
            </>
          ) : (
            <>
              <p className="text-body-sm text-on-surface-variant mb-4">
                Nie musisz się logować — wiadomość trafi bezpośrednio do redakcji.
              </p>
              <GuestContactForm />
            </>
          )}
        </div>

        <div className="border border-outline-variant/20 bg-surface-container p-6">
          <h2 className="font-display text-headline-sm mb-2">Mailowo</h2>
          <p className="text-body-sm text-on-surface-variant mb-2">Jeśli wolisz klasycznie:</p>
          <a href="mailto:redakcja@extrafun.pl" className="text-primary-container font-semibold">
            redakcja@extrafun.pl
          </a>
        </div>
      </div>
    </div>
  )
}
