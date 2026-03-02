import { NextResponse } from 'next/server';
import { runTransaction, query } from '@/app/lib/database';

export async function POST(request: Request) {
  try {
    console.log('🔵 API POST - Activation année scolaire');
    
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
    
    // Vérifier si l'année est clôturée
    if (annee[0].est_cloturee) {
      return NextResponse.json(
        { success: false, erreur: 'Une année clôturée ne peut pas être activée' },
        { status: 400 }
      );
    }
    
    await runTransaction(async (connection) => {
      // Désactiver toutes les années
      await connection.execute(
        'UPDATE annees_scolaires SET est_active = 0'
      );
      
      // Activer l'année spécifiée
      await connection.execute(
        'UPDATE annees_scolaires SET est_active = 1 WHERE id = ?',
        [id]
      );
      
      // Mettre à jour l'année scolaire dans les paramètres
      await connection.execute(
        'UPDATE parametres SET annee_scolaire = ? WHERE id = 1',
        [annee[0].libelle]
      );
    });
    
    console.log('✅ Activation réussie');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Année scolaire activée avec succès' 
    });
    
  } catch (error: any) {
    console.error('❌ Erreur activation année:', error);
    
    return NextResponse.json(
      { success: false, erreur: 'Erreur lors de l\'activation' },
      { status: 500 }
    );
  }
}