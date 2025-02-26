import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export const useProfiles = () => {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!user) {
        setProfiles([])
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })

        if (error) throw error
        setProfiles(data || [])
      } catch (error) {
        console.error('Erro ao buscar perfis:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfiles()
  }, [user])

  const createProfile = async (name, avatarUrl = null) => {
    if (!user) throw new Error('Usuário não autenticado')
    
    const { data, error } = await supabase
      .from('profiles')
      .insert([{ user_id: user.id, name, avatar_url: avatarUrl }])
      .select()
    
    if (error) throw error
    
    setProfiles([...profiles, data[0]])
    return data[0]
  }

  const updateProfile = async (id, updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
    
    if (error) throw error
    
    setProfiles(profiles.map(p => p.id === id ? data[0] : p))
    return data[0]
  }

  const deleteProfile = async (id) => {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    setProfiles(profiles.filter(p => p.id !== id))
  }

  return {
    profiles,
    loading,
    createProfile,
    updateProfile,
    deleteProfile
  }
}