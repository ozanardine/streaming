import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import ProfileSettings from '../../components/ProfileSettings'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

export default function ProfilePage() {
  const router = useRouter()
  const { id } = router.query
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isOwner, setIsOwner] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (router.query.success === 'true') {
      setShowSuccess(true)
      // Esconder a mensagem após 3 segundos
      const timer = setTimeout(() => {
        setShowSuccess(false)
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [router.query.success])

  useEffect(() => {
    const checkProfileOwnership = async () => {
      if (!user || !id || id === 'new') {
        setLoading(false)
        return
      }
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('id', id)
          .single()
          
        if (error) throw error
        
        const isUserOwner = data.user_id === user.id
        setIsOwner(isUserOwner)
        
        if (!isUserOwner) {
          router.push('/browse')
        }
      } catch (err) {
        console.error('Erro ao verificar perfil:', err)
        setError('Perfil não encontrado ou você não tem permissão para acessá-lo.')
      } finally {
        setLoading(false)
      }
    }
    
    if (!authLoading) {
      if (!user) {
        router.push('/login')
      } else {
        checkProfileOwnership()
      }
    }
  }, [id, user, authLoading, router])

  if (authLoading || loading) {
    return (
      <Layout title="Perfil">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Perfil">
        <div className="max-w-md mx-auto bg-background-light p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-red-500 mb-4">Erro</h2>
          <p className="mb-6">{error}</p>
          <button 
            onClick={() => router.push('/browse')}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors"
          >
            Voltar
          </button>
        </div>
      </Layout>
    )
  }

  const isNewProfile = id === 'new'

  if (!user || (!isNewProfile && !isOwner)) {
    return null
  }

  return (
    <Layout title={isNewProfile ? 'Novo Perfil' : 'Editar Perfil'}>
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-md shadow-lg z-50 animate-fade-in-out">
          Perfil atualizado com sucesso!
        </div>
      )}
      
      <ProfileSettings 
        profileId={isNewProfile ? null : id} 
        isNew={isNewProfile}
      />
    </Layout>
  )
}

// CSS para animação de fade in/out
const styles = `
@keyframes fadeInOut {
  0% { opacity: 0; transform: translateY(-20px); }
  10% { opacity: 1; transform: translateY(0); }
  90% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-20px); }
}

.animate-fade-in-out {
  animation: fadeInOut 3s forwards;
}
`;