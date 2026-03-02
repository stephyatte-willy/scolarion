import { NextResponse } from 'next/server';
import { runTransaction, query } from '@/app/lib/database';

export async function POST(request: Request) {
  try {
    console.log('🔵 API POST - Modification année scolaire');
    
    const data = await request.json();
    console.log('📝 Données reçues:', data);
    
    const { id, libelle, date_debut, date_fin, est_active } = data;
    
    // Validation
    if (!id) {
      return NextResponse.json(
        { success: false, erreur: 'ID manquant' },
        { status: 400 }
      );
    }
    
    if (!libelle || !date_debut || !date_fin) {
      return NextResponse.json(
        { success: false, erreur: 'Tous les champs sont obligatoires' },
        { status: 400 }
      );
    }
    
    // Vérifier que la date de fin est après la date de début
    if (new Date(date_fin) <= new Date(date_debut)) {
      return NextResponse.json(
        { success: false, erreur: 'La date de fin doit être postérieure à la date de début' },
        { status: 400 }
      );
    }
    
    // Vérifier si l'année existe
    const anneeExistante = await query(
      'SELECT * FROM annees_scolaires WHERE id = ?',
      [id]
    ) as any[];
    
    if (!anneeExistante || anneeExistante.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Année scolaire non trouvée' },
        { status: 404 }
      );
    }
    
    // Vérifier si l'année est clôturée
    if (anneeExistante[0].est_cloturee) {
      return NextResponse.json(
        { success: false, erreur: 'Une année clôturée ne peut pas être modifiée' },
        { status: 400 }
      );
    }
    
    await runTransaction(async (connection) => {
      // Si l'année devient active, désactiver les autres
      if (est_active) {
        await connection.execute(
          'UPDATE annees_scolaires SET est_active = 0 WHERE id != ?',
          [id]
        );
      }
      
      // Mettre à jour l'année
      await connection.execute(
        `UPDATE annees_scolaires 
         SET libelle = ?, date_debut = ?, date_fin = ?, est_active = ?
         WHERE id = ?`,
        [libelle, date_debut, date_fin, est_active ? 1 : 0, id]
      );
      
      // Si active, mettre à jour les paramètres
      if (est_active) {
        await connection.execute(
          'UPDATE parametres SET annee_scolaire = ? WHERE id = 1',
          [libelle]
        );
      }
    });
    
    console.log('✅ Modification réussie');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Année scolaire modifiée avec succès' 
    });
    
  } catch (error: any) {
    console.error('❌ Erreur modification année scolaire:', error);
    
    return NextResponse.json(
      { success: false, erreur: 'Erreur lors de la modification' },
      { status: 500 }
    );
  }
}