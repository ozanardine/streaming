import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';
import Button from '../ui/Button';

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Por favor, informe seu email');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      setSuccess(true);
    } catch (error) {
      console.error('Erro ao solicitar redefinição de senha:', error);
      setError(error.message || 'Erro ao processar solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black bg-opacity-75 px-4">
      <div className="w-full max-w-md overflow-hidden rounded-lg border border-background-light bg-background-dark p-8 sm:p-10 shadow-xl">
        <div className="mb-8 flex justify-center">
          <div className="relative h-10 w-32">
            <Image
              src="/images/logo.png"
              alt="Zanflix"
              fill
              className="object-contain"
            />
          </div>
        </div>
        
        <h1 className="mb-6 text-center text-2xl font-bold text-white">Recuperar Senha</h1>
        
        {error && (
          <div className="mb-6 rounded-md bg-error bg-opacity-80 p-3 text-sm text-white">
            {error}
          </div>
        )}
        
        {success ? (
          <div className="text-center">
            <div className="mb-6 rounded-md bg-success bg-opacity-80 p-4 text-sm text-white">
              <p>Enviamos um link para recuperação de senha para o email:</p>
              <p className="font-medium mt-2">{email}</p>
            </div>
            
            <p className="text-text-secondary mb-6">
              Por favor, verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
            </p>
            
            <Button variant="primary" onClick={() => window.location.href = '/login'}>
              Voltar para Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-text-secondary">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border-0 bg-background-light p-3 text-white focus:ring-2 focus:ring-primary"
                placeholder="Digite seu email cadastrado"
                required
              />
              <p className="mt-2 text-xs text-text-secondary">
                Enviaremos um link para você redefinir sua senha.
              </p>
            </div>
            
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={loading}
            >
              {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
            </Button>
            
            <div className="text-center">
              <Link href="/login" className="text-primary hover:text-primary-light transition-colors text-sm">
                Voltar para Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordForm;