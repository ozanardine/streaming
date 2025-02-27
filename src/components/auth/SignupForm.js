import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';
import Button from '../ui/Button';

const SignupForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Validate fields
    if (!email || !password || !confirmPassword) {
      setError('Todos os campos são obrigatórios');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, informe um email válido');
      return;
    }
    
    // Check passwords
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    
    // Validate password strength
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    // Password strength regex - requires at least one number and one letter
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;
    if (!passwordRegex.test(password)) {
      setError('A senha deve conter pelo menos uma letra e um número');
      return;
    }
    
    setLoading(true);
    
    try {
      // Try to create user in the authentication system
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Disable auto-confirmation to ensure user confirms email
          emailRedirectTo: window.location.origin + '/login'
        }
      });
      
      if (signupError) throw signupError;
      
      if (data?.user?.id) {
        try {
          // Check if user record needs to be manually created in users table
          const { data: userExists } = await supabase
            .from('users')
            .select('id')
            .eq('id', data.user.id)
            .single();
            
          if (!userExists) {
            // Only insert if record doesn't exist
            const { error: userError } = await supabase
              .from('users')
              .insert([{ 
                id: data.user.id, 
                is_admin: false,
                created_at: new Date()
              }]);
              
            if (userError) {
              console.error("Error creating user record:", userError);
              // Don't interrupt flow even if there's an error here
            }
          }
        } catch (userError) {
          console.error("Error checking/creating user record:", userError);
          // Don't interrupt flow even if there's an error here
        }
      }
      
      setMessage('Conta criada com sucesso! Verifique seu email para confirmar o cadastro.');
      // Clear fields
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      
      // Redirect after a few seconds
      setTimeout(() => {
        router.push('/login?message=check-email');
      }, 3000);
    } catch (error) {
      console.error('Error during signup:', error);
      
      // Specific handling for common errors
      if (error.message.includes("User already registered")) {
        setError("Este email já está registrado. Por favor, tente fazer login ou recuperar sua senha.");
      } else {
        setError(error.message || 'Erro ao criar conta. Tente novamente.');
      }
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
        
        <h1 className="mb-6 text-center text-2xl font-bold text-white">Criar Conta</h1>
        
        {error && (
          <div className="mb-6 rounded-md bg-error bg-opacity-80 p-4 text-sm text-white">
            {error}
          </div>
        )}
        
        {message && (
          <div className="mb-6 rounded-md bg-success bg-opacity-80 p-4 text-sm text-white">
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
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-text-secondary">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border-0 bg-background-light p-3 text-white focus:ring-2 focus:ring-primary"
              placeholder="Mínimo de 6 caracteres"
              required
            />
            <p className="mt-1 text-xs text-text-secondary">
              Use pelo menos 6 caracteres, com uma letra e um número.
            </p>
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-text-secondary">
              Confirmar Senha
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded border-0 bg-background-light p-3 text-white focus:ring-2 focus:ring-primary"
              placeholder="Digite a senha novamente"
              required
            />
          </div>
          
          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={loading}
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-text-secondary">
            Já tem uma conta?{' '}
            <Link href="/login" className="text-primary hover:text-primary-light transition-colors">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;