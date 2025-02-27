import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useProfiles } from '../../hooks/useProfiles';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../ui/LoadingSpinner';

const ProfileCard = ({ profile, onClick, isActive }) => {
  const [hover, setHover] = useState(false);
  
  return (
    <button 
      className={`flex flex-col items-center transition-all duration-300 ${
        hover || isActive ? 'scale-105' : 'scale-100'
      }`}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className={`relative h-24 w-24 md:h-32 md:w-32 overflow-hidden rounded-lg transition-all duration-300 ${
        hover || isActive 
          ? 'border-4 border-primary shadow-xl' 
          : 'border-4 border-transparent shadow-md'
      }`}>
        <Image 
          src={profile.avatar_url || '/images/default-avatar.png'} 
          alt={profile.name || 'Profile'} 
          fill
          className="object-cover"
          unoptimized
        />
        
        {/* Overlay with play icon on hover */}
        <div className={`absolute inset-0 flex items-center justify-center bg-primary/0 transition-all duration-300 ${
          hover || isActive ? 'bg-primary/20' : ''
        }`}>
          {(hover || isActive) && (
            <div className="rounded-full bg-primary/80 p-2 transform transition-transform duration-300 scale-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
        </div>
      </div>
      <h3 className={`mt-3 text-lg transition-colors duration-200 ${
        hover || isActive ? 'text-white' : 'text-text-secondary'
      }`}>
        {profile.name}
      </h3>
    </button>
  );
};

const AddProfileButton = () => {
  const [hover, setHover] = useState(false);
  
  return (
    <Link 
      href="/profile/new" 
      className="flex flex-col items-center transition-all duration-300"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className={`flex h-24 w-24 md:h-32 md:w-32 items-center justify-center rounded-lg bg-background-light transition-all duration-300 ${
        hover 
          ? 'border-4 border-primary shadow-xl' 
          : 'border-4 border-transparent shadow-md'
      }`}>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-12 w-12 transition-colors duration-300 ${
            hover ? 'text-primary' : 'text-text-secondary'
          }`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <h3 className={`mt-3 text-lg transition-colors duration-200 ${
        hover ? 'text-white' : 'text-text-secondary'
      }`}>
        Adicionar Perfil
      </h3>
    </Link>
  );
};

const ProfileSelector = () => {
  const { profiles, loading, error } = useProfiles();
  const { setCurrentProfile } = useAuth();
  const [selectedProfile, setSelectedProfile] = useState(null);

  const handleProfileSelect = (profile) => {
    setSelectedProfile(profile.id);
    // Small delay to show the selection animation before navigating
    setTimeout(() => {
      setCurrentProfile(profile);
    }, 500);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="mb-8 w-48 h-12 relative">
          <Image
            src="/images/logo.png"
            alt="Zanflix"
            fill
            className="object-contain"
          />
        </div>
        <LoadingSpinner size="large" message="Carregando perfis..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="mb-8 w-48 h-12 relative">
          <Image
            src="/images/logo.png"
            alt="Zanflix"
            fill
            className="object-contain"
          />
        </div>
        <div className="max-w-md rounded-lg bg-background-card p-6 shadow-xl border border-background-light">
          <h2 className="mb-4 text-xl font-bold text-error">Erro</h2>
          <p className="mb-6 text-text-secondary">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary-dark"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/30"></div>
      
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="mb-12 w-48 h-12 relative">
          <Image
            src="/images/logo.png"
            alt="Zanflix"
            fill
            className="object-contain"
          />
        </div>
        
        <h1 className="mb-12 text-center text-3xl font-bold text-white md:text-4xl">
          Quem está assistindo?
        </h1>
        
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 lg:gap-8 max-w-4xl">
          {profiles.map(profile => (
            <ProfileCard 
              key={profile.id} 
              profile={profile} 
              onClick={() => handleProfileSelect(profile)}
              isActive={selectedProfile === profile.id}
            />
          ))}
          
          {/* Add profile button */}
          {profiles.length < 5 && (
            <AddProfileButton />
          )}
        </div>
        
        {/* Manage profiles button */}
        {profiles.length > 0 && (
          <button 
            className="mt-12 rounded-md border border-text-secondary/30 px-6 py-2 text-text-secondary transition-colors hover:border-text-secondary hover:text-white"
            onClick={() => router.push('/manage-profiles')}
          >
            Gerenciar Perfis
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileSelector;