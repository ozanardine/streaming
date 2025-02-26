import { useState, useEffect, createContext, useContext } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Verificar se o usuário é admin
  const checkIfAdmin = async (userId) => {
    if (!userId) return false
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('Erro ao verificar status de admin:', error)
        return false
      }
      
      return data?.is_admin || false
    } catch (err) {
      console.error('Erro ao verificar status de admin:', err)
      return false
    }
  }

  useEffect(() => {
    const setSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const currentUser = session?.user || null
      setUser(currentUser)
      
      if (currentUser) {
        // Verificar se é admin quando o usuário é carregado
        const adminStatus = await checkIfAdmin(currentUser.id)
        setIsAdmin(adminStatus)
      } else {
        setIsAdmin(false)
      }
      
      setLoading(false)
    }
    
    setSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user || null
      setUser(currentUser)
      
      if (!currentUser) {
        setProfile(null)
        setIsAdmin(false)
      } else {
        // Verificar se é admin quando o usuário muda
        const adminStatus = await checkIfAdmin(currentUser.id)
        setIsAdmin(adminStatus)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    
    setUser(data.user)
    
    // Verificar se o usuário que acabou de fazer login é admin
    const adminStatus = await checkIfAdmin(data.user.id)
    setIsAdmin(adminStatus)
    
    router.push('/')
  }

  const signup = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return data
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setIsAdmin(false)
    router.push('/login')
  }

  const setCurrentProfile = (selectedProfile) => {
    setProfile(selectedProfile)
    router.push('/browse')
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      isAdmin,
      loading,
      login,
      signup,
      logout,
      setCurrentProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}