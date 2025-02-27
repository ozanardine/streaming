import { supabase } from './supabase'
import { v4 as uuidv4 } from 'uuid'
import { formatExternalUrl, getVideoUrlType } from './helpers/videoHelpers'

// Upload de arquivo para o Supabase Storage
export const uploadToSupabase = async (file, folder = 'videos') => {
  if (!file) {
    throw new Error('Nenhum arquivo fornecido')
  }

  // Validar tipo de arquivo para thumbnails
  if (folder.includes('thumbnail')) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      throw new Error('Formato de arquivo inválido. Use JPEG, PNG, WebP ou GIF.')
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB 
      throw new Error('Arquivo muito grande. O tamanho máximo é 5MB.')
    }
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

    // Obter URL pública
    const { data } = supabase.storage.from('media').getPublicUrl(filePath)
    
    if (!data || !data.publicUrl) {
      throw new Error('Erro ao gerar URL pública')
    }
    
    console.log('Upload de arquivo concluído:', data.publicUrl)
    
    return {
      url: data.publicUrl,
      path: filePath
    }
  } catch (error) {
    console.error('Erro no upload:', error)
    throw error
  }
}

// Adicionar URL externa ao banco de dados
export const saveExternalUrl = async (url, title, description = '', category = '', thumbnailUrl = null) => {
  const urlType = getVideoUrlType(url);
  const formattedUrl = formatExternalUrl(url, urlType);
  
  const { data, error } = await supabase
    .from('media')
    .insert([
      { 
        title,
        description,
        category,
        media_url: formattedUrl,
        thumbnail_url: thumbnailUrl,
        type: urlType
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
  try {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao buscar detalhes da mídia:', error)
    throw error
  }
}

// Função para atualizar o progresso de visualização
export const updateWatchProgress = async (mediaId, profileId, progress, duration) => {
  if (!mediaId || !profileId) {
    console.error('MediaID ou ProfileID não fornecidos');
    return null;
  }
  
  try {
    // Verificar se o registro já existe usando uma abordagem mais segura
    const checkResponse = await supabase
      .from('watch_progress')
      .select('id')
      .eq('media_id', mediaId)
      .eq('profile_id', profileId);
      
    if (checkResponse.error) {
      throw checkResponse.error;
    }
    
    const existingRecords = checkResponse.data || [];
    
    if (existingRecords.length > 0) {
      // Atualizar registro existente
      const { data, error } = await supabase
        .from('watch_progress')
        .update({
          progress,
          duration,
          last_watched: new Date().toISOString()
        })
        .eq('id', existingRecords[0].id);
      
      if (error) throw error;
      return data?.[0] || existingRecords[0];
    } else {
      // Inserir novo registro
      const { data, error } = await supabase
        .from('watch_progress')
        .insert([
          { 
            media_id: mediaId,
            profile_id: profileId,
            progress,
            duration,
            last_watched: new Date().toISOString()
          }
        ]);
      
      if (error) throw error;
      return data?.[0] || { media_id: mediaId, profile_id: profileId, progress, duration };
    }
  } catch (error) {
    console.error('Erro ao atualizar progresso de visualização:', error);
    
    // Mesmo com erro, não interrompemos a experiência do usuário
    return { 
      media_id: mediaId, 
      profile_id: profileId,
      progress,
      duration
    };
  }
}