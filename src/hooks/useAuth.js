import { useContext } from 'react';
import AuthContext from '../lib/context/AuthContext';

/**
 * Hook to access authentication functionality
 * @returns Authentication state and methods
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};