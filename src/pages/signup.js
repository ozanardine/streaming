import React from 'react';
import SignupForm from '../components/auth/SignupForm';
import Layout from '../components/layout/Layout';

const SignupPage = () => {
  return (
    <Layout 
      title="Criar Conta | Zanflix"
      description="Crie uma conta para começar a assistir aos melhores conteúdos"
      showNavbar={false}
      showFooter={false}
      withGradient={true}
    >
      <SignupForm />
    </Layout>
  );
};

export default SignupPage;