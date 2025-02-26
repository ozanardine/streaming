import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const { signup } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    
    // Validar campos
    if (!email || !password || !confirmPassword) {
      setError('Todos os campos são obrigatórios')
      return
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Por favor, informe um email válido')
      return
    }
    
    // Verificar senhas
    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }
    
    // Verificar força da senha
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }
    
    setLoading(true)
    
    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (signupError) throw signupError
      
      // Também criar registro na tabela users
      if (data.user) {
        // Inserir registro na tabela users
        const { error: userError } = await supabase
          .from('users')
          .insert([{ id: data.user.id, is_admin: false }])
          
        if (userError) throw userError
      }
      
      setMessage('Conta criada com sucesso! Verifique seu email para confirmar o cadastro.')
      // Limpar campos
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      
      // Redirecionar após alguns segundos
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (error) {
      console.error('Erro ao cadastrar:', error)
      setError(error.message || 'Erro ao criar conta. Tente novamente.')
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
        
        <h1 className="text-2xl font-bold mb-6 text-center">Criar Conta</h1>
        
        {error && (
          <div className="bg-red-500 bg-opacity-80 text-white p-4 rounded-md mb-6 text-sm">
            {error}
          </div>
        )}
        
        {message && (
          <div className="bg-green-500 bg-opacity-80 text-white p-4 rounded-md mb-6 text-sm">
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
              placeholder="Mínimo de 6 caracteres"
              required
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary mb-1">
              Confirmar Senha
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 bg-background-light rounded border-0 text-white focus:ring-2 focus:ring-primary"
              placeholder="Digite a senha novamente"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-text-secondary">
            Já tem uma conta?{' '}
            <Link href="/login" className="text-white hover:text-primary transition-colors">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}