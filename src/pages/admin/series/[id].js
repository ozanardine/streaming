import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Link from 'next/link'
import Layout from '../../../components/Layout'
import { useAuth } from '../../../hooks/useAuth'
import { 
  getSeriesDetails, 
  getSeasons, 
  getEpisodes, 
  deleteSeason, 
  deleteEpisode,
  addSeason,
  addEpisode
} from '../../../lib/seriesService'
import { uploadToSupabase } from '../../../lib/mediaStorage'

export default function ManageSeriesPage() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const { id } = router.query
  
  const [series, setSeries] = useState(null)
  const [seasons, setSeasons] = useState([])
  const [expandedSeason, setExpandedSeason] = useState(null)
  const [episodes, setEpisodes] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  
  // Estado para formulário de nova temporada
  const [addingNewSeason, setAddingNewSeason] = useState(false)
  const [newSeasonData, setNewSeasonData] = useState({
    title: '',
    seasonNumber: 1,
    year: new Date().getFullYear(),
    description: ''
  })
  const [seasonThumbnail, setSeasonThumbnail] = useState(null)
  const [savingSeason, setSavingSeason] = useState(false)
  
  // Estado para formulário de novo episódio
  const [addingNewEpisode, setAddingNewEpisode] = useState(false)
  const [currentSeasonId, setCurrentSeasonId] = useState(null)
  const [newEpisodeData, setNewEpisodeData] = useState({
    title: '',
    episodeNumber: 1,
    description: '',
    isExternal: true,
    mediaUrl: '',
    duration: 0
  })
  const [episodeThumbnail, setEpisodeThumbnail] = useState(null)
  const [episodeFile, setEpisodeFile] = useState(null)
  const [savingEpisode, setSavingEpisode] = useState(false)

  // Carregar dados da série
  useEffect(() => {
    if (!id || !user) return
    
    const loadData = async () => {
      if (!isAdmin) {
        router.push('/browse')
        return
      }
      
      setLoading(true)
      
      try {
        // Carregar detalhes da série
        const seriesData = await getSeriesDetails(id)
        setSeries(seriesData)
        
        // Carregar temporadas
        const seasonsData = await getSeasons(id)
        setSeasons(seasonsData)
        
        // Se houver temporadas, definir a primeira como expandida por padrão
        if (seasonsData.length > 0) {
          setExpandedSeason(seasonsData[0].id)
        }
      } catch (err) {
        console.error('Erro ao carregar dados da série:', err)
        setError('Não foi possível carregar os dados da série. Tente novamente.')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [id, user, isAdmin, router])
  
  // Carregar episódios quando uma temporada é expandida
  useEffect(() => {
    if (!expandedSeason) return
    
    const loadEpisodes = async () => {
      if (episodes[expandedSeason]) return
      
      try {
        const episodesData = await getEpisodes(expandedSeason)
        setEpisodes(prev => ({
          ...prev,
          [expandedSeason]: episodesData
        }))
      } catch (err) {
        console.error('Erro ao carregar episódios:', err)
      }
    }
    
    loadEpisodes()
  }, [expandedSeason, episodes])
  
  const toggleSeason = (seasonId) => {
    if (expandedSeason === seasonId) {
      setExpandedSeason(null)
    } else {
      setExpandedSeason(seasonId)
    }
  }
  
  const handleDeleteSeason = async (seasonId) => {
    if (confirm('Tem certeza que deseja excluir esta temporada? Todos os episódios também serão excluídos.')) {
      try {
        await deleteSeason(seasonId)
        setSeasons(seasons.filter(s => s.id !== seasonId))
        // Remover episódios da temporada do estado
        const newEpisodes = { ...episodes }
        delete newEpisodes[seasonId]
        setEpisodes(newEpisodes)
      } catch (err) {
        console.error('Erro ao excluir temporada:', err)
        alert('Erro ao excluir temporada. Tente novamente.')
      }
    }
  }
  
  const handleDeleteEpisode = async (episodeId, seasonId) => {
    if (confirm('Tem certeza que deseja excluir este episódio?')) {
      try {
        await deleteEpisode(episodeId)
        // Atualizar estado dos episódios
        setEpisodes(prev => ({
          ...prev,
          [seasonId]: prev[seasonId].filter(e => e.id !== episodeId)
        }))
      } catch (err) {
        console.error('Erro ao excluir episódio:', err)
        alert('Erro ao excluir episódio. Tente novamente.')
      }
    }
  }
  
  // Funções para manipular formulário de nova temporada
  const handleSeasonInputChange = (e) => {
    const { name, value } = e.target
    setNewSeasonData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSeasonThumbnailChange = (e) => {
    setSeasonThumbnail(e.target.files[0])
  }
  
  const handleAddSeason = async (e) => {
    e.preventDefault()
    setSavingSeason(true)
    
    try {
      // Validar dados
      if (!newSeasonData.title || !newSeasonData.seasonNumber) {
        throw new Error('Título e número da temporada são obrigatórios')
      }
      
      // Upload de thumbnail, se fornecido
      let thumbnailUrl = null
      if (seasonThumbnail) {
        const result = await uploadToSupabase(seasonThumbnail, 'seasons/thumbnails')
        thumbnailUrl = result.url
      }
      
      // Criar temporada
      const seasonPayload = {
        seriesId: id,
        title: newSeasonData.title,
        seasonNumber: parseInt(newSeasonData.seasonNumber),
        year: parseInt(newSeasonData.year),
        description: newSeasonData.description,
        thumbnailUrl
      }
      
      const newSeason = await addSeason(seasonPayload)
      
      // Atualizar estado
      setSeasons([...seasons, newSeason])
      if (!expandedSeason) {
        setExpandedSeason(newSeason.id)
      }
      
      // Limpar formulário
      setNewSeasonData({
        title: '',
        seasonNumber: seasons.length > 0 ? Math.max(...seasons.map(s => s.season_number)) + 1 : 1,
        year: new Date().getFullYear(),
        description: ''
      })
      setSeasonThumbnail(null)
      setAddingNewSeason(false)
      
      // Mostrar mensagem de sucesso
      setSuccess('Temporada adicionada com sucesso!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Erro ao adicionar temporada:', err)
      setError(err.message || 'Erro ao adicionar temporada. Tente novamente.')
      setTimeout(() => setError(null), 3000)
    } finally {
      setSavingSeason(false)
    }
  }
  
  // Funções para manipular formulário de novo episódio
  const handleEpisodeInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setNewEpisodeData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }
  
  const handleEpisodeThumbnailChange = (e) => {
    setEpisodeThumbnail(e.target.files[0])
  }
  
  const handleEpisodeFileChange = (e) => {
    setEpisodeFile(e.target.files[0])
  }
  
  const startAddingEpisode = (seasonId) => {
    setCurrentSeasonId(seasonId)
    const season = seasons.find(s => s.id === seasonId)
    const currentEpisodes = episodes[seasonId] || []
    
    setNewEpisodeData({
      title: '',
      episodeNumber: currentEpisodes.length > 0 ? Math.max(...currentEpisodes.map(e => e.episode_number)) + 1 : 1,
      description: '',
      isExternal: true,
      mediaUrl: '',
      duration: 0
    })
    
    setEpisodeThumbnail(null)
    setEpisodeFile(null)
    setAddingNewEpisode(true)
  }
  
  const handleAddEpisode = async (e) => {
    e.preventDefault()
    setSavingEpisode(true)
    
    try {
      // Validar dados
      if (!newEpisodeData.title || !newEpisodeData.episodeNumber) {
        throw new Error('Título e número do episódio são obrigatórios')
      }
      
      if (newEpisodeData.isExternal && !newEpisodeData.mediaUrl) {
        throw new Error('URL do vídeo é obrigatória para fonte externa')
      }
      
      if (!newEpisodeData.isExternal && !episodeFile) {
        throw new Error('Arquivo de vídeo é obrigatório')
      }
      
      // Upload de thumbnail, se fornecido
      let thumbnailUrl = null
      if (episodeThumbnail) {
        const result = await uploadToSupabase(episodeThumbnail, 'episodes/thumbnails')
        thumbnailUrl = result.url
      }
      
      // Upload de vídeo ou usar URL externa
      let mediaUrl = newEpisodeData.mediaUrl
      let mediaType = 'external'
      
      if (!newEpisodeData.isExternal && episodeFile) {
        const result = await uploadToSupabase(episodeFile, 'episodes/videos')
        mediaUrl = result.url
        mediaType = 'uploaded'
      }
      
      // Criar episódio
      const episodePayload = {
        seriesId: id,
        seasonId: currentSeasonId,
        title: newEpisodeData.title,
        episodeNumber: parseInt(newEpisodeData.episodeNumber),
        description: newEpisodeData.description,
        thumbnailUrl,
        mediaUrl,
        type: mediaType,
        duration: parseFloat(newEpisodeData.duration) || 0
      }
      
      const newEpisode = await addEpisode(episodePayload)
      
      // Atualizar estado
      setEpisodes(prev => ({
        ...prev,
        [currentSeasonId]: [...(prev[currentSeasonId] || []), newEpisode]
      }))
      
      // Limpar formulário e fechar
      setAddingNewEpisode(false)
      
      // Mostrar mensagem de sucesso
      setSuccess('Episódio adicionado com sucesso!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Erro ao adicionar episódio:', err)
      setError(err.message || 'Erro ao adicionar episódio. Tente novamente.')
      setTimeout(() => setError(null), 3000)
    } finally {
      setSavingEpisode(false)
    }
  }

  if (loading) {
    return (
      <Layout title="Gerenciando Série">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    )
  }

  if (!isAdmin || !series) {
    return null
  }

  return (
    <Layout title={`Gerenciando: ${series.title}`}>
      <div className="max-w-5xl mx-auto">
        {/* Cabeçalho da série */}
        <div className="mb-8">
          {series.banner_url ? (
            <div className="w-full h-48 md:h-64 relative rounded-lg overflow-hidden mb-4">
              <Image
                src={series.banner_url}
                alt={series.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6">
                <h1 className="text-3xl md:text-4xl font-bold text-white">{series.title}</h1>
                <div className="flex items-center mt-2">
                  <span className="bg-primary/80 text-white px-2 py-1 rounded text-sm mr-2">
                    {series.is_anime ? 'Anime' : 'Série'}
                  </span>
                  {series.category && (
                    <span className="bg-background-light/80 text-white px-2 py-1 rounded text-sm">
                      {series.category}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <h1 className="text-3xl font-bold mb-4">{series.title}</h1>
          )}
          
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-text-secondary">{series.description}</p>
              <p className="text-sm text-text-secondary mt-2">
                {series.total_seasons} temporada{series.total_seasons !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Link 
                href="/admin/series"
                className="px-4 py-2 bg-background hover:bg-background-dark text-white rounded-md transition-colors"
              >
                Voltar
              </Link>
              <Link 
                href={`/admin/series/edit/${series.id}`}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
              >
                Editar Série
              </Link>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-500/80 text-white p-4 rounded-md mb-6">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-500/80 text-white p-4 rounded-md mb-6">
              {success}
            </div>
          )}
        </div>
        
        {/* Lista de temporadas */}
        <div className="bg-background-light rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Temporadas</h2>
            <button
              onClick={() => {
                setNewSeasonData({
                  title: '',
                  seasonNumber: seasons.length > 0 ? Math.max(...seasons.map(s => s.season_number)) + 1 : 1,
                  year: new Date().getFullYear(),
                  description: ''
                })
                setAddingNewSeason(true)
              }}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors"
            >
              Adicionar Temporada
            </button>
          </div>
          
          {/* Formulário para adicionar nova temporada */}
          {addingNewSeason && (
            <div className="bg-background-dark p-4 rounded-md mb-6">
              <h3 className="text-lg font-medium mb-4">Nova Temporada</h3>
              <form onSubmit={handleAddSeason}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="seasonTitle" className="block text-sm font-medium text-text-secondary mb-1">
                      Título
                    </label>
                    <input
                      id="seasonTitle"
                      name="title"
                      type="text"
                      value={newSeasonData.title}
                      onChange={handleSeasonInputChange}
                      className="w-full p-2 bg-background rounded border-0 text-white focus:ring-2 focus:ring-primary"
                      required
                      placeholder="ex: Temporada 1"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="seasonNumber" className="block text-sm font-medium text-text-secondary mb-1">
                      Número da Temporada
                    </label>
                    <input
                      id="seasonNumber"
                      name="seasonNumber"
                      type="number"
                      min="1"
                      value={newSeasonData.seasonNumber}
                      onChange={handleSeasonInputChange}
                      className="w-full p-2 bg-background rounded border-0 text-white focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="seasonYear" className="block text-sm font-medium text-text-secondary mb-1">
                      Ano de Lançamento
                    </label>
                    <input
                      id="seasonYear"
                      name="year"
                      type="number"
                      min="1900"
                      max="2099"
                      value={newSeasonData.year}
                      onChange={handleSeasonInputChange}
                      className="w-full p-2 bg-background rounded border-0 text-white focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="seasonThumbnail" className="block text-sm font-medium text-text-secondary mb-1">
                      Thumbnail (opcional)
                    </label>
                    <input
                      id="seasonThumbnail"
                      type="file"
                      accept="image/*"
                      onChange={handleSeasonThumbnailChange}
                      className="block w-full text-sm text-text-secondary
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-medium
                        file:bg-primary file:text-white
                        hover:file:bg-primary-dark
                        cursor-pointer"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="seasonDescription" className="block text-sm font-medium text-text-secondary mb-1">
                    Descrição (opcional)
                  </label>
                  <textarea
                    id="seasonDescription"
                    name="description"
                    value={newSeasonData.description}
                    onChange={handleSeasonInputChange}
                    rows={2}
                    className="w-full p-2 bg-background rounded border-0 text-white focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setAddingNewSeason(false)}
                    className="px-3 py-1 bg-background hover:bg-background-dark text-white rounded transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-primary hover:bg-primary-dark text-white rounded transition-colors"
                    disabled={savingSeason}
                  >
                    {savingSeason ? 'Salvando...' : 'Salvar Temporada'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {seasons.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-secondary">Nenhuma temporada adicionada. Adicione a primeira temporada para começar.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {seasons.map(season => (
                <div key={season.id} className="border border-background-dark rounded-md overflow-hidden">
                  <div 
                    className="flex justify-between items-center p-4 bg-background-dark cursor-pointer"
                    onClick={() => toggleSeason(season.id)}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 flex items-center justify-center bg-primary/20 rounded-full mr-3">
                        <span className="text-primary font-medium">{season.season_number}</span>
                      </div>
                      <div>
                        <h3 className="font-medium">{season.title}</h3>
                        <p className="text-sm text-text-secondary">
                          {season.episodes_count} episódio{season.episodes_count !== 1 ? 's' : ''} {season.year ? `• ${season.year}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteSeason(season.id)
                        }}
                        className="p-1 text-text-secondary hover:text-red-500 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${expandedSeason === season.id ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  
                  {expandedSeason === season.id && (
                    <div className="p-4 border-t border-background-dark">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">Episódios</h4>
                        <button
                          onClick={() => startAddingEpisode(season.id)}
                          className="px-3 py-1 bg-primary hover:bg-primary-dark text-white text-sm rounded transition-colors"
                        >
                          Adicionar Episódio
                        </button>
                      </div>
                      
                      {/* Lista de episódios */}
                      {!episodes[season.id] ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mx-auto"></div>
                          <p className="text-sm text-text-secondary mt-2">Carregando episódios...</p>
                        </div>
                      ) : episodes[season.id].length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-text-secondary">Nenhum episódio adicionado.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {episodes[season.id].map(episode => (
                            <div key={episode.id} className="flex justify-between items-center p-3 bg-background rounded-md">
                              <div className="flex items-center">
                                <div className="w-7 h-7 flex items-center justify-center bg-background-dark rounded-full mr-3">
                                  <span className="text-sm">{episode.episode_number}</span>
                                </div>
                                <div>
                                  <h5 className="font-medium">{episode.title}</h5>
                                  {episode.duration > 0 && (
                                    <p className="text-xs text-text-secondary">
                                      {Math.floor(episode.duration / 60)}min {Math.round(episode.duration % 60)}s
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Link
                                  href={`/admin/series/episodes/edit/${episode.id}`}
                                  className="p-1 text-text-secondary hover:text-primary transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </Link>
                                <button
                                  onClick={() => handleDeleteEpisode(episode.id, season.id)}
                                  className="p-1 text-text-secondary hover:text-red-500 transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Modal para adicionar novo episódio */}
      {addingNewEpisode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-background-light rounded-lg p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Adicionar Novo Episódio</h2>
            
            <form onSubmit={handleAddEpisode}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="episodeTitle" className="block text-sm font-medium text-text-secondary mb-1">
                    Título
                  </label>
                  <input
                    id="episodeTitle"
                    name="title"
                    type="text"
                    value={newEpisodeData.title}
                    onChange={handleEpisodeInputChange}
                    className="w-full p-2 bg-background rounded border-0 text-white focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="episodeNumber" className="block text-sm font-medium text-text-secondary mb-1">
                      Número do Episódio
                    </label>
                    <input
                      id="episodeNumber"
                      name="episodeNumber"
                      type="number"
                      min="1"
                      value={newEpisodeData.episodeNumber}
                      onChange={handleEpisodeInputChange}
                      className="w-full p-2 bg-background rounded border-0 text-white focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-text-secondary mb-1">
                      Duração (minutos)
                    </label>
                    <input
                      id="duration"
                      name="duration"
                      type="number"
                      min="0"
                      step="0.1"
                      value={newEpisodeData.duration}
                      onChange={handleEpisodeInputChange}
                      className="w-full p-2 bg-background rounded border-0 text-white focus:ring-2 focus:ring-primary"
                      placeholder="ex: 42.5"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">
                    Descrição (opcional)
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={newEpisodeData.description}
                    onChange={handleEpisodeInputChange}
                    rows={2}
                    className="w-full p-2 bg-background rounded border-0 text-white focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label htmlFor="episodeThumbnail" className="block text-sm font-medium text-text-secondary mb-1">
                    Thumbnail (opcional)
                  </label>
                  <input
                    id="episodeThumbnail"
                    type="file"
                    accept="image/*"
                    onChange={handleEpisodeThumbnailChange}
                    className="block w-full text-sm text-text-secondary
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-medium
                      file:bg-primary file:text-white
                      hover:file:bg-primary-dark
                      cursor-pointer"
                  />
                </div>
                
                <div className="flex items-center mt-4">
                  <input
                    id="isExternal"
                    name="isExternal"
                    type="checkbox"
                    checked={newEpisodeData.isExternal}
                    onChange={handleEpisodeInputChange}
                    className="h-4 w-4 text-primary border-0 focus:ring-primary bg-background"
                  />
                  <label htmlFor="isExternal" className="ml-2 block text-sm text-text-secondary">
                    Usar URL externa (YouTube, Google Drive, etc)
                  </label>
                </div>
                
                {newEpisodeData.isExternal ? (
                  <div>
                    <label htmlFor="mediaUrl" className="block text-sm font-medium text-text-secondary mb-1">
                      URL do Vídeo
                    </label>
                    <input
                      id="mediaUrl"
                      name="mediaUrl"
                      type="url"
                      value={newEpisodeData.mediaUrl}
                      onChange={handleEpisodeInputChange}
                      className="w-full p-2 bg-background rounded border-0 text-white focus:ring-2 focus:ring-primary"
                      required={newEpisodeData.isExternal}
                      placeholder="https://youtu.be/exemplo ou https://drive.google.com/file/d/..."
                    />
                    <p className="mt-1 text-xs text-text-secondary">
                      Para Google Drive, certifique-se de que o link permita acesso a qualquer pessoa com o link
                    </p>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="episodeFile" className="block text-sm font-medium text-text-secondary mb-1">
                      Arquivo de Vídeo
                    </label>
                    <input
                      id="episodeFile"
                      type="file"
                      accept="video/*"
                      onChange={handleEpisodeFileChange}
                      className="block w-full text-sm text-text-secondary
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-medium
                        file:bg-primary file:text-white
                        hover:file:bg-primary-dark
                        cursor-pointer"
                      required={!newEpisodeData.isExternal}
                    />
                    <p className="mt-1 text-xs text-text-secondary">
                      Formatos suportados: MP4, WebM, MOV. Tamanho máximo: 150MB
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setAddingNewEpisode(false)}
                  className="px-4 py-2 bg-background hover:bg-background-dark text-white rounded transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded transition-colors"
                  disabled={savingEpisode}
                >
                  {savingEpisode ? 'Salvando...' : 'Adicionar Episódio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}