import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export const useProfiles = () => {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  // Fetch profiles with better error handling
  useEffect(() => {
    const fetchProfiles = async () => {
      if (!user) {
        setProfiles([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })

        if (error) throw error
        setProfiles(data || [])
        setError(null)
      } catch (error) {
        console.error('Erro ao buscar perfis:', error)
        setError('Não foi possível carregar os perfis. Tente novamente.')
      } finally {
        setLoading(false)
      }
    }

    fetchProfiles()
  }, [user])

  // Create profile with better error handling
  const createProfile = useCallback(async (name, avatarUrl = null) => {
    if (!user) throw new Error('Usuário não autenticado')
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([{ user_id: user.id, name, avatar_url: avatarUrl }])
        .select()
      
      if (error) throw error
      
      setProfiles(prev => [...prev, data[0]])
      setError(null)
      return data[0]
    } catch (error) {
      console.error('Erro ao criar perfil:', error)
      setError('Não foi possível criar o perfil. Tente novamente.')
      throw error
    }
  }, [user])

  // Update profile with better error handling
  const updateProfile = useCallback(async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
      
      if (error) throw error
      
      setProfiles(profiles.map(p => p.id === id ? data[0] : p))
      setError(null)
      return data[0]
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      setError('Não foi possível atualizar o perfil. Tente novamente.')
      throw error
    }
  }, [profiles])

  // Delete profile with better error handling
  const deleteProfile = useCallback(async (id) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setProfiles(profiles.filter(p => p.id !== id))
      setError(null)
    } catch (error) {
      console.error('Erro ao excluir perfil:', error)
      setError('Não foi possível excluir o perfil. Tente novamente.')
      throw error
    }
  }, [profiles])

  return {
    profiles,
    loading,
    error,
    createProfile,
    updateProfile,
    deleteProfile,
    clearError: () => setError(null)
  }
}