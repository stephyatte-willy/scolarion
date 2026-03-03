import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

// ✅ BON - avec typage correct
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // Promise explicite
) {
  try {
    // Récupérer l'ID de manière asynchrone
    const { id } = await params;
    
    console.log('🔍 Récupération des rôles pour user ID:', id);
    
    // Vérifier que l'ID est valide
    if (!id) {
      console.error('❌ ID utilisateur manquant');
      return NextResponse.json({
        success: false,
        erreur: 'ID utilisateur manquant'
      }, { status: 400 });
    }

    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      console.error('❌ ID utilisateur invalide (NaN):', id);
      return NextResponse.json({
        success: false,
        erreur: 'ID utilisateur invalide'
      }, { status: 400 });
    }
    
    // Récupérer les rôles de l'utilisateur
    const rows = await query(`
      SELECT 
        ur.user_id,
        ur.role_id,
        r.nom as role_nom,
        r.description as role_description,
        r.niveau as role_niveau
      FROM users_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ?
    `, [userId]) as any[];
    
    console.log('✅ Rôles récupérés:', rows);
    
    // S'assurer que rows est un tableau
    const rolesArray = Array.isArray(rows) ? rows : [];
    
    return NextResponse.json({
      success: true,
      roles: rolesArray
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des rôles:', error);
    
    let errorMessage = 'Erreur inconnue';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('❌ Stack trace:', error.stack);
    }
    
    return NextResponse.json({
      success: false,
      erreur: 'Erreur lors de la récupération des rôles',
      details: errorMessage
    }, { status: 500 });
  }
}