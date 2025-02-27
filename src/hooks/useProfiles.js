import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { useToast } from './useToast'

export const useProfiles = () => {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()
  const { error: showError } = useToast()

  // Fetch profiles with better error handling
  const fetchProfiles = useCallback(async () => {
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
    } catch (err) {
      console.error('Erro ao buscar perfis:', err)
      setError('Não foi possível carregar os perfis. Tente novamente.')
      showError && showError('Erro ao carregar perfis. Verifique sua conexão.')
    } finally {
      setLoading(false)
    }
  }, [user, showError])

  // Carregar perfis quando o usuário mudar
  useEffect(() => {
    if (user) {
      fetchProfiles()
    } else {
      setProfiles([])
      setLoading(false)
    }
  }, [user, fetchProfiles])

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
    } catch (err) {
      console.error('Erro ao criar perfil:', err)
      setError('Não foi possível criar o perfil. Tente novamente.')
      throw err
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
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err)
      setError('Não foi possível atualizar o perfil. Tente novamente.')
      throw err
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
    } catch (err) {
      console.error('Erro ao excluir perfil:', err)
      setError('Não foi possível excluir o perfil. Tente novamente.')
      throw err
    }
  }, [profiles])

  return {
    profiles,
    loading,
    error,
    createProfile,
    updateProfile,
    deleteProfile,
    fetchProfiles,
    clearError: () => setError(null)
  }
}