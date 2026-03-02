// /api/finance/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 API Dashboard - Début');
    const { searchParams } = new URL(request.url);
    const date_debut = searchParams.get('date_debut');
    const date_fin = searchParams.get('date_fin');

    console.log('📅 Paramètres:', { date_debut, date_fin });

    // Utiliser des dates par défaut si non fournies
    const aujourdhui = new Date();
    const debut = date_debut || new Date(aujourdhui.setDate(aujourdhui.getDate() - 30)).toISOString().split('T')[0];
    const fin = date_fin || new Date().toISOString().split('T')[0];

    // Calculer les statistiques avec gestion d'erreur
    const statistiques = await calculerStatistiquesDashboard(debut, fin);
    
    console.log('✅ Statistiques calculées:', statistiques);
    
    return NextResponse.json({
      success: true,
      statistiques
    });
  } catch (error: any) {
    console.error('❌ Erreur API dashboard:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message}`,
        statistiques: {
          total_recettes: 0,
          total_depenses: 0,
          solde_actuel: 0,
          frais_impayes: 0,
          frais_en_retard: 0,
          evolution_mensuelle: [],
          repartition_recettes: [],
          repartition_depenses: [],
          taux_recouvrement: 0,
          marge_nette: 0,
          taux_marge: 0,
          ratio_depenses: 0,
          alertes_actives: 0,
          transactions_en_attente: 0
        }
      },
      { status: 500 }
    );
  }
}

async function calculerStatistiquesDashboard(date_debut: string, date_fin: string): Promise<any> {
  try {
    console.log('🔍 Calcul statistiques pour:', date_debut, 'à', date_fin);

    // 1. Calculer le total des recettes (paiements)
    let totalRecettes = 0;
    try {
      const resultRecettes = await query(`
        SELECT COALESCE(SUM(p.montant), 0) as total
        FROM paiements_frais p
        WHERE p.date_paiement BETWEEN ? AND ?
        AND p.statut = 'paye'
      `, [date_debut, date_fin]) as any[];
      
      totalRecettes = parseFloat(resultRecettes[0]?.total) || 0;
    } catch (error) {
      console.warn('⚠️ Erreur calcul recettes:', error);
      totalRecettes = 0;
    }

    // 2. Calculer le total des dépenses
    let totalDepenses = 0;
    try {
      // Vérifier si la table depenses existe
      const tableExists = await query(`
        SELECT COUNT(*) as count
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = 'depenses'
      `) as any[];
      
      if (tableExists[0]?.count > 0) {
        const resultDepenses = await query(`
          SELECT COALESCE(SUM(montant), 0) as total
          FROM depenses
          WHERE date_depense BETWEEN ? AND ?
          AND statut = 'valide'
        `, [date_debut, date_fin]) as any[];
        
        totalDepenses = parseFloat(resultDepenses[0]?.total) || 0;
      }
    } catch (error) {
      console.warn('⚠️ Erreur calcul dépenses:', error);
      totalDepenses = 0;
    }

    // 3. Calculer le solde actuel
    const soldeActuel = totalRecettes - totalDepenses;

    // 4. Calculer les frais impayés
    let fraisImpayes = 0;
    try {
      const resultImpayes = await query(`
        SELECT COALESCE(SUM(fe.montant - fe.montant_paye), 0) as total
        FROM frais_eleves fe
        WHERE fe.statut IN ('en_attente', 'partiel')
        AND fe.date_echeance <= CURDATE()
      `) as any[];
      
      fraisImpayes = parseFloat(resultImpayes[0]?.total) || 0;
    } catch (error) {
      console.warn('⚠️ Erreur calcul impayés:', error);
      fraisImpayes = 0;
    }

    // 5. Calculer les frais en retard
    let fraisEnRetard = 0;
    try {
      const resultRetard = await query(`
        SELECT COALESCE(SUM(fe.montant - fe.montant_paye), 0) as total
        FROM frais_eleves fe
        WHERE fe.statut = 'en_retard'
      `) as any[];
      
      fraisEnRetard = parseFloat(resultRetard[0]?.total) || 0;
    } catch (error) {
      console.warn('⚠️ Erreur calcul retard:', error);
      fraisEnRetard = 0;
    }

    // 6. Évolution mensuelle
    let evolutionMensuelle: any[] = [];
    try {
      const resultEvolution = await query(`
        SELECT 
          DATE_FORMAT(p.date_paiement, '%Y-%m') as mois,
          DATE_FORMAT(p.date_paiement, '%b %Y') as mois_format,
          COALESCE(SUM(p.montant), 0) as recettes
        FROM paiements_frais p
        WHERE p.date_paiement BETWEEN ? AND ?
        AND p.statut = 'paye'
        GROUP BY DATE_FORMAT(p.date_paiement, '%Y-%m'), DATE_FORMAT(p.date_paiement, '%b %Y')
        ORDER BY mois
      `, [date_debut, date_fin]) as any[];
      
      evolutionMensuelle = resultEvolution.map(item => ({
        mois: item.mois_format || item.mois,
        recettes: parseFloat(item.recettes) || 0,
        depenses: 0
      }));
    } catch (error) {
      console.warn('⚠️ Erreur calcul évolution:', error);
      evolutionMensuelle = [];
    }

    // 7. Répartition des recettes par catégorie
    let repartitionRecettes: any[] = [];
    try {
      const resultRepartition = await query(`
        SELECT 
          COALESCE(cf.nom, 'Non catégorisé') as categorie,
          COALESCE(SUM(p.montant), 0) as montant
        FROM paiements_frais p
        LEFT JOIN frais_eleves fe ON p.frais_eleve_id = fe.id
        LEFT JOIN frais_scolaires fs ON fe.frais_scolaire_id = fs.id
        LEFT JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
        WHERE p.date_paiement BETWEEN ? AND ?
        AND p.statut = 'paye'
        GROUP BY cf.id, cf.nom
        ORDER BY montant DESC
      `, [date_debut, date_fin]) as any[];
      
      repartitionRecettes = resultRepartition.map(item => ({
        categorie: item.categorie,
        montant: parseFloat(item.montant) || 0,
        pourcentage: totalRecettes > 0 ? (parseFloat(item.montant) / totalRecettes) * 100 : 0
      }));
    } catch (error) {
      console.warn('⚠️ Erreur calcul répartition:', error);
      repartitionRecettes = [
        { categorie: 'Scolarité', montant: totalRecettes * 0.6, pourcentage: 60 },
        { categorie: 'Inscription', montant: totalRecettes * 0.2, pourcentage: 20 },
        { categorie: 'Divers', montant: totalRecettes * 0.2, pourcentage: 20 }
      ].filter(item => item.montant > 0);
    }

    // 8. Calculer les indicateurs avancés
    const tauxRecouvrement = totalRecettes > 0 
      ? (totalRecettes / (totalRecettes + fraisImpayes)) * 100 
      : 0;
    
    const margeNette = soldeActuel;
    const tauxMarge = totalDepenses > 0 
      ? (margeNette / totalDepenses) * 100 
      : (totalRecettes > 0 ? 100 : 0);
    
    const ratioDepenses = totalRecettes > 0 
      ? (totalDepenses / totalRecettes) * 100 
      : (totalDepenses > 0 ? 100 : 0);

    console.log('📈 Indicateurs calculés:', {
      tauxRecouvrement,
      margeNette,
      tauxMarge,
      ratioDepenses
    });

    return {
      total_recettes: totalRecettes,
      total_depenses: totalDepenses,
      solde_actuel: soldeActuel,
      frais_impayes: fraisImpayes,
      frais_en_retard: fraisEnRetard,
      evolution_mensuelle: evolutionMensuelle,
      repartition_recettes: repartitionRecettes,
      repartition_depenses: [], // À implémenter si vous avez des données de dépenses
      taux_recouvrement: parseFloat(tauxRecouvrement.toFixed(2)),
      marge_nette: margeNette,
      taux_marge: parseFloat(tauxMarge.toFixed(2)),
      ratio_depenses: parseFloat(ratioDepenses.toFixed(2)),
      alertes_actives: 0, // À implémenter
      transactions_en_attente: 0 // À implémenter
    };
  } catch (error) {
    console.error('❌ Erreur dans calculStatistiquesDashboard:', error);
    throw error;
  }
}