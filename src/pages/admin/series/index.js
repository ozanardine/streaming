import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'
import Layout from '../../../components/Layout'
import { useAuth } from '../../../hooks/useAuth'
import { getAllSeries, deleteSeries } from '../../../lib/seriesService'

export default function SeriesAdminPage() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState({
    category: '',
    isAnime: null
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    } else if (!isAdmin) {
      router.push('/browse')
      return
    }

    const fetchSeries = async () => {
      setLoading(true)
      try {
        // Filtrar por categoria se selecionada
        const category = filter.category || null
        // Filtrar por tipo (anime/série) se selecionado
        const isAnime = filter.isAnime
        
        const data = await getAllSeries(category, isAnime)
        setSeries(data)
      } catch (err) {
        console.error('Erro ao buscar séries:', err)
        setError('Não foi possível carregar as séries. Tente novamente.')
      } finally {
        setLoading(false)
      }
    }

    fetchSeries()
  }, [user, isAdmin, router, filter])

  const handleDeleteSeries = async (id) => {
    if (confirm('Tem certeza que deseja excluir esta série? Todos os episódios também serão excluídos.')) {
      try {
        await deleteSeries(id)
        setSeries(series.filter(item => item.id !== id))
      } catch (err) {
        console.error('Erro ao excluir série:', err)
        alert('Erro ao excluir série. Tente novamente.')
      }
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilter(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleTypeFilterChange = (value) => {
    setFilter(prev => ({
      ...prev,
      isAnime: value
    }))
  }

  if (loading) {
    return (
      <Layout title="Gerenciar Séries">
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

  return (
    <Layout title="Gerenciar Séries">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Gerenciar Séries</h1>
          <div className="flex space-x-2">
            <Link 
              href="/admin"
              className="px-4 py-2 bg-background hover:bg-background-dark text-white rounded-md transition-colors"
            >
              Voltar ao Painel
            </Link>
            <Link 
              href="/admin/series/add"
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors"
            >
              Adicionar Nova Série
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/80 text-white p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        <div className="bg-background-light p-4 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-3">Filtros</h2>
          <div className="flex flex-wrap gap-4">
            <div className="w-full md:w-auto">
              <label htmlFor="category" className="block text-sm text-text-secondary mb-1">
                Categoria
              </label>
              <select
                id="category"
                name="category"
                value={filter.category}
                onChange={handleFilterChange}
                className="w-full md:w-48 p-2 bg-background rounded text-white border-0 focus:ring-2 focus:ring-primary"
              >
                <option value="">Todas as categorias</option>
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

            <div className="w-full md:w-auto">
              <label className="block text-sm text-text-secondary mb-1">
                Tipo
              </label>
              <div className="flex space-x-4">
                <button
                  className={`px-3 py-1 rounded-md ${filter.isAnime === null ? 'bg-primary text-white' : 'bg-background text-text-secondary'}`}
                  onClick={() => handleTypeFilterChange(null)}
                >
                  Todos
                </button>
                <button
                  className={`px-3 py-1 rounded-md ${filter.isAnime === false ? 'bg-primary text-white' : 'bg-background text-text-secondary'}`}
                  onClick={() => handleTypeFilterChange(false)}
                >
                  Séries
                </button>
                <button
                  className={`px-3 py-1 rounded-md ${filter.isAnime === true ? 'bg-primary text-white' : 'bg-background text-text-secondary'}`}
                  onClick={() => handleTypeFilterChange(true)}
                >
                  Animes
                </button>
              </div>
            </div>
          </div>
        </div>

        {series.length === 0 ? (
          <div className="bg-background-light rounded-lg p-8 text-center">
            <p className="text-text-secondary">Nenhuma série encontrada. Adicione uma nova série!</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-background-light rounded-lg shadow-md">
            <table className="min-w-full divide-y divide-background">
              <thead className="bg-background">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Thumbnail
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Título
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Categoria
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Tipo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Temporadas
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background-light divide-y divide-background">
                {series.map(item => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-16 h-9 relative rounded overflow-hidden bg-background">
                        {item.thumbnail_url ? (
                          <Image 
                            src={item.thumbnail_url} 
                            alt={item.title} 
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-text-secondary text-xs">
                            Sem imagem
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">{item.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-text-secondary">{item.category || 'Sem categoria'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${item.is_anime ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                        {item.is_anime ? 'Anime' : 'Série'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {item.total_seasons}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <Link 
                          href={`/admin/series/${item.id}`}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                        >
                          Gerenciar
                        </Link>
                        <Link 
                          href={`/admin/series/edit/${item.id}`}
                          className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                        >
                          Editar
                        </Link>
                        <button 
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                          onClick={() => handleDeleteSeries(item.id)}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}