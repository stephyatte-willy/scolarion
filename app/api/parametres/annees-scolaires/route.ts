import { NextResponse } from 'next/server';
import { runTransaction, query } from '@/app/lib/database';

export async function GET() {
  try {
    console.log('📥 API GET - Récupération des années scolaires');
    
    const rows = await query('SELECT * FROM annees_scolaires ORDER BY date_debut DESC');
    console.log('📊 Données de la DB (brutes):', rows);
    
    // ✅ S'assurer que les IDs sont bien des nombres
    const anneesAvecIdsNumeriques = (rows as any[]).map(row => ({
      ...row,
      id: Number(row.id), // Conversion explicite en nombre
      est_active: row.est_active === 1 || row.est_active === true,
      est_cloturee: row.est_cloturee === 1 || row.est_cloturee === true
    }));
    
    console.log('✅ Données envoyées avec IDs numériques:', anneesAvecIdsNumeriques);
    
    return NextResponse.json({ 
      success: true, 
      annees: anneesAvecIdsNumeriques 
    });
    
  } catch (error: any) {
    console.error('❌ Erreur GET annees:', error);
    return NextResponse.json(
      { success: false, erreur: error.message || 'Erreur lors de la récupération' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Vérifier que le corps de la requête n'est pas vide
    const text = await request.text();
    if (!text) {
      return NextResponse.json(
        { success: false, erreur: 'Données manquantes' },
        { status: 400 }
      );
    }
    
    const data = JSON.parse(text);
    
    console.log('📝 Création année scolaire:', data);
    
    // Validation
    if (!data.libelle || !data.date_debut || !data.date_fin) {
      return NextResponse.json(
        { success: false, erreur: 'Tous les champs sont obligatoires' },
        { status: 400 }
      );
    }
    
    // Vérifier que la date de fin est après la date de début
    if (new Date(data.date_fin) <= new Date(data.date_debut)) {
      return NextResponse.json(
        { success: false, erreur: 'La date de fin doit être postérieure à la date de début' },
        { status: 400 }
      );
    }
    
    const insertId = await runTransaction(async (connection) => {
      // Si la nouvelle année est active, désactiver les autres
      if (data.est_active) {
        await connection.execute(
          'UPDATE annees_scolaires SET est_active = 0'
        );
      }
      
      // Insérer la nouvelle année
      const [insertResult] = await connection.execute(
        `INSERT INTO annees_scolaires 
         (libelle, date_debut, date_fin, est_active) 
         VALUES (?, ?, ?, ?)`,
        [data.libelle, data.date_debut, data.date_fin, data.est_active ? 1 : 0]
      );
      
      // Si active, mettre à jour les paramètres
      if (data.est_active) {
        await connection.execute(
          'UPDATE parametres SET annee_scolaire = ? WHERE id = 1',
          [data.libelle]
        );
      }
      
      return (insertResult as any).insertId;
    });
    
    console.log('✅ Création réussie, ID:', insertId);
    
    return NextResponse.json({ 
      success: true, 
      id: insertId,
      message: 'Année scolaire créée avec succès' 
    });
    
  } catch (error: any) {
    console.error('❌ Erreur POST année scolaire:', error);
    
    let errorMessage = 'Erreur lors de la création';
    if (error.code === 'ER_DUP_ENTRY') {
      errorMessage = 'Cette année scolaire existe déjà';
    } else if (error instanceof SyntaxError) {
      errorMessage = 'Format de données invalide';
    } else {
      errorMessage = error.message || 'Erreur lors de la création';
    }
    
    return NextResponse.json(
      { success: false, erreur: errorMessage },
      { status: 500 }
    );
  }
}