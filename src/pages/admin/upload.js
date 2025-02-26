import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../hooks/useAuth'
import Layout from '../../components/Layout'
import { uploadToSupabase, saveExternalUrl } from '../../lib/mediaStorage'
import { supabase } from '../../lib/supabase'

export default function UploadPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [isExternal, setIsExternal] = useState(false)
  const [externalUrl, setExternalUrl] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [file, setFile] = useState(null)
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      // Verificar se é admin
      const isAdmin = await checkAdmin()
      if (!isAdmin) {
        throw new Error('Acesso não autorizado')
      }
      
      let mediaUrl = ''
      let thumbUrl = thumbnailUrl
      
      if (isExternal) {
        // Salvar URL externa
        if (!externalUrl) {
          throw new Error('URL do vídeo é obrigatória')
        }
        mediaUrl = externalUrl
      } else {
        // Upload de arquivo
        if (!file) {
          throw new Error('Arquivo de vídeo é obrigatório')
        }
        
        const uploadResult = await uploadToSupabase(file, 'videos')
        mediaUrl = uploadResult.url
      }
      
      // Upload de thumbnail se fornecido
      if (thumbnailFile) {
        const thumbResult = await uploadToSupabase(thumbnailFile, 'thumbnails')
        thumbUrl = thumbResult.url
      }
      
      // Salvar informações no banco de dados
      const { data, error: dbError } = await supabase
        .from('media')
        .insert([{
          title,
          description,
          category,
          media_url: mediaUrl,
          thumbnail_url: thumbUrl,
          added_by: user.id
        }])
        .select()
      
      if (dbError) throw dbError
      
      router.push('/admin')
    } catch (err) {
      console.error('Erro ao fazer upload:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="admin-upload">
        <h1>Adicionar Novo Vídeo</h1>
        
        {error && <div className="error-message">{error}</div>}
        
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
          
          {isExternal ? (
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
          ) : (
            <div className="form-group">
              <label htmlFor="file">Arquivo de Vídeo</label>
              <input
                id="file"
                type="file"
                accept="video/*"
                onChange={(e) => setFile(e.target.files[0])}
                required={!isExternal}
              />
              <small>
                Formatos suportados: MP4, WebM, MOV. Tamanho máximo: 150MB
              </small>
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="thumbnailUrl">URL da Miniatura (opcional)</label>
            <input
              id="thumbnailUrl"
              type="url"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://exemplo.com/imagem.jpg"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="thumbnailFile">Ou faça upload de uma miniatura</label>
            <input
              id="thumbnailFile"
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnailFile(e.target.files[0])}
            />
          </div>
          
          {loading && (
            <div className="progress-container">
              <div 
                className="progress-bar" 
                style={{width: `${progress}%`}}
              />
              <span>{progress}%</span>
            </div>
          )}
          
          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Adicionar Vídeo'}
          </button>
        </form>
      </div>
    </Layout>
  )
}