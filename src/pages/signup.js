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
      await signup(email, password)
      
      // Também criar registro na tabela users
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Inserir registro na tabela users
        const { error: userError } = await supabase
          .from('users')
          .insert([{ id: user.id, is_admin: false }])
          
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
    <div className="auth-container">
      <div className="auth-card">
        <h1>Criar Conta</h1>
        
        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo de 6 caracteres"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Senha</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Digite a senha novamente"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>
            Já tem uma conta? <Link href="/login">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}