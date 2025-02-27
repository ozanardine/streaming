import { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)
  const router = useRouter()

  // Enhanced admin status check with error handling
  const checkIfAdmin = useCallback(async (userId) => {
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
  }, [])

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true)
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession()
        const currentUser = session?.user || null
        
        if (currentUser) {
          setUser(currentUser)
          
          // Check admin status
          const adminStatus = await checkIfAdmin(currentUser.id)
          setIsAdmin(adminStatus)
        } else {
          setUser(null)
          setProfile(null)
          setIsAdmin(false)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        setAuthError(error.message)
      } finally {
        setLoading(false)
      }
    }
    
    initAuth()
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user || null
      
      if (currentUser !== user) {
        setUser(currentUser)
        
        if (!currentUser) {
          setProfile(null)
          setIsAdmin(false)
        } else {
          // Check admin status on auth state change
          const adminStatus = await checkIfAdmin(currentUser.id)
          setIsAdmin(adminStatus)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [checkIfAdmin])

  // Login function with enhanced error handling
  const login = useCallback(async (email, password) => {
    try {
      setAuthError(null)
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      
      if (error) throw error
      
      setUser(data.user)
      
      // Check admin status
      const adminStatus = await checkIfAdmin(data.user.id)
      setIsAdmin(adminStatus)
      
      router.push('/')
      return data
    } catch (error) {
      console.error('Login error:', error)
      setAuthError(error.message)
      throw error
    }
  }, [checkIfAdmin, router])

  // Signup function with enhanced error handling
  const signup = useCallback(async (email, password) => {
    try {
      setAuthError(null)
      const { data, error } = await supabase.auth.signUp({ email, password })
      
      if (error) throw error
      
      return data
    } catch (error) {
      console.error('Signup error:', error)
      setAuthError(error.message)
      throw error
    }
  }, [])

  // Logout function
  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      setIsAdmin(false)
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      setAuthError(error.message)
    }
  }, [router])

  // Set current profile with memoization
  const setCurrentProfile = useCallback((selectedProfile) => {
    setProfile(selectedProfile)
    if (selectedProfile) {
      router.push('/browse')
    }
  }, [router])

  // Memoize auth context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    profile,
    isAdmin,
    loading,
    error: authError,
    login,
    signup,
    logout,
    setCurrentProfile,
    clearError: () => setAuthError(null)
  }), [user, profile, isAdmin, loading, authError, login, signup, logout, setCurrentProfile])

  return (
    <AuthContext.Provider value={contextValue}>
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