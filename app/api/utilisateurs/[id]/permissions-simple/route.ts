import { NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

// Définir le type du contexte avec Promise pour les paramètres
interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    // Récupérer l'ID de manière asynchrone depuis les paramètres
    const { id } = await context.params;
    const userId = parseInt(id);
    
    console.log('🔍 Récupération permissions pour utilisateur ID:', userId);
    
    // Vérifier que l'ID est valide
    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID utilisateur invalide',
          permissions: [] 
        },
        { status: 400 }
      );
    }
    
    // Requête pour récupérer les permissions
    const permissions = await query(`
      SELECT DISTINCT p.code
      FROM permissions p
      INNER JOIN roles_permissions rp ON p.id = rp.permission_id
      INNER JOIN users_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = ?
    `, [userId]);
    
    // Transformer en tableau de codes
    const codes = Array.isArray(permissions) 
      ? permissions.map((p: any) => p.code)
      : [];
    
    console.log('✅ Permissions récupérées:', codes.length);
    
    return NextResponse.json({
      success: true,
      permissions: codes
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des permissions:', error);
    return NextResponse.json({ 
      success: false, 
      permissions: [],
      error: 'Erreur serveur'
    });
  }
}