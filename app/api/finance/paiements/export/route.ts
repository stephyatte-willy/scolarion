import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // ✅ Paramètres de filtrage (IDENTIQUES à l'affichage)
    const vue = searchParams.get('vue') || 'derniers';
    const date_debut = searchParams.get('date_debut');
    const date_fin = searchParams.get('date_fin');
    const classe_id = searchParams.get('classe_id');
    const mode_paiement = searchParams.get('mode_paiement');
    const statut = searchParams.get('statut');
    const eleve_id = searchParams.get('eleve_id');
    const du_jour = searchParams.get('du_jour');
    const du_mois = searchParams.get('du_mois');
    const de_l_annee = searchParams.get('de_l_annee');
    
    // ✅ Filtre catégorie des frais
    const categorie_frais_id = searchParams.get('categorie_frais_id');
    
    // ✅ Paramètres de tri
    const tri_champ = searchParams.get('tri_champ') || 'date';
    const tri_direction = searchParams.get('tri_direction') || 'desc';
    
    // ✅ Paramètres de pagination (pour l'export "filtre")
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    const tous = searchParams.get('tous') === 'true';

    console.log('🔍 API Export Paiements - Début GET');
    console.log('📊 Paramètres reçus:', {
      vue,
      categorie_frais_id,
      classe_id,
      mode_paiement,
      statut,
      eleve_id,
      du_jour,
      du_mois,
      de_l_annee,
      tri_champ,
      tri_direction,
      tous
    });

    // ✅ DÉCLARATION DES VARIABLES
    let sql = '';
    const params: any[] = [];

    // ✅ CONSTRUCTION DE LA REQUÊTE SQL SELON LA VUE (SANS ROW_NUMBER)
    if (vue === 'derniers') {
      // ✅ VUE "DERNIERS PAIEMENTS PAR CATÉGORIE POUR CHAQUE ÉLÈVE" - VERSION SANS ROW_NUMBER
      sql = `
        SELECT 
          p.id,
          p.frais_eleve_id,
          p.eleve_id,
          p.montant,
          p.date_paiement,
          DATE_FORMAT(p.date_paiement, '%d/%m/%Y') as date_paiement_formatee,
          p.mode_paiement,
          CASE 
            WHEN p.mode_paiement = 'especes' THEN 'Espèces'
            WHEN p.mode_paiement = 'cheque' THEN 'Chèque'
            WHEN p.mode_paiement = 'virement' THEN 'Virement'
            WHEN p.mode_paiement = 'carte' THEN 'Carte bancaire'
            WHEN p.mode_paiement = 'mobile' THEN 'Mobile Money'
            ELSE 'Autre'
          END as mode_paiement_libelle,
          p.reference_paiement,
          p.numero_versement,
          CASE 
            WHEN p.numero_versement IS NOT NULL THEN CONCAT(p.numero_versement, 'e Versement')
            ELSE 'Paiement global'
          END as type_versement,
          p.numero_recu,
          p.notes,
          p.statut AS statut_paiement,
          CASE 
            WHEN p.statut = 'paye' THEN 'Payé'
            WHEN p.statut = 'en_attente' THEN 'En attente'
            WHEN p.statut = 'annule' THEN 'Annulé'
            ELSE p.statut
          END as statut_libelle,
          DATE_FORMAT(p.created_at, '%H:%i') as heure_paiement,
          DATE_FORMAT(p.created_at, '%d/%m/%Y %H:%i') as date_heure_paiement,
          p.created_at,
          e.nom AS eleve_nom,
          e.prenom AS eleve_prenom,
          CONCAT(e.prenom, ' ', e.nom) as eleve_nom_complet,
          e.matricule AS eleve_matricule,
          c.nom AS classe_nom,
          c.niveau AS classe_niveau,
          CONCAT(c.niveau, ' ', c.nom) as classe_complet,
          cf.nom AS categorie_nom,
          cf.id AS categorie_id,
          cf.type AS categorie_type,
          cf.periodicite AS categorie_periodicite,
          fe.montant AS montant_total,
          fe.montant_paye,
          (fe.montant - fe.montant_paye) AS reste_a_payer,
          fe.annee_scolaire
        FROM paiements_frais p
        INNER JOIN (
          -- ✅ Sous-requête pour le dernier paiement de CHAQUE CATÉGORIE par élève
          SELECT p2.eleve_id, fs2.categorie_frais_id, MAX(p2.id) as max_id
          FROM paiements_frais p2
          INNER JOIN frais_eleves fe2 ON p2.frais_eleve_id = fe2.id
          INNER JOIN frais_scolaires fs2 ON fe2.frais_scolaire_id = fs2.id
          WHERE 1=1
      `;
      
      // ✅ AJOUTER LES FILTRES À LA SOUS-REQUÊTE
      if (categorie_frais_id && categorie_frais_id !== '') {
        sql += ` AND fs2.categorie_frais_id = ?`;
        params.push(parseInt(categorie_frais_id));
      }
      
      if (classe_id && classe_id !== '') {
        sql += ` AND EXISTS (SELECT 1 FROM eleves e2 WHERE e2.id = p2.eleve_id AND e2.classe_id = ?)`;
        params.push(parseInt(classe_id));
      }
      
      if (mode_paiement && mode_paiement !== '') {
        sql += ` AND p2.mode_paiement = ?`;
        params.push(mode_paiement);
      }
      
      if (statut && statut !== '') {
        sql += ` AND p2.statut = ?`;
        params.push(statut);
      }
      
      if (eleve_id && eleve_id !== '') {
        sql += ` AND p2.eleve_id = ?`;
        params.push(parseInt(eleve_id));
      }
      
      if (date_debut && date_debut !== '') {
        sql += ` AND p2.date_paiement >= ?`;
        params.push(date_debut);
      }
      
      if (date_fin && date_fin !== '') {
        sql += ` AND p2.date_paiement <= ?`;
        params.push(date_fin);
      }
      
      if (du_jour === 'true') {
        sql += ` AND DATE(p2.date_paiement) = CURDATE()`;
      }
      
      if (du_mois === 'true') {
        sql += ` AND MONTH(p2.date_paiement) = MONTH(CURDATE()) AND YEAR(p2.date_paiement) = YEAR(CURDATE())`;
      }
      
      if (de_l_annee === 'true') {
        sql += ` AND YEAR(p2.date_paiement) = YEAR(CURDATE())`;
      }
      
      sql += `
          GROUP BY p2.eleve_id, fs2.categorie_frais_id
        ) latest ON p.id = latest.max_id
        INNER JOIN frais_eleves fe ON p.frais_eleve_id = fe.id
        INNER JOIN frais_scolaires fs ON fe.frais_scolaire_id = fs.id
        INNER JOIN eleves e ON p.eleve_id = e.id
        INNER JOIN classes c ON e.classe_id = c.id
        INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
        WHERE 1=1
      `;
      
    } else {
      // ✅ VUE "TOUS LES PAIEMENTS" - TOUTES LES LIGNES
      sql = `
        SELECT 
          p.id,
          p.frais_eleve_id,
          p.eleve_id,
          p.montant,
          p.date_paiement,
          DATE_FORMAT(p.date_paiement, '%d/%m/%Y') as date_paiement_formatee,
          p.mode_paiement,
          CASE 
            WHEN p.mode_paiement = 'especes' THEN 'Espèces'
            WHEN p.mode_paiement = 'cheque' THEN 'Chèque'
            WHEN p.mode_paiement = 'virement' THEN 'Virement'
            WHEN p.mode_paiement = 'carte' THEN 'Carte bancaire'
            WHEN p.mode_paiement = 'mobile' THEN 'Mobile Money'
            ELSE 'Autre'
          END as mode_paiement_libelle,
          p.reference_paiement,
          p.numero_versement,
          CASE 
            WHEN p.numero_versement IS NOT NULL THEN CONCAT(p.numero_versement, 'e Versement')
            ELSE 'Paiement global'
          END as type_versement,
          p.numero_recu,
          p.notes,
          p.statut AS statut_paiement,
          CASE 
            WHEN p.statut = 'paye' THEN 'Payé'
            WHEN p.statut = 'en_attente' THEN 'En attente'
            WHEN p.statut = 'annule' THEN 'Annulé'
            ELSE p.statut
          END as statut_libelle,
          DATE_FORMAT(p.created_at, '%H:%i') as heure_paiement,
          DATE_FORMAT(p.created_at, '%d/%m/%Y %H:%i') as date_heure_paiement,
          p.created_at,
          e.nom AS eleve_nom,
          e.prenom AS eleve_prenom,
          CONCAT(e.prenom, ' ', e.nom) as eleve_nom_complet,
          e.matricule AS eleve_matricule,
          c.nom AS classe_nom,
          c.niveau AS classe_niveau,
          CONCAT(c.niveau, ' ', c.nom) as classe_complet,
          cf.nom AS categorie_nom,
          cf.id AS categorie_id,
          cf.type AS categorie_type,
          cf.periodicite AS categorie_periodicite,
          fe.montant AS montant_total,
          fe.montant_paye,
          (fe.montant - fe.montant_paye) AS reste_a_payer,
          fe.annee_scolaire
        FROM paiements_frais p
        INNER JOIN frais_eleves fe ON p.frais_eleve_id = fe.id
        INNER JOIN frais_scolaires fs ON fe.frais_scolaire_id = fs.id
        INNER JOIN eleves e ON p.eleve_id = e.id
        INNER JOIN classes c ON e.classe_id = c.id
        INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
        WHERE 1=1
      `;
    }

    // ✅ FILTRES COMMUNS AUX DEUX VUES
    if (vue !== 'derniers') {
      // Pour la vue "tous", on ajoute les filtres directement
      if (categorie_frais_id && categorie_frais_id !== '') {
        sql += ` AND fs.categorie_frais_id = ?`;
        params.push(parseInt(categorie_frais_id));
      }
      
      if (classe_id && classe_id !== '') {
        sql += ` AND e.classe_id = ?`;
        params.push(parseInt(classe_id));
      }
      
      if (mode_paiement && mode_paiement !== '') {
        sql += ` AND p.mode_paiement = ?`;
        params.push(mode_paiement);
      }
      
      if (statut && statut !== '') {
        sql += ` AND p.statut = ?`;
        params.push(statut);
      }
      
      if (eleve_id && eleve_id !== '') {
        sql += ` AND p.eleve_id = ?`;
        params.push(parseInt(eleve_id));
      }
      
      if (date_debut && date_debut !== '') {
        sql += ` AND p.date_paiement >= ?`;
        params.push(date_debut);
      }
      
      if (date_fin && date_fin !== '') {
        sql += ` AND p.date_paiement <= ?`;
        params.push(date_fin);
      }
      
      if (du_jour === 'true') {
        sql += ` AND DATE(p.date_paiement) = CURDATE()`;
      }
      
      if (du_mois === 'true') {
        sql += ` AND MONTH(p.date_paiement) = MONTH(CURDATE()) AND YEAR(p.date_paiement) = YEAR(CURDATE())`;
      }
      
      if (de_l_annee === 'true') {
        sql += ` AND YEAR(p.date_paiement) = YEAR(CURDATE())`;
      }
    }

    // ✅ ORDRE DE TRI
    let orderBy = '';
    switch (tri_champ) {
      case 'eleve': 
        orderBy = 'e.nom, e.prenom, e.matricule'; 
        break;
      case 'classe': 
        orderBy = 'c.niveau, c.nom, e.nom, e.prenom'; 
        break;
      case 'categorie': 
        orderBy = 'cf.nom, e.nom, e.prenom'; 
        break;
      case 'date': 
        orderBy = 'p.date_paiement'; 
        break;
      case 'versement': 
        orderBy = 'p.numero_versement'; 
        break;
      default: 
        orderBy = 'p.date_paiement DESC, p.created_at DESC';
    }
    
    sql += ` ORDER BY ${orderBy} ${tri_direction === 'desc' ? 'DESC' : 'ASC'}`;

    // ✅ LIMITE (seulement si pas "tous")
    if (!tous) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }

    console.log('📊 SQL Export (preview):', sql.substring(0, 500) + '...');
    console.log('📊 Paramètres:', params);

    // Exécuter la requête
    const result = await query(sql, params) as any[];
    
    console.log(`✅ ${result.length} paiements exportés pour la vue "${vue}"`);

    return NextResponse.json({
      success: true,
      paiements: result,
      total: result.length,
      vue,
      filtre: {
        categorie_id: categorie_frais_id,
        date_debut,
        date_fin,
        classe_id,
        mode_paiement,
        statut,
        eleve_id,
        du_jour: du_jour === 'true',
        du_mois: du_mois === 'true',
        de_l_annee: de_l_annee === 'true'
      }
    });
    
  } catch (error: any) {
    console.error('❌ Erreur export paiements:', error);
    console.error('❌ Message:', error.message);
    console.error('❌ Stack:', error.stack);
    
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message}`,
        paiements: [] 
      },
      { status: 200 }
    );
  }
}