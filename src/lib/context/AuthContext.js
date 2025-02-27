import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase';
import { useToast } from './ToastContext';
import * as authAPI from '../api/auth';

// Create the auth context
const AuthContext = createContext(undefined);

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { error: showError } = useToast();
  
  // Usar useRef para evitar múltiplas verificações e chamadas API
  const isCheckingAdmin = useRef(false);
  const adminCheckTimeout = useRef(null);
  
  // Check if user is admin - com proteção contra múltiplas chamadas
  const checkIfAdmin = useCallback(async (userId) => {
    if (!userId || isCheckingAdmin.current) return false;
    
    try {
      isCheckingAdmin.current = true;
      const adminStatus = await authAPI.checkAdmin(userId);
      isCheckingAdmin.current = false;
      return adminStatus;
    } catch (err) {
      console.error('Error checking admin status:', err);
      isCheckingAdmin.current = false;
      return false;
    }
  }, []);
  
  // Initialize auth state
  useEffect(() => {
    let isMounted = true;
    
    const initAuth = async () => {
      try {
        setLoading(true);
        
        // Get current session
        const session = await authAPI.getSession();
        const currentUser = session?.user || null;
        
        if (currentUser && isMounted) {
          setUser(currentUser);
          
          // Check admin status - apenas uma vez
          if (!isCheckingAdmin.current) {
            const adminStatus = await checkIfAdmin(currentUser.id);
            if (isMounted) setIsAdmin(adminStatus);
          }
        } else if (isMounted) {
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    initAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = authAPI.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      
      const currentUser = session?.user || null;
      
      if (currentUser !== user) {
        setUser(currentUser);
        
        if (!currentUser) {
          setProfile(null);
          setIsAdmin(false);
        } else {
          // Limpar qualquer verificação anterior
          if (adminCheckTimeout.current) {
            clearTimeout(adminCheckTimeout.current);
          }
          
          // Adiar a verificação para evitar múltiplas chamadas em sequência
          adminCheckTimeout.current = setTimeout(async () => {
            if (!isCheckingAdmin.current && isMounted) {
              const adminStatus = await checkIfAdmin(currentUser.id);
              if (isMounted) setIsAdmin(adminStatus);
            }
          }, 500);
        }
      }
    });
    
    return () => {
      isMounted = false;
      if (adminCheckTimeout.current) {
        clearTimeout(adminCheckTimeout.current);
      }
      subscription.unsubscribe();
    };
  }, [checkIfAdmin]);
  
  // Login function
  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      const data = await authAPI.login(email, password);
      
      setUser(data.user);
      
      // Não verificamos o status de admin aqui - deixamos o useEffect fazer isso
      // para evitar múltiplas solicitações
      
      return data;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
      throw err;
    }
  }, []);
  
  // Signup function
  const signup = useCallback(async (email, password) => {
    try {
      setError(null);
      const data = await authAPI.signup(email, password);
      return data;
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message);
      throw err;
    }
  }, []);
  
  // Logout function
  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message);
      showError('Erro ao sair da conta. Tente novamente.');
    }
  }, [showError]);
  
  // Set current profile
  const setCurrentProfile = useCallback((selectedProfile) => {
    setProfile(selectedProfile);
  }, []);
  
  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Context value
  const contextValue = {
    user,
    profile,
    isAdmin,
    loading,
    error,
    login,
    signup,
    logout,
    setCurrentProfile,
    clearError
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;