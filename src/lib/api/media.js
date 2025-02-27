import { supabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid';
import { formatExternalUrl, getVideoUrlType } from '../helpers/videoHelpers';

/**
 * Get all media with optional category filter
 * 
 * @param {string} category - Optional category filter
 * @returns {Promise<Array>} Array of media items
 */
export const getAllMedia = async (category = null) => {
  let query = supabase
    .from('media')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (category) {
    query = query.eq('category', category);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
};

/**
 * Get a single media item by ID
 * 
 * @param {string} id - Media ID
 * @returns {Promise<Object>} Media item
 */
export const getMediaById = async (id) => {
  const { data, error } = await supabase
    .from('media')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Create a new media item
 * 
 * @param {Object} mediaData - Media data object
 * @returns {Promise<Object>} Created media
 */
export const createMedia = async (mediaData) => {
  const { data, error } = await supabase
    .from('media')
    .insert([{
      title: mediaData.title,
      description: mediaData.description,
      category: mediaData.category,
      media_url: mediaData.mediaUrl,
      thumbnail_url: mediaData.thumbnailUrl,
      type: mediaData.type || getVideoUrlType(mediaData.mediaUrl)
    }])
    .select();
  
  if (error) throw error;
  return data[0];
};

/**
 * Update an existing media item
 * 
 * @param {string} id - Media ID
 * @param {Object} updates - Object with fields to update
 * @returns {Promise<Object>} Updated media
 */
export const updateMedia = async (id, updates) => {
  const { data, error } = await supabase
    .from('media')
    .update({
      title: updates.title,
      description: updates.description,
      category: updates.category,
      media_url: updates.mediaUrl,
      thumbnail_url: updates.thumbnailUrl,
      type: updates.type || getVideoUrlType(updates.mediaUrl),
      updated_at: new Date()
    })
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0];
};

/**
 * Delete a media item
 * 
 * @param {string} id - Media ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteMedia = async (id) => {
  const { error } = await supabase
    .from('media')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
};

/**
 * Upload a file to Supabase storage
 * 
 * @param {File} file - File to upload
 * @param {string} folder - Storage folder
 * @returns {Promise<Object>} Upload result with URL
 */
export const uploadFile = async (file, folder = 'media') => {
  if (!file) {
    throw new Error('No file provided');
  }
  
  const fileExt = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;
  
  const { error: uploadError } = await supabase.storage
    .from('media')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (uploadError) throw uploadError;
  
  const { data } = supabase.storage
    .from('media')
    .getPublicUrl(filePath);
  
  if (!data || !data.publicUrl) {
    throw new Error('Error generating public URL');
  }
  
  return {
    url: data.publicUrl,
    path: filePath
  };
};

/**
 * Get watch progress for a profile
 * 
 * @param {string} profileId - Profile ID
 * @returns {Promise<Array>} Watch progress data
 */
export const getWatchProgress = async (profileId) => {
  const { data, error } = await supabase
    .from('watch_progress')
    .select(`
      *,
      media:media_id(id, title, thumbnail_url, duration, type, media_url)
    `)
    .eq('profile_id', profileId)
    .order('last_watched', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

/**
 * Update the watch progress for a media item
 * 
 * @param {string} mediaId - Media ID
 * @param {string} profileId - Profile ID
 * @param {number} progress - Current playback position in seconds
 * @param {number} duration - Total duration in seconds
 * @returns {Promise<Object>} Updated progress data
 */
export const updateWatchProgress = async (mediaId, profileId, progress, duration) => {
  if (!mediaId || !profileId) {
    throw new Error('Media ID and Profile ID are required');
  }
  
  const { data, error } = await supabase
    .from('watch_progress')
    .upsert([
      { 
        media_id: mediaId,
        profile_id: profileId,
        progress,
        duration,
        last_watched: new Date().toISOString()
      }
    ])
    .select();
  
  if (error) throw error;
  return data[0];
};

/**
 * Get favorite media for a profile
 * 
 * @param {string} profileId - Profile ID
 * @returns {Promise<Array>} Favorite media items
 */
export const getFavorites = async (profileId) => {
  const { data, error } = await supabase
    .from('favorites')
    .select(`
      *,
      media:media_id(*)
    `)
    .eq('profile_id', profileId);
  
  if (error) throw error;
  return data || [];
};

/**
 * Add a media item to favorites
 * 
 * @param {string} mediaId - Media ID
 * @param {string} profileId - Profile ID
 * @returns {Promise<Object>} Created favorite
 */
export const addFavorite = async (mediaId, profileId) => {
  const { data, error } = await supabase
    .from('favorites')
    .insert([{
      media_id: mediaId,
      profile_id: profileId
    }])
    .select();
  
  if (error) throw error;
  return data[0];
};

/**
 * Remove a media item from favorites
 * 
 * @param {string} mediaId - Media ID
 * @param {string} profileId - Profile ID
 * @returns {Promise<boolean>} Success status
 */
export const removeFavorite = async (mediaId, profileId) => {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('media_id', mediaId)
    .eq('profile_id', profileId);
  
  if (error) throw error;
  return true;
};