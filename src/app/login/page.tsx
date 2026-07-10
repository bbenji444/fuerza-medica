'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) { 
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Correo o contraseña incorrectos')
      setLoading(false)
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F4F8FF'
    }}>
      <form onSubmit={handleLogin} style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        width: '380px'
      }}>
        <Image
          src="/logo fuerza medica.jpg"
          alt="Fuerza Médica"
          width={100}
          height={105}
          style={{ width: '100px', height: 'auto', display: 'block', margin: '0 auto 16px' }}
        />

        <h1 style={{ color: '#0D1B3E', fontSize: '22px', marginBottom: '8px', textAlign: 'center' }}>
          Fuerza Médica
        </h1>
        <p style={{ color: '#888', fontSize: '13px', marginBottom: '24px', textAlign: 'center' }}>
          Panel de administración
        </p>

        <label style={{ fontSize: '13px', color: '#0D1B3E', fontWeight: 600 }}>Correo</label>
        <input
          type="email"
          name="email"
          id="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: '100%', padding: '10px', marginTop: '4px', marginBottom: '16px',
            border: '1px solid #E0E8F5', borderRadius: '6px', fontSize: '14px'
          }}
        />

        <label style={{ fontSize: '13px', color: '#0D1B3E', fontWeight: 600 }}>Contraseña</label>
        <input
          type="password"
          name="password"
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: '100%', padding: '10px', marginTop: '4px', marginBottom: '16px',
            border: '1px solid #E0E8F5', borderRadius: '6px', fontSize: '14px'
          }}
        />

        {error && (
          <p style={{ color: '#C0392B', fontSize: '13px', marginBottom: '12px' }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '12px', backgroundColor: '#1A6DD4',
            color: 'white', border: 'none', borderRadius: '6px',
            fontSize: '14px', fontWeight: 600, cursor: 'pointer'
          }}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}