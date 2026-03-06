
// app/types/finance.ts
export interface Paiement {
  id: number;
  frais_eleve_id: number;
  eleve_id: number;
  eleve_nom?: string;
  eleve_prenom?: string;
  eleve_matricule?: string;
  classe_nom?: string;
  classe_niveau?: string;
  categorie_nom?: string;
  montant: number;
  montant_paye?: number;
  montant_total?: number;
  reste_a_payer?: number;
  mode_paiement: string;
  date_paiement: string;
  reference_paiement?: string;
  numero_recu?: string;
  numero_versement?: number;
  created_by?: number;
  annee_scolaire?: string;
  statut?: string;
  [key: string]: any;
}