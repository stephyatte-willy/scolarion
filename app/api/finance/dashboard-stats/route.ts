import { NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET() {
  try {
    console.log('🔍 API Dashboard Stats - Début');

    // Déterminer l'année scolaire en cours
    const maintenant = new Date();
    const annee = maintenant.getFullYear();
    const mois = maintenant.getMonth() + 1;
    const anneeScolaire = mois >= 8 ? `${annee}-${annee + 1}` : `${annee - 1}-${annee}`;

    // Initialiser les stats par défaut
    const statsParDefaut = {
      total_recettes: 0,
      total_depenses: 0,
      solde_actuel: 0,
      previsions_budget: 0,
      budget_restant: 0,
      pourcentage_budget_utilise: 0,
      total_frais_a_payer: 0,
      total_frais_payes: 0,
      total_impayes: 0,
      total_en_retard: 0,
      taux_recouvrement: 100,
      nombre_paiements_jour: 0,
      montant_paiements_jour: 0,
      nombre_paiements_mois: 0,
      montant_paiements_mois: 0,
      nombre_paiements_annee: 0,
      montant_paiements_annee: 0,
      nombre_eleves_avec_impaye: 0,
      nombre_eleves_a_jour: 0,
      stats_par_classe: [],
      stats_par_categorie: [],
      evolution_mensuelle: [],
      dernieres_transactions: [],
      alertes: [],
      annee_scolaire: anneeScolaire
    };

    // 1. TOTAUX GÉNÉRAUX DES FRAIS
    let fraisData = {
      total_frais_a_payer: 0,
      total_frais_payes: 0,
      total_impayes: 0,
      nombre_eleves_concernes: 0
    };
    
    try {
      const fraisTotauxSql = `
        SELECT 
          COALESCE(SUM(fe.montant), 0) as total_frais_a_payer,
          COALESCE(SUM(fe.montant_paye), 0) as total_frais_payes,
          COALESCE(SUM(fe.montant - fe.montant_paye), 0) as total_impayes,
          COUNT(DISTINCT fe.eleve_id) as nombre_eleves_concernes
        FROM frais_eleves fe
        INNER JOIN eleves e ON fe.eleve_id = e.id
        WHERE fe.annee_scolaire = ?
      `;
      
      const fraisTotaux = await query(fraisTotauxSql, [anneeScolaire]) as any[];
      fraisData = fraisTotaux[0] || {
        total_frais_a_payer: 0,
        total_frais_payes: 0,
        total_impayes: 0,
        nombre_eleves_concernes: 0
      };
    } catch (error) {
      console.error('❌ Erreur requête frais totaux:', error);
    }

    // 2. FRAIS EN RETARD
    let totalEnRetard = 0;
    try {
      const fraisRetardSql = `
        SELECT COALESCE(SUM(fe.montant - fe.montant_paye), 0) as total_en_retard
        FROM frais_eleves fe
        WHERE fe.annee_scolaire = ? 
          AND fe.date_echeance < CURDATE() 
          AND fe.montant_paye < fe.montant
      `;
      
      const fraisRetard = await query(fraisRetardSql, [anneeScolaire]) as any[];
      totalEnRetard = fraisRetard[0]?.total_en_retard || 0;
    } catch (error) {
      console.error('❌ Erreur requête frais retard:', error);
    }

    // 3. STATISTIQUES DES PAIEMENTS
    let paiementsData = {
      nombre_total: 0,
      montant_total: 0,
      nombre_jour: 0,
      montant_jour: 0,
      nombre_mois: 0,
      montant_mois: 0,
      nombre_annee: 0,
      montant_annee: 0
    };
    
    try {
      const paiementsStatsSql = `
        SELECT 
          COUNT(*) as nombre_total,
          COALESCE(SUM(montant), 0) as montant_total,
          COUNT(CASE WHEN DATE(date_paiement) = CURDATE() THEN 1 END) as nombre_jour,
          COALESCE(SUM(CASE WHEN DATE(date_paiement) = CURDATE() THEN montant END), 0) as montant_jour,
          COUNT(CASE WHEN MONTH(date_paiement) = MONTH(CURDATE()) AND YEAR(date_paiement) = YEAR(CURDATE()) THEN 1 END) as nombre_mois,
          COALESCE(SUM(CASE WHEN MONTH(date_paiement) = MONTH(CURDATE()) AND YEAR(date_paiement) = YEAR(CURDATE()) THEN montant END), 0) as montant_mois,
          COUNT(CASE WHEN YEAR(date_paiement) = YEAR(CURDATE()) THEN 1 END) as nombre_annee,
          COALESCE(SUM(CASE WHEN YEAR(date_paiement) = YEAR(CURDATE()) THEN montant END), 0) as montant_annee
        FROM paiements_frais
      `;
      
      const paiementsStats = await query(paiementsStatsSql, []) as any[];
      paiementsData = paiementsStats[0] || {
        nombre_total: 0,
        montant_total: 0,
        nombre_jour: 0,
        montant_jour: 0,
        nombre_mois: 0,
        montant_mois: 0,
        nombre_annee: 0,
        montant_annee: 0
      };
    } catch (error) {
      console.error('❌ Erreur requête paiements stats:', error);
    }

    // 4. NOMBRE D'ÉLÈVES À JOUR / IMPAYÉS
    let elevesData = {
      total_eleves: 0,
      eleves_avec_impaye: 0
    };
    
    try {
      const elevesStatsSql = `
        SELECT 
          COUNT(DISTINCT e.id) as total_eleves,
          COUNT(DISTINCT CASE 
            WHEN EXISTS (
              SELECT 1 FROM frais_eleves fe2 
              WHERE fe2.eleve_id = e.id 
                AND fe2.annee_scolaire = ? 
                AND fe2.montant_paye < fe2.montant
            ) THEN e.id 
          END) as eleves_avec_impaye
        FROM eleves e
        WHERE e.statut = 'actif'
      `;
      
      const elevesStats = await query(elevesStatsSql, [anneeScolaire]) as any[];
      elevesData = elevesStats[0] || {
        total_eleves: 0,
        eleves_avec_impaye: 0
      };
    } catch (error) {
      console.error('❌ Erreur requête élèves stats:', error);
    }
    
    const elevesAJour = elevesData.total_eleves - elevesData.eleves_avec_impaye;

    // 5. STATISTIQUES PAR CLASSE
    let statsClasseFormatted: any[] = [];
    try {
      const statsParClasseSql = `
        SELECT 
          CONCAT(c.niveau, ' ', c.nom) as classe,
          COUNT(DISTINCT e.id) as nombre_eleves,
          COALESCE(SUM(fe.montant), 0) as total_a_payer,
          COALESCE(SUM(fe.montant_paye), 0) as total_paye,
          COUNT(DISTINCT CASE 
            WHEN fe.montant_paye < fe.montant THEN e.id 
          END) as eleves_impayes
        FROM classes c
        LEFT JOIN eleves e ON e.classe_id = c.id AND e.statut = 'actif'
        LEFT JOIN frais_eleves fe ON fe.eleve_id = e.id AND fe.annee_scolaire = ?
        GROUP BY c.id, c.niveau, c.nom
        ORDER BY c.niveau, c.nom
      `;
      
      const statsParClasse = await query(statsParClasseSql, [anneeScolaire]) as any[];
      
      statsClasseFormatted = statsParClasse.map((c: any) => ({
        classe: c.classe || 'Classe inconnue',
        nombre_eleves: Number(c.nombre_eleves) || 0,
        total_a_payer: Number(c.total_a_payer) || 0,
        total_paye: Number(c.total_paye) || 0,
        taux_recouvrement: Number(c.total_a_payer) > 0 
          ? Number(((Number(c.total_paye) / Number(c.total_a_payer)) * 100).toFixed(1))
          : 100,
        eleves_impayes: Number(c.eleves_impayes) || 0
      }));
    } catch (error) {
      console.error('❌ Erreur requête stats par classe:', error);
    }

    // 6. STATISTIQUES PAR CATÉGORIE DE FRAIS
    let statsCategorieFormatted: any[] = [];
    try {
      const statsParCategorieSql = `
        SELECT 
          cf.nom as categorie,
          COALESCE(SUM(fe.montant), 0) as total_a_payer,
          COALESCE(SUM(fe.montant_paye), 0) as total_paye
        FROM categories_frais cf
        LEFT JOIN frais_scolaires fs ON fs.categorie_frais_id = cf.id
        LEFT JOIN frais_eleves fe ON fe.frais_scolaire_id = fs.id AND fe.annee_scolaire = ?
        WHERE cf.statut = 'actif'
        GROUP BY cf.id, cf.nom
        ORDER BY total_a_payer DESC
      `;
      
      const statsParCategorie = await query(statsParCategorieSql, [anneeScolaire]) as any[];
      
      statsCategorieFormatted = statsParCategorie.map((c: any) => ({
        categorie: c.categorie || 'Non catégorisé',
        total_a_payer: Number(c.total_a_payer) || 0,
        total_paye: Number(c.total_paye) || 0,
        taux_recouvrement: Number(c.total_a_payer) > 0 
          ? Number(((Number(c.total_paye) / Number(c.total_a_payer)) * 100).toFixed(1))
          : 100
      }));
    } catch (error) {
      console.error('❌ Erreur requête stats par catégorie:', error);
    }

    // 7. STATISTIQUES BUDGÉTAIRES - CORRIGÉ AVEC VOS TABLES
  let budgetData = {
      previsions_recettes: 0,
      total_depenses_reelles: 0,
      reste_budget: 0,
      pourcentage_utilisation: 0
    };
    
    try {
      // Récupérer le total des budgets alloués pour l'année scolaire en cours
      const budgetsAllouesSql = `
        SELECT COALESCE(SUM(montant_alloue), 0) as total_budget
        FROM budgets
        WHERE annee_scolaire = ?
      `;
      
      const budgetsAlloues = await query(budgetsAllouesSql, [anneeScolaire]) as any[];
      
      // Récupérer le total des dépenses pour l'année scolaire en cours
      const depensesReellesSql = `
        SELECT COALESCE(SUM(d.montant), 0) as total_depenses
        FROM depenses_budget d
        INNER JOIN budgets b ON d.budget_id = b.id
        WHERE b.annee_scolaire = ?
          AND d.statut IN ('valide')
      `;
      
      const depensesReelles = await query(depensesReellesSql, [anneeScolaire]) as any[];
      
      // Récupérer les dépenses par catégorie pour les graphiques
      const depensesParCategorieSql = `
        SELECT 
          b.categorie,
          SUM(d.montant) as montant
        FROM depenses_budget d
        INNER JOIN budgets b ON d.budget_id = b.id
        WHERE b.annee_scolaire = ?
          AND d.statut IN ('valide')
        GROUP BY b.categorie
      `;
      
      const depensesParCategorie = await query(depensesParCategorieSql, [anneeScolaire]) as any[];
      
      // ✅ CORRECTION ICI : Requête des dépenses par mois avec agrégation correcte
      const depensesParMoisSql = `
        SELECT 
          DATE_FORMAT(MIN(d.date_depense), '%b %Y') as mois,
          DATE_FORMAT(d.date_depense, '%Y-%m') as mois_cle,
          SUM(d.montant) as montant
        FROM depenses_budget d
        INNER JOIN budgets b ON d.budget_id = b.id
        WHERE b.annee_scolaire = ?
          AND d.statut IN ('valide')
        GROUP BY DATE_FORMAT(d.date_depense, '%Y-%m')
        ORDER BY mois_cle
      `;
      
      const depensesParMois = await query(depensesParMoisSql, [anneeScolaire]) as any[];
      
      // ✅ CORRECTION ICI : Requête alternative sans MIN si besoin
      const depensesParMoisAltSql = `
        SELECT 
          DATE_FORMAT(d.date_depense, '%b %Y') as mois,
          DATE_FORMAT(d.date_depense, '%Y-%m') as mois_cle,
          SUM(d.montant) as montant
        FROM depenses_budget d
        INNER JOIN budgets b ON d.budget_id = b.id
        WHERE b.annee_scolaire = ?
          AND d.statut IN ('valide')
        GROUP BY DATE_FORMAT(d.date_depense, '%Y-%m'), DATE_FORMAT(d.date_depense, '%b %Y')
        ORDER BY mois_cle
      `;
      
      // Utilisez l'une ou l'autre des requêtes ci-dessus
      const depensesParMoisAlt = await query(depensesParMoisAltSql, [anneeScolaire]) as any[];
      
      const previsionsRecettes = Number(budgetsAlloues[0]?.total_budget) || 0;
      const totalDepensesReelles = Number(depensesReelles[0]?.total_depenses) || 0;
      const resteBudget = previsionsRecettes - totalDepensesReelles;
      const pourcentageUtilisation = previsionsRecettes > 0 
        ? Number(((totalDepensesReelles / previsionsRecettes) * 100).toFixed(1))
        : 0;
      
      budgetData = {
        previsions_recettes: previsionsRecettes,
        total_depenses_reelles: totalDepensesReelles,
        reste_budget: resteBudget,
        pourcentage_utilisation: pourcentageUtilisation
      };
      
      console.log('✅ Données budgétaires:', budgetData);
      console.log('📊 Dépenses par catégorie:', depensesParCategorie);
      console.log('📊 Dépenses par mois:', depensesParMois);
      
    } catch (error) {
      console.error('❌ Erreur requête budget:', error);
    }

    // 8. ÉVOLUTION MENSUELLE
    let evolutionFormatted: any[] = [];
    try {
      // Mois actuels
      const mois = [
        { index: 0, nom: 'Jan', moisNum: 1 },
        { index: 1, nom: 'Fév', moisNum: 2 },
        { index: 2, nom: 'Mar', moisNum: 3 },
        { index: 3, nom: 'Avr', moisNum: 4 },
        { index: 4, nom: 'Mai', moisNum: 5 },
        { index: 5, nom: 'Juin', moisNum: 6 },
        { index: 6, nom: 'Juil', moisNum: 7 },
        { index: 7, nom: 'Août', moisNum: 8 },
        { index: 8, nom: 'Sep', moisNum: 9 },
        { index: 9, nom: 'Oct', moisNum: 10 },
        { index: 10, nom: 'Nov', moisNum: 11 },
        { index: 11, nom: 'Déc', moisNum: 12 }
      ];
      
      const anneeActuelle = new Date().getFullYear();
      
      // Créer les 12 derniers mois
      for (let i = 0; i < 12; i++) {
        const moisIndex = (new Date().getMonth() - i + 12) % 12;
        const moisData = mois[moisIndex];
        const moisAnnee = new Date().getMonth() - i < 0 ? anneeActuelle - 1 : anneeActuelle;
        
        evolutionFormatted.unshift({
          mois: `${moisData.nom} ${moisAnnee}`,
          recettes: 0,
          depenses: 0,
          solde: 0,
          previsions: budgetData.previsions_recettes / 12 // Répartir le budget annuel
        });
      }
      
      // Récupérer les paiements mensuels
      try {
        const paiementsMensuelsSql = `
          SELECT 
            MONTH(date_paiement) as mois,
            YEAR(date_paiement) as annee,
            SUM(montant) as total
          FROM paiements_frais
          WHERE date_paiement >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
          GROUP BY YEAR(date_paiement), MONTH(date_paiement)
        `;
        
        const paiementsMensuels = await query(paiementsMensuelsSql, []) as any[];
        
        // Récupérer les dépenses mensuelles
        const depensesMensuellesSql = `
          SELECT 
            MONTH(d.date_depense) as mois,
            YEAR(d.date_depense) as annee,
            SUM(d.montant) as total
          FROM depenses_budget d
          INNER JOIN budgets b ON d.budget_id = b.id
          WHERE d.date_depense >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            AND d.statut IN ('valide')
          GROUP BY YEAR(d.date_depense), MONTH(d.date_depense)
        `;
        
        const depensesMensuelles = await query(depensesMensuellesSql, []) as any[];
        
        // Mettre à jour les données
        evolutionFormatted = evolutionFormatted.map(item => {
          const [moisNom, anneeStr] = item.mois.split(' ');
          const annee = parseInt(anneeStr);
          const moisNum = mois.find(m => m.nom === moisNom)?.moisNum || 1;
          
          const paiement = paiementsMensuels.find((p: any) => 
            p.annee === annee && p.mois === moisNum
          );
          
          const depense = depensesMensuelles.find((d: any) => 
            d.annee === annee && d.mois === moisNum
          );
          
          const recettes = Number(paiement?.total) || 0;
          const depenses = Number(depense?.total) || 0;
          
          return {
            ...item,
            recettes,
            depenses,
            solde: recettes - depenses
          };
        });
      } catch (error) {
        console.error('❌ Erreur requête paiements mensuels:', error);
      }
      
    } catch (error) {
      console.error('❌ Erreur calcul évolution mensuelle:', error);
    }

    // 9. DERNIÈRES TRANSACTIONS
    let transactionsFormatted: any[] = [];
    try {
      const dernieresTransactionsSql = `
        (SELECT 
          'recette' as type,
          CONCAT('Paiement - ', e.prenom, ' ', e.nom) as description,
          p.montant,
          p.date_paiement as date,
          cf.nom as categorie,
          p.reference_paiement as reference
        FROM paiements_frais p
        INNER JOIN eleves e ON p.eleve_id = e.id
        INNER JOIN frais_eleves fe ON p.frais_eleve_id = fe.id
        INNER JOIN frais_scolaires fs ON fe.frais_scolaire_id = fs.id
        INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
        ORDER BY p.date_paiement DESC
        LIMIT 5)
        UNION ALL
        (SELECT 
          'depense' as type,
          CONCAT('Dépense - ', d.description) as description,
          d.montant,
          d.date_depense as date,
          b.categorie as categorie,
          d.reference as reference
        FROM depenses_budget d
        INNER JOIN budgets b ON d.budget_id = b.id
        WHERE d.statut IN ('valide')
        ORDER BY d.date_depense DESC
        LIMIT 5)
        ORDER BY date DESC
        LIMIT 10
      `;
      
      const dernieresTransactions = await query(dernieresTransactionsSql, []) as any[];
      
      transactionsFormatted = dernieresTransactions.map((t: any, index: number) => ({
        id: index + 1,
        type: t.type || 'recette',
        description: t.description || 'Transaction',
        montant: Number(t.montant) || 0,
        date: t.date || new Date().toISOString().split('T')[0],
        categorie: t.categorie || 'Non catégorisé',
        reference: t.reference || ''
      }));
    } catch (error) {
      console.error('❌ Erreur requête dernières transactions:', error);
    }

    // 10. ALERTES INTELLIGENTES
    const alertes = [];
    
    try {
      // Alerte impayés importants
      if (fraisData.total_impayes > 0) {
        const pourcentageImpayes = fraisData.total_frais_a_payer > 0 
          ? ((fraisData.total_impayes / fraisData.total_frais_a_payer) * 100).toFixed(1)
          : "0";
        if (parseFloat(pourcentageImpayes) > 30) {
          alertes.push({
            type: 'danger',
            message: `${pourcentageImpayes}% des frais sont impayés (${formaterMontant(fraisData.total_impayes)})`,
            action: 'Voir impayés'
          });
        } else if (parseFloat(pourcentageImpayes) > 15) {
          alertes.push({
            type: 'warning',
            message: `${pourcentageImpayes}% des frais sont impayés`,
            action: 'Voir impayés'
          });
        }
      }
      
      // Alerte échéances
      if (totalEnRetard > 0) {
        alertes.push({
          type: 'warning',
          message: `Des paiements en retard pour un total de ${formaterMontant(totalEnRetard)}`,
          action: 'Voir les retards'
        });
      }
      
      // ALERTE BUDGET - CORRIGÉE AVEC LE POURCENTAGE RÉEL
      if (budgetData.previsions_recettes > 0) {
        if (budgetData.pourcentage_utilisation > 90) {
          alertes.push({
            type: 'warning',
            message: `⚠️ ${budgetData.pourcentage_utilisation}% du budget annuel utilisé (${formaterMontant(budgetData.total_depenses_reelles)} sur ${formaterMontant(budgetData.previsions_recettes)})`,
            action: 'Voir le budget'
          });
        } else if (budgetData.pourcentage_utilisation > 0) {
          alertes.push({
            type: 'info',
            message: `${budgetData.pourcentage_utilisation}% du budget utilisé - Reste ${formaterMontant(budgetData.reste_budget)}`,
            action: 'Voir le budget'
          });
        } else if (budgetData.pourcentage_utilisation === 0 && budgetData.total_depenses_reelles === 0) {
          alertes.push({
            type: 'info',
            message: `ℹ️ Aucune dépense enregistrée. Budget annuel: ${formaterMontant(budgetData.previsions_recettes)}`,
            action: 'Voir le budget'
          });
        }
      } else {
        alertes.push({
          type: 'info',
          message: `ℹ️ Aucun budget défini pour l'année scolaire ${anneeScolaire}`,
          action: 'Définir budget'
        });
      }
      
    } catch (error) {
      console.error('❌ Erreur génération alertes:', error);
    }

    // Assembler toutes les statistiques
    const stats = {
      // Indicateurs clés
      total_recettes: Number(paiementsData.montant_annee) || 0,
      total_depenses: Number(budgetData.total_depenses_reelles) || 0,
      solde_actuel: (Number(paiementsData.montant_annee) || 0) - (Number(budgetData.total_depenses_reelles) || 0),
      previsions_budget: Number(budgetData.previsions_recettes) || 0,
      budget_restant: Number(budgetData.reste_budget) || 0,
      pourcentage_budget_utilise: Number(budgetData.pourcentage_utilisation) || 0,
      
      // Frais
      total_frais_a_payer: Number(fraisData.total_frais_a_payer) || 0,
      total_frais_payes: Number(fraisData.total_frais_payes) || 0,
      total_impayes: Number(fraisData.total_impayes) || 0,
      total_en_retard: Number(totalEnRetard) || 0,
      taux_recouvrement: Number(fraisData.total_frais_a_payer) > 0 
        ? Number(((Number(fraisData.total_frais_payes) / Number(fraisData.total_frais_a_payer)) * 100).toFixed(1))
        : 100,
      
      // Paiements
      nombre_paiements_jour: Number(paiementsData.nombre_jour) || 0,
      montant_paiements_jour: Number(paiementsData.montant_jour) || 0,
      nombre_paiements_mois: Number(paiementsData.nombre_mois) || 0,
      montant_paiements_mois: Number(paiementsData.montant_mois) || 0,
      nombre_paiements_annee: Number(paiementsData.nombre_annee) || 0,
      montant_paiements_annee: Number(paiementsData.montant_annee) || 0,
      
      // Élèves
      nombre_eleves_avec_impaye: Number(elevesData.eleves_avec_impaye) || 0,
      nombre_eleves_a_jour: Number(elevesAJour) || 0,
      
      // Statistiques détaillées
      stats_par_classe: statsClasseFormatted,
      stats_par_categorie: statsCategorieFormatted,
      evolution_mensuelle: evolutionFormatted,
      dernieres_transactions: transactionsFormatted,
      alertes,
      
      // Année scolaire
      annee_scolaire: anneeScolaire
    };

    console.log('✅ Dashboard stats calculées avec succès');
    console.log('📊 Budget:', {
      previsions: stats.previsions_budget,
      depenses: stats.total_depenses,
      pourcentage: stats.pourcentage_budget_utilise
    });

    // Toujours retourner un objet JSON valide
    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error: any) {
    console.error('❌ Erreur dashboard stats:', error);
    console.error('❌ Message:', error.message);
    console.error('❌ Stack:', error.stack);
    
    // Retourner des stats par défaut en cas d'erreur
    const anneeScolaire = (() => {
      const maintenant = new Date();
      const annee = maintenant.getFullYear();
      const mois = maintenant.getMonth() + 1;
      return mois >= 8 ? `${annee}-${annee + 1}` : `${annee - 1}-${annee}`;
    })();
    
    const statsParDefaut = {
      total_recettes: 0,
      total_depenses: 0,
      solde_actuel: 0,
      previsions_budget: 0,
      budget_restant: 0,
      pourcentage_budget_utilise: 0,
      total_frais_a_payer: 0,
      total_frais_payes: 0,
      total_impayes: 0,
      total_en_retard: 0,
      taux_recouvrement: 100,
      nombre_paiements_jour: 0,
      montant_paiements_jour: 0,
      nombre_paiements_mois: 0,
      montant_paiements_mois: 0,
      nombre_paiements_annee: 0,
      montant_paiements_annee: 0,
      nombre_eleves_avec_impaye: 0,
      nombre_eleves_a_jour: 0,
      stats_par_classe: [],
      stats_par_categorie: [],
      evolution_mensuelle: [],
      dernieres_transactions: [],
      alertes: [{
        type: 'warning',
        message: 'Erreur de chargement des données. Veuillez rafraîchir.',
        action: 'Rafraîchir'
      }],
      annee_scolaire: anneeScolaire
    };

    return NextResponse.json({
      success: false,
      stats: statsParDefaut,
      erreur: error.message
    });
  }
}

// Fonction utilitaire pour formater les montants
function formaterMontant(montant: number): string {
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(montant);
  } catch {
    return montant.toLocaleString('fr-FR') + ' FCFA';
  }
}
