'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/app/hooks/usePermissions';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: string;
  anyPermission?: string[];
  allPermissions?: string[];
  fallback?: ReactNode;
  userId?: number;
}

export default function PermissionGuard({
  children,
  permission,
  anyPermission,
  allPermissions,
  fallback = null,
  userId
}: PermissionGuardProps) {
  const { can, canAny, canAll, loading } = usePermissions(userId);

  if (loading) {
    return <div className="permission-loading">Chargement...</div>;
  }

  let hasAccess = true;

  if (permission) {
    hasAccess = can(permission);
  } else if (anyPermission && anyPermission.length > 0) {
    hasAccess = canAny(anyPermission);
  } else if (allPermissions && allPermissions.length > 0) {
    hasAccess = canAll(allPermissions);
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}