import { createContext, useState, useEffect, useCallback } from 'react';
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
  
  // Check if user is admin
  const checkIfAdmin = useCallback(async (userId) => {
    if (!userId) return false;
    
    try {
      return await authAPI.checkAdmin(userId);
    } catch (err) {
      console.error('Error checking admin status:', err);
      return false;
    }
  }, []);
  
  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        
        // Get current session
        const session = await authAPI.getSession();
        const currentUser = session?.user || null;
        
        if (currentUser) {
          setUser(currentUser);
          
          // Check admin status
          const adminStatus = await checkIfAdmin(currentUser.id);
          setIsAdmin(adminStatus);
        } else {
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = authAPI.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user || null;
      
      if (currentUser !== user) {
        setUser(currentUser);
        
        if (!currentUser) {
          setProfile(null);
          setIsAdmin(false);
        } else {
          // Check admin status on auth state change
          const adminStatus = await checkIfAdmin(currentUser.id);
          setIsAdmin(adminStatus);
        }
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [checkIfAdmin, user, showError]);
  
  // Login function
  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      const data = await authAPI.login(email, password);
      
      setUser(data.user);
      
      // Check admin status
      const adminStatus = await checkIfAdmin(data.user.id);
      setIsAdmin(adminStatus);
      
      return data;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
      throw err;
    }
  }, [checkIfAdmin]);
  
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