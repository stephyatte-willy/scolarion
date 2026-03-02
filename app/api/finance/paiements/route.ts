// api/finance/paiements/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

// Classe pour gérer les numéros de reçu consécutifs
class ReceiptManager {
  static async getNextReceiptNumber(): Promise<number> {
    const currentYear = new Date().getFullYear();
    
    try {
      const checkSql = `SELECT * FROM numero_recu_sequence WHERE annee = ?`;
      const result = await query(checkSql, [currentYear]) as any[];
      
      if (result.length === 0) {
        const insertSql = `INSERT INTO numero_recu_sequence (dernier_numero, annee) VALUES (0, ?)`;
        await query(insertSql, [currentYear]);
        return 1;
      } else {
        const updateSql = `UPDATE numero_recu_sequence SET dernier_numero = dernier_numero + 1, updated_at = NOW() WHERE annee = ?`;
        await query(updateSql, [currentYear]);
        
        const getSql = `SELECT dernier_numero FROM numero_recu_sequence WHERE annee = ?`;
        const newResult = await query(getSql, [currentYear]) as any[];
        return newResult[0].dernier_numero;
      }
    } catch (error) {
      console.error('Erreur gestion numéro reçu:', error);
      return Math.floor(Date.now() / 1000);
    }
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const vue = searchParams.get('vue') || 'derniers';
  
  try {
    console.log('🔍 API Paiements - Début GET');
    
    // Récupérer les paramètres
    const date_debut = searchParams.get('date_debut');
    const date_fin = searchParams.get('date_fin');
    const classe_id = searchParams.get('classe_id');
    const mode_paiement = searchParams.get('mode_paiement');
    const statut = searchParams.get('statut');
    const eleve_id = searchParams.get('eleve_id');
    const du_jour = searchParams.get('du_jour');
    const du_mois = searchParams.get('du_mois');
    const de_l_annee = searchParams.get('de_l_annee');
    const categorie_frais_id = searchParams.get('categorie_frais_id');
    
    // Paramètres de tri et pagination
    const tri_champ = searchParams.get('tri_champ') || 'date';
    const tri_direction = searchParams.get('tri_direction') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    console.log('📊 Paramètres reçus:', {
      vue,
      categorie_frais_id,
      classe_id,
      mode_paiement,
      statut,
      eleve_id,
      date_debut,
      date_fin
    });

    // ✅ DÉCLARATION DES VARIABLES
    let sql = '';
    let countSql = '';
    const params: any[] = [];
    const countParams: any[] = [];

    // ✅ CONSTRUCTION DE LA REQUÊTE SQL SELON LA VUE
    if (vue === 'derniers') {
      // VUE "DERNIERS PAIEMENTS" - inchangée
      sql = `
        SELECT 
          p.id,
          p.frais_eleve_id,
          p.eleve_id,
          p.montant,
          p.date_paiement,
          p.mode_paiement,
          p.reference_paiement,
          p.numero_versement,
          p.numero_recu,
          p.notes,
          p.statut AS statut_paiement,
          p.created_at,
          e.nom AS eleve_nom,
          e.prenom AS eleve_prenom,
          e.matricule AS eleve_matricule,
          c.nom AS classe_nom,
          c.niveau AS classe_niveau,
          cf.nom AS categorie_nom,
          cf.id AS categorie_id,
          fe.montant AS montant_total,
          fe.montant_paye,
          (fe.montant - fe.montant_paye) AS reste_a_payer_global,
          (fe.montant - fe.montant_paye) AS reste_a_payer
        FROM paiements_frais p
        INNER JOIN (
          SELECT p2.eleve_id, fs2.categorie_frais_id, MAX(p2.id) as max_id
          FROM paiements_frais p2
          INNER JOIN frais_eleves fe2 ON p2.frais_eleve_id = fe2.id
          INNER JOIN frais_scolaires fs2 ON fe2.frais_scolaire_id = fs2.id
          WHERE 1=1
      `;
      
      // Ajout des filtres à la sous-requête...
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
      
      // Requête de comptage...
      countSql = `
        SELECT COUNT(*) as total
        FROM (
          SELECT p2.eleve_id, fs2.categorie_frais_id
          FROM paiements_frais p2
          INNER JOIN frais_eleves fe2 ON p2.frais_eleve_id = fe2.id
          INNER JOIN frais_scolaires fs2 ON fe2.frais_scolaire_id = fs2.id
          WHERE 1=1
      `;
      
      const countParamsTemp: any[] = [];
      
      if (categorie_frais_id && categorie_frais_id !== '') {
        countSql += ` AND fs2.categorie_frais_id = ?`;
        countParamsTemp.push(parseInt(categorie_frais_id));
      }
      
      if (classe_id && classe_id !== '') {
        countSql += ` AND EXISTS (SELECT 1 FROM eleves e2 WHERE e2.id = p2.eleve_id AND e2.classe_id = ?)`;
        countParamsTemp.push(parseInt(classe_id));
      }
      
      if (mode_paiement && mode_paiement !== '') {
        countSql += ` AND p2.mode_paiement = ?`;
        countParamsTemp.push(mode_paiement);
      }
      
      if (statut && statut !== '') {
        countSql += ` AND p2.statut = ?`;
        countParamsTemp.push(statut);
      }
      
      if (eleve_id && eleve_id !== '') {
        countSql += ` AND p2.eleve_id = ?`;
        countParamsTemp.push(parseInt(eleve_id));
      }
      
      if (date_debut && date_debut !== '') {
        countSql += ` AND p2.date_paiement >= ?`;
        countParamsTemp.push(date_debut);
      }
      
      if (date_fin && date_fin !== '') {
        countSql += ` AND p2.date_paiement <= ?`;
        countParamsTemp.push(date_fin);
      }
      
      if (du_jour === 'true') {
        countSql += ` AND DATE(p2.date_paiement) = CURDATE()`;
      }
      
      if (du_mois === 'true') {
        countSql += ` AND MONTH(p2.date_paiement) = MONTH(CURDATE()) AND YEAR(p2.date_paiement) = YEAR(CURDATE())`;
      }
      
      if (de_l_annee === 'true') {
        countSql += ` AND YEAR(p2.date_paiement) = YEAR(CURDATE())`;
      }
      
      countSql += `
          GROUP BY p2.eleve_id, fs2.categorie_frais_id
        ) as subquery
      `;
      
      countParams.push(...countParamsTemp);
      
    } else {
      // ✅ VUE "TOUS LES PAIEMENTS" - CORRIGÉE POUR LE RESTE À PAYER DYNAMIQUE
      sql = `
        SELECT 
          p.id,
          p.frais_eleve_id,
          p.eleve_id,
          p.montant,
          p.date_paiement,
          p.mode_paiement,
          p.reference_paiement,
          p.numero_versement,
          p.numero_recu,
          p.notes,
          p.statut AS statut_paiement,
          p.created_at,
          e.nom AS eleve_nom,
          e.prenom AS eleve_prenom,
          e.matricule AS eleve_matricule,
          c.nom AS classe_nom,
          c.niveau AS classe_niveau,
          cf.nom AS categorie_nom,
          cf.id AS categorie_id,
          fe.montant AS montant_total,
          fe.montant_paye AS montant_paye_global,
          (
            SELECT SUM(p2.montant)
            FROM paiements_frais p2
            WHERE p2.frais_eleve_id = p.frais_eleve_id
              AND (p2.date_paiement < p.date_paiement OR (p2.date_paiement = p.date_paiement AND p2.id <= p.id))
          ) AS montant_paye_jusqu_ici,
          fe.montant - (
            SELECT SUM(p2.montant)
            FROM paiements_frais p2
            WHERE p2.frais_eleve_id = p.frais_eleve_id
              AND (p2.date_paiement < p.date_paiement OR (p2.date_paiement = p.date_paiement AND p2.id <= p.id))
          ) AS reste_apres_ce_paiement,
          fe.montant - fe.montant_paye AS reste_global
        FROM paiements_frais p
        INNER JOIN frais_eleves fe ON p.frais_eleve_id = fe.id
        INNER JOIN frais_scolaires fs ON fe.frais_scolaire_id = fs.id
        INNER JOIN eleves e ON p.eleve_id = e.id
        INNER JOIN classes c ON e.classe_id = c.id
        INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
        WHERE 1=1
      `;
      
      countSql = `
        SELECT COUNT(*) as total
        FROM paiements_frais p
        INNER JOIN frais_eleves fe ON p.frais_eleve_id = fe.id
        INNER JOIN frais_scolaires fs ON fe.frais_scolaire_id = fs.id
        INNER JOIN eleves e ON p.eleve_id = e.id
        WHERE 1=1
      `;
    }

    // ✅ AJOUTER LES FILTRES POUR LA VUE "TOUS"
    if (vue !== 'derniers') {
      if (categorie_frais_id && categorie_frais_id !== '') {
        sql += ` AND fs.categorie_frais_id = ?`;
        countSql += ` AND fs.categorie_frais_id = ?`;
        params.push(parseInt(categorie_frais_id));
        countParams.push(parseInt(categorie_frais_id));
      }
      
      if (classe_id && classe_id !== '') {
        sql += ` AND e.classe_id = ?`;
        countSql += ` AND e.classe_id = ?`;
        params.push(parseInt(classe_id));
        countParams.push(parseInt(classe_id));
      }
      
      if (mode_paiement && mode_paiement !== '') {
        sql += ` AND p.mode_paiement = ?`;
        countSql += ` AND p.mode_paiement = ?`;
        params.push(mode_paiement);
        countParams.push(mode_paiement);
      }
      
      if (statut && statut !== '') {
        sql += ` AND p.statut = ?`;
        countSql += ` AND p.statut = ?`;
        params.push(statut);
        countParams.push(statut);
      }
      
      if (eleve_id && eleve_id !== '') {
        sql += ` AND p.eleve_id = ?`;
        countSql += ` AND p.eleve_id = ?`;
        params.push(parseInt(eleve_id));
        countParams.push(parseInt(eleve_id));
      }
      
      if (date_debut && date_debut !== '') {
        sql += ` AND p.date_paiement >= ?`;
        countSql += ` AND p.date_paiement >= ?`;
        params.push(date_debut);
        countParams.push(date_debut);
      }
      
      if (date_fin && date_fin !== '') {
        sql += ` AND p.date_paiement <= ?`;
        countSql += ` AND p.date_paiement <= ?`;
        params.push(date_fin);
        countParams.push(date_fin);
      }
      
      if (du_jour === 'true') {
        sql += ` AND DATE(p.date_paiement) = CURDATE()`;
        countSql += ` AND DATE(p.date_paiement) = CURDATE()`;
      }
      
      if (du_mois === 'true') {
        sql += ` AND MONTH(p.date_paiement) = MONTH(CURDATE()) AND YEAR(p.date_paiement) = YEAR(CURDATE())`;
        countSql += ` AND MONTH(p.date_paiement) = MONTH(CURDATE()) AND YEAR(p.date_paiement) = YEAR(CURDATE())`;
      }
      
      if (de_l_annee === 'true') {
        sql += ` AND YEAR(p.date_paiement) = YEAR(CURDATE())`;
        countSql += ` AND YEAR(p.date_paiement) = YEAR(CURDATE())`;
      }
    }

    // ✅ ORDRE DE TRI
    let orderBy = '';
    switch (tri_champ) {
      case 'eleve': 
        orderBy = 'e.nom, e.prenom, p.date_paiement'; 
        break;
      case 'classe': 
        orderBy = 'c.niveau, c.nom, e.nom, e.prenom, p.date_paiement'; 
        break;
      case 'categorie': 
        orderBy = 'cf.nom, e.nom, e.prenom, p.date_paiement'; 
        break;
      case 'date': 
        orderBy = 'p.date_paiement'; 
        break;
      case 'versement': 
        orderBy = 'p.numero_versement'; 
        break;
      default: 
        orderBy = 'p.date_paiement DESC';
    }
    
    sql += ` ORDER BY ${orderBy} ${tri_direction === 'desc' ? 'DESC' : 'ASC'}`;

    // ✅ PAGINATION
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    console.log('📊 SQL (preview):', sql.substring(0, 500) + '...');
    console.log('📊 Paramètres:', params);

    // Exécuter les requêtes
    const paiements = await query(sql, params);
    let total = 0;
    
    if (countSql) {
      const countResult = await query(countSql, countParams) as any[];
      total = countResult[0]?.total || 0;
    }
    
    const totalPages = Math.ceil(total / limit);
    const paiementsArray = Array.isArray(paiements) ? paiements : [];

    // ✅ Pour la vue "tous", transformer les résultats
    if (vue === 'tous') {
      const paiementsTransformes = paiementsArray.map((p: any) => {
        // Utiliser reste_apres_ce_paiement pour le reste à payer après ce paiement
        // Si ce champ n'existe pas (pour les anciens paiements), faire un calcul approximatif
        let resteApresPaiement = p.reste_apres_ce_paiement;
        
        // Si reste_apres_ce_paiement n'est pas disponible (ancienne version), 
        // on calcule une approximation
        if (resteApresPaiement === undefined || resteApresPaiement === null) {
          // Approximatif : reste_global + montant de ce paiement (à utiliser avec prudence)
          resteApresPaiement = (p.reste_global || 0) + (p.montant || 0);
        }
        
        return {
          ...p,
          montant_paye_global: p.montant_paye_global || 0,
          reste_global: p.reste_global || 0,
          reste_a_payer: resteApresPaiement // C'est le reste APRÈS CE paiement
        };
      });
      
      console.log('✅ Paiements transformés avec reste après paiement dynamique');
      
      return NextResponse.json({
        success: true,
        paiements: paiementsTransformes,
        total,
        totalPages,
        page,
        limit,
        vue
      });
    }

    console.log(`✅ ${paiementsArray.length} paiements trouvés sur ${total} total (vue: ${vue})`);

    return NextResponse.json({
      success: true,
      paiements: paiementsArray,
      total,
      totalPages,
      page,
      limit,
      vue
    });
    
  } catch (error: any) {
    console.error('❌ Erreur récupération paiements:', error);
    console.error('❌ Message:', error.message);
    
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur: ${error.message}`,
        paiements: [],
        total: 0,
        totalPages: 0,
        page: 1,
        limit: 20,
        vue: vue
      },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Garder le POST inchangé
  try {
    const body = await request.json();
    console.log('🚀📝 API Paiements - Début POST avec données:', body);
    
    // Validation des champs requis
    const champsRequis = [
      { nom: 'eleve_id', valeur: body.eleve_id, message: 'L\'élève est requis' },
      { nom: 'frais_scolaire_id', valeur: body.frais_scolaire_id, message: 'Le frais scolaire est requis' },
      { nom: 'montant', valeur: body.montant, message: 'Le montant est requis et doit être supérieur à 0' }
    ];
    
    for (const champ of champsRequis) {
      if (!champ.valeur || (champ.nom === 'montant' && champ.valeur <= 0)) {
        return NextResponse.json(
          { success: false, erreur: champ.message },
          { status: 400 }
        );
      }
    }
    
    // Déterminer l'année scolaire
    const maintenant = new Date();
    const annee = maintenant.getFullYear();
    const mois = maintenant.getMonth() + 1;
    const anneeScolaire = mois >= 8 ? `${annee}-${annee + 1}` : `${annee - 1}-${annee}`;
    
    console.log('📅 Année scolaire déterminée:', anneeScolaire);
    
    // 1. Récupérer le frais scolaire
    console.log('🔍 Étape 1: Récupération du frais scolaire ID:', body.frais_scolaire_id);
    const fraisScolaireSql = `
      SELECT fs.*, cf.nom as categorie_nom, cf.type as categorie_type, cf.periodicite as categorie_periodicite
      FROM frais_scolaires fs
      INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
      WHERE fs.id = ?
    `;
    
    const fraisScolaireResult = await query(fraisScolaireSql, [body.frais_scolaire_id]) as any[];
    
    if (fraisScolaireResult.length === 0) {
      console.log('❌ Frais scolaire non trouvé');
      return NextResponse.json(
        { success: false, erreur: 'Frais scolaire non trouvé' },
        { status: 404 }
      );
    }
    
    const fraisScolaire = fraisScolaireResult[0];
    console.log('✅ Frais scolaire trouvé:', {
      id: fraisScolaire.id,
      categorie: fraisScolaire.categorie_nom,
      type: fraisScolaire.categorie_type,
      periodicite: fraisScolaire.periodicite,
      montant: fraisScolaire.montant
    });
    
    // ✅ Vérification pour les frais UNIQUE déjà payés
    if (fraisScolaire.periodicite === 'unique' || fraisScolaire.categorie_periodicite === 'unique') {
      console.log('🔍 Vérification frais UNIQUE déjà payé');
      
      const verifUniqueSql = `
        SELECT COUNT(*) as count 
        FROM paiements_frais pf
        INNER JOIN frais_eleves fe ON pf.frais_eleve_id = fe.id
        WHERE fe.eleve_id = ? 
          AND fe.frais_scolaire_id = ?
          AND pf.statut = 'paye'
      `;
      
      const verifResult = await query(verifUniqueSql, [
        body.eleve_id,
        body.frais_scolaire_id
      ]) as any[];
      
      if (verifResult[0].count > 0) {
        return NextResponse.json({
          success: false,
          erreur: `Ce frais de type UNIQUE a déjà été payé pour cet élève.`
        }, { status: 400 });
      }
    }
    
    // 2. Vérification: Inscription doit être payée avant scolarité
    if (fraisScolaire.categorie_type === 'scolarite') {
      console.log('🔍 Vérification paiement inscription avant scolarité');
      
      const verifInscriptionSql = `
        SELECT 
          fe.id,
          fe.statut,
          fe.montant,
          fe.montant_paye,
          CASE 
            WHEN fe.statut = 'paye' THEN true
            WHEN fe.montant_paye >= fe.montant THEN true
            ELSE false
          END as est_payee
        FROM frais_eleves fe
        INNER JOIN frais_scolaires fs ON fe.frais_scolaire_id = fs.id
        INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
        WHERE fe.eleve_id = ? 
          AND fe.annee_scolaire = ?
          AND cf.type = 'inscription'
        ORDER BY fe.created_at DESC
        LIMIT 1
      `;
      
      const inscriptionResult = await query(verifInscriptionSql, [
        body.eleve_id, 
        body.annee_scolaire || anneeScolaire
      ]) as any[];
      
      if (inscriptionResult.length > 0) {
        const inscription = inscriptionResult[0];
        const inscriptionPayee = inscription.est_payee === 1 || inscription.est_payee === true;
        
        if (!inscriptionPayee) {
          console.log('❌ Inscription non payée pour l\'élève:', {
            statut: inscription.statut,
            montant: inscription.montant,
            montant_paye: inscription.montant_paye,
            est_payee: inscription.est_payee
          });
          return NextResponse.json({
            success: false,
            erreur: 'L\'inscription doit être payée avant de pouvoir payer la scolarité.'
          }, { status: 400 });
        }
        console.log('✅ Inscription vérifiée et payée:', inscription.est_payee);
      } else {
        console.log('⚠️ Aucune inscription trouvée pour l\'élève');
      }
    }
    
    // 3. Vérifier/Créer le frais élève
    console.log('🔍 Étape 2: Vérification frais élève pour élève:', body.eleve_id);
    const fraisEleveSql = `
      SELECT * FROM frais_eleves 
      WHERE eleve_id = ? AND frais_scolaire_id = ? AND annee_scolaire = ?
    `;
    
    const fraisEleveResult = await query(fraisEleveSql, [
      body.eleve_id, 
      body.frais_scolaire_id, 
      body.annee_scolaire || anneeScolaire
    ]) as any[];
    
    let fraisEleveId: number;
    let fraisEleve: any;
    
    if (fraisEleveResult.length === 0) {
      console.log('🆕 Création d\'un nouveau frais élève');
      
      const dateEcheance = new Date();
      dateEcheance.setDate(dateEcheance.getDate() + 30);
      const dateEcheanceStr = dateEcheance.toISOString().split('T')[0];
      
      const insertFraisEleveSql = `
        INSERT INTO frais_eleves (
          frais_scolaire_id, eleve_id, annee_scolaire, montant,
          montant_paye, date_echeance, statut, created_at
        ) VALUES (?, ?, ?, ?, 0, ?, 'en_attente', NOW())
      `;
      
      const insertResult = await query(insertFraisEleveSql, [
        body.frais_scolaire_id,
        body.eleve_id,
        body.annee_scolaire || anneeScolaire,
        fraisScolaire.montant,
        dateEcheanceStr
      ]) as any;
      
      fraisEleveId = insertResult.insertId;
      console.log('✅ Frais élève créé avec ID:', fraisEleveId);
      
      fraisEleve = (await query('SELECT * FROM frais_eleves WHERE id = ?', [fraisEleveId]) as any[])[0];
    } else {
      fraisEleve = fraisEleveResult[0];
      fraisEleveId = fraisEleve.id;
      console.log('✅ Frais élève existant trouvé avec ID:', fraisEleveId);
    }
    
    console.log('📊 Détails frais élève:', {
      id: fraisEleve.id,
      montant: fraisEleve.montant,
      montant_paye: fraisEleve.montant_paye,
      statut: fraisEleve.statut
    });
    
    // 4. Vérifications spécifiques
    const montantRestant = parseFloat(fraisEleve.montant) - parseFloat(fraisEleve.montant_paye || 0);
    
    if (body.montant > montantRestant) {
      return NextResponse.json(
        { 
          success: false, 
          erreur: `Le montant ne peut pas dépasser ${montantRestant} FCFA` 
        },
        { status: 400 }
      );
    }
    
    // 5. Obtenir le numéro de reçu
    console.log('🔍 Étape 3: Génération numéro reçu');
    const numeroRecu = await ReceiptManager.getNextReceiptNumber();
    console.log('✅ Numéro de reçu généré:', numeroRecu);
    
    // 6. Insérer le paiement
    console.log('🔍 Étape 4: Insertion du paiement');
    let insertPaiementSql: string;
    let paiementParams: any[];
    
    if (body.numero_versement) {
      insertPaiementSql = `
        INSERT INTO paiements_frais (
          frais_eleve_id, eleve_id, montant, date_paiement,
          mode_paiement, reference_paiement, notes, statut, 
          created_by, numero_versement, numero_recu, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;
      paiementParams = [
        fraisEleveId,
        body.eleve_id,
        body.montant,
        body.date_paiement,
        body.mode_paiement,
        body.reference_paiement || null,
        body.notes || null,
        body.statut || 'paye',
        body.created_by || 1,
        body.numero_versement,
        numeroRecu
      ];
    } else {
      insertPaiementSql = `
        INSERT INTO paiements_frais (
          frais_eleve_id, eleve_id, montant, date_paiement,
          mode_paiement, reference_paiement, notes, statut, 
          created_by, numero_recu, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;
      paiementParams = [
        fraisEleveId,
        body.eleve_id,
        body.montant,
        body.date_paiement,
        body.mode_paiement,
        body.reference_paiement || null,
        body.notes || null,
        body.statut || 'paye',
        body.created_by || 1,
        numeroRecu
      ];
    }
    
    const result = await query(insertPaiementSql, paiementParams) as any;
    const paiementId = result.insertId;
    console.log('✅ Paiement inséré avec ID:', paiementId);
    
    // 7. Mettre à jour le frais élève
    console.log('🔍 Étape 5: Mise à jour du frais élève');
    const nouveauMontantPaye = parseFloat(fraisEleve.montant_paye || 0) + parseFloat(body.montant);
    const montantTotalFrais = parseFloat(fraisEleve.montant);
    
    let nouveauStatut: 'partiel' | 'paye' | 'en_attente' | 'en_retard' = 'partiel';
    
    if (Math.abs(nouveauMontantPaye - montantTotalFrais) < 0.01) {
      nouveauStatut = 'paye';
    } else if (nouveauMontantPaye > 0) {
      nouveauStatut = 'partiel';
    }
    
    const dateEcheance = new Date(fraisEleve.date_echeance);
    if (nouveauStatut !== 'paye' && dateEcheance < new Date()) {
      nouveauStatut = 'en_retard';
    }
    
    const updateFraisEleveSql = `
      UPDATE frais_eleves 
      SET 
        montant_paye = ?,
        statut = ?,
        date_paiement = CASE WHEN ? >= montant THEN ? ELSE date_paiement END,
        updated_at = NOW()
      WHERE id = ?
    `;
    
    await query(updateFraisEleveSql, [
      nouveauMontantPaye,
      nouveauStatut,
      nouveauMontantPaye,
      body.date_paiement,
      fraisEleveId
    ]);
    
    console.log('✅ Frais élève mis à jour:', {
      id: fraisEleveId,
      nouveauMontantPaye,
      nouveauStatut,
      montantTotal: montantTotalFrais
    });
    
    // 8. Gestion des versements de scolarité
    if (fraisScolaire.categorie_type === 'scolarite' && body.is_versement) {
      console.log('🎯 Gestion des versements pour la scolarité');
      
      const checkVersementsSql = `
        SELECT * FROM versement_scolarite 
        WHERE frais_eleve_id = ?
        ORDER BY numero_versement
      `;
      
      const versementsExistants = await query(checkVersementsSql, [fraisEleveId]) as any[];
      
      if (versementsExistants.length === 0) {
        const nombreVersements = body.nombre_versements || fraisScolaire.nombre_versements || 4;
        const montantParVersement = Math.ceil(montantTotalFrais / nombreVersements);
        
        console.log(`📊 Création de ${nombreVersements} versements de ${montantParVersement} FCFA chacun`);
        
        for (let i = 1; i <= nombreVersements; i++) {
          const dateEcheanceVersement = new Date();
          dateEcheanceVersement.setMonth(dateEcheanceVersement.getMonth() + i - 1);
          
          const insertVersementSql = `
            INSERT INTO versement_scolarite (
              frais_eleve_id, eleve_id, numero_versement, montant_versement,
              montant_paye, date_echeance, statut, created_at
            ) VALUES (?, ?, ?, ?, 0, ?, 'en_attente', NOW())
          `;
          
          await query(insertVersementSql, [
            fraisEleveId,
            body.eleve_id,
            i,
            montantParVersement,
            dateEcheanceVersement.toISOString().split('T')[0]
          ]);
        }
        
        console.log('✅ Versements créés avec succès');
      }
      
      if (body.numero_versement) {
        const updateVersementSql = `
          UPDATE versement_scolarite 
          SET montant_paye = montant_paye + ?,
              statut = CASE 
                WHEN montant_paye + ? >= montant_versement THEN 'paye'
                WHEN montant_paye + ? > 0 THEN 'partiel'
                ELSE 'en_attente'
              END,
              date_paiement = CASE 
                WHEN montant_paye + ? >= montant_versement THEN ?
                ELSE date_paiement
              END,
              updated_at = NOW()
          WHERE frais_eleve_id = ? AND numero_versement = ?
        `;
        
        await query(updateVersementSql, [
          body.montant,
          body.montant,
          body.montant,
          body.montant,
          body.date_paiement,
          fraisEleveId,
          body.numero_versement
        ]);
        
        console.log(`✅ Versement #${body.numero_versement} mis à jour`);
      }
    }
    
    // 9. Récupérer le paiement créé
    console.log('🔍 Étape 6: Récupération du paiement créé');
    const paiementCree = await query(`
      SELECT 
        pf.*,
        e.nom as eleve_nom,
        e.prenom as eleve_prenom,
        e.matricule as eleve_matricule,
        c.nom as classe_nom,
        c.niveau as classe_niveau,
        cf.nom as categorie_nom,
        cf.type as categorie_type,
        fe.montant as montant_total,
        fe.montant_paye,
        fe.statut as statut_frais,
        fe.annee_scolaire,
        GREATEST(fe.montant - fe.montant_paye, 0) as reste_a_payer
      FROM paiements_frais pf
      INNER JOIN frais_eleves fe ON pf.frais_eleve_id = fe.id
      INNER JOIN eleves e ON pf.eleve_id = e.id
      INNER JOIN classes c ON e.classe_id = c.id
      INNER JOIN frais_scolaires fs ON fe.frais_scolaire_id = fs.id
      INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
      WHERE pf.id = ?
    `, [paiementId]) as any[];
    
    console.log('✅✅✅ Paiement terminé avec succès!');
    
    return NextResponse.json({
      success: true,
      paiement: paiementCree[0] || null,
      message: 'Paiement enregistré avec succès',
      numero_recu: numeroRecu
    });
    
  } catch (error: any) {
    console.error('❌❌❌ ERREUR CRITIQUE dans POST /api/finance/paiements');
    console.error('❌ Message:', error.message);
    console.error('❌ Stack:', error.stack);
    
    if (error.sqlMessage) {
      console.error('❌ SQL Message:', error.sqlMessage);
      console.error('❌ SQL Code:', error.code);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur lors de l'enregistrement du paiement: ${error.message}`
      },
      { status: 500 }
    );
  }
}