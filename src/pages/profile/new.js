import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import ProfileSettings from '../../components/profiles/ProfileSettings';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const NewProfilePage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Verificar se o usuário está autenticado
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

  if (!user) {
    return null;
  }

  return (
    <Layout 
      title="Criar Perfil | Zanflix"
      description="Crie seu perfil personalizado na Zanflix"
      showNavbar={false}
      showFooter={false}
    >
      <ProfileSettings isNew={true} />
    </Layout>
  );
};

export default NewProfilePage;