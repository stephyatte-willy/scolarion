import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    
    console.log('🔍 Récupération des permissions pour user ID:', id);
    
    if (!id) {
      return NextResponse.json({
        success: false,
        erreur: 'ID utilisateur manquant'
      }, { status: 400 });
    }

    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      return NextResponse.json({
        success: false,
        erreur: 'ID utilisateur invalide'
      }, { status: 400 });
    }
    
    // Récupérer les permissions de l'utilisateur via ses rôles
    const rows = await query(`
      SELECT DISTINCT 
        p.id,
        p.nom,
        p.code,
        p.module,
        p.description
      FROM permissions p
      JOIN roles_permissions rp ON p.id = rp.permission_id
      JOIN users_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = ?
      ORDER BY p.module, p.nom
    `, [userId]);
    
    console.log('✅ Permissions récupérées:', rows);
    
    const permissionsArray = Array.isArray(rows) ? rows : [];
    
    return NextResponse.json({
      success: true,
      permissions: permissionsArray
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des permissions:', error);
    
    let errorMessage = 'Erreur inconnue';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('❌ Stack trace:', error.stack);
    }
    
    return NextResponse.json({
      success: false,
      erreur: 'Erreur lors de la récupération des permissions',
      details: errorMessage
    }, { status: 500 });
  }
}