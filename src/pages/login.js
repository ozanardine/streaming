import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import Link from 'next/link'
import Image from 'next/image'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      await login(email, password)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black bg-opacity-75 px-4">
      <div className="bg-background-dark rounded-md p-8 sm:p-10 w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <div className="w-32 h-10 relative">
            <Image
              src="/images/logo.png"
              alt="Streaming Familiar"
              fill
              className="object-contain"
            />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-6 text-center">Entrar</h1>
        
        {error && (
          <div className="bg-red-500 bg-opacity-80 text-white p-3 rounded-md mb-6 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-background-light rounded border-0 text-white focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-background-light rounded border-0 text-white focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-text-secondary">
            Não tem uma conta?{' '}
            <Link href="/signup" className="text-white hover:text-primary transition-colors">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}