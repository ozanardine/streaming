import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../../components/Layout'
import { useAuth } from '../../../hooks/useAuth'
import { createSeries, uploadSeriesImage } from '../../../lib/seriesService'

export default function AddSeriesPage() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    isAnime: false
  })
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState(null)
  const [bannerFile, setBannerFile] = useState(null)
  const [bannerPreview, setBannerPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else if (!isAdmin) {
      router.push('/browse')
    }
  }, [user, isAdmin, router])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setThumbnailFile(file)
      const reader = new FileReader()
      reader.onload = () => {
        setThumbnailPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBannerChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setBannerFile(file)
      const reader = new FileReader()
      reader.onload = () => {
        setBannerPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    setProgress(0)

    try {
      if (!formData.title.trim()) {
        throw new Error('O título da série é obrigatório')
      }

      // Upload das imagens, se fornecidas
      let thumbnailUrl = null
      let bannerUrl = null
      
      if (thumbnailFile) {
        setProgress(10)
        const result = await uploadSeriesImage(thumbnailFile, 'series/thumbnails')
        thumbnailUrl = result.url
        setProgress(40)
      }
      
      if (bannerFile) {
        setProgress(50)
        const result = await uploadSeriesImage(bannerFile, 'series/banners')
        bannerUrl = result.url
        setProgress(70)
      }

      // Criar a série
      setProgress(80)
      const seriesData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        thumbnailUrl,
        bannerUrl,
        userId: user.id,
        isAnime: formData.isAnime
      }
      
      const series = await createSeries(seriesData)
      setProgress(100)
      
      // Redirecionar para a página de gerenciamento da série
      router.push(`/admin/series/${series.id}`)
    } catch (err) {
      console.error('Erro ao criar série:', err)
      setError(err.message || 'Ocorreu um erro ao criar a série. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin) {
    return null
  }

  return (
    <Layout title="Adicionar Nova Série">
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-8">Adicionar Nova Série</h1>
        
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
                name="title"
                type="text"
                value={formData.title}
                onChange={handleInputChange}
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
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full p-3 bg-background rounded border-0 text-white focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-text-secondary mb-1">
                Categoria
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full p-3 bg-background rounded border-0 text-white focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecione uma categoria</option>
                <option value="ação">Ação</option>
                <option value="aventura">Aventura</option>
                <option value="comédia">Comédia</option>
                <option value="drama">Drama</option>
                <option value="ficção">Ficção Científica</option>
                <option value="terror">Terror</option>
                <option value="romance">Romance</option>
                <option value="documentário">Documentário</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                id="isAnime"
                name="isAnime"
                type="checkbox"
                checked={formData.isAnime}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary border-0 focus:ring-primary bg-background"
              />
              <label htmlFor="isAnime" className="ml-2 block text-sm text-text-secondary">
                É um anime
              </label>
            </div>
            
            <div>
              <label htmlFor="thumbnailFile" className="block text-sm font-medium text-text-secondary mb-1">
                Thumbnail
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
            
            <div>
              <label htmlFor="bannerFile" className="block text-sm font-medium text-text-secondary mb-1">
                Banner (imagem de cabeçalho)
              </label>
              <input
                id="bannerFile"
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                className="block w-full text-sm text-text-secondary
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-primary file:text-white
                  hover:file:bg-primary-dark
                  cursor-pointer"
              />
              {bannerPreview && (
                <div className="mt-2">
                  <p className="text-sm text-text-secondary mb-1">Preview:</p>
                  <div className="w-full h-32 relative rounded overflow-hidden">
                    <img 
                      src={bannerPreview}
                      alt="Banner preview"
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
                <p className="text-center text-xs mt-1 text-text-secondary">{progress}% {progress === 100 ? 'Concluído!' : 'Processando...'}</p>
              </div>
            )}
            
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => router.push('/admin/series')}
                className="px-4 py-2 bg-background hover:bg-background-dark text-white rounded transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              
              <button 
                type="submit" 
                className="flex-1 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Criando...' : 'Criar Série'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  )
}