import React from 'react';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import Layout from '../components/layout/Layout';

const ForgotPasswordPage = () => {
  return (
    <Layout 
      title="Recuperar Senha | Zanflix"
      description="Recupere o acesso à sua conta"
      showNavbar={false}
      showFooter={false}
      withGradient={true}
    >
      <ForgotPasswordForm />
    </Layout>
  );
};

export default ForgotPasswordPage;