import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database'; 

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { frais_scolaire_id } = body;

    // Récupérer le frais scolaire
    const sqlFraisScolaire = `
      SELECT fs.*, c.nom as classe_nom 
      FROM frais_scolaires fs
      INNER JOIN classes c ON fs.classe_id = c.id
      WHERE fs.id = ?
    `;
    
    const fraisScolaires = await query(sqlFraisScolaire, [frais_scolaire_id]) as any[];
    
    if (fraisScolaires.length === 0) {
      return NextResponse.json({
        success: false,
        erreur: 'Frais scolaire non trouvé'
      });
    }

    const fraisScolaire = fraisScolaires[0];

    // Récupérer les élèves actifs de la classe
    const sqlEleves = `
      SELECT id FROM eleves 
      WHERE classe_id = ? AND statut = 'actif'
    `;
    
    const eleves = await query(sqlEleves, [fraisScolaire.classe_id]) as any[];
    
    if (eleves.length === 0) {
      return NextResponse.json({
        success: false,
        erreur: 'Aucun élève actif dans cette classe'
      });
    }

    let fraisGeneres = 0;
    const anneeScolaire = fraisScolaire.annee_scolaire;

    // Pour chaque élève, créer le frais
    for (const eleve of eleves) {
      // Vérifier si le frais existe déjà
      const sqlCheck = `
        SELECT id FROM frais_eleves 
        WHERE frais_scolaire_id = ? AND eleve_id = ? AND annee_scolaire = ?
      `;
      
      const existing = await query(sqlCheck, [frais_scolaire_id, eleve.id, anneeScolaire]) as any[];
      
      if (existing.length === 0) {
        // Calculer la date d'échéance
        const dateEcheance = new Date();
        dateEcheance.setMonth(dateEcheance.getMonth() + 1);
        const dateEcheanceStr = dateEcheance.toISOString().split('T')[0];

        // Créer le frais élève
        const sqlInsert = `
          INSERT INTO frais_eleves (
            frais_scolaire_id, eleve_id, annee_scolaire, montant, montant_paye, 
            date_echeance, statut
          ) VALUES (?, ?, ?, ?, 0, ?, 'en_attente')
        `;
        
        await query(sqlInsert, [
          frais_scolaire_id,
          eleve.id,
          anneeScolaire,
          fraisScolaire.montant,
          dateEcheanceStr
        ]);

        fraisGeneres++;

        // Si c'est une scolarité avec versements, créer les versements
        if (fraisScolaire.periodicite === 'annuel' && fraisScolaire.nombre_versements > 1) {
          await genererVersements(eleve.id, frais_scolaire_id, fraisScolaire);
        }
      }
    }

    return NextResponse.json({
      success: true,
      nombre_eleves: eleves.length,
      frais_generes: fraisGeneres,
      message: `${fraisGeneres} frais générés avec succès`
    });
  } catch (error: any) {
    console.error('Erreur génération frais élèves:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur lors de la génération des frais' },
      { status: 500 }
    );
  }
}

async function genererVersements(eleveId: number, fraisScolaireId: number, fraisScolaire: any) {
  try {
    const montantParVersement = parseFloat(fraisScolaire.montant) / (fraisScolaire.nombre_versements || 4);
    const dateDebut = fraisScolaire.date_debut_versements ? 
      new Date(fraisScolaire.date_debut_versements) : new Date();
    
    for (let i = 1; i <= (fraisScolaire.nombre_versements || 4); i++) {
      const dateEcheance = new Date(dateDebut);
      dateEcheance.setMonth(dateEcheance.getMonth() + (i - 1));
      
      await query(
        `INSERT INTO versements_scolarite (
          eleve_id, frais_scolaire_id, numero_versement, 
          montant_versement, date_echeance, statut
        ) VALUES (?, ?, ?, ?, ?, 'en_attente')`,
        [eleveId, fraisScolaireId, i, montantParVersement, dateEcheance.toISOString().split('T')[0]]
      );
    }
  } catch (error) {
    console.error('Erreur génération versements:', error);
  }
}