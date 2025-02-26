import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../hooks/useAuth'
import Layout from '../../components/Layout'
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

  const [thumbnailPreview, setThumbnailPreview] = useState(null)

    const handleThumbnailChange = (e) => {
      const file = e.target.files[0]
      if (file) {
        setThumbnailFile(file)
        // Criar preview
        const reader = new FileReader()
        reader.onload = () => {
          setThumbnailPreview(reader.result)
        }
        reader.readAsDataURL(file)
      }
    }

  // Função para fazer upload de um arquivo para o Supabase Storage
  const uploadFile = async (file, folder = 'videos') => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    const { error } = await supabase.storage
      .from('media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        onUploadProgress: (progress) => {
          const percent = Math.round((progress.loaded / progress.total) * 100)
          setProgress(percent)
        }
      })

    if (error) {
      throw error
    }

    const { data } = supabase.storage.from('media').getPublicUrl(filePath)
    return data.publicUrl
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    setProgress(0)
    
    try {
      // Verificar se é admin
      if (!isAdmin) {
        throw new Error('Acesso não autorizado')
      }
      
      if (!title.trim()) {
        throw new Error('O título é obrigatório')
      }

      let mediaUrl = '';
      let thumbUrl = thumbnailUrl;
      
      // Processar link externo ou arquivo
      if (isExternal) {
        // Verificar se a URL externa foi fornecida
        if (!externalUrl.trim()) {
          throw new Error('A URL do vídeo é obrigatória')
        }
        
        // Usar a URL externa diretamente
        mediaUrl = externalUrl;
        
        // Avançar progresso para feedback visual
        setProgress(50);
      } else {
        // Verificar se o arquivo foi selecionado
        if (!file) {
          throw new Error('O arquivo de vídeo é obrigatório')
        }
        
        // Fazer upload do arquivo
        mediaUrl = await uploadFile(file, 'videos');
      }
      
      // Upload de thumbnail se fornecido (apenas se um arquivo foi selecionado)
      if (thumbnailFile) {
        thumbUrl = await uploadFile(thumbnailFile, 'thumbnails');
      }
      
      // Avançar progresso para feedback visual
      setProgress(75);
      
      // Salvar informações no banco de dados
      const { data, error: dbError } = await supabase
        .from('media')
        .insert([{
          title,
          description,
          category,
          media_url: mediaUrl,
          thumbnail_url: thumbUrl,
          type: isExternal ? 'external' : 'uploaded',
          added_by: user.id
        }])
        .select()
      
      if (dbError) throw dbError
      
      // Concluir progresso
      setProgress(100);
      
      // Redirecionar para a página de admin após sucesso
      setTimeout(() => {
        router.push('/admin')
      }, 1000);
    } catch (err) {
      console.error('Erro ao fazer upload:', err)
      setError(err.message || 'Ocorreu um erro ao tentar adicionar o vídeo.')
      setProgress(0)
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
                  placeholder="https://youtu.be/exemplo ou https://drive.google.com/file/d/..."
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
                onChange={handleThumbnailChange}
                className="block w-full text-sm text-text-secondary
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-primary file:text-white
                  hover:file:bg-primary-dark
                  cursor-pointer"
              />
              
              {thumbnailPreview && (
                <div className="mt-2">
                  <p className="text-sm text-text-secondary mb-1">Preview:</p>
                  <div className="w-48 h-27 relative rounded overflow-hidden">
                    <img 
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="object-cover w-full h-full"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {loading && (
              <div className="relative pt-1">
                <div className="overflow-hidden h-2 text-xs flex rounded bg-background">
                  <div 
                    style={{ width: `${progress}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                  ></div>
                </div>
                <p className="text-center text-xs mt-1 text-text-secondary">{progress}% {progress === 100 ? 'Concluído!' : 'Enviando...'}</p>
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