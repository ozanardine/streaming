import { supabase } from '../supabase';

let adminStatusCache = new Map();

/**
 * Signs up a new user with email and password
 * 
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Object} options - Additional signup options
 * @returns {Promise} Signup response
 */
export const signup = async (email, password, options = {}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: options.redirectTo || `${window.location.origin}/login`,
      ...options
    }
  });
  
  if (error) throw error;
  return data;
};

/**
 * Signs in a user with email and password
 * 
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise} Signin response
 */
export const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  return data;
};

/**
 * Signs out the current user
 * 
 * @returns {Promise} Signout response
 */
export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Gets the current session
 * 
 * @returns {Promise} Session data
 */
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};

/**
 * Sends a password reset email to the specified email
 * 
 * @param {string} email - User email
 * @param {string} redirectTo - Redirect URL after password reset
 * @returns {Promise} Reset response
 */
export const resetPassword = async (email, redirectTo = null) => {
  const options = {};
  
  if (redirectTo) {
    options.redirectTo = redirectTo;
  }
  
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, options);
  if (error) throw error;
  return data;
};

/**
 * Updates the user password
 * 
 * @param {string} newPassword - New password
 * @returns {Promise} Update response
 */
export const updatePassword = async (newPassword) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  });
  
  if (error) throw error;
  return data;
};

/**
 * Checks if a user is an admin
 * 
 * @param {string} userId - User ID to check
 * @returns {Promise<boolean>} Whether the user is admin
 */
export const checkAdmin = async (userId) => {
  if (!userId) return false;
  
  // Verificar cache primeiro
  if (adminStatusCache.has(userId)) {
    return adminStatusCache.get(userId);
  }
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    const isAdmin = data?.is_admin || false;
    
    // Armazenar no cache
    adminStatusCache.set(userId, isAdmin);
    
    // Limpar cache após 5 minutos
    setTimeout(() => {
      adminStatusCache.delete(userId);
    }, 5 * 60 * 1000);
    
    return isAdmin;
  } catch (err) {
    console.error('Exception checking admin status:', err);
    return false;
  }
};

/**
 * Set up auth state change subscription
 * 
 * @param {Function} callback - Function to call on auth change
 * @returns {Object} Subscription that can be unsubscribed
 */
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};