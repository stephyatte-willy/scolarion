// app/hooks/usePermissions.ts
import { useState, useEffect } from 'react';

interface Permission {
  id: number;
  nom: string;
  description?: string;
}

interface UsePermissionsReturn {
  permissions: Permission[];
  can: (permission: string) => boolean;
  canAny: (permissions: string[]) => boolean;
  canAll: (permissions: string[]) => boolean;
  loading: boolean;
  error: string | null;
}

export function usePermissions(userId?: number): UsePermissionsReturn {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/utilisateurs/${userId}/permissions`);
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des permissions');
        }

        const data = await response.json();
        
        if (data.success) {
          setPermissions(data.permissions || []);
        } else {
          setError(data.erreur || 'Erreur inconnue');
        }
      } catch (err: any) {
        console.error('Erreur fetch permissions:', err);
        setError(err.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [userId]);

  // Vérifier si l'utilisateur a une permission spécifique
  const can = (permission: string): boolean => {
    return permissions.some(p => p.nom === permission);
  };

  // Vérifier si l'utilisateur a au moins une des permissions
  const canAny = (permissionsList: string[]): boolean => {
    return permissionsList.some(p => permissions.some(userP => userP.nom === p));
  };

  // Vérifier si l'utilisateur a toutes les permissions
  const canAll = (permissionsList: string[]): boolean => {
    return permissionsList.every(p => permissions.some(userP => userP.nom === p));
  };

  return {
    permissions,
    can,
    canAny,
    canAll,
    loading,
    error
  };
}