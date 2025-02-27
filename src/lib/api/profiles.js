import { supabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get all profiles for a user
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of profiles
 */
export const getUserProfiles = async (userId) => {
  if (!userId) throw new Error('User ID is required');
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

/**
 * Get a profile by ID
 * 
 * @param {string} profileId - Profile ID
 * @returns {Promise<Object>} Profile data
 */
export const getProfileById = async (profileId) => {
  if (!profileId) throw new Error('Profile ID is required');
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Create a new profile
 * 
 * @param {string} userId - User ID
 * @param {string} name - Profile name
 * @param {string} avatarUrl - Avatar URL
 * @returns {Promise<Object>} Created profile
 */
export const createProfile = async (userId, name, avatarUrl = null) => {
  if (!userId) throw new Error('User ID is required');
  if (!name) throw new Error('Profile name is required');
  
  const { data, error } = await supabase
    .from('profiles')
    .insert([{
      user_id: userId,
      name,
      avatar_url: avatarUrl
    }])
    .select();
  
  if (error) throw error;
  return data[0];
};

/**
 * Update an existing profile
 * 
 * @param {string} profileId - Profile ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated profile
 */
export const updateProfile = async (profileId, updates) => {
  if (!profileId) throw new Error('Profile ID is required');
  
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date()
    })
    .eq('id', profileId)
    .select();
  
  if (error) throw error;
  return data[0];
};

/**
 * Delete a profile
 * 
 * @param {string} profileId - Profile ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteProfile = async (profileId) => {
  if (!profileId) throw new Error('Profile ID is required');
  
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', profileId);
  
  if (error) throw error;
  return true;
};

/**
 * Upload an avatar image
 * 
 * @param {File} file - Image file
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Upload result with URL
 */
export const uploadAvatar = async (file, userId) => {
  if (!file) throw new Error('File is required');
  if (!userId) throw new Error('User ID is required');
  
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
  const fileName = `${userId}-${uuidv4()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;
  
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
 * Get profiles statistics (watch time, favorites count, etc.)
 * 
 * @param {string} profileId - Profile ID
 * @returns {Promise<Object>} Profile statistics
 */
export const getProfileStats = async (profileId) => {
  if (!profileId) throw new Error('Profile ID is required');
  
  try {
    // Get watch progress stats
    const { data: progressData, error: progressError } = await supabase
      .from('watch_progress')
      .select('*')
      .eq('profile_id', profileId);
    
    if (progressError) throw progressError;
    
    // Get favorites count
    const { count: favoritesCount, error: favoritesError } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profileId);
    
    if (favoritesError) throw favoritesError;
    
    // Calculate total watch time and other stats
    const totalWatchTime = progressData.reduce((sum, item) => sum + (item.progress || 0), 0);
    const completedVideos = progressData.filter(
      item => item.progress > 0.9 * (item.duration || 0)
    ).length;
    
    return {
      totalWatchTime,
      completedVideos,
      inProgressVideos: progressData.length - completedVideos,
      favoritesCount: favoritesCount || 0
    };
  } catch (error) {
    console.error('Error getting profile stats:', error);
    throw error;
  }
};