import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../../hooks/useAuth'
import Layout from '../../../components/Layout'
import { uploadToSupabase } from '../../../lib/mediaStorage'
import { supabase } from '../../../lib/supabase'
import Image from 'next/image'

export default function EditMediaPage() {
  const { user, isAdmin } = useAuth()
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

  // Verificar se o usuário está autenticado e é admin
  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    } else if (!isAdmin) {
      router.push('/browse')
      return
    }
    
    if (!id) return
    
    const fetchMedia = async () => {
      try {
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
    
    fetchMedia()
  }, [id, user, isAdmin, router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSaving(true)
    
    try {
      // Verificar se é admin
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

  if (loading) {
    return (
      <Layout title="Editando Mídia">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    )
  }

  // Se não for admin, não renderizar o conteúdo
  if (!isAdmin) {
    return null
  }

  if (error && !media) {
    return (
      <Layout title="Erro">
        <div className="max-w-md mx-auto bg-background-light p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-red-500 mb-4">Erro</h2>
          <p className="mb-6">{error}</p>
          <button 
            onClick={() => router.push('/admin')}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors"
          >
            Voltar para Admin
          </button>
        </div>
      </Layout>
    )
  }

  if (!media) return null

  return (
    <Layout title={`Editando: ${media.title}`}>
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Editar Vídeo</h1>
        
        {error && (
          <div className="bg-red-500 bg-opacity-80 text-white p-4 rounded-md mb-6">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-500 bg-opacity-80 text-white p-4 rounded-md mb-6">
            Mídia atualizada com sucesso!
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-background-light p-6 rounded-lg shadow">
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-1">
                Título
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 bg-background rounded border-0 text-white focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">
                Descrição
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full p-3 bg-background rounded border-0 text-white focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-text-secondary mb-1">
                Categoria
              </label>
              <input
                id="category"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 bg-background rounded border-0 text-white focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div className="flex items-center">
              <input
                id="isExternal"
                type="checkbox"
                checked={isExternal}
                onChange={(e) => setIsExternal(e.target.checked)}
                className="h-4 w-4 text-primary border-0 focus:ring-primary bg-background"
              />
              <label htmlFor="isExternal" className="ml-2 block text-sm text-text-secondary">
                Usar URL externa (YouTube, Google Drive, etc)
              </label>
            </div>
            
            {isExternal && (
              <div>
                <label htmlFor="externalUrl" className="block text-sm font-medium text-text-secondary mb-1">
                  URL do Vídeo
                </label>
                <input
                  id="externalUrl"
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  className="w-full p-3 bg-background rounded border-0 text-white focus:ring-2 focus:ring-primary"
                  required={isExternal}
                  placeholder="https://drive.google.com/file/d/..."
                />
                <p className="mt-1 text-xs text-text-secondary">
                  Para Google Drive, certifique-se de que o link permita acesso a qualquer pessoa com o link
                </p>
              </div>
            )}
            
            <div>
              <label htmlFor="thumbnailUrl" className="block text-sm font-medium text-text-secondary mb-1">
                URL da Miniatura
              </label>
              <input
                id="thumbnailUrl"
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className="w-full p-3 bg-background rounded border-0 text-white focus:ring-2 focus:ring-primary"
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>
            
            <div>
              <label htmlFor="thumbnailFile" className="block text-sm font-medium text-text-secondary mb-1">
                Ou faça upload de uma nova miniatura
              </label>
              <input
                id="thumbnailFile"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-text-secondary
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-primary file:text-white
                  hover:file:bg-primary-dark
                  cursor-pointer"
              />
            </div>
            
            {thumbnailUrl && !thumbnailFile && (
              <div className="mt-2">
                <p className="text-sm text-text-secondary mb-2">Miniatura atual:</p>
                <div className="w-48 h-27 relative rounded overflow-hidden">
                  <Image 
                    src={thumbnailUrl}
                    alt="Miniatura atual"
                    width={200}
                    height={112}
                    className="object-cover"
                  />
                </div>
              </div>
            )}
            
            <div className="flex space-x-4 pt-4">
              <button 
                type="button" 
                className="px-4 py-2 bg-background hover:bg-background-dark text-white rounded-md transition-colors"
                onClick={() => router.push('/admin')}
                disabled={saving}
              >
                Cancelar
              </button>
              
              <button 
                type="submit" 
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors flex-1"
                disabled={saving}
              >
                {saving ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Salvando...
                  </span>
                ) : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  )
}