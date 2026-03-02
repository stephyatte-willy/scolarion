'use client';

import { useState, useEffect } from 'react';

interface AvatarProps {
  userId: number;
  prenom: string;
  nom: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  className?: string;
}

export default function Avatar({ userId, prenom, nom, size = 'medium', className = '' }: AvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    chargerAvatar();
  }, [userId]);

  const chargerAvatar = async () => {
    try {
      setChargement(true);
      setErreur(false);
      
      // Récupérer les données utilisateur depuis le localStorage ou l'API
      const utilisateurStorage = localStorage.getItem('utilisateur');
      if (utilisateurStorage) {
        const utilisateur = JSON.parse(utilisateurStorage);
        if (utilisateur.avatar_url) {
          setAvatarUrl(utilisateur.avatar_url);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'avatar:', error);
      setErreur(true);
    } finally {
      setChargement(false);
    }
  };

  const initiales = `${prenom[0]?.toUpperCase() || ''}${nom[0]?.toUpperCase() || ''}`;
  
  const tailles = {
    small: 'w-8 h-8 text-xs',
    medium: 'w-12 h-12 text-sm',
    large: 'w-16 h-16 text-base',
    xlarge: 'w-24 h-24 text-xl'
  };

  const classeTaille = tailles[size];

  if (chargement) {
    return (
      <div className={`${classeTaille} rounded-full bg-gray-200 animate-pulse ${className}`}></div>
    );
  }

  if (avatarUrl && !erreur) {
    return (
      <img
        src={avatarUrl}
        alt={`Avatar de ${prenom} ${nom}`}
        className={`${classeTaille} rounded-full object-cover ${className}`}
        onError={() => setErreur(true)}
      />
    );
  }

  // Fallback aux initiales
  return (
    <div className={`${classeTaille} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold ${className}`}>
      {initiales}
    </div>
  );
}