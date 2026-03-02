import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API Historique élève - Début GET');
    
    const searchParams = request.nextUrl.searchParams;
    const eleveId = searchParams.get('eleve_id');
    
    if (!eleveId) {
      return NextResponse.json({
        success: false,
        erreur: 'eleve_id est requis'
      }, { status: 400 });
    }
    
    const eleveIdNum = parseInt(eleveId);
    if (isNaN(eleveIdNum) || eleveIdNum <= 0) {
      return NextResponse.json({
        success: false,
        erreur: 'ID élève invalide'
      }, { status: 400 });
    }
    
    // 1. Récupérer les informations de l'élève et sa classe
    const eleveSql = `
      SELECT 
        e.*,
        c.id as classe_id,
        c.nom as classe_nom,
        c.niveau as classe_niveau
      FROM eleves e
      INNER JOIN classes c ON e.classe_id = c.id
      WHERE e.id = ? AND e.statut = 'actif'
    `;
    
    const eleveResult = await query(eleveSql, [eleveIdNum]) as any[];
    
    if (!eleveResult || eleveResult.length === 0) {
      return NextResponse.json({
        success: false,
        erreur: 'Élève non trouvé ou inactif'
      }, { status: 404 });
    }
    
    const eleve = eleveResult[0];
    const classeId = eleve.classe_id;
    
    // 2. Récupérer tous les paiements de l'élève
    let paiementsResult: any[] = [];
    try {
      const paiementsSql = `
        SELECT 
          pf.id,
          pf.frais_eleve_id,
          pf.eleve_id,
          pf.montant,
          pf.date_paiement,
          pf.mode_paiement,
          pf.reference_paiement,
          pf.numero_versement,
          pf.numero_recu,
          pf.notes,
          pf.statut as statut_paiement,
          pf.created_at,
          cf.nom as categorie_nom,
          cf.type as categorie_type,
          fe.montant as montant_total,
          fe.montant_paye,
          fe.statut as statut_frais,
          fe.frais_scolaire_id
        FROM paiements_frais pf
        INNER JOIN frais_eleves fe ON pf.frais_eleve_id = fe.id
        INNER JOIN frais_scolaires fs ON fe.frais_scolaire_id = fs.id
        INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
        WHERE pf.eleve_id = ?
        ORDER BY pf.date_paiement DESC, pf.created_at DESC
      `;
      
      paiementsResult = await query(paiementsSql, [eleveIdNum]) as any[];
    } catch (error) {
      console.log('⚠️ Aucun paiement trouvé pour cet élève');
      paiementsResult = [];
    }
    
    // 3. Récupérer les frais scolaires de la classe de l'élève
    let fraisClasseResult: any[] = [];
    try {
      const fraisClasseSql = `
        SELECT 
          fs.*,
          cf.nom as categorie_nom,
          cf.type as categorie_type,
          cf.periodicite as categorie_periodicite,
          c.nom as classe_nom,
          c.niveau as classe_niveau
        FROM frais_scolaires fs
        INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
        INNER JOIN classes c ON fs.classe_id = c.id
        WHERE fs.classe_id = ? AND fs.statut = 'actif'
        ORDER BY cf.nom
      `;
      
      fraisClasseResult = await query(fraisClasseSql, [classeId]) as any[];
    } catch (error) {
      console.log('⚠️ Aucun frais trouvé pour cette classe');
      fraisClasseResult = [];
    }
    
    // 4. Récupérer les frais de l'élève pour cette classe
    let fraisEleveResult: any[] = [];
    try {
      const fraisEleveSql = `
        SELECT 
          fe.*,
          cf.nom as categorie_nom,
          cf.type as categorie_type,
          fs.periodicite
        FROM frais_eleves fe
        INNER JOIN frais_scolaires fs ON fe.frais_scolaire_id = fs.id
        INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
        WHERE fe.eleve_id = ? AND fs.classe_id = ?
        ORDER BY fe.created_at DESC
      `;
      
      fraisEleveResult = await query(fraisEleveSql, [eleveIdNum, classeId]) as any[];
    } catch (error) {
      console.log('⚠️ Aucun frais élève trouvé');
      fraisEleveResult = [];
    }
    
    // 5. Calculer les statistiques
    const statistiquesParFrais = fraisClasseResult.map(fraisClasse => {
      // Trouver le frais élève correspondant
      const fraisEleve = fraisEleveResult.find(fe => fe.frais_scolaire_id === fraisClasse.id);
      
      const montantTotal = parseFloat(fraisClasse.montant || 0);
      const montantPaye = fraisEleve ? parseFloat(fraisEleve.montant_paye || 0) : 0;
      const resteAPayer = Math.max(0, montantTotal - montantPaye);
      const progression = montantTotal > 0 ? Math.round((montantPaye / montantTotal) * 100) : 0;
      
      // Récupérer les paiements spécifiques à ce frais
      const paiementsFrais = paiementsResult.filter(p => {
        const paiementFraisEleve = fraisEleveResult.find(fe => fe.id === p.frais_eleve_id);
        return paiementFraisEleve?.frais_scolaire_id === fraisClasse.id;
      });
      
      return {
        frais_id: fraisClasse.id,
        categorie_nom: fraisClasse.categorie_nom,
        categorie_type: fraisClasse.categorie_type,
        periodicite: fraisClasse.periodicite,
        montant_total: montantTotal,
        montant_paye: montantPaye,
        reste_a_payer: resteAPayer,
        progression: progression,
        statut: fraisEleve?.statut || 'non_attribue',
        paiements: paiementsFrais.map(p => ({
          id: p.id,
          date_paiement: p.date_paiement,
          montant: p.montant,
          mode_paiement: p.mode_paiement,
          numero_versement: p.numero_versement,
          numero_recu: p.numero_recu,
          notes: p.notes
        }))
      };
    });
    
    // 6. Calculer les totaux globaux
    const totalFraisClasse = fraisClasseResult.reduce((sum, frais) => 
      sum + parseFloat(frais.montant || 0), 0
    );
    
    const totalPaye = paiementsResult.reduce((sum, paiement) => 
      sum + parseFloat(paiement.montant || 0), 0
    );
    
    const totalReste = Math.max(0, totalFraisClasse - totalPaye);
    const progressionGlobale = totalFraisClasse > 0 ? 
      Math.round((totalPaye / totalFraisClasse) * 100) : 0;
    
    // 7. Préparer la réponse structurée
    const responseData = {
      success: true,
      eleve: {
        id: eleve.id,
        nom: eleve.nom,
        prenom: eleve.prenom,
        matricule: eleve.matricule,
        classe_id: eleve.classe_id,
        classe: `${eleve.classe_niveau} ${eleve.classe_nom}`,
        classe_nom: eleve.classe_nom,
        classe_niveau: eleve.classe_niveau,
        statut: eleve.statut,
        telephone_parent: eleve.telephone_parent || '',
        email_parents: eleve.email_parents || ''
      },
      paiements: paiementsResult.map(p => ({
        id: p.id,
        date_paiement: p.date_paiement,
        montant: p.montant,
        mode_paiement: p.mode_paiement,
        numero_versement: p.numero_versement,
        numero_recu: p.numero_recu,
        categorie_nom: p.categorie_nom,
        montant_total: p.montant_total,
        montant_paye: p.montant_paye,
        notes: p.notes,
        frais_scolaire_id: p.frais_scolaire_id
      })),
      frais_classe: fraisClasseResult.map(f => ({
        id: f.id,
        categorie_nom: f.categorie_nom,
        categorie_type: f.categorie_type,
        periodicite: f.periodicite,
        montant: f.montant,
        annee_scolaire: f.annee_scolaire,
        statut: f.statut
      })),
      frais_eleve: fraisEleveResult.map(f => ({
        id: f.id,
        frais_scolaire_id: f.frais_scolaire_id,
        categorie_nom: f.categorie_nom,
        categorie_type: f.categorie_type,
        montant: f.montant,
        montant_paye: f.montant_paye,
        reste_a_payer: f.reste_a_payer,
        statut: f.statut,
        periodicite: f.periodicite,
        date_echeance: f.date_echeance,
        date_paiement: f.date_paiement
      })),
      statistiques: {
        total_frais_classe: totalFraisClasse,
        total_paye: totalPaye,
        total_reste: totalReste,
        nombre_paiements: paiementsResult.length,
        progression_globale: progressionGlobale,
        details_par_frais: statistiquesParFrais
      }
    };
    
    console.log('✅ API Historique élève - Données retournées');
    
    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
    
  } catch (error: any) {
    console.error('❌ Erreur API historique:', error);
    console.error('❌ Stack:', error.stack);
    
    // Retourner une réponse JSON valide même en cas d'erreur
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message || 'Erreur inconnue'}`,
        eleve: null,
        paiements: [],
        frais_classe: [],
        frais_eleve: [],
        statistiques: {
          total_frais_classe: 0,
          total_paye: 0,
          total_reste: 0,
          nombre_paiements: 0,
          progression_globale: 0,
          details_par_frais: []
        }
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      }
    );
  }
}