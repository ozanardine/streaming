import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function Home() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      // Se o usuário estiver autenticado e tiver selecionado um perfil
      if (user && profile) {
        router.push('/browse');
      } 
      // Se o usuário estiver autenticado mas não tiver selecionado um perfil
      else if (user && !profile) {
        // Redirecionar para seleção de perfil ao invés de causar loop
        router.push('/profiles');
      } 
      // Se o usuário não estiver autenticado
      else {
        router.push('/login');
      }
    }
  }, [user, profile, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoadingSpinner size="large" message="Carregando..." />
    </div>
  );
}