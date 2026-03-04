import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

interface RouteParams {
  params: Promise<{
    userId: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Récupération asynchrone de l'userId
    const { userId } = await params;
    const userIdNum = parseInt(userId);
    
    console.log('🔍 Récupération employé pour userId:', userIdNum);
    
    if (isNaN(userIdNum) || userIdNum <= 0) {
      console.log('❌ userId invalide:', userId);
      return NextResponse.json({ 
        success: false, 
        erreur: 'ID utilisateur invalide' 
      }, { status: 400 });
    }
    
    const sql = `
      SELECT e.*, u.email, u.role
      FROM enseignants e
      INNER JOIN users u ON e.user_id = u.id
      WHERE e.user_id = ?
    `;
    
    const result = await query(sql, [userIdNum]);
    
    // ✅ Vérification robuste : s'assurer que c'est un tableau
    const employes = Array.isArray(result) ? result : [];
    
    console.log(`📊 Résultat: ${employes.length} employé(s) trouvé(s)`);
    
    if (employes.length === 0) {
      // ✅ Retourner null mais avec succès (pas d'erreur, juste pas de données)
      return NextResponse.json({ 
        success: true, 
        employe: null,
        message: 'Aucun employé trouvé pour cet utilisateur'
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      employe: employes[0] 
    });
    
  } catch (error: any) {
    console.error('❌ Erreur GET employe:', error);
    
    // ✅ Message d'erreur plus détaillé pour le debugging
    const errorMessage = error?.message || 'Erreur inconnue';
    
    return NextResponse.json(
      { 
        success: false, 
        erreur: 'Erreur lors de la récupération des données',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}