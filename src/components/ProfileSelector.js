import React from 'react'
import Image from 'next/image'
import { useProfiles } from '../hooks/useProfiles'
import { useAuth } from '../hooks/useAuth'

const ProfileSelector = () => {
  const { profiles, loading } = useProfiles()
  const { setCurrentProfile } = useAuth()

  if (loading) {
    return <div>Carregando perfis...</div>
  }

  return (
    <div className="profile-selector">
      <h1>Quem está assistindo?</h1>
      <div className="profiles-grid">
        {profiles.map(profile => (
          <div 
            key={profile.id}
            className="profile-item"
            onClick={() => setCurrentProfile(profile)}
          >
            <div className="profile-avatar">
              <Image 
                src={profile.avatar_url || '/images/default-avatar.png'} 
                alt={profile.name} 
                width={150} 
                height={150}
              />
            </div>
            <h3>{profile.name}</h3>
          </div>
        ))}
        
        <div className="profile-item add-profile">
          <Link href="/profile/new">
            <div className="profile-avatar add">
              <span>+</span>
            </div>
            <h3>Adicionar Perfil</h3>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ProfileSelector