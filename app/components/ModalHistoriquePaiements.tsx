'use client';

import { useState, useEffect, useRef } from 'react';
import ModalImprimerRecu from './ModalImprimerRecu';
import ModalModifierPaiement from './ModalModifierPaiement';
import ModalSupprimerPaiement from './ModalSupprimerPaiement';
import './GestionFinance.css';

interface Paiement {
  id: number;
  date_paiement: string;
  montant: number;
  mode_paiement: string;
  numero_versement: number | null;
  numero_recu: string;
  categorie_nom: string;
  montant_total: number;
  montant_paye: number;
  notes: string;
  frais_scolaire_id: number;
  statut_paiement?: string;
  statut?: string;
  created_at?: string;
}

interface FraisClasse {
  id: number;
  categorie_nom: string;
  categorie_type: string;
  montant: number;
  periodicite: string;
  annee_scolaire: string;
  statut: string;
}

interface DetailFrais {
  frais_id: number;
  categorie_nom: string;
  categorie_type: string;
  periodicite: string;
  montant_total: number;
  montant_paye: number;
  reste_a_payer: number;
  progression: number;
  statut: string;
  paiements: Array<{
    id: number;
    date_paiement: string;
    montant: number;
    mode_paiement: string;
    numero_versement: number | null;
    numero_recu: string;
    notes: string;
  }>;
}

interface Statistiques {
  total_frais_classe: number;
  total_paye: number;
  total_reste: number;
  nombre_paiements: number;
  progression_globale: number;
  details_par_frais: DetailFrais[];
}

interface ModalHistoriquePaiementsProps {
  isOpen: boolean;
  onClose: () => void;
  eleveId: number;
  eleveNom: string;
  elevePrenom: string;
}

interface ParametresEcole {
  nom_ecole: string;
  adresse: string;
  telephone: string;
  email: string;
  logo_url: string;
  couleur_principale: string;
  slogan?: string;
}

interface RelanceData {
  eleveId: number;
  eleveNom: string;
  elevePrenom: string;
  classe: string;
  telephoneParent: string;
  emailParent: string;
  fraisRestants: Array<{
    categorie: string;
    montantRestant: number;
    prochainVersement?: number;
  }>;
  montantTotalRestant: number;
  anneeScolaire: string;
}

export default function ModalHistoriquePaiements({
  isOpen,
  onClose,
  eleveId,
  eleveNom,
  elevePrenom
}: ModalHistoriquePaiementsProps) {
  const [ongletActif, setOngletActif] = useState<'statistiques' | 'paiements' | 'frais'>('statistiques');
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [fraisClasse, setFraisClasse] = useState<FraisClasse[]>([]);
  const [statistiques, setStatistiques] = useState<Statistiques>({
    total_frais_classe: 0,
    total_paye: 0,
    total_reste: 0,
    nombre_paiements: 0,
    progression_globale: 0,
    details_par_frais: []
  });
  const [classeEleve, setClasseEleve] = useState<{nom: string, niveau: string} | null>(null);
  const [parametresEcole, setParametresEcole] = useState<ParametresEcole | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const [showModalRelance, setShowModalRelance] = useState(false);
  const [relanceData, setRelanceData] = useState<RelanceData | null>(null);
  const [eleveDetails, setEleveDetails] = useState<any>(null);
  const [messageRelance, setMessageRelance] = useState<string>('');
  const [anneeScolaire, setAnneeScolaire] = useState<string>('');

  // ✅ ÉTATS POUR LES MODALES D'ACTIONS
  const [modalReceiptOpen, setModalReceiptOpen] = useState(false);
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
  const [paiementSelectionne, setPaiementSelectionne] = useState<any>(null);

  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [fraisScolaires, setFraisScolaires] = useState<any[]>([]);
  const [fraisEleves, setFraisEleves] = useState<any[]>([]);
  const [versements, setVersements] = useState<any[]>([]);
  const [classeSelectionnee, setClasseSelectionnee] = useState<number | null>(null);
  const [fraisSelectionne, setFraisSelectionne] = useState<any | null>(null);
  const [numeroVersement, setNumeroVersement] = useState<number>(1);
  const [montantTotalScolarite, setMontantTotalScolarite] = useState<number>(0);
  const [montantRestantScolarite, setMontantRestantScolarite] = useState<number>(0);
  const [versementSelectionne, setVersementSelectionne] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && eleveId) {
      chargerDonnees();
    }
  }, [isOpen, eleveId]);

  useEffect(() => {
    const chargerDetailsEleve = async () => {
      if (isOpen && eleveId) {
        try {
          const response = await fetch(`/api/eleves/${eleveId}`);
          const data = await response.json();
          if (data.success) {
            setEleveDetails(data.eleve);
          }
        } catch (error) {
          console.error('Erreur chargement détails élève:', error);
        }
      }
    };
    
    chargerDetailsEleve();
  }, [isOpen, eleveId]);

  useEffect(() => {
    const maintenant = new Date();
    const annee = maintenant.getFullYear();
    const mois = maintenant.getMonth() + 1;
    const anneeScolaire = mois >= 8 ? `${annee}-${annee + 1}` : `${annee - 1}-${annee}`;
    setAnneeScolaire(anneeScolaire);
  }, []);

  useEffect(() => {
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
    
    if (isOpen) {
      chargerParametresEcole();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // ✅ FONCTIONS POUR LES ACTIONS DE PAIEMENT
  const handleImprimerRecu = (paiement: any) => {
    setPaiementSelectionne(paiement);
    setModalReceiptOpen(true);
  };

  const handleModifierPaiement = (paiement: any) => {
    setPaiementSelectionne(paiement);
    setModalEditOpen(true);
  };

  const handleSupprimerPaiement = (paiement: any) => {
    setPaiementSelectionne(paiement);
    setModalDeleteOpen(true);
  };

  const refreshPaiements = () => {
    chargerDonnees();
  };

  const [formPaiement, setFormPaiement] = useState({
  frais_eleve_id: null as number | null,
  frais_scolaire_id: null as number | null,
  eleve_id: eleveId,
  montant: 0,
  date_paiement: new Date().toISOString().split('T')[0],
  mode_paiement: 'especes' as 'especes' | 'cheque' | 'virement' | 'carte' | 'mobile' | 'autre',
  reference_paiement: '',
  notes: '',
  statut: 'paye' as 'paye' | 'en_attente',
  created_by: 1,
  is_versement: false,
  numero_versement: undefined as number | undefined,
  versement_id: undefined as number | undefined
});

const [chargementPaiement, setChargementPaiement] = useState(false);

const chargerClasses = async () => {
  try {
    const response = await fetch('/api/classes');
    const data = await response.json();
    if (data.success) {
      setClasses(data.classes || []);
    }
  } catch (error) {
    console.error('Erreur chargement classes:', error);
  }
};

const chargerFraisScolairesParClasse = async (classeId: number) => {
  try {
    const response = await fetch(`/api/finance/frais-scolaires?classe_id=${classeId}&annee_scolaire=${anneeScolaire}&statut=actif`);
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        setFraisScolaires(data.frais || []);
      }
    }
  } catch (error) {
    console.error('Erreur chargement frais scolaires:', error);
  }
};

const chargerFraisEleve = async (eleveId: number) => {
  try {
    const response = await fetch(`/api/finance/frais-eleves?eleve_id=${eleveId}&annee_scolaire=${anneeScolaire}`);
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        const fraisAvecRestant = (data.frais || []).map((frais: any) => ({
          ...frais,
          frais_restant: frais.montant - frais.montant_paye
        }));
        setFraisEleves(fraisAvecRestant);
      }
    }
  } catch (error) {
    console.error('Erreur chargement frais élève:', error);
  }
};

const chargerVersementsScolarite = async (fraisEleveId: number) => {
  try {
    const response = await fetch(`/api/finance/versements-scolarite?frais_eleve_id=${fraisEleveId}`);
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        setVersements(data.versements || []);
        
        const versementsNonPayes = (data.versements || []).filter((v: any) => 
          v.statut !== 'paye' && v.montant_paye < v.montant_versement
        );
        const prochainVersement = versementsNonPayes.length > 0 
          ? Math.min(...versementsNonPayes.map((v: any) => v.numero_versement))
          : (data.versements?.length || 0) + 1;
        
        if (formPaiement.is_versement) {
          const montantVersement = versementsNonPayes.find((v: any) => 
            v.numero_versement === prochainVersement
          )?.montant_versement || calculerMontantVersement();
          
          setFormPaiement(prev => ({
            ...prev,
            montant: montantVersement,
            numero_versement: prochainVersement
          }));
        }
      }
    }
  } catch (error) {
    console.error('Erreur chargement versements:', error);
  }
};

// Vérifier paiement périodique
const verifierPaiementPeriodique = async (eleveId: number, fraisScolaireId: number, periodicite: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/finance/verifier-paiement-periodique?eleve_id=${eleveId}&frais_scolaire_id=${fraisScolaireId}&periodicite=${periodicite}`);
    if (response.ok) {
      const data = await response.json();
      return data.peut_payer || true;
    }
    return true;
  } catch (error) {
    console.error('Erreur vérification paiement périodique:', error);
    return true;
  }
};

// Vérifier inscription payée
const verifierInscriptionPayee = async (eleveId: number): Promise<boolean> => {
  try {
    const response = await fetch(`/api/finance/verifier-inscription?eleve_id=${eleveId}&annee_scolaire=${anneeScolaire}`);
    if (response.ok) {
      const data = await response.json();
      return data.inscription_payee || false;
    }
    return true;
  } catch (error) {
    console.error('Erreur vérification inscription:', error);
    return true;
  }
};

// Vérifier paiement global scolarité
const verifierPaiementGlobalScolarite = async (eleveId: number, fraisScolaireId: number): Promise<boolean> => {
  try {
    const response = await fetch(
      `/api/finance/verifier-paiement-scolarite?eleve_id=${eleveId}&frais_scolaire_id=${fraisScolaireId}`
    );
    if (response.ok) {
      const data = await response.json();
      return data.peut_payer || true;
    }
    return true;
  } catch (error) {
    console.error('Erreur vérification paiement scolarité:', error);
    return true;
  }
};

// Calculer montant versement
const calculerMontantVersement = (): number => {
  if (!fraisSelectionne || !montantRestantScolarite || numeroVersement < 1) return 0;
  
  if (versements.length === 0) {
    return Math.ceil(montantRestantScolarite / numeroVersement);
  }
  
  const prochainVersement = trouverProchainVersement();
  const versementTrouve = versements.find(v => v.numero_versement === prochainVersement);
  
  if (versementTrouve) {
    return versementTrouve.montant_versement - versementTrouve.montant_paye;
  }
  
  const versementsPayes = versements.filter(v => v.statut === 'paye').length;
  const versementsRestants = Math.max(1, numeroVersement - versementsPayes);
  return Math.ceil(montantRestantScolarite / versementsRestants);
};

// Trouver prochain versement
const trouverProchainVersement = (): number => {
  const versementsNonPayes = versements.filter(v => 
    v.statut !== 'paye' && v.montant_paye < v.montant_versement
  );
  
  if (versementsNonPayes.length > 0) {
    return Math.min(...versementsNonPayes.map(v => v.numero_versement));
  }
  
  return versements.length > 0 ? Math.max(...versements.map(v => v.numero_versement)) + 1 : 1;
};

// Gérer le changement de nombre de versements
const handleNombreVersementsChange = (nombre: number) => {
  if (nombre < 1) return;
  
  // Calculer le prochain versement à payer
  const prochainVersement = trouverProchainVersement();
  
  // Si des versements existent déjà, ajuster le nombre total recommandé
  if (versements.length > 0) {
    const versementsPayes = versements.filter(v => v.statut === 'paye' || v.montant_paye > 0);
    
    if (versementsPayes.length > 0) {
      const dernierNumeroVersementPaye = Math.max(...versementsPayes.map(v => v.numero_versement));
      // Le nombre total de versements doit être au moins égal au dernier versement payé + 1
      const nombreMinimum = dernierNumeroVersementPaye + 1;
      const nombreRecommande = Math.max(nombreMinimum, nombre);
      
      if (nombreRecommande !== nombre) {
        console.log(`🔄 Ajustement automatique: ${nombre} → ${nombreRecommande} versements (basé sur dernier versement #${dernierNumeroVersementPaye})`);
        nombre = nombreRecommande;
      }
    }
  }
  
  setNumeroVersement(nombre);
  
  // Mettre à jour le montant pour le prochain versement
  if (montantRestantScolarite > 0) {
    const prochainVersement = trouverProchainVersement();
    
    // Calculer le montant pour ce versement
    let montantVersement = 0;
    
    if (versements.length > 0) {
      // Si le versement existe déjà, prendre son montant
      const versementExistant = versements.find(v => v.numero_versement === prochainVersement);
      if (versementExistant) {
        montantVersement = versementExistant.montant_versement - versementExistant.montant_paye;
      } else {
        // Sinon, calculer un montant moyen
        const versementsPayes = versements.filter(v => v.statut === 'paye' || v.montant_paye > 0);
        const montantTotalPaye = versementsPayes.reduce((sum, v) => sum + v.montant_paye, 0);
        const resteApresPayes = montantTotalScolarite - montantTotalPaye;
        const versementsRestants = Math.max(1, nombre - versementsPayes.length);
        montantVersement = Math.ceil(resteApresPayes / versementsRestants);
      }
    } else {
      // Pas de versements existants, calculer un montant moyen
      montantVersement = Math.ceil(montantRestantScolarite / nombre);
    }
    
    setFormPaiement(prev => ({
      ...prev,
      montant: montantVersement,
      numero_versement: prochainVersement,
      is_versement: true
    }));
  }
};

const defilerVersEtape = (etapeId: string) => {
  setTimeout(() => {
    const element = document.getElementById(etapeId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, 100);
};

// Gérer la sélection du frais
const handleSelectionFrais = async (frais: any) => {
  setFraisSelectionne(frais);
  setVersementSelectionne(null);
  setNumeroVersement(1);
  
  if (frais.categorie_type === 'scolarite') {
    try {
      const response = await fetch(
        `/api/finance/verifier-inscription?eleve_id=${eleveId}&annee_scolaire=${anneeScolaire}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (!data.inscription_payee) {
          alert('L\'inscription doit être payée avant de pouvoir payer la scolarité.');
          setFraisSelectionne(null);
          return;
        }
      }
    } catch (error) {
      console.error('Erreur vérification inscription:', error);
    }
  }
  
  if (frais.categorie_type !== 'scolarite') {
    const peutPayer = await verifierPaiementPeriodique(eleveId, frais.id, frais.periodicite);
    if (!peutPayer) {
      alert(`Ce frais de type "${frais.periodicite}" a déjà été payé pour la période en cours.`);
      setFraisSelectionne(null);
      return;
    }
  }
  
  const fraisEleveExistant = fraisEleves.find(fe => 
    fe.frais_scolaire_id === frais.id && fe.eleve_id === eleveId
  );
  
  if (fraisEleveExistant) {
    setFormPaiement(prev => ({
      ...prev,
      frais_eleve_id: fraisEleveExistant.id,
      frais_scolaire_id: frais.id,
      montant: fraisEleveExistant.frais_restant || frais.montant - fraisEleveExistant.montant_paye
    }));
    
    setMontantTotalScolarite(frais.montant);
    setMontantRestantScolarite(fraisEleveExistant.frais_restant || frais.montant - fraisEleveExistant.montant_paye);
    
    if (frais.categorie_type === 'scolarite') {
      await chargerVersementsScolarite(fraisEleveExistant.id);
      
      // ✅ Défiler vers la configuration scolarité
      setTimeout(() => {
        const element = document.getElementById('etape-config-scolarite');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
    } else {
      // ✅ Défiler vers les détails du paiement
      setTimeout(() => {
        const element = document.getElementById('etape-details-paiement');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
    }
  } else {
    setFormPaiement(prev => ({
      ...prev,
      frais_eleve_id: null,
      frais_scolaire_id: frais.id,
      montant: frais.montant
    }));
    
    setMontantTotalScolarite(frais.montant);
    setMontantRestantScolarite(frais.montant);
    
    if (frais.categorie_type === 'scolarite') {
      // ✅ Défiler vers la configuration scolarité
      setTimeout(() => {
        const element = document.getElementById('etape-config-scolarite');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
    } else {
      // ✅ Défiler vers les détails du paiement
      setTimeout(() => {
        const element = document.getElementById('etape-details-paiement');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
    }
  }
};

// Gérer la sélection du versement
const handleSelectionVersement = (versementId: number) => {
  const versement = versements.find(v => v.id === versementId);
  if (!versement) return;
  
  setVersementSelectionne(versementId);
  
  const montantDu = versement.montant_versement - versement.montant_paye;
  
  setFormPaiement(prev => ({
    ...prev,
    montant: montantDu,
    numero_versement: versement.numero_versement,
    versement_id: versement.id,
    is_versement: true
  }));
};

// Soumettre le paiement
const handleSoumettrePaiement = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!formPaiement.frais_scolaire_id) {
    alert('Veuillez sélectionner un frais');
    return;
  }
  
  if (formPaiement.montant <= 0) {
    alert('Le montant doit être supérieur à 0');
    return;
  }
  
  if (formPaiement.montant > montantRestantScolarite) {
    alert(`Le montant ne peut pas dépasser ${formaterMontantFCFA(montantRestantScolarite)}`);
    return;
  }
  
  try {
    setChargementPaiement(true);
    
    const paiementData: any = {
      ...formPaiement,
      annee_scolaire: anneeScolaire,
      created_by: 1
    };
    
    if (fraisSelectionne?.categorie_type === 'scolarite' && !formPaiement.is_versement) {
      const peutPayerGlobal = await verifierPaiementGlobalScolarite(
        eleveId,
        formPaiement.frais_scolaire_id!
      );

      if (!peutPayerGlobal) {
        alert('Un paiement global de scolarité a déjà été effectué pour cette année scolaire.');
        setChargementPaiement(false);
        return;
      }
    }
    
    const response = await fetch('/api/finance/paiements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paiementData)
    });
    
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.erreur || 'Erreur lors de l\'enregistrement du paiement');
    }
    
    alert('Paiement enregistré avec succès !');
    
    // Fermer la modale de paiement
    setShowPaiementModal(false);
    
    // Réinitialiser le formulaire
    setFormPaiement({
      frais_eleve_id: null,
      frais_scolaire_id: null,
      eleve_id: eleveId,
      montant: 0,
      date_paiement: new Date().toISOString().split('T')[0],
      mode_paiement: 'especes',
      reference_paiement: '',
      notes: '',
      statut: 'paye',
      created_by: 1,
      is_versement: false,
      numero_versement: undefined,
      versement_id: undefined
    });
    setFraisSelectionne(null);
    setVersements([]);
    
    // Recharger les données
    await chargerDonnees();
    
  } catch (error: any) {
    console.error('❌ Erreur enregistrement paiement:', error);
    alert(error.message || 'Erreur lors de l\'enregistrement du paiement');
  } finally {
    setChargementPaiement(false);
  }
};

// Ouvrir la modale de paiement
const ouvrirModalPaiement = async () => {
  setShowPaiementModal(true);
  await chargerClasses();
  await chargerFraisEleve(eleveId);
  
  // Trouver la classe de l'élève
  if (eleveDetails?.classe_id) {
    setClasseSelectionnee(eleveDetails.classe_id);
    await chargerFraisScolairesParClasse(eleveDetails.classe_id);
  }
};

  const chargerDonnees = async () => {
    if (!eleveId) return;

    try {
      setChargement(true);
      setErreur(null);
      
      console.log(`📡 Chargement historique pour élève ID: ${eleveId}`);
      
      const response = await fetch(`/api/finance/historique-eleve?eleve_id=${eleveId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        cache: 'no-cache'
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Format de réponse invalide (attendu JSON)');
      }
      
      const responseText = await response.text();
      
      if (!responseText || responseText.trim() === '') {
        throw new Error('La réponse du serveur est vide');
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Erreur de parsing JSON:', parseError);
        throw new Error('Données invalides reçues du serveur');
      }
      
      if (!response.ok) {
        throw new Error(data.erreur || `Erreur ${response.status}: ${response.statusText}`);
      }
      
      if (!data.success) {
        throw new Error(data.erreur || 'Erreur inconnue lors du chargement');
      }
      
      if (!data.eleve) {
        throw new Error('Données élève manquantes');
      }
      
      setPaiements(data.paiements || []);
      setFraisClasse(data.frais_classe || []);
      setStatistiques(data.statistiques || {
        total_frais_classe: 0,
        total_paye: 0,
        total_reste: 0,
        nombre_paiements: 0,
        progression_globale: 0,
        details_par_frais: []
      });
      
      if (data.eleve) {
        setEleveDetails(data.eleve);
      }
      
      if (data.eleve?.classe_niveau && data.eleve?.classe_nom) {
        setClasseEleve({
          nom: data.eleve.classe_nom,
          niveau: data.eleve.classe_niveau
        });
      } else if (data.eleve?.classe) {
        const parts = data.eleve.classe.split(' ');
        setClasseEleve({
          nom: parts.slice(1).join(' '),
          niveau: parts[0]
        });
      }
      
    } catch (error: any) {
      console.error('❌ Erreur chargement données historique:', error);
      
      let messageErreur = 'Erreur lors du chargement des données';
      
      if (error.message.includes('JSON')) {
        messageErreur = 'Format de données invalide. Vérifiez la connexion avec le serveur.';
      } else if (error.message.includes('vide')) {
        messageErreur = 'Le serveur n\'a pas retourné de données.';
      } else if (error.message.includes('404')) {
        messageErreur = 'Élève non trouvé dans la base de données.';
      } else if (error.message.includes('500')) {
        messageErreur = 'Erreur interne du serveur. Veuillez réessayer plus tard.';
      } else {
        messageErreur = error.message || 'Erreur inconnue';
      }
      
      setErreur(messageErreur);
      
      setPaiements([]);
      setFraisClasse([]);
      setStatistiques({
        total_frais_classe: 0,
        total_paye: 0,
        total_reste: 0,
        nombre_paiements: 0,
        progression_globale: 0,
        details_par_frais: []
      });
      
    } finally {
      setChargement(false);
    }
  };

  const renderErrorState = () => (
    <div className="error-state-enhanced">
      <div className="error-icon-container">
        <div className="error-icon">⚠️</div>
      </div>
      <h3 className="error-title">Erreur de chargement</h3>
      <p className="error-message">{erreur}</p>
      <div className="error-actions">
        <button className="btn-retry-enhanced" onClick={chargerDonnees}>
          <span className="btn-icon">🔄</span>
          Réessayer
        </button>
        <button className="btn-close-enhanced" onClick={onClose}>
          Fermer
        </button>
      </div>
      <div className="error-tips">
        <p className="tips-title">Conseils de dépannage :</p>
        <ul className="tips-list">
          <li>Vérifiez votre connexion internet</li>
          <li>Rafraîchissez la page</li>
          <li>Contactez l'administrateur système</li>
        </ul>
      </div>
    </div>
  );

  const formaterMontantFCFA = (montant: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant);
  };

  const formaterDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return date;
    }
  };

  const getModePaiementLibelle = (mode: string): string => {
    const modes: Record<string, string> = {
      'especes': 'Espèces',
      'cheque': 'Chèque',
      'virement': 'Virement',
      'carte': 'Carte bancaire',
      'mobile': 'Mobile Money',
      'autre': 'Autre'
    };
    return modes[mode] || mode;
  };

  const getStatutTexte = (statut: string): string => {
    const textes: Record<string, string> = {
      'paye': 'Payé',
      'en_attente': 'En attente',
      'partiel': 'Partiel',
      'en_retard': 'En retard',
      'annule': 'Annulé'
    };
    return textes[statut] || statut;
  };

  const preparerRelance = () => {
    if (!eleveDetails || !classeEleve || !statistiques.details_par_frais.length) return;
    
    const fraisRestants = statistiques.details_par_frais
      .filter(frais => frais.reste_a_payer > 0)
      .map(frais => ({
        categorie: frais.categorie_nom,
        montantRestant: frais.reste_a_payer,
        prochainVersement: frais.periodicite === 'mensuel' ? 1 : undefined
      }));
    
    const montantTotalRestant = fraisRestants.reduce((total, frais) => total + frais.montantRestant, 0);
    
    const messageDefaut = genererMessageRelance({
      eleveNom,
      elevePrenom,
      classe: `${classeEleve.niveau} ${classeEleve.nom}`,
      fraisRestants,
      montantTotalRestant,
      anneeScolaire
    });
    
    const dataRelance: RelanceData = {
      eleveId,
      eleveNom,
      elevePrenom,
      classe: `${classeEleve.niveau} ${classeEleve.nom}`,
      telephoneParent: eleveDetails.telephone_parent || '',
      emailParent: eleveDetails.email_parents || '',
      fraisRestants,
      montantTotalRestant,
      anneeScolaire
    };
    
    setRelanceData(dataRelance);
    setMessageRelance(messageDefaut);
    setShowModalRelance(true);
  };

  const genererMessageRelance = (data: {
    eleveNom: string;
    elevePrenom: string;
    classe: string;
    fraisRestants: Array<{categorie: string, montantRestant: number, periodicite?: string}>;
    montantTotalRestant: number;
    anneeScolaire: string;
  }) => {
    const aujourdhui = new Date();
    const moisSuivant = aujourdhui.getMonth() + 2 > 12 ? 1 : aujourdhui.getMonth() + 2;
    const anneeMoisSuivant = moisSuivant === 1 ? aujourdhui.getFullYear() + 1 : aujourdhui.getFullYear();
    const dateControle = `6/${moisSuivant < 10 ? '0' + moisSuivant : moisSuivant}/${anneeMoisSuivant}`;
    
    let detailsFrais = '';
    if (data.fraisRestants.length > 0) {
      detailsFrais = data.fraisRestants.map(f => {
        const periodicite = f.periodicite ? ` (${getPeriodiciteLibelle(f.periodicite)})` : '';
        return `• ${f.categorie}${periodicite} : ${formaterMontantFCFA(f.montantRestant)}`;
      }).join('\n');
    }
    
    const coordonneesEcole = parametresEcole ? `
    
📞 ${parametresEcole.telephone || 'Non renseigné'}
📧 ${parametresEcole.email || 'Non renseigné'}
📍 ${parametresEcole.adresse || 'Non renseigné'}` : '';
    
    return `🏫 *${parametresEcole?.nom_ecole || 'Établissement Scolaire'}*
📋 *RELANCE DE PAIEMENT*
    
Cher Parent, Sauf erreur de notre part, votre enfant ${data.elevePrenom} ${data.eleveNom}, en classe de ${data.classe}, au titre de l'année scolaire ${data.anneeScolaire}, doit la somme de ${formaterMontantFCFA(data.montantTotalRestant)}.

Détail des frais restants :
${detailsFrais}

Les contrôles s'effectuant à partir du ${dateControle}, tout élève non en règle sera interdit(e) d'accès aux salles de classe.
Nous vous prions de bien vouloir régulariser cette situation dans les plus brefs délais.

_Cordialement,_
*LA COMPTABILITÉ*
${parametresEcole?.nom_ecole || 'Établissement Scolaire'}`;
  };

  const envoyerRelanceWhatsApp = () => {
    if (!relanceData || !relanceData.telephoneParent) {
      alert('Numéro de téléphone du parent non disponible');
      return;
    }
    
    try {
      let numeroPropre = relanceData.telephoneParent.replace(/[\s\+]/g, '');
      
      if (!numeroPropre.startsWith('225')) {
        numeroPropre = '225' + numeroPropre;
      }
      if (!numeroPropre.startsWith('+')) {
        numeroPropre = '+' + numeroPropre;
      }
      
      const message = messageRelance;
      const url = `https://wa.me/${numeroPropre.replace('+', '')}?text=${encodeURIComponent(message)}`;
      
      window.open(url, '_blank', 'noopener,noreferrer');
      
      stockerRelance('whatsapp');
      
      return true;
      
    } catch (error) {
      console.error('❌ Erreur envoi WhatsApp:', error);
      alert('Erreur lors de l\'envoi WhatsApp');
      return false;
    }
  };

  const stockerRelance = async (methode: string) => {
    try {
      const response = await fetch('/api/finance/relances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eleve_id: eleveId,
          parent_telephone: relanceData?.telephoneParent,
          parent_email: relanceData?.emailParent,
          message: messageRelance,
          montant_du: relanceData?.montantTotalRestant,
          methode_envoi: methode,
          statut: 'envoye',
          envoye_par: 1
        })
      });

      const responseText = await response.text();
      
      if (!responseText || responseText.trim() === '') {
        console.log('⚠️ Réponse vide de l\'API relances');
        return { success: false };
      }
      
      const data = JSON.parse(responseText);
      
      if (data.success) {
        console.log('✅ Relance stockée avec succès');
        return { success: true };
      } else {
        console.warn('⚠️ Erreur stockage relance:', data.erreur);
        return { success: false, error: data.erreur };
      }
      
    } catch (error) {
      console.error('❌ Erreur stockage relance:', error);
      return { success: false, error };
    }
  };

  const imprimerRelance = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const styles = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: #333;
          padding: 25mm;
          background: white;
        }
        
        .header-relance {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #667eea;
        }
        
        .header-relance h1 {
          font-size: 24px;
          color: #1a202c;
          margin-bottom: 10px;
        }
        
        .infos-ecole {
          font-size: 12px;
          color: #4a5568;
        }
        
        .content-relance {
          margin-bottom: 30px;
        }
        
        .destinataire {
          margin-bottom: 20px;
        }
        
        .date-lieu {
          text-align: right;
          margin-bottom: 30px;
          font-style: italic;
          color: #718096;
        }
        
        .message-relance {
          white-space: pre-line;
          margin-bottom: 30px;
          font-size: 13px;
          line-height: 1.8;
        }
        
        .signature {
          margin-top: 50px;
          text-align: right;
        }
        
        .signature-stamp {
          margin-top: 30px;
          border-top: 1px solid #333;
          width: 200px;
          margin-left: auto;
          padding-top: 10px;
          text-align: center;
        }
        
        .footer-relance {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          font-size: 11px;
          color: #718096;
        }
        
        @media print {
          body {
            padding: 20mm;
          }
        }
      </style>
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>Relance Paiement - ${relanceData?.elevePrenom} ${relanceData?.eleveNom}</title>
          ${styles}
        </head>
        <body>
          <div class="header-relance">
            <h1>${parametresEcole?.nom_ecole || 'Établissement Scolaire'}</h1>
            <div class="infos-ecole">
              ${parametresEcole?.adresse || ''}<br>
              ${parametresEcole?.telephone ? `Tél: ${parametresEcole.telephone}` : ''}
              ${parametresEcole?.email ? ` • Email: ${parametresEcole.email}` : ''}
            </div>
          </div>
          
          <div class="date-lieu">
            Fait le ${new Date().toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric'
            })}
          </div>
          
          <div class="destinataire">
            <strong>À l'attention des parents de :</strong><br>
            ${relanceData?.elevePrenom} ${relanceData?.eleveNom}<br>
            Classe : ${relanceData?.classe}<br>
            ${relanceData?.telephoneParent ? `Tél: ${relanceData.telephoneParent}` : ''}
            ${relanceData?.emailParent ? `<br>Email: ${relanceData.emailParent}` : ''}
          </div>
          
          <div class="message-relance">
            ${messageRelance}
          </div>
          
          <div class="signature">
            <div class="signature-stamp">
              <strong>La Comptabilité</strong><br>
              ${parametresEcole?.nom_ecole || 'Établissement Scolaire'}
            </div>
          </div>
          
          <div class="footer-relance">
            Ce document a été généré automatiquement par le système de gestion scolaire.
            Date d'impression: ${new Date().toLocaleDateString('fr-FR')}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const imprimerStatistiques = () => {
    const contenuImpressions = {
      titre: `Statistiques financières - ${elevePrenom} ${eleveNom}`,
      contenu: 'statistiques',
      statistiques: statistiques,
      fraisDetails: statistiques.details_par_frais,
      eleveInfo: {
        nom: eleveNom,
        prenom: elevePrenom,
        classe: classeEleve ? `${classeEleve.niveau} ${classeEleve.nom}` : 'Non défini',
        date: new Date().toLocaleDateString('fr-FR')
      }
    };
    preparerEtImprimer(contenuImpressions);
  };

  const imprimerPaiements = () => {
    const contenuImpressions = {
      titre: `Historique des paiements - ${elevePrenom} ${eleveNom}`,
      contenu: 'paiements',
      statistiques: statistiques,
      paiements: paiements,
      eleveInfo: {
        nom: eleveNom,
        prenom: elevePrenom,
        classe: classeEleve ? `${classeEleve.niveau} ${classeEleve.nom}` : 'Non défini',
        date: new Date().toLocaleDateString('fr-FR')
      }
    };
    preparerEtImprimer(contenuImpressions);
  };

  const imprimerFraisClasse = () => {
    const contenuImpressions = {
      titre: `Frais de la classe - ${elevePrenom} ${eleveNom}`,
      contenu: 'frais',
      statistiques: statistiques,
      fraisClasse: fraisClasse,
      eleveInfo: {
        nom: eleveNom,
        prenom: elevePrenom,
        classe: classeEleve ? `${classeEleve.niveau} ${classeEleve.nom}` : 'Non défini',
        date: new Date().toLocaleDateString('fr-FR')
      }
    };
    preparerEtImprimer(contenuImpressions);
  };

  const imprimerTout = () => {
    const contenuImpressions = {
      titre: `Rapport financier complet - ${elevePrenom} ${eleveNom}`,
      contenu: 'tout',
      statistiques: statistiques,
      fraisDetails: statistiques.details_par_frais,
      paiements: paiements,
      fraisClasse: fraisClasse,
      eleveInfo: {
        nom: eleveNom,
        prenom: elevePrenom,
        classe: classeEleve ? `${classeEleve.niveau} ${classeEleve.nom}` : 'Non défini',
        date: new Date().toLocaleDateString('fr-FR')
      }
    };
    preparerEtImprimer(contenuImpressions);
  };

  const preparerEtImprimer = (contenu: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const styles = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #333;
          padding: 20px;
          background: white;
        }
        
        .print-container {
          max-width: 210mm;
          margin: 0 auto;
        }
        
        .header-ecole {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #667eea;
        }
        
        .logo-section {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 15px;
          gap: 15px;
        }
        
        .logo-placeholder {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 18px;
        }
        
        .infos-ecole h1 {
          font-size: 22px;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 5px;
        }
        
        .infos-ecole .slogan {
          font-size: 14px;
          color: #718096;
          font-style: italic;
          margin-bottom: 10px;
        }
        
        .contact-ecole {
          font-size: 11px;
          color: #4a5568;
          margin-top: 10px;
        }
        
        .contact-ecole span {
          display: inline-block;
          margin: 0 5px;
        }
        
        .document-header {
          margin-bottom: 25px;
          text-align: center;
        }
        
        .document-title {
          font-size: 20px;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 10px;
        }
        
        .document-subtitle {
          font-size: 14px;
          color: #718096;
          margin-bottom: 15px;
        }
        
        .eleve-info-print {
          background: #f7fafc;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 25px;
          border-left: 4px solid #667eea;
        }
        
        .eleve-info-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        
        .info-item {
          font-size: 12px;
        }
        
        .info-label {
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 3px;
        }
        
        .info-value {
          color: #2d3748;
        }
        
        .stats-print {
          margin-bottom: 25px;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }
        
        .stat-card-print {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 12px;
          text-align: center;
        }
        
        .stat-value-print {
          font-size: 18px;
          font-weight: 700;
          margin: 5px 0;
        }
        
        .stat-label-print {
          font-size: 11px;
          color: #718096;
        }
        
        .table-print {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        
        .table-print th {
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          padding: 8px;
          text-align: left;
          font-weight: 600;
          font-size: 11px;
          color: #4a5568;
        }
        
        .table-print td {
          border: 1px solid #e2e8f0;
          padding: 8px;
          font-size: 11px;
          color: #2d3748;
        }
        
        .table-print tr:nth-child(even) {
          background: #fafafa;
        }
        
        .content-section {
          margin-bottom: 25px;
          page-break-inside: avoid;
        }
        
        .section-title-print {
          font-size: 16px;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .frais-details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 15px;
        }
        
        .frais-card-print {
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 12px;
          background: #f7fafc;
        }
        
        .frais-header-print {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
        }
        
        .frais-title-print h4 {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 5px;
        }
        
        .frais-tags-print {
          display: flex;
          gap: 5px;
        }
        
        .tag-print {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 12px;
          font-weight: 500;
        }
        
        .tag-type {
          background: #e8edf2;
          color: #4a5568;
        }
        
        .tag-periodicite {
          background: #c6f6d5;
          color: #22543d;
        }
        
        .frais-stats-print {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin: 10px 0;
          padding: 10px;
          background: white;
          border-radius: 4px;
        }
        
        .stat-item-print {
          text-align: center;
        }
        
        .stat-item-label-print {
          font-size: 10px;
          color: #718096;
          margin-bottom: 3px;
        }
        
        .stat-item-value-print {
          font-size: 13px;
          font-weight: 600;
        }
        
        .footer-print {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          color: #718096;
          font-size: 10px;
        }
        
        .footer-info {
          margin-bottom: 10px;
        }
        
        .print-date {
          font-style: italic;
        }
        
        @media print {
          body {
            padding: 10mm;
          }
          
          .page-break {
            page-break-before: always;
          }
          
          .no-print {
            display: none !important;
          }
          
          .table-print {
            page-break-inside: avoid;
          }
        }
      </style>
    `;

    const contenuHTML = genererContenuHTML(contenu, parametresEcole);
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${contenu.titre}</title>
          ${styles}
        </head>
        <body>
          ${contenuHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const genererContenuHTML = (contenu: any, ecole: ParametresEcole | null) => {
    return `
      <div class="print-container">
        <div class="header-ecole">
          <div class="logo-section">
            ${ecole?.logo_url && ecole.logo_url !== 'Non défini' 
              ? `<img src="${ecole.logo_url}" alt="${ecole.nom_ecole}" style="max-width: 80px; max-height: 80px;">`
              : `<div class="logo-placeholder">${ecole?.nom_ecole?.substring(0, 2).toUpperCase() || 'ÉC'}</div>`
            }
            <div class="infos-ecole">
              <h1>${ecole?.nom_ecole || 'Établissement Scolaire'}</h1>
              ${ecole?.slogan ? `<div class="slogan">"${ecole.slogan}"</div>` : ''}
              <div class="contact-ecole">
                ${ecole?.adresse || ''}
                ${ecole?.telephone ? `<span>• Tél: ${ecole.telephone}</span>` : ''}
                ${ecole?.email ? `<span>• Email: ${ecole.email}</span>` : ''}
              </div>
            </div>
          </div>
        </div>
        
        <div class="document-header">
          <h1 class="document-title">${contenu.titre}</h1>
          <div class="document-subtitle">Généré le ${new Date().toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</div>
        </div>
        
        <div class="eleve-info-print">
          <div class="eleve-info-grid">
            <div class="info-item">
              <div class="info-label">Nom complet</div>
              <div class="info-value">${contenu.eleveInfo.prenom} ${contenu.eleveInfo.nom}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Classe</div>
              <div class="info-value">${contenu.eleveInfo.classe}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Date du rapport</div>
              <div class="info-value">${contenu.eleveInfo.date}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Statut financier</div>
              <div class="info-value">${contenu.statistiques.progression_globale === 100 ? '✅ Tout est payé' : '⏳ En cours de paiement'}</div>
            </div>
          </div>
        </div>
        
        <div class="stats-print">
          <h3 class="section-title-print">Statistiques financières</h3>
          <div class="stats-grid">
            <div class="stat-card-print">
              <div class="stat-value-print" style="color: #667eea;">${formaterMontantFCFA(contenu.statistiques.total_frais_classe)}</div>
              <div class="stat-label-print">Total des frais</div>
              <div class="stat-subtitle-print">${contenu.statistiques.details_par_frais?.length || 0} frais définis</div>
            </div>
            <div class="stat-card-print">
              <div class="stat-value-print" style="color: #38a169;">${formaterMontantFCFA(contenu.statistiques.total_paye)}</div>
              <div class="stat-label-print">Total payé</div>
              <div class="stat-subtitle-print">${contenu.statistiques.nombre_paiements} paiement(s)</div>
            </div>
            <div class="stat-card-print">
              <div class="stat-value-print" style="color: ${contenu.statistiques.total_reste > 0 ? '#e53e3e' : '#38a169'};">${formaterMontantFCFA(contenu.statistiques.total_reste)}</div>
              <div class="stat-label-print">Reste à payer</div>
              <div class="stat-subtitle-print">${contenu.statistiques.details_par_frais?.filter((f: any) => f.reste_a_payer > 0).length || 0} frais en attente</div>
            </div>
            <div class="stat-card-print">
              <div class="stat-value-print" style="color: #ed8936;">${contenu.statistiques.progression_globale}%</div>
              <div class="stat-label-print">Progression globale</div>
              <div class="progress-bar-small">
                <div style="height: 4px; background: #e2e8f0; border-radius: 2px; margin-top: 5px;">
                  <div style="width: ${contenu.statistiques.progression_globale}%; height: 100%; background: #38a169; border-radius: 2px;"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        ${contenu.contenu === 'tout' ? genererContenuTout(contenu) : ''}
        ${contenu.contenu === 'statistiques' ? genererContenuStatistiques(contenu) : ''}
        ${contenu.contenu === 'paiements' ? genererContenuPaiements(contenu) : ''}
        ${contenu.contenu === 'frais' ? genererContenuFrais(contenu) : ''}
        
        <div class="footer-print">
          <div class="footer-info">
            Ce document a été généré automatiquement par le système de gestion scolaire
          </div>
          <div class="print-date">
            Document imprimé le ${new Date().toLocaleDateString('fr-FR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>
    `;
  };

  const genererContenuStatistiques = (contenu: any) => {
    return `
      <div class="content-section">
        <h3 class="section-title-print">Détail par catégorie de frais</h3>
        <div class="frais-details-grid">
          ${contenu.fraisDetails?.map((frais: any) => `
            <div class="frais-card-print">
              <div class="frais-header-print">
                <div class="frais-title-print">
                  <h4>${frais.categorie_nom}</h4>
                  <div class="frais-tags-print">
                    <span class="tag-print tag-type">${frais.categorie_type}</span>
                    <span class="tag-print tag-periodicite">${getPeriodiciteLibelle(frais.periodicite)}</span>
                  </div>
                </div>
                <div class="frais-progress-print">
                  <div style="font-size: 12px; color: #38a169; font-weight: 600;">${frais.progression}%</div>
                </div>
              </div>
              
              <div class="frais-stats-print">
                <div class="stat-item-print">
                  <div class="stat-item-label-print">Total</div>
                  <div class="stat-item-value-print" style="color: #667eea;">${formaterMontantFCFA(frais.montant_total)}</div>
                </div>
                <div class="stat-item-print">
                  <div class="stat-item-label-print">Payé</div>
                  <div class="stat-item-value-print" style="color: #38a169;">${formaterMontantFCFA(frais.montant_paye)}</div>
                </div>
                <div class="stat-item-print">
                  <div class="stat-item-label-print">Reste</div>
                  <div class="stat-item-value-print" style="color: ${frais.reste_a_payer > 0 ? '#e53e3e' : '#38a169'};">${formaterMontantFCFA(frais.reste_a_payer)}</div>
                </div>
              </div>
              
              ${frais.paiements && frais.paiements.length > 0 ? `
                <div style="margin-top: 10px; font-size: 10px;">
                  <strong>Paiements:</strong>
                  ${frais.paiements.map((p: any) => `
                    <div style="padding: 3px 0; border-top: 1px dashed #e2e8f0; font-size: 9px;">
                      ${formaterDate(p.date_paiement)} - ${formaterMontantFCFA(p.montant)} (${getModePaiementLibelle(p.mode_paiement)})
                      ${p.numero_versement ? ` - Versement ${p.numero_versement}` : ''}
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  const genererContenuPaiements = (contenu: any) => {
    return `
      <div class="content-section">
        <h3 class="section-title-print">Historique détaillé des paiements</h3>
        <table class="table-print">
          <thead>
            <tr>
              <th>Date</th>
              <th>Catégorie</th>
              <th>Type</th>
              <th>Mode</th>
              <th>N° Reçu</th>
              <th>Montant</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${contenu.paiements && contenu.paiements.length > 0 
              ? contenu.paiements.map((p: any) => `
                <tr>
                  <td>${formaterDate(p.date_paiement)}</td>
                  <td>${p.categorie_nom}</td>
                  <td>${p.numero_versement ? `${p.numero_versement}e versement` : 'Paiement global'}</td>
                  <td>${getModePaiementLibelle(p.mode_paiement)}</td>
                  <td>${p.numero_recu}</td>
                  <td style="color: #38a169; font-weight: 600;">${formaterMontantFCFA(p.montant)}</td>
                  <td>${p.notes || '-'}</td>
                </tr>
              `).join('')
              : `
                <tr>
                  <td colspan="7" style="text-align: center; padding: 20px; color: #718096;">
                    Aucun paiement enregistré
                  </td>
                </tr>
              `
            }
            ${contenu.paiements && contenu.paiements.length > 0 ? `
              <tr style="background: #f7fafc; font-weight: 600;">
                <td colspan="5" style="text-align: right;">Total général:</td>
                <td style="color: #38a169;">${formaterMontantFCFA(contenu.statistiques.total_paye)}</td>
                <td></td>
              </tr>
            ` : ''}
          </tbody>
        </table>
      </div>
    `;
  };

  const genererContenuFrais = (contenu: any) => {
    return `
      <div class="content-section">
        <h3 class="section-title-print">Frais définis pour la classe</h3>
        <table class="table-print">
          <thead>
            <tr>
              <th>Catégorie</th>
              <th>Type</th>
              <th>Périodicité</th>
              <th>Montant</th>
              <th>Année scolaire</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            ${contenu.fraisClasse && contenu.fraisClasse.length > 0 
              ? contenu.fraisClasse.map((f: any) => `
                <tr>
                  <td><strong>${f.categorie_nom}</strong></td>
                  <td><span style="background: #e8edf2; color: #4a5568; padding: 2px 6px; border-radius: 12px; font-size: 10px;">${f.categorie_type}</span></td>
                  <td><span style="background: #c6f6d5; color: #22543d; padding: 2px 6px; border-radius: 12px; font-size: 10px;">${getPeriodiciteLibelle(f.periodicite)}</span></td>
                  <td style="font-weight: 600;">${formaterMontantFCFA(f.montant)}</td>
                  <td>${f.annee_scolaire}</td>
                  <td><span style="${f.statut === 'actif' ? 'background: #c6f6d5; color: #22543d;' : 'background: #fed7d7; color: #742a2a;'} padding: 2px 8px; border-radius: 12px; font-size: 10px;">${f.statut === 'actif' ? 'Actif' : 'Inactif'}</span></td>
                </tr>
              `).join('')
              : `
                <tr>
                  <td colspan="6" style="text-align: center; padding: 20px; color: #718096;">
                    Aucun frais défini pour cette classe
                  </td>
                </tr>
              `
            }
          </tbody>
        </table>
      </div>
    `;
  };

  const genererContenuTout = (contenu: any) => {
    return `
      <div class="content-section page-break">
        ${genererContenuStatistiques(contenu)}
      </div>
      
      <div class="content-section page-break">
        ${genererContenuPaiements(contenu)}
      </div>
      
      <div class="content-section">
        ${genererContenuFrais(contenu)}
      </div>
    `;
  };

  const getPeriodiciteLibelle = (periodicite: string): string => {
    const libelles: Record<string, string> = {
      'unique': 'Unique',
      'mensuel': 'Mensuel',
      'trimestriel': 'Trimestriel',
      'annuel': 'Annuel'
    };
    return libelles[periodicite] || periodicite;
  };

  if (!isOpen) return null;

  return (
    <div className="overlay-modal-premium" onClick={onClose}>
      <div className="modal-premium modal-historique" onClick={(e) => e.stopPropagation()}>
        
        {/* Modales d'action */}
        {modalReceiptOpen && paiementSelectionne && (
          <ModalImprimerRecu
            isOpen={modalReceiptOpen}
            onClose={() => setModalReceiptOpen(false)}
            paiement={paiementSelectionne}
            onSuccess={refreshPaiements}
          />
        )}
        
        {modalEditOpen && paiementSelectionne && (
          <ModalModifierPaiement
            isOpen={modalEditOpen}
            onClose={() => setModalEditOpen(false)}
            paiement={paiementSelectionne}
            onSuccess={refreshPaiements}
          />
        )}
        
        {modalDeleteOpen && paiementSelectionne && (
          <ModalSupprimerPaiement
            isOpen={modalDeleteOpen}
            onClose={() => setModalDeleteOpen(false)}
            paiement={paiementSelectionne}
            onSuccess={refreshPaiements}
          />
        )}

        {/* En-tête élégante */}
        <div className="modal-header-premium">
          <div className="header-content">
            <div className="eleve-info-header">
              <div className="avatar-eleve">
                <span className="avatar-text">
                  {elevePrenom.charAt(0)}{eleveNom.charAt(0)}
                </span>
              </div>

              <div>
                <h2 className="eleve-nom">{eleveNom} {elevePrenom}</h2>
                <div className="eleve-metadata">
                  <span className="badge-classe">
                    {classeEleve ? `${classeEleve.niveau} ${classeEleve.nom}` : 'Classe inconnue'}
                  </span>
                  <span className="separator">•</span>
                  <span className="badge-statut-eleve">
                    {statistiques.progression_globale === 100 ? '✅ Tout payé' : '⏳ En cours'}
                  </span>
                  
                  {/* ✅ NOUVEAU BOUTON DE PAIEMENT */}
                  <button 
                    className="bouton-paiement" 
                    onClick={ouvrirModalPaiement}
                    title="Effectuer un paiement pour cet élève"
                  >
                    <span className="btn-icon">💵</span>
                  </button>
                  
                 {statistiques.total_reste > 0 && (
  <button className="bouton-export2" onClick={preparerRelance} title="Envoyer une relance">
    <span className="btn-icon">
      <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="24" height="24" viewBox="0 0 48 48">
        <path fill="#fff" d="M4.868,43.303l2.694-9.835C5.9,30.59,5.026,27.324,5.027,23.979C5.032,13.514,13.548,5,24.014,5c5.079,0.002,9.845,1.979,13.43,5.566c3.584,3.588,5.558,8.356,5.556,13.428c-0.004,10.465-8.522,18.98-18.986,18.98c-0.001,0,0,0,0,0h-0.008c-3.177-0.001-6.3-0.798-9.073-2.311L4.868,43.303z"></path>
        <path fill="#fff" d="M4.868,43.803c-0.132,0-0.26-0.052-0.355-0.148c-0.125-0.127-0.174-0.312-0.127-0.483l2.639-9.636c-1.636-2.906-2.499-6.206-2.497-9.556C4.532,13.238,13.273,4.5,24.014,4.5c5.21,0.002,10.105,2.031,13.784,5.713c3.679,3.683,5.704,8.577,5.702,13.781c-0.004,10.741-8.746,19.48-19.486,19.48c-3.189-0.001-6.344-0.788-9.144-2.277l-9.875,2.589C4.953,43.798,4.911,43.803,4.868,43.803z"></path>
        <path fill="#cfd8dc" d="M24.014,5c5.079,0.002,9.845,1.979,13.43,5.566c3.584,3.588,5.558,8.356,5.556,13.428c-0.004,10.465-8.522,18.98-18.986,18.98h-0.008c-3.177-0.001-6.3-0.798-9.073-2.311L4.868,43.303l2.694-9.835C5.9,30.59,5.026,27.324,5.027,23.979C5.032,13.514,13.548,5,24.014,5 M24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974 M24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974 M24.014,4C24.014,4,24.014,4,24.014,4C12.998,4,4.032,12.962,4.027,23.979c-0.001,3.367,0.849,6.685,2.461,9.622l-2.585,9.439c-0.094,0.345,0.002,0.713,0.254,0.967c0.19,0.192,0.447,0.297,0.711,0.297c0.085,0,0.17-0.011,0.254-0.033l9.687-2.54c2.828,1.468,5.998,2.243,9.197,2.244c11.024,0,19.99-8.963,19.995-19.98c0.002-5.339-2.075-10.359-5.848-14.135C34.378,6.083,29.357,4.002,24.014,4L24.014,4z"></path>
        <path fill="#40c351" d="M35.176,12.832c-2.98-2.982-6.941-4.625-11.157-4.626c-8.704,0-15.783,7.076-15.787,15.774c-0.001,2.981,0.833,5.883,2.413,8.396l0.376,0.597l-1.595,5.821l5.973-1.566l0.577,0.342c2.422,1.438,5.2,2.198,8.032,2.199h0.006c8.698,0,15.777-7.077,15.78-15.776C39.795,19.778,38.156,15.814,35.176,12.832z"></path>
        <path fill="#fff" fillRule="evenodd" d="M19.268,16.045c-0.355-0.79-0.729-0.806-1.068-0.82c-0.277-0.012-0.593-0.011-0.909-0.011c-0.316,0-0.83,0.119-1.265,0.594c-0.435,0.475-1.661,1.622-1.661,3.956c0,2.334,1.7,4.59,1.937,4.906c0.237,0.316,3.282,5.259,8.104,7.161c4.007,1.58,4.823,1.266,5.693,1.187c0.87-0.079,2.807-1.147,3.202-2.255c0.395-1.108,0.395-2.057,0.277-2.255c-0.119-0.198-0.435-0.316-0.909-0.554s-2.807-1.385-3.242-1.543c-0.435-0.158-0.751-0.237-1.068,0.238c-0.316,0.474-1.225,1.543-1.502,1.859c-0.277,0.317-0.554,0.357-1.028,0.119c-0.474-0.238-2.002-0.738-3.815-2.354c-1.41-1.257-2.362-2.81-2.639-3.285c-0.277-0.474-0.03-0.731,0.208-0.968c0.213-0.213,0.474-0.554,0.712-0.831c0.237-0.277,0.316-0.475,0.474-0.791c0.158-0.317,0.079-0.594-0.04-0.831C20.612,19.329,19.69,16.983,19.268,16.045z" clipRule="evenodd"></path>
      </svg>
    </span>
  </button>
)}
                  <button className="bouton-print2" onClick={imprimerTout} title="Imprimer tout le rapport">
                    <span className="btn-icon">🖨️</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="header-actions">
              <button className="btn-close-premium" onClick={onClose}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation par onglets */}
        <div className="modal-tabs-premium">
          <div className="tabs-container">
            <button
              className={`tab-premium ${ongletActif === 'statistiques' ? 'active' : ''}`}
              onClick={() => setOngletActif('statistiques')}
            >
              <span className="tab-icon">📊</span>
              <span className="tab-label">Statistiques</span>
            </button>
            <button
              className={`tab-premium ${ongletActif === 'paiements' ? 'active' : ''}`}
              onClick={() => setOngletActif('paiements')}
            >
              <span className="tab-icon">💰</span>
              <span className="tab-label">Paiements</span>
            </button>
            <button
              className={`tab-premium ${ongletActif === 'frais' ? 'active' : ''}`}
              onClick={() => setOngletActif('frais')}
            >
              <span className="tab-icon">📋</span>
              <span className="tab-label">Frais de la classe</span>
            </button>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="modal-content-premium-paiement">
          {chargement ? (
            <div className="loading-state">
              <div className="spinner-premium"></div>
              <p className="loading-text">Chargement des données...</p>
            </div>
          ) : erreur ? (
            renderErrorState()
          ) : (
            <>
              {/* Statistiques résumées */}
              <div className="stats-summary">
                <div className="stat-card total">
                  <div className="stat-icon">💰</div>
                  <div className="stat-content">
                    <div className="stat-label">Total des frais</div>
                    <div className="stat-value">{formaterMontantFCFA(statistiques.total_frais_classe)}</div>
                    <div className="stat-subtitle">{fraisClasse.length} frais définis</div>
                  </div>
                </div>
                <div className="stat-card paid">
                  <div className="stat-icon">💵</div>
                  <div className="stat-content">
                    <div className="stat-label">Total payé</div>
                    <div className="stat-value">{formaterMontantFCFA(statistiques.total_paye)}</div>
                    <div className="stat-subtitle">{statistiques.nombre_paiements} paiements</div>
                  </div>
                </div>
                <div className="stat-card remaining">
                  <div className="stat-icon">⏰</div>
                  <div className="stat-content">
                    <div className="stat-label">Reste à payer</div>
                    <div className="stat-value">{formaterMontantFCFA(statistiques.total_reste)}</div>
                    <div className="stat-subtitle">
                      {statistiques.details_par_frais.filter(f => f.reste_a_payer > 0).length} frais en attente
                    </div>
                  </div>
                </div>
                <div className="stat-card progress">
                  <div className="stat-icon">📈</div>
                  <div className="stat-content">
                    <div className="stat-label">Progression globale</div>
                    <div className="stat-value">{statistiques.progression_globale}%</div>
                    <div className="progress-bar-large">
                      <div 
                        className="progress-fill"
                        style={{ width: `${statistiques.progression_globale}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contenu spécifique à l'onglet */}
              <div className="tab-content-paiement">
                {ongletActif === 'statistiques' && (
                  <div className="stats-detailed">
                    <div className="section-header">
                      <h3 className="section-title">Détail par catégorie de frais</h3>
                      <div className="section-actions">
                        <button className="bouton-action-paie" onClick={imprimerStatistiques}>
                          <span className="btn-icon">🖨️</span>
                          Imprimer
                        </button>
                      </div>
                    </div>
                    
                    <div className="frais-grid">
                      {statistiques.details_par_frais.map((frais, index) => (
                        <div key={frais.frais_id || index} className="frais-card">
                          <div className="frais-header">
                            <div className="frais-title">
                              <h4>{frais.categorie_nom}</h4>
                              <div className="frais-tags">
                                <span className="tag-type">{frais.categorie_type}</span>
                                <span className="tag-periodicite">
                                  {getPeriodiciteLibelle(frais.periodicite)}
                                </span>
                              </div>
                            </div>
                            <div className="frais-progress">
                              <div className="progress-mini">
                                <div 
                                  className="progress-fill-mini"
                                  style={{ width: `${frais.progression}%` }}
                                ></div>
                              </div>
                              <span className="progress-percent">{frais.progression}%</span>
                            </div>
                          </div>
                          
                          <div className="frais-stats">
                            <div className="stat-item">
                              <div className="stat-item-label">Total</div>
                              <div className="stat-item-value total">{formaterMontantFCFA(frais.montant_total)}</div>
                            </div>
                            <div className="stat-item">
                              <div className="stat-item-label">Payé</div>
                              <div className="stat-item-value paid">{formaterMontantFCFA(frais.montant_paye)}</div>
                            </div>
                            <div className="stat-item">
                              <div className="stat-item-label">Reste</div>
                              <div className={`stat-item-value ${frais.reste_a_payer > 0 ? 'remaining' : 'paid'}`}>
                                {formaterMontantFCFA(frais.reste_a_payer)}
                              </div>
                            </div>
                          </div>
                          
                          {frais.paiements.length > 0 && (
                            <div className="frais-paiements">
                              <div className="paiements-title">Détail des paiements :</div>
                              <div className="paiements-list">
                                {frais.paiements.map((paiement) => (
                                  <div key={paiement.id} className="paiement-item">
                                    <div className="paiement-date">{formaterDate(paiement.date_paiement)}</div>
                                    <div className="paiement-montant">{formaterMontantFCFA(paiement.montant)}</div>
                                    <div className="paiement-details">
                                      <span className="paiement-mode">{getModePaiementLibelle(paiement.mode_paiement)}</span>
                                      {paiement.numero_versement && (
                                        <span className="paiement-versement">• Versement {paiement.numero_versement}</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {ongletActif === 'paiements' && (
  <div className="paiements-detailed">
    <div className="section-header">
      <h3 className="section-title">Historique des paiements</h3>
      <div className="section-actions">
        <div className="total-paiements">
          {paiements.length} paiement(s) au total
        </div>
        <button className="bouton-action-paie" onClick={imprimerPaiements}>
          <span className="btn-icon">🖨️</span>
          Imprimer
        </button>
      </div>
    </div>
    
    <div className="paiements-table-container">
      <div className="table-responsive-paiement">
        <table className="table-premium-paiement">
          <thead>
            {/* ✅ CORRIGÉ : PLUS D'ESPACE BLANC À L'INTÉRIEUR DU <tr> */}
            <tr>
              <th>Date</th>
              <th>Catégorie</th>
              <th>Type</th>
              <th>Mode</th>
              <th>N° Reçu</th>
              <th>Montant</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paiements.length === 0 ? (
              <tr>
                <td colSpan={7} className="no-data">
                  <div className="no-data-content">
                    <span className="no-data-icon">📭</span>
                    <p>Aucun paiement enregistré</p>
                  </div>
                </td>
              </tr>
            ) : (
              paiements.map((paiement) => (
                /* ✅ CORRIGÉ : PAS D'ESPACE BLANC AVANT/APRÈS LES ÉLÉMENTS */
                <tr key={paiement.id}>
                  <td>
                    <div className="date-cell">
                      <span className="date-value">{formaterDate(paiement.date_paiement)}</span>
                      {paiement.created_at && (
                        <div className="heure-paiement">
                          {new Date(paiement.created_at).toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="categorie-badge">{paiement.categorie_nom}</span>
                  </td>
                  <td>
                    <span className={`type-badge ${paiement.numero_versement ? 'versement' : 'global'}`}>
                      {paiement.numero_versement 
                        ? `${paiement.numero_versement}e versement`
                        : 'Paiement global'
                      }
                    </span>
                  </td>
                  <td>
                    <span className={`mode-badge ${paiement.mode_paiement}`}>
                      {getModePaiementLibelle(paiement.mode_paiement)}
                    </span>
                  </td>
                  <td>
                    <span className="receipt-number">#{paiement.numero_recu}</span>
                  </td>
                  <td>
                    <span className="montant-paiement">
                      {formaterMontantFCFA(paiement.montant)}
                    </span>
                  </td>
                  <td>
                    <div className="actions-buttons">
                      <button 
                        onClick={() => handleImprimerRecu(paiement)}
                        className="action-button receipt"
                        title="Voir le reçu"
                      >
                        🧾
                      </button>
                      <button 
                        onClick={() => handleModifierPaiement(paiement)}
                        className="action-button edit"
                        title="Modifier le paiement"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleSupprimerPaiement(paiement)}
                        className="action-button delete"
                        title="Supprimer le paiement"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}

                {ongletActif === 'frais' && (
                  <div className="frais-detailed">
                    <div className="section-header">
                      <h3 className="section-title">Frais définis pour la classe</h3>
                      <div className="section-actions">
                        <div className="total-paiements">
                          {fraisClasse.length} frais définis
                        </div>
                        <button className="bouton-action-paie" onClick={imprimerFraisClasse}>
                          <span className="btn-icon">🖨️</span>
                          Imprimer
                        </button>
                      </div>
                    </div>
                    
                    <div className="frais-table-container">
                      <div className="table-responsive-paiement">
                        <table className="table-premium-paiement">
                          <thead>
                            <tr>
                              <th>Catégorie</th>
                              <th>Type</th>
                              <th>Périodicité</th>
                              <th>Montant</th>
                              <th>Année scolaire</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fraisClasse.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="no-data">
                                  <div className="no-data-content">
                                    <span className="no-data-icon">📝</span>
                                    <p>Aucun frais défini pour cette classe</p>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              fraisClasse.map((frais) => (
                                <tr key={frais.id}>
                                  <td>
                                    <strong>{frais.categorie_nom}</strong>
                                  </td>
                                  <td>
                                    <span className={`type-badge ${frais.categorie_type}`}>
                                      {frais.categorie_type}
                                    </span>
                                  </td>
                                  <td>
                                    <span className={`periodicite-badge ${frais.periodicite}`}>
                                      {getPeriodiciteLibelle(frais.periodicite)}
                                    </span>
                                  </td>
                                  <td>
                                    <span className="montant-frais">
                                      {formaterMontantFCFA(frais.montant)}
                                    </span>
                                  </td>
                                  <td>{frais.annee_scolaire}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modale de relance */}
        {showModalRelance && relanceData && (
          <div className="overlay-modal-premium" onClick={() => setShowModalRelance(false)}>
            <div className="modal-premium modal-relance" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-premium">
                <div className="header-content">
                  <h2>📬 Envoyer une relance</h2>
                  <button className="btn-close-premium" onClick={() => setShowModalRelance(false)}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="modal-content-premium-paiement">
                <div className="stat-card total" style={{display: 'inline-block', width: '100%', textAlign: 'left', fontSize: '13px', color: '#000000', backgroundColor: '#d9e9fe'}}>
                  <div className="summary-icon">👨‍🎓 Élève : {relanceData.eleveNom} {relanceData.elevePrenom}</div>
                  <div className="summary-detail">🏫 Classe : {relanceData.classe}</div>
                  <div className="summary-label">📱 Contact parent : {relanceData.telephoneParent || 'Non renseigné'}</div>
                  <div className="summary-icon">💰 Montant dû : {formaterMontantFCFA(relanceData.montantTotalRestant)}</div>
                </div>

                <div className="relance-message" style={{fontSize: '14px', margin: '20px'}}>
                  <h3>Message de relance</h3>
                  <div className="message-editor">
                    <textarea
                      value={messageRelance}
                      onChange={(e) => setMessageRelance(e.target.value)}
                      rows={12}
                      placeholder="Modifiez le message de relance..."
                    />
                    <div className="message-tools">
                      <button className="btn-tool" onClick={() => navigator.clipboard.writeText(messageRelance)}>
                        <span className="tool-icon">📋</span>
                        Copier
                      </button>
                      <button className="btn-tool" onClick={() => setMessageRelance(genererMessageRelance(relanceData))}>
                        <span className="tool-icon">🔄</span>
                        Réinitialiser
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer-premium">
                <div className="footer-actions">
                  <button className="btn-secondary-premium" onClick={() => setShowModalRelance(false)}>
                    Annuler
                  </button>
                  
                  {relanceData.telephoneParent && (
                    <button className="bouton-export3" onClick={envoyerRelanceWhatsApp}>
                      <span className="method-icon">💚</span>
                      <span className="method-label">Envoyer via WhatsApp</span>
                    </button>
                  )}
                  
                  <button className="bouton-print2" onClick={imprimerRelance}>
                    <span className="method-icon">🖨️</span>
                    <span className="method-desc">Imprimer la relance</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pied de page */}
        <div className="modal-footer-premium">
          <div className="footer-actions">
            <button className="btn-secondary-premium" onClick={onClose}>
              Fermer
            </button>
            <button className="btn-primary-premium" onClick={chargerDonnees}>
              <span className="btn-icon">🔄</span>
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* ✅ MODALE DE PAIEMENT */}
{showPaiementModal && (
  <div className="overlay-modal-premium" onClick={() => setShowPaiementModal(false)}>
    <div className="modal-premium modal-paiement" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header-premium">
        <div className="header-content">
          <h2>💰 Nouveau Paiement - {elevePrenom} {eleveNom}</h2>
          <p className="info-annee">Année scolaire: {anneeScolaire}</p>
          <button className="btn-close-premium" onClick={() => setShowPaiementModal(false)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="modal-content-premium-paiement">
        <form onSubmit={handleSoumettrePaiement} className="formulaire-paiement">
          
          {/* Étape 1: Classe de l'élève (pré-remplie et désactivée) - ID ajouté */}
          <div id="etape-classe" className="etape etape-classe">
            <h4>Classe de l'élève</h4>
            <div className="groupe-champ">
              <label>Classe</label>
              <input
                type="text"
                value={classeEleve ? `${classeEleve.niveau} ${classeEleve.nom}` : 'Classe non définie'}
                disabled
                className="input-modern disabled"
              />
            </div>
          </div>

          {/* Étape 2: Élève (pré-rempli) - ID ajouté */}
          <div id="etape-eleve" className="etape etape-eleve">
            <h4>Élève</h4>
            <div className="groupe-champ">
              <label>Élève</label>
              <input
                type="text"
                value={`${elevePrenom} ${eleveNom}`}
                disabled
                className="input-modern disabled"
              />
            </div>
            
            {/* Frais existants de l'élève */}
            {fraisEleves.length > 0 && (
              <div className="info-frais-eleve">
                <h5>Frais existants de l'élève</h5>
                <div className="liste-frais-existants">
                  {fraisEleves.map(frais => (
                    <div key={frais.id} className="carte-frais-existant">
                      <div className="entete-carte-frais">
                        <span className="categorie-nom">{frais.categorie_nom}</span>
                        <span className={`statut-frais ${frais.statut}`}>
                          {frais.statut}
                        </span>
                      </div>
                      <div className="details-carte-frais">
                        <span>Total: {formaterMontantFCFA(frais.montant)}</span>
                        <span>Payé: {formaterMontantFCFA(frais.montant_paye)}</span>
                        <span className="montant-restant">
                          Restant: {formaterMontantFCFA(frais.frais_restant || 0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Étape 3: Sélection du frais - ID ajouté */}
          <div id="etape-frais" className="etape etape-frais">
            <h4>Sélectionner le frais à payer</h4>
            
            <div className="liste-frais-scolaires">
              {fraisScolaires.map(frais => {
                const fraisEleveExistant = fraisEleves.find(fe => 
                  fe.frais_scolaire_id === frais.id && fe.eleve_id === eleveId
                );
                const montantRestant = fraisEleveExistant ? 
                  (fraisEleveExistant.frais_restant || frais.montant - fraisEleveExistant.montant_paye) : 
                  frais.montant;
                
                const isInscription = frais.categorie_type === 'inscription';
                const isScolarite = frais.categorie_type === 'scolarite';
                const isInscriptionPayee = isInscription && fraisEleveExistant && 
                  (fraisEleveExistant.statut === 'paye' || fraisEleveExistant.montant_paye >= frais.montant);
                
                const isFraisUnique = frais.periodicite === 'unique';
                const isFraisUniquePaye = isFraisUnique && fraisEleveExistant && 
                  (fraisEleveExistant.statut === 'paye' || fraisEleveExistant.montant_paye >= frais.montant);
                
                const isFraisAnnuel = frais.periodicite === 'annuel';
                const isFraisAnnuelPaye = isFraisAnnuel && fraisEleveExistant && 
                  (fraisEleveExistant.statut === 'paye' || fraisEleveExistant.montant_paye >= frais.montant);
                
                const estFraisDesactive = isInscriptionPayee || isFraisUniquePaye || isFraisAnnuelPaye;
                
                return (
                  <div 
                    key={frais.id}
                    className={`carte-frais-scolaire ${
                      fraisSelectionne?.id === frais.id ? 'selectionne' : ''
                    } ${estFraisDesactive ? 'desactive' : ''}`}
                    onClick={() => {
                      if (estFraisDesactive) {
                        let message = '';
                        if (isInscriptionPayee) {
                          message = 'L\'inscription est déjà payée pour cet élève.';
                        } else if (isFraisUniquePaye) {
                          message = `Ce frais "${frais.categorie_nom}" est de type UNIQUE et a déjà été payé.`;
                        } else if (isFraisAnnuelPaye) {
                          message = `Ce frais "${frais.categorie_nom}" est de type ANNUEL et a déjà été payé.`;
                        }
                        alert(message);
                        return;
                      }
                      handleSelectionFrais(frais);
                    }}
                    style={estFraisDesactive ? {
                      opacity: 0.6,
                      cursor: 'not-allowed',
                      backgroundColor: '#f9fafb',
                      borderColor: '#e5e7eb',
                      pointerEvents: 'none'
                    } : {}}
                  >
                    <div className="entete-carte-frais">
                      <h5>{frais.categorie_nom}</h5>
                      <span className="periodicite-frais">
                        {frais.periodicite}
                      </span>
                    </div>
                    
                    <div className="details-carte-frais">
                      <div className="montant-frais">
                        <span>Montant total: {formaterMontantFCFA(frais.montant)}</span>
                        {fraisEleveExistant && (
                          <>
                            <span>Déjà payé: {formaterMontantFCFA(fraisEleveExistant.montant_paye)}</span>
                            <span className="montant-restant">
                              Reste : {formaterMontantFCFA(montantRestant)}
                            </span>
                          </>
                        )}
                        {!fraisEleveExistant && (
                          <span className="montant-restant">
                            À payer: {formaterMontantFCFA(montantRestant)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {fraisEleveExistant && (
                      <div className="statut-frais-existant">
                        Statut: {fraisEleveExistant.statut}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Étape 4: Configuration scolarité - ID ajouté */}
          {fraisSelectionne && fraisSelectionne.categorie_type === 'scolarite' && (
            <div id="etape-config-scolarite" className="etape etape-config-scolarite">
              <h4>Configuration du paiement de scolarité</h4>
              
              <div className="info-scolarite-globale">
                <div className="montant-total-scolarite">
                  <span>Montant total:</span>
                  <strong>{formaterMontantFCFA(montantTotalScolarite)}</strong>
                </div>
                
                <div className="montant-restant-scolarite">
                  <span>Reste à payer:</span>
                  <strong>{formaterMontantFCFA(montantRestantScolarite)}</strong>
                </div>
                
               
                  <div className="versements-existants">
                    <h5>Versements déjà effectués</h5>
                    <div className="liste-versements-existants">
                      {versements.map(versement => (
                        <div key={versement.id} className="carte-versement-existant">
                          <div className="entete-versement">
                            <span>Versement #{versement.numero_versement}</span>
                          </div>
                          <div className="details-versement">
                            <span>Montant: {formaterMontantFCFA(versement.montant_versement)}</span>
                            <span>Payé: {formaterMontantFCFA(versement.montant_paye)}</span>
                            <span>Reste: {formaterMontantFCFA(versement.montant_versement - versement.montant_paye)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
               
                
                <div className="choix-type-paiement">
                  <h5>Comment souhaitez-vous payer ?</h5>
                  
                  <label className="radio-label">
                    <input 
                      type="radio" 
                      name="type_paiement_scolarite"
                      checked={!formPaiement.is_versement}
                      onChange={() => {
                        setFormPaiement(prev => ({
                          ...prev,
                          montant: montantRestantScolarite,
                          is_versement: false,
                          numero_versement: undefined,
                          versement_id: undefined
                        }));
                        setVersementSelectionne(null);
                        setNumeroVersement(1);
                        
                        // ✅ Défiler vers les détails
                        setTimeout(() => {
                          const element = document.getElementById('etape-details-paiement');
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        }, 200);
                      }}
                    />
                    Paiement global ({formaterMontantFCFA(montantRestantScolarite)})
                  </label>

                  <label className="radio-label">
                    <input 
                      type="radio" 
                      name="type_paiement_scolarite"
                      checked={formPaiement.is_versement}
                      onChange={() => {
                        const prochainVersement = trouverProchainVersement();
                        const montantVersement = versements.find(v => 
                          v.numero_versement === prochainVersement
                        )?.montant_versement || Math.ceil(montantRestantScolarite / Math.max(1, numeroVersement));
                        
                        setFormPaiement(prev => ({
                          ...prev,
                          montant: montantVersement,
                          is_versement: true,
                          numero_versement: prochainVersement
                        }));
                        
                        // ✅ Défiler vers les détails
                        setTimeout(() => {
                          const element = document.getElementById('etape-details-paiement');
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        }, 200);
                      }}
                    />
                    Paiement par versement(s)
                  </label>
                  
                  {formPaiement.is_versement && (
                    <div className="configuration-versements">
                      <div className="groupe-champ">
                        <label>Nombre total de versements souhaités</label>
                        <select 
                          value={numeroVersement}
                          onChange={(e) => {
                            const newNumVersements = parseInt(e.target.value);
                            handleNombreVersementsChange(newNumVersements);
                          }}
                        >
                          {[1,2,3,4,5,6,7,8,9,10].map(num => (
                            <option key={num} value={num}>
                              {num} versement{num > 1 ? 's' : ''}
                            </option>
                          ))}
                        </select>
                        
                        {/* ✅ Afficher le prochain versement recommandé */}
                        {versements.length > 0 && (
                          <small className="hint" style={{ color: '#3b82f6', fontWeight: '500', marginTop: '8px' }}>
                            {(() => {
                              const prochainVersement = trouverProchainVersement();
                              const versementsPayes = versements.filter(v => v.montant_paye > 0);
                              const dernierPaye = versementsPayes.length > 0 
                                ? Math.max(...versementsPayes.map(v => v.numero_versement))
                                : 0;
                              
                              return (
                                <>
                                  ⚡ Dernier versement effectué: #{dernierPaye}
                                  <br />
                                  ✅ Prochain versement à payer: #{prochainVersement}
                                </>
                              );
                            })()}
                          </small>
                        )}
                      </div>
                      
                      <div className="groupe-champ">
                        <label>Sélectionner le versement à payer</label>
                        <select 
                          value={formPaiement.numero_versement || trouverProchainVersement()}
                          onChange={(e) => {
                            const numero = parseInt(e.target.value);
                            const versement = versements.find(v => v.numero_versement === numero);
                            const montantDu = versement 
                              ? versement.montant_versement - versement.montant_paye
                              : Math.ceil(montantRestantScolarite / Math.max(1, numeroVersement));
                            
                            setFormPaiement(prev => ({
                              ...prev,
                              numero_versement: numero,
                              montant: montantDu
                            }));
                          }}
                        >
                          {Array.from({ length: numeroVersement }, (_, i) => {
                            const numVersement = i + 1;
                            const versement = versements.find(v => v.numero_versement === numVersement);
                            const estPaye = versement?.statut === 'paye' || (versement?.montant_paye || 0) >= (versement?.montant_versement || 0);
                            const estPartiel = versement?.statut === 'partiel' || (versement?.montant_paye || 0) > 0;
                            const estProchain = numVersement === trouverProchainVersement();
                            
                            return (
                              <option 
                                key={numVersement} 
                                value={numVersement}
                                disabled={estPaye}
                                style={{ 
                                  color: estPaye ? '#999' : estPartiel ? '#ffc107' : estProchain ? '#2563eb' : 'inherit',
                                  fontWeight: estProchain ? 'bold' : estPartiel ? 'bold' : 'normal'
                                }}
                              >
                                Versement #{numVersement} 
                                {estPaye ? ' (✓ Déjà payé)' : 
                                 estPartiel ? ` (⏳ Partiel: ${formaterMontantFCFA(versement?.montant_paye || 0)}/${formaterMontantFCFA(versement?.montant_versement || 0)})` : 
                                 estProchain ? ' (▶️ Prochain à payer)' : 
                                 ''}
                              </option>
                            );
                          })}
                        </select>
                        <small className="hint">
                          {formPaiement.numero_versement === trouverProchainVersement() 
                            ? `✅ Prochain versement à payer: #${trouverProchainVersement()}`
                            : `📌 Versement sélectionné: #${formPaiement.numero_versement}`
                          }
                        </small>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Étape 5: Détails du paiement - ID ajouté */}
          {fraisSelectionne && (
            <div id="etape-details-paiement" className="etape etape-details-paiement">
              <h4>
                Détails du paiement : <span className="categorie-paiement">{fraisSelectionne.categorie_nom}</span>
              </h4>
              
              <div className="grille-details-paiement">
                <div className="groupe-champ">
                  <label>Montant à payer</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    step="100"
                    value={formPaiement.montant}
                    onChange={(e) => setFormPaiement({...formPaiement, montant: parseFloat(e.target.value) || 0})}
                  />
                </div>
                
                <div className="groupe-champ">
                  <label>Date de paiement</label>
                  <input 
                    type="date" 
                    required
                    value={formPaiement.date_paiement}
                    onChange={(e) => setFormPaiement({...formPaiement, date_paiement: e.target.value})}
                  />
                </div>
                
                <div className="groupe-champ">
                  <label>Mode de paiement</label>
                  <select 
                    required
                    value={formPaiement.mode_paiement}
                    onChange={(e) => setFormPaiement({
                      ...formPaiement, 
                      mode_paiement: e.target.value as any
                    })}
                  >
                    <option value="especes">Espèces</option>
                    <option value="cheque">Chèque</option>
                    <option value="virement">Virement bancaire</option>
                    <option value="carte">Carte bancaire</option>
                    <option value="mobile">Mobile Money</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                
                <div className="groupe-champ">
                  <label>Référence</label>
                  <input 
                    type="text" 
                    value={formPaiement.reference_paiement}
                    onChange={(e) => setFormPaiement({...formPaiement, reference_paiement: e.target.value})}
                    placeholder="N° de chèque, référence..."
                  />
                </div>
                
                <div className="groupe-champ plein-largeur">
                  <label>Notes</label>
                  <textarea 
                    value={formPaiement.notes}
                    onChange={(e) => setFormPaiement({...formPaiement, notes: e.target.value})}
                    placeholder="Commentaire..."
                    rows={3}
                  />
                </div>
              </div>
              
              {/* Résumé */}
              <div className="resume-paiement">
                <h5>Résumé du paiement</h5>
                <div className="details-resume">
                  <div className="ligne-resume">
                    <span>Élève:</span>
                    <span>{elevePrenom} {eleveNom}</span>
                  </div>
                  <div className="ligne-resume">
                    <span>Classe:</span>
                    <span>{classeEleve ? `${classeEleve.niveau} ${classeEleve.nom}` : 'Non définie'}</span>
                  </div>
                  <div className="ligne-resume">
                    <span>Frais:</span>
                    <span>{fraisSelectionne.categorie_nom}</span>
                  </div>
                  {formPaiement.is_versement && (
                    <>
                      <div className="ligne-resume">
                        <span>Type de paiement:</span>
                        <span>Versement</span>
                      </div>
                      <div className="ligne-resume">
                        <span>Numéro du versement:</span>
                        <span>#{formPaiement.numero_versement}</span>
                      </div>
                      <div className="ligne-resume">
                        <span>Nombre total de versements:</span>
                        <span>{numeroVersement}</span>
                      </div>
                    </>
                  )}
                  {!formPaiement.is_versement && (
                    <div className="ligne-resume">
                      <span>Type de paiement:</span>
                      <span>Paiement global</span>
                    </div>
                  )}
                  <div className="ligne-resume">
                    <span>Montant:</span>
                    <span className="montant-total">{formaterMontantFCFA(formPaiement.montant)}</span>
                  </div>
                </div>
              </div>
              
              <div className="actions-formulaire">
                <button 
                  type="button" 
                  className="bouton-secondaire"
                  onClick={() => setShowPaiementModal(false)}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="bouton-primaire"
                  disabled={chargementPaiement || !fraisSelectionne}
                >
                  {chargementPaiement ? 'Enregistrement...' : 'Enregistrer le paiement'}
                </button>
              </div>
            </div>
          )}
          
          {/* Message si aucun frais disponible */}
          {fraisScolaires.length === 0 && (
            <div className="aucun-frais-message">
              <p>Aucun frais disponible pour cette classe.</p>
            </div>
          )}
        </form>
      </div>
    </div>
  </div>
)}

      {/* Styles inline */}
      <style jsx>{`
        .modal-premium {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .modal-header-premium {
          background: white;
          border-radius: 16px 16px 0 0;
          padding: 10px;
          border-bottom: 1px solid #e8edf2;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
          font-size: 20px;
        }

        .total-paiements {
          font-weight: 400;
          font-size: 13px;
          color: #7f7f7f;
          font-style: italic;
        }

        .eleve-info-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .avatar-eleve {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .avatar-text {
          color: white;
          font-size: 24px;
          font-weight: 600;
        }

        .eleve-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .eleve-nom {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
          color: #1a202c;
        }

        .eleve-metadata {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .badge-classe {
          background: #e8edf2;
          color: #4a5568;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
        }

        .separator {
          color: #a0aec0;
        }

        .badge-statut-eleve {
          background: #c6f6d5;
          color: #22543d;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
        }

        .btn-close-premium {
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-close-premium:hover {
          background: #edf2f7;
          transform: rotate(90deg);
        }

        .modal-tabs-premium {
          background: white;
          border-bottom: 1px solid #e8edf2;
          padding: 0 24px;
        }

        .tabs-container {
          display: flex;
          gap: 4px;
        }

        .tab-premium {
          padding: 16px 24px;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #718096;
          transition: all 0.2s;
        }

        .tab-premium:hover {
          color: #4a5568;
          background: #f7fafc;
        }

        .tab-premium.active {
          color: #667eea;
          border-bottom-color: #667eea;
          background: #f7fafc;
        }

        .tab-icon {
          font-size: 16px;
        }

        .stats-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 6px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .stat-card.total {
          border-left: 4px solid #667eea;
        }

        .stat-card.paid {
          border-left: 4px solid #38a169;
        }

        .stat-card.remaining {
          border-left: 4px solid #e53e3e;
        }

        .stat-card.progress {
          border-left: 4px solid #ed8936;
        }

        .stat-icon {
          font-size: 24px;
          width: 30px;
          height: 30px;
          background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-content {
          flex: 1;
        }

        .stat-label {
          font-size: 14px;
          color: #718096;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 18px;
          font-weight: 500;
          color: #1a202c;
          margin-bottom: 4px;
        }

        .stat-subtitle {
          font-size: 12px;
          color: #a0aec0;
        }

        .progress-bar-large {
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          margin-top: 8px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(to right, #38a169, #68d391);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .modal-content-premium-paiement {
          flex: 1;
          overflow-y: auto;
          padding: 2px;
          background: white;
          display: flex;
          flex-direction: column;
        }

        .tab-content-paiement {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e8edf2;
        }

        .section-title {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #1a202c;
        }

        .section-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .bouton-action-paie {
          background: linear-gradient(135deg, #d0f3ff, #a4b9cb);
          color: #1a202c;
          border: none;
          border-radius: 8px;
          padding: 5px 5px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 2px;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(167, 173, 171, 0.2);
        }

        .bouton-action-paie:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(167, 173, 171, 0.2);
        }

        .frais-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 16px;
        }

        .frais-card {
          background: #f7fafc;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #e2e8f0;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .frais-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .frais-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .frais-title h4 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
          color: #1a202c;
        }

        .frais-tags {
          display: flex;
          gap: 8px;
        }

        .tag-type, .tag-periodicite {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 20px;
          font-weight: 500;
        }

        .tag-type {
          background: #e8edf2;
          color: #4a5568;
        }

        .tag-periodicite {
          background: #c6f6d5;
          color: #22543d;
        }

        .frais-progress {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .progress-mini {
          width: 100px;
          height: 6px;
          background: #e2e8f0;
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill-mini {
          height: 100%;
          background: linear-gradient(to right, #38a169, #68d391);
          border-radius: 3px;
        }

        .progress-percent {
          font-size: 14px;
          font-weight: 600;
          color: #38a169;
        }

        .frais-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 20px;
          padding: 16px;
          background: white;
          border-radius: 8px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .stat-item-label {
          font-size: 12px;
          color: #718096;
          margin-bottom: 4px;
        }

        .stat-item-value {
          font-size: 18px;
          font-weight: 600;
        }

        .stat-item-value.total {
          color: #667eea;
        }

        .stat-item-value.paid {
          color: #38a169;
        }

        .stat-item-value.remaining {
          color: #e53e3e;
        }

        .frais-paiements {
          border-top: 1px solid #e8edf2;
          padding-top: 16px;
        }

        .paiements-title {
          font-size: 14px;
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 12px;
        }

        .paiements-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .paiement-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: white;
          border-radius: 6px;
          border-left: 3px solid #38a169;
        }

        .paiement-date {
          font-size: 12px;
          color: #718096;
        }

        .paiement-montant {
          font-size: 14px;
          font-weight: 600;
          color: #38a169;
        }

        .paiement-details {
          font-size: 11px;
          color: #a0aec0;
        }

        .table-responsive-paiement {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .table-premium-paiement {
          width: 100%;
          border-collapse: collapse;
        }

        .table-premium-paiement thead {
          background: #f7fafc;
        }

        .table-premium-paiement th {
          padding: 16px;
          text-align: left;
          font-weight: 600;
          color: #4a5568;
          border-bottom: 2px solid #e8edf2;
          font-size: 14px;
          white-space: nowrap;
        }

        .table-premium-paiement td {
          padding: 16px;
          border-bottom: 1px solid #e8edf2;
          color: #4a5568;
          font-size: 14px;
        }

        .table-premium-paiement tbody tr:hover {
          background: #f7fafc;
        }

        .categorie-badge {
          background: #e8edf2;
          color: #4a5568;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }

        .type-badge {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
        }

        .type-badge.versement {
          background: #c6f6d5;
          color: #22543d;
        }

        .type-badge.global {
          background: #e8edf2;
          color: #4a5568;
        }

        .mode-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }

        .mode-badge.especes {
          background: #fed7d7;
          color: #742a2a;
        }

        .mode-badge.cheque {
          background: #e8edf2;
          color: #4a5568;
        }

        .mode-badge.virement {
          background: #c6f6d5;
          color: #22543d;
        }

        .mode-badge.mobile {
          background: #c6f6d5;
          color: #22543d;
        }

        .receipt-number {
          font-family: 'Monaco', 'Courier New', monospace;
          color: #667eea;
          font-weight: 600;
        }

        .montant-paiement {
          font-weight: 600;
          color: #059669;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-badge.actif {
          background: #c6f6d5;
          color: #22543d;
        }

        .status-badge.inactif {
          background: #fed7d7;
          color: #742a2a;
        }

        .no-data {
          padding: 40px 16px;
          text-align: center;
        }

        .no-data-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .no-data-icon {
          font-size: 32px;
          opacity: 0.5;
        }

        .modal-footer-premium {
          background: white;
          border-radius: 0 0 16px 16px;
          padding: 20px 24px;
          border-top: 1px solid #e8edf2;
        }

        .footer-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .btn-secondary-premium {
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 500;
          color: #4a5568;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary-premium:hover {
          background: #edf2f7;
          transform: translateY(-1px);
        }

        .btn-primary-premium {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 500;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .btn-primary-premium:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          gap: 20px;
        }

        .spinner-premium {
          width: 50px;
          height: 50px;
          border: 4px solid #e8edf2;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          gap: 20px;
        }

        .error-icon {
          font-size: 48px;
          color: #e53e3e;
        }

        .error-message {
          color: #4a5568;
          text-align: center;
        }

        .btn-retry {
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          cursor: pointer;
        }

        .overlay-modal-premium {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-historique {
          width: 100%;
          max-width: 1200px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
        }

        @media (max-width: 1024px) {
          .stats-summary {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .frais-grid {
            grid-template-columns: 1fr;
          }
          
          .modal-historique {
            max-width: 95%;
          }
        }

        @media (max-width: 768px) {
          .stats-summary {
            grid-template-columns: 1fr;
          }
          
          .eleve-info-header {
            flex-direction: column;
            text-align: center;
            gap: 12px;
          }
          
          .eleve-metadata {
            justify-content: center;
          }
          
          .tabs-container {
            flex-direction: column;
          }
          
          .header-actions {
            display: flex;
            align-items: center;
            gap: 12px;
          }
        }

        /* Styles pour les boutons d'action */
        .action-button {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .action-button.receipt {
          background: #dcfce7;
          color: #166534;
        }

        .action-button.receipt:hover {
          background: #bbf7d0;
          transform: translateY(-2px);
        }

        .action-button.edit {
          background: #dbeafe;
          color: #1e40af;
        }

        .action-button.edit:hover {
          background: #bfdbfe;
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

        .actions-buttons {
          display: flex;
          gap: 8px;
        }

        .heure-paiement {
          font-size: 10px;
          color: #94a3b8;
          margin-top: 2px;
        }

        /* Ajoutez ces styles dans la section <style jsx> */

.bouton-paiement {
  background: linear-gradient(135deg, #85deff, #5bb2ff);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
}

.bouton-paiement:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.modal-paiement {
  max-width: 1200px;
  width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
}

.categorie-paiement {
  font-size: 16px;
  font-weight: 600;
  border-radius: 50px;
  border: 1px solid #f57f5b;
  background: linear-gradient(135deg, #f6d5a9, #f57f5b);
  color: #853500;
  padding: 4px 12px;
  display: inline-block;
}

.input-modern.disabled {
  background: #f3f4f6;
  color: #6b7280;
  cursor: not-allowed;
}

/* Styles pour le formulaire de paiement dans la modale */
.formulaire-paiement {
  padding: 20px;
}

.etape {
  background: #f9fafb;
  border-radius: 12px;
  padding: 10px;
  margin-bottom: 16px;
  border: 1px solid #e5e7eb;
  
}

.etape h4 {
  margin: 0 0 6px 0;
  color: #374151;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.groupe-champ {
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
}

.groupe-champ label {
  font-size: 13px;
  color: #4b5563;
  margin-bottom: 5px;
  font-weight: 500;
}

.groupe-champ input,
.groupe-champ select,
.groupe-champ textarea {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
}

.groupe-champ input:focus,
.groupe-champ select:focus,
.groupe-champ textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.liste-frais-scolaires {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.carte-frais-scolaire {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.2s;
}

.carte-frais-scolaire:hover {
  border-color: #9ca3af;
  transform: translateY(-2px);
}

.carte-frais-scolaire.selectionne {
  border-color: #3b82f6;
  background: #eff6ff;
}

.carte-frais-scolaire.desactive {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #f9fafb;
  border-color: #e5e7eb;
  pointer-events: none;
}

.entete-carte-frais {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.entete-carte-frais h5 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.periodicite-frais {
  background: #e5e7eb;
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  color: #4b5563;
}

.details-carte-frais {
  font-size: 12px;
}

.montant-frais {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.montant-restant {
  color: #dc2626;
  font-weight: 600;
}

.grille-details-paiement {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.plein-largeur {
  grid-column: 1 / -1;
}

.resume-paiement {
  background: #f3f4f6;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.resume-paiement h5 {
  margin: 0 0 10px 0;
  font-size: 15px;
  color: #374151;
}

.details-resume {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ligne-resume {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  border-bottom: 1px dashed #d1d5db;
}

.montant-total {
  font-weight: 600;
  color: #059669;
}

.actions-formulaire {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.bouton-secondaire {
  padding: 10px 24px;
  background: #f3f4f6;
  color: #4b5563;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.bouton-secondaire:hover {
  background: #e5e7eb;
}

.bouton-primaire {
  padding: 10px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.versements-existants {
          margin-top: 20px;
        }
        
        .versements-existants h5 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #475569;
        }
        
        .liste-versements-existants {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 10px;
        }
        
        .carte-versement-existant {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 15px;
        }

.bouton-primaire:hover {
  background: #2563eb;
}

.bouton-primaire:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 10px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 10px;
  transition: all 0.2s;
}

.radio-label:hover {
  border-color: #9ca3af;
}

.configuration-versements {
  margin-top: 15px;
  padding: 15px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.info-frais-eleve {
  margin-top: 2px;
  padding: 15px;
  background: #f9fafb;
  border-radius: 8px;
}

.info-frais-eleve h5 {
  margin: 0 0 1px 0;
  font-size: 14px;
  color: #374151;
}

.liste-frais-existants {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.carte-frais-existant {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px;
}

.statut-frais {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}

.statut-frais.paye {
  background: #d1fae5;
  color: #065f46;
}

.statut-frais.partiel {
  background: #fef3c7;
  color: #92400e;
}
      `}</style>
    </div>
  );
}