import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useProfiles } from '../hooks/useProfiles'
import { useAuth } from '../hooks/useAuth'

const ProfileSelector = () => {
  const { profiles, loading } = useProfiles()
  const { setCurrentProfile } = useAuth()

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-bold mb-12">Quem está assistindo?</h1>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 max-w-4xl">
        {profiles.map(profile => (
          <button 
            key={profile.id}
            className="flex flex-col items-center group"
            onClick={() => setCurrentProfile(profile)}
          >
            <div className="w-24 h-24 md:w-32 md:h-32 relative overflow-hidden rounded-lg mb-3 border-4 border-transparent group-hover:border-white transition-all duration-200 group-focus:outline-none group-focus:border-white">
              {profile.avatar_url ? (
                <Image 
                  src={profile.avatar_url} 
                  alt={profile.name || 'Profile'} 
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <Image 
                  src="/images/default-avatar.png" 
                  alt={profile.name || 'Profile'} 
                  fill
                  className="object-cover"
                  unoptimized
                />
              )}
            </div>
            <h3 className="text-gray-400 group-hover:text-white transition-colors duration-200">{profile.name}</h3>
          </button>
        ))}
        
        <Link href="/profile/new" className="flex flex-col items-center group">
          <div className="w-24 h-24 md:w-32 md:h-32 flex items-center justify-center rounded-lg bg-background-light mb-3 border-4 border-transparent group-hover:border-white transition-all duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 group-hover:text-white transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="text-gray-400 group-hover:text-white transition-colors duration-200">Adicionar Perfil</h3>
        </Link>
      </div>
    </div>
  )
}

export default ProfileSelector