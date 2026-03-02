import { NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

// Interfaces pour typer les résultats
interface ClasseStat {
  classe: string;
  montant: number;
  nombre_paiements: number;
}

interface CategorieStat {
  categorie: string;
  montant: number;
}

interface EvolutionStat {
  mois: string;
  montant: number;
}

interface RetardStat {
  eleve: string;
  classe: string;
  montant: number;
  jours_retard: number;
}

interface CategorieStatAvecPourcentage {
  categorie: string;
  montant: number;
  pourcentage: number;
}

export async function GET() {
  try {
    // Statistiques par classe
    const statsClasses = await query(`
      SELECT 
        c.nom as classe,
        SUM(p.montant) as montant,
        COUNT(p.id) as nombre_paiements
      FROM paiements_frais p
      INNER JOIN eleves e ON p.eleve_id = e.id
      INNER JOIN classes c ON e.classe_id = c.id
      WHERE p.statut = 'paye'
      GROUP BY c.id, c.nom
      ORDER BY montant DESC
    `) as ClasseStat[];

    // Statistiques par catégorie
    const statsCategories = await query(`
      SELECT 
        cf.nom as categorie,
        SUM(p.montant) as montant
      FROM paiements_frais p
      INNER JOIN frais_scolaires fs ON p.frais_scolaire_id = fs.id
      INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
      WHERE p.statut = 'paye'
      GROUP BY cf.id, cf.nom
      ORDER BY montant DESC
    `) as CategorieStat[];

    // Évolution mensuelle
    const evolution = await query(`
      SELECT 
        DATE_FORMAT(p.date_paiement, '%Y-%m') as mois,
        SUM(p.montant) as montant
      FROM paiements_frais p
      WHERE p.statut = 'paye' 
        AND p.date_paiement >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(p.date_paiement, '%Y-%m')
      ORDER BY mois ASC
    `) as EvolutionStat[];

    // Paiements en retard
    const retards = await query(`
      SELECT 
        CONCAT(e.prenom, ' ', e.nom) as eleve,
        c.nom as classe,
        fe.montant - fe.montant_paye as montant,
        DATEDIFF(CURDATE(), fe.date_echeance) as jours_retard
      FROM frais_eleves fe
      INNER JOIN eleves e ON fe.eleve_id = e.id
      INNER JOIN classes c ON e.classe_id = c.id
      WHERE fe.statut = 'en_retard'
        AND fe.montant_paye < fe.montant
      ORDER BY jours_retard DESC
    `) as RetardStat[];

    // ✅ CORRECTION : Gestion sécurisée du map
    const categoriesAvecPourcentage: CategorieStatAvecPourcentage[] = Array.isArray(statsCategories) 
      ? statsCategories.map((cat: CategorieStat) => ({
          ...cat,
          pourcentage: 0 // Calculé côté client
        }))
      : [];

    const statistiques = {
      total_par_classe: Array.isArray(statsClasses) ? statsClasses : [],
      total_par_categorie: categoriesAvecPourcentage,
      evolution_annuelle: Array.isArray(evolution) ? evolution : [],
      paiements_en_retard: Array.isArray(retards) ? retards : []
    };

    return NextResponse.json({ success: true, statistiques });
  } catch (error: any) {
    console.error('Erreur statistiques avancées:', error);
    return NextResponse.json({ success: false, erreur: error.message });
  }
}