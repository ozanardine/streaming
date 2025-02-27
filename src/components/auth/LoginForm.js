import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();
  
  // Verificar se há mensagem de redirecionamento
  useEffect(() => {
    if (router.query.message === 'check-email') {
      setMessage('Por favor, verifique seu email para confirmar o cadastro.');
    }
  }, [router.query]);
  
  // Redirecionar se já estiver logado
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      await login(email, password);
    } catch (error) {
      setError(error.message);
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
        
        <h1 className="mb-6 text-center text-2xl font-bold text-white">Entrar</h1>
        
        {error && (
          <div className="mb-6 rounded-md bg-error bg-opacity-80 p-3 text-sm text-white">
            {error}
          </div>
        )}
        
        {message && (
          <div className="mb-6 rounded-md bg-success bg-opacity-80 p-3 text-sm text-white">
            {message}
          </div>
        )}
        
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
              placeholder="seu@email.com"
              required
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-text-secondary">
                Senha
              </label>
              <Link href="/forgot-password" className="text-xs text-primary hover:text-primary-light">
                Esqueceu a senha?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border-0 bg-background-light p-3 text-white focus:ring-2 focus:ring-primary"
              placeholder="Sua senha"
              required
            />
          </div>
          
          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-text-secondary">
            Não tem uma conta?{' '}
            <Link href="/signup" className="text-primary hover:text-primary-light transition-colors">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;