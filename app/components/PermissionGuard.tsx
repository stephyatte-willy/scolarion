// app/components/PermissionGuard.tsx
'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/app/hooks/usePermissions';
import './permission-guard.css'; // Optionnel

interface PermissionGuardProps {
  children: ReactNode;
  permission?: string;
  anyPermission?: string[];
  allPermissions?: string[];
  fallback?: ReactNode;
  userId?: number;
  showLoading?: boolean;
}

export default function PermissionGuard({
  children,
  permission,
  anyPermission,
  allPermissions,
  fallback = null,
  userId,
  showLoading = true
}: PermissionGuardProps) {
  const { can, canAny, canAll, loading, error } = usePermissions(userId);

  // Gestion du chargement
  if (loading) {
    if (showLoading) {
      return <div className="permission-loading">Chargement des permissions...</div>;
    }
    return null;
  }

  // Gestion des erreurs
  if (error) {
    console.error('Erreur permissions:', error);
    // En cas d'erreur, on refuse l'accès par sécurité
    return <>{fallback}</>;
  }

  // Vérification des permissions
  let hasAccess = true;

  if (permission) {
    hasAccess = can(permission);
  } else if (anyPermission && anyPermission.length > 0) {
    hasAccess = canAny(anyPermission);
  } else if (allPermissions && allPermissions.length > 0) {
    hasAccess = canAll(allPermissions);
  }

  // Si pas accès, afficher le fallback
  if (!hasAccess) {
    return <>{fallback}</>;
  }

  // Sinon afficher les enfants
  return <>{children}</>;
}
