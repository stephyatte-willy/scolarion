import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API Catégories frais - Début GET');
    
    const searchParams = request.nextUrl.searchParams;
    const periodicite = searchParams.get('periodicite');
    
    let sql = `
      SELECT 
        id,
        nom,
        description,
        type,
        montant_base,
        periodicite,
        statut,
        created_at,
        updated_at
      FROM categories_frais
      WHERE statut = 'actif'
    `;
    
    const params: any[] = [];
    
    // Filtrer par périodicité si spécifié
    if (periodicite) {
      sql += ` AND periodicite = ?`;
      params.push(periodicite);
    }
    
    sql += ` ORDER BY nom ASC`;
    
    const result = await query(sql, params);
    
    // Garantir que c'est un tableau
    const categories = Array.isArray(result) ? result : [];
    
    console.log(`✅ ${categories.length} catégories de frais retournées`);
    
    return NextResponse.json({
      success: true,
      categories: categories
    });
  } catch (error: any) {
    console.error('💥 Erreur API catégories frais:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message || 'Erreur inconnue'}`,
        categories: []
      },
      { status: 500 }
    );
  }
}