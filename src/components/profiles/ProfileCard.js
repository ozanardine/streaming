import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';

const ProfileCard = ({ profile, onSelect, isActive = false, showManageButton = true }) => {
  const [hover, setHover] = useState(false);
  const { setCurrentProfile } = useAuth();
  const router = useRouter();
  
  const handleSelect = () => {
    if (onSelect) {
      onSelect(profile);
    } else {
      // Default behavior - make it current profile and go to browse
      setCurrentProfile(profile);
      router.push('/browse');
    }
  };
  
  return (
    <div 
      className={`relative rounded-lg overflow-hidden transition-all duration-300 ${
        isActive || hover 
          ? 'bg-background-light/30 shadow-lg transform scale-105' 
          : 'bg-background-dark shadow'
      }`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="p-5 flex flex-col items-center">
        {/* Avatar */}
        <div className={`relative h-24 w-24 rounded-lg overflow-hidden border-4 transition-all duration-300 ${
          isActive || hover ? 'border-primary' : 'border-background'
        }`}>
          <Image
            src={profile.avatar_url || '/images/default-avatar.png'}
            alt={profile.name}
            fill
            className="object-cover"
            unoptimized
          />
          
          {/* Overlay on hover */}
          {(hover && !isActive) && (
            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
              <div className="rounded-full bg-primary p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          )}
        </div>
        
        {/* Profile name */}
        <h3 className={`mt-4 text-lg font-medium transition-colors duration-200 ${
          isActive || hover ? 'text-white' : 'text-text-secondary'
        }`}>
          {profile.name}
        </h3>
        
        {/* Actions */}
        <div className="mt-4 space-y-2 w-full">
          {!isActive && (
            <Button
              variant={hover ? "primary" : "dark"}
              size="sm"
              onClick={handleSelect}
              fullWidth
            >
              {onSelect ? 'Selecionar' : 'Assistir'}
            </Button>
          )}
          
          {showManageButton && (
            <Link href={`/profile/${profile.id}`} className="block w-full">
              <Button
                variant="outline"
                size="sm"
                fullWidth
              >
                Gerenciar
              </Button>
            </Link>
          )}
        </div>
      </div>
      
      {/* Active indicator */}
      {isActive && (
        <div className="absolute top-2 right-2">
          <div className="bg-primary text-white text-xs rounded-full px-2 py-1">
            Atual
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileCard;