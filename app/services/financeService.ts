import { query } from '../lib/database';

// Interfaces manquantes
export interface CategorieFrais {
  id: number;
  nom: string;
  description?: string;
  type: 'scolarite' | 'divers' | 'penalite' | 'autre';
  montant_base: number;
  periodicite: 'unique' | 'mensuel' | 'trimestriel' | 'annuel';
  statut: 'actif' | 'inactif';
  created_at: string;
}

export interface FraisClasse {
  id: number;
  classe_id: number;
  categorie_frais_id: number;
  annee_scolaire: string;
  montant: number;
  periodicite: 'unique' | 'mensuel' | 'trimestriel' | 'annuel';
  statut: 'actif' | 'inactif';
  created_at: string;
  classe_nom?: string;
  classe_niveau?: string;
  categorie_nom?: string;
  nombre_eleves?: number;
}

export interface PaiementFrais {
  id: number;
  frais_eleve_id: number;
  eleve_id: number;
  montant: number;
  date_paiement: string;
  mode_paiement: 'especes' | 'cheque' | 'virement' | 'carte' | 'mobile' | 'autre';
  reference_paiement?: string;
  statut: string;
  notes?: string;
  created_by: number;
  created_at?: string;
  updated_at?: string;
  // Champs de jointure
  eleve_nom?: string;
  eleve_prenom?: string;
  eleve_matricule?: string;
  classe_nom?: string;
  classe_niveau?: string;
  categorie_nom?: string;
  montant_total: number;
}

export interface FraisScolaire {
  id: number;
  classe_id: number;
  categorie_frais_id: number;
  annee_scolaire: string;
  montant: number;
  periodicite: 'unique' | 'mensuel' | 'trimestriel' | 'annuel';
  statut: 'actif' | 'inactif';
  created_at: string;
  updated_at: string;
  // Jointures
  classe_nom?: string;
  classe_niveau?: string;
  categorie_nom?: string;
  categorie_type?: string;
  nombre_eleves?: number;
}

export interface FraisEleve {
  id: number;
  frais_scolaire_id: number;
  eleve_id: number;
  annee_scolaire: string;
  montant: number;
  montant_paye: number;
  date_echeance: string;
  statut: 'en_attente' | 'partiel' | 'paye' | 'en_retard';
  date_paiement?: string;
  mode_paiement?: 'especes' | 'cheque' | 'virement' | 'carte' | 'mobile' | 'autre';
  reference_paiement?: string;
  notes?: string;
  created_at: string;
  // Jointures
  eleve_nom?: string;
  eleve_prenom?: string;
  eleve_matricule?: string;
  classe_nom?: string;
  classe_niveau?: string;
  categorie_nom?: string;
}

export interface StatistiquesPaiements {
  total_jour: number;
  total_mois: number;
  total_annee: number;
  total_periode: number;
  nombre_paiements_jour: number;
  nombre_paiements_mois: number;
  moyenne_paiement: number;
  repartition_categories: { categorie: string; montant: number }[];
  evolution_paiements: { date: string; montant: number }[];
}

// Interface pour les versements
export interface VersementScolarite {
  id: number;
  eleve_id: number;
  frais_scolaire_id: number;
  numero_versement: number;
  montant_versement: number;
  montant_paye: number;
  date_echeance: string;
  statut: 'en_attente' | 'partiel' | 'paye' | 'en_retard';
  date_paiement?: string;
  created_at?: string;
  updated_at?: string;
  // Champs de jointure
  eleve_nom?: string;
  eleve_prenom?: string;
  categorie_nom?: string;
}

// Nouvelles interfaces pour le tableau de bord
export interface StatistiquesDashboard {
  total_recettes: number;
  total_depenses: number;
  solde_actuel: number;
  frais_impayes: number;
  frais_en_retard: number;
  evolution_mensuelle: { mois: string; recettes: number; depenses: number }[];
  repartition_recettes: { categorie: string; montant: number }[];
  repartition_depenses: { categorie: string; montant: number }[];
  taux_recouvrement: number;
  marge_nette: number;
  taux_marge: number;
  ratio_depenses: number;
  alertes_actives: number;
  transactions_en_attente: number;
}

export interface Transaction {
  id: number;
  type: 'entree' | 'sortie';
  categorie: string;
  montant: number;
  description?: string;
  date_transaction: string;
  mode_paiement: 'especes' | 'cheque' | 'virement' | 'carte' | 'autre';
  reference?: string;
  beneficiaire?: string;
  statut: 'confirme' | 'en_attente' | 'annule';
  created_by: number;
  created_at: string;
}

export interface AlerteDashboard {
  id: number;
  type: 'warning' | 'danger' | 'info' | 'success';
  titre: string;
  message: string;
  date: string;
  priorite: 'haute' | 'moyenne' | 'basse';
  statut: 'non_lu' | 'lu';
}

export class FinanceService {
  
  // Méthode utilitaire pour formater les montants en FCFA
  static formaterMontantFCFA(montant: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(montant);
  }

  // Méthode pour vérifier si un frais existe déjà
  static async verifierFraisExistant(fraisData: any): Promise<{success: boolean, existe: boolean, fraisExistant?: FraisScolaire, erreur?: string}> {
    try {
      console.log('🔍 Vérification existence frais:', fraisData);
      
      const sql = `
        SELECT 
          fs.*,
          c.nom as classe_nom,
          c.niveau as classe_niveau,
          cf.nom as categorie_nom
        FROM frais_scolaires fs
        INNER JOIN classes c ON fs.classe_id = c.id
        INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
        WHERE fs.classe_id = ? 
          AND fs.categorie_frais_id = ? 
          AND fs.annee_scolaire = ?
          AND fs.statut = 'actif'
      `;
      
      const params = [
        parseInt(fraisData.classe_id),
        parseInt(fraisData.categorie_frais_id),
        fraisData.annee_scolaire
      ];

      console.log('📦 Paramètres vérification:', params);

      const frais = await query(sql, params) as FraisScolaire[];
      
      if (frais.length > 0) {
        console.log('⚠️ Frais existant trouvé:', frais[0]);
        return { 
          success: true, 
          existe: true, 
          fraisExistant: frais[0] 
        };
      }
      
      console.log('✅ Aucun frais existant trouvé');
      return { success: true, existe: false };
    } catch (error: any) {
      console.error('❌ Erreur vérification frais existant:', error);
      return { 
        success: false, 
        existe: false,
        erreur: `Erreur lors de la vérification: ${error.message}` 
      };
    }
  }

  // Méthode pour créer un frais scolaire
  static async creerFraisScolaire(fraisData: any): Promise<{success: boolean, frais?: FraisScolaire, erreur?: string}> {
    try {
      console.log('📝 Début création frais scolaire:', fraisData);
      
      // VÉRIFICATION : Vérifier d'abord si le frais existe déjà
      const verification = await this.verifierFraisExistant(fraisData);
      
      if (!verification.success) {
        return { 
          success: false, 
          erreur: verification.erreur || 'Erreur lors de la vérification des doublons' 
        };
      }
      
      if (verification.existe && verification.fraisExistant) {
        const fraisExistant = verification.fraisExistant;
        
        // CORRECTION : Utilisez la méthode statique pour formater le montant
        const montantFormate = this.formaterMontantFCFA(fraisExistant.montant);
        
        return { 
          success: false, 
          erreur: `Un frais de cette catégorie existe déjà pour cette classe et année scolaire. 
                  Frais existant: ${fraisExistant.categorie_nom} - ${montantFormate} (${fraisExistant.periodicite})` 
        };
      }
      
      // Si aucun doublon, procéder à la création
      const sql = `
        INSERT INTO frais_scolaires (
          classe_id, categorie_frais_id, annee_scolaire, montant, periodicite, statut
        ) VALUES (?, ?, ?, ?, ?, 'actif')
      `;
      
      const params = [
        parseInt(fraisData.classe_id),
        parseInt(fraisData.categorie_frais_id),
        fraisData.annee_scolaire,
        parseFloat(fraisData.montant),
        fraisData.periodicite
      ];

      console.log('📦 Paramètres insertion:', params);

      const result = await query(sql, params) as any;
      
      console.log('✅ Frais scolaire créé, ID:', result.insertId);
      
      // Récupérer le frais créé avec les jointures
      const sqlSelect = `
        SELECT 
          fs.*,
          c.nom as classe_nom,
          c.niveau as classe_niveau,
          cf.nom as categorie_nom,
          cf.type as categorie_type,
          (SELECT COUNT(*) FROM eleves e WHERE e.classe_id = fs.classe_id AND e.statut = 'actif') as nombre_eleves
        FROM frais_scolaires fs
        INNER JOIN classes c ON fs.classe_id = c.id
        INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
        WHERE fs.id = ?
      `;
      
      const frais = await query(sqlSelect, [result.insertId]) as FraisScolaire[];
      
      if (frais.length === 0) {
        return { success: false, erreur: 'Frais créé mais non retrouvé' };
      }

      return { success: true, frais: frais[0] };
    } catch (error: any) {
      console.error('❌ Erreur création frais scolaire:', error);
      
      // Gestion spécifique de l'erreur de doublon
      if (error.code === 'ER_DUP_ENTRY' || error.message.includes('unique_frais_classe')) {
        return { 
          success: false, 
          erreur: 'Un frais de cette catégorie existe déjà pour cette classe et année scolaire. Veuillez modifier le frais existant ou choisir une autre combinaison.' 
        };
      }
      
      return { 
        success: false, 
        erreur: `Erreur lors de la création du frais: ${error.message}` 
      };
    }
  }

  // Méthode pour modifier un frais scolaire
  static async modifierFraisScolaire(id: number, fraisData: any): Promise<{success: boolean, frais?: FraisScolaire, erreur?: string}> {
    try {
      console.log('✏️ Début modification frais scolaire ID:', id);
      console.log('📦 Données:', fraisData);
      
      // VÉRIFICATION : Vérifier les doublons (en excluant l'ID actuel)
      const sqlVerification = `
        SELECT id FROM frais_scolaires 
        WHERE classe_id = ? 
          AND categorie_frais_id = ? 
          AND annee_scolaire = ?
          AND statut = 'actif'
          AND id != ?
      `;
      
      const paramsVerification = [
        parseInt(fraisData.classe_id),
        parseInt(fraisData.categorie_frais_id),
        fraisData.annee_scolaire,
        id
      ];

      const doublons = await query(sqlVerification, paramsVerification) as any[];
      
      if (doublons.length > 0) {
        return { 
          success: false, 
          erreur: 'Un autre frais de cette catégorie existe déjà pour cette classe et année scolaire.' 
        };
      }
      
      const sql = `
        UPDATE frais_scolaires 
        SET classe_id = ?, categorie_frais_id = ?, annee_scolaire = ?, 
            montant = ?, periodicite = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      const params = [
        parseInt(fraisData.classe_id),
        parseInt(fraisData.categorie_frais_id),
        fraisData.annee_scolaire,
        parseFloat(fraisData.montant),
        fraisData.periodicite,
        id
      ];

      console.log('📦 Paramètres SQL:', params);

      const result = await query(sql, params) as any;
      console.log('✅ Résultat mise à jour:', result);
      
      // Récupérer le frais mis à jour
      const frais = await this.obtenirFraisScolaireParId(id);
      
      if (!frais.success) {
        return { success: false, erreur: 'Frais modifié mais non retrouvé' };
      }

      return { success: true, frais: frais.frais };
    } catch (error: any) {
      console.error('❌ Erreur modification frais scolaire:', error);
      
      // Gestion spécifique de l'erreur de doublon
      if (error.code === 'ER_DUP_ENTRY' || error.message.includes('unique_frais_classe')) {
        return { 
          success: false, 
          erreur: 'Un autre frais de cette catégorie existe déjà pour cette classe et année scolaire.' 
        };
      }
      
      return { 
        success: false, 
        erreur: `Erreur lors de la modification du frais: ${error.message}` 
      };
    }
  }

  // Méthode pour obtenir les catégories de frais
  static async obtenirCategoriesFrais(): Promise<{success: boolean, categories?: CategorieFrais[], erreur?: string}> {
    try {
      console.log('🔍 Début récupération catégories frais');
      
      const sql = 'SELECT * FROM categories_frais WHERE statut = "actif" ORDER BY nom';
      const categories = await query(sql) as CategorieFrais[];
      
      console.log('✅ Catégories récupérées:', categories.length);
      
      return { success: true, categories };
    } catch (error: any) {
      console.error('❌ Erreur récupération catégories frais:', error);
      return { 
        success: false, 
        erreur: `Erreur base de données: ${error.message}`,
        categories: []
      };
    }
  }

  // Méthode pour obtenir les frais par classe
  static async obtenirFraisClasses(filtres: any = {}): Promise<{success: boolean, frais?: FraisClasse[], erreur?: string}> {
    try {
      let sql = `
        SELECT 
          fc.*,
          c.nom as classe_nom,
          c.niveau as classe_niveau,
          cf.nom as categorie_nom,
          (SELECT COUNT(*) FROM eleves e WHERE e.classe_id = fc.classe_id AND e.statut = 'actif') as nombre_eleves
        FROM frais_classes fc
        INNER JOIN classes c ON fc.classe_id = c.id
        INNER JOIN categories_frais cf ON fc.categorie_frais_id = cf.id
        WHERE 1=1
      `;
      
      const params: any[] = [];

      if (filtres.classe_id) {
        sql += ' AND fc.classe_id = ?';
        params.push(filtres.classe_id);
      }

      if (filtres.annee_scolaire) {
        sql += ' AND fc.annee_scolaire = ?';
        params.push(filtres.annee_scolaire);
      }

      if (filtres.statut) {
        sql += ' AND fc.statut = ?';
        params.push(filtres.statut);
      }

      sql += ' ORDER BY c.niveau, c.nom, cf.nom';

      const frais = await query(sql, params) as FraisClasse[];
      return { success: true, frais };
    } catch (error: any) {
      console.error('Erreur récupération frais classes:', error);
      return { success: false, erreur: 'Erreur lors de la récupération des frais de classe' };
    }
  }

  // Méthode pour supprimer les frais élèves associés
  static async supprimerFraisElevesAssocies(fraisScolaireId: number): Promise<{success: boolean, message?: string, erreur?: string}> {
    try {
      console.log('🗑️ Suppression des frais élèves associés au frais scolaire ID:', fraisScolaireId);
      
      // Vérifier s'il y a des paiements associés aux frais élèves
      const sqlVerifPaiements = `
        SELECT COUNT(*) as count 
        FROM paiements_frais pf
        INNER JOIN frais_eleves fe ON pf.frais_eleve_id = fe.id
        WHERE fe.frais_scolaire_id = ?
      `;
      
      const resultPaiements = await query(sqlVerifPaiements, [fraisScolaireId]) as any[];
      
      if (resultPaiements[0].count > 0) {
        // Supprimer d'abord les paiements associés
        console.log(`📦 Suppression de ${resultPaiements[0].count} paiements associés...`);
        
        const sqlSupprimerPaiements = `
          DELETE pf FROM paiements_frais pf
          INNER JOIN frais_eleves fe ON pf.frais_eleve_id = fe.id
          WHERE fe.frais_scolaire_id = ?
        `;
        
        await query(sqlSupprimerPaiements, [fraisScolaireId]);
      }
      
      // Maintenant supprimer les frais élèves
      const sqlSupprimerFraisEleves = 'DELETE FROM frais_eleves WHERE frais_scolaire_id = ?';
      const result = await query(sqlSupprimerFraisEleves, [fraisScolaireId]) as any;
      
      console.log(`✅ ${result.affectedRows} frais élèves supprimés`);
      
      return { 
        success: true, 
        message: `${result.affectedRows} frais élèves associés supprimés` 
      };
    } catch (error: any) {
      console.error('❌ Erreur suppression frais élèves associés:', error);
      return { 
        success: false, 
        erreur: `Erreur lors de la suppression des frais élèves: ${error.message}` 
      };
    }
  }

  // Méthode pour obtenir les versements d'un élève
  static async obtenirVersementsEleve(eleveId: number, fraisScolaireId?: number): Promise<{success: boolean, versements?: VersementScolarite[], erreur?: string}> {
    try {
      let sql = `
        SELECT 
          v.*,
          e.nom as eleve_nom,
          e.prenom as eleve_prenom,
          cf.nom as categorie_nom
        FROM versements_scolarite v
        INNER JOIN eleves e ON v.eleve_id = e.id
        INNER JOIN frais_scolaires fs ON v.frais_scolaire_id = fs.id
        INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
        WHERE v.eleve_id = ?
      `;
      
      const params: any[] = [eleveId];

      if (fraisScolaireId) {
        sql += ' AND v.frais_scolaire_id = ?';
        params.push(fraisScolaireId);
      }

      sql += ' ORDER BY v.numero_versement ASC';

      const versements = await query(sql, params) as VersementScolarite[];
      return { success: true, versements };
    } catch (error: any) {
      console.error('Erreur récupération versements:', error);
      return { success: false, erreur: 'Erreur lors de la récupération des versements' };
    }
  }

  // Méthode pour obtenir le prochain versement
  static async obtenirProchainVersement(eleveId: number, fraisScolaireId: number): Promise<{success: boolean, prochainNumero?: number, erreur?: string}> {
    try {
      const sql = `
        SELECT MAX(numero_versement) as dernier_numero 
        FROM versements_scolarite 
        WHERE eleve_id = ? AND frais_scolaire_id = ?
      `;
      
      const result = await query(sql, [eleveId, fraisScolaireId]) as any[];
      const dernierNumero = result[0]?.dernier_numero || 0;
      
      return { success: true, prochainNumero: dernierNumero + 1 };
    } catch (error: any) {
      console.error('Erreur récupération prochain versement:', error);
      return { success: false, erreur: 'Erreur lors de la récupération du prochain versement' };
    }
  }

  // Méthode pour créer des versements de scolarité
  static async creerVersementsScolarite(eleveId: number, fraisScolaireId: number, montantTotal: number, nombreVersements: number = 4): Promise<{success: boolean, message?: string, erreur?: string}> {
    try {
      const montantParVersement = montantTotal / nombreVersements;
      const aujourdhui = new Date();
      
      for (let i = 1; i <= nombreVersements; i++) {
        const dateEcheance = new Date(aujourdhui);
        dateEcheance.setMonth(aujourdhui.getMonth() + (i - 1));
        
        await query(
          `INSERT INTO versements_scolarite (
            eleve_id, frais_scolaire_id, numero_versement, 
            montant_versement, date_echeance, statut
          ) VALUES (?, ?, ?, ?, ?, 'en_attente')`,
          [eleveId, fraisScolaireId, i, montantParVersement, dateEcheance.toISOString().split('T')[0]]
        );
      }
      
      return { success: true, message: `${nombreVersements} versements créés avec succès` };
    } catch (error: any) {
      console.error('Erreur création versements:', error);
      return { success: false, erreur: 'Erreur lors de la création des versements' };
    }
  }

  // Méthode pour mettre à jour un versement après paiement
  static async mettreAJourVersementApresPaiement(versementId: number, montantPaye: number): Promise<{success: boolean, erreur?: string}> {
    try {
      const versement = await query(
        'SELECT * FROM versements_scolarite WHERE id = ?',
        [versementId]
      ) as VersementScolarite[];

      if (versement.length === 0) {
        return { success: false, erreur: 'Versement non trouvé' };
      }

      const nouveauMontantPaye = (versement[0].montant_paye || 0) + montantPaye;
      let nouveauStatut: 'partiel' | 'paye' | 'en_attente' | 'en_retard' = 'partiel';
      
      if (nouveauMontantPaye >= versement[0].montant_versement) {
        nouveauStatut = 'paye';
      } else if (nouveauMontantPaye > 0) {
        nouveauStatut = 'partiel';
      }

      // Vérifier si le versement est en retard
      const dateEcheance = new Date(versement[0].date_echeance);
      const aujourdhui = new Date();
      if (nouveauStatut !== 'paye' && dateEcheance < aujourdhui) {
        nouveauStatut = 'en_retard';
      }

      await query(
        `UPDATE versements_scolarite 
         SET montant_paye = ?, statut = ?, date_paiement = CASE WHEN ? >= montant_versement THEN CURDATE() ELSE date_paiement END
         WHERE id = ?`,
        [nouveauMontantPaye, nouveauStatut, nouveauMontantPaye, versementId]
      );

      return { success: true };
    } catch (error: any) {
      console.error('Erreur mise à jour versement:', error);
      return { success: false, erreur: 'Erreur lors de la mise à jour du versement' };
    }
  }

  // Méthode pour supprimer un frais de classe
  static async supprimerFraisClasse(id: number): Promise<{success: boolean, message?: string, erreur?: string}> {
    try {
      // Vérifier s'il y a des frais scolaires associés
      const fraisAssocies = await query(
        'SELECT COUNT(*) as count FROM frais_scolaires WHERE frais_classe_id = ?',
        [id]
      ) as any[];

      if (fraisAssocies[0].count > 0) {
        return { 
          success: false, 
          erreur: 'Impossible de supprimer ce frais de classe car des frais scolaires y sont associés' 
        };
      }

      await query('DELETE FROM frais_classes WHERE id = ?', [id]);
      return { success: true, message: 'Frais de classe supprimé avec succès' };
    } catch (error: any) {
      console.error('Erreur suppression frais classe:', error);
      return { success: false, erreur: 'Erreur lors de la suppression du frais de classe' };
    }
  }

  // GESTION DES PAIEMENTS
  static async obtenirPaiementsFrais(filtres: any = {}): Promise<{success: boolean, paiements?: PaiementFrais[], erreur?: string}> {
    try {
      let sql = `
        SELECT 
          p.*,
          e.nom as eleve_nom,
          e.prenom as eleve_prenom,
          e.matricule as eleve_matricule,
          c.nom as classe_nom,
          c.niveau as classe_niveau,
          cf.nom as categorie_nom,
          fs.montant as montant_total
        FROM paiements_frais p
        INNER JOIN frais_scolaires fs ON p.frais_scolaire_id = fs.id
        INNER JOIN eleves e ON p.eleve_id = e.id
        INNER JOIN classes c ON e.classe_id = c.id
        INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
        WHERE 1=1
      `;
      
      const params: any[] = [];

      if (filtres.date_debut) {
        sql += ' AND p.date_paiement >= ?';
        params.push(filtres.date_debut);
      }

      if (filtres.date_fin) {
        sql += ' AND p.date_paiement <= ?';
        params.push(filtres.date_fin);
      }

      if (filtres.classe_id) {
        sql += ' AND e.classe_id = ?';
        params.push(filtres.classe_id);
      }

      if (filtres.categorie_id) {
        sql += ' AND fs.categorie_frais_id = ?';
        params.push(filtres.categorie_id);
      }

      if (filtres.eleve_id) {
        sql += ' AND p.eleve_id = ?';
        params.push(filtres.eleve_id);
      }

      if (filtres.mode_paiement) {
        sql += ' AND p.mode_paiement = ?';
        params.push(filtres.mode_paiement);
      }

      // Filtres temporels
      if (filtres.du_jour) {
        sql += ' AND DATE(p.date_paiement) = CURDATE()';
      }

      if (filtres.du_mois) {
        sql += ' AND MONTH(p.date_paiement) = MONTH(CURDATE()) AND YEAR(p.date_paiement) = YEAR(CURDATE())';
      }

      if (filtres.de_l_annee) {
        sql += ' AND YEAR(p.date_paiement) = YEAR(CURDATE())';
      }

      sql += ' ORDER BY p.date_paiement DESC, p.created_at DESC';

      const paiements = await query(sql, params) as PaiementFrais[];
      return { success: true, paiements };
    } catch (error: any) {
      console.error('Erreur récupération paiements:', error);
      return { success: false, erreur: 'Erreur lors de la récupération des paiements' };
    }
  }

  // Méthode pour obtenir un frais scolaire par ID
  static async obtenirFraisScolaireParId(id: number): Promise<{success: boolean, frais?: FraisScolaire, erreur?: string}> {
    try {
      const sql = `
        SELECT 
          fs.*,
          c.nom as classe_nom,
          c.niveau as classe_niveau,
          cf.nom as categorie_nom,
          cf.type as categorie_type
        FROM frais_scolaires fs
        INNER JOIN classes c ON fs.classe_id = c.id
        INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
        WHERE fs.id = ?
      `;
      
      const frais = await query(sql, [id]) as FraisScolaire[];
      
      if (frais.length === 0) {
        return { success: false, erreur: 'Frais scolaire non trouvé' };
      }

      return { success: true, frais: frais[0] };
    } catch (error: any) {
      console.error('Erreur récupération frais scolaire:', error);
      return { success: false, erreur: 'Erreur lors de la récupération du frais scolaire' };
    }
  }

  // Méthode pour supprimer un frais scolaire
  static async supprimerFraisScolaire(id: number): Promise<{success: boolean, message?: string, erreur?: string}> {
    try {
      console.log('🗑️ Début suppression frais scolaire avec cascade ID:', id);
      
      // 1. Supprimer d'abord les frais élèves associés
      const suppressionFraisEleves = await this.supprimerFraisElevesAssocies(id);
      
      if (!suppressionFraisEleves.success) {
        return { 
          success: false, 
          erreur: `Impossible de supprimer les frais élèves associés: ${suppressionFraisEleves.erreur}` 
        };
      }
      
      console.log('✅ Frais élèves associés supprimés, suppression du frais scolaire...');
      
      // 2. Maintenant supprimer le frais scolaire
      const sql = 'DELETE FROM frais_scolaires WHERE id = ?';
      const result = await query(sql, [id]) as any;
      
      if (result.affectedRows === 0) {
        return { success: false, erreur: 'Frais scolaire non trouvé' };
      }
      
      console.log('✅ Frais scolaire supprimé avec succès');
      
      return { 
        success: true, 
        message: 'Frais scolaire et tous les frais élèves associés supprimés avec succès' 
      };
    } catch (error: any) {
      console.error('❌ Erreur suppression frais scolaire:', error);
      return { 
        success: false, 
        erreur: `Erreur lors de la suppression du frais scolaire: ${error.message}` 
      };
    }
  }

  // Méthode pour vérifier les frais élèves associés
  static async verifierFraisElevesAssocies(fraisScolaireId: number): Promise<{success: boolean, nombre?: number, erreur?: string}> {
    try {
      const sql = 'SELECT COUNT(*) as count FROM frais_eleves WHERE frais_scolaire_id = ?';
      const result = await query(sql, [fraisScolaireId]) as any[];
      
      return { success: true, nombre: result[0].count };
    } catch (error: any) {
      console.error('Erreur vérification frais élèves associés:', error);
      return { success: false, erreur: 'Erreur lors de la vérification' };
    }
  }

  // Méthode pour obtenir les frais élèves
  static async obtenirFraisEleves(filtres: any = {}): Promise<{success: boolean, frais?: FraisEleve[], erreur?: string}> {
    try {
      let sql = `
        SELECT 
          fe.*,
          e.nom as eleve_nom,
          e.prenom as eleve_prenom,
          e.matricule as eleve_matricule,
          c.nom as classe_nom,
          c.niveau as classe_niveau,
          cf.nom as categorie_nom,
          fs.montant as montant_total
        FROM frais_eleves fe
        INNER JOIN eleves e ON fe.eleve_id = e.id
        INNER JOIN frais_scolaires fs ON fe.frais_scolaire_id = fs.id
        INNER JOIN classes c ON e.classe_id = c.id
        INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
        WHERE 1=1
      `;
      
      const params: any[] = [];

      if (filtres.eleve_id) {
        sql += ' AND fe.eleve_id = ?';
        params.push(filtres.eleve_id);
      }

      if (filtres.annee_scolaire) {
        sql += ' AND fe.annee_scolaire = ?';
        params.push(filtres.annee_scolaire);
      }

      if (filtres.statut) {
        sql += ' AND fe.statut = ?';
        params.push(filtres.statut);
      }

      if (filtres.classe_id) {
        sql += ' AND e.classe_id = ?';
        params.push(filtres.classe_id);
      }

      sql += ' ORDER BY fe.date_echeance ASC';

      const frais = await query(sql, params) as FraisEleve[];

      // Mettre à jour le statut des frais en retard
      for (const fraisItem of frais) {
        if ((fraisItem.statut === 'en_attente' || fraisItem.statut === 'partiel') && 
            new Date(fraisItem.date_echeance) < new Date()) {
          await query(
            'UPDATE frais_eleves SET statut = "en_retard" WHERE id = ?',
            [fraisItem.id]
          );
          fraisItem.statut = 'en_retard';
        }
     
      }
      
      return { success: true, frais };
  } catch (error: any) {
    console.error('Erreur récupération frais élèves:', error);
    return { success: false, erreur: 'Erreur lors de la récupération des frais élèves' };
  }
}

// Dans financeService.ts - Méthode obtenirPaiements CORRIGÉE
static async obtenirPaiements(filtres: any = {}): Promise<{success: boolean, paiements?: PaiementFrais[], erreur?: string}> {
  console.log('🔍 Service - Début obtenirPaiements avec filtres:', filtres);
  
  try {
    // REQUÊTE SQL CORRIGÉE - utilise frais_eleve_id au lieu de frais_scolaire_id
    let sql = `
      SELECT 
        p.id,
        p.frais_eleve_id,
        p.eleve_id,
        p.montant,
        p.date_paiement,
        p.mode_paiement,
        p.reference_paiement,
        p.notes,
        p.statut,
        p.created_by,
        p.created_at,
        p.updated_at,
        e.nom as eleve_nom,
        e.prenom as eleve_prenom,
        e.matricule as eleve_matricule,
        c.nom as classe_nom,
        c.niveau as classe_niveau,
        cf.nom as categorie_nom,
        fe.montant as montant_total
      FROM paiements_frais p
      INNER JOIN frais_eleves fe ON p.frais_eleve_id = fe.id
      INNER JOIN eleves e ON p.eleve_id = e.id
      INNER JOIN classes c ON e.classe_id = c.id
      INNER JOIN frais_scolaires fs ON fe.frais_scolaire_id = fs.id
      INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
      WHERE 1=1
    `;
    
    const params: any[] = [];

    console.log('🔍 Filtres reçus dans service:', filtres);

    // Filtres par date
    if (filtres.date_debut && filtres.date_debut.trim() !== '') {
      sql += ' AND p.date_paiement >= ?';
      params.push(filtres.date_debut);
      console.log('📅 Filtre date début:', filtres.date_debut);
    }

    if (filtres.date_fin && filtres.date_fin.trim() !== '') {
      sql += ' AND p.date_paiement <= ?';
      params.push(filtres.date_fin);
      console.log('📅 Filtre date fin:', filtres.date_fin);
    }

    // Filtres temporels automatiques
    if (filtres.du_jour === 'true' || filtres.du_jour === true) {
      sql += ' AND DATE(p.date_paiement) = CURDATE()';
      console.log('📅 Filtre du jour activé');
    }

    if (filtres.du_mois === 'true' || filtres.du_mois === true) {
      sql += ' AND MONTH(p.date_paiement) = MONTH(CURDATE()) AND YEAR(p.date_paiement) = YEAR(CURDATE())';
      console.log('📅 Filtre du mois activé');
    }

    if (filtres.de_l_annee === 'true' || filtres.de_l_annee === true) {
      sql += ' AND YEAR(p.date_paiement) = YEAR(CURDATE())';
      console.log('📅 Filtre de l\'année activé');
    }

    // Filtre par classe
    if (filtres.classe_id && filtres.classe_id.toString().trim() !== '') {
      const classeId = parseInt(filtres.classe_id.toString());
      if (!isNaN(classeId)) {
        sql += ' AND e.classe_id = ?';
        params.push(classeId);
        console.log('🏫 Filtre classe ID:', classeId);
      }
    }

    // Filtre par mode de paiement
    if (filtres.mode_paiement && filtres.mode_paiement.trim() !== '') {
      sql += ' AND p.mode_paiement = ?';
      params.push(filtres.mode_paiement);
      console.log('💳 Filtre mode paiement:', filtres.mode_paiement);
    }

    // Filtre par statut
    if (filtres.statut && filtres.statut.trim() !== '') {
      sql += ' AND p.statut = ?';
      params.push(filtres.statut);
      console.log('📊 Filtre statut:', filtres.statut);
    }

    sql += ' ORDER BY p.date_paiement DESC, p.created_at DESC';
    sql += ' LIMIT 1000';

    console.log('📝 SQL final:', sql);
    console.log('📦 Paramètres:', params);

    const result = await query(sql, params);
    
    console.log('📊 Résultat brut de la requête:', result);
    
    // TRANSFORMATION SÉCURISÉE DES RÉSULTATS
    let paiements: PaiementFrais[] = [];
    
    if (result) {
      if (Array.isArray(result)) {
        paiements = result.map((row: any) => {
          const paiement: PaiementFrais = {
            id: row.id || 0,
            frais_eleve_id: row.frais_eleve_id || 0,
            eleve_id: row.eleve_id || 0,
            montant: parseFloat(row.montant) || 0,
            date_paiement: row.date_paiement || '',
            mode_paiement: row.mode_paiement || 'especes',
            reference_paiement: row.reference_paiement || undefined,
            statut: (row.statut as 'paye' | 'en_attente') || 'paye', // ✅ Correction du statut
            notes: row.notes || undefined,
            created_by: row.created_by || 1,
            created_at: row.created_at || '',
            updated_at: row.updated_at || undefined,
            eleve_nom: row.eleve_nom || '',
            eleve_prenom: row.eleve_prenom || '',
            eleve_matricule: row.eleve_matricule || '',
            classe_nom: row.classe_nom || '',
            classe_niveau: row.classe_niveau || '',
            categorie_nom: row.categorie_nom || 'Non spécifié',
            montant_total: parseFloat(row.montant_total) || parseFloat(row.montant) || 0
          };
          return paiement;
        });
      } else if (typeof result === 'object') {
        // Si un seul objet est retourné
        const row = result as any;
        const paiement: PaiementFrais = {
          id: row.id || 0,
          frais_eleve_id: row.frais_eleve_id || 0,
          eleve_id: row.eleve_id || 0,
          montant: parseFloat(row.montant) || 0,
          date_paiement: row.date_paiement || '',
          mode_paiement: row.mode_paiement || 'especes',
          reference_paiement: row.reference_paiement || undefined,
          statut: (row.statut as 'paye' | 'en_attente') || 'paye', // ✅ Correction du statut
          notes: row.notes || undefined,
          created_by: row.created_by || 1,
          created_at: row.created_at || '',
          updated_at: row.updated_at || undefined,
          eleve_nom: row.eleve_nom || '',
          eleve_prenom: row.eleve_prenom || '',
          eleve_matricule: row.eleve_matricule || '',
          classe_nom: row.classe_nom || '',
          classe_niveau: row.classe_niveau || '',
          categorie_nom: row.categorie_nom || 'Non spécifié',
          montant_total: parseFloat(row.montant_total) || parseFloat(row.montant) || 0
        };
        paiements = [paiement];
      }
    }
    
    console.log('✅ obtenirPaiements terminé -', paiements.length, 'paiement(s) trouvé(s)');
    if (paiements.length > 0) {
      console.log('📋 Premier paiement:', {
        id: paiements[0].id,
        eleve: `${paiements[0].eleve_prenom} ${paiements[0].eleve_nom}`,
        montant: paiements[0].montant,
        statut: paiements[0].statut, // ✅ Vérification du statut
        notes: paiements[0].notes
      });
    }
    
    return { 
      success: true, 
      paiements: paiements
    };
    
  } catch (error: any) {
    console.error('❌ Erreur dans obtenirPaiements:', error);
    console.error('💥 Stack trace:', error.stack);
    return { 
      success: false, 
      erreur: `Erreur lors de la récupération des paiements: ${error.message}`,
      paiements: []
    };
  }
}

  static async obtenirFraisScolaires(filtres: any = {}): Promise<{success: boolean, frais?: FraisScolaire[], erreur?: string}> {
    try {
      console.log('🔍 Début récupération frais scolaires');
      
      let sql = `
        SELECT 
          fs.*,
          c.nom as classe_nom,
          c.niveau as classe_niveau,
          cf.nom as categorie_nom,
          cf.type as categorie_type,
          (SELECT COUNT(*) FROM eleves e WHERE e.classe_id = fs.classe_id AND e.statut = 'actif') as nombre_eleves
        FROM frais_scolaires fs
        INNER JOIN classes c ON fs.classe_id = c.id
        INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
        WHERE 1=1
      `;
      
      const params: any[] = [];

      if (filtres.classe_id) {
        sql += ' AND fs.classe_id = ?';
        params.push(parseInt(filtres.classe_id));
      }

      if (filtres.annee_scolaire) {
        sql += ' AND fs.annee_scolaire = ?';
        params.push(filtres.annee_scolaire);
      }

      if (filtres.statut) {
        sql += ' AND fs.statut = ?';
        params.push(filtres.statut);
      }

      if (filtres.categorie_id) {
        sql += ' AND fs.categorie_frais_id = ?';
        params.push(parseInt(filtres.categorie_id));
      }

      sql += ' ORDER BY c.niveau, c.nom, cf.nom';

      console.log('📝 SQL Frais scolaires:', sql);
      console.log('📦 Paramètres:', params);

      const frais = await query(sql, params) as FraisScolaire[];
      
      console.log('✅ Frais scolaires récupérés:', frais.length);
      
      return { success: true, frais };
    } catch (error: any) {
      console.error('❌ Erreur récupération frais scolaires:', error);
      return { 
        success: false, 
        erreur: `Erreur base de données: ${error.message}` 
      };
    }
  }

  static async obtenirStatistiquesPaiements(filtres: any = {}): Promise<{success: boolean, statistiques?: StatistiquesPaiements, erreur?: string}> {
    try {
      // Base query pour les filtres
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];

      if (filtres.date_debut) {
        whereClause += ' AND p.date_paiement >= ?';
        params.push(filtres.date_debut);
      }

      if (filtres.date_fin) {
        whereClause += ' AND p.date_paiement <= ?';
        params.push(filtres.date_fin);
      }

      // Requêtes pour les statistiques
      const sqlTotalJour = `
        SELECT COALESCE(SUM(montant), 0) as total 
        FROM paiements_frais p 
        WHERE DATE(p.date_paiement) = CURDATE()
      `;

      const sqlTotalMois = `
        SELECT COALESCE(SUM(montant), 0) as total 
        FROM paiements_frais p 
        WHERE MONTH(p.date_paiement) = MONTH(CURDATE()) AND YEAR(p.date_paiement) = YEAR(CURDATE())
      `;

      const sqlTotalAnnee = `
        SELECT COALESCE(SUM(montant), 0) as total 
        FROM paiements_frais p 
        WHERE YEAR(p.date_paiement) = YEAR(CURDATE())
      `;

      const sqlTotalPeriode = `
        SELECT COALESCE(SUM(montant), 0) as total 
        FROM paiements_frais p 
        ${whereClause}
      `;

      const sqlRepartition = `
        SELECT 
          cf.nom as categorie,
          SUM(p.montant) as montant
        FROM paiements_frais p
        INNER JOIN frais_scolaires fs ON p.frais_scolaire_id = fs.id
        INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
        ${whereClause}
        GROUP BY cf.id, cf.nom
        ORDER BY montant DESC
      `;

      const sqlEvolution = `
        SELECT 
          DATE(p.date_paiement) as date,
          SUM(p.montant) as montant
        FROM paiements_frais p
        ${whereClause.replace('1=1', 'p.date_paiement >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)')}
        GROUP BY DATE(p.date_paiement)
        ORDER BY date ASC
      `;

      // Exécution des requêtes
      const [totalJourResult, totalMoisResult, totalAnneeResult, totalPeriodeResult, repartitionResult, evolutionResult] = await Promise.all([
        query(sqlTotalJour),
        query(sqlTotalMois),
        query(sqlTotalAnnee),
        query(sqlTotalPeriode, params),
        query(sqlRepartition, params),
        query(sqlEvolution, params)
      ]);

      const statistiques: StatistiquesPaiements = {
        total_jour: (totalJourResult as any[])[0]?.total || 0,
        total_mois: (totalMoisResult as any[])[0]?.total || 0,
        total_annee: (totalAnneeResult as any[])[0]?.total || 0,
        total_periode: (totalPeriodeResult as any[])[0]?.total || 0,
        nombre_paiements_jour: 0, // À calculer
        nombre_paiements_mois: 0, // À calculer
        moyenne_paiement: 0, // À calculer
        repartition_categories: (repartitionResult as any[]).map(r => ({
          categorie: r.categorie,
          montant: parseFloat(r.montant) || 0
        })),
        evolution_paiements: (evolutionResult as any[]).map(e => ({
          date: e.date,
          montant: parseFloat(e.montant) || 0
        }))
      };

      return { success: true, statistiques };
    } catch (error: any) {
      console.error('Erreur récupération statistiques paiements:', error);
      return { success: false, erreur: 'Erreur lors de la récupération des statistiques' };
    }
  }

  // Générer automatiquement l'année scolaire
  static genererAnneeScolaire(): string {
    const maintenant = new Date();
    const annee = maintenant.getFullYear();
    const mois = maintenant.getMonth() + 1;
    
    // Si on est après août, l'année scolaire commence cette année
    if (mois >= 8) {
      return `${annee}-${annee + 1}`;
    } else {
      return `${annee - 1}-${annee}`;
    }
  }

  // GÉNÉRER LES FRAIS POUR LES ÉLÈVES
  static async genererFraisPourEleves(fraisScolaireId: number): Promise<{success: boolean, message?: string, erreur?: string}> {
    try {
      // Récupérer le frais scolaire
      const fraisResult = await this.obtenirFraisScolaireParId(fraisScolaireId);
      if (!fraisResult.success || !fraisResult.frais) {
        return { success: false, erreur: 'Frais scolaire non trouvé' };
      }

      const frais = fraisResult.frais;

      // Récupérer les élèves de la classe
      const sqlEleves = `
        SELECT id FROM eleves 
        WHERE classe_id = ? AND statut = 'actif'
      `;
      const eleves = await query(sqlEleves, [frais.classe_id]) as any[];

      if (eleves.length === 0) {
        return { success: false, erreur: 'Aucun élève actif dans cette classe' };
      }

      // Calculer la date d'échéance selon la périodicité
      const dateEcheance = this.calculerDateEcheance(frais.periodicite);
      const dateEcheanceStr = dateEcheance.toISOString().split('T')[0];

      let fraisElevesCrees = 0;

      // Créer les frais pour chaque élève
      for (const eleve of eleves) {
        try {
          // Vérifier si le frais existe déjà
          const fraisExistant = await query(
            `SELECT id FROM frais_eleves 
             WHERE frais_scolaire_id = ? AND eleve_id = ? AND annee_scolaire = ?`,
            [fraisScolaireId, eleve.id, frais.annee_scolaire]
          ) as any[];

          if (fraisExistant.length === 0) {
            await query(
              `INSERT INTO frais_eleves (
                frais_scolaire_id, eleve_id, annee_scolaire, montant, montant_paye, 
                date_echeance, statut
              ) VALUES (?, ?, ?, ?, 0, ?, 'en_attente')`,
              [fraisScolaireId, eleve.id, frais.annee_scolaire, frais.montant, dateEcheanceStr]
            );
            fraisElevesCrees++;
          }
        } catch (error) {
          console.error(`Erreur création frais pour élève ${eleve.id}:`, error);
        }
      }

      return { 
        success: true, 
        message: `${fraisElevesCrees} frais générés pour les élèves de la classe` 
      };
    } catch (error: any) {
      console.error('Erreur génération frais élèves:', error);
      return { success: false, erreur: 'Erreur lors de la génération des frais' };
    }
  }

  // CALCULER DATE D'ÉCHÉANCE
  private static calculerDateEcheance(periodicite: string): Date {
    const aujourdhui = new Date();
    const dateEcheance = new Date(aujourdhui);

    switch (periodicite) {
      case 'mensuel':
        dateEcheance.setMonth(aujourdhui.getMonth() + 1);
        break;
      case 'trimestriel':
        dateEcheance.setMonth(aujourdhui.getMonth() + 3);
        break;
      case 'annuel':
        dateEcheance.setFullYear(aujourdhui.getFullYear() + 1);
        break;
      case 'unique':
      default:
        dateEcheance.setMonth(aujourdhui.getMonth() + 1);
        break;
    }

    return dateEcheance;
  }

  // ENREGISTRER UN PAIEMENT
  static async enregistrerPaiement(fraisEleveId: number, paiementData: any): Promise<{success: boolean, frais?: FraisEleve, erreur?: string}> {
    try {
      const fraisActuel = await this.obtenirFraisEleveParId(fraisEleveId);
      if (!fraisActuel.success || !fraisActuel.frais) {
        return { success: false, erreur: 'Frais non trouvé' };
      }

      const nouveauMontantPaye = (fraisActuel.frais.montant_paye || 0) + paiementData.montant;
      let nouveauStatut: 'partiel' | 'paye' | 'en_attente' | 'en_retard' = 'partiel';
      
      if (nouveauMontantPaye >= fraisActuel.frais.montant) {
        nouveauStatut = 'paye';
      } else if (nouveauMontantPaye > 0) {
        nouveauStatut = 'partiel';
      } else {
        nouveauStatut = 'en_attente';
      }

      // Vérifier si le frais est en retard
      const dateEcheance = new Date(fraisActuel.frais.date_echeance);
      const aujourdhui = new Date();
      if (nouveauStatut !== 'paye' && dateEcheance < aujourdhui) {
        nouveauStatut = 'en_retard';
      }

      const sql = `
        UPDATE frais_eleves 
        SET 
          montant_paye = ?,
          statut = ?,
          date_paiement = CASE WHEN ? = montant THEN COALESCE(?, CURDATE()) ELSE date_paiement END,
          mode_paiement = ?,
          reference_paiement = ?
        WHERE id = ?
      `;
      
      const params = [
        nouveauMontantPaye,
        nouveauStatut,
        nouveauMontantPaye,
        paiementData.date_paiement || new Date().toISOString().split('T')[0],
        paiementData.mode_paiement,
        paiementData.reference_paiement || null,
        fraisEleveId
      ];

      await query(sql, params);

      // Créer l'entrée de paiement
      await this.creerPaiement({
        frais_eleve_id: fraisEleveId,
        eleve_id: fraisActuel.frais.eleve_id,
        montant: paiementData.montant,
        date_paiement: paiementData.date_paiement || new Date().toISOString().split('T')[0],
        mode_paiement: paiementData.mode_paiement,
        reference_paiement: paiementData.reference_paiement,
        created_by: paiementData.created_by || 1
      });

      const fraisMisAJour = await this.obtenirFraisEleveParId(fraisEleveId);
      return fraisMisAJour;
    } catch (error: any) {
      console.error('Erreur enregistrement paiement:', error);
      return { success: false, erreur: 'Erreur lors de l\'enregistrement du paiement' };
    }
  }

static async obtenirPaiementParId(id: number): Promise<{success: boolean, paiement?: PaiementFrais, erreur?: string}> {
  try {
    console.log('🔍 Service - Récupération paiement par ID:', id);
    
    const sql = `
      SELECT 
        p.*,
        e.nom as eleve_nom,
        e.prenom as eleve_prenom,
        e.matricule as eleve_matricule,
        c.nom as classe_nom,
        c.niveau as classe_niveau,
        cf.nom as categorie_nom,
        fe.montant as montant_total
      FROM paiements_frais p
      INNER JOIN frais_eleves fe ON p.frais_eleve_id = fe.id
      INNER JOIN eleves e ON p.eleve_id = e.id
      INNER JOIN classes c ON e.classe_id = c.id
      INNER JOIN frais_scolaires fs ON fe.frais_scolaire_id = fs.id
      INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
      WHERE p.id = ?
    `;
    
    console.log('📝 SQL:', sql);
    
    const paiements = await query(sql, [id]) as PaiementFrais[];
    
    console.log('📦 Résultat query:', paiements.length, 'paiement(s) trouvé(s)');
    
    if (paiements.length === 0) {
      return { success: false, erreur: 'Paiement non trouvé' };
    }

    return { success: true, paiement: paiements[0] };
  } catch (error: any) {
    console.error('❌ Erreur récupération paiement par ID:', error);
    return { 
      success: false, 
      erreur: `Erreur lors de la récupération du paiement: ${error.message}` 
    };
  }
}

static async modifierPaiement(id: number, donnees: any): Promise<{success: boolean, paiement?: PaiementFrais, erreur?: string}> {
  try {
    console.log('✏️ Service - Modification paiement ID:', id);
    console.log('📦 Données:', donnees);
    
    const sql = `
      UPDATE paiements_frais 
      SET 
        montant = ?,
        date_paiement = ?,
        mode_paiement = ?,
        reference_paiement = ?,
        notes = ?,
        statut = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const params = [
      donnees.montant,
      donnees.date_paiement,
      donnees.mode_paiement,
      donnees.reference_paiement || null,
      donnees.notes || null,
      donnees.statut,
      id
    ];

    console.log('📝 SQL:', sql);
    console.log('📦 Paramètres:', params);

    const result = await query(sql, params) as any;
    console.log('✅ Résultat mise à jour:', result);

    // Récupérer le paiement mis à jour
    const paiementMisAJour = await this.obtenirPaiementParId(id);
    
    if (!paiementMisAJour.success) {
      return { success: false, erreur: 'Paiement modifié mais non retrouvé' };
    }

    return { success: true, paiement: paiementMisAJour.paiement };
  } catch (error: any) {
    console.error('❌ Erreur modification paiement:', error);
    return { 
      success: false, 
      erreur: `Erreur lors de la modification du paiement: ${error.message}` 
    };
  }
}

static async supprimerPaiement(id: number): Promise<{success: boolean, message?: string, erreur?: string}> {
  try {
    console.log('🗑️ Service - Suppression paiement ID:', id);
    
    // Vérifier d'abord si le paiement existe
    const paiementExiste = await this.obtenirPaiementParId(id);
    if (!paiementExiste.success) {
      return { success: false, erreur: 'Paiement non trouvé' };
    }

    // Vérifier si la table d'archivage existe, sinon la créer
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS paiement_frais_supp (
          id INT PRIMARY KEY,
          frais_eleve_id INT,
          eleve_id INT,
          montant DECIMAL(10,2),
          date_paiement DATE,
          mode_paiement VARCHAR(50),
          reference_paiement VARCHAR(100),
          statut VARCHAR(20),
          notes TEXT,
          created_by INT,
          created_at TIMESTAMP,
          updated_at TIMESTAMP,
          deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (error) {
      console.log('ℹ️ Table d\'archivage déjà existante');
    }

    // Soft delete - Archiver dans paiement_frais_supp
    const sqlArchiver = `
      INSERT INTO paiement_frais_supp 
      SELECT *, CURRENT_TIMESTAMP as deleted_at FROM paiements_frais WHERE id = ?
    `;
    
    console.log('📝 SQL Archivage:', sqlArchiver);
    
    const resultArchiver = await query(sqlArchiver, [id]) as any;
    console.log('✅ Résultat archivage:', resultArchiver);

    // Supprimer de la table principale
    const sqlSupprimer = 'DELETE FROM paiements_frais WHERE id = ?';
    console.log('📝 SQL Suppression:', sqlSupprimer);
    
    const resultSupprimer = await query(sqlSupprimer, [id]) as any;
    console.log('✅ Résultat suppression:', resultSupprimer);

    if (resultSupprimer.affectedRows === 0) {
      return { success: false, erreur: 'Paiement non trouvé pour suppression' };
    }

    return { success: true, message: 'Paiement archivé et supprimé avec succès' };
  } catch (error: any) {
    console.error('❌ Erreur suppression paiement:', error);
    return { 
      success: false, 
      erreur: `Erreur lors de la suppression du paiement: ${error.message}` 
    };
  }
}

  // MÉTHODES AUXILIAIRES MANQUANTES
  static async obtenirFraisEleveParId(id: number): Promise<{success: boolean, frais?: FraisEleve, erreur?: string}> {
    try {
      const sql = `
        SELECT 
          fe.*,
          e.nom as eleve_nom,
          e.prenom as eleve_prenom,
          e.matricule as eleve_matricule,
          c.nom as classe_nom,
          c.niveau as classe_niveau,
          cf.nom as categorie_nom
        FROM frais_eleves fe
        INNER JOIN eleves e ON fe.eleve_id = e.id
        INNER JOIN classes c ON e.classe_id = c.id
        INNER JOIN categories_frais cf ON fe.categorie_frais_id = cf.id
        WHERE fe.id = ?
      `;
      
      const frais = await query(sql, [id]) as FraisEleve[];
      
      if (frais.length === 0) {
        return { success: false, erreur: 'Frais non trouvé' };
      }

      return { success: true, frais: frais[0] };
    } catch (error: any) {
      console.error('Erreur récupération frais:', error);
      return { success: false, erreur: 'Erreur lors de la récupération du frais' };
    }
  }

// Méthode pour créer ou trouver un frais élève - VERSION CORRIGÉE
static async creerOuTrouverFraisEleve(fraisScolaireId: number, eleveId: number): Promise<{success: boolean, fraisEleveId?: number, erreur?: string}> {
  try {
    console.log('🔍 Recherche/Création frais élève:', { fraisScolaireId, eleveId });
    
    // Vérifier si le frais élève existe déjà
    const fraisExistant = await query(
      `SELECT id FROM frais_eleves 
       WHERE frais_scolaire_id = ? AND eleve_id = ?`,
      [fraisScolaireId, eleveId]
    ) as any[];

    console.log('📦 Frais existant trouvé:', fraisExistant);

    if (fraisExistant.length > 0) {
      return { success: true, fraisEleveId: fraisExistant[0].id };
    }

    // Créer un nouveau frais élève
    const fraisScolaire = await this.obtenirFraisScolaireParId(fraisScolaireId);
    if (!fraisScolaire.success || !fraisScolaire.frais) {
      console.error('❌ Frais scolaire non trouvé ID:', fraisScolaireId);
      return { success: false, erreur: 'Frais scolaire non trouvé' };
    }

    console.log('📦 Frais scolaire trouvé:', fraisScolaire.frais);

    const dateEcheance = this.calculerDateEcheance(fraisScolaire.frais.periodicite);
    const dateEcheanceStr = dateEcheance.toISOString().split('T')[0];

    console.log('📅 Date échéance calculée:', dateEcheanceStr);

    const result = await query(
      `INSERT INTO frais_eleves (
        frais_scolaire_id, eleve_id, annee_scolaire, montant, montant_paye, 
        date_echeance, statut
      ) VALUES (?, ?, ?, ?, 0, ?, 'en_attente')`,
      [fraisScolaireId, eleveId, fraisScolaire.frais.annee_scolaire, fraisScolaire.frais.montant, dateEcheanceStr]
    ) as any;

    console.log('✅ Frais élève créé, ID:', result.insertId);

    return { success: true, fraisEleveId: result.insertId };
  } catch (error: any) {
    console.error('❌ Erreur création frais élève:', error);
    return { 
      success: false, 
      erreur: `Erreur lors de la création du frais élève: ${error.message}` 
    };
  }
}

// Méthode pour générer un numéro de reçu consécutif
static async genererNumeroRecu(): Promise<{success: boolean, numero?: number, erreur?: string}> {
  try {
    const annee = new Date().getFullYear();
    
    // Vérifier si une séquence existe pour cette année
    const sqlVerif = 'SELECT id, dernier_numero FROM numero_recu_sequence WHERE annee = ?';
    const sequence = await query(sqlVerif, [annee]) as any[];
    
    let nouveauNumero: number;
    
    if (sequence.length === 0) {
      // Créer une nouvelle séquence pour cette année
      nouveauNumero = 1;
      const sqlInsert = 'INSERT INTO numero_recu_sequence (dernier_numero, annee) VALUES (?, ?)';
      await query(sqlInsert, [nouveauNumero, annee]);
    } else {
      // Incrémenter la séquence existante
      nouveauNumero = sequence[0].dernier_numero + 1;
      const sqlUpdate = 'UPDATE numero_recu_sequence SET dernier_numero = ? WHERE annee = ?';
      await query(sqlUpdate, [nouveauNumero, annee]);
    }
    
    return { success: true, numero: nouveauNumero };
  } catch (error: any) {
    console.error('❌ Erreur génération numéro reçu:', error);
    return { 
      success: false, 
      erreur: `Erreur lors de la génération du numéro de reçu: ${error.message}` 
    };
  }
}

// Méthode pour enregistrer un paiement direct
static async enregistrerPaiementDirect(fraisEleveId: number, paiementData: any): Promise<{success: boolean, paiement?: PaiementFrais, erreur?: string}> {
  try {
    console.log('💰 Enregistrement paiement direct:', { fraisEleveId, paiementData });

    // Générer un numéro de reçu
    const numeroRecuResult = await this.genererNumeroRecu();
    if (!numeroRecuResult.success) {
      return { success: false, erreur: numeroRecuResult.erreur };
    }

    // Vérifier d'abord que le frais élève existe
    const fraisEleveExiste = await query(
      'SELECT id, montant, montant_paye FROM frais_eleves WHERE id = ?',
      [fraisEleveId]
    ) as any[];

    if (fraisEleveExiste.length === 0) {
      console.error('❌ Frais élève non trouvé ID:', fraisEleveId);
      return { success: false, erreur: 'Frais élève non trouvé' };
    }

    const fraisEleve = fraisEleveExiste[0];
    console.log('✅ Frais élève trouvé:', fraisEleve);

    // Créer l'entrée de paiement AVEC LE STATUT
    const sqlPaiement = `
      INSERT INTO paiements_frais (
        frais_eleve_id, eleve_id, montant, date_paiement,
        mode_paiement, reference_paiement, statut, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const paramsPaiement = [
      fraisEleveId,
      paiementData.eleve_id,
      paiementData.montant,
      paiementData.date_paiement,
      paiementData.mode_paiement,
      paiementData.reference_paiement || null,
      paiementData.statut || 'paye',
      paiementData.created_by || 1
    ];

    console.log('📦 Paramètres paiement:', paramsPaiement);

    const resultPaiement = await query(sqlPaiement, paramsPaiement) as any;

    console.log('✅ Paiement créé, ID:', resultPaiement.insertId);

    // Mettre à jour le frais élève SEULEMENT si le statut est "paye"
    if (paiementData.statut === 'paye') {
      const montantActuel = parseFloat(fraisEleve.montant_paye) || 0;
      const nouveauMontantPaye = montantActuel + paiementData.montant;
      
      let nouveauStatutFrais: 'partiel' | 'paye' | 'en_attente' | 'en_retard' = 'partiel';
      
      if (nouveauMontantPaye >= fraisEleve.montant) {
        nouveauStatutFrais = 'paye';
      } else if (nouveauMontantPaye > 0) {
        nouveauStatutFrais = 'partiel';
      }

      console.log('🔄 Mise à jour frais élève:', { 
        ancienMontant: montantActuel, 
        nouveauMontant: nouveauMontantPaye, 
        statut: nouveauStatutFrais 
      });

      const sqlUpdateFrais = `
        UPDATE frais_eleves 
        SET 
          montant_paye = ?,
          statut = ?,
          date_paiement = CASE WHEN ? >= montant THEN ? ELSE date_paiement END
        WHERE id = ?
      `;
      
      await query(sqlUpdateFrais, [
        nouveauMontantPaye,
        nouveauStatutFrais,
        nouveauMontantPaye,
        paiementData.date_paiement,
        fraisEleveId
      ]);

      console.log('✅ Frais élève mis à jour');
    }

    // Récupérer le paiement créé avec les jointures CORRIGÉES
    const paiementCree = await query(`
      SELECT 
        p.*,
        e.nom as eleve_nom,
        e.prenom as eleve_prenom,
        e.matricule as eleve_matricule,
        c.nom as classe_nom,
        c.niveau as classe_niveau,
        cf.nom as categorie_nom,
        fe.montant as montant_total
      FROM paiements_frais p
      INNER JOIN frais_eleves fe ON p.frais_eleve_id = fe.id
      INNER JOIN eleves e ON p.eleve_id = e.id
      INNER JOIN classes c ON e.classe_id = c.id
      INNER JOIN frais_scolaires fs ON fe.frais_scolaire_id = fs.id
      INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
      WHERE p.id = ?
    `, [resultPaiement.insertId]) as PaiementFrais[];

    if (paiementCree.length === 0) {
      return { success: false, erreur: 'Paiement créé mais non retrouvé' };
    }

    // Ajouter le numéro de reçu généré à l'objet paiement
    const paiementAvecNumero = {
      ...paiementCree[0],
      numero_recu: numeroRecuResult.numero
    };

    return { 
      success: true, 
      paiement: paiementAvecNumero as any
    };

  } catch (error: any) {
    console.error('❌ Erreur enregistrement paiement direct:', error);
    return { 
      success: false, 
      erreur: `Erreur lors de l'enregistrement du paiement: ${error.message}` 
    };
  }

}

// Méthode pour valider un paiement
static async validerPaiement(paiementId: number, validationData: any): Promise<{success: boolean, paiement?: PaiementFrais, erreur?: string}> {
  try {
    console.log('✅ Validation paiement ID:', paiementId);

    // 1. Mettre à jour le statut du paiement
    const sqlUpdatePaiement = `
      UPDATE paiements_frais 
      SET statut = 'paye', date_paiement = ?
      WHERE id = ?
    `;
    
    await query(sqlUpdatePaiement, [
      validationData.date_paiement || new Date().toISOString().split('T')[0],
      paiementId
    ]);

    // 2. Récupérer les informations du paiement pour mettre à jour le frais élève
    const paiementInfo = await query(`
      SELECT p.frais_eleve_id, p.montant, fe.montant as montant_total, fe.montant_paye, fe.frais_scolaire_id
      FROM paiements_frais p
      INNER JOIN frais_eleves fe ON p.frais_eleve_id = fe.id
      WHERE p.id = ?
    `, [paiementId]) as any[];

    if (paiementInfo.length === 0) {
      return { success: false, erreur: 'Paiement non trouvé' };
    }

    const info = paiementInfo[0];

    // 3. Mettre à jour le frais élève
    const nouveauMontantPaye = parseFloat(info.montant_paye) + parseFloat(info.montant);
    let nouveauStatutFrais: 'partiel' | 'paye' | 'en_attente' | 'en_retard' = 'partiel';
    
    if (nouveauMontantPaye >= info.montant_total) {
      nouveauStatutFrais = 'paye';
    } else if (nouveauMontantPaye > 0) {
      nouveauStatutFrais = 'partiel';
    }

    const sqlUpdateFrais = `
      UPDATE frais_eleves 
      SET 
        montant_paye = ?,
        statut = ?,
        date_paiement = CASE WHEN ? >= montant THEN ? ELSE date_paiement END
      WHERE id = ?
    `;
    
    await query(sqlUpdateFrais, [
      nouveauMontantPaye,
      nouveauStatutFrais,
      nouveauMontantPaye,
      validationData.date_paiement || new Date().toISOString().split('T')[0],
      info.frais_eleve_id
    ]);

    // 4. Récupérer le paiement mis à jour avec les jointures CORRIGÉES
    const paiementValide = await query(`
      SELECT 
        p.*,
        e.nom as eleve_nom,
        e.prenom as eleve_prenom,
        e.matricule as eleve_matricule,
        c.nom as classe_nom,
        c.niveau as classe_niveau,
        cf.nom as categorie_nom,
        fe.montant as montant_total
      FROM paiements_frais p
      INNER JOIN frais_eleves fe ON p.frais_eleve_id = fe.id
      INNER JOIN eleves e ON p.eleve_id = e.id
      INNER JOIN classes c ON e.classe_id = c.id
      INNER JOIN frais_scolaires fs ON fe.frais_scolaire_id = fs.id
      INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
      WHERE p.id = ?
    `, [paiementId]) as PaiementFrais[];

    if (paiementValide.length === 0) {
      return { success: false, erreur: 'Paiement validé mais non retrouvé' };
    }

    console.log('✅ Paiement validé avec succès');

    return { 
      success: true, 
      paiement: paiementValide[0]
    };

  } catch (error: any) {
    console.error('❌ Erreur validation paiement:', error);
    return { 
      success: false, 
      erreur: `Erreur lors de la validation du paiement: ${error.message}` 
    };
  }
}

  static async creerPaiement(paiementData: any): Promise<{success: boolean, paiement?: PaiementFrais, erreur?: string}> {
    try {
      const sql = `
        INSERT INTO paiements_frais (
          frais_eleve_id, eleve_id, montant, date_paiement,
          mode_paiement, reference_paiement, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        paiementData.frais_eleve_id,
        paiementData.eleve_id,
        paiementData.montant,
        paiementData.date_paiement,
        paiementData.mode_paiement,
        paiementData.reference_paiement || null,
        paiementData.created_by
      ];

      const result = await query(sql, params) as any;
      return { success: true, paiement: { id: result.insertId, ...paiementData } };
    } catch (error: any) {
      console.error('Erreur création paiement:', error);
      return { success: false, erreur: 'Erreur lors de la création du paiement' };
    }
  }
}