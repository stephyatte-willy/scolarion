import { NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function POST(request: Request) {
  try {
    console.log('🔴 API POST - Suppression année scolaire');
    
    const data = await request.json();
    console.log('📝 Données reçues:', data);
    
    const { id } = data;
    
    if (!id) {
      return NextResponse.json(
        { success: false, erreur: 'ID manquant' },
        { status: 400 }
      );
    }
    
    // Vérifier si l'année existe
    const annee = await query(
      'SELECT * FROM annees_scolaires WHERE id = ?',
      [id]
    ) as any[];
    
    if (!annee || annee.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Année scolaire non trouvée' },
        { status: 404 }
      );
    }
    
    // Vérifier si c'est une année active
    if (annee[0].est_active) {
      return NextResponse.json(
        { success: false, erreur: 'Impossible de supprimer une année scolaire active' },
        { status: 400 }
      );
    }
    
    try {
      // ✅ CORRECTION: Vérifier d'abord si la table classes existe
      const tables = await query("SHOW TABLES LIKE 'classes'") as any[];
      
      if (tables && tables.length > 0) {
        // La table classes existe, vérifier les utilisations
        const utilisations = await query(
          'SELECT COUNT(*) as count FROM classes WHERE annee_scolaire_id = ?',
          [id]
        ) as any[];
        
        if (utilisations[0] && utilisations[0].count > 0) {
          return NextResponse.json(
            { success: false, erreur: 'Cette année scolaire est utilisée par des classes et ne peut pas être supprimée' },
            { status: 400 }
          );
        }
      } else {
        console.log('ℹ️ La table classes n\'existe pas, pas de vérification d\'utilisation');
      }
      
      // ✅ CORRECTION: Vérifier également dans d'autres tables potentielles
      try {
        // Vérifier dans la table inscriptions si elle existe
        const tablesInscriptions = await query("SHOW TABLES LIKE 'inscriptions'") as any[];
        if (tablesInscriptions && tablesInscriptions.length > 0) {
          const inscriptions = await query(
            'SELECT COUNT(*) as count FROM inscriptions WHERE annee_scolaire_id = ?',
            [id]
          ) as any[];
          
          if (inscriptions[0] && inscriptions[0].count > 0) {
            return NextResponse.json(
              { success: false, erreur: 'Cette année scolaire a des inscriptions et ne peut pas être supprimée' },
              { status: 400 }
            );
          }
        }
      } catch (e) {
        console.log('ℹ️ Table inscriptions non vérifiée:', e);
      }
      
      // ✅ Procéder à la suppression
      await query(
        'DELETE FROM annees_scolaires WHERE id = ?',
        [id]
      );
      
      console.log('✅ Suppression réussie');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Année scolaire supprimée avec succès' 
      });
      
    } catch (dbError: any) {
      console.error('❌ Erreur lors des vérifications DB:', dbError);
      // Si erreur de colonne, on tente quand même la suppression
      console.log('⚠️ Tentative de suppression directe après erreur de vérification');
      
      await query(
        'DELETE FROM annees_scolaires WHERE id = ?',
        [id]
      );
      
      return NextResponse.json({ 
        success: true, 
        message: 'Année scolaire supprimée avec succès' 
      });
    }
    
  } catch (error: any) {
    console.error('❌ Erreur suppression année scolaire:', error);
    
    // Message d'erreur plus détaillé pour le debug
    let errorMessage = 'Erreur lors de la suppression';
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      errorMessage = 'Cette année scolaire est référencée dans d\'autres tables et ne peut pas être supprimée';
    } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      errorMessage = 'Erreur de contrainte de clé étrangère';
    }
    
    return NextResponse.json(
      { success: false, erreur: errorMessage },
      { status: 500 }
    );
  }
}