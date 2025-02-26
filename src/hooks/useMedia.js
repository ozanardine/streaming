import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { getMediaList, getMediaDetails } from '../lib/mediaStorage'

export const useMedia = (category = null) => {
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()

  useEffect(() => {
    const fetchMedia = async () => {
      if (!profile) {
        setLoading(false)
        return
      }

      try {
        const mediaData = await getMediaList(category)
        
        // Obter progresso de visualização para cada mídia
        if (mediaData.length > 0) {
          const { data: progressData } = await supabase
            .from('watch_progress')
            .select('*')
            .eq('profile_id', profile.id)
            .in('media_id', mediaData.map(m => m.id))
          
          // Combinar dados de mídia com progresso
          const mediaWithProgress = mediaData.map(item => {
            const progress = progressData?.find(p => p.media_id === item.id)
            return {
              ...item,
              watch_progress: progress?.progress || 0,
              duration: progress?.duration || 0
            }
          })
          
          setMedia(mediaWithProgress)
        } else {
          setMedia([])
        }
      } catch (error) {
        console.error('Erro ao buscar mídia:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMedia()
  }, [profile, category])

  return {
    media,
    loading
  }
}