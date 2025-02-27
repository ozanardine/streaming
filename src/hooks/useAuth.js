import { useState, useEffect, useContext, useCallback } from 'react'
import { useRouter } from 'next/router'
import AuthContext, { AuthProvider } from '../lib/context/AuthContext'

/**
 * Hook to access authentication functionality
 * @returns Authentication state and methods
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Re-export the AuthProvider for easier imports
export { AuthProvider }