import { createContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from './ToastContext';
import * as mediaAPI from '../api/media';

// Create media context
const MediaContext = createContext(undefined);

// Media provider component
export const MediaProvider = ({ children }) => {
  const { profile } = useAuth();
  const { error: showError } = useToast();
  
  // State
  const [allMedia, setAllMedia] = useState([]);
  const [categoryMedia, setCategoryMedia] = useState({});
  const [favorites, setFavorites] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch all media (this will run once on component mount)
  const fetchAllMedia = useCallback(async () => {
    try {
      setLoading(true);
      const data = await mediaAPI.getAllMedia();
      setAllMedia(data);
      
      // Group media by category
      const mediaByCategory = {};
      
      // Common categories
      const categories = ['filmes', 'series', 'anime', 'documentarios', 'infantil'];
      
      // Initialize categories with empty arrays
      categories.forEach(category => {
        mediaByCategory[category] = [];
      });
      
      // Fill categories with media
      data.forEach(item => {
        if (item.category && mediaByCategory[item.category]) {
          mediaByCategory[item.category].push(item);
        }
      });
      
      setCategoryMedia(mediaByCategory);
      setError(null);
    } catch (err) {
      console.error('Error fetching media:', err);
      setError('Falha ao carregar conteúdo. Tente novamente.');
      showError('Erro ao carregar conteúdo. Verifique sua conexão com a internet.');
    } finally {
      setLoading(false);
    }
  }, [showError]);
  
  // Fetch media for specific category
  const fetchMediaByCategory = useCallback(async (category) => {
    if (!category) return [];
    
    try {
      const data = await mediaAPI.getAllMedia(category);
      
      // Update category in state
      setCategoryMedia(prevState => ({
        ...prevState,
        [category]: data
      }));
      
      return data;
    } catch (err) {
      console.error(`Error fetching ${category} media:`, err);
      showError(`Erro ao carregar ${category}. Tente novamente.`);
      return [];
    }
  }, [showError]);
  
  // Fetch favorites for current profile
  const fetchFavorites = useCallback(async () => {
    if (!profile) return;
    
    try {
      const data = await mediaAPI.getFavorites(profile.id);
      
      // Extract media items from favorites
      const favoriteMedia = data.map(fav => fav.media);
      setFavorites(favoriteMedia);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      showError('Erro ao carregar favoritos. Tente novamente.');
    }
  }, [profile, showError]);
  
  // Fetch continue watching content
  const fetchContinueWatching = useCallback(async () => {
    if (!profile) return;
    
    try {
      const data = await mediaAPI.getWatchProgress(profile.id);
      
      // Filter items with progress and that haven't been completed
      const inProgress = data
        .filter(item => 
          item.progress > 0 && 
          item.progress < (item.duration * 0.95)
        )
        .map(item => ({
          ...item.media,
          watch_progress: item.progress,
          duration: item.duration
        }))
        .sort((a, b) => new Date(b.last_watched) - new Date(a.last_watched));
      
      setContinueWatching(inProgress);
    } catch (err) {
      console.error('Error fetching continue watching:', err);
      // Don't show error for this - it's not critical
    }
  }, [profile]);
  
  // Initialize all data
  useEffect(() => {
    fetchAllMedia();
  }, [fetchAllMedia]);
  
  // Fetch profile-specific data when profile changes
  useEffect(() => {
    if (profile) {
      fetchFavorites();
      fetchContinueWatching();
    } else {
      setFavorites([]);
      setContinueWatching([]);
    }
  }, [profile, fetchFavorites, fetchContinueWatching]);
  
  // Toggle favorite
  const toggleFavorite = useCallback(async (mediaId) => {
    if (!profile) return;
    
    try {
      const isFavorite = favorites.some(item => item.id === mediaId);
      
      if (isFavorite) {
        // Remove from favorites
        await mediaAPI.removeFavorite(mediaId, profile.id);
        setFavorites(favorites.filter(item => item.id !== mediaId));
      } else {
        // Add to favorites
        await mediaAPI.addFavorite(mediaId, profile.id);
        
        // Get media details and add to favorites
        const mediaItem = allMedia.find(item => item.id === mediaId);
        if (mediaItem) {
          setFavorites([...favorites, mediaItem]);
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      showError('Erro ao atualizar favoritos. Tente novamente.');
    }
  }, [profile, favorites, allMedia, showError]);
  
  // Update watch progress
  const updateProgress = useCallback(async (mediaId, progress, duration) => {
    if (!profile || !mediaId) return;
    
    try {
      await mediaAPI.updateWatchProgress(mediaId, profile.id, progress, duration);
      
      // Update continue watching state if needed
      if (progress > 0 && progress < (duration * 0.95)) {
        // Check if media already in continue watching
        const existingIndex = continueWatching.findIndex(item => item.id === mediaId);
        
        if (existingIndex >= 0) {
          // Update existing item
          setContinueWatching(prev => {
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              watch_progress: progress,
              duration
            };
            return updated;
          });
        } else {
          // Add new item if it exists in allMedia
          const mediaItem = allMedia.find(item => item.id === mediaId);
          if (mediaItem) {
            setContinueWatching(prev => [
              {
                ...mediaItem,
                watch_progress: progress,
                duration
              },
              ...prev
            ]);
          }
        }
      } else if (progress >= (duration * 0.95)) {
        // Remove from continue watching if completed
        setContinueWatching(prev => prev.filter(item => item.id !== mediaId));
      }
    } catch (err) {
      console.error('Error updating progress:', err);
      // Don't show error for this - it's not critical
    }
  }, [profile, continueWatching, allMedia]);
  
  // Context value
  const contextValue = {
    allMedia,
    categoryMedia,
    favorites,
    continueWatching,
    loading,
    error,
    fetchAllMedia,
    fetchMediaByCategory,
    fetchFavorites,
    toggleFavorite,
    updateProgress
  };
  
  return (
    <MediaContext.Provider value={contextValue}>
      {children}
    </MediaContext.Provider>
  );
};

export default MediaContext;