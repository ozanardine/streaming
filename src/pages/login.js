import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const { login, user } = useAuth()
  const router = useRouter()
  
  // Verificar se há mensagem de redirecionamento
  useEffect(() => {
    if (router.query.message === 'check-email') {
      setMessage('Por favor, verifique seu email para confirmar o cadastro.')
    }
  }, [router.query])
  
  // Redirecionar se já estiver logado
  useEffect(() => {
    if (user) {
      router.push('/')
    }
  }, [user, router])

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
              alt="Zanflix"
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
        
        {message && (
          <div className="bg-green-500 bg-opacity-80 text-white p-3 rounded-md mb-6 text-sm">
            {message}
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
              placeholder="seu@email.com"
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
              placeholder="Sua senha"
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