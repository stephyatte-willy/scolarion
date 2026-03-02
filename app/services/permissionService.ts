interface Permission {
  id: number;
  nom: string;
  code: string;
  module: string;
}

interface UserRole {
  id: number;
  nom: string;
  niveau: number;
  // Ne pas inclure permissions ici pour éviter la confusion
}

class PermissionService {
  private static instance: PermissionService;
  private permissionsCache: string[] = []; // Tableau de codes (string)
  private userRolesCache: UserRole[] = [];
  private currentUserId: number | null = null;

  static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  async loadUserPermissions(userId: number): Promise<{
    success: boolean;
    permissions?: string[];
    roles?: UserRole[];
    error?: string;
  }> {
    try {
      console.log('🔍 Chargement permissions pour user:', userId);
      
      const response = await fetch(`/api/utilisateurs/${userId}/permissions`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📥 Données reçues de l\'API:', data);
      
      if (data.success) {
        this.currentUserId = userId;
        // IMPORTANT: data.permissions est un tableau de strings
        this.permissionsCache = data.permissions || [];
        this.userRolesCache = data.roles || [];
        
        console.log('✅ Permissions chargées:', this.permissionsCache);
        console.log('✅ Rôles chargés:', this.userRolesCache);
        
        return {
          success: true,
          permissions: this.permissionsCache,
          roles: this.userRolesCache
        };
      } else {
        throw new Error(data.erreur || 'Erreur chargement permissions');
      }
    } catch (error) {
      console.error('❌ Erreur chargement permissions:', error);
      
      // Fallback pour admin si erreur
      const userStr = localStorage.getItem('utilisateur');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'admin') {
          const adminPermissions = this.getAdminPermissions();
          this.permissionsCache = adminPermissions;
          return {
            success: true,
            permissions: adminPermissions,
            roles: [{ id: 1, nom: 'Administrateur', niveau: 100 }]
          };
        }
      }
      
      return {
        success: false,
        error: 'Impossible de charger les permissions'
      };
    }
  }

  private getAdminPermissions(): string[] {
    return [
      'dashboard.view',
      'eleves.view', 'eleves.create', 'eleves.edit', 'eleves.delete',
      'classes.view', 'classes.manage',
      'personnel.view', 'personnel.create', 'personnel.edit', 'personnel.delete',
      'cours.view', 'cours.manage',
      'emploi.view', 'emploi.manage',
      'notes.view', 'notes.create', 'notes.edit',
      'absences.view', 'absences.manage',
      'finance.view', 'finance.manage',
      'settings.view', 'settings.manage', 'roles.manage', 'permissions.manage'
    ];
  }

  hasPermission(permissionCode: string): boolean {
    // Vérifier que permissionsCache est un tableau
    if (!Array.isArray(this.permissionsCache) || this.permissionsCache.length === 0) {
      console.warn('⚠️ Permissions non chargées ou tableau vide, vérification:', permissionCode);
      return false;
    }
    
    const has = this.permissionsCache.includes(permissionCode);
    console.log(`🔐 Vérification ${permissionCode}: ${has ? '✅' : '❌'} (${this.permissionsCache.length} permissions en cache)`);
    return has;
  }

  hasAnyPermission(permissionCodes: string[]): boolean {
    return permissionCodes.some(code => this.hasPermission(code));
  }

  hasAllPermissions(permissionCodes: string[]): boolean {
    return permissionCodes.every(code => this.hasPermission(code));
  }

  getUserRoles(): UserRole[] {
    return this.userRolesCache;
  }

  clearCache(): void {
    this.permissionsCache = [];
    this.userRolesCache = [];
    this.currentUserId = null;
  }
}

export default PermissionService.getInstance();