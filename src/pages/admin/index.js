import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function AdminDashboard() {
  const [media, setMedia] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('media')
  const [showSeriesLink, setShowSeriesLink] = useState(false)
  const [error, setError] = useState(null)
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        router.push('/login')
        return
      }
      
      // Usar o isAdmin do contexto de autenticação em vez de fazer nova consulta
      if (!isAdmin) {
        router.push('/browse')
        return
      }
      
      setLoading(true)
      
      try {
        // Buscar mídia
        const { data: mediaData, error: mediaError } = await supabase
          .from('media')
          .select('*')
          .order('created_at', { ascending: false })
          
        if (mediaError) throw mediaError
        setMedia(mediaData || [])
        
        // Buscar usuários
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, is_admin, created_at')
          .order('created_at', { ascending: false })
          
        if (userError) throw userError
        
        // Buscar perfis para cada usuário
        const usersWithProfiles = await Promise.all(
          (userData || []).map(async (user) => {
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', user.id)
            
            return {
              ...user,
              profiles: profilesData || []
            }
          })
        )
        
        setUsers(usersWithProfiles || [])
      } catch (err) {
        console.error('Erro ao buscar dados:', err)
        setError('Erro ao carregar dados. Tente novamente.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [user, isAdmin, router])
  
  const deleteMedia = async (id) => {
    if (confirm('Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.')) {
      try {
        const { error } = await supabase
          .from('media')
          .delete()
          .eq('id', id)
          
        if (error) throw error
        
        // Atualizar lista
        setMedia(media.filter(item => item.id !== id))
      } catch (err) {
        console.error('Erro ao excluir mídia:', err)
        alert('Erro ao excluir item: ' + err.message)
      }
    }
  }
  
  const toggleAdminStatus = async (userId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_admin: !currentStatus })
        .eq('id', userId)
        
      if (error) throw error
      
      // Atualizar lista
      setUsers(users.map(u => {
        if (u.id === userId) {
          return { ...u, is_admin: !currentStatus }
        }
        return u
      }))
    } catch (err) {
      console.error('Erro ao atualizar status de admin:', err)
      alert('Erro ao atualizar status: ' + err.message)
    }
  }
  
  if (loading) {
    return (
      <Layout title="Painel Admin">
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
    <Layout title="Painel Admin">
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Painel Administrativo</h1>
          <Link 
            href="/admin/upload" 
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors"
          >
            Adicionar Novo Vídeo
          </Link>
        </div>
        
        {error && (
          <div className="bg-red-500/80 text-white p-4 rounded-md mb-6">
            {error}
          </div>
        )}
        
        <div className="border-b border-background-light mb-6">
          <div className="flex -mb-px">
            <button 
              className={`px-6 py-3 font-medium text-sm focus:outline-none ${activeTab === 'media' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-white'}`}
              onClick={() => setActiveTab('media')}
            >
              Gerenciar Filmes
            </button>
            <button 
              className={`px-6 py-3 font-medium text-sm focus:outline-none ${activeTab === 'series' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-white'}`}
              onClick={() => setActiveTab('series')}
            >
              Gerenciar Séries
            </button>
            <button 
              className={`px-6 py-3 font-medium text-sm focus:outline-none ${activeTab === 'users' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-white'}`}
              onClick={() => setActiveTab('users')}
            >
              Gerenciar Usuários
            </button>
          </div>
        </div>
        
        {activeTab === 'media' && (
          <div>
            <h2 className="text-lg font-medium mb-4">Conteúdo ({media.length} itens)</h2>
            
            {media.length === 0 ? (
              <div className="bg-background-light rounded-lg p-8 text-center">
                <p className="text-text-secondary">Nenhum conteúdo encontrado. Adicione agora!</p>
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
                        Adicionado em
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-background-light divide-y divide-background">
                    {media.map(item => (
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <Link 
                              href={`/watch/${item.id}`}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                            >
                              Assistir
                            </Link>
                            <Link 
                              href={`/admin/edit/${item.id}`}
                              className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                            >
                              Editar
                            </Link>
                            <button 
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                              onClick={() => deleteMedia(item.id)}
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
        )}
        
        {activeTab === 'series' && (
          <div className="bg-background-light rounded-lg p-8 text-center">
            <h2 className="text-xl font-bold mb-6">Gerenciamento de Séries e Animes</h2>
            <p className="text-text-secondary mb-6">
              Acesse o painel de gerenciamento de séries e animes para adicionar temporadas e episódios.
            </p>
            <Link 
              href="/admin/series"
              className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-md transition-colors inline-block"
            >
              Acessar Gerenciamento de Séries
            </Link>
          </div>
        )}
        
        {activeTab === 'users' && (
          <div>
            <h2 className="text-lg font-medium mb-4">Usuários ({users.length} usuários)</h2>
            
            {users.length === 0 ? (
              <div className="bg-background-light rounded-lg p-8 text-center">
                <p className="text-text-secondary">Nenhum usuário encontrado.</p>
              </div>
            ) : (
              <div className="overflow-x-auto bg-background-light rounded-lg shadow-md">
                <table className="min-w-full divide-y divide-background">
                  <thead className="bg-background">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Data de Registro
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Nº de Perfis
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Admin
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-background-light divide-y divide-background">
                    {users.map(user => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs text-text-secondary">{user.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                          {Array.isArray(user.profiles) ? user.profiles.length : 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_admin ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {user.is_admin ? 'Sim' : 'Não'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button 
                            className={`px-2 py-1 rounded text-xs text-white ${user.is_admin ? 'bg-orange-600 hover:bg-orange-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                            onClick={() => toggleAdminStatus(user.id, user.is_admin)}
                          >
                            {user.is_admin ? 'Remover Admin' : 'Tornar Admin'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}