import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { getMediaList, getMediaDetails } from '../lib/mediaStorage';
import { useToast } from './useToast';

export const useMedia = (category = null, options = {}) => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { profile } = useAuth();
  const { error: showError } = useToast();
  
  // Opções com valores padrão
  const limit = options.limit || 20;
  const sortBy = options.sortBy || 'created_at';
  const sortDir = options.sortDir || 'desc';
  
  const fetchMedia = useCallback(async (reset = false) => {
    if (!profile) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const currentPage = reset ? 1 : page;
      const offset = (currentPage - 1) * limit;
      
      const mediaData = await getMediaList(category, {
        limit,
        offset,
        sortBy,
        sortDir
      });
      
      // Obter progresso de visualização para cada mídia
      if (mediaData.length > 0) {
        try {
          const { data: progressData, error: progressError } = await supabase
            .from('watch_progress')
            .select('*')
            .eq('profile_id', profile.id)
            .in('media_id', mediaData.map(m => m.id));
          
          if (progressError) throw progressError;
          
          // Combinar dados de mídia com progresso
          const mediaWithProgress = mediaData.map(item => {
            const progress = progressData?.find(p => p.media_id === item.id);
            return {
              ...item,
              watch_progress: progress?.progress || 0,
              duration: progress?.duration || 0
            };
          });
          
          if (reset) {
            setMedia(mediaWithProgress);
          } else {
            setMedia(prev => [...prev, ...mediaWithProgress]);
          }
          
          // Verificar se há mais itens para carregar
          setHasMore(mediaData.length === limit);
          
          // Atualizar página se não for reset
          if (!reset) {
            setPage(prev => prev + 1);
          } else {
            setPage(2);
          }
        } catch (progressErr) {
          console.error('Warning: Error fetching progress data:', progressErr);
          // Continuar mesmo com erro nos dados de progresso
          if (reset) {
            setMedia(mediaData);
          } else {
            setMedia(prev => [...prev, ...mediaData]);
          }
          setHasMore(mediaData.length === limit);
        }
      } else {
        if (reset) {
          setMedia([]);
        }
        setHasMore(false);
      }
    } catch (err) {
      console.error('Erro ao buscar mídia:', err);
      setError('Falha ao carregar mídia. Tente novamente.');
      showError('Erro ao buscar mídia. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }, [profile, category, page, limit, sortBy, sortDir, showError]);
  
  // Carregamento inicial
  useEffect(() => {
    fetchMedia(true);
  }, [profile, category, sortBy, sortDir]);
  
  // Carregar mais itens
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchMedia();
    }
  }, [loading, hasMore, fetchMedia]);
  
  // Atualizar dados
  const refresh = useCallback(() => {
    return fetchMedia(true);
  }, [fetchMedia]);
  
  // Obter um item de mídia por ID
  const getMediaById = useCallback(async (id) => {
    if (!id) return null;
    
    try {
      return await getMediaDetails(id);
    } catch (err) {
      console.error('Error fetching media details:', err);
      showError('Erro ao buscar detalhes da mídia');
      return null;
    }
  }, [showError]);
  
  return {
    media,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    getMediaById
  };
};