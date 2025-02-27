import React from 'react';
import LoginForm from '../components/auth/LoginForm';
import Layout from '../components/layout/Layout';

const LoginPage = () => {
  return (
    <Layout 
      title="Entrar | Zanflix"
      description="Entre em sua conta para assistir aos melhores conteúdos"
      showNavbar={false}
      showFooter={false}
      withGradient={true}
    >
      <LoginForm />
    </Layout>
  );
};

export default LoginPage;