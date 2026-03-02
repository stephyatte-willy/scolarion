'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react'; 
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ExportService } from '@/app/services/exportService';
import { PrintComponent, PrintComponentRef } from '@/app/components/PrintComponent';
import { PrintGraphiquesVisual } from '@/app/components/PrintGraphiquesVisual';

// ==================== INTERFACES ====================

interface ParametresEcole {
  id: number;
  nom_ecole: string;
  slogan: string;
  adresse: string;
  telephone: string;
  email: string;
  logo_url: string | null;
  couleur_principale: string;
  annee_scolaire: string;
}

interface ParametresApp {
  id: number;
  devise: string;
  symbole_devise: string;
  format_date: string;
  fuseau_horaire: string;
  langue_defaut: string;
  theme_defaut: string;
}

interface Budget {
  id: number;
  annee_scolaire: string;
  categorie: string;
  montant_alloue: number;
  montant_depense: number;
  pourcentage_utilisation: number;
  statut: 'dans_les_normes' | 'en_alerte' | 'depasse';
  description?: string;
  created_at: string;
  updated_at: string;
}

interface Depense {
  id: number;
  budget_id: number;
  budget_categorie: string;
  type_depense: string;
  sous_categorie?: string;
  description: string;
  montant: number;
  date_depense: string;
  mode_paiement: 'especes' | 'cheque' | 'virement' | 'carte' | 'mobile' | 'autre';
  numero_facture?: string;
  beneficiaire: string;
  reference?: string;
  statut: 'valide' | 'en_attente' | 'annule';
  notes?: string;
  justificatif_url?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

interface BudgetFormData {
  annee_scolaire: string;
  categorie: string;
  montant_alloue: number;
  description: string;
}

interface DepenseFormData {
  budget_id: number;
  type_depense: string;
  sous_categorie: string;
  description: string;
  montant: number;
  date_depense: string;
  mode_paiement: 'especes' | 'cheque' | 'virement' | 'carte' | 'mobile' | 'autre';
  numero_facture: string;
  beneficiaire: string;
  reference: string;
  statut: 'valide' | 'en_attente' | 'annule'; 
  notes: string;
}

interface FiltresDepenses {
  date_debut: string;
  date_fin: string;
  budget_id: string;
  type_depense: string;
  mode_paiement: string;
  statut: string;
  beneficiaire: string;
  montant_min: string;
  montant_max: string;
}

interface StatistiquesBudget {
  totalBudgets: number;
  totalAlloue: number;
  totalDepense: number;
  pourcentageUtilisation: number;
  budgetsDepasses: number;
  budgetsEnAlerte: number;
  depensesParMois: Array<{mois: string, montant: number}>;
  depensesParCategorie: Array<{categorie: string, montant: number, pourcentage: number}>;
  depensesParType: Array<{type: string, montant: number}>;
  evolutionBudgets: Array<{mois: string, alloue: number, depense: number}>;
}

// ==================== INTERFACES DES PROPS ====================

interface GestionBudgetProps {
  formaterMontant?: (montant: number) => string;
  formaterDate?: (date: Date | string) => string;
  deviseSymbole?: string;
}

interface ModalBudgetProps {
  mode: 'creation' | 'modification';
  formBudget: BudgetFormData;
  setFormBudget: (data: BudgetFormData) => void;
  categoriesBudget: Array<{value: string, label: string, couleur: string}>;
  anneeSelectionnee: string;
  chargement: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onClose: () => void;
  budgetSelectionne?: Budget | null;
  formaterMontant: (montant: number) => string;
  parametresEcole?: ParametresEcole | null;
}

interface ModalDetailsBudgetProps {
  budget: Budget;
  depenses: Depense[];
  onClose: () => void;
  formaterMontant: (montant: number) => string;
  formaterDate: (date: string) => string;
  getLabelCategorie: (valeur: string) => string;
  getLabelTypeDepense: (valeur: string) => string;
  getLabelStatutDepense: (valeur: string) => string;
  getCouleurStatutDepense: (valeur: string) => string;
}

interface ModalDetailsDepenseProps {
  depense: Depense;
  onClose: () => void;
  formaterMontant: (montant: number) => string;
  formaterDate: (date: string) => string;
  getLabelCategorie: (valeur: string) => string;
  getLabelTypeDepense: (valeur: string) => string;
  getLabelModePaiement: (valeur: string) => string;
  getLabelStatutDepense: (valeur: string) => string;
  getCouleurStatutDepense: (valeur: string) => string;
  typesDepense: Array<{value: string, label: string}>;
  modesPaiement: Array<{value: string, label: string}>;
}

interface ModalConfirmationProps {
  type: 'budget' | 'depense';
  onConfirm: () => void;
  onCancel: () => void;
  message?: string;
  itemNom?: string;
}

interface ModalDepenseProps {
  mode: 'creation' | 'modification';
  formDepense: DepenseFormData;
  setFormDepense: (data: DepenseFormData) => void;
  budgets: Budget[];
  categoriesBudget: Array<{value: string, label: string, couleur: string}>;
  typesDepense: Array<{value: string, label: string}>;
  sousCategoriesParType: Record<string, Array<{value: string, label: string}>>;
  modesPaiement: Array<{value: string, label: string}>;
  statutsDepense: Array<{value: string, label: string, couleur: string}>;
  chargement: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onClose: () => void;
  budgetPourDepense?: Budget | null;
  depenseSelectionnee?: Depense | null;
  formaterMontant: (montant: number) => string;
  getLabelCategorie: (valeur: string) => string;
}

// ==================== COMPOSANTS MODALES ====================

const ModalBudget: React.FC<ModalBudgetProps> = ({
  mode,
  formBudget,
  setFormBudget,
  categoriesBudget,
  anneeSelectionnee,
  chargement,
  onSubmit,
  onClose,
  budgetSelectionne,
  formaterMontant,
  parametresEcole
}) => {
  const titre = mode === 'creation' ? 'Nouveau Budget' : 'Modifier le Budget';

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="modal-modern" style={{
        background: 'white',
        borderRadius: '10px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div className="modal-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <h3 style={{ margin: 0, color: '#334155' }}>{titre}</h3>
          <button className="modal-close-button" onClick={onClose} style={{
            background: 'none',
            border: 'none',
            fontSize: '26px',
            cursor: 'pointer',
            color: '#64748b'
          }}>×</button>
        </div>
        <div className="modal-content" style={{ padding: '20px' }}>
          <form onSubmit={onSubmit}>
            <div className="grille-formulaire-modern" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px'
            }}>
              <div className="groupe-champ-modern" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Année scolaire *</label>
                <input 
                  type="text"
                  required
                  value={formBudget.annee_scolaire || anneeSelectionnee}
                  onChange={(e) => setFormBudget({...formBudget, annee_scolaire: e.target.value})}
                  readOnly={mode === 'modification'}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              
              <div className="groupe-champ-modern" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Catégorie *</label>
                <select 
                  required
                  value={formBudget.categorie}
                  onChange={(e) => setFormBudget({...formBudget, categorie: e.target.value})}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categoriesBudget.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="groupe-champ-modern" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Montant alloué *</label>
                <input 
                  type="number"
                  required
                  min="0"
                  step="1000"
                  value={formBudget.montant_alloue}
                  onChange={(e) => setFormBudget({...formBudget, montant_alloue: parseFloat(e.target.value) || 0})}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                />
                {formBudget.montant_alloue > 0 && (
                  <small style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {formaterMontant(formBudget.montant_alloue)}
                  </small>
                )}
              </div>
              
              <div className="groupe-champ-modern plein-largeur" style={{ 
                gridColumn: '1 / -1',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Description (optionnel)</label>
                <textarea 
                  value={formBudget.description}
                  onChange={(e) => setFormBudget({...formBudget, description: e.target.value})}
                  placeholder="Description du budget..."
                  rows={3}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
            
            <div className="actions-modal-modern" style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '30px',
              paddingTop: '20px',
              borderTop: '1px solid #e2e8f0'
            }}>
              <button type="button" className="bouton-secondaire-modern" onClick={onClose} style={{
                background: '#64748b',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500'
              }}>
                Annuler
              </button>
              <button type="submit" className="bouton-primaire-modern" disabled={chargement} style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                opacity: chargement ? 0.6 : 1
              }}>
                {chargement ? (mode === 'creation' ? 'Création...' : 'Modification...') : (mode === 'creation' ? 'Créer le budget' : 'Modifier le budget')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const ModalDepense: React.FC<ModalDepenseProps> = ({
  mode,
  formDepense,
  setFormDepense,
  budgets,
  categoriesBudget,
  typesDepense,
  sousCategoriesParType,
  modesPaiement,
  statutsDepense,
  chargement,
  onSubmit,
  onClose,
  budgetPourDepense,
  depenseSelectionnee,
  formaterMontant,
  getLabelCategorie
}) => {
  const titre = mode === 'creation' ? 'Nouvelle Dépense' : 'Modifier la Dépense';

  const [beneficiaires, setBeneficiaires] = useState<Array<{value: string, label: string}>>([]);
  const [chargementBeneficiaires, setChargementBeneficiaires] = useState(false);
  const [referenceGeneree, setReferenceGeneree] = useState(false);
  
  // Trouver le budget sélectionné
  const budgetSelectionne = budgets.find(b => b.id === formDepense.budget_id);
  
  const mappingBudgetTypesDepense: Record<string, string[]> = {
    'personnel': ['salaires', 'honoraires', 'formation', 'assurances', 'frais_deplacement'],
    'administratif': ['salaires', 'honoraires', 'fournitures_bureau', 'telecom', 'frais_bancaires'],
    'fonctionnement': ['loyer', 'electricite', 'eau', 'telecom', 'maintenance_equipement', 'assurances', 'divers'],
    'pedagogique': ['materiel_scolaire', 'fournitures_bureau', 'formation', 'divers'],
    'electricité': ['electricite'],
    'eau': ['eau'],
    'maintenance': ['maintenance_equipement', 'fournitures_bureau', 'divers'],
    'fournitures': ['materiel_scolaire', 'fournitures_bureau'],
    'equipement': ['materiel_scolaire', 'maintenance_equipement'],
    'restauration': ['divers'],
    'transport': ['frais_deplacement'],
    'activites': ['divers', 'formation'],
    'formation': ['formation', 'honoraires'],
    'publicite': ['publicite_marketing'],
    'frais_financiers': ['frais_bancaires', 'impots_taxes'],
    'impots_taxes': ['impots_taxes'],
    'divers': ['salaires', 'honoraires', 'loyer', 'electricite', 'eau', 'telecom', 'fournitures_bureau', 
               'materiel_scolaire', 'maintenance_equipement', 'frais_deplacement', 'publicite_marketing',
               'formation', 'assurances', 'frais_bancaires', 'impots_taxes', 'divers']
  };

  const mappingBudgetBeneficiaires: Record<string, string> = {
    'personnel': 'employes',
    'fonctionnement': 'fournisseurs',
    'pedagogique': 'fournisseurs',
    'equipement': 'fournisseurs',
    'fournitures': 'fournisseurs',
  };

  const genererReference = () => {
    if (!budgetSelectionne || !formDepense.type_depense) {
      return '';
    }

    const maintenant = new Date();
    const jour = maintenant.getDate().toString().padStart(2, '0');
    const mois = (maintenant.getMonth() + 1).toString().padStart(2, '0');
    const annee = maintenant.getFullYear().toString().slice(-2);
    
    const codesBudget: Record<string, string> = {
      'personnel': 'PR',
      'fonctionnement': 'FN',
      'pedagogique': 'PD',
      'electricité': 'EL',
      'eau': 'EA',
      'maintenance': 'MT',
      'fournitures': 'FR',
      'equipement': 'EQ',
      'restauration': 'RS',
      'transport': 'TR',
      'activites': 'AC',
      'formation': 'FM',
      'publicite': 'PB',
      'frais_financiers': 'FF',
      'impots_taxes': 'IT',
      'divers': 'DV'
    };
    
    const codesDepense: Record<string, string> = {
      'salaires': 'SL',
      'honoraires': 'HR',
      'loyer': 'LR',
      'electricite': 'EL',
      'eau': 'EA',
      'telecom': 'TC',
      'fournitures_bureau': 'FB',
      'materiel_scolaire': 'MS',
      'maintenance_equipement': 'ME',
      'frais_deplacement': 'FD',
      'publicite_marketing': 'PM',
      'formation': 'FR',
      'assurances': 'AS',
      'frais_bancaires': 'FB',
      'impots_taxes': 'IT',
      'divers': 'DV'
    };
    
    const codeBudget = codesBudget[budgetSelectionne.categorie] || 'XX';
    const codeDepense = codesDepense[formDepense.type_depense] || 'XX';
    const numeroSeq = Math.floor(1000 + Math.random() * 9000);
    
    const reference = `${codeBudget}${codeDepense}${jour}${mois}${annee}${numeroSeq}`;
    return reference.slice(0, 15).toUpperCase();
  };

  useEffect(() => {
    if (mode === 'creation' && 
        !referenceGeneree && 
        budgetSelectionne && 
        formDepense.type_depense && 
        !formDepense.reference) {
      
      const nouvelleReference = genererReference();
      if (nouvelleReference) {
        setFormDepense({
          ...formDepense,
          reference: nouvelleReference
        });
        setReferenceGeneree(true);
      }
    }
  }, [mode, budgetSelectionne, formDepense.type_depense, formDepense.reference, referenceGeneree, setFormDepense, genererReference]);

  useEffect(() => {
    if (mode === 'creation') {
      setReferenceGeneree(false);
    }
  }, [budgetSelectionne?.id, formDepense.type_depense, mode]);

  useEffect(() => {
    const chargerBeneficiaires = async () => {
      if (!budgetSelectionne) {
        setBeneficiaires([]);
        return;
      }

      const typeBeneficiaire = mappingBudgetBeneficiaires[budgetSelectionne.categorie];
      
      if (!typeBeneficiaire) {
        setBeneficiaires([]);
        return;
      }

      setChargementBeneficiaires(true);
      
      try {
        if (typeBeneficiaire === 'employes') {
          const response = await fetch('/api/enseignants?statut=actif');
          const data = await response.json();
          
          if (data.success && data.enseignants) {
            const employesFormates = data.enseignants.map((employe: any) => ({
              value: `${employe.nom} ${employe.prenom}`,
              label: `${employe.prenom} ${employe.nom} ${employe.matricule ? `(${employe.matricule})` : ''}`
            }));
            
            const options = [
              { value: '', label: 'Sélectionner un employé' },
              ...employesFormates,
              { value: 'autre', label: 'Autre bénéficiaire...' }
            ];
            
            setBeneficiaires(options);
            
            if (formDepense.beneficiaire && !employesFormates.some((e: any) => e.value === formDepense.beneficiaire)) {
              setFormDepense({...formDepense, beneficiaire: ''});
            }
          }
        } else if (typeBeneficiaire === 'fournisseurs') {
          const fournisseurs = [
            { value: '', label: 'Sélectionner un fournisseur' },
            { value: 'fournisseur1', label: 'Fournisseur de matériel scolaire' },
            { value: 'fournisseur2', label: 'Fournisseur de bureau' },
            { value: 'fournisseur3', label: 'Fournisseur informatique' },
            { value: 'autre', label: 'Autre bénéficiaire...' }
          ];
          
          setBeneficiaires(fournisseurs);
        }
      } catch (error) {
        console.error('Erreur chargement bénéficiaires:', error);
        setBeneficiaires([]);
      } finally {
        setChargementBeneficiaires(false);
      }
    };

    chargerBeneficiaires();
  }, [budgetSelectionne, formDepense.beneficiaire, setFormDepense, mappingBudgetBeneficiaires]);

  const handleChangementBeneficiaire = (valeur: string) => {
    setFormDepense({...formDepense, beneficiaire: valeur});
  };

  const handleRegenererReference = () => {
    if (budgetSelectionne && formDepense.type_depense) {
      const nouvelleReference = genererReference();
      if (nouvelleReference) {
        setFormDepense({
          ...formDepense,
          reference: nouvelleReference
        });
        setReferenceGeneree(true);
      }
    }
  };
  
  const afficherSelectBeneficiaire = budgetSelectionne && 
    mappingBudgetBeneficiaires[budgetSelectionne.categorie] && 
    beneficiaires.length > 0;

  const typesDepenseFiltres = useMemo(() => {
    if (!budgetSelectionne) {
      return typesDepense;
    }
    
    const categoriesBudgetSelectionne = budgetSelectionne.categorie;
    const typesAutorises = mappingBudgetTypesDepense[categoriesBudgetSelectionne] || [];
    
    if (typesAutorises.length === 0) {
      return typesDepense;
    }
    
    return typesDepense.filter(type => typesAutorises.includes(type.value));
  }, [budgetSelectionne, typesDepense, mappingBudgetTypesDepense]);
  
  const sousCategories = sousCategoriesParType[formDepense.type_depense] || [];

  const handleChangementBudget = (budgetId: number) => {
    setFormDepense({
      ...formDepense,
      budget_id: budgetId,
      type_depense: '',
      sous_categorie: ''
    });
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="modal-modern large" style={{
        background: 'white',
        borderRadius: '10px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div className="modal-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <h3 style={{ margin: 0, color: '#334155' }}>{titre}</h3>
          <button className="modal-close-button" onClick={onClose} style={{
            background: 'none',
            border: 'none',
            fontSize: '26px',
            cursor: 'pointer',
            color: '#64748b'
          }}>×</button>
        </div>
        <div className="modal-content" style={{ padding: '20px' }}>
          {budgetPourDepense && mode === 'creation' && (
            <div className="info-budget-actuel" style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '20px'
            }}>
              <div className="stats-budget" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '10px',
                fontSize: '0.875rem'
              }}>
                <span><strong>Budget:</strong> {getLabelCategorie(budgetPourDepense.categorie)}</span>
                <span><strong>Alloué:</strong> {formaterMontant(budgetPourDepense.montant_alloue)}</span>
                <span><strong>Déjà dépensé:</strong> {formaterMontant(budgetPourDepense.montant_depense)}</span>
                <span><strong>Reste:</strong> {formaterMontant(budgetPourDepense.montant_alloue - budgetPourDepense.montant_depense)}</span>
              </div>
            </div>
          )}
          
          <form onSubmit={onSubmit}>
            <div className="grille-formulaire-modern" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px'
            }}>
              <div className="groupe-champ-modern" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Budget *</label>
                <select 
                  required
                  value={formDepense.budget_id}
                  onChange={(e) => handleChangementBudget(parseInt(e.target.value))}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="">Sélectionner un budget</option>
                  {budgets.map(budget => (
                    <option key={budget.id} value={budget.id}>
                      {getLabelCategorie(budget.categorie)} ({formaterMontant(budget.montant_alloue - budget.montant_depense)} disponible)
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="groupe-champ-modern" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Type de dépense *</label>
                <select 
                  required
                  value={formDepense.type_depense}
                  onChange={(e) => setFormDepense({...formDepense, type_depense: e.target.value, sous_categorie: ''})}
                  disabled={!formDepense.budget_id}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    backgroundColor: !formDepense.budget_id ? '#f8fafc' : 'white'
                  }}
                >
                  <option value="">
                    {!formDepense.budget_id ? 'Sélectionnez d\'abord un budget' : 'Sélectionner un type'}
                  </option>
                  {typesDepenseFiltres.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                
                {budgetSelectionne && (
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#64748b',
                    marginTop: '4px',
                    fontStyle: 'italic'
                  }}>
                    {typesDepenseFiltres.length} type(s) disponible(s) pour ce budget
                  </div>
                )}
              </div>
              
              {sousCategories.length > 0 && (
                <div className="groupe-champ-modern" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Sous-catégorie</label>
                  <select 
                    value={formDepense.sous_categorie}
                    onChange={(e) => setFormDepense({...formDepense, sous_categorie: e.target.value})}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">Sélectionner une sous-catégorie</option>
                    {sousCategories.map(sc => (
                      <option key={sc.value} value={sc.value}>{sc.label}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="groupe-champ-modern plein-largeur" style={{ 
                gridColumn: '1 / -1',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Description *</label>
                <input 
                  type="text"
                  required
                  value={formDepense.description}
                  onChange={(e) => setFormDepense({...formDepense, description: e.target.value})}
                  placeholder="Description de la dépense..."
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              
              <div className="groupe-champ-modern" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Montant *</label>
                <input 
                  type="number"
                  required
                  min="0"
                  step="100"
                  value={formDepense.montant}
                  onChange={(e) => setFormDepense({...formDepense, montant: parseFloat(e.target.value) || 0})}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                />
                {formDepense.montant > 0 && (
                  <small style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {formaterMontant(formDepense.montant)}
                  </small>
                )}
              </div>
              
              <div className="groupe-champ-modern" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Date de la dépense *</label>
                <input 
                  type="date"
                  required
                  value={formDepense.date_depense}
                  onChange={(e) => setFormDepense({...formDepense, date_depense: e.target.value})}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              
              <div className="groupe-champ-modern" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Mode de paiement *</label>
                <select 
                  required
                  value={formDepense.mode_paiement}
                  onChange={(e) => setFormDepense({...formDepense, mode_paiement: e.target.value as any})}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                >
                  {modesPaiement.map(mode => (
                    <option key={mode.value} value={mode.value}>{mode.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="groupe-champ-modern" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Numéro de facture</label>
                <input 
                  type="text"
                  value={formDepense.numero_facture}
                  onChange={(e) => setFormDepense({...formDepense, numero_facture: e.target.value})}
                  placeholder="N° de facture..."
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              
              <div className="groupe-champ-modern" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>
                  Bénéficiaire *
                  {budgetSelectionne && mappingBudgetBeneficiaires[budgetSelectionne.categorie] === 'employes' && (
                    <span style={{ fontSize: '0.75rem', color: '#3b82f6', marginLeft: '5px' }}>
                      (Liste des employés)
                    </span>
                  )}
                </label>

                {afficherSelectBeneficiaire ? (
                  <select 
                    required
                    value={formDepense.beneficiaire}
                    onChange={(e) => handleChangementBeneficiaire(e.target.value)}
                    disabled={chargementBeneficiaires}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      backgroundColor: chargementBeneficiaires ? '#f8fafc' : 'white'
                    }}
                  >
                    {chargementBeneficiaires ? (
                      <option value="">Chargement des bénéficiaires...</option>
                    ) : (
                      beneficiaires.map((benef) => (
                        <option key={benef.value} value={benef.value}>
                          {benef.label}
                        </option>
                      ))
                    )}
                  </select>
                ) : (
                  <input 
                    type="text"
                    required
                    value={formDepense.beneficiaire}
                    onChange={(e) => setFormDepense({...formDepense, beneficiaire: e.target.value})}
                    placeholder="Nom du bénéficiaire..."
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  />
                )}
              </div>
              
              <div className="groupe-champ-modern" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Référence</label>
                  <button
                    type="button"
                    onClick={handleRegenererReference}
                    disabled={!budgetSelectionne || !formDepense.type_depense}
                    style={{
                      padding: '4px 8px',
                      background: '#f3f4f6',
                      color: '#4b5563',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      cursor: budgetSelectionne && formDepense.type_depense ? 'pointer' : 'not-allowed',
                      opacity: budgetSelectionne && formDepense.type_depense ? 1 : 0.5
                    }}
                    title="Générer une nouvelle référence"
                  >
                    🔄 Regénérer
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text"
                    value={formDepense.reference}
                    onChange={(e) => setFormDepense({...formDepense, reference: e.target.value})}
                    placeholder="La référence sera générée automatiquement..."
                    maxLength={15}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      width: '100%'
                    }}
                  />
                  {formDepense.reference && (
                    <div style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#10b981',
                      fontSize: '12px'
                    }}>
                      ✓
                    </div>
                  )}
                </div>
                
                {formDepense.reference && mode === 'creation' && (
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    marginTop: '4px',
                    padding: '6px',
                    background: '#f9fafb',
                    borderRadius: '4px',
                    borderLeft: '3px solid #3b82f6'
                  }}>
                    <div style={{ fontWeight: '500', marginBottom: '2px' }}>
                      Format de référence : <code style={{ color: '#ef4444' }}>{formDepense.reference}</code>
                    </div>
                    {budgetSelectionne && formDepense.type_depense && (
                      <div style={{ fontSize: '0.7rem' }}>
                        <span style={{ color: '#3b82f6' }}>{budgetSelectionne.categorie.toUpperCase()}</span> - 
                        <span style={{ color: '#10b981' }}> {formDepense.type_depense}</span> - 
                        <span style={{ color: '#f59e0b' }}> {new Date().toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {!budgetSelectionne && (
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#ef4444',
                    marginTop: '4px',
                    fontStyle: 'italic'
                  }}>
                    Sélectionnez d'abord un budget pour générer une référence
                  </div>
                )}
                
                {budgetSelectionne && !formDepense.type_depense && (
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#ef4444',
                    marginTop: '4px',
                    fontStyle: 'italic'
                  }}>
                    Sélectionnez un type de dépense pour générer une référence
                  </div>
                )}
              </div>
              
              <div className="groupe-champ-modern" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Statut *</label>
                <select 
                  required
                  value={formDepense.statut}
                  onChange={(e) => setFormDepense({...formDepense, statut: e.target.value as any})}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                >
                  {statutsDepense.map(statut => (
                    <option key={statut.value} value={statut.value}>{statut.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="groupe-champ-modern plein-largeur" style={{ 
                gridColumn: '1 / -1',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Notes (optionnel)</label>
                <textarea 
                  value={formDepense.notes}
                  onChange={(e) => setFormDepense({...formDepense, notes: e.target.value})}
                  placeholder="Notes additionnelles..."
                  rows={3}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
            
            {budgetSelectionne && (
              <div style={{
                marginTop: '20px',
                padding: '12px',
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '6px',
                fontSize: '0.875rem',
                color: '#0c4a6e'
              }}>
                {mappingBudgetBeneficiaires[budgetSelectionne.categorie] === 'employes' 
                  ? 'Sélectionnez un employé de l\'établissement' 
                  : mappingBudgetBeneficiaires[budgetSelectionne.categorie] === 'fournisseurs'
                  ? 'Sélectionnez un fournisseur habituel'
                  : 'Saisissez le nom du bénéficiaire'}
              </div>
            )}
            
            <div className="actions-modal-modern" style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '30px',
              paddingTop: '20px',
              borderTop: '1px solid #e2e8f0'
            }}>
              <button type="button" className="bouton-secondaire-modern" onClick={onClose} style={{
                background: '#64748b',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500'
              }}>
                Annuler
              </button>
              <button type="submit" className="bouton-primaire-modern" disabled={chargement} style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                opacity: chargement ? 0.6 : 1
              }}>
                {chargement ? (mode === 'creation' ? 'Enregistrement...' : 'Modification...') : (mode === 'creation' ? 'Enregistrer la dépense' : 'Modifier la dépense')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const ModalDetailsBudget: React.FC<ModalDetailsBudgetProps> = ({
  budget,
  depenses,
  onClose,
  formaterMontant,
  formaterDate,
  getLabelCategorie,
  getLabelTypeDepense,
  getLabelStatutDepense,
  getCouleurStatutDepense
}) => {
  const pourcentageUtilisation = budget.montant_alloue > 0 
    ? (budget.montant_depense / budget.montant_alloue) * 100 
    : 0;

  const getStatutBudget = (pourcentage: number): string => {
    if (pourcentage >= 100) return 'Dépassé';
    if (pourcentage >= 80) return 'En alerte';
    return 'Dans les normes';
  };

  const getCouleurStatut = (statut: string): string => {
    switch (statut) {
      case 'Dépassé': return '#dc3545';
      case 'En alerte': return '#ffc107';
      case 'Dans les normes': return '#28a745';
      default: return '#6c757d';
    }
  };

  const statut = getStatutBudget(pourcentageUtilisation);
  const couleurStatut = getCouleurStatut(statut);

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="modal-modern" style={{
        background: 'white',
        borderRadius: '10px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div className="modal-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <h3 style={{ margin: 0, color: '#334155' }}>Détails du Budget</h3>
          <button className="modal-close-button" onClick={onClose} style={{
            background: 'none',
            border: 'none',
            fontSize: '26px',
            cursor: 'pointer',
            color: '#64748b'
          }}>×</button>
        </div>
        <div className="modal-content" style={{ padding: '20px' }}>
          <div className="section-details" style={{ marginBottom: '30px' }}>
            <h4 style={{ color: '#334155', marginBottom: '20px' }}>Informations Générales</h4>
            <div className="grille-details" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px'
            }}>
              <div className="detail-item">
                <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Catégorie</label>
                <div style={{ fontSize: '1rem', color: '#334155', fontWeight: '500' }}>
                  {getLabelCategorie(budget.categorie)}
                </div>
              </div>
              
              <div className="detail-item">
                <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Année scolaire</label>
                <div style={{ fontSize: '1rem', color: '#334155', fontWeight: '500' }}>
                  {budget.annee_scolaire}
                </div>
              </div>
              
              <div className="detail-item">
                <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Budget alloué</label>
                <div style={{ fontSize: '1rem', color: '#334155', fontWeight: '500' }}>
                  {formaterMontant(budget.montant_alloue)}
                </div>
              </div>
              
              <div className="detail-item">
                <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Montant dépensé</label>
                <div style={{ fontSize: '1rem', fontWeight: '500', color: '#dc2626' }}>
                  {formaterMontant(budget.montant_depense)}
                </div>
              </div>
              
              <div className="detail-item">
                <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Reste disponible</label>
                <div style={{ fontSize: '1rem', fontWeight: '500', color: '#16a34a' }}>
                  {formaterMontant(budget.montant_alloue - budget.montant_depense)}
                </div>
              </div>
              
              <div className="detail-item">
                <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Taux d'utilisation</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ flex: 1, height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${Math.min(pourcentageUtilisation, 100)}%`, 
                      backgroundColor: couleurStatut,
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                  <span style={{ fontWeight: '600', minWidth: '50px', textAlign: 'right' }}>
                    {pourcentageUtilisation.toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="detail-item">
                <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Statut</label>
                <div>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: 'white',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    backgroundColor: couleurStatut
                  }}>
                    {statut}
                  </span>
                </div>
              </div>
              
              <div className="detail-item">
                <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Date de création</label>
                <div style={{ fontSize: '1rem', color: '#334155' }}>
                  {formaterDate(budget.created_at)}
                </div>
              </div>
              
              {budget.description && (
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Description</label>
                  <div style={{ 
                    fontSize: '1rem', 
                    color: '#334155',
                    padding: '12px',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    marginTop: '6px'
                  }}>
                    {budget.description}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="section-details">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h4 style={{ color: '#334155', margin: 0 }}>Dépenses associées</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  {depenses.length} dépense(s) - Total: {formaterMontant(depenses.reduce((acc, d) => acc + d.montant, 0))}
                </span>
              </div>
            </div>
            
            {depenses.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px',
                background: '#f8fafc',
                borderRadius: '8px',
                color: '#64748b'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
                <p style={{ marginBottom: '10px' }}>Aucune dépense enregistrée pour ce budget</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Date</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Description</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Type</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Bénéficiaire</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Montant</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {depenses.map((depense) => (
                      <tr key={depense.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px 16px', color: '#475569', fontSize: '0.875rem' }}>
                          {formaterDate(depense.date_depense)}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#475569', fontSize: '0.875rem' }}>
                          <div style={{ fontWeight: '500' }}>{depense.description}</div>
                          {depense.numero_facture && (
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Facture: {depense.numero_facture}</div>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#475569', fontSize: '0.875rem' }}>
                          {getLabelTypeDepense(depense.type_depense)}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#475569', fontSize: '0.875rem' }}>
                          {depense.beneficiaire}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#dc2626', fontSize: '0.875rem', fontWeight: '600' }}>
                          {formaterMontant(depense.montant)}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: 'white',
                            backgroundColor: getCouleurStatutDepense(depense.statut)
                          }}>
                            {getLabelStatutDepense(depense.statut)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer" style={{
          padding: '20px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button onClick={onClose} style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500'
          }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

const ModalDetailsDepense: React.FC<ModalDetailsDepenseProps> = ({
  depense,
  onClose,
  formaterMontant,
  formaterDate,
  getLabelCategorie,
  getLabelTypeDepense,
  getLabelModePaiement,
  getLabelStatutDepense,
  getCouleurStatutDepense,
  typesDepense,
  modesPaiement
}) => {
  const statut = getLabelStatutDepense(depense.statut);
  const couleurStatut = getCouleurStatutDepense(depense.statut);

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="modal-modern" style={{
        background: 'white',
        borderRadius: '10px',
        width: '90%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div className="modal-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <h3 style={{ margin: 0, color: '#334155' }}>Détails de la Dépense</h3>
          <button className="modal-close-button" onClick={onClose} style={{
            background: 'none',
            border: 'none',
            fontSize: '26px',
            cursor: 'pointer',
            color: '#64748b'
          }}>×</button>
        </div>
        <div className="modal-content" style={{ padding: '20px' }}>
          <div className="section-details" style={{ marginBottom: '30px' }}>
            <h4 style={{ color: '#334155', marginBottom: '20px' }}>Informations Générales</h4>
            <div className="grille-details" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px'
            }}>
              <div className="detail-item">
                <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Description</label>
                <div style={{ fontSize: '1rem', color: '#334155', fontWeight: '500' }}>
                  {depense.description}
                </div>
              </div>
              
              <div className="detail-item">
                <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Montant</label>
                <div style={{ fontSize: '1.25rem', color: '#dc2626', fontWeight: '600' }}>
                  {formaterMontant(depense.montant)}
                </div>
              </div>
              
              <div className="detail-item">
                <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Catégorie budget</label>
                <div style={{ fontSize: '1rem', color: '#334155' }}>
                  {getLabelCategorie(depense.budget_categorie)}
                </div>
              </div>
              
              <div className="detail-item">
                <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Type de dépense</label>
                <div style={{ fontSize: '1rem', color: '#334155' }}>
                  {getLabelTypeDepense(depense.type_depense)}
                </div>
              </div>
              
              <div className="detail-item">
                <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Date de la dépense</label>
                <div style={{ fontSize: '1rem', color: '#334155' }}>
                  {formaterDate(depense.date_depense)}
                </div>
              </div>
              
              <div className="detail-item">
                <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Mode de paiement</label>
                <div style={{ fontSize: '1rem', color: '#334155' }}>
                  {getLabelModePaiement(depense.mode_paiement)}
                </div>
              </div>
              
              <div className="detail-item">
                <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Bénéficiaire</label>
                <div style={{ fontSize: '1rem', color: '#334155', fontWeight: '500' }}>
                  {depense.beneficiaire}
                </div>
              </div>
              
              <div className="detail-item">
                <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Statut</label>
                <div>
                  <span style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: 'white',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    backgroundColor: couleurStatut
                  }}>
                    {statut}
                  </span>
                </div>
              </div>
              
              {depense.sous_categorie && (
                <div className="detail-item">
                  <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Sous-catégorie</label>
                  <div style={{ fontSize: '1rem', color: '#334155' }}>
                    {depense.sous_categorie}
                  </div>
                </div>
              )}
              
              {depense.numero_facture && (
                <div className="detail-item">
                  <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Numéro de facture</label>
                  <div style={{ fontSize: '1rem', color: '#334155', fontWeight: '500' }}>
                    {depense.numero_facture}
                  </div>
                </div>
              )}
              
              {depense.reference && (
                <div className="detail-item">
                  <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Référence</label>
                  <div style={{ fontSize: '1rem', color: '#334155' }}>
                    {depense.reference}
                  </div>
                </div>
              )}
              
              <div className="detail-item">
                <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Date de création</label>
                <div style={{ fontSize: '1rem', color: '#334155' }}>
                  {formaterDate(depense.created_at)}
                </div>
              </div>
              
              <div className="detail-item">
                <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Dernière modification</label>
                <div style={{ fontSize: '1rem', color: '#334155' }}>
                  {formaterDate(depense.updated_at)}
                </div>
              </div>
              
              {depense.notes && (
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Notes</label>
                  <div style={{ 
                    fontSize: '1rem', 
                    color: '#334155',
                    padding: '12px',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    marginTop: '6px',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {depense.notes}
                  </div>
                </div>
              )}
              
              {depense.justificatif_url && (
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Justificatif</label>
                  <div style={{ marginTop: '6px' }}>
                    <a 
                      href={depense.justificatif_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        padding: '8px 16px',
                        background: '#3b82f6',
                        color: 'white',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontWeight: '500',
                        transition: 'background 0.2s'
                      }}
                    >
                      📄 Voir le justificatif
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="modal-footer" style={{
          padding: '20px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button onClick={onClose} style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500'
          }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

const ModalConfirmation: React.FC<ModalConfirmationProps> = ({
  type,
  onConfirm,
  onCancel,
  message,
  itemNom
}) => {
  const titre = type === 'budget' ? 'Supprimer le budget' : 'Supprimer la dépense';
  const defaultMessage = type === 'budget' 
    ? 'Êtes-vous sûr de vouloir supprimer ce budget ? Cette action est irréversible.'
    : 'Êtes-vous sûr de vouloir supprimer cette dépense ? Cette action est irréversible.';

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="modal-modern" style={{
        background: 'white',
        borderRadius: '10px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div className="modal-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <h3 style={{ margin: 0, color: '#334155' }}>{titre}</h3>
          <button className="modal-close-button" onClick={onCancel} style={{
            background: 'none',
            border: 'none',
            fontSize: '26px',
            cursor: 'pointer',
            color: '#64748b'
          }}>×</button>
        </div>
        <div className="modal-content" style={{ padding: '20px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '15px',
            marginBottom: '20px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              color: '#dc2626'
            }}>
              ⚠️
            </div>
            <div>
              <p style={{ margin: 0, color: '#334155', fontSize: '1rem' }}>
                {message || defaultMessage}
              </p>
              {itemNom && (
                <p style={{ margin: '5px 0 0 0', fontWeight: 'bold', color: '#dc2626' }}>
                  « {itemNom} »
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="modal-footer" style={{
          padding: '20px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px'
        }}>
          <button onClick={onCancel} style={{
            background: '#64748b',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500'
          }}>
            Annuler
          </button>
          <button onClick={onConfirm} style={{
            background: '#dc2626',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500'
          }}>
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== COMPOSANT PRINCIPAL ====================

export default function GestionBudget({ 
  formaterMontant: propFormaterMontant,
  formaterDate: propFormaterDate,
  deviseSymbole = 'F CFA'
}: GestionBudgetProps) {
  
  // ==================== ÉTATS ====================
  
  const [parametresEcole, setParametresEcole] = useState<ParametresEcole | null>(null);
  const [parametresApp, setParametresApp] = useState<ParametresApp | null>(null);
  
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [depensesBudgetSelectionne, setDepensesBudgetSelectionne] = useState<Depense[]>([]); 
  const [anneeScolaire, setAnneeScolaire] = useState('');
  const [anneeSelectionnee, setAnneeSelectionnee] = useState('');
  const [filtreCategorie, setFiltreCategorie] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const graphique1Ref = useRef<HTMLDivElement>(null);
  const graphique2Ref = useRef<HTMLDivElement>(null);
  const graphique3Ref = useRef<HTMLDivElement>(null);

  const [filtresDepenses, setFiltresDepenses] = useState<FiltresDepenses>({
    date_debut: '',
    date_fin: '',
    budget_id: '',
    type_depense: '',
    mode_paiement: '',
    statut: '',
    beneficiaire: '',
    montant_min: '',
    montant_max: ''
  });
  
  const [chargement, setChargement] = useState(false);
  const [chargementDepenses, setChargementDepenses] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [alerte, setAlerte] = useState<{type: 'success' | 'error' | 'warning' | 'info', message: string} | null>(null);
  const [periodeGraphique, setPeriodeGraphique] = useState<'jour' | 'semaine' | 'mois' | 'trimestre' | 'annee' | 'personnalise'>('mois');
  const [dateDebutPersonnalisee, setDateDebutPersonnalisee] = useState('');
  const [dateFinPersonnalisee, setDateFinPersonnalisee] = useState('');
  
  const [modalBudgetOpen, setModalBudgetOpen] = useState(false);
  const [modalDepenseOpen, setModalDepenseOpen] = useState(false);
  const [modalDetailsBudgetOpen, setModalDetailsBudgetOpen] = useState(false);
  const [modalModifierBudgetOpen, setModalModifierBudgetOpen] = useState(false);
  const [modalSupprimerBudgetOpen, setModalSupprimerBudgetOpen] = useState(false);
  const [modalDetailsDepenseOpen, setModalDetailsDepenseOpen] = useState(false);
  const [modalModifierDepenseOpen, setModalModifierDepenseOpen] = useState(false);
  const [modalSupprimerDepenseOpen, setModalSupprimerDepenseOpen] = useState(false);
  
  const [formBudget, setFormBudget] = useState<BudgetFormData>({
    annee_scolaire: '',
    categorie: '',
    montant_alloue: 0,
    description: ''
  });
  
  const [formDepense, setFormDepense] = useState<DepenseFormData>({
    budget_id: 0,
    type_depense: '',
    sous_categorie: '',
    description: '',
    montant: 0,
    date_depense: new Date().toISOString().split('T')[0],
    mode_paiement: 'especes',
    numero_facture: '',
    beneficiaire: '',
    reference: '',
    statut: 'valide',
    notes: ''
  });
  
  const [budgetSelectionne, setBudgetSelectionne] = useState<Budget | null>(null);
  const [budgetPourDepense, setBudgetPourDepense] = useState<Budget | null>(null);
  const [depenseSelectionnee, setDepenseSelectionnee] = useState<Depense | null>(null);
  const [exportChargement, setExportChargement] = useState(false);
  const [printComponentKey, setPrintComponentKey] = useState(0);
  const printBudgetsRef = useRef<PrintComponentRef>(null);
  const printDepensesRef = useRef<PrintComponentRef>(null);
  const printStatsRef = useRef<PrintComponentRef>(null);
  const printGraphiquesRef = useRef<PrintComponentRef>(null);
  
  // ==================== DONNÉES STATIQUES ====================
  
  const categoriesBudget = [
    { value: 'personnel', label: 'Personnel', couleur: '#0088FE' },
    { value: 'fonctionnement', label: 'Fonctionnement général', couleur: '#FFBB28' },
    { value: 'pedagogique', label: 'Matériel pédagogique', couleur: '#800ad4' },
    { value: 'electricité', label: 'Électricité', couleur: '#f05000' },
    { value: 'eau', label: 'Eau', couleur: '#05cd73' },
    { value: 'maintenance', label: 'Maintenance des locaux', couleur: '#8884D8' },
    { value: 'fournitures', label: 'Fournitures scolaires', couleur: '#82CA9D' },
    { value: 'equipement', label: 'Équipement informatique', couleur: '#69d800' },
    { value: 'restauration', label: 'Restauration scolaire', couleur: '#4ECDC4' },
    { value: 'transport', label: 'Transport scolaire', couleur: '#45B7D1' },
    { value: 'activites', label: 'Activités extrascolaires', couleur: '#96CEB4' },
    { value: 'formation', label: 'Formation du personnel', couleur: '#FFEAA7' },
    { value: 'publicite', label: 'Publicité et communication', couleur: '#f3b8da' },
    { value: 'frais_financiers', label: 'Frais financiers', couleur: '#98D8C8' },
    { value: 'impots_taxes', label: 'Impôts et taxes', couleur: '#F7DC6F' },
    { value: 'divers', label: 'Divers', couleur: '#BB8FCE' }
  ];

  const typesDepense = [
    { value: 'salaires', label: 'Salaires et charges sociales' },
    { value: 'honoraires', label: 'Honoraires et consultations' },
    { value: 'loyer', label: 'Loyers et charges locatives' },
    { value: 'electricite', label: 'Électricité' },
    { value: 'eau', label: 'Eau' },
    { value: 'telecom', label: 'Télécommunications' },
    { value: 'fournitures_bureau', label: 'Fournitures de bureau' },
    { value: 'materiel_scolaire', label: 'Matériel scolaire' },
    { value: 'maintenance_equipement', label: 'Maintenance d\'équipement' },
    { value: 'frais_deplacement', label: 'Frais de déplacement' },
    { value: 'publicite_marketing', label: 'Publicité et marketing' },
    { value: 'formation', label: 'Formation et perfectionnement' },
    { value: 'assurances', label: 'Assurances' },
    { value: 'frais_bancaires', label: 'Frais bancaires' },
    { value: 'impots_taxes', label: 'Impôts et taxes' },
    { value: 'divers', label: 'Divers' }
  ];

  const sousCategoriesParType: Record<string, Array<{value: string, label: string}>> = {
    'salaires': [
      { value: 'enseignants', label: 'Enseignants' },
      { value: 'administratif', label: 'Personnel administratif' },
      { value: 'maintenance', label: 'Personnel de maintenance' },
      { value: 'charges_sociales', label: 'Charges sociales' }
    ],
    'honoraires': [
      { value: 'avocat', label: 'Avocat' },
      { value: 'comptable', label: 'Comptable' },
      { value: 'consultant', label: 'Consultant' },
      { value: 'formateur', label: 'Formateur externe' }
    ],
    'materiel_scolaire': [
      { value: 'livres', label: 'Livres et manuels' },
      { value: 'papeterie', label: 'Papeterie' },
      { value: 'informatique', label: 'Matériel informatique' },
      { value: 'sport', label: 'Équipement sportif' }
    ]
  };

  const modesPaiement = [
    { value: 'especes', label: 'Espèces' },
    { value: 'cheque', label: 'Chèque' },
    { value: 'virement', label: 'Virement bancaire' },
    { value: 'carte', label: 'Carte bancaire' },
    { value: 'mobile', label: 'Mobile Money' },
    { value: 'autre', label: 'Autre' }
  ];

  const statutsDepense = [
    { value: 'valide', label: 'Validée', couleur: '#28a745' },
    { value: 'en_attente', label: 'En attente', couleur: '#ffc107' },
    { value: 'annule', label: 'Annulée', couleur: '#dc3545' }
  ];

  // ==================== FONCTIONS DE FORMATAGE DYNAMIQUE ====================

  const formaterMontant = (montant: number): string => {
    if (propFormaterMontant) {
      return propFormaterMontant(montant);
    }
    
    if (!parametresApp) {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(montant).replace('XOF', 'F CFA');
    }
    
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: parametresApp.devise,
        currencyDisplay: 'code'
      }).format(montant).replace(parametresApp.devise, parametresApp.symbole_devise);
    } catch (error) {
      console.error('Erreur formatage montant:', error);
      return `${montant.toLocaleString('fr-FR')} ${parametresApp.symbole_devise}`;
    }
  };

  const formaterDate = (date: Date | string): string => {
    if (propFormaterDate) {
      return propFormaterDate(date);
    }
    
    if (!parametresApp) {
      return new Date(date).toLocaleDateString('fr-FR');
    }
    
    const d = new Date(date);
    const jour = d.getDate().toString().padStart(2, '0');
    const mois = (d.getMonth() + 1).toString().padStart(2, '0');
    const annee = d.getFullYear();
    const anneeCourt = annee.toString().slice(-2);
    
    switch (parametresApp.format_date) {
      case 'dd/mm/yyyy':
        return `${jour}/${mois}/${annee}`;
      case 'mm/dd/yyyy':
        return `${mois}/${jour}/${annee}`;
      case 'yyyy-mm-dd':
        return `${annee}-${mois}-${jour}`;
      case 'dd.mm.yyyy':
        return `${jour}.${mois}.${annee}`;
      case 'dd/mm/yy':
        return `${jour}/${mois}/${anneeCourt}`;
      default:
        return `${jour}/${mois}/${annee}`;
    }
  };

  const formaterMontantCompact = (montant: number): string => {
    if (montant >= 1000000) {
      return (montant / 1000000).toFixed(1) + 'M';
    } else if (montant >= 1000) {
      return (montant / 1000).toFixed(1) + 'k';
    }
    return montant.toString();
  };

  // ==================== FONCTIONS UTILITAIRES ====================

  const getLabelCategorie = (valeur: string): string => {
    const categorie = categoriesBudget.find(c => c.value === valeur);
    return categorie ? categorie.label : valeur;
  };

  const getCouleurCategorie = (valeur: string): string => {
    const categorie = categoriesBudget.find(c => c.value === valeur);
    return categorie ? categorie.couleur : '#6c757d';
  };

  const getLabelTypeDepense = (valeur: string): string => {
    const type = typesDepense.find(t => t.value === valeur);
    return type ? type.label : valeur;
  };

  const getLabelModePaiement = (valeur: string): string => {
    const mode = modesPaiement.find(m => m.value === valeur);
    return mode ? mode.label : valeur;
  };

  const getLabelStatutDepense = (valeur: string): string => {
    const statut = statutsDepense.find(s => s.value === valeur);
    return statut ? statut.label : valeur;
  };

  const getCouleurStatutDepense = (valeur: string): string => {
    const statut = statutsDepense.find(s => s.value === valeur);
    return statut ? statut.couleur : '#6c757d';
  };

  const getStatutBudget = (pourcentage: number): string => {
    if (pourcentage >= 100) return 'depasse';
    if (pourcentage >= 80) return 'en_alerte';
    return 'dans_les_normes';
  };

  const getCouleurStatut = (statut: string): string => {
    switch (statut) {
      case 'depasse': return '#dc3545';
      case 'en_alerte': return '#ffc107';
      case 'dans_les_normes': return '#28a745';
      default: return '#6c757d';
    }
  };

  const calculerPourcentageUtilisation = (budget: Budget): number => {
    return budget.montant_alloue > 0 ? (budget.montant_depense / budget.montant_alloue) * 100 : 0;
  };

  // ==================== FILTRES PÉRIODE ====================

  const filtrerDonneesParPeriode = (donnees: any[], dateField: string = 'date_depense') => {
    if (!donnees || donnees.length === 0) return donnees;
    
    const maintenant = new Date();
    let dateDebut: Date;
    let dateFin: Date = maintenant;
    
    switch (periodeGraphique) {
      case 'jour':
        dateDebut = new Date(maintenant);
        dateDebut.setHours(0, 0, 0, 0);
        break;
        
      case 'semaine':
        dateDebut = new Date(maintenant);
        dateDebut.setDate(maintenant.getDate() - maintenant.getDay());
        dateDebut.setHours(0, 0, 0, 0);
        break;
        
      case 'mois':
        dateDebut = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
        break;
        
      case 'trimestre':
        const trimestre = Math.floor(maintenant.getMonth() / 3);
        dateDebut = new Date(maintenant.getFullYear(), trimestre * 3, 1);
        break;
        
      case 'annee':
        dateDebut = new Date(maintenant.getFullYear(), 0, 1);
        break;
        
      case 'personnalise':
        if (dateDebutPersonnalisee && dateFinPersonnalisee) {
          dateDebut = new Date(dateDebutPersonnalisee);
          dateFin = new Date(dateFinPersonnalisee);
        } else {
          dateDebut = new Date(maintenant.getFullYear(), maintenant.getMonth() - 1, maintenant.getDate());
        }
        break;
        
      default:
        dateDebut = new Date(maintenant.getFullYear(), maintenant.getMonth() - 1, maintenant.getDate());
    }
    
    return donnees.filter(item => {
      if (!item[dateField]) return false;
      const dateItem = new Date(item[dateField]);
      return dateItem >= dateDebut && dateItem <= dateFin;
    });
  };

  const calculerStatistiquesFiltrees = useMemo(() => {
    const depensesFiltrees = filtrerDonneesParPeriode(depenses);
    
    const totalBudgets = budgets.length;
    const totalAlloue = budgets.reduce((acc, b) => acc + b.montant_alloue, 0);
    const totalDepense = depensesFiltrees.reduce((acc, d) => acc + d.montant, 0);
    const pourcentageUtilisation = totalAlloue > 0 ? (totalDepense / totalAlloue) * 100 : 0;
    
    const budgetsDepasses = budgets.filter(b => b.statut === 'depasse').length;
    const budgetsEnAlerte = budgets.filter(b => b.statut === 'en_alerte').length;
    
    const depensesParMois = depensesFiltrees.reduce((acc: Array<{mois: string, montant: number}>, depense) => {
      const mois = new Date(depense.date_depense).toLocaleDateString('fr-FR', { 
        month: 'short', 
        year: '2-digit' 
      });
      const existing = acc.find(item => item.mois === mois);
      
      if (existing) {
        existing.montant += depense.montant;
      } else {
        acc.push({ mois, montant: depense.montant });
      }
      
      return acc;
    }, []);
    
    const depensesParCategorie = budgets.map(budget => {
      const depensesCategorie = depensesFiltrees.filter(d => d.budget_id === budget.id);
      const montant = depensesCategorie.reduce((acc, d) => acc + d.montant, 0);
      
      return {
        categorie: getLabelCategorie(budget.categorie),
        montant,
        pourcentage: totalDepense > 0 ? (montant / totalDepense) * 100 : 0
      };
    }).filter(item => item.montant > 0);
    
    const depensesParType = depensesFiltrees.reduce((acc: Array<{type: string, montant: number}>, depense) => {
      const typeLabel = typesDepense.find(t => t.value === depense.type_depense)?.label || depense.type_depense;
      const existing = acc.find(item => item.type === typeLabel);
      
      if (existing) {
        existing.montant += depense.montant;
      } else {
        acc.push({ type: typeLabel, montant: depense.montant });
      }
      
      return acc;
    }, []);
    
    const evolutionBudgets = budgets.map(budget => ({
      mois: getLabelCategorie(budget.categorie),
      alloue: budget.montant_alloue,
      depense: depensesFiltrees
        .filter(d => d.budget_id === budget.id)
        .reduce((acc, d) => acc + d.montant, 0)
    }));

    return {
      totalBudgets,
      totalAlloue,
      totalDepense,
      pourcentageUtilisation,
      budgetsDepasses,
      budgetsEnAlerte,
      depensesParMois,
      depensesParCategorie,
      depensesParType,
      evolutionBudgets,
      depensesFiltrees
    };
  }, [budgets, depenses, periodeGraphique, dateDebutPersonnalisee, dateFinPersonnalisee, getLabelCategorie, typesDepense, filtrerDonneesParPeriode]);

  const statistiquesFiltrees = calculerStatistiquesFiltrees;

  // ==================== EFFETS ====================

  useEffect(() => {
    chargerDonneesInitiales();
  }, []);

  useEffect(() => {
    const maintenant = new Date();
    const premierJourMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
    const dernierJourMois = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 0);
    
    setFiltresDepenses(prev => ({
      ...prev,
      date_debut: premierJourMois.toISOString().split('T')[0],
      date_fin: dernierJourMois.toISOString().split('T')[0]
    }));
    
    const annee = maintenant.getFullYear();
    const mois = maintenant.getMonth() + 1;
    
    if (mois >= 8) {
      setAnneeScolaire(`${annee}-${annee + 1}`);
      setAnneeSelectionnee(`${annee}-${annee + 1}`);
    } else {
      setAnneeScolaire(`${annee - 1}-${annee}`);
      setAnneeSelectionnee(`${annee - 1}-${annee}`);
    }
  }, []);

  useEffect(() => {
    if (anneeSelectionnee) {
      chargerBudgets();
      chargerDepenses();
    }
  }, [anneeSelectionnee, filtreCategorie, filtreStatut]);

  useEffect(() => {
    if (alerte) {
      const timer = setTimeout(() => {
        setAlerte(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alerte]);

  // ==================== CHARGEMENT DES DONNÉES ====================

  const chargerDonneesInitiales = async () => {
    try {
      await Promise.all([
        chargerParametresEcole(),
        chargerParametresApp()
      ]);
    } catch (error) {
      console.error('Erreur chargement données initiales:', error);
    }
  };

  const chargerParametresEcole = async () => {
    try {
      const response = await fetch('/api/parametres/ecole');
      const data = await response.json();
      if (data.success) {
        setParametresEcole(data.parametres);
      }
    } catch (error) {
      console.error('Erreur chargement paramètres école:', error);
    }
  };

  const chargerParametresApp = async () => {
    try {
      const response = await fetch('/api/parametres/application');
      const data = await response.json();
      if (data.success && data.parametres) {
        setParametresApp(data.parametres);
      } else {
        setParametresApp({
          id: 1,
          devise: 'XOF',
          symbole_devise: 'F CFA',
          format_date: 'dd/mm/yyyy',
          fuseau_horaire: 'Africa/Abidjan',
          langue_defaut: 'fr',
          theme_defaut: 'clair'
        });
      }
    } catch (error) {
      console.error('Erreur chargement paramètres app:', error);
      setParametresApp({
        id: 1,
        devise: 'XOF',
        symbole_devise: 'F CFA',
        format_date: 'dd/mm/yyyy',
        fuseau_horaire: 'Africa/Abidjan',
        langue_defaut: 'fr',
        theme_defaut: 'clair'
      });
    }
  };

  const chargerBudgets = async () => {
    try {
      setChargement(true);
      setErreur(null);
      
      const params = new URLSearchParams();
      params.append('annee_scolaire', anneeSelectionnee);
      if (filtreCategorie) params.append('categorie', filtreCategorie);
      if (filtreStatut) params.append('statut', filtreStatut);
      
      const url = `/api/finance/budget?${params.toString()}`;
      console.log('🔍 Chargement budgets:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const text = await response.text();
      console.log('📥 Réponse budgets:', text.substring(0, 200));
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (jsonError) {
        console.error('Erreur parsing JSON budgets:', jsonError);
        throw new Error('Format de réponse invalide');
      }
      
      if (data.success) {
        setBudgets(data.budgets || []);
        console.log(`✅ ${data.budgets?.length || 0} budgets chargés`);
      } else {
        throw new Error(data.erreur || 'Erreur inconnue');
      }
    } catch (error: any) {
      console.error('Erreur chargement budgets:', error);
      setAlerte({ 
        type: 'error', 
        message: 'Erreur lors du chargement des budgets: ' + error.message 
      });
      setBudgets([]);
    } finally {
      setChargement(false);
    }
  };

  const chargerDepenses = async () => {
    try {
      setChargementDepenses(true);
      
      const params = new URLSearchParams();
      
      if (filtresDepenses.date_debut) {
        params.append('date_debut', filtresDepenses.date_debut);
      }
      
      if (filtresDepenses.date_fin) {
        params.append('date_fin', filtresDepenses.date_fin);
      }
      
      if (filtresDepenses.budget_id) {
        params.append('budget_id', filtresDepenses.budget_id);
      }
      
      if (filtresDepenses.type_depense) {
        params.append('type_depense', filtresDepenses.type_depense);
      }
      
      if (filtresDepenses.mode_paiement) {
        params.append('mode_paiement', filtresDepenses.mode_paiement);
      }
      
      if (filtresDepenses.statut) {
        params.append('statut', filtresDepenses.statut);
      }
      
      if (filtresDepenses.beneficiaire) {
        params.append('beneficiaire', filtresDepenses.beneficiaire);
      }
      
      if (filtresDepenses.montant_min) {
        params.append('montant_min', filtresDepenses.montant_min);
      }
      
      if (filtresDepenses.montant_max) {
        params.append('montant_max', filtresDepenses.montant_max);
      }
      
      params.append('annee_scolaire', anneeSelectionnee);
      
      const url = `/api/finance/depenses?${params.toString()}`;
      console.log('🔍 URL de chargement des dépenses:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setDepenses(data.depenses || []);
        console.log(`✅ ${data.depenses?.length || 0} dépenses chargées avec filtres`);
      } else {
        throw new Error(data.erreur || 'Erreur lors du chargement des dépenses');
      }
    } catch (error: any) {
      console.error('Erreur chargement dépenses:', error);
      setAlerte({ 
        type: 'error', 
        message: 'Erreur lors du chargement des dépenses. Veuillez vérifier votre connexion.' 
      });
      setDepenses([]);
    } finally {
      setChargementDepenses(false);
    }
  };

  const chargerDepensesBudget = async (budgetId: number): Promise<Depense[]> => {
    try {
      console.log(`🔍 Chargement dépenses pour budget ID: ${budgetId}`);
      
      const response = await fetch(`/api/finance/budget/${budgetId}/depenses`);
      
      if (response.status === 400 || response.status === 404) {
        console.log(`⚠️ Budget ${budgetId}: Pas de dépenses trouvées (HTTP ${response.status})`);
        return [];
      }
      
      if (!response.ok) {
        console.error(`Erreur HTTP ${response.status} pour budget ${budgetId}`);
        return [];
      }
      
      const text = await response.text();
      
      if (!text.trim()) {
        console.log(`📭 Réponse vide pour dépenses budget ${budgetId}`);
        return [];
      }
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (jsonError) {
        console.error('Erreur parsing JSON dépenses budget:', jsonError);
        return [];
      }
      
      if (data.success && Array.isArray(data.depenses)) {
        const depensesBudget: Depense[] = data.depenses.map((depense: any) => ({
          ...depense,
          type_depense: depense.type_depense || depense.categorie || 'divers',
          sous_categorie: depense.sous_categorie || '',
          mode_paiement: depense.mode_paiement || 'especes',
          numero_facture: depense.numero_facture || '',
          notes: depense.notes || ''
        }));
        console.log(`✅ ${depensesBudget.length} dépenses chargées pour budget ${budgetId}`);
        return depensesBudget;
      } else {
        console.log(`📭 Pas de dépenses pour budget ${budgetId}:`, data?.message || 'Pas de données');
        return [];
      }
    } catch (error) {
      console.error('Erreur chargement dépenses budget:', error);
      return [];
    }
  };

  // ==================== GESTION DES BUDGETS ====================

  const handleOuvrirModalBudget = () => {
    setFormBudget({
      annee_scolaire: anneeSelectionnee,
      categorie: '',
      montant_alloue: 0,
      description: ''
    });
    setModalBudgetOpen(true);
  };

  const handleOuvrirModalDepense = (budget: Budget | null = null) => {
    const budgetId = budget ? budget.id : 0;
    
    setBudgetPourDepense(budget);
    setFormDepense({
      budget_id: budgetId,
      type_depense: '',
      sous_categorie: '',
      description: '',
      montant: 0,
      date_depense: new Date().toISOString().split('T')[0],
      mode_paiement: 'especes',
      numero_facture: '',
      beneficiaire: '',
      reference: '',
      statut: 'valide',
      notes: ''
    });
    setModalDepenseOpen(true);
  };

  const handleOuvrirDetailsBudget = async (budget: Budget) => {
    setBudgetSelectionne(budget);
    
    try {
      const response = await fetch(`/api/finance/budget/${budget.id}/depenses`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const depensesBudget = data.depenses || [];
          setDepensesBudgetSelectionne(depensesBudget);
        } else {
          const depensesBudget = depenses.filter(d => d.budget_id === budget.id);
          setDepensesBudgetSelectionne(depensesBudget);
        }
      } else {
        const depensesBudget = depenses.filter(d => d.budget_id === budget.id);
        setDepensesBudgetSelectionne(depensesBudget);
      }
    } catch (error) {
      console.error('Erreur chargement dépenses budget:', error);
      const depensesBudget = depenses.filter(d => d.budget_id === budget.id);
      setDepensesBudgetSelectionne(depensesBudget);
    }
    
    setModalDetailsBudgetOpen(true);
  };

  const handleOuvrirModifierBudget = async (budget: Budget) => {
    console.log('🔄 Ouvrir modification budget:', budget);
    
    if (!budget?.id) {
      console.error('❌ Budget invalide:', budget);
      setAlerte({ type: 'error', message: 'Budget invalide sélectionné' });
      return;
    }
  
    await new Promise(resolve => setTimeout(resolve, 0));
    
    setBudgetSelectionne(budget);
    setFormBudget({
      annee_scolaire: budget.annee_scolaire,
      categorie: budget.categorie,
      montant_alloue: budget.montant_alloue,
      description: budget.description || ''
    });
    setModalModifierBudgetOpen(true);
    
    console.log('✅ Budget sélectionné:', budget);
  };

  const handleOuvrirSupprimerBudget = async (budget: Budget) => {
    console.log('🔄 Ouvrir suppression budget:', budget);
    
    if (!budget?.id) {
      console.log('❌ Budget invalide');
      setAlerte({ type: 'error', message: 'Budget invalide sélectionné' });
      return;
    }
    setBudgetSelectionne(budget);
    setModalSupprimerBudgetOpen(true);
    
    console.log('✅ Modale de suppression ouverte pour budget:', budget.id);
  };

  const handleOuvrirDetailsDepense = (depense: Depense) => {
    setDepenseSelectionnee(depense);
    setModalDetailsDepenseOpen(true);
  };

  const handleOuvrirModifierDepense = (depense: Depense) => {
    setDepenseSelectionnee(depense);
    setFormDepense({
      budget_id: depense.budget_id,
      type_depense: depense.type_depense,
      sous_categorie: depense.sous_categorie || '',
      description: depense.description,
      montant: depense.montant,
      date_depense: depense.date_depense.split('T')[0],
      mode_paiement: depense.mode_paiement,
      numero_facture: depense.numero_facture || '',
      beneficiaire: depense.beneficiaire,
      reference: depense.reference || '',
      statut: depense.statut,
      notes: depense.notes || ''
    });
    setModalModifierDepenseOpen(true);
  };

  const handleOuvrirSupprimerDepense = (depense: Depense) => {
    setDepenseSelectionnee(depense);
    setModalSupprimerDepenseOpen(true);
  };

  const handleSoumettreBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formBudget.categorie || formBudget.montant_alloue <= 0) {
      setAlerte({ type: 'error', message: 'Veuillez remplir tous les champs obligatoires' });
      return;
    }
    
    try {
      setChargement(true);
      
      console.log('📤 Envoi création budget:', formBudget);
      
      const response = await fetch('/api/finance/budget', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          annee_scolaire: formBudget.annee_scolaire || anneeSelectionnee,
          categorie: formBudget.categorie,
          montant_alloue: formBudget.montant_alloue,
          description: formBudget.description || ''
        })
      });
      
      console.log('📥 Réponse status:', response.status);
      console.log('📥 Réponse ok:', response.ok);
      
      let data;
      try {
        data = await response.json();
        console.log('📥 Données réponse:', data);
      } catch (jsonError) {
        console.error('❌ Erreur parsing JSON:', jsonError);
        const text = await response.text();
        console.error('❌ Texte réponse:', text);
        throw new Error('Réponse invalide du serveur');
      }
      
      if (!response.ok) {
        console.error('❌ Erreur API:', data);
        throw new Error(data.erreur || data.message || `Erreur HTTP: ${response.status}`);
      }
      
      if (data.success) {
        console.log('✅ Budget créé avec succès:', data.budget);
        setAlerte({ type: 'success', message: data.message || 'Budget créé avec succès' });
        setModalBudgetOpen(false);
        
        await chargerBudgets();
        
        setFormBudget({
          annee_scolaire: anneeSelectionnee,
          categorie: '',
          montant_alloue: 0,
          description: ''
        });
      } else {
        console.error('❌ API retourne success:false');
        throw new Error(data.erreur || data.message || 'Erreur lors de la création du budget');
      }
    } catch (error: any) {
      console.error('❌ Erreur création budget:', error);
      setAlerte({ 
        type: 'error', 
        message: error.message || 'Erreur lors de la création du budget. Vérifiez votre connexion.' 
      });
    } finally {
      setChargement(false);
    }
  };

  const handleModifierBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔄 handleModifierBudget - Début');
    console.log('📝 budgetSelectionne:', budgetSelectionne);
    console.log('📝 formBudget:', formBudget);
    
    if (!budgetSelectionne || !budgetSelectionne.id) {
      console.error('❌ Aucun budget sélectionné');
      setAlerte({ type: 'error', message: 'Aucun budget sélectionné pour modification' });
      return;
    }
    
    if (!formBudget.categorie || formBudget.montant_alloue <= 0) {
      console.error('❌ Champs requis manquants');
      setAlerte({ type: 'error', message: 'Veuillez remplir tous les champs obligatoires' });
      return;
    }
    
    try {
      setChargement(true);
      
      const budgetId = budgetSelectionne.id;
      console.log('📤 Envoi modification pour budget ID:', budgetId);
      console.log('📤 URL:', `/api/finance/budget/${budgetId}`);
      
      const response = await fetch(`/api/finance/budget/${budgetId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          categorie: formBudget.categorie,
          montant_alloue: formBudget.montant_alloue,
          description: formBudget.description || ''
        })
      });
      
      console.log('📥 Réponse status:', response.status);
      console.log('📥 Réponse ok:', response.ok);
      
      let data;
      try {
        data = await response.json();
        console.log('📥 Données réponse:', data);
      } catch (jsonError) {
        console.error('❌ Erreur parsing JSON:', jsonError);
        const text = await response.text();
        console.error('❌ Texte réponse:', text);
        throw new Error('Réponse invalide du serveur');
      }
      
      if (!response.ok) {
        console.error('❌ Erreur API:', data);
        throw new Error(data.erreur || data.message || `Erreur HTTP: ${response.status}`);
      }
      
      if (data.success) {
        console.log('✅ Budget modifié avec succès');
        setAlerte({ type: 'success', message: data.message || 'Budget modifié avec succès' });
        setModalModifierBudgetOpen(false);
        
        await chargerBudgets();
      } else {
        console.error('❌ API retourne success:false');
        throw new Error(data.erreur || 'Erreur lors de la modification du budget');
      }
    } catch (error: any) {
      console.error('❌ Erreur complète modification budget:', error);
      setAlerte({ 
        type: 'error', 
        message: error.message || 'Erreur lors de la modification du budget' 
      });
    } finally {
      setChargement(false);
    }
  };

  const handleSupprimerBudget = async () => {
    console.log('🗑️ handleSupprimerBudget - Début');
    
    if (!budgetSelectionne || !budgetSelectionne.id) {
      setAlerte({ type: 'error', message: 'Aucun budget sélectionné pour suppression' });
      return;
    }
    
    try {
      setChargement(true);
      
      const budgetId = budgetSelectionne.id;
      console.log('📤 Envoi suppression budget ID:', budgetId);
      
      const response = await fetch(`/api/finance/budget/${budgetId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📥 Réponse status:', response.status);
      console.log('📥 Réponse ok:', response.ok);
      
      const responseText = await response.text();
      console.log('📥 Texte réponse:', responseText);
      
      let data: any = {};
      let errorMessage = '';
      
      if (responseText.trim()) {
        try {
          data = JSON.parse(responseText);
          console.log('📥 Données parsées:', data);
        } catch (jsonError) {
          console.error('❌ Erreur parsing JSON:', jsonError);
          if (responseText.includes('dépense') || responseText.includes('supprimer')) {
            errorMessage = responseText;
          } else if (!response.ok) {
            errorMessage = `Erreur serveur (${response.status})`;
          }
        }
      }
      
      if (!response.ok) {
        switch (response.status) {
          case 400:
            errorMessage = data?.message || 'Ce budget a des dépenses associées. Supprimez d\'abord les dépenses.';
            break;
          case 403:
            errorMessage = 'Vous n\'avez pas la permission de supprimer ce budget';
            break;
          case 404:
            errorMessage = 'Budget non trouvé';
            break;
          case 409:
            errorMessage = data?.message || 'Ce budget a des dépenses associées. Supprimez d\'abord les dépenses.';
            break;
          case 500:
            errorMessage = 'Erreur serveur interne. Veuillez réessayer plus tard.';
            break;
          default:
            errorMessage = data?.message || data?.erreur || `Erreur ${response.status}`;
        }
        
        console.log(`⚠️ Suppression refusée: ${errorMessage}`);
        
        if (response.status === 409) {
          setAlerte({ 
            type: 'error', 
            message: errorMessage 
          });
          setModalSupprimerBudgetOpen(false);
          return;
        }
        
        throw new Error(errorMessage);
      }
      
      console.log('✅ Budget supprimé avec succès');
      setAlerte({ 
        type: 'success', 
        message: data?.message || 'Budget supprimé avec succès' 
      });
      setModalSupprimerBudgetOpen(false);
      
      await Promise.all([
        chargerBudgets(),
        chargerDepenses()
      ]);
      
    } catch (error: any) {
      console.log(`⚠️ Erreur suppression budget: ${error.message}`);
      
      if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
        setAlerte({ 
          type: 'error', 
          message: 'Erreur de connexion. Vérifiez votre connexion internet.' 
        });
      } else {
        setAlerte({ 
          type: 'error', 
          message: error.message || 'Erreur lors de la suppression du budget' 
        });
      }
    } finally {
      setChargement(false);
    }
  };

  const handleSoumettreDepense = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formDepense.budget_id || !formDepense.description || formDepense.montant <= 0) {
      setAlerte({ type: 'error', message: 'Veuillez remplir tous les champs obligatoires' });
      return;
    }
    
    if (budgetPourDepense) {
      const depensesBudget = await chargerDepensesBudget(budgetPourDepense.id);
      const totalDepenses = depensesBudget.reduce((total, depense) => total + depense.montant, 0);
      const nouveauTotal = totalDepenses + formDepense.montant;
      
      if (nouveauTotal > budgetPourDepense.montant_alloue) {
        const depassement = nouveauTotal - budgetPourDepense.montant_alloue;
        if (!confirm(`Attention : Cette dépense dépassera le budget de ${formaterMontant(depassement)}. Souhaitez-vous continuer ?`)) {
          return;
        }
      }
    }
    
    try {
      setChargement(true);
      
      const response = await fetch('/api/finance/depenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formDepense)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAlerte({ type: 'success', message: 'Dépense enregistrée avec succès' });
        setModalDepenseOpen(false);
        chargerBudgets();
        chargerDepenses();
      } else {
        throw new Error(data.erreur);
      }
    } catch (error: any) {
      console.error('Erreur enregistrement dépense:', error);
      setAlerte({ type: 'error', message: error.message || 'Erreur lors de l\'enregistrement de la dépense' });
    } finally {
      setChargement(false);
    }
  };

  const handleModifierDepense = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔄 handleModifierDepense - Début');
    console.log('📝 depenseSelectionnee:', depenseSelectionnee);
    console.log('📝 formDepense:', formDepense);
    
    if (!depenseSelectionnee) {
      console.error('❌ Aucune dépense sélectionnée');
      setAlerte({ type: 'error', message: 'Aucune dépense sélectionnée pour modification' });
      return;
    }
    
    if (!formDepense.description || formDepense.montant <= 0) {
      console.error('❌ Champs requis manquants');
      setAlerte({ type: 'error', message: 'Veuillez remplir tous les champs obligatoires' });
      return;
    }
    
    try {
      setChargement(true);
      
      const depenseId = depenseSelectionnee.id;
      console.log('📤 Envoi modification dépense ID:', depenseId);
      console.log('📤 URL:', `/api/finance/depenses/${depenseId}`);
      
      const response = await fetch(`/api/finance/depenses/${depenseId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formDepense)
      });
      
      console.log('📥 Réponse status:', response.status);
      console.log('📥 Réponse ok:', response.ok);
      
      let data;
      try {
        data = await response.json();
        console.log('📥 Données réponse:', data);
      } catch (jsonError) {
        console.error('❌ Erreur parsing JSON:', jsonError);
        const text = await response.text();
        console.error('❌ Texte réponse:', text);
        throw new Error('Réponse invalide du serveur');
      }
      
      if (!response.ok) {
        console.error('❌ Erreur API:', data);
        throw new Error(data.erreur || data.message || `Erreur HTTP: ${response.status}`);
      }
      
      if (data.success) {
        console.log('✅ Dépense modifiée avec succès');
        setAlerte({ type: 'success', message: 'Dépense modifiée avec succès' });
        setModalModifierDepenseOpen(false);
        chargerBudgets();
        chargerDepenses();
      } else {
        console.error('❌ API retourne success:false');
        throw new Error(data.erreur || 'Erreur lors de la modification de la dépense');
      }
    } catch (error: any) {
      console.error('❌ Erreur complète modification dépense:', error);
      setAlerte({ 
        type: 'error', 
        message: error.message || 'Erreur lors de la modification de la dépense' 
      });
    } finally {
      setChargement(false);
    }
  };

  const handleSupprimerDepense = async () => {
    console.log('🗑️ handleSupprimerDepense - Début');
    
    if (!depenseSelectionnee) {
      console.error('❌ Aucune dépense sélectionnée');
      setAlerte({ type: 'error', message: 'Aucune dépense sélectionnée pour suppression' });
      return;
    }
    
    try {
      setChargement(true);
      
      const depenseId = depenseSelectionnee.id;
      console.log('📤 Envoi suppression dépense ID:', depenseId);
      console.log('📤 URL:', `/api/finance/depenses/${depenseId}`);
      
      const response = await fetch(`/api/finance/depenses/${depenseId}`, {
        method: 'DELETE',
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📥 Réponse status:', response.status);
      console.log('📥 Réponse ok:', response.ok);
      
      let data;
      try {
        data = await response.json();
        console.log('📥 Données réponse:', data);
      } catch (jsonError) {
        console.error('❌ Erreur parsing JSON:', jsonError);
        const text = await response.text();
        console.error('❌ Texte réponse:', text);
        
        if (text.includes('success')) {
          try {
            data = JSON.parse(text);
          } catch {
            throw new Error('Réponse invalide du serveur');
          }
        } else {
          throw new Error('Réponse invalide du serveur: ' + text.substring(0, 100));
        }
      }
      
      if (!response.ok) {
        console.error('❌ Erreur API:', data);
        throw new Error(data.erreur || data.message || `Erreur HTTP: ${response.status}`);
      }
      
      if (data.success) {
        console.log('✅ Dépense supprimée avec succès');
        setAlerte({ type: 'success', message: data.message || 'Dépense supprimée avec succès' });
        setModalSupprimerDepenseOpen(false);
        
        await Promise.all([
          chargerBudgets(),
          chargerDepenses()
        ]);
      } else {
        console.error('❌ API retourne success:false');
        throw new Error(data.erreur || data.message || 'Erreur lors de la suppression de la dépense');
      }
    } catch (error: any) {
      console.error('❌ Erreur complète suppression dépense:', error);
      setAlerte({ 
        type: 'error', 
        message: error.message || 'Erreur lors de la suppression de la dépense. Veuillez réessayer.' 
      });
    } finally {
      setChargement(false);
    }
  };

  const handleExportBudgets = () => {
    setExportChargement(true);
    try {
      const budgetsFiltres = budgets.filter(budget => {
        if (filtreCategorie && budget.categorie !== filtreCategorie) return false;
        if (filtreStatut && budget.statut !== filtreStatut) return false;
        if (anneeSelectionnee && budget.annee_scolaire !== anneeSelectionnee) return false;
        return true;
      });

      ExportService.exportBudgetsToExcel(budgetsFiltres, {
        filename: `budgets_${anneeSelectionnee}_${new Date().toISOString().split('T')[0]}.xlsx`,
        sheetName: `Budgets ${anneeSelectionnee}`
      });

      setAlerte({ type: 'success', message: `Export des budgets (${budgetsFiltres.length}) réalisé avec succès` });
    } catch (error) {
      console.error('Erreur export budgets:', error);
      setAlerte({ type: 'error', message: 'Erreur lors de l\'export des budgets' });
    } finally {
      setExportChargement(false);
    }
  };

  const handleExportDepenses = () => {
    setExportChargement(true);
    try {
      ExportService.exportDepensesToExcel(depenses, {
        filename: `depenses_${anneeSelectionnee}_${new Date().toISOString().split('T')[0]}.xlsx`,
        sheetName: `Dépenses ${anneeSelectionnee}`
      });

      setAlerte({ type: 'success', message: `Export des dépenses (${depenses.length}) réalisé avec succès` });
    } catch (error) {
      console.error('Erreur export dépenses:', error);
      setAlerte({ type: 'error', message: 'Erreur lors de l\'export des dépenses' });
    } finally {
      setExportChargement(false);
    }
  };

  const handleExportStatistiques = () => {
    try {
      ExportService.exportStatistiquesToExcel(statistiquesFiltrees, {
        filename: `statistiques_${anneeSelectionnee}_${new Date().toISOString().split('T')[0]}.xlsx`
      });

      setAlerte({ type: 'success', message: 'Export des statistiques réalisé avec succès' });
    } catch (error) {
      console.error('Erreur export statistiques:', error);
      setAlerte({ type: 'error', message: 'Erreur lors de l\'export des statistiques' });
    }
  };

  const handleExportGraphiques = () => {
    try {
      const graphiquesData = [
        {
          title: 'Répartition des Dépenses par Catégorie',
          headers: [['Catégorie', 'Montant', 'Pourcentage']],
          data: statistiquesFiltrees.depensesParCategorie.map(cat => ({
            catégorie: cat.categorie,
            montant: cat.montant,
            pourcentage: `${cat.pourcentage?.toFixed(2)}%`
          }))
        },
        {
          title: 'Dépenses par Mois',
          headers: [['Mois', 'Montant']],
          data: statistiquesFiltrees.depensesParMois.map(mois => ({
            mois: mois.mois,
            montant: mois.montant
          }))
        },
        {
          title: 'Budget vs Dépenses par Catégorie',
          headers: [['Catégorie', 'Budget Alloué', 'Dépenses']],
          data: statistiquesFiltrees.evolutionBudgets.map(budget => ({
            catégorie: budget.mois,
            budgetAlloué: budget.alloue,
            dépenses: budget.depense
          }))
        }
      ];

      ExportService.exportGraphiques(graphiquesData, {
        filename: `graphiques_${anneeSelectionnee}_${new Date().toISOString().split('T')[0]}.xlsx`
      });

      setAlerte({ type: 'success', message: 'Export des graphiques réalisé avec succès' });
    } catch (error) {
      console.error('Erreur export graphiques:', error);
      setAlerte({ type: 'error', message: 'Erreur lors de l\'export des graphiques' });
    }
  };

  // ==================== STATISTIQUES ====================

  const statistiques = useMemo<StatistiquesBudget>(() => {
    const totalBudgets = budgets.length;
    const totalAlloue = budgets.reduce((acc, b) => acc + b.montant_alloue, 0);
    const totalDepense = budgets.reduce((acc, b) => acc + b.montant_depense, 0);
    const pourcentageUtilisation = totalAlloue > 0 ? (totalDepense / totalAlloue) * 100 : 0;
    
    const budgetsDepasses = budgets.filter(b => b.statut === 'depasse').length;
    const budgetsEnAlerte = budgets.filter(b => b.statut === 'en_alerte').length;
    
    const depensesParMois = depenses.reduce((acc, depense) => {
      const mois = new Date(depense.date_depense).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      const existing = acc.find(item => item.mois === mois);
      
      if (existing) {
        existing.montant += depense.montant;
      } else {
        acc.push({ mois, montant: depense.montant });
      }
      
      return acc;
    }, [] as Array<{mois: string, montant: number}>);
    
    const depensesParCategorie = budgets.map(budget => {
      const depensesCategorie = depenses.filter(d => d.budget_id === budget.id);
      const montant = depensesCategorie.reduce((acc, d) => acc + d.montant, 0);
      
      return {
        categorie: getLabelCategorie(budget.categorie),
        montant,
        pourcentage: totalDepense > 0 ? (montant / totalDepense) * 100 : 0
      };
    }).filter(item => item.montant > 0);
    
    const depensesParType = depenses.reduce((acc, depense) => {
      const typeLabel = typesDepense.find(t => t.value === depense.type_depense)?.label || depense.type_depense;
      const existing = acc.find(item => item.type === typeLabel);
      
      if (existing) {
        existing.montant += depense.montant;
      } else {
        acc.push({ type: typeLabel, montant: depense.montant });
      }
      
      return acc;
    }, [] as Array<{type: string, montant: number}>);
    
    const evolutionBudgets = budgets.map(budget => ({
      mois: getLabelCategorie(budget.categorie),
      alloue: budget.montant_alloue,
      depense: budget.montant_depense
    }));

    return {
      totalBudgets,
      totalAlloue,
      totalDepense,
      pourcentageUtilisation,
      budgetsDepasses,
      budgetsEnAlerte,
      depensesParMois,
      depensesParCategorie,
      depensesParType,
      evolutionBudgets
    };
  }, [budgets, depenses, getLabelCategorie, typesDepense]);

  // ==================== RENDU ====================

  return (
    <div className={`conteneur-gestion-budget ${parametresApp?.theme_defaut || 'clair'}`}>
      <div className="en-tete-fixe-finance">
        <div className="conteneur-en-tete-fixe-finance">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span style={{ fontSize: '22px' }}>📋</span>
              <span style={{fontSize: '24px', fontWeight: '600'}}>
                Gestion Budgétaire ({anneeSelectionnee})
              </span>
            </div>
          <div className="actions-globales">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <PrintComponent
              ref={printBudgetsRef}
              data={budgets}
              type="budgets"
              filters={{
                année: anneeSelectionnee,
                catégorie: filtreCategorie || 'Toutes',
                statut: filtreStatut || 'Tous'
              }}
              onBeforePrint={() => console.log('Impression budgets...')}
              onAfterPrint={() => setAlerte({ type: 'success', message: 'Impression des budgets terminée' })}
            />
            <PrintComponent
              ref={printDepensesRef}
              data={depenses}
              type="depenses"
              filters={{
                année: anneeSelectionnee,
                période: `${filtresDepenses.date_debut} à ${filtresDepenses.date_fin}`,
                budget: filtresDepenses.budget_id ? budgets.find(b => b.id === parseInt(filtresDepenses.budget_id))?.categorie : 'Tous'
              }}
              onBeforePrint={() => console.log('Impression dépenses...')}
              onAfterPrint={() => setAlerte({ type: 'success', message: 'Impression des dépenses terminée' })}
            />
          </div>
          <button className="bouton-success-modern" onClick={() => handleOuvrirModalDepense()}>
            ➕ Nouvelle Dépense
          </button>
          <button className="bouton-primaire" onClick={handleOuvrirModalBudget}>
            🏦 Nouveau Budget
          </button>
        </div>
        </div>
      </div>

      
      <div className="entete-bud-dep">
        <h3>🏦 Budgets</h3>
      </div>

      {/* Alertes */}
      {alerte && (
        <div className={`alerte-modern ${alerte.type === 'success' ? 'alerte-succes-modern' : alerte.type === 'warning' ? 'alerte-avertissement' : 'alerte-erreur-modern'}`}>
          <div className="contenu-alerte-modern">
            <div className="icone-alerte-modern">
              {alerte.type === 'success' ? '✅' : alerte.type === 'warning' ? '⚠️' : '❌'}
            </div>
            <div className="texte-alerte-modern">
              <span className="message-alerte">{alerte.message}</span>
            </div>
            <button className="bouton-fermer-alerte-modern" onClick={() => setAlerte(null)}>
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Tableau des budgets */}
      <div className="section-budgets">
        <div className="">
          <div className="carte-filtres">
            <div className="grille-filtres">
              <div className="groupe-champ">
                <label>Année scolaire</label>
                <select value={anneeSelectionnee} onChange={(e) => setAnneeSelectionnee(e.target.value)}>
                  <option value="2023-2024">2023-2024</option>
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                  <option value="2026-2027">2026-2027</option>
                </select>
              </div>
              
              <div className="groupe-champ">
                <label>Catégorie</label>
                <select value={filtreCategorie} onChange={(e) => setFiltreCategorie(e.target.value)}>
                  <option value="">Toutes les catégories</option>
                  {categoriesBudget.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="groupe-champ">
                <label>Statut</label>
                <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)}>
                  <option value="">Tous les statuts</option>
                  <option value="dans_les_normes">Dans les normes</option>
                  <option value="en_alerte">En alerte</option>
                  <option value="depasse">Dépassé</option>
                </select>
              </div>
              
              <div className="groupe-champ">
                <button className="bouton-secondaire" onClick={() => { setFiltreCategorie(''); setFiltreStatut(''); }}>
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>
          <div className="entete-tableau">
            <h3></h3>
            <div className="info-pagination">
              {budgets.length} budget(s) trouvé(s)
            </div>
            <div className="actions-budget">
              <button 
                className="bouton-info" 
                onClick={() => printBudgetsRef.current?.handlePrint()}
                disabled={budgets.length === 0}
                title="Imprimer la liste des budgets"
                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                🖨️ Imprimer Budgets
              </button>
              <button 
                className="bouton-secondaire" 
                onClick={handleExportBudgets}
                disabled={exportChargement || budgets.length === 0}
                title="Exporter les budgets en Excel"
                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                {exportChargement ? '⏳' : '📊'} Export Budgets
              </button>
            </div>
          </div>
          
          {chargement ? (
            <div className="chargement-tableau">
              <div className="spinner"></div>
              <p>Chargement des budgets...</p>
            </div>
          ) : budgets.length === 0 ? (
            <div className="aucune-donnee">
              <p>Aucun budget trouvé pour cette année scolaire</p>
              <button className="bouton-primaire" onClick={handleOuvrirModalBudget}>
                Créer un premier budget
              </button>
            </div>
          ) : (
            <div className="tableau-simple">
              <table>
                <thead>
                  <tr>
                    <th>N°</th>
                    <th>Catégorie</th>
                    <th>Budget Alloué</th>
                    <th>Dépenses</th>
                    <th>Utilisation</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map((budget, index) => {
                    const pourcentage = calculerPourcentageUtilisation(budget);
                    const statut = getStatutBudget(pourcentage);
                    const couleurStatut = getCouleurStatut(statut);
                    
                    return (
                      <tr key={budget.id}>
                        <td>{index + 1}</td>
                        <td>
                          <div className="categorie-budget">
                            <span className="style2">{getLabelCategorie(budget.categorie)}</span>
                            {budget.description && <small>{budget.description}</small>}
                          </div>
                        </td>
                        <td>
                          <span className="style3">{formaterMontant(budget.montant_alloue)}</span>
                        </td>
                        <td className="montant-cell">
                          <span className="style4">{formaterMontant(budget.montant_depense)}</span>
                        </td>
                        <td>
                          <div className="progression-budget">
                            <div className="barre-progression">
                              <div 
                                className="remplissage-progression"
                                style={{ 
                                  width: `${Math.min(pourcentage, 100)}%`,
                                  backgroundColor: couleurStatut
                                }}
                              ></div>
                            </div>
                            <span className="style2">{pourcentage.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge-statut" style={{ backgroundColor: couleurStatut }}>
                            {statut === 'depasse' ? 'Dépassé' : statut === 'en_alerte' ? 'En alerte' : 'Dans les normes'}
                          </span>
                        </td>
                        <td>
                          <div className="actions-budget">
                            <button className="action-button details" onClick={() => handleOuvrirDetailsBudget(budget)} title="Détails">
                              👁️
                            </button>
                            <button className="action-button depense" onClick={() => handleOuvrirModalDepense(budget)} title="Ajouter dépense">
                              ➕
                            </button>
                            <button className="action-button edit" onClick={() => handleOuvrirModifierBudget(budget)} title="Modifier">
                              ✏️
                            </button>
                            <button className="action-button delete" onClick={() => handleOuvrirSupprimerBudget(budget)} title="Supprimer">
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {budgets.length > 0 && (
                  <tfoot>
                    <tr style={{ backgroundColor: '#f8fafc'}}>
                      <td style={{ 
                        textAlign: 'center',
                        color: '#64748b',
                        fontStyle: 'italic',
                        fontSize: '12px'
                      }}>
                        Total
                      </td>
                      <td style={{ color: '#64748b', fontStyle: 'italic' }}>
                        {budgets.length} budgets
                      </td>
                      <td className="montant-cell">
                        <span className="montant" style={{ color: '#059669' }}>
                          {formaterMontant(budgets.reduce((sum, b) => sum + b.montant_alloue, 0))}
                        </span>
                      </td>
                      <td className="montant-cell">
                        <span className="montant-depense" style={{ color: '#dc2626' }}>
                          {formaterMontant(budgets.reduce((sum, b) => sum + b.montant_depense, 0))}
                        </span>
                      </td>
                      <td>
                        <div className="progression-budget">
                          <span className="pourcentage-progression" style={{ fontWeight: 'bold' }}>
                            {budgets.reduce((sum, b) => sum + b.montant_alloue, 0) > 0 
                              ? ((budgets.reduce((sum, b) => sum + b.montant_depense, 0) / budgets.reduce((sum, b) => sum + b.montant_alloue, 0)) * 100).toFixed(1)
                              : '0.0'}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <span style={{
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            backgroundColor: '#28a745',
                            color: 'white'
                          }}>
                            {budgets.filter(b => b.statut === 'dans_les_normes').length} Normaux
                          </span>
                          <span style={{
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            backgroundColor: '#ffc107',
                            color: '#000'
                          }}>
                            {budgets.filter(b => b.statut === 'en_alerte').length} Alertes
                          </span>
                          <span style={{
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            backgroundColor: '#dc3545',
                            color: 'white'
                          }}>
                            {budgets.filter(b => b.statut === 'depasse').length} Dépassés
                          </span>
                        </div>
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Tableau des dépenses */}
      <div className="section-depenses">
        <div className="entete-bud-dep">
          <h3>📋 Dépenses</h3>
        </div>
        <div className="">
          <div className="carte-filtres">
            <div className="grille-filtres">
              <div className="groupe-champ">
                <label>Date début</label>
                <input 
                  type="date" 
                  value={filtresDepenses.date_debut}
                  onChange={(e) => setFiltresDepenses({...filtresDepenses, date_debut: e.target.value})}
                />
              </div>
              
              <div className="groupe-champ">
                <label>Date fin</label>
                <input 
                  type="date" 
                  value={filtresDepenses.date_fin}
                  onChange={(e) => setFiltresDepenses({...filtresDepenses, date_fin: e.target.value})}
                />
              </div>
              
              <div className="groupe-champ">
                <label>Budget</label>
                <select 
                  value={filtresDepenses.budget_id}
                  onChange={(e) => setFiltresDepenses({...filtresDepenses, budget_id: e.target.value})}
                >
                  <option value="">Tous les budgets</option>
                  {budgets.map(budget => (
                    <option key={budget.id} value={budget.id}>
                      {getLabelCategorie(budget.categorie)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="groupe-champ">
                <label>Type dépense</label>
                <select 
                  value={filtresDepenses.type_depense}
                  onChange={(e) => setFiltresDepenses({...filtresDepenses, type_depense: e.target.value})}
                >
                  <option value="">Tous les types</option>
                  {typesDepense.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="groupe-champ">
                <label>Mode paiement</label>
                <select 
                  value={filtresDepenses.mode_paiement}
                  onChange={(e) => setFiltresDepenses({...filtresDepenses, mode_paiement: e.target.value})}
                >
                  <option value="">Tous les modes</option>
                  {modesPaiement.map(mode => (
                    <option key={mode.value} value={mode.value}>{mode.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="groupe-champ">
                <label>Statut</label>
                <select 
                  value={filtresDepenses.statut}
                  onChange={(e) => setFiltresDepenses({...filtresDepenses, statut: e.target.value})}
                >
                  <option value="">Tous les statuts</option>
                  {statutsDepense.map(statut => (
                    <option key={statut.value} value={statut.value}>{statut.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="groupe-champ">
                <label>Montant min</label>
                <input 
                  type="number"
                  placeholder="0"
                  value={filtresDepenses.montant_min}
                  onChange={(e) => setFiltresDepenses({...filtresDepenses, montant_min: e.target.value})}
                />
              </div>
              
              <div className="groupe-champ">
                <label>Montant max</label>
                <input 
                  type="number"
                  placeholder="Max"
                  value={filtresDepenses.montant_max}
                  onChange={(e) => setFiltresDepenses({...filtresDepenses, montant_max: e.target.value})}
                />
              </div>
              <div style={{ marginLeft: '8px', gap: '20px', display: 'flex' }}>
                <button className="bouton-secondaire" onClick={() => {
                  const maintenant = new Date();
                  const premierJourMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
                  const dernierJourMois = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 0);
                  
                  setFiltresDepenses({
                    date_debut: premierJourMois.toISOString().split('T')[0],
                    date_fin: dernierJourMois.toISOString().split('T')[0],
                    budget_id: '',
                    type_depense: '',
                    mode_paiement: '',
                    statut: '',
                    beneficiaire: '',
                    montant_min: '',
                    montant_max: ''
                  });
                }}>
                  Réinitialiser
                </button>
                <button className="bouton-primaire" onClick={chargerDepenses}>
                  Appliquer
                </button>
              </div>
            </div>
          </div>
          <div className="entete-tableau">
            <h3></h3>
            <div className="info-pagination">
              {depenses.length} dépense(s) trouvée(s) • Total: {formaterMontant(depenses.reduce((acc, d) => acc + d.montant, 0))}
            </div>
            <div className="actions-budget">
              <button 
                className="bouton-info" 
                onClick={() => printDepensesRef.current?.handlePrint()}
                disabled={depenses.length === 0}
                title="Imprimer la liste des dépenses"
                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                🖨️ Imprimer Dépenses
              </button>
              <button 
                className="bouton-secondaire" 
                onClick={handleExportDepenses}
                disabled={exportChargement || depenses.length === 0}
                title="Exporter les dépenses en Excel"
                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                {exportChargement ? '⏳' : '📋'} Export Dépenses
              </button>
            </div>
          </div>
          
          {chargementDepenses ? (
            <div className="chargement-tableau">
              <div className="spinner"></div>
              <p>Chargement des dépenses...</p>
            </div>
          ) : depenses.length === 0 ? (
            <div className="aucune-donnee">
              <p>Aucune dépense trouvée</p>
              <button className="bouton-primaire" onClick={() => handleOuvrirModalDepense()}>
                Créer une première dépense
              </button>
            </div>
          ) : (
            <div className="tableau-scrollable">
              <table>
                <thead>
                  <tr>
                    <th className='index1'>N°</th>
                    <th>Date</th>
                    <th>Descrip.</th>
                    <th>Cat.</th>
                    <th>Type</th>
                    <th>Montant</th>
                    <th>Mode</th>
                    <th>Bénéficiaire</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {depenses.map((depense, index) => {
                    const couleurStatut = getCouleurStatutDepense(depense.statut);
                    
                    return (
                      <tr key={depense.id}>
                        <td>{index + 1}</td>
                        <td className='style5'>{formaterDate(depense.date_depense)}</td>
                        <td>
                          <div className="style2">
                            {depense.description}
                            {depense.numero_facture && <small>Facture: {depense.numero_facture}</small>}
                          </div>
                        </td>
                        <td>
                          <span className="badge-categorie" style={{ backgroundColor: getCouleurCategorie(depense.budget_categorie) }}>
                            {getLabelCategorie(depense.budget_categorie)}
                          </span>
                        </td>
                        <td className="style5">{getLabelTypeDepense(depense.type_depense)}</td>
                        <td className="montant-cell">
                          <span className="style4">{formaterMontant(depense.montant)}</span>
                        </td>
                        <td className="style2">{getLabelModePaiement(depense.mode_paiement)}</td>
                        <td className="style2">{depense.beneficiaire}</td>
                        <td>
                          <span className="badge-statut" style={{ backgroundColor: couleurStatut }}>
                            {getLabelStatutDepense(depense.statut)}
                          </span>
                        </td>
                        <td>
                          <div className="actions-depense">
                            <button className="action-button details" onClick={() => handleOuvrirDetailsDepense(depense)} title="Détails">
                              👁️
                            </button>
                            <button className="action-button edit" onClick={() => handleOuvrirModifierDepense(depense)} title="Modifier">
                              ✏️
                            </button>
                            <button className="action-button delete" onClick={() => handleOuvrirSupprimerDepense(depense)} title="Supprimer">
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {depenses.length > 0 && (
                  <tfoot>
                    <tr>
                      <td></td>
                      <td style={{ 
                        textAlign: 'center',
                        color: '#25292e',
                        fontStyle: 'italic',
                      }}>
                        Total
                      </td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td>
                        <span className="montant-depense" style={{ color: '#dc2626', fontWeight: 'bold' }}>
                          {formaterMontant(depenses.reduce((sum, d) => sum + d.montant, 0))}
                        </span>
                      </td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="section-statistiques">
        <div className="entete-tableau">
          <h3>Statistiques Globales</h3>   
          <PrintComponent
            ref={printStatsRef}
            data={statistiques}
            type="statistiques"
            onBeforePrint={() => console.log('Impression statistiques...')}
            onAfterPrint={() => setAlerte({ type: 'success', message: 'Impression des statistiques terminée' })}
          /> 
          <div className="actions-budget">
            <button 
              className="bouton-info" 
              onClick={() => printStatsRef.current?.handlePrint()}
              title="Imprimer les statistiques"
              style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              📊 Imprimer Stats
            </button>         
            <button 
              className="bouton-secondaire" 
              onClick={handleExportStatistiques}
              disabled={exportChargement}
              title="Exporter les statistiques en Excel"
              style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              📈 Export Stats
            </button>
          </div>
        </div>
        <div className="cartes-statistiques">
          <div className="carte-statistique">
            <div className="icone-statistique">💰</div>
            <div className="contenu-statistique">
              <h3>Budget Total</h3>
              <div className="valeur-statistique-dep">{formaterMontant(statistiques.totalAlloue)}</div>
              <div className="sous-titre">{statistiques.totalBudgets} budgets</div>
            </div>
          </div>
          
          <div className="carte-statistique">
            <div className="icone-statistique">📊</div>
            <div className="contenu-statistique">
              <h3>Dépenses Total</h3>
              <div className="valeur-statistique-dep">{formaterMontant(statistiques.totalDepense)}</div>
              <div className="sous-titre">{statistiques.pourcentageUtilisation.toFixed(1)}% d'utilisation</div>
            </div>
          </div>
          
          <div className="carte-statistique">
            <div className="icone-statistique">⏳</div>
            <div className="contenu-statistique">
              <h3>Reste à Planifier</h3>
              <div className="valeur-statistique-dep">{formaterMontant(statistiques.totalAlloue - statistiques.totalDepense)}</div>
              <div className="sous-titre">Disponible</div>
            </div>
          </div>
          
          <div className="carte-statistique">
            <div className="icone-statistique">⚠️</div>
            <div className="contenu-statistique">
              <h3>Alertes Budget</h3>
              <div className="valeur-statistique-dep">
                {statistiques.budgetsDepasses + statistiques.budgetsEnAlerte}
              </div>
              <div className="sous-titre">
                ({statistiques.budgetsDepasses} dépassés, {statistiques.budgetsEnAlerte} en alerte)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="entete-tableau">
        <h3>Graphiques Globales</h3>   
        <PrintComponent
          ref={printStatsRef}
          data={statistiques}
          type="statistiques"
          onBeforePrint={() => console.log('Impression statistiques...')}
          onAfterPrint={() => setAlerte({ type: 'success', message: 'Impression des statistiques terminée' })}
        /> 
        <PrintGraphiquesVisual
          statistiques={statistiques}
          onBeforePrint={() => {
            console.log('Début impression graphiques...');
            setAlerte({ type: 'success', message: 'Génération des graphiques en cours...' });
          }}
          onAfterPrint={() => {
            setAlerte({ type: 'success', message: 'Graphiques générés avec succès' });
          }}
          disabled={statistiques.totalBudgets === 0}
        >
          Imprimer Graphiques
        </PrintGraphiquesVisual>
      </div>     
        
      <div className="section-graphiques">
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          borderRadius: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h4 style={{ margin: '0 0 15px 0'}}>
            📅 Filtres Temporels pour les Graphiques
          </h4>
          
          <div style={{
            display: 'flex',
            gap: '15px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>
                Période :
              </label>
              <select 
                value={periodeGraphique}
                onChange={(e) => setPeriodeGraphique(e.target.value as any)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  minWidth: '150px'
                }}
              >
                <option value="jour">Aujourd'hui</option>
                <option value="semaine">Cette semaine</option>
                <option value="mois">Ce mois</option>
                <option value="trimestre">Ce trimestre</option>
                <option value="annee">Cette année</option>
                <option value="personnalise">Période personnalisée</option>
              </select>
            </div>
            
            {periodeGraphique === 'personnalise' && (
              <>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>
                    Du :
                  </label>
                  <input 
                    type="date"
                    value={dateDebutPersonnalisee}
                    onChange={(e) => setDateDebutPersonnalisee(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>
                    Au :
                  </label>
                  <input 
                    type="date"
                    value={dateFinPersonnalisee}
                    onChange={(e) => setDateFinPersonnalisee(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </>
            )}
            
            <button 
              onClick={() => {
                setPeriodeGraphique('mois');
                setDateDebutPersonnalisee('');
                setDateFinPersonnalisee('');
              }}
              style={{
                padding: '6px 12px',
                backgroundColor: '#f8fafc',
                color: '#64748b',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.75rem'
              }}
            >
              Réinitialiser
            </button>
          </div>
        </div>
        
        <div className="grille-graphiques">
          {/* Graphique 1 */}
          <div className="carte-graphique">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h4 style={{ margin: 0}}>
                Répartition des Dépenses par Catégorie
                <span style={{ fontSize: '0.75rem', marginLeft: '10px' }}>
                  ({statistiquesFiltrees.depensesParCategorie.length} catégories)
                </span>
              </h4>
            </div>
            
            {statistiquesFiltrees.depensesParCategorie.length === 0 ? (
              <div style={{ 
                height: '300px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center'
              }}>
                Aucune donnée pour la période sélectionnée
              </div>
            ) : (
              <div className="graphique-container" style={{ height: '350px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statistiquesFiltrees.depensesParCategorie}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="montant"
                    >
                      {statistiquesFiltrees.depensesParCategorie.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getCouleurCategorie(entry.categorie)} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formaterMontant(value as number)}
                    />
                    <Legend 
                      layout="vertical"
                      verticalAlign="middle"
                      align="right"
                      wrapperStyle={{
                        paddingLeft: '20px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          
          {/* Graphique 2 */}
          <div className="carte-graphique">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h4 style={{ margin: 0}}>
                Évolution des Dépenses 
              </h4>
            </div>
            
            {statistiquesFiltrees.depensesParMois.length === 0 ? (
              <div style={{ 
                height: '300px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center'
              }}>
                Aucune donnée pour la période sélectionnée
              </div>
            ) : (
              <div className="graphique-container" style={{ height: '350px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={statistiquesFiltrees.depensesParMois}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="mois" 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickLine={{ stroke: '#cbd5e1' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickLine={{ stroke: '#cbd5e1' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickFormatter={(value) => formaterMontantCompact(value)}
                    />
                    <Tooltip 
                      formatter={(value) => [formaterMontant(value as number), 'Montant']}
                      labelFormatter={(label) => `Mois: ${label}`}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="montant" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ r: 6, strokeWidth: 2, stroke: '#ffffff' }}
                      activeDot={{ r: 8, strokeWidth: 2, stroke: '#ffffff' }}
                      name="Dépenses"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          
          {/* Graphique 3 */}
          <div className="carte-graphique">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h4 style={{ margin: 0}}>
                Budget vs Dépenses par Catégorie
                <span style={{ fontSize: '0.75rem', marginLeft: '10px' }}>
                  ({statistiquesFiltrees.evolutionBudgets.length} catégories)
                </span>
              </h4>
            </div>
            
            {statistiquesFiltrees.evolutionBudgets.length === 0 ? (
              <div style={{ 
                height: '300px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center'
              }}>
                Aucune donnée pour la période sélectionnée
              </div>
            ) : (
              <div className="graphique-container" style={{ height: '350px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={statistiquesFiltrees.evolutionBudgets}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="mois" 
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickLine={{ stroke: '#cbd5e1' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickLine={{ stroke: '#cbd5e1' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickFormatter={(value) => formaterMontantCompact(value)}
                    />
                    <Tooltip 
                      formatter={(value) => [formaterMontant(value as number), 'Montant']}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend 
                      verticalAlign="top"
                      height={36}
                    />
                    <Bar 
                      dataKey="alloue" 
                      name="Budget alloué" 
                      fill="#10b981" 
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="depense" 
                      name="Dépenses réelles" 
                      fill="#3b82f6" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modales */}
      {modalBudgetOpen && (
        <ModalBudget 
          mode="creation"
          formBudget={formBudget}
          setFormBudget={setFormBudget}
          categoriesBudget={categoriesBudget}
          anneeSelectionnee={anneeSelectionnee}
          chargement={chargement}
          onSubmit={handleSoumettreBudget}
          onClose={() => setModalBudgetOpen(false)}
          formaterMontant={formaterMontant}
          parametresEcole={parametresEcole}
        />
      )}

      {modalModifierBudgetOpen && budgetSelectionne && (
        <ModalBudget 
          mode="modification"
          formBudget={formBudget}
          setFormBudget={setFormBudget}
          categoriesBudget={categoriesBudget}
          anneeSelectionnee={anneeSelectionnee}
          chargement={chargement}
          onSubmit={handleModifierBudget}
          onClose={() => setModalModifierBudgetOpen(false)}
          budgetSelectionne={budgetSelectionne}
          formaterMontant={formaterMontant}
          parametresEcole={parametresEcole}
        />
      )}

      {modalDepenseOpen && (
        <ModalDepense 
          mode="creation"
          formDepense={formDepense}
          setFormDepense={setFormDepense}
          budgets={budgets}
          categoriesBudget={categoriesBudget}
          typesDepense={typesDepense}
          sousCategoriesParType={sousCategoriesParType}
          modesPaiement={modesPaiement}
          statutsDepense={statutsDepense}
          chargement={chargement}
          onSubmit={handleSoumettreDepense}
          onClose={() => setModalDepenseOpen(false)}
          budgetPourDepense={budgetPourDepense}
          formaterMontant={formaterMontant}
          getLabelCategorie={getLabelCategorie}
        />
      )}

      {modalModifierDepenseOpen && depenseSelectionnee && (
        <ModalDepense 
          mode="modification"
          formDepense={formDepense}
          setFormDepense={setFormDepense}
          budgets={budgets}
          categoriesBudget={categoriesBudget}
          typesDepense={typesDepense}
          sousCategoriesParType={sousCategoriesParType}
          modesPaiement={modesPaiement}
          statutsDepense={statutsDepense}
          chargement={chargement}
          onSubmit={handleModifierDepense}
          onClose={() => setModalModifierDepenseOpen(false)}
          depenseSelectionnee={depenseSelectionnee}
          formaterMontant={formaterMontant}
          getLabelCategorie={getLabelCategorie}
        />
      )}

      {modalDetailsBudgetOpen && budgetSelectionne && (
        <ModalDetailsBudget 
          budget={budgetSelectionne}
          depenses={depensesBudgetSelectionne}
          onClose={() => {
            setModalDetailsBudgetOpen(false);
            setDepensesBudgetSelectionne([]);
          }}
          formaterMontant={formaterMontant}
          formaterDate={formaterDate}
          getLabelCategorie={getLabelCategorie}
          getLabelTypeDepense={getLabelTypeDepense}
          getLabelStatutDepense={getLabelStatutDepense}
          getCouleurStatutDepense={getCouleurStatutDepense}
        />
      )}

      {modalDetailsDepenseOpen && depenseSelectionnee && (
        <ModalDetailsDepense 
          depense={depenseSelectionnee}
          onClose={() => setModalDetailsDepenseOpen(false)}
          formaterMontant={formaterMontant}
          formaterDate={formaterDate}
          getLabelCategorie={getLabelCategorie}
          getLabelTypeDepense={getLabelTypeDepense}
          getLabelModePaiement={getLabelModePaiement}
          getLabelStatutDepense={getLabelStatutDepense}
          getCouleurStatutDepense={getCouleurStatutDepense}
          typesDepense={typesDepense}
          modesPaiement={modesPaiement}
        />
      )}

      {modalSupprimerBudgetOpen && budgetSelectionne && (
        <ModalConfirmation 
          type="budget"
          onConfirm={handleSupprimerBudget}
          onCancel={() => setModalSupprimerBudgetOpen(false)}
          message={`Êtes-vous sûr de vouloir supprimer le budget "${getLabelCategorie(budgetSelectionne.categorie)}" ? Cette action est irréversible.`}
          itemNom={getLabelCategorie(budgetSelectionne.categorie)}
        />
      )}

      {modalSupprimerDepenseOpen && depenseSelectionnee && (
        <ModalConfirmation 
          type="depense"
          onConfirm={handleSupprimerDepense}
          onCancel={() => setModalSupprimerDepenseOpen(false)}
          message={`Êtes-vous sûr de vouloir supprimer la dépense "${depenseSelectionnee.description}" de ${formaterMontant(depenseSelectionnee.montant)} ?`}
          itemNom={depenseSelectionnee.description}
        />
      )}

      <style jsx>{`
        .en-tete-budget {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          padding-bottom: 5px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .en-tete-budget h2 {
          margin: 0;
          color: #1e293b;
          font-size: 1.3rem;
        }
        
        .sous-titre-budget {
          margin: 4px 0 0 0;
          font-size: 14px;
          color: #6b7280;
        }
        
        .actions-budget {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        
        .bouton-primaire {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .bouton-primaire:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }
        
        .bouton-secondaire {
          background: #64748b;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .bouton-secondaire:hover {
          background: #475569;
          transform: translateY(-1px);
        }
        
        .bouton-success-modern {
          background: #10b981;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .bouton-success-modern:hover {
          background: #059669;
          transform: translateY(-1px);
        }
        
        .bouton-info {
          background: #8b5cf6;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .bouton-info:hover {
          background: #7c3aed;
          transform: translateY(-1px);
        }
        
        
        .grille-filtres {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }
        
        .groupe-champ {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .groupe-champ label {
          font-size: 0.875rem;
          color: #64748b;
          font-weight: 500;
        }
        
        .groupe-champ input,
        .groupe-champ select {
          padding: 8px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.875rem;
        }
        
        .entete-tableau {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 20px 0;
        }
        
        .info-pagination {
          color: #64748b;
          font-size: 0.875rem;
        }
        
        .tableau-scrollable {
          overflow-x: auto;
          background: white;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
        }
        
        th {
          background: #f8fafc;
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          color: #475569;
          border-bottom: 2px solid #e2e8f0;
          white-space: nowrap;
        }
        
        td {
          padding: 16px;
          border-bottom: 1px solid #e2e8f0;
          color: #475569;
        }
        
        tr:hover {
          background: #f8fafc;
        }
        
        .categorie-budget {
          display: flex;
          flex-direction: column;
        }
        
        .categorie-budget small {
          color: #64748b;
          font-size: 0.75rem;
          margin-top: 2px;
        }
        
        .montant-cell {
          font-weight: 600;
        }
        
        .progression-budget {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .barre-progression {
          flex: 1;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .remplissage-progression {
          height: 100%;
          transition: width 0.3s ease;
        }
        
        .badge-statut {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
        }
        
        .badge-categorie {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
        }
        
        .actions-budget,
        .actions-depense {
          display: flex;
          gap: 6px;
        }
        
        .action-button {
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        
        .action-button.details {
          background: #dbeafe;
          color: #1e40af;
        }
        
        .action-button.details:hover {
          background: #bfdbfe;
          transform: translateY(-2px);
        }
        
        .action-button.edit {
          background: #fef3c7;
          color: #92400e;
        }
        
        .action-button.edit:hover {
          background: #fde68a;
          transform: translateY(-2px);
        }
        
        .action-button.delete {
          background: #fee2e2;
          color: #991b1b;
        }
        
        .action-button.delete:hover {
          background: #fecaca;
          transform: translateY(-2px);
        }
        
        .action-button.depense {
          background: #dcfce7;
          color: #166534;
        }
        
        .action-button.depense:hover {
          background: #bbf7d0;
          transform: translateY(-2px);
        }
               
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .sous-titre {
          font-size: 0.75rem;
          color: #64748b;
        }
        
        .grille-graphiques {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 20px;
        }
        
        .graphique-container {
          height: 300px;
        }
        
        @media (max-width: 1024px) {
          .grille-graphiques {
            grid-template-columns: 1fr;
          }
        }
        
        @media (max-width: 768px) {
          .en-tete-budget {
            flex-direction: column;
            gap: 20px;
            align-items: stretch;
          }
          
          .actions-budget {
            justify-content: center;
          }
          
          .cartes-statistiques {
            grid-template-columns: 1fr;
          }
          
          .grille-filtres {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}