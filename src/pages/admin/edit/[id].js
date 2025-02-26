import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../../hooks/useAuth'
import Layout from '../../../components/Layout'
import { uploadToSupabase } from '../../../lib/mediaStorage'
import { supabase } from '../../../lib/supabase'
import Image from 'next/image'

export default function EditMediaPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { id } = router.query
  
  const [media, setMedia] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [isExternal, setIsExternal] = useState(false)
  const [externalUrl, setExternalUrl] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Verificar se é administrador
  const checkAdmin = async () => {
    if (!user) return false
    
    const { data } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    
    return data?.is_admin || false
  }

  // Carregar dados da mídia
  useEffect(() => {
    const fetchMedia = async () => {
      if (!id || !user) return
      
      try {
        // Verificar se é admin
        const isAdmin = await checkAdmin()
        if (!isAdmin) {
          router.push('/browse')
          return
        }
        
        const { data, error } = await supabase
          .from('media')
          .select('*')
          .eq('id', id)
          .single()
          
        if (error) throw error
        
        if (!data) {
          setError('Mídia não encontrada')
          return
        }
        
        setMedia(data)
        setTitle(data.title)
        setDescription(data.description || '')
        setCategory(data.category || '')
        setThumbnailUrl(data.thumbnail_url || '')
        
        // Determinar se é URL externa
        if (data.media_url && !data.media_url.includes('supabase')) {
          setIsExternal(true)
          setExternalUrl(data.media_url)
        }
      } catch (err) {
        console.error('Erro ao carregar mídia:', err)
        setError('Erro ao carregar dados. Tente novamente.')
      } finally {
        setLoading(false)
      }
    }
    
    if (!authLoading) {
      fetchMedia()
    }
  }, [id, user, authLoading, router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSaving(true)
    
    try {
      // Verificar se é admin
      const isAdmin = await checkAdmin()
      if (!isAdmin) {
        throw new Error('Acesso não autorizado')
      }
      
      let mediaUrl = media.media_url
      let thumbUrl = thumbnailUrl
      
      // Se mudou para URL externa
      if (isExternal && externalUrl && externalUrl !== media.media_url) {
        mediaUrl = externalUrl
      }
      
      // Upload de nova thumbnail se fornecida
      if (thumbnailFile) {
        const thumbResult = await uploadToSupabase(thumbnailFile, 'thumbnails')
        thumbUrl = thumbResult.url
      }
      
      // Atualizar informações no banco de dados
      const { data, error: dbError } = await supabase
        .from('media')
        .update({
          title,
          description,
          category,
          media_url: mediaUrl,
          thumbnail_url: thumbUrl,
          updated_at: new Date()
        })
        .eq('id', id)
        .select()
      
      if (dbError) throw dbError
      
      setSuccess(true)
      // Atualizar dados locais
      setMedia(data[0])
      
      // Esconder mensagem de sucesso após alguns segundos
      setTimeout(() => {
        setSuccess(false)
      }, 3000)
    } catch (err) {
      console.error('Erro ao atualizar mídia:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setThumbnailFile(file)
    }
  }

  if (authLoading || loading) {
    return (
      <Layout title="Editando Mídia">
        <div className="loading">Carregando...</div>
      </Layout>
    )
  }

  if (error && !media) {
    return (
      <Layout title="Erro">
        <div className="error-container">
          <h2>Erro</h2>
          <p>{error}</p>
          <button onClick={() => router.push('/admin')}>Voltar para Admin</button>
        </div>
      </Layout>
    )
  }

  if (!media) return null

  return (
    <Layout title={`Editando: ${media.title}`}>
      <div className="admin-upload">
        <h1>Editar Vídeo</h1>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">Mídia atualizada com sucesso!</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Título</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Descrição</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="category">Categoria</label>
            <input
              id="category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={isExternal}
                onChange={(e) => setIsExternal(e.target.checked)}
              />
              Usar URL externa (YouTube, Google Drive, etc)
            </label>
          </div>
          
          {isExternal && (
            <div className="form-group">
              <label htmlFor="externalUrl">URL do Vídeo</label>
              <input
                id="externalUrl"
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                required={isExternal}
                placeholder="https://drive.google.com/file/d/..."
              />
              <small>
                Para Google Drive, certifique-se de que o link permita acesso a qualquer pessoa com o link
              </small>
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="thumbnailUrl">URL da Miniatura</label>
            <input
              id="thumbnailUrl"
              type="url"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://exemplo.com/imagem.jpg"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="thumbnailFile">Ou faça upload de uma nova miniatura</label>
            <input
              id="thumbnailFile"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          
          {thumbnailUrl && !thumbnailFile && (
            <div className="current-thumbnail">
              <p>Miniatura atual:</p>
              <div className="thumbnail-preview">
                <Image 
                  src={thumbnailUrl}
                  alt="Miniatura atual"
                  width={200}
                  height={112}
                />
              </div>
            </div>
          )}
          
          <div className="action-buttons">
            <button 
              type="button" 
              className="cancel-button"
              onClick={() => router.push('/admin')}
              disabled={saving}
            >
              Cancelar
            </button>
            
            <button 
              type="submit" 
              className="submit-button"
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}