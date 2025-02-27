import { supabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get all series with optional filters
 * 
 * @param {Object} filters - Optional filters (category, isAnime)
 * @returns {Promise<Array>} Array of series
 */
export const getAllSeries = async (filters = {}) => {
  let query = supabase
    .from('series')
    .select('*')
    .order('created_at', { ascending: false });
  
  // Apply filters if provided
  if (filters.category) {
    query = query.eq('category', filters.category);
  }
  
  if (filters.isAnime !== undefined) {
    query = query.eq('is_anime', filters.isAnime);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
};

/**
 * Get a single series by ID with all related data
 * 
 * @param {string} seriesId - Series ID
 * @param {boolean} includeEpisodes - Whether to include episodes data
 * @returns {Promise<Object>} Series data with seasons and optionally episodes
 */
export const getSeriesById = async (seriesId, includeEpisodes = false) => {
  if (!seriesId) throw new Error('Series ID is required');
  
  let queryStr = `
    *,
    seasons:seasons(
      *
    )
  `;
  
  if (includeEpisodes) {
    queryStr = `
      *,
      seasons:seasons(
        *,
        episodes:episodes(*)
      )
    `;
  }
  
  const { data, error } = await supabase
    .from('series')
    .select(queryStr)
    .eq('id', seriesId)
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Create a new series
 * 
 * @param {Object} seriesData - Series data
 * @returns {Promise<Object>} Created series
 */
export const createSeries = async (seriesData) => {
  const { data, error } = await supabase
    .from('series')
    .insert([{
      title: seriesData.title,
      description: seriesData.description,
      thumbnail_url: seriesData.thumbnailUrl,
      banner_url: seriesData.bannerUrl,
      category: seriesData.category,
      is_anime: seriesData.isAnime || false,
      added_by: seriesData.userId
    }])
    .select();
  
  if (error) throw error;
  return data[0];
};

/**
 * Update an existing series
 * 
 * @param {string} seriesId - Series ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated series
 */
export const updateSeries = async (seriesId, updates) => {
  const { data, error } = await supabase
    .from('series')
    .update({
      title: updates.title,
      description: updates.description,
      thumbnail_url: updates.thumbnailUrl,
      banner_url: updates.bannerUrl,
      category: updates.category,
      is_anime: updates.isAnime,
      updated_at: new Date()
    })
    .eq('id', seriesId)
    .select();
  
  if (error) throw error;
  return data[0];
};

/**
 * Delete a series
 * 
 * @param {string} seriesId - Series ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteSeries = async (seriesId) => {
  const { error } = await supabase
    .from('series')
    .delete()
    .eq('id', seriesId);
  
  if (error) throw error;
  return true;
};

/**
 * Add a season to a series
 * 
 * @param {Object} seasonData - Season data
 * @returns {Promise<Object>} Created season
 */
export const addSeason = async (seasonData) => {
  const { data, error } = await supabase
    .from('seasons')
    .insert([{
      series_id: seasonData.seriesId,
      title: seasonData.title,
      season_number: seasonData.seasonNumber,
      year: seasonData.year,
      description: seasonData.description,
      thumbnail_url: seasonData.thumbnailUrl
    }])
    .select();
  
  if (error) throw error;
  return data[0];
};

/**
 * Update a season
 * 
 * @param {string} seasonId - Season ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated season
 */
export const updateSeason = async (seasonId, updates) => {
  const { data, error } = await supabase
    .from('seasons')
    .update({
      title: updates.title,
      season_number: updates.seasonNumber,
      year: updates.year,
      description: updates.description,
      thumbnail_url: updates.thumbnailUrl,
      updated_at: new Date()
    })
    .eq('id', seasonId)
    .select();
  
  if (error) throw error;
  return data[0];
};

/**
 * Delete a season
 * 
 * @param {string} seasonId - Season ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteSeason = async (seasonId) => {
  const { error } = await supabase
    .from('seasons')
    .delete()
    .eq('id', seasonId);
  
  if (error) throw error;
  return true;
};

/**
 * Add an episode to a season
 * 
 * @param {Object} episodeData - Episode data
 * @returns {Promise<Object>} Created episode
 */
export const addEpisode = async (episodeData) => {
  const { data, error } = await supabase
    .from('episodes')
    .insert([{
      series_id: episodeData.seriesId,
      season_id: episodeData.seasonId,
      title: episodeData.title,
      episode_number: episodeData.episodeNumber,
      description: episodeData.description,
      duration: episodeData.duration,
      thumbnail_url: episodeData.thumbnailUrl,
      media_url: episodeData.mediaUrl,
      type: episodeData.type || 'external'
    }])
    .select();
  
  if (error) throw error;
  return data[0];
};

/**
 * Update an episode
 * 
 * @param {string} episodeId - Episode ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated episode
 */
export const updateEpisode = async (episodeId, updates) => {
  const { data, error } = await supabase
    .from('episodes')
    .update({
      title: updates.title,
      episode_number: updates.episodeNumber,
      description: updates.description,
      duration: updates.duration,
      thumbnail_url: updates.thumbnailUrl,
      media_url: updates.mediaUrl,
      type: updates.type,
      updated_at: new Date()
    })
    .eq('id', episodeId)
    .select();
  
  if (error) throw error;
  return data[0];
};

/**
 * Delete an episode
 * 
 * @param {string} episodeId - Episode ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteEpisode = async (episodeId) => {
  const { error } = await supabase
    .from('episodes')
    .delete()
    .eq('id', episodeId);
  
  if (error) throw error;
  return true;
};

/**
 * Upload an image for series, seasons, or episodes
 * 
 * @param {File} file - Image file
 * @param {string} folder - Storage folder
 * @returns {Promise<Object>} Upload result with URL
 */
export const uploadSeriesImage = async (file, folder = 'series') => {
  if (!file) throw new Error('File is required');
  
  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file format. Use JPEG, PNG, WebP, or GIF.');
  }
  
  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File too large. Maximum size is 5MB.');
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
 * Get episodes progress for a profile
 * 
 * @param {string} profileId - Profile ID
 * @param {string} seriesId - Series ID
 * @returns {Promise<Array>} Episodes progress data
 */
export const getEpisodesProgress = async (profileId, seriesId) => {
  const { data, error } = await supabase
    .from('watch_progress')
    .select(`
      *,
      episodes:episode_id (
        id,
        series_id,
        season_id,
        episode_number,
        title
      )
    `)
    .eq('profile_id', profileId)
    .eq('episodes.series_id', seriesId);
  
  if (error) throw error;
  return data || [];
};

/**
 * Update episode watching progress
 * 
 * @param {string} episodeId - Episode ID
 * @param {string} profileId - Profile ID
 * @param {number} progress - Current playback position in seconds
 * @param {number} duration - Total duration in seconds
 * @returns {Promise<Object>} Updated progress
 */
export const updateEpisodeProgress = async (episodeId, profileId, progress, duration) => {
  const { data, error } = await supabase
    .from('watch_progress')
    .upsert([
      { 
        episode_id: episodeId,
        profile_id: profileId,
        progress,
        duration,
        last_watched: new Date()
      }
    ])
    .select();
  
  if (error) throw error;
  return data[0];
};