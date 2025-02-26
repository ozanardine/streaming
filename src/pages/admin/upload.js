import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../hooks/useAuth'
import Layout from '../../components/Layout'
import { uploadToSupabase, saveExternalUrl } from '../../lib/mediaStorage'
import { supabase } from '../../lib/supabase'

export default function UploadPage() {
  const { user, isAdmin } = useAuth()
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

  // Verificar se o usuário está autenticado e é admin
  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else if (!isAdmin) {
      router.push('/browse')
    }
  }, [user, isAdmin, router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      // Verificar se é admin
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

  // Se não for admin, não renderizar o conteúdo
  if (!isAdmin) {
    return null
  }

  return (
    <Layout title="Adicionar Novo Vídeo">
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-8">Adicionar Novo Vídeo</h1>
        
        {error && (
          <div className="bg-red-500 bg-opacity-80 text-white p-4 rounded-md mb-6">
            {error}
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
            
            {isExternal ? (
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
            ) : (
              <div>
                <label htmlFor="file" className="block text-sm font-medium text-text-secondary mb-1">
                  Arquivo de Vídeo
                </label>
                <input
                  id="file"
                  type="file"
                  accept="video/*"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="block w-full text-sm text-text-secondary
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-primary file:text-white
                    hover:file:bg-primary-dark
                    cursor-pointer"
                  required={!isExternal}
                />
                <p className="mt-1 text-xs text-text-secondary">
                  Formatos suportados: MP4, WebM, MOV. Tamanho máximo: 150MB
                </p>
              </div>
            )}
            
            <div>
              <label htmlFor="thumbnailUrl" className="block text-sm font-medium text-text-secondary mb-1">
                URL da Miniatura (opcional)
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
                Ou faça upload de uma miniatura
              </label>
              <input
                id="thumbnailFile"
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files[0])}
                className="block w-full text-sm text-text-secondary
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-primary file:text-white
                  hover:file:bg-primary-dark
                  cursor-pointer"
              />
            </div>
            
            {loading && (
              <div className="relative pt-1">
                <div className="overflow-hidden h-2 text-xs flex rounded bg-background">
                  <div 
                    style={{ width: `${progress}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                  ></div>
                </div>
                <p className="text-center text-xs mt-1 text-text-secondary">{progress}%</p>
              </div>
            )}
            
            <button 
              type="submit" 
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Adicionar Vídeo'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}