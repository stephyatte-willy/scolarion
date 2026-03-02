import { NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET() {
  try {
    console.log('🔍 API Impayés - Début');

    // Déterminer l'année scolaire en cours
    const maintenant = new Date();
    const annee = maintenant.getFullYear();
    const mois = maintenant.getMonth() + 1;
    const anneeScolaire = mois >= 8 ? `${annee}-${annee + 1}` : `${annee - 1}-${annee}`;

    // Requête pour récupérer tous les impayés
    const sql = `
  SELECT 
    fe.id,
    fe.eleve_id,  -- Assurez-vous que ce champ est présent
    e.nom as eleve_nom,
    e.prenom as eleve_prenom,
    e.matricule as eleve_matricule,
    CONCAT(c.niveau, ' ', c.nom) as classe,
    c.id as classe_id,  -- Ce champ doit être présent
    cf.nom as categorie_frais,
    cf.id as categorie_id,  -- Ce champ doit être présent
    cf.periodicite,
    fe.montant as montant_total,
    fe.montant_paye,
    (fe.montant - fe.montant_paye) as reste_a_payer,
    fe.date_echeance,
    DATEDIFF(CURDATE(), fe.date_echeance) as jours_retard,
    e.telephone_parent,
    e.email_parents as email_parent,
    fe.statut,
    fe.annee_scolaire
  FROM frais_eleves fe
  INNER JOIN eleves e ON fe.eleve_id = e.id
  INNER JOIN classes c ON e.classe_id = c.id
  INNER JOIN frais_scolaires fs ON fe.frais_scolaire_id = fs.id
  INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
  WHERE fe.annee_scolaire = ?
    AND fe.montant_paye < fe.montant
    AND e.statut = 'actif'
  ORDER BY 
    CASE 
      WHEN fe.date_echeance < CURDATE() THEN 0 
      ELSE 1 
    END,
    fe.date_echeance ASC,
    c.niveau,
    c.nom,
    e.nom,
    e.prenom
`;

    const result = await query(sql, [anneeScolaire]) as any[];
    
    // Formater les résultats
    const impayes = result.map((row: any) => ({
      id: row.id,
      eleve_id: row.eleve_id,
      eleve_nom: row.eleve_nom,
      eleve_prenom: row.eleve_prenom,
      eleve_matricule: row.eleve_matricule,
      classe: row.classe,
      classe_id: row.classe_id,
      categorie_frais: row.categorie_frais,
      categorie_id: row.categorie_id,
      periodicite: row.periodicite,
      montant_total: Number(row.montant_total) || 0,
      montant_paye: Number(row.montant_paye) || 0,
      reste_a_payer: Number(row.reste_a_payer) || 0,
      date_echeance: row.date_echeance,
      jours_retard: Math.max(0, row.jours_retard || 0),
      telephone_parent: row.telephone_parent,
      email_parent: row.email_parent,
      statut: row.jours_retard > 0 ? 'en_retard' : row.statut,
      annee_scolaire: row.annee_scolaire
    }));

    console.log(`✅ ${impayes.length} impayés trouvés`);

    return NextResponse.json({
      success: true,
      impayes,
      total: impayes.length,
      total_montant: impayes.reduce((sum, i) => sum + i.reste_a_payer, 0)
    });

  } catch (error: any) {
    console.error('❌ Erreur récupération impayés:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur: ${error.message}`,
        impayes: [],
        total: 0,
        total_montant: 0
      },
      { status: 200 }
    );
  }
}