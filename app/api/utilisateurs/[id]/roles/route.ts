import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database'; // Correction du chemin

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Dans Next.js 13+, params peut être une Promise, on doit l'attendre
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
    
    // Récupérer les rôles de l'utilisateur - CORRECTION: on enlève ur.id qui n'existe pas
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
    `, [userId]);
    
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