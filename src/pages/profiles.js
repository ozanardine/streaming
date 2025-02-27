import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import ProfileSelector from '../components/profiles/ProfileSelector';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function ProfilesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="large" message="Carregando..." />
      </div>
    );
  }
  
  // Se não estiver autenticado, não mostrar nada durante o redirecionamento
  if (!user) {
    return null;
  }
  
  return <ProfileSelector />;
}