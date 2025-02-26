import { supabase } from './supabase'
import { v4 as uuidv4 } from 'uuid'

// Opção 1: Usando o storage gratuito do Supabase (limite de 1GB no plano gratuito)
export const uploadToSupabase = async (file, folder = 'videos') => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${uuidv4()}.${fileExt}`
  const filePath = `${folder}/${fileName}`

  const { error } = await supabase.storage
    .from('media')
    .upload(filePath, file)

  // Validar tipo de arquivo para thumbnails
  if (folder === 'thumbnails') {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      throw new Error('Formato de arquivo inválido. Use JPEG, PNG, WebP ou GIF.')
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB 
      throw new Error('Arquivo muito grande. O tamanho máximo é 5MB.')
    }
  }

  if (error) {
    throw error
  }

  const { data } = supabase.storage.from('media').getPublicUrl(filePath)
  
  return {
    url: data.publicUrl,
    path: filePath
  }
}

// Opção 2: Usando URLs externas (ex: já hospedadas em outro lugar)
export const saveExternalUrl = async (url, title, thumbnailUrl = null) => {
  const { data, error } = await supabase
    .from('media')
    .insert([
      { 
        title,
        media_url: url,
        thumbnail_url: thumbnailUrl,
        type: 'external'
      }
    ])
    .select()

  if (error) throw error
  return data[0]
}

// Função para obter lista de mídias
export const getMediaList = async (category = null) => {
  let query = supabase
    .from('media')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (category) {
    query = query.eq('category', category)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data
}

// Função para obter detalhes de uma mídia específica
export const getMediaDetails = async (id) => {
  const { data, error } = await supabase
    .from('media')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

// Função para atualizar o progresso de visualização
export const updateWatchProgress = async (mediaId, profileId, progress, duration) => {
  const { data, error } = await supabase
    .from('watch_progress')
    .upsert([
      { 
        media_id: mediaId,
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