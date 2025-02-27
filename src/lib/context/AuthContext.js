import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase';
import { useToast } from './ToastContext';

// Create the auth context
const AuthContext = createContext(undefined);

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);
  const { error: showError } = useToast();
  
  // Check if user is admin - simplificado para evitar múltiplas chamadas
  const checkIfAdmin = useCallback(async (userId) => {
    if (!userId) return false;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data?.is_admin || false;
    } catch (err) {
      console.error('Error checking admin status:', err);
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
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        const session = data?.session;
        const currentUser = session?.user;
        
        if (currentUser && isMounted) {
          setUser(currentUser);
          
          // Check admin status
          const adminStatus = await checkIfAdmin(currentUser.id);
          if (isMounted) setIsAdmin(adminStatus);
          
          // Try to get last used profile from localStorage
          const lastProfileId = localStorage.getItem('lastProfileId');
          if (lastProfileId) {
            try {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', lastProfileId)
                .eq('user_id', currentUser.id)
                .single();
                
              if (profileData && isMounted) {
                setProfile(profileData);
              }
            } catch (profileError) {
              console.error('Error fetching last profile:', profileError);
              // Continue without setting profile
            }
          }
        } else if (isMounted) {
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
          localStorage.removeItem('lastProfileId');
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };
    
    initAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          const adminStatus = await checkIfAdmin(session.user.id);
          if (isMounted) setIsAdmin(adminStatus);
        } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
          localStorage.removeItem('lastProfileId');
        }
      }
    );
    
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [checkIfAdmin]);
  
  // Login function
  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      
      if (!email || !password) {
        throw new Error('Email e senha são obrigatórios');
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      setUser(data.user);
      
      // Check admin in separate call to avoid multiple context updates
      const adminStatus = await checkIfAdmin(data.user.id);
      setIsAdmin(adminStatus);
      
      return data;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
      throw err;
    }
  }, [checkIfAdmin]);
  
  // Logout function
  const logout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear auth state
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      localStorage.removeItem('lastProfileId');
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message);
      showError && showError('Erro ao sair da conta. Tente novamente.');
    }
  }, [showError]);
  
  // Set current profile
  const setCurrentProfile = useCallback((selectedProfile) => {
    if (selectedProfile) {
      setProfile(selectedProfile);
      // Save to localStorage for persistence
      localStorage.setItem('lastProfileId', selectedProfile.id);
    } else {
      setProfile(null);
      localStorage.removeItem('lastProfileId');
    }
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
    loading: loading || !initialized,
    error,
    login,
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