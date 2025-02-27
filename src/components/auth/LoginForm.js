import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../hooks/useAuth';
import { useProfiles } from '../../hooks/useProfiles';
import Button from '../ui/Button';
import { useToast } from '../../hooks/useToast';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const { profiles, loading: profilesLoading } = useProfiles();
  const { error: showError } = useToast();
  const router = useRouter();
  
  // Verificar se há mensagem de redirecionamento
  useEffect(() => {
    if (router.query.message === 'check-email') {
      setMessage('Por favor, verifique seu email para confirmar o cadastro.');
    }
  }, [router.query]);
  
  // Redirecionar após autenticação bem-sucedida
  useEffect(() => {
    if (user && !profilesLoading) {
      // Se tiver perfis, vai para a seleção de perfil
      // Se não tiver perfis, vai para a criação de perfil
      if (profiles && profiles.length > 0) {
        router.push('/profiles');
      } else {
        router.push('/profile/new');
      }
    }
  }, [user, profiles, profilesLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }
    
    setError(null);
    setLoading(true);
    
    try {
      await login(email, password);
      // O redirecionamento será tratado pelo useEffect acima
    } catch (err) {
      console.error('Erro de login:', err);
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
      showError && showError('Falha na autenticação. Tente novamente.');
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
              disabled={loading}
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
              disabled={loading}
            />
          </div>
          
          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={loading}
            disabled={loading}
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