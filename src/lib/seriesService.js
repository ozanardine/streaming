import { supabase } from './supabase'
import { v4 as uuidv4 } from 'uuid'

// Função para criar nova série
export const createSeries = async (seriesData) => {
  const { data, error } = await supabase
    .from('series')
    .insert([{
      title: seriesData.title,
      description: seriesData.description,
      thumbnail_url: seriesData.thumbnailUrl,
      banner_url: seriesData.bannerUrl,
      category: seriesData.category,
      added_by: seriesData.userId,
      is_anime: seriesData.isAnime || false
    }])
    .select()
  
  if (error) throw error
  return data[0]
}

// Função para atualizar série existente
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
    .select()
  
  if (error) throw error
  return data[0]
}

// Função para obter todas as séries
export const getAllSeries = async (category = null, isAnime = null) => {
  let query = supabase
    .from('series')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (category) {
    query = query.eq('category', category)
  }
  
  if (isAnime !== null) {
    query = query.eq('is_anime', isAnime)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data
}

// Função para obter detalhes de uma série
export const getSeriesDetails = async (seriesId) => {
  const { data, error } = await supabase
    .from('series')
    .select('*')
    .eq('id', seriesId)
    .single()
  
  if (error) throw error
  return data
}

// Função para excluir uma série
export const deleteSeries = async (seriesId) => {
  const { error } = await supabase
    .from('series')
    .delete()
    .eq('id', seriesId)
  
  if (error) throw error
  return true
}

// Função para adicionar uma temporada
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
    .select()
  
  if (error) throw error
  return data[0]
}

// Função para atualizar uma temporada
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
    .select()
  
  if (error) throw error
  return data[0]
}

// Função para obter temporadas de uma série
export const getSeasons = async (seriesId) => {
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('series_id', seriesId)
    .order('season_number', { ascending: true })
  
  if (error) throw error
  return data
}

// Função para excluir uma temporada
export const deleteSeason = async (seasonId) => {
  const { error } = await supabase
    .from('seasons')
    .delete()
    .eq('id', seasonId)
  
  if (error) throw error
  return true
}

// Função para adicionar um episódio
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
    .select()
  
  if (error) throw error
  return data[0]
}

// Função para atualizar um episódio
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
    .select()
  
  if (error) throw error
  return data[0]
}

// Função para obter episódios de uma temporada
export const getEpisodes = async (seasonId) => {
  const { data, error } = await supabase
    .from('episodes')
    .select('*')
    .eq('season_id', seasonId)
    .order('episode_number', { ascending: true })
  
  if (error) throw error
  return data
}

// Função para obter todos os episódios de uma série
export const getAllEpisodes = async (seriesId) => {
  const { data, error } = await supabase
    .from('episodes')
    .select(`
      *,
      seasons:season_id (
        season_number,
        title
      )
    `)
    .eq('series_id', seriesId)
    .order('episode_number', { ascending: true })
  
  if (error) throw error
  return data
}

// Função para excluir um episódio
export const deleteEpisode = async (episodeId) => {
  const { error } = await supabase
    .from('episodes')
    .delete()
    .eq('id', episodeId)
  
  if (error) throw error
  return true
}

// Função para atualizar o progresso de assistir um episódio
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
    .select()
  
  if (error) throw error
  return data[0]
}

// Função para obter progresso de episódios para um perfil
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
    .eq('episodes.series_id', seriesId)
  
  if (error) throw error
  return data
}

// Função para fazer upload de imagem (thumbnail ou banner)
export const uploadSeriesImage = async (file, folder = 'series') => {
  if (!file) {
    throw new Error('Nenhum arquivo fornecido')
  }

  // Validar tipo de arquivo para imagens
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg']
  if (!validTypes.includes(file.type)) {
    throw new Error('Formato de arquivo inválido. Use JPEG, PNG, WebP ou GIF.')
  }
  
  if (file.size > 5 * 1024 * 1024) { // 5MB 
    throw new Error('Arquivo muito grande. O tamanho máximo é 5MB.')
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${uuidv4()}.${fileExt}`
  const filePath = `${folder}/${fileName}`

  try {
    const { error } = await supabase.storage
      .from('media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    const { data } = supabase.storage.from('media').getPublicUrl(filePath)
    
    if (!data || !data.publicUrl) {
      throw new Error('Erro ao gerar URL pública')
    }
    
    console.log('Upload de imagem de série concluído:', data.publicUrl)
    
    return {
      url: data.publicUrl,
      path: filePath
    }
  } catch (error) {
    console.error('Erro no upload de imagem de série:', error)
    throw error
  }
}