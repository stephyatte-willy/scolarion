'use client';

import { useState, useEffect } from 'react';
import './GestionPersonnel.css';

// Interfaces pour les paramètres
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

// Interface étendue pour inclure le personnel administratif
interface Personnel {
  id: number;
  user_id: number;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  date_naissance: string;
  lieu_naissance?: string;
  genre: 'M' | 'F';
  adresse?: string;
  telephone?: string;
  specialite?: string;
  diplome?: string;
  date_embauche: string;
  statut: 'actif' | 'inactif' | 'retraite' | 'demission';
  type_contrat: 'titulaire' | 'contractuel' | 'vacataire';
  type_personnel: 'instituteur' | 'professeur' | 'administratif';
  matieres_enseignees?: string;
  fonction?: string;
  departement?: string;
  salaire?: number;
  created_at: string;
  nombre_classes?: number;
  classes_principales?: string;
  avatar_url?: string;
  domaine_enseignement?: string;
}

interface Matiere {
  id: number;
  nom: string;
  niveau: 'primaire' | 'college' | 'lycee';
  couleur?: string;
  icone?: string;
}

interface Classe {
  id: number;
  nom: string;
  niveau: string;
  cycle: string;
  professeur_principal_id?: number;
  nom_complet?: string;
  professeur_nom?: string;
  professeur_prenom?: string;
  nombre_eleves?: number;
}

interface FiltresPersonnel {
  recherche?: string;
  specialite?: string;
  statut?: string;
  type_contrat?: string;
  type_personnel?: string;
  genre?: string;
  fonction?: string;
  departement?: string;
}

interface DocumentPersonnel {
  id: number;
  personnel_id: number;
  nom_fichier: string;
  chemin_fichier: string;
  type_document: string;
  body: string;
  taille: number;
  date_upload: string;
  uploaded_by?: number;
}

interface Props {
  onRetourTableauDeBord: () => void;
}

interface AlerteToastProps {
  type: TypeAlerte;
  message: string;
  onClose: () => void;
}

type TypeAlerte = 'success' | 'error' | 'info' | 'warning';

export default function GestionPersonnel({ onRetourTableauDeBord }: Props) {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [specialites, setSpecialites] = useState<string[]>([]);
  const [fonctions, setFonctions] = useState<string[]>([]);
  const [departements, setDepartements] = useState<string[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [matieresSelectionnees, setMatieresSelectionnees] = useState<string[]>([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [modalDetailOuvert, setModalDetailOuvert] = useState(false);
  const [modalSuppressionOuvert, setModalSuppressionOuvert] = useState(false);
  const [modalSuppressionMultipleOuvert, setModalSuppressionMultipleOuvert] = useState(false);
  const [personnelSelectionne, setPersonnelSelectionne] = useState<Personnel | null>(null);
  const [personnelASupprimer, setPersonnelASupprimer] = useState<Personnel | null>(null);
  const [filtres, setFiltres] = useState<FiltresPersonnel>({});
  const [statistiques, setStatistiques] = useState<any>(null);
  const [statistiquesTypes, setStatistiquesTypes] = useState<any>(null);
  const [chargementSoumission, setChargementSoumission] = useState(false);
  const [classesDisponibles, setClassesDisponibles] = useState<Classe[]>([]);
  const [classesPersonnel, setClassesPersonnel] = useState<Classe[]>([]);
  const [modalClassesOuvert, setModalClassesOuvert] = useState(false);
  const [personnelPourClasses, setPersonnelPourClasses] = useState<Personnel | null>(null);
  const [chargementClasses, setChargementClasses] = useState(false);
  const [impressionEnCours, setImpressionEnCours] = useState(false);
  const [alerte, setAlerte] = useState<{type: TypeAlerte, message: string} | null>(null);
  const [documents, setDocuments] = useState<DocumentPersonnel[]>([]);
  const [documentsPersonnel, setDocumentsPersonnel] = useState<DocumentPersonnel[]>([]);
  const [modalDocumentsOuvert, setModalDocumentsOuvert] = useState(false);
  const [documentsParPersonnel, setDocumentsParPersonnel] = useState<{[key: number]: DocumentPersonnel[]}>({});
  const [activeOnglet, setActiveOnglet] = useState<'info' | 'documents' | 'classes'>('info');
  
  // États pour les paramètres dynamiques
  const [parametresEcole, setParametresEcole] = useState<ParametresEcole | null>(null);
  const [parametresApp, setParametresApp] = useState<ParametresApp | null>(null);
  
  // ÉTAT POUR LA SÉLECTION MULTIPLE DU PERSONNEL
  const [selectionPersonnel, setSelectionPersonnel] = useState<{
    personnelSelectionne: number[];
    selectionTous: boolean;
  }>({
    personnelSelectionne: [],
    selectionTous: false
  });

  const [soumissionEnCours, setSoumissionEnCours] = useState(false);
  
  const [formData, setFormData] = useState({
  nom: '',
  prenom: '',
  email: '',
  password: 'Scolarion26', // Ajout du champ password avec valeur par défaut
  date_naissance: '',
  lieu_naissance: '',
  genre: 'M' as 'M' | 'F',
  adresse: '',
  telephone: '',
  specialite: '',
  diplome: '',
  date_embauche: '',
  statut: 'actif' as 'actif' | 'inactif' | 'retraite' | 'demission',
  type_contrat: 'titulaire' as 'titulaire' | 'contractuel' | 'vacataire',
  type_personnel: 'professeur' as 'instituteur' | 'professeur' | 'administratif',
  matieres_enseignees: '',
  fonction: '',
  departement: '',
  salaire: '',
  avatar_url: '',
  matricule: ''
});

  const [uploadPhoto, setUploadPhoto] = useState({
    enCours: false,
    progression: 0,
    fichier: null as File | null,
    apercu: ''
  });

  const [uploadDocuments, setUploadDocuments] = useState<{
    fichiers: File[];
    enCours: boolean;
    progression: number;
  }>({
    fichiers: [],
    enCours: false,
    progression: 0
  });

  const [erreurFormulaire, setErreurFormulaire] = useState('');
  
  const [tri, setTri] = useState<{
    colonne: keyof Personnel | 'nom_complet' | 'anciennete';
    direction: 'asc' | 'desc';
  }>({
    colonne: 'nom_complet',
    direction: 'asc'
  });

  // ==================== FONCTIONS DE FORMATAGE DYNAMIQUE ====================

  // Formater une date selon la configuration
  const formaterDate = (date: Date | string): string => {
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

  // Formater un montant selon la configuration
  const formaterMontant = (montant: number): string => {
    if (!parametresApp) {
      return `${montant} F CFA`;
    }
    
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: parametresApp.devise,
        currencyDisplay: 'code'
      }).format(montant).replace(parametresApp.devise, parametresApp.symbole_devise);
    } catch (error) {
      console.error('Erreur formatage montant:', error);
      return `${montant} ${parametresApp.symbole_devise}`;
    }
  };

  // ==================== FONCTIONS DE GESTION DE SÉLECTION MULTIPLE ====================

  // Gérer la sélection/déselection d'un membre du personnel
  const gererSelectionPersonnel = (id: number) => {
    setSelectionPersonnel(prev => {
      const personnelSelectionne = prev.personnelSelectionne.includes(id)
        ? prev.personnelSelectionne.filter(personnelId => personnelId !== id)
        : [...prev.personnelSelectionne, id];
      
      return {
        ...prev,
        personnelSelectionne,
        selectionTous: personnelSelectionne.length === personnel.length
      };
    });
  };

  // Gérer la sélection/déselection de tous les membres du personnel
  const gererSelectionTous = () => {
    setSelectionPersonnel(prev => {
      const selectionTous = !prev.selectionTous;
      const personnelSelectionne = selectionTous 
        ? personnel.map(membre => membre.id)
        : [];
      
      return {
        ...prev,
        selectionTous,
        personnelSelectionne
      };
    });
  };

  // Vérifier si un membre du personnel est sélectionné
  const estPersonnelSelectionne = (id: number): boolean => {
    return selectionPersonnel.personnelSelectionne.includes(id);
  };

  // Obtenir les membres du personnel sélectionnés
  const obtenirPersonnelSelectionne = () => {
    return personnel.filter(membre => 
      selectionPersonnel.personnelSelectionne.includes(membre.id)
    );
  };

  // ==================== FONCTIONS DE SUPPRESSION MULTIPLE ====================

  const ouvrirModalSuppressionMultiple = () => {
    if (selectionPersonnel.personnelSelectionne.length === 0) {
      setAlerte({ type: 'error', message: 'Veuillez sélectionner au moins un membre du personnel à supprimer' });
      return;
    }
    setModalSuppressionMultipleOuvert(true);
  };

  const fermerModalSuppressionMultiple = () => {
    setModalSuppressionMultipleOuvert(false);
  };

  const supprimerPersonnelMultiple = async () => {
    if (selectionPersonnel.personnelSelectionne.length === 0) return;

    try {
      setSoumissionEnCours(true);
      
      // Filtrer les membres qui ont des classes (si nécessaire)
      const membresAvecClasses = selectionPersonnel.personnelSelectionne.filter(id => {
        const membre = personnel.find(p => p.id === id);
        return membre && membre.nombre_classes && membre.nombre_classes > 0;
      });
      
      if (membresAvecClasses.length > 0) {
        const noms = membresAvecClasses.map(id => {
          const membre = personnel.find(p => p.id === id);
          return `${membre?.prenom} ${membre?.nom}`;
        }).join(', ');
        
        setAlerte({ 
          type: 'error', 
          message: `❌ Impossible de supprimer ${membresAvecClasses.length} membre(s) ayant des classes: ${noms}` 
        });
        setSelectionPersonnel({ personnelSelectionne: [], selectionTous: false });
        fermerModalSuppressionMultiple();
        setSoumissionEnCours(false);
        return;
      }
      
      // Effectuer les suppressions une par une pour mieux gérer les erreurs
      const suppressionsReussies = [];
      const suppressionsEchouees = [];
      
      for (const id of selectionPersonnel.personnelSelectionne) {
        try {
          const response = await fetch(`/api/enseignants/${id}`, { 
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          const resultat = await response.json();
          
          if (response.ok && resultat.success) {
            suppressionsReussies.push(id);
          } else {
            suppressionsEchouees.push(id);
          }
        } catch (error) {
          console.error(`❌ Erreur suppression membre ${id}:`, error);
          suppressionsEchouees.push(id);
        }
      }

      // Message de résultat
      if (suppressionsReussies.length > 0) {
        setAlerte({ 
          type: 'success', 
          message: `🎉 ${suppressionsReussies.length} membre(s) du personnel supprimé(s) avec succès !` 
        });
      }
      
      if (suppressionsEchouees.length > 0) {
        setAlerte({ 
          type: 'error', 
          message: `❌ Échec de suppression pour ${suppressionsEchouees.length} membre(s)` 
        });
      }
      
      // Réinitialiser et recharger
      setSelectionPersonnel({ personnelSelectionne: [], selectionTous: false });
      fermerModalSuppressionMultiple();
      await chargerDonnees();
      await chargerStatistiques();
      await chargerStatistiquesTypes();
      
    } catch (error) {
      console.error('❌ Erreur suppression multiple:', error);
      setAlerte({ type: 'error', message: '❌ Erreur lors de la suppression des membres du personnel' });
    } finally {
      setSoumissionEnCours(false);
    }
  };

  // ==================== CHARGEMENT DES PARAMÈTRES ====================

  useEffect(() => {
    chargerParametresInitiaux();
  }, []);

  const chargerParametresInitiaux = async () => {
    try {
      await Promise.all([
        chargerParametresEcole(),
        chargerParametresApp()
      ]);
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
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
      }
    } catch (error) {
      console.error('Erreur chargement paramètres app:', error);
    }
  };

  const AlerteToast = ({ type, message, onClose }: AlerteToastProps) => {
    useEffect(() => {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      
      return () => clearTimeout(timer);
    }, [onClose]);
    
    const getCouleurType = () => {
      switch (type) {
        case 'success': return '#10b981';
        case 'error': return '#ef4444';
        case 'warning': return '#f59e0b';
        case 'info': return '#3b82f6';
        default: return '#3b82f6';
      }
    };
    
    const getIcone = () => {
      switch (type) {
        case 'success': return '✅';
        case 'error': return '❌';
        case 'warning': return '⚠️';
        case 'info': return 'ℹ️';
        default: return 'ℹ️';
      }
    };
    
    return (
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 99999, 
        minWidth: '300px',
        maxWidth: '400px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        border: `2px solid ${getCouleurType()}`,
        overflow: 'hidden',
        animation: 'slideInRight 0.3s ease-out'
      }}>
        <style>
          {`
            @keyframes slideInRight {
              from {
                transform: translateX(100%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
            
            @keyframes progressBar {
              from {
                width: 100%;
              }
              to {
                width: 0%;
              }
            }
          `}
        </style>
        
        <div style={{
          height: '3px',
          backgroundColor: getCouleurType(),
          animation: 'progressBar 3s linear forwards'
        }}></div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '16px 20px',
          gap: '16px'
        }}>
          <div style={{
            fontSize: '24px',
            flexShrink: 0
          }}>
            {getIcone()}
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{
              fontWeight: '700',
              fontSize: '14px',
              color: '#1e293b',
              marginBottom: '4px',
              textTransform: 'uppercase'
            }}>
              {type === 'success' ? 'Succès' : 
               type === 'error' ? 'Erreur' : 
               type === 'warning' ? 'Attention' : 
               'Information'}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#475569',
              lineHeight: '1.5'
            }}>
              {message}
            </div>
          </div>
          
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              color: '#64748b',
              fontSize: '18px',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            ✕
          </button>
        </div>
      </div>
    );
  };

  const genererMatriculeAutomatique = (typePersonnel: 'instituteur' | 'professeur' | 'administratif') => {
    const suggestionPrefixe = typePersonnel === 'instituteur' ? 'INST' : 
                             typePersonnel === 'professeur' ? 'PROF' : 
                             'ADM';
    const annee = new Date().getFullYear().toString().slice(-2);
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `${suggestionPrefixe}${annee}${random}`;
  };

  // 1. FONCTION POUR IMPRIMER TOUT LE PERSONNEL (avec paramètres dynamiques)
  const imprimerToutLePersonnel = async () => {
    if (personnel.length === 0) {
      setAlerte({ type: 'error', message: 'Aucun membre du personnel à imprimer' });
      return;
    }
    
    if (impressionEnCours) return;
    
    setImpressionEnCours(true);
    
    try {
      console.log('🖨️ Impression de tout le personnel:', personnel.length, 'membres');
      
      let ecoleInfo = parametresEcole;
      if (!ecoleInfo) {
        try {
          const response = await fetch('/api/parametres/ecole');
          const data = await response.json();
          if (data.success) {
            ecoleInfo = data.parametres;
          }
        } catch (error) {
          console.warn('⚠️ Impossible de charger les paramètres école:', error);
        }
      }
      
      if (!ecoleInfo) {
        ecoleInfo = {
          id: 0,
          nom_ecole: "Établissement Scolaire",
          slogan: "",
          adresse: "",
          telephone: "",
          email: "",
          logo_url: null,
          couleur_principale: "#3B82F6",
          annee_scolaire: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
        };
      }
      
      const totalActifs = personnel.filter(e => e.statut === 'actif').length;
      const totalInstituteurs = personnel.filter(e => e.type_personnel === 'instituteur').length;
      const totalProfesseurs = personnel.filter(e => e.type_personnel === 'professeur').length;
      const totalAdministratif = personnel.filter(e => e.type_personnel === 'administratif').length;
      const totalHommes = personnel.filter(e => e.genre === 'M').length;
      const totalFemmes = personnel.filter(e => e.genre === 'F').length;    
      
      const dateImpression = new Date();
      const dateFormatted = formaterDate(dateImpression);
      const heureFormatted = dateImpression.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      const contenuImprimable = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Liste du Personnel - ${ecoleInfo.nom_ecole}</title>
          <style>
            body { 
              font-family: 'Segoe UI', Arial, sans-serif; 
              margin: 0;
              padding: 20px;
              line-height: 1.6;
              color: #333;
              background: #fff;
            }
            .header {
              text-align: center;
              border-bottom: 4px solid ${ecoleInfo.couleur_principale || '#3B82F6'};
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .school-name {
              font-size: 28px;
              font-weight: bold;
              color: ${ecoleInfo.couleur_principale || '#2c3e50'};
              margin: 10px 0;
              text-transform: uppercase;
            }
            .school-info {
              color: #666;
              font-size: 14px;
              margin: 5px 0;
              display: flex;
              justify-content: center;
              gap: 20px;
              flex-wrap: wrap;
            }
            .document-title {
              font-size: 22px;
              margin: 20px 0;
              color: #34495e;
              background: linear-gradient(90deg, ${ecoleInfo.couleur_principale || '#3B82F6'}20, transparent);
              padding: 15px;
              border-radius: 5px;
              text-align: center;
            }
            .statistics {
              display: grid;
              grid-template-columns: repeat(6, 1fr);
              gap: 15px;
              margin: 25px 0;
              padding: 20px;
              background: #f8fafc;
              border-radius: 10px;
              border: 1px solid #e2e8f0;
            }
            .stat-item {
              text-align: center;
              padding: 15px;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .stat-label {
              font-size: 12px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 5px;
            }
            .stat-value {
              font-size: 24px;
              font-weight: bold;
              color: ${ecoleInfo.couleur_principale || '#3B82F6'};
            }
            .stat-sub {
              font-size: 12px;
              color: #94a3b8;
              margin-top: 3px;
            }
            .table-container {
              overflow-x: auto;
              margin: 30px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th {
              background: ${ecoleInfo.couleur_principale || '#3B82F6'};
              color: white;
              padding: 12px 15px;
              text-align: left;
              font-weight: 600;
              border: 1px solid ${ecoleInfo.couleur_principale ? '#1d4ed8' : '#1e293b'};
            }
            td {
              padding: 12px 15px;
              border: 1px solid #e2e8f0;
            }
            tr:nth-child(even) {
              background: #f8fafc;
            }
            .badge-instituteur {
              background: #dbeafe;
              color: #1e40af;
            }
            .badge-professeur {
              background: #fce7f3;
              color: #be185d;
            }
            .badge-administratif {
              background: #dcfce7;
              color: #166534;
            }
            .badge-titulaire {
              background: #d1fae5;
              color: #065f46;
            }
            .badge-contractuel {
              background: #fef3c7;
              color: #92400e;
            }
            .badge-vacataire {
              background: #dbeafe;
              color: #1e40af;
            }
            .badge-statut {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 20px;
              font-size: 11px;
              font-weight: 600;
              color: white;
            }
            .photo-cell {
              text-align: center;
            }
            .photo-mini {
              width: 40px;
              height: 40px;
              border-radius: 50%;
              object-fit: cover;
              border: 2px solid ${ecoleInfo.couleur_principale || '#3B82F6'};
            }
            .photo-placeholder {
              width: 40px;
              height: 40px;
              border-radius: 50%;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              display: inline-flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 14px;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              font-size: 12px;
              color: #7f8c8d;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            @media print {
              @page {
                margin: 15mm;
                size: A4;
              }
              body { 
                margin: 0 !important;
                padding: 10px !important;
                font-size: 11pt !important;
              }
              .no-print { display: none !important; }
              th { font-size: 10pt; padding: 8px 10px; }
              td { font-size: 10pt; padding: 8px 10px; }
              .statistics { 
                grid-template-columns: repeat(3, 1fr);
                break-inside: avoid; 
              }
              table { page-break-inside: avoid; }
              tr { page-break-inside: avoid; }
            }
            .signature-area {
              margin-top: 60px;
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 40px;
              text-align: center;
            }
            .signature-line {
              border-top: 1px solid #000;
              margin-top: 60px;
              padding-top: 5px;
              width: 80%;
              margin-left: 10%;
            }
            .date-print {
              text-align: right;
              font-size: 12px;
              color: #666;
              margin-bottom: 20px;
            }
            .logo-header {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 15px;
              margin-bottom: 10px;
            }
            .logo-img {
              max-height: 60px;
              max-width: 60px;
              object-fit: contain;
            }
            .actions-impression {
              margin-top: 20px;
              text-align: center;
              padding: 20px;
              background: #f8fafc;
              border-radius: 8px;
            }
            .bouton-impression {
              padding: 10px 20px;
              background: #3B82F6;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              margin: 5px;
              font-size: 14px;
            }
            .bouton-fermer {
              padding: 10px 20px;
              background: #6b7280;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              margin: 5px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="date-print">
            Imprimé le: ${dateFormatted} à ${heureFormatted}
          </div>
          
          <div class="header">
            <div class="logo-header">
              ${ecoleInfo.logo_url ? `<img src="${ecoleInfo.logo_url}" class="logo-img" alt="Logo">` : ''}
              <div>
                <div class="school-name">${ecoleInfo.nom_ecole || "ÉTABLISSEMENT SCOLAIRE"}</div>
                <div class="school-info">
                  ${ecoleInfo.adresse ? `<span>📍 ${ecoleInfo.adresse}</span>` : ''}
                  ${ecoleInfo.telephone ? `<span>📞 ${ecoleInfo.telephone}</span>` : ''}
                  ${ecoleInfo.email ? `<span>✉️ ${ecoleInfo.email}</span>` : ''}
                </div>
              </div>
            </div>
            
            <div class="document-title">
              📋 LISTE DU PERSONNEL - ANNÉE SCOLAIRE ${ecoleInfo.annee_scolaire || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`}
            </div>
          </div>
          
          <div class="statistics">
            <div class="stat-item">
              <div class="stat-label">Total Personnel</div>
              <div class="stat-value">${personnel.length}</div>
              <div class="stat-sub">${totalActifs} actifs</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Instituteurs</div>
              <div class="stat-value">${totalInstituteurs}</div>
              <div class="stat-sub">${totalInstituteurs > 0 ? Math.round((totalInstituteurs/personnel.length)*100) : 0}%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Professeurs</div>
              <div class="stat-value">${totalProfesseurs}</div>
              <div class="stat-sub">${totalProfesseurs > 0 ? Math.round((totalProfesseurs/personnel.length)*100) : 0}%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Administratif</div>
              <div class="stat-value">${totalAdministratif}</div>
              <div class="stat-sub">${totalAdministratif > 0 ? Math.round((totalAdministratif/personnel.length)*100) : 0}%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Hommes</div>
              <div class="stat-value">${totalHommes}</div>
              <div class="stat-sub">${totalHommes > 0 ? Math.round((totalHommes/personnel.length)*100) : 0}%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Femmes</div>
              <div class="stat-value">${totalFemmes}</div>
              <div class="stat-sub">${totalFemmes > 0 ? Math.round((totalFemmes/personnel.length)*100) : 0}%</div>
            </div>
          </div>
          
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Photo</th>
                  <th>Matricule</th>
                  <th>Nom et Prénom</th>
                  <th>Type</th>
                  <th>Spécialité/Fonction</th>
                  <th>Contrat</th>
                  <th>Classes/Service</th>
                </tr>
              </thead>
              <tbody>
                ${personnel.map((membre, index) => {
                  const anciennete = calculerAnciennete(membre.date_embauche);
                  const initiales = membre.prenom.charAt(0) + membre.nom.charAt(0);
                  let specialite = '';
                  
                  if (membre.type_personnel === 'instituteur') {
                    specialite = membre.matieres_enseignees || 'Non défini';
                  } else if (membre.type_personnel === 'professeur') {
                    specialite = membre.specialite || 'Non défini';
                  } else {
                    specialite = membre.fonction || 'Non défini';
                    if (membre.departement) {
                      specialite += ` (${membre.departement})`;
                    }
                  }
                  
                  return `
                    <tr>
                      <td>${index + 1}</td>
                      <td class="photo-cell">
                        ${membre.avatar_url 
                          ? `<img src="${membre.avatar_url}" class="photo-mini" alt="">`
                          : `<div class="photo-placeholder">${initiales}</div>`
                        }
                      </td>
                      <td><strong>${membre.matricule}</strong></td>
                      <td>
                        <strong>${membre.nom} ${membre.prenom}</strong>
                        <div style="font-size: 11px; color: #64748b;">${membre.email}</div>
                      </td>
                      <td>
                        <span class="badge-type badge-${membre.type_personnel}">
                          ${membre.type_personnel === 'instituteur' ? '🏫 Instituteur' : 
                            membre.type_personnel === 'professeur' ? '👨‍🏫 Professeur' : 
                            '👨‍💼 Administratif'}
                        </span>
                      </td>
                      <td>${specialite}</td>
                      <td>
                        <span class="badge-contrat badge-${membre.type_contrat}">
                          ${membre.type_contrat}
                        </span>
                      </td>
                      <td>
                        ${membre.type_personnel !== 'administratif' 
                          ? `${membre.nombre_classes || 0} classe${membre.nombre_classes !== 1 ? 's' : ''}`
                          : membre.departement || 'Service général'
                        }
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="signature-area">
            <div>
              <div class="signature-line"></div>
              <div style="margin-top: 5px; font-size: 14px;"><strong>Le Directeur</strong></div>
              <div style="font-size: 12px; color: #666;">Signature et cachet</div>
            </div>
            <div>
              <div class="signature-line"></div>
              <div style="margin-top: 5px; font-size: 14px;"><strong>Le Responsable des Ressources Humaines</strong></div>
              <div style="font-size: 12px; color: #666;">Signature</div>
            </div>
          </div>
          
          <div class="footer">
            <div>Document généré par le Système de Gestion Scolaire</div>
            <div>Liste du personnel • ${personnel.length} membre${personnel.length > 1 ? 's' : ''} • ${totalActifs} actif${totalActifs > 1 ? 's' : ''}</div>
            <div style="margin-top: 10px; color: #aaa; font-size: 10px;">
              Document confidentiel • Édition: ${dateFormatted} • Page 1/1
            </div>
          </div>
          
          <div class="actions-impression no-print">
            <button onclick="window.print()" class="bouton-impression">
              🖨️ Imprimer
            </button>
            <button onclick="window.close()" class="bouton-fermer">
              ✕ Fermer
            </button>
          </div>
          
          <script>
            setTimeout(function() {
              window.print();
            }, 1000);
            
            window.onafterprint = function() {
              setTimeout(function() {
                if (confirm('Impression terminée. Voulez-vous fermer cette fenêtre ?')) {
                  window.close();
                }
              }, 500);
            };
          </script>
        </body>
        </html>
      `;
      
      const fenetreImpression = window.open('', '_blank', 'width=1100,height=700,toolbar=no,location=no,status=no,menubar=no');
      if (fenetreImpression) {
        fenetreImpression.document.write(contenuImprimable);
        fenetreImpression.document.close();
        fenetreImpression.focus();
        
        setAlerte({ 
          type: 'success', 
          message: `Fenêtre d'impression ouverte pour ${personnel.length} membre(s) du personnel` 
        });
      } else {
        throw new Error('Impossible d\'ouvrir la fenêtre d\'impression');
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'impression:', error);
      setAlerte({ 
        type: 'error', 
        message: `Erreur d'impression: ${error.message}` 
      });
    } finally {
      setImpressionEnCours(false);
    }
  };

  // 2. FONCTION POUR IMPRIMER LA LISTE FILTRÉE (avec paramètres dynamiques)
  const imprimerPersonnelFiltres = async () => {
    const personnelAFiltrer = personnelTries;
    
    if (personnelAFiltrer.length === 0) {
      setAlerte({ type: 'error', message: 'Aucun membre du personnel à imprimer avec les filtres actuels' });
      return;
    }
    
    if (impressionEnCours) return;
    
    setImpressionEnCours(true);
    
    try {
      const filtreActif = Object.keys(filtres).some(key => filtres[key as keyof FiltresPersonnel] !== undefined);
      
      let titreFiltre = "LISTE DU PERSONNEL FILTRÉE";
      const detailsFiltres: string[] = [];
      
      if (filtres.recherche) {
        detailsFiltres.push(`Recherche: "${filtres.recherche}"`);
      }
      if (filtres.specialite) {
        detailsFiltres.push(`Spécialité: ${filtres.specialite}`);
      }
      if (filtres.statut) {
        detailsFiltres.push(`Statut: ${filtres.statut}`);
      }
      if (filtres.type_contrat) {
        detailsFiltres.push(`Type de contrat: ${filtres.type_contrat}`);
      }
      if (filtres.type_personnel) {
        detailsFiltres.push(`Type: ${filtres.type_personnel}`);
      }
      if (filtres.genre) {
        detailsFiltres.push(`Genre: ${filtres.genre === 'M' ? 'Masculin' : 'Féminin'}`);
      }
      if (filtres.fonction) {
        detailsFiltres.push(`Fonction: ${filtres.fonction}`);
      }
      if (filtres.departement) {
        detailsFiltres.push(`Département: ${filtres.departement}`);
      }
      
      if (!filtreActif) {
        titreFiltre = "LISTE DU PERSONNEL (Affichage actuel)";
      }
      
      let ecoleInfo = parametresEcole;
      if (!ecoleInfo) {
        try {
          const response = await fetch('/api/parametres/ecole');
          const data = await response.json();
          if (data.success) {
            ecoleInfo = data.parametres;
          }
        } catch (error) {
          console.warn('⚠️ Impossible de charger les paramètres école:', error);
        }
      }
      
      if (!ecoleInfo) {
        ecoleInfo = {
          id: 0,
          nom_ecole: "Établissement Scolaire",
          slogan: "",
          adresse: "",
          telephone: "",
          email: "",
          logo_url: null,
          couleur_principale: "#3B82F6",
          annee_scolaire: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
        };
      }
      
      const totalActifs = personnelAFiltrer.filter(e => e.statut === 'actif').length;
      const totalInstituteurs = personnelAFiltrer.filter(e => e.type_personnel === 'instituteur').length;
      const totalProfesseurs = personnelAFiltrer.filter(e => e.type_personnel === 'professeur').length;
      const totalAdministratif = personnelAFiltrer.filter(e => e.type_personnel === 'administratif').length;
      const totalHommes = personnelAFiltrer.filter(e => e.genre === 'M').length;
      const totalFemmes = personnelAFiltrer.filter(e => e.genre === 'F').length;
      
      const dateImpression = new Date();
      const dateFormatted = formaterDate(dateImpression);
      const heureFormatted = dateImpression.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      const contenuImprimable = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Liste du Personnel - ${ecoleInfo.nom_ecole}</title>
          <style>
            body { 
              font-family: 'Segoe UI', Arial, sans-serif; 
              margin: 0;
              padding: 20px;
              line-height: 1.6;
              color: #333;
              background: #fff;
            }
            .header {
              text-align: center;
              border-bottom: 4px solid ${ecoleInfo.couleur_principale || '#3B82F6'};
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .school-name {
              font-size: 28px;
              font-weight: bold;
              color: ${ecoleInfo.couleur_principale || '#2c3e50'};
              margin: 10px 0;
              text-transform: uppercase;
            }
            .school-info {
              color: #666;
              font-size: 14px;
              margin: 5px 0;
              display: flex;
              justify-content: center;
              gap: 20px;
              flex-wrap: wrap;
            }
            .document-title {
              font-size: 22px;
              margin: 20px 0;
              color: #34495e;
              background: linear-gradient(90deg, ${ecoleInfo.couleur_principale || '#3B82F6'}20, transparent);
              padding: 15px;
              border-radius: 5px;
              text-align: center;
            }
            .filtres-info {
              margin: 20px 0;
              padding: 15px;
              background: #f8fafc;
              border-radius: 10px;
              border: 1px solid #e2e8f0;
            }
            .filtres-title {
              font-size: 16px;
              font-weight: 600;
              color: #4b5563;
              margin-bottom: 10px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .filtres-list {
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
            }
            .filtre-badge {
              background: ${ecoleInfo.couleur_principale || '#3B82F6'};
              color: white;
              padding: 6px 12px;
              border-radius: 20px;
              font-size: 12px;
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .filtre-badge:before {
              content: '✓';
              font-weight: bold;
            }
            .statistics {
              display: grid;
              grid-template-columns: repeat(6, 1fr);
              gap: 15px;
              margin: 25px 0;
              padding: 20px;
              background: #f8fafc;
              border-radius: 10px;
              border: 1px solid #e2e8f0;
            }
            .stat-item {
              text-align: center;
              padding: 15px;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .stat-label {
              font-size: 12px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 5px;
            }
            .stat-value {
              font-size: 24px;
              font-weight: bold;
              color: ${ecoleInfo.couleur_principale || '#3B82F6'};
            }
            .stat-sub {
              font-size: 12px;
              color: #94a3b8;
              margin-top: 3px;
            }
            .table-container {
              overflow-x: auto;
              margin: 30px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th {
              background: ${ecoleInfo.couleur_principale || '#3B82F6'};
              color: white;
              padding: 12px 15px;
              text-align: left;
              font-weight: 600;
              border: 1px solid ${ecoleInfo.couleur_principale ? '#1d4ed8' : '#1e293b'};
            }
            td {
              padding: 12px 15px;
              border: 1px solid #e2e8f0;
            }
            tr:nth-child(even) {
              background: #f8fafc;
            }
            
            .badge-instituteur {
              background: #dbeafe;
              color: #1e40af;
            }
            .badge-professeur {
              background: #fce7f3;
              color: #be185d;
            }
            .badge-administratif {
              background: #dcfce7;
              color: #166534;
            }
            .badge-titulaire {
              background: #d1fae5;
              color: #065f46;
            }
            .badge-contractuel {
              background: #fef3c7;
              color: #92400e;
            }
            .badge-vacataire {
              background: #dbeafe;
              color: #1e40af;
            }
            .badge-statut {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 20px;
              font-size: 11px;
              font-weight: 600;
              color: white;
            }
            .photo-cell {
              text-align: center;
            }
            .photo-mini {
              width: 40px;
              height: 40px;
              border-radius: 50%;
              object-fit: cover;
              border: 2px solid ${ecoleInfo.couleur_principale || '#3B82F6'};
            }
            .photo-placeholder {
              width: 40px;
              height: 40px;
              border-radius: 50%;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              display: inline-flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 14px;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              font-size: 12px;
              color: #7f8c8d;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            @media print {
              @page {
                margin: 15mm;
                size: A4;
              }
              body { 
                margin: 0 !important;
                padding: 10px !important;
                font-size: 11pt !important;
              }
              .no-print { display: none !important; }
              th { font-size: 10pt; padding: 8px 10px; }
              td { font-size: 10pt; padding: 8px 10px; }
              .statistics { 
                grid-template-columns: repeat(3, 1fr);
                break-inside: avoid; 
              }
              .filtres-info { break-inside: avoid; }
              table { page-break-inside: avoid; }
              tr { page-break-inside: avoid; }
            }
            .signature-area {
              margin-top: 60px;
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 40px;
              text-align: center;
            }
            .signature-line {
              border-top: 1px solid #000;
              margin-top: 60px;
              padding-top: 5px;
              width: 80%;
              margin-left: 10%;
            }
            .date-print {
              text-align: right;
              font-size: 12px;
              color: #666;
              margin-bottom: 20px;
            }
            .logo-header {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 15px;
              margin-bottom: 10px;
            }
            .logo-img {
              max-height: 60px;
              max-width: 60px;
              object-fit: contain;
            }
            .actions-impression {
              margin-top: 20px;
              text-align: center;
              padding: 20px;
              background: #f8fafc;
              border-radius: 8px;
            }
            .bouton-impression {
              padding: 10px 20px;
              background: #3B82F6;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              margin: 5px;
              font-size: 14px;
            }
            .bouton-fermer {
              padding: 10px 20px;
              background: #6b7280;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              margin: 5px;
              font-size: 14px;
            }
            .note-filtre {
              font-size: 11px;
              color: #666;
              text-align: center;
              margin-top: 5px;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="date-print">
            Imprimé le: ${dateFormatted} à ${heureFormatted}
          </div>
          
          <div class="header">
            <div class="logo-header">
              ${ecoleInfo.logo_url ? `<img src="${ecoleInfo.logo_url}" class="logo-img" alt="Logo">` : ''}
              <div>
                <div class="school-name">${ecoleInfo.nom_ecole || "ÉTABLISSEMENT SCOLAIRE"}</div>
                <div class="school-info">
                  ${ecoleInfo.adresse ? `<span>📍 ${ecoleInfo.adresse}</span>` : ''}
                  ${ecoleInfo.telephone ? `<span>📞 ${ecoleInfo.telephone}</span>` : ''}
                  ${ecoleInfo.email ? `<span>✉️ ${ecoleInfo.email}</span>` : ''}
                </div>
              </div>
            </div>
            
            <div class="document-title">
              ${filtreActif ? '🔍 ' : ''}${titreFiltre} - ANNÉE SCOLAIRE ${ecoleInfo.annee_scolaire || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`}
            </div>
          </div>
          
          ${
            detailsFiltres.length > 0 
              ? `
                <div class="filtres-info">
                  <div class="filtres-title">
                    <span>📋 Filtres appliqués:</span>
                  </div>
                  <div class="filtres-list">
                    ${detailsFiltres.map(filtre => `
                      <div class="filtre-badge">${filtre}</div>
                    `).join('')}
                  </div>
                </div>
              `
              : ''
          }
          
          <div class="statistics">
            <div class="stat-item">
              <div class="stat-label">Membres Filtrés</div>
              <div class="stat-value">${personnelAFiltrer.length}</div>
              <div class="stat-sub">${totalActifs} actifs</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Instituteurs</div>
              <div class="stat-value">${totalInstituteurs}</div>
              <div class="stat-sub">${totalInstituteurs > 0 ? Math.round((totalInstituteurs/personnelAFiltrer.length)*100) : 0}%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Professeurs</div>
              <div class="stat-value">${totalProfesseurs}</div>
              <div class="stat-sub">${totalProfesseurs > 0 ? Math.round((totalProfesseurs/personnelAFiltrer.length)*100) : 0}%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Administratif</div>
              <div class="stat-value">${totalAdministratif}</div>
              <div class="stat-sub">${totalAdministratif > 0 ? Math.round((totalAdministratif/personnelAFiltrer.length)*100) : 0}%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Hommes</div>
              <div class="stat-value">${totalHommes}</div>
              <div class="stat-sub">${totalHommes > 0 ? Math.round((totalHommes/personnelAFiltrer.length)*100) : 0}%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Femmes</div>
              <div class="stat-value">${totalFemmes}</div>
              <div class="stat-sub">${totalFemmes > 0 ? Math.round((totalFemmes/personnelAFiltrer.length)*100) : 0}%</div>
            </div>
          </div>
          
          <div class="note-filtre">
            ${filtreActif 
              ? `⚠️ Note: Cette liste contient uniquement les membres du personnel correspondant aux filtres appliqués (${personnelAFiltrer.length} sur ${personnel.length} membres au total)` 
              : `Liste complète du personnel actuellement affichée (${personnelAFiltrer.length} membres)`
            }
          </div>
          
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Photo</th>
                  <th>Matricule</th>
                  <th>Nom et Prénom</th>
                  <th>Type</th>
                  <th>Spécialité/Fonction</th>
                  <th>Contrat</th>
                  <th>Statut</th>
                  <th>Classes/Service</th>
                  <th>Ancienneté</th>
                </tr>
              </thead>
              <tbody>
                ${personnelAFiltrer.map((membre, index) => {
                  const anciennete = calculerAnciennete(membre.date_embauche);
                  const initiales = membre.prenom.charAt(0) + membre.nom.charAt(0);
                  let specialite = '';
                  
                  if (membre.type_personnel === 'instituteur') {
                    specialite = membre.matieres_enseignees || 'Non défini';
                  } else if (membre.type_personnel === 'professeur') {
                    specialite = membre.specialite || 'Non défini';
                  } else {
                    specialite = membre.fonction || 'Non défini';
                    if (membre.departement) {
                      specialite += ` (${membre.departement})`;
                    }
                  }
                  
                  const couleurStatut = {
                    'actif': '#10b981',
                    'inactif': '#6b7280',
                    'retraite': '#8b5cf6',
                    'demission': '#ef4444'
                  }[membre.statut] || '#6b7280';
                  
                  return `
                    <tr>
                      <td>${index + 1}</td>
                      <td class="photo-cell">
                        ${membre.avatar_url 
                          ? `<img src="${membre.avatar_url}" class="photo-mini" alt="">`
                          : `<div class="photo-placeholder">${initiales}</div>`
                        }
                      </td>
                      <td><strong>${membre.matricule}</strong></td>
                      <td>
                        <strong>${membre.nom} ${membre.prenom}</strong>
                        <div style="font-size: 11px; color: #64748b;">${membre.email}</div>
                      </td>
                      <td>
                        <span class="badge-type badge-${membre.type_personnel}">
                          ${membre.type_personnel === 'instituteur' ? '🏫 Instituteur' : 
                            membre.type_personnel === 'professeur' ? '👨‍🏫 Professeur' : 
                            '👨‍💼 Administratif'}
                        </span>
                      </td>
                      <td>${specialite}</td>
                      <td>
                        <span class="badge-contrat badge-${membre.type_contrat}">
                          ${membre.type_contrat}
                        </span>
                      </td>
                      <td>
                        <span class="badge-statut" style="background-color: ${couleurStatut}">
                          ${membre.statut}
                        </span>
                      </td>
                      <td>
                        ${membre.type_personnel !== 'administratif' 
                          ? `${membre.nombre_classes || 0} classe${membre.nombre_classes !== 1 ? 's' : ''}`
                          : membre.departement || 'Service général'
                        }
                      </td>
                      <td>${anciennete} an${anciennete > 1 ? 's' : ''}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="signature-area">
            <div>
              <div class="signature-line"></div>
              <div style="margin-top: 5px; font-size: 14px;"><strong>Le Directeur</strong></div>
              <div style="font-size: 12px; color: #666;">Signature et cachet</div>
            </div>
            <div>
              <div class="signature-line"></div>
              <div style="margin-top: 5px; font-size: 14px;"><strong>Le Responsable des Ressources Humaines</strong></div>
              <div style="font-size: 12px; color: #666;">Signature</div>
            </div>
          </div>
          
          <div class="footer">
            <div>Document généré par le Système de Gestion Scolaire</div>
            <div>Liste du personnel (affichage filtré) • ${personnelAFiltrer.length} membre${personnelAFiltrer.length > 1 ? 's' : ''} • ${totalActifs} actif${totalActifs > 1 ? 's' : ''}</div>
            <div style="margin-top: 10px; color: #aaa; font-size: 10px;">
              Document confidentiel • Édition: ${dateFormatted} • Page 1/1
            </div>
          </div>
          
          <div class="actions-impression no-print">
            <button onclick="window.print()" class="bouton-impression">
              🖨️ Imprimer
            </button>
            <button onclick="window.close()" class="bouton-fermer">
              ✕ Fermer
            </button>
          </div>
          
          <script>
            setTimeout(function() {
              window.print();
            }, 1000);
            
            window.onafterprint = function() {
              setTimeout(function() {
                if (confirm('Impression terminée. Voulez-vous fermer cette fenêtre ?')) {
                  window.close();
                }
              }, 500);
            };
          </script>
        </body>
        </html>
      `;
      
      const fenetreImpression = window.open('', '_blank', 'width=1200,height=700,toolbar=no,location=no,status=no,menubar=no');
      if (fenetreImpression) {
        fenetreImpression.document.write(contenuImprimable);
        fenetreImpression.document.close();
        fenetreImpression.focus();
        
        setAlerte({ 
          type: 'success', 
          message: `Fenêtre d'impression ouverte pour ${personnelAFiltrer.length} membre(s) filtré(s)` 
        });
      } else {
        throw new Error('Impossible d\'ouvrir la fenêtre d\'impression');
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'impression filtrée:', error);
      setAlerte({ 
        type: 'error', 
        message: `Erreur d'impression: ${error.message}` 
      });
    } finally {
      setImpressionEnCours(false);
    }
  };

  // CHARGER DONNÉES
  const chargerDonnees = async () => {
    setChargement(true);
    try {
      let url = '/api/enseignants';
      const queryParams = new URLSearchParams();
      
      if (filtres.recherche && filtres.recherche.trim()) {
        queryParams.append('recherche', filtres.recherche.trim());
      }
      if (filtres.specialite) {
        queryParams.append('specialite', filtres.specialite);
      }
      if (filtres.statut) {
        queryParams.append('statut', filtres.statut);
      }
      if (filtres.type_contrat) {
        queryParams.append('type_contrat', filtres.type_contrat);
      }
      if (filtres.type_personnel) {
        queryParams.append('type_enseignant', filtres.type_personnel);
      }
      if (filtres.genre) {
        queryParams.append('genre', filtres.genre);
      }
      
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        const personnelTransforme = data.enseignants.map((ens: any) => {
          const estAdministratif = ens.fonction?.includes('ADMIN') || 
                                   ens.type_enseignant === 'administratif' || 
                                   (ens.type_enseignant === 'professeur' && ens.fonction);
          
          return {
            ...ens,
            type_personnel: estAdministratif ? 'administratif' : (ens.type_enseignant || 'professeur'),
            fonction: estAdministratif ? (ens.fonction?.replace('ADMIN - ', '') || ens.fonction || '') : '',
            departement: ens.departement || ''
          };
        });
        
        setPersonnel(personnelTransforme);
        
        // Réinitialiser la sélection après chargement
        setSelectionPersonnel({ personnelSelectionne: [], selectionTous: false });
        
        chargerDocumentsPourTousLesEmployes(personnelTransforme);
      } else {
        setAlerte({ type: 'error', message: data.erreur });
        setPersonnel([]);
      }
    } catch (error: any) {
      console.error('Erreur chargement données:', error);
      setAlerte({ 
        type: 'error', 
        message: `Impossible de charger le personnel: ${error.message}` 
      });
      setPersonnel([]);
    } finally {
      setChargement(false);
    }
  };

  const chargerDocumentsPourTousLesEmployes = async (personnelList: Personnel[]) => {
    try {
      console.log('📁 Chargement des documents pour tous les employés...');
      
      const promises = personnelList.map(async (employe) => {
        try {
          const documents = await chargerDocumentsPersonnel(employe.id);
          return { employeId: employe.id, documents };
        } catch (error) {
          console.error(`❌ Erreur chargement documents employé ${employe.id}:`, error);
          return { employeId: employe.id, documents: [] };
        }
      });
      
      const results = await Promise.all(promises);
      
      const nouveauxDocuments: { [key: number]: DocumentPersonnel[] } = {};
      
      results.forEach(result => {
        if (result.documents && result.documents.length > 0) {
          nouveauxDocuments[result.employeId] = result.documents;
        }
      });
      
      setDocumentsParPersonnel(prev => ({
        ...prev,
        ...nouveauxDocuments
      }));
      
      console.log(`✅ Documents chargés pour ${Object.keys(nouveauxDocuments).length} employés`);
      
    } catch (error) {
      console.error('❌ Erreur chargement documents pour tous les employés:', error);
    }
  };

  const chargerDocumentsPersonnel = async (personnelId: number): Promise<DocumentPersonnel[]> => {
    try {
      console.log(`📁 Chargement documents pour employé ${personnelId}...`);
      
      const response = await fetch(`/api/enseignants/${personnelId}/documents`);
      
      if (!response.ok) {
        console.warn(`⚠️ Aucun document trouvé pour employé ${personnelId}`);
        return [];
      }
      
      const data = await response.json();
      
      if (data.success && data.documents && data.documents.length > 0) {
        console.log(`✅ ${data.documents.length} document(s) chargé(s) pour employé ${personnelId}`);
        return data.documents;
      }
      
      return [];
    } catch (error) {
      console.error(`❌ Erreur chargement documents employé ${personnelId}:`, error);
      return [];
    }
  };

  const uploaderDocuments = async (personnelId: number) => {
    if (uploadDocuments.fichiers.length === 0) {
      setAlerte({ type: 'error', message: 'Aucun fichier sélectionné' });
      return;
    }

    setUploadDocuments(prev => ({ ...prev, enCours: true, progression: 0 }));

    try {
      const formData = new FormData();
      formData.append('enseignant_id', personnelId.toString());
      
      uploadDocuments.fichiers.forEach((fichier, index) => {
        formData.append('documents', fichier);
        formData.append('noms_fichiers', fichier.name);
      });

      const response = await fetch('/api/enseignants/upload-documents', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const nbDocumentsUploades = data.documents?.length || uploadDocuments.fichiers.length;
        
        setAlerte({ 
          type: 'success', 
          message: `${nbDocumentsUploades} document(s) uploadé(s) avec succès` 
        });
        
        setUploadDocuments({ fichiers: [], enCours: false, progression: 0 });
        await chargerDocumentsPersonnel(personnelId);
        
        if (documentsParPersonnel[personnelId]) {
          setDocumentsParPersonnel(prev => ({
            ...prev,
            [personnelId]: [...(prev[personnelId] || []), ...(data.documents || [])]
          }));
        }
        
      } else {
        setAlerte({ type: 'error', message: data.erreur });
      }
    } catch (error: any) {
      console.error('Erreur upload documents:', error);
      setAlerte({ type: 'error', message: `Erreur: ${error.message}` });
    } finally {
      setUploadDocuments(prev => ({ ...prev, enCours: false }));
    }
  };

  const telechargerDocument = async (documentData: DocumentPersonnel) => { 
    try {
      console.log('📥 Téléchargement du document:', documentData.nom_fichier);
      
      let url = documentData.chemin_fichier;
      if (!url.startsWith('http') && !url.startsWith('/')) {
        url = `/${url}`;
      }
      if (!url.startsWith('http')) {
        url = `${window.location.origin}${url}`;
      }
      
      console.log('🔗 URL du document:', url);
      
      const link = document.createElement('a'); 
      link.href = url;
      link.download = documentData.nom_fichier;
      link.target = '_blank';
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setAlerte({ 
        type: 'success', 
        message: `Téléchargement de "${documentData.nom_fichier}" lancé` 
      });
      
    } catch (error: any) {
      console.error('❌ Erreur téléchargement:', error);
      
      try {
        let url = documentData.chemin_fichier;
        if (!url.startsWith('http') && !url.startsWith('/')) {
          url = `/${url}`;
        }
        if (!url.startsWith('http')) {
          url = `${window.location.origin}${url}`;
        }
        
        window.open(url, '_blank', 'noopener,noreferrer');
        
        setAlerte({ 
          type: 'info', 
          message: 'Document ouvert dans un nouvel onglet. Vous pouvez le sauvegarder avec Ctrl+S.' 
        });
      } catch (fallbackError) {
        console.error('❌ Erreur fallback:', fallbackError);
        setAlerte({ 
          type: 'error', 
          message: `Impossible de télécharger "${documentData.nom_fichier}". Vérifiez votre connexion.` 
        });
      }
    }
  };

  const supprimerDocument = async (documentId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;

    try {
      const response = await fetch(`/api/enseignants/documents/${documentId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setAlerte({ type: 'success', message: 'Document supprimé avec succès' });
        
        setDocumentsPersonnel(prev => prev.filter(doc => doc.id !== documentId));
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        
        if (personnelSelectionne && modalOuvert) {
          await chargerDocumentsPersonnel(personnelSelectionne.id);
        }
      } else {
        setAlerte({ type: 'error', message: data.erreur || 'Erreur lors de la suppression' });
      }
    } catch (error: any) {
      console.error('Erreur suppression document:', error);
      setAlerte({ type: 'error', message: 'Erreur lors de la suppression' });
    }
  };

  const gererUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fichier = e.target.files?.[0];
    if (!fichier) return;

    if (!fichier.type.startsWith('image/')) {
      setErreurFormulaire('Veuillez sélectionner une image valide (JPEG, PNG, etc.)');
      return;
    }

    if (fichier.size > 5 * 1024 * 1024) {
      setErreurFormulaire('L\'image ne doit pas dépasser 5MB');
      return;
    }

    setUploadPhoto({
      enCours: true,
      progression: 0,
      fichier,
      apercu: ''
    });

    setErreurFormulaire('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        let base64 = event.target.result as string;
        
        if (base64.length > 100000) {
          base64 = await compresserImageBase64(base64, 200);
        }
        
        setUploadPhoto(prev => ({
          ...prev,
          enCours: false,
          progression: 100,
          apercu: base64
        }));
        
        setFormData(prev => ({
          ...prev,
          avatar_url: base64
        }));
      }
    };
    
    let progression = 0;
    const interval = setInterval(() => {
      progression += 10;
      setUploadPhoto(prev => ({ ...prev, progression }));
      
      if (progression >= 90) {
        clearInterval(interval);
        reader.readAsDataURL(fichier);
      }
    }, 100);
  };

  const compresserImageBase64 = async (base64: string, maxSizeKB = 300): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        let width = img.width;
        let height = img.height;
        let quality = 0.8;
        
        const maxDimension = 800;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          
          let compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          
          while (compressedBase64.length > maxSizeKB * 1024 && quality > 0.1) {
            quality -= 0.1;
            compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          }
          
          resolve(compressedBase64);
        } else {
          resolve(base64);
        }
      };
      
      img.onerror = () => {
        console.warn('Erreur lors de la compression de l\'image');
        resolve(base64);
      };
      
      img.src = base64;
    });
  };

  const gererTri = (colonne: keyof Personnel | 'nom_complet' | 'anciennete') => {
    setTri(prev => {
      const nouvelleDirection = prev.colonne === colonne && prev.direction === 'asc' ? 'desc' : 'asc';
      return {
        colonne,
        direction: nouvelleDirection
      };
    });
  };

  const personnelTries = [...personnel].sort((a, b) => {
    let valeurA: any;
    let valeurB: any;

    switch (tri.colonne) {
      case 'nom_complet':
        valeurA = `${a.prenom} ${a.nom}`.toLowerCase();
        valeurB = `${b.prenom} ${b.nom}`.toLowerCase();
        break;
      case 'anciennete':
        valeurA = calculerAnciennete(a.date_embauche);
        valeurB = calculerAnciennete(b.date_embauche);
        break;
      case 'matricule':
        valeurA = a.matricule;
        valeurB = b.matricule;
        break;
      case 'type_personnel':
        valeurA = a.type_personnel;
        valeurB = b.type_personnel;
        break;
      case 'type_contrat':
        valeurA = a.type_contrat;
        valeurB = b.type_contrat;
        break;
      case 'statut':
        valeurA = a.statut;
        valeurB = b.statut;
        break;
      case 'nombre_classes':
        valeurA = a.nombre_classes || 0;
        valeurB = b.nombre_classes || 0;
        break;
      default:
        valeurA = a[tri.colonne as keyof Personnel];
        valeurB = b[tri.colonne as keyof Personnel];
    }

    if (valeurA < valeurB) return tri.direction === 'asc' ? -1 : 1;
    if (valeurA > valeurB) return tri.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const chargerClassesDisponibles = async () => {
    try {
      console.log('🔄 Chargement des classes disponibles...');
      const response = await fetch('/api/enseignants/classes-disponibles');
      
      if (!response.ok) {
        console.error('❌ Erreur HTTP:', response.status, response.statusText);
        setAlerte({ type: 'error', message: `Erreur ${response.status} lors du chargement des classes` });
        return;
      }
      
      const data = await response.json();
      console.log('📊 Réponse classes disponibles:', data);
      
      if (data.success) {
        console.log(`✅ ${data.classes?.length || 0} classes récupérées`);
        setClassesDisponibles(data.classes || []);
      } else {
        console.error('❌ Erreur dans la réponse:', data.erreur);
        setAlerte({ type: 'error', message: `Erreur: ${data.erreur}` });
      }
    } catch (error: any) {
      console.error('❌ Erreur chargement classes:', error);
      setAlerte({ 
        type: 'error', 
        message: `Erreur réseau: ${error.message}` 
      });
    }
  };

  const ouvrirModalClasses = async (membre: Personnel) => {
    if (membre.type_personnel === 'administratif') {
      setAlerte({ 
        type: 'info',
        message: 'Le personnel administratif n\'a pas de classes attribuées' 
      });
      return;
    }
    
    console.log('🏫 Ouverture modal classes pour:', membre.nom, membre.prenom, 'ID:', membre.id);
    
    setPersonnelPourClasses(membre);
    setChargementClasses(true);
    
    try {
      console.log('🔍 Chargement des classes du personnel...');
      const response = await fetch(`/api/enseignants/${membre.id}/classes`);
      const data = await response.json();
      
      console.log('📊 Réponse classes personnel:', data);
      
      if (data.success) {
        console.log(`✅ ${data.classes?.length || 0} classes trouvées pour ce personnel`);
        setClassesPersonnel(data.classes || []);
      } else {
        console.error('❌ Erreur chargement classes personnel:', data.erreur);
        setAlerte({ type: 'error', message: data.erreur || 'Erreur lors du chargement des classes' });
      }
      
      console.log('🔍 Chargement de toutes les classes disponibles...');
      await chargerClassesDisponibles();
      
      setModalClassesOuvert(true);
    } catch (error: any) {
      console.error('❌ Erreur chargement classes:', error);
      setAlerte({ 
        type: 'error', 
        message: `Erreur lors du chargement des classes: ${error.message}` 
      });
    } finally {
      setChargementClasses(false);
    }
  };

  const attribuerClasse = async (classeId: number) => {
    if (!personnelPourClasses) return;
    
    try {
      const url = `/api/enseignants/${personnelPourClasses.id}/attribuer-classe`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classeId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (personnelPourClasses) {
          await ouvrirModalClasses(personnelPourClasses);
        }
        await chargerDonnees();
        setAlerte({ type: 'success', message: 'Classe attribuée avec succès!' });
      } else {
        setAlerte({ type: 'error', message: data.erreur || 'Erreur lors de l\'attribution' });
      }
    } catch (error: any) {
      console.error('❌ Erreur réseau:', error);
      setAlerte({ 
        type: 'error', 
        message: `Erreur réseau: ${error.message}` 
      });
    }
  };

  const retirerClasse = async (classeId: number) => {
    if (!personnelPourClasses) return;
    
    if (!confirm(`Voulez-vous vraiment retirer cette classe de ${personnelPourClasses.prenom} ${personnelPourClasses.nom} ?`)) {
      return;
    }
    
    try {
      const response = await fetch('/api/enseignants/retirer-classe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          enseignantId: personnelPourClasses.id,
          classeId: classeId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (personnelPourClasses) {
          await ouvrirModalClasses(personnelPourClasses);
        }
        chargerDonnees();
        setAlerte({ type: 'success', message: 'Classe retirée avec succès!' });
      } else {
        setAlerte({ type: 'error', message: data.erreur || 'Erreur lors du retrait' });
      }
    } catch (error) {
      console.error('Erreur retrait classe:', error);
      setAlerte({ type: 'error', message: 'Erreur lors du retrait de la classe' });
    }
  };

  const fermerModalClasses = () => {
    setModalClassesOuvert(false);
    setPersonnelPourClasses(null);
    setClassesPersonnel([]);
  };

  const chargerStatistiques = async () => {
    try {
      const response = await fetch('/api/enseignants/statistiques');
      const data = await response.json();
      if (data.success) {
        setStatistiques(data.statistiques);
      }
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    }
  };

  const chargerStatistiquesTypes = async () => {
    try {
      const response = await fetch('/api/enseignants/statistiques-types');
      const data = await response.json();
      if (data.success) {
        setStatistiquesTypes(data.statistiques);
      }
    } catch (error) {
      console.error('Erreur chargement statistiques types:', error);
    }
  };

  const chargerSpecialites = async () => {
    try {
      const response = await fetch('/api/enseignants/specialites');
      const data = await response.json();
      if (data.success) {
        setSpecialites(data.specialites || []);
      }
    } catch (error) {
      console.error('Erreur chargement spécialités:', error);
    }
  };

  const chargerFonctions = async () => {
    try {
      const response = await fetch('/api/enseignants/fonctions');
      const data = await response.json();
      if (data.success) {
        setFonctions(data.fonctions || []);
      } else {
        setFonctions([
          'Secrétaire',
          'Comptable',
          'Surveillant',
          'Concierge',
          'Infirmier',
          'Bibliothécaire',
          'Psychologue scolaire',
          'Assistant administratif',
          'Responsable informatique',
          'Chef de maintenance'
        ]);
      }
    } catch (error) {
      console.error('Erreur chargement fonctions:', error);
      setFonctions([
        'Secrétaire',
        'Comptable',
        'Surveillant',
        'Concierge',
        'Infirmier',
        'Bibliothécaire',
        'Psychologue scolaire',
        'Assistant administratif',
        'Responsable informatique',
        'Chef de maintenance'
      ]);
    }
  };

  const chargerDepartements = async () => {
    try {
      const response = await fetch('/api/enseignants/departements');
      const data = await response.json();
      if (data.success) {
        setDepartements(data.departements || []);
      } else {
        setDepartements([
          'Administration',
          'Finances',
          'Maintenance',
          'Santé',
          'Bibliothèque',
          'Informatique',
          'Secrétariat',
          'Direction'
        ]);
      }
    } catch (error) {
      console.error('Erreur chargement départements:', error);
      setDepartements([
        'Administration',
        'Finances',
        'Maintenance',
        'Santé',
        'Bibliothèque',
        'Informatique',
        'Secrétariat',
        'Direction'
      ]);
    }
  };

  const chargerMatieres = async () => {
    try {
      const response = await fetch('/api/enseignants/matieres');
      const data = await response.json();
      if (data.success) {
        setMatieres(data.matieres || []);
      }
    } catch (error) {
      console.error('Erreur chargement matières:', error);
    }
  };

  const gererChangementFiltre = (key: keyof FiltresPersonnel, value: any) => {
    setFiltres(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const reinitialiserFiltres = () => {
    setFiltres({});
  };

  const ouvrirModal = async (membre?: Personnel) => {
  setErreurFormulaire('');
  setUploadPhoto({
    enCours: false,
    progression: 0,
    fichier: null,
    apercu: ''
  });
  
  setDocuments([]);
  setDocumentsPersonnel([]);
  setUploadDocuments({ fichiers: [], enCours: false, progression: 0 });

  if (membre) {
    setPersonnelSelectionne(membre);
    
    const docs = await chargerDocumentsPersonnel(membre.id);
    setDocumentsPersonnel(docs);
    
    const dateNaissance = membre.date_naissance 
      ? new Date(membre.date_naissance).toISOString().split('T')[0]
      : '';
    
    const dateEmbauche = membre.date_embauche 
      ? new Date(membre.date_embauche).toISOString().split('T')[0]
      : '';

    let matieresInitiales: string[] = [];
    if (membre.type_personnel === 'instituteur' && membre.matieres_enseignees) {
      matieresInitiales = membre.matieres_enseignees.split(',').map(m => m.trim()).filter(m => m);
      setMatieresSelectionnees(matieresInitiales);
    } else {
      setMatieresSelectionnees([]);
    }

    setFormData({
      nom: membre.nom,
      prenom: membre.prenom,
      email: membre.email,
      password: '', // Pour la modification, on ne montre pas le mot de passe
      date_naissance: dateNaissance,
      lieu_naissance: membre.lieu_naissance || '',
      genre: membre.genre,
      adresse: membre.adresse || '',
      telephone: membre.telephone || '',
      specialite: membre.specialite || '',
      diplome: membre.diplome || '',
      date_embauche: dateEmbauche,
      statut: membre.statut,
      type_contrat: membre.type_contrat,
      type_personnel: membre.type_personnel,
      matieres_enseignees: matieresInitiales.join(', '),
      fonction: membre.fonction || '',
      departement: membre.departement || '',
      salaire: membre.salaire?.toString() || '',
      avatar_url: membre.avatar_url || '',
      matricule: membre.matricule
    });

    if (membre.avatar_url) {
      setUploadPhoto(prev => ({ ...prev, apercu: membre.avatar_url! }));
    }
  } else {
    setPersonnelSelectionne(null);
    setMatieresSelectionnees([]);
    const matriculeInitial = genererMatriculeAutomatique('professeur');
    
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      password: 'Scolarion26', // Mot de passe par défaut pour les nouveaux membres
      date_naissance: '',
      lieu_naissance: '',
      genre: 'M',
      adresse: '',
      telephone: '',
      specialite: '',
      diplome: '',
      date_embauche: new Date().toISOString().split('T')[0],
      statut: 'actif',
      type_contrat: 'titulaire',
      type_personnel: 'professeur',
      matieres_enseignees: '',
      fonction: '',
      departement: '',
      salaire: '',
      avatar_url: '',
      matricule: matriculeInitial
    });
  }
  setModalOuvert(true);
};

  const gererSelectionMatiere = (matiereNom: string) => {
    setMatieresSelectionnees(prev => {
      const nouvellesMatieres = prev.includes(matiereNom)
        ? prev.filter(m => m !== matiereNom)
        : [...prev, matiereNom];
      
      setFormData(prevData => ({
        ...prevData,
        matieres_enseignees: nouvellesMatieres.join(', ')
      }));
      
      return nouvellesMatieres;
    });
  };

  const gererChangementTypePersonnel = (type: 'instituteur' | 'professeur' | 'administratif') => {  
    setFormData(prev => ({
      ...prev,
      type_personnel: type,
      specialite: type === 'instituteur' ? '' : prev.specialite,
      matieres_enseignees: type === 'professeur' ? '' : prev.matieres_enseignees,
      fonction: type === 'administratif' ? '' : prev.fonction,
      departement: type === 'administratif' ? '' : prev.departement,
    }));
    
    if (type === 'professeur') {
      setMatieresSelectionnees([]);
    }
  };

  const getPrefixeMatricule = (type: 'instituteur' | 'professeur' | 'administratif') => {
    return type === 'instituteur' ? 'INST' : 
           type === 'professeur' ? 'PROF' : 
           'ADM';
  };

  const fermerModal = () => {
    setModalOuvert(false);
    setPersonnelSelectionne(null);
    setErreurFormulaire('');
    setUploadPhoto({
      enCours: false,
      progression: 0,
      fichier: null,
      apercu: ''
    });
  };

  const soumettreFormulaire = async (e: React.FormEvent) => {
  e.preventDefault();
  setChargementSoumission(true);
  setErreurFormulaire('');
  
  if (!formData.nom.trim() || !formData.prenom.trim() || !formData.email.trim() || !formData.matricule.trim()) {
    setErreurFormulaire('Les champs nom, prénom, email et matricule sont requis');
    setChargementSoumission(false);
    return;
  }
  
  try {
    const dataAEnvoyer: any = {
      nom: formData.nom.trim(),
      prenom: formData.prenom.trim(),
      email: formData.email.trim(),
      matricule: formData.matricule.trim(),
      date_naissance: formData.date_naissance || null,
      lieu_naissance: formData.lieu_naissance.trim() || null,
      genre: formData.genre,
      adresse: formData.adresse.trim() || null,
      telephone: formData.telephone.trim() || null,
      diplome: formData.diplome.trim() || null,
      date_embauche: formData.date_embauche || new Date().toISOString().split('T')[0],
      statut: formData.statut,
      type_contrat: formData.type_contrat,
      type_enseignant: formData.type_personnel,
      salaire: formData.salaire ? parseFloat(formData.salaire) : null,
      avatar_url: uploadPhoto.apercu || formData.avatar_url || null,
    };

    // Ajouter le mot de passe uniquement pour la création
    if (!personnelSelectionne) {
      dataAEnvoyer.password = formData.password || 'Scolarion26';
    }

    if (formData.type_personnel === 'administratif') {
      dataAEnvoyer.fonction = formData.fonction.trim() || '';
      dataAEnvoyer.departement = formData.departement.trim() || null;
      dataAEnvoyer.type_enseignant = 'administratif';
      dataAEnvoyer.specialite = null;
      dataAEnvoyer.matieres_enseignees = null;
    } else if (formData.type_personnel === 'professeur') {
      dataAEnvoyer.specialite = formData.specialite.trim() || null;
      dataAEnvoyer.type_enseignant = 'professeur';
    } else if (formData.type_personnel === 'instituteur') {
      dataAEnvoyer.matieres_enseignees = matieresSelectionnees.join(', ');
      dataAEnvoyer.type_enseignant = 'instituteur';
    }

    console.log('📦 Données envoyées pour création:', dataAEnvoyer);

    let response;
    let resultat;
    let nouveauPersonnelId = null;
    
    if (personnelSelectionne) {
      response = await fetch(`/api/enseignants/${personnelSelectionne.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataAEnvoyer)
      });
      
      resultat = await response.json();
      
      if (resultat.success && uploadDocuments.fichiers.length > 0) {
        await uploaderDocuments(personnelSelectionne.id);
      }
    } else {
      response = await fetch('/api/enseignants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataAEnvoyer)
      });
      
      resultat = await response.json();
      
      if (resultat.success && resultat.enseignant) {
        nouveauPersonnelId = resultat.enseignant.id;
        
        setPersonnelSelectionne(resultat.enseignant);
        
        if (uploadDocuments.fichiers.length > 0) {
          console.log('📁 Upload documents pour nouveau membre ID:', nouveauPersonnelId);
          await uploaderDocuments(nouveauPersonnelId);
        }
      }
    }

    if (resultat.success) {
      if (!uploadDocuments.enCours) {
        fermerModal();
      }
      
      chargerDonnees();
      chargerStatistiques();
      chargerStatistiquesTypes();
      
      setAlerte({ 
        type: 'success', 
        message: personnelSelectionne ? 
          '👨‍💼 Membre du personnel mis à jour avec succès!' : 
          `👨‍💼 Membre du personnel créé avec succès! Mot de passe: ${formData.password}` 
      });
      
      if (nouveauPersonnelId && uploadDocuments.fichiers.length > 0) {
        await chargerDocumentsPersonnel(nouveauPersonnelId);
      }
    } else {
      const messageErreur = resultat.erreur || 'Erreur lors de l\'opération';
      setErreurFormulaire(messageErreur);
      setAlerte({ type: 'error', message: messageErreur });
    }
  } catch (error) {
    console.error('❌ Erreur réseau ou serveur:', error);
    const messageErreur = error instanceof Error ? error.message : 'Erreur de connexion au serveur';
    setErreurFormulaire(messageErreur);
    setAlerte({ type: 'error', message: messageErreur });
  } finally {
    setChargementSoumission(false);
  }
};


  const supprimerPersonnel = async () => {
    if (!personnelASupprimer) return;

    try {
      const response = await fetch(`/api/enseignants/${personnelASupprimer.id}`, {
        method: 'DELETE'
      });

      const resultat = await response.json();

      if (resultat.success) {
        fermerModalSuppression();
        chargerDonnees();
        chargerStatistiques();
        setAlerte({ type: 'success', message: '👨‍💼 Membre du personnel supprimé avec succès!' });
      } else {
        const messageErreur = resultat.erreur || 'Erreur lors de la suppression';
        setAlerte({ type: 'error', message: messageErreur });
        fermerModalSuppression();
      }
    } catch (error) {
      console.error('❌ Erreur réseau lors de la suppression:', error);
      const messageErreur = error instanceof Error ? error.message : 'Erreur de connexion au serveur';
      setAlerte({ type: 'error', message: messageErreur });
      fermerModalSuppression();
    }
  };

  const ouvrirModalDetail = async (membre: Personnel) => {
    setPersonnelSelectionne(membre);
    setModalDetailOuvert(true);
    
    const docs = await chargerDocumentsPersonnel(membre.id);
    setDocumentsPersonnel(docs);
  };

  const fermerModalDetail = () => {
    setModalDetailOuvert(false);
    setPersonnelSelectionne(null);
  };

  const ouvrirModalSuppression = (membre: Personnel) => {
    setPersonnelASupprimer(membre);
    setModalSuppressionOuvert(true);
  };

  const fermerModalSuppression = () => {
    setModalSuppressionOuvert(false);
    setPersonnelASupprimer(null);
  };

  const formaterNom = (nom: string): string => {
    return nom.toUpperCase();
  };

  const formaterPrenom = (prenom: string): string => {
    if (!prenom) return '';
    
    return prenom.split(/[\s-]+/).map(part => {
      if (!part) return '';
      
      const prepositions = ['de', 'du', 'le', 'la', 'des', 'd\'', 'l\''];
      const partLower = part.toLowerCase();
      
      if (prepositions.includes(partLower)) {
        return partLower;
      }
      
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    }).join(' ');
  };

  const gererChangementFormulaire = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'nom') {
      setFormData(prev => ({
        ...prev,
        [name]: formaterNom(value)
      }));
    } else if (name === 'prenom') {
      setFormData(prev => ({
        ...prev,
        [name]: formaterPrenom(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    setErreurFormulaire('');
  };

  const calculerAnciennete = (dateEmbauche: string) => {
    const embauche = new Date(dateEmbauche);
    const aujourdhui = new Date();
    let annees = aujourdhui.getFullYear() - embauche.getFullYear();
    const mois = aujourdhui.getMonth() - embauche.getMonth();
    
    if (mois < 0 || (mois === 0 && aujourdhui.getDate() < embauche.getDate())) {
      annees--;
    }
    
    return annees;
  };

  const getCouleurStatut = (statut: string) => {
    const couleurs = {
      'actif': '#10b981',
      'inactif': '#6b7280',
      'retraite': '#8b5cf6',
      'demission': '#ef4444'
    };
    return couleurs[statut as keyof typeof couleurs] || '#6b7280';
  };

  const getCouleurContrat = (contrat: string) => {
    const couleurs = {
      'titulaire': '#10b981',
      'contractuel': '#f59e0b',
      'vacataire': '#3b82f6'
    };
    return couleurs[contrat as keyof typeof couleurs] || '#6b7280';
  };

  const supprimerPhoto = () => {
    setUploadPhoto({
      enCours: false,
      progression: 0,
      fichier: null,
      apercu: ''
    });
    
    if (personnelSelectionne) {
      setFormData(prev => ({ 
        ...prev, 
        avatar_url: ''
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        avatar_url: '' 
      }));
    }
    
    const inputs = document.querySelectorAll('.input-fichier');
    inputs.forEach(input => {
      if (input instanceof HTMLInputElement) {
        input.value = '';
      }
    });
  };

  const gererSelectionDocuments = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fichiers = Array.from(e.target.files || []);
    
    const fichiersValides = fichiers.filter(fichier => {
      if (fichier.size > 10 * 1024 * 1024) {
        setAlerte({ type: 'error', message: `Le fichier ${fichier.name} dépasse 10MB` });
        return false;
      }
      
      const typesAutorises = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/gif',
        'text/plain'
      ];
      
      if (!typesAutorises.includes(fichier.type)) {
        setAlerte({ type: 'error', message: `Le type de fichier ${fichier.type} n'est pas autorisé` });
        return false;
      }
      
      return true;
    });
    
    setUploadDocuments(prev => ({
      ...prev,
      fichiers: [...prev.fichiers, ...fichiersValides]
    }));
    
    e.target.value = '';
  };

  const supprimerFichierSelectionne = (index: number) => {
    setUploadDocuments(prev => ({
      ...prev,
      fichiers: prev.fichiers.filter((_, i) => i !== index)
    }));
  };

  const getIconeTypeFichier = (nomFichier: string) => {
    const extension = nomFichier.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return '📕';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      case 'txt':
        return '📄';
      default:
        return '📎';
    }
  };

  const formaterTailleFichier = (tailleEnOctets: number) => {
    if (tailleEnOctets < 1024) {
      return `${tailleEnOctets} o`;
    } else if (tailleEnOctets < 1024 * 1024) {
      return `${(tailleEnOctets / 1024).toFixed(2)} Ko`;
    } else {
      return `${(tailleEnOctets / 1024 / 1024).toFixed(2)} Mo`;
    }
  };

  useEffect(() => {
    chargerDonnees();
    chargerStatistiques();
    chargerSpecialites();
    chargerMatieres();
    chargerStatistiquesTypes();
    chargerFonctions();
    chargerDepartements();
  }, [filtres]);

  useEffect(() => {
    const chargerTout = async () => {
      await chargerDonnees();
    };
    chargerTout();
  }, [filtres]); 

  useEffect(() => {
    if (alerte) {
      const timer = setTimeout(() => {
        setAlerte(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [alerte]);

  useEffect(() => {
    const fermerMenuImpression = (e: MouseEvent) => {
      const menu = document.getElementById('menu-choix-impression');
      const bouton = document.querySelector('.bouton-imprimer-tout-personnel');
      
      if (menu && menu.style.display === 'block' && 
          !menu.contains(e.target as Node) && 
          !bouton?.contains(e.target as Node)) {
        menu.style.display = 'none';
      }
    };

    document.addEventListener('click', fermerMenuImpression);
    
    return () => {
      document.removeEventListener('click', fermerMenuImpression);
    };
  }, []);

  const BadgeTypePersonnel = ({ personnel }: { personnel: Personnel }) => {
    const typeLabel = personnel.type_personnel === 'instituteur' ? 'Instituteur' : 
                     personnel.type_personnel === 'professeur' ? 'Professeur' : 
                     '👨‍💼 Administratif';
    
    return (
      <div className="domaine-personnel">
        <span className={`badge-type badge-${personnel.type_personnel}`}>
          {typeLabel}
        </span>
        {personnel.type_personnel === 'professeur' && personnel.specialite && (
          <span className="badge-specialite">{personnel.specialite}</span>
        )}
        {personnel.type_personnel === 'administratif' && personnel.fonction && (
          <span className="badge-fonction">{personnel.fonction}</span>
        )}
      </div>
    );
  };

  if (chargement && personnel.length === 0) {
    return (
      <div className={`chargement-personnel ${parametresApp?.theme_defaut || 'clair'}`}>
        <div className="spinner-grand"></div>
        <p>Chargement du personnel...</p>
      </div>
    );
  }

  return (
    <div className={`conteneur-gestion-personnel ${parametresApp?.theme_defaut || 'clair'}`}>
      {/* EN-TÊTE FIXE */}
      <div className="en-tete-fixe-perso">
        <div className="conteneur-en-tete-fixe">
          <div className="titre-fixe-perso">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span style={{ fontSize: '22px' }}>👨‍💼</span>
              <h1>
                Gestion du Personnel
              </h1>
              {selectionPersonnel.personnelSelectionne.length > 0 && (
                <span>
                  {selectionPersonnel.personnelSelectionne.length} sélectionné(s)
                </span>
              )}
            </div>
          </div>

          {/* BOUTONS À DROITE */}
          <div className="actions-fixes">
            {/* Case à cocher "Tout sélectionner" */}
            {personnel.length > 0 && (
              <div className="selecteur-tous" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 10px',
                background: '#f3f4f6',
                borderRadius: '8px',
                marginRight: '10px'
              }}>
                <input
                  type="checkbox"
                  id="selecteurTousPersonnel"
                  checked={selectionPersonnel.selectionTous}
                  onChange={gererSelectionTous}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: '#8b5cf6'
                  }}
                />
                <label htmlFor="selecteurTousPersonnel" style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  cursor: 'pointer'
                }}>
                  Tout sélectionner
                </label>
              </div>
            )}

            {/* Bouton de suppression multiple */}
            {selectionPersonnel.personnelSelectionne.length > 0 && (
              <button 
                className="bouton-supprimer-multiple-fixe"
                onClick={ouvrirModalSuppressionMultiple}
                title="Supprimer les membres sélectionnés"
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                  fontSize: '14px',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.2)';
                }}
              >
                🗑️ Supprimer ({selectionPersonnel.personnelSelectionne.length})
              </button>
            )}

            {/* MENU IMPRESSION */}
            <div className="menu-impression-personnel" style={{ position: 'relative' }}>
              <button 
                className="bouton-imprimer-tout-personnel"
                onClick={() => {
                  const filtreActif = Object.keys(filtres).some(key => filtres[key as keyof FiltresPersonnel] !== undefined);
                  
                  if (filtreActif) {
                    const menu = document.getElementById('menu-choix-impression');
                    if (menu) {
                      menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
                    }
                  } else {
                    imprimerToutLePersonnel();
                  }
                }}
                disabled={personnel.length === 0 || impressionEnCours}
                title={personnel.length === 0 ? 'Aucun membre du personnel à imprimer' : 'Options d\'impression'}
                style={{
                  background: personnel.length === 0 || impressionEnCours
                    ? '#9ca3af' 
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: personnel.length === 0 || impressionEnCours ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                  fontSize: '14px',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)',
                  whiteSpace: 'nowrap',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (personnel.length > 0 && !impressionEnCours) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (personnel.length > 0 && !impressionEnCours) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.2)';
                  }
                }}
              >
                {impressionEnCours ? (
                  <>
                    <div className="spinner-mini"></div>
                    Impression...
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '16px' }}>🖨️</span>
                    <span>Imprimer</span>
                    {personnel.length > 0 && (
                      <span style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {personnel.length}
                      </span>
                    )}
                    {Object.keys(filtres).some(key => filtres[key as keyof FiltresPersonnel] !== undefined) && (
                      <span style={{ fontSize: '12px', marginLeft: '4px' }}>▼</span>
                    )}
                  </>
                )}
              </button>
              
              {/* MENU DÉROULANT */}
              <div 
                id="menu-choix-impression"
                style={{
                  display: 'none',
                  position: 'absolute',
                  top: '100%',
                  left: '0',
                  marginTop: '5px',
                  background: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  border: '1px solid #e2e8f0',
                  minWidth: '250px',
                  zIndex: '1000',
                  overflow: 'hidden'
                }}
              >
                <div style={{ padding: '10px 0' }}>
                  <div style={{ 
                    padding: '10px 15px', 
                    fontSize: '12px', 
                    color: '#64748b',
                    borderBottom: '1px solid #f1f5f9',
                    background: '#f8fafc'
                  }}>
                    <strong>📋 Filtres actifs détectés</strong>
                    <div style={{ fontSize: '11px', marginTop: '4px' }}>
                      Choisissez ce que vous souhaitez imprimer:
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      imprimerPersonnelFiltres();
                      const menu = document.getElementById('menu-choix-impression');
                      if (menu) menu.style.display = 'none';
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span style={{ fontSize: '16px', color: '#3b82f6' }}>🔍</span>
                    <div>
                      <div style={{ fontWeight: '600' }}>Imprimer la liste filtrée</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {personnelTries.length} membre{personnelTries.length !== 1 ? 's' : ''} (affichage actuel)
                      </div>
                    </div>
                  </button>
                  
                  <div style={{ padding: '0 15px' }}>
                    <div style={{ 
                      fontSize: '11px', 
                      color: '#94a3b8',
                      margin: '5px 0',
                      padding: '5px',
                      background: '#f8fafc',
                      borderRadius: '4px',
                      borderLeft: '3px solid #3b82f6'
                    }}>
                      Filtres appliqués: {Object.keys(filtres).filter(key => filtres[key as keyof FiltresPersonnel] !== undefined).length}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      imprimerToutLePersonnel();
                      const menu = document.getElementById('menu-choix-impression');
                      if (menu) menu.style.display = 'none';
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      borderTop: '1px solid #f1f5f9',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span style={{ fontSize: '16px', color: '#10b981' }}>📄</span>
                    <div>
                      <div style={{ fontWeight: '600' }}>Imprimer tout le personnel</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {personnel.length} membre{personnel.length !== 1 ? 's' : ''} (total)
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
            
            {/* BOUTON AJOUTER */}
            <button 
              className="bouton-personnel-fixe"
              onClick={() => ouvrirModal()}
              title="Ajouter un nouveau membre du personnel"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                fontSize: '14px',
                boxShadow: '0 2px 8px rgba(139, 92, 246, 0.2)',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.2)';
              }}
            >
              <span style={{ fontSize: '16px' }}>👨‍💼</span>
              <span>Ajouter</span>
            </button>
          </div>
        </div>
      </div>

      {/* ALERTES */}
      {alerte && (
        <div className={`alerte-modern ${alerte.type === 'success' ? 'alerte-succes-modern' : 'alerte-erreur-modern'}`}>
          <div className="contenu-alerte-modern">
            <div className="icone-alerte-modern">
              {alerte.type === 'success' ? '✅' : '❌'}
            </div>
            <div className="texte-alerte-modern">
              <span className="titre-alerte">{alerte.type === 'success' ? 'Succès' : 'Erreur'}</span>
              <span className="message-alerte">{alerte.message}</span>
            </div>
            <button 
              className="bouton-fermer-alerte-modern"
              onClick={() => setAlerte(null)}
              title="Fermer"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0',
                margin: '0',
                fontSize: '16px',
                color: '#dc2626',
                transition: 'color 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#b91c1c';
                e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#dc2626';
                e.currentTarget.style.background = 'none';
              }}
            >
              ❌
            </button>
          </div>
        </div>
      )}

      {/* STATISTIQUES TYPES */}

{/* STATISTIQUES TYPES */}
{statistiquesTypes && (
  <div className="section-statistiques-types">
    <h3>Statistique du Personnel</h3>
    <div className="grille-statistiques-types">
      {/* Cartes par type de personnel */}
      {[
        { type: 'professeur', label: 'Professeurs', icone: '👨‍🏫' },
        { type: 'instituteur', label: 'Instituteurs', icone: '🏫' },
        { type: 'administratif', label: 'Administratif', icone: '👨‍💼' }
      ].map((typeInfo) => {
        // Vérifier que statistiquesTypes.parType existe avant d'y accéder
        const stat = statistiquesTypes.parType?.find((s: any) => 
          s.type_personnel === typeInfo.type || s.type_enseignant === typeInfo.type
        );
        
        const total = stat?.total || 0;
        const actifs = stat?.actifs || 0;
        const hommes = stat?.hommes || 0;
        const femmes = stat?.femmes || 0;
        
        return (
          <div key={typeInfo.type} className="carte-statistique-type">
            <div className="en-tete-statistique-type">
              <div className="icone-type">
                {typeInfo.icone}
              </div>
              <div className="info-type">
                <div className="valeur-type">{total}</div>
                <div className="label-type">{typeInfo.label}</div>
              </div>
            </div>

            <div className="details-type">
              <div className="detail-stat">
                <span className="label-detail">Actifs</span>
                <span className="valeur-detail-perso">{actifs}</span>
              </div>
              <div className="detail-stat">
                <span className="label-detail">Hommes</span>
                <span className="valeur-detail-perso">{hommes}</span>
              </div>
              <div className="detail-stat">
                <span className="label-detail">Femmes</span>
                <span className="valeur-detail-perso">{femmes}</span>
              </div>
            </div>
          </div>
        );
      })}
      {/* Carte des statistiques globales */}
      <div className="carte-statistique-type">
  <div className="en-tete-statistique-type">
    <div className="icone-type">📊</div>
    <div className="info-type">
      <div className="valeur-type">
        {(() => {
          // Vérifier si parType existe
          if (!statistiquesTypes.parType || !Array.isArray(statistiquesTypes.parType)) {
            return 0;
          }
          
          // Calculer le total à partir des données individuelles
          let total = 0;
          
          for (let i = 0; i < statistiquesTypes.parType.length; i++) {
            const item = statistiquesTypes.parType[i];
            total += Number(item.total || 0);
          }
          
          return total;
        })()}
      </div>
      <div className="label-type">Total Personnel</div>
    </div>
  </div>
  
  <div className="details-type">
    <div className="detail-stat">
      <span className="label-detail">Hommes</span>
      <span className="valeur-detail-perso">
        {(() => {
          if (!statistiquesTypes.parType || !Array.isArray(statistiquesTypes.parType)) {
            return 0;
          }
          
          let totalHommes = 0;
          
          for (let i = 0; i < statistiquesTypes.parType.length; i++) {
            const item = statistiquesTypes.parType[i];
            totalHommes += Number(item.hommes || 0);
          }
          
          return totalHommes;
        })()}
      </span>
    </div>

    <div className="detail-stat">
      <span className="label-detail">Femmes</span>
      <span className="valeur-detail-perso">
        {(() => {
          if (!statistiquesTypes.parType || !Array.isArray(statistiquesTypes.parType)) {
            return 0;
          }
          
          let totalFemmes = 0;
          
          for (let i = 0; i < statistiquesTypes.parType.length; i++) {
            const item = statistiquesTypes.parType[i];
            totalFemmes += Number(item.femmes || 0);
          }
          
          return totalFemmes;
        })()}
      </span>
    </div>

    <div className="detail-stat">
      <span className="label-detail">Ratio</span>
      <span className="valeur-detail-perso">
        {(() => {
          if (!statistiquesTypes.parType || !Array.isArray(statistiquesTypes.parType)) {
            return 'N/A';
          }
          
          let totalHommes = 0;
          let totalFemmes = 0;
          
          for (let i = 0; i < statistiquesTypes.parType.length; i++) {
            const item = statistiquesTypes.parType[i];
            totalHommes += Number(item.hommes || 0);
            totalFemmes += Number(item.femmes || 0);
          }
          
          const total = totalHommes + totalFemmes;
          
          if (total === 0) return 'N/A';
          
          const pourcentageHommes = Math.round((totalHommes / total) * 100);
          const pourcentageFemmes = Math.round((totalFemmes / total) * 100);
          
          return `${pourcentageHommes}% H / ${pourcentageFemmes}% F`;
        })()}
      </span>
    </div>
  </div>
</div>
      </div>
    </div>
)}

      {/* FILTRES */}
      <div className="section-filtres" style={{ marginTop: '20px' }}>
        <div className="grille-filtres">
          <div className="groupe-filtre-perso">
            <label>Recherche</label>
            <input
              type="text"
              placeholder="Nom, prénom, fonction..."
              value={filtres.recherche || ''}
              onChange={(e) => gererChangementFiltre('recherche', e.target.value)}
            />
          </div>
          
          <div className="groupe-filtre-perso">
            <label>Type de personnel</label>
            <select
              value={filtres.type_personnel || ''}
              onChange={(e) => gererChangementFiltre('type_personnel', e.target.value || undefined)}
            >
              <option value="">Tous les types</option>
              <option value="professeur">Professeur</option>
              <option value="instituteur">Instituteur</option>
              <option value="administratif">Administratif</option>
            </select>
          </div>
          
          <div className="groupe-filtre-perso">
            <label>Spécialité</label>
            <select
              value={filtres.specialite || ''}
              onChange={(e) => gererChangementFiltre('specialite', e.target.value || undefined)}
            >
              <option value="">Toutes les spécialités</option>
              {specialites.map(specialite => (
                <option key={specialite} value={specialite}>
                  {specialite}
                </option>
              ))}
            </select>
          </div>
          
          <div className="groupe-filtre-perso">
            <label>Fonction</label>
            <select
              value={filtres.fonction || ''}
              onChange={(e) => gererChangementFiltre('fonction', e.target.value || undefined)}
            >
              <option value="">Toutes les fonctions</option>
              {fonctions.map(fonction => (
                <option key={fonction} value={fonction}>
                  {fonction}
                </option>
              ))}
            </select>
          </div>
          
          <div className="groupe-filtre-perso">
            <span style={{width: '190px',maxWidth: '200px', display: 'inline-block', fontWeight: '600', color: '#475569', fontSize: '12px'}}>Type de contrat</span>
            <span style={{display: 'inline-block', fontSize: '18px', cursor: 'pointer'}} title='Réinitialiser'>
              <button onClick={reinitialiserFiltres} style={{cursor: 'pointer'}}>
                🔄
              </button>
            </span>
            <select
              value={filtres.type_contrat || ''}
              onChange={(e) => gererChangementFiltre('type_contrat', e.target.value || undefined)}
            >
              <option value="">Tous les contrats</option>
              <option value="titulaire">Titulaire</option>
              <option value="contractuel">Contractuel</option>
              <option value="vacataire">Vacataire</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABLEAU DU PERSONNEL AVEC CASES À COCHER */}
      <div className="tableau-personnel-container">
        <table className="tableau-personnel">
          <thead>
            <tr className="style-2">
              <th className="colonne-checkbox" style={{ width: '30px' }}>
                <input
                  type="checkbox"
                  checked={selectionPersonnel.selectionTous}
                  onChange={gererSelectionTous}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: '#8b5cf6'
                  }}
                  title="Tout sélectionner"
                />
              </th>
              <th className="colonne-numero" style={{ width: '20px' }}>
                <div className="entete-colonne" onClick={() => gererTri('matricule')}>
                  N°
                  <div className="fleches-tri">
                    <span className={`fleche ${tri.colonne === 'matricule' && tri.direction === 'asc' ? 'active' : ''}`}>▲</span>
                    <span className={`fleche ${tri.colonne === 'matricule' && tri.direction === 'desc' ? 'active' : ''}`}>▼</span>
                  </div>
                </div>
              </th>
              
            <th className="colonne-doc" style={{ width: '40px' }}>
                <div className="entete-colonne">
                  Doc.
                </div>
              </th>
              
            <th style={{ width: 'auto', minWidth: '250px' }}>
                <div className="entete-colonne" onClick={() => gererTri('nom_complet')}>
                  Nom Complet
                  <div className="fleches-tri">
                    <span className={`fleche ${tri.colonne === 'nom_complet' && tri.direction === 'asc' ? 'active' : ''}`}>▲</span>
                    <span className={`fleche ${tri.colonne === 'nom_complet' && tri.direction === 'desc' ? 'active' : ''}`}>▼</span>
                  </div>
                </div>
              </th>
              
            <th style={{ width: '130px' }}>
                <div className="entete-colonne2" onClick={() => gererTri('type_personnel')}>
                  Fonction
                  <div className="fleches-tri">
                    <span className={`fleche ${tri.colonne === 'type_personnel' && tri.direction === 'asc' ? 'active' : ''}`}>▲</span>
                    <span className={`fleche ${tri.colonne === 'type_personnel' && tri.direction === 'desc' ? 'active' : ''}`}>▼</span>
                  </div>
                </div>
              </th>
              
              <th>
                <div className="entete-colonne" onClick={() => gererTri('type_contrat')}>
                  Contrat
                  <div className="fleches-tri">
                    <span className={`fleche ${tri.colonne === 'type_contrat' && tri.direction === 'asc' ? 'active' : ''}`}>▲</span>
                    <span className={`fleche ${tri.colonne === 'type_contrat' && tri.direction === 'desc' ? 'active' : ''}`}>▼</span>
                  </div>
                </div>
              </th>
              
              <th>
                <div className="entete-colonne" onClick={() => gererTri('nombre_classes')}>
                  Classes
                  <div className="fleches-tri">
                    <span className={`fleche ${tri.colonne === 'nombre_classes' && tri.direction === 'asc' ? 'active' : ''}`}>▲</span>
                    <span className={`fleche ${tri.colonne === 'nombre_classes' && tri.direction === 'desc' ? 'active' : ''}`}>▼</span>
                  </div>
                </div>
              </th>
              
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {personnelTries.map((membre, index) => {
              const anciennete = calculerAnciennete(membre.date_embauche);
              const estSelectionne = selectionPersonnel.personnelSelectionne.includes(membre.id);
              
              return (
                <tr 
                  key={membre.id} 
                  className={estSelectionne ? 'ligne-selectionnee' : ''}
                  style={estSelectionne ? {
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    borderLeft: '4px solid #8b5cf6'
                  } : {}}
                >
                  <td className="colonne-checkbox">
                    <input
                      type="checkbox"
                      checked={estSelectionne}
                      onChange={() => gererSelectionPersonnel(membre.id)}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer',
                        accentColor: '#8b5cf6'
                      }}
                      title={estSelectionne ? 'Désélectionner' : 'Sélectionner'}
                    />
                  </td>
                   <td className="colonne-numero" style={{ width: '20px', padding: '8px 2px' }}>
                    <div className="numero-ligne" style={{ fontSize: '12px' }}>{index + 1}</div>
                  </td>
                  
                  <td>
                    <div className="documents-personnel">
                      {documentsParPersonnel[membre.id]?.length > 0 ? (
                        <span 
                          className="badge-documents" 
                          title={`${documentsParPersonnel[membre.id]?.length || 0} document(s)`}
                          onClick={() => {
                            ouvrirModalDetail(membre);
                          }}
                          style={{ cursor: 'pointer', width: '40px', height: '40px' }}
                        >
                          📁 {documentsParPersonnel[membre.id]?.length || 0}
                        </span>
                      ) : (
                        <span 
                          className="badge-aucun-document" 
                          title="Aucun document"
                          onClick={() => {
                            ouvrirModalDetail(membre);
                          }}
                          style={{ cursor: 'pointer', width: '40px', height: '40px' }}
                        >
                          📁 0
                        </span>
                      )}
                    </div>
                  </td>
                  
                  <td style={{ padding: '8px 8px' }}>
                    <div className="nom-complet" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px'
                    }}>
                      <div className="avatar-container-personnel" style={{ flexShrink: 0 }}>
                        {membre.avatar_url ? (
                          <img 
                            src={membre.avatar_url} 
                            alt={`${membre.prenom} ${membre.nom}`}
                            className="avatar-personnel-img"
                            style={{ width: '40px', height: '40px' }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('avatar-placeholder-hidden');
                            }}
                          />
                        ) : null}
                        <div className={`avatar-placeholder ${membre.avatar_url ? 'avatar-placeholder-hidden' : ''}`} 
                            style={{ width: '40px', height: '40px', fontSize: '14px' }}>
                          {membre.prenom?.charAt(0) || 'P'}{membre.nom?.charAt(0) || 'N'}
                        </div>
                      </div>
                      <div>
                        <span style={{ 
                          fontSize: '12px', 
                          fontWeight: '600'
                        }}>
                          {membre.nom} {membre.prenom}
                        </span>
                        <div className="email" style={{ 
                          fontSize: '11px', 
                          color: '#64748b'
                        }}>
                          {membre.email}
                        </div>
                        <div className="matricule" style={{ 
                          fontSize: '10px', 
                          color: '#94a3b8'
                        }}>
                          {membre.matricule}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td>
                    <BadgeTypePersonnel personnel={membre} />
                  </td>
                  
                  <td>
                    <span 
                      className="badge-contrat"
                      style={{ backgroundColor: getCouleurContrat(membre.type_contrat) }}
                    >
                      {membre.type_contrat}
                    </span>
                    <div className="matricule-personnel">
                    </div>
                  </td>
                  
                  <td>
                    <div className="classes-personnel">
                      {membre.type_personnel !== 'administratif' ? (
                        <>
                          <div className="style-4">
                            {membre.nombre_classes || 0} classe{membre.nombre_classes !== 1 ? 's' : ''}
                          </div>
                          {membre.classes_principales && (
                            <div className="liste-classes">
                              {membre.classes_principales}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="info-administrative">
                          <div className="departement-info-adm">
                            {membre.departement || 'Service général'}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  
                   <td style={{ padding: '2px 1px' }}>
              <div className="actions-ligne" style={{ 
                display: 'flex', 
                gap: '2px',  // Espace minimal entre les boutons
                justifyContent: 'flex-start',
                flexWrap: 'nowrap'
              }}>
                <button 
                  className="bouton-details"
                  onClick={() => ouvrirModalDetail(membre)}
                  title="Voir les détails"
                >
                  👁️
                </button>
                <button 
                  className="bouton-modifier"
                  onClick={() => ouvrirModal(membre)}
                  title="Modifier"
                >
                  ✏️
                </button>
                {membre.type_personnel !== 'administratif' && (
                  <button 
                    className="bouton-classes"
                    onClick={() => ouvrirModalClasses(membre)}
                    title="Gérer les classes"
                  >
                    🏫
                  </button>
                )}
                <button 
                  className="bouton-supprimer"
                  onClick={() => ouvrirModalSuppression(membre)}
                  title="Supprimer"
                >
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
        {personnelTries.length === 0 && (
          <div className="aucune-donnee">
            <p>Aucun membre du personnel trouvé avec les critères sélectionnés</p>
          </div>
        )}
      </div>

      {/* MODAL DE SUPPRESSION MULTIPLE */}
      {modalSuppressionMultipleOuvert && (
        <div className="overlay-modal" onClick={fermerModalSuppressionMultiple}>
          <div className="modal-suppression" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="en-tete-modal-suppression">
              <div className="icone-avertissement">⚠️</div>
              <h2>Confirmer la suppression multiple</h2>
            </div>
            
            <div className="contenu-modal-suppression">
              <p>
                Êtes-vous sûr de vouloir supprimer <strong>{selectionPersonnel.personnelSelectionne.length} membre(s) du personnel</strong> ?
              </p>
              
              <div className="liste-personnel-a-supprimer" style={{
                maxHeight: '300px',
                overflowY: 'auto',
                margin: '15px 0',
                padding: '10px',
                background: '#f3f4f6',
                borderRadius: '8px'
              }}>
                {obtenirPersonnelSelectionne().map(membre => (
                  <div key={membre.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <span style={{ fontSize: '20px' }}>👨‍💼</span>
                    <div style={{ flex: 1 }}>
                      <div><strong>{membre.prenom} {membre.nom}</strong></div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {membre.matricule} • {membre.type_personnel} • {membre.type_contrat}
                      </div>
                    </div>
                    {membre.nombre_classes && membre.nombre_classes > 0 && (
                      <span style={{
                        background: '#ef4444',
                        color: 'white',
                        fontSize: '11px',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        whiteSpace: 'nowrap'
                      }}>
                        {membre.nombre_classes} classe{membre.nombre_classes !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="avertissement-important">
                <p>⚠️ <strong>Attention : Cette action est irréversible</strong></p>
                <p>• Toutes les données seront supprimées</p>
                <p>• Les accès au système seront révoqués</p>
                <p>• Les membres ayant des classes ne pourront pas être supprimés</p>
              </div>
            </div>
            
            <div className="actions-modal-suppression">
              <button 
                className="bouton-annuler-suppression"
                onClick={fermerModalSuppressionMultiple}
                disabled={soumissionEnCours}
              >
                Annuler
              </button>
              <button 
                className="bouton-confirmer-suppression"
                onClick={supprimerPersonnelMultiple}
                disabled={soumissionEnCours}
              >
                {soumissionEnCours ? (
                  <>
                    <div className="spinner-bouton-modern"></div>
                    Suppression en cours...
                  </>
                ) : (
                  `🗑️ Supprimer (${selectionPersonnel.personnelSelectionne.length})`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AJOUT/MODIFICATION */}
      
      {modalOuvert && (
        <div className="overlay-modal" onClick={fermerModal}>
          <div className="modal-detail-personnel" onClick={(e) => e.stopPropagation()}>
            <div className="en-tete-modal">
              <h2>{personnelSelectionne ? 'Modifier' : 'Ajouter un membre du personnel'}</h2>
              <button className="bouton-fermer-modal-perso" onClick={fermerModal}>✕</button>
            </div>
            
            <form onSubmit={soumettreFormulaire} className="formulaire-personnel">
              {erreurFormulaire && (
                <div className="message-erreur-formulaire">
                  ❌ {erreurFormulaire}
                </div>
              )}

              {/* Section Photo de Profil */}
              <div className="section-upload-photo">  
                <div className="zone-upload">
                  {uploadPhoto.apercu || formData.avatar_url ? (
                    <div className="apercu-photo-container">
                      <img 
                        src={uploadPhoto.apercu || formData.avatar_url} 
                        alt="Aperçu" 
                        className="photo-personnel-modale"
                      />
                      <div className="actions-photo">
                        <label htmlFor="file-input-modification" className="bouton-changer-photo">
                          <span>📷 Changer</span>
                        </label>
                        <input
                          id="file-input-modification"
                          type="file"
                          accept="image/*"
                          onChange={gererUploadPhoto}
                          className="input-fichier"
                          style={{ display: 'none' }}
                        />
                        <button 
                          type="button" 
                          className="bouton-supprimer"
                          onClick={supprimerPhoto}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="zone-depot-photo-perso">
                      <label htmlFor="file-input-nouveau" className="label-upload-photo">
                        <input
                          id="file-input-nouveau"
                          type="file"
                          accept="image/*"
                          onChange={gererUploadPhoto}
                          className="input-fichier"
                          style={{ display: 'none' }}
                        />
                        <div className="icone-upload">📷</div>
                        <div className="titre-upload">Cliquez pour uploader une photo</div>
                        <div className="sous-titre-upload">PNG, JPG, JPEG jusqu'à 5MB</div>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION : Type de personnel */}
                <h3>Type de Personnel</h3>
                {personnelSelectionne && (
                  <div className="avertissement-changement-type" style={{ color: '#6b7280',padding: '6px', fontSize: '14px' }}>
                    ⚠️ <strong>Note :</strong> Changer le type ne modifie pas automatiquement le matricule.
                    Vous pouvez le modifier manuellement si nécessaire.
                  </div>
                )}
                <div className="selecteur-type">
                  {[
                    { type: 'professeur', label: 'Professeur', icone: '👨‍🏫', suggestion: 'PROF' },
                    { type: 'instituteur', label: 'Instituteur', icone: '🏫', suggestion: 'INST' },
                    { type: 'administratif', label: 'Administratif', icone: '👨‍💼', suggestion: 'ADM' }
                  ].map((typeInfo) => (
                    <button
                      key={typeInfo.type}
                      type="button"
                      className={`bouton-type ${formData.type_personnel === typeInfo.type ? 'actif' : ''}`}
                      onClick={() => gererChangementTypePersonnel(typeInfo.type as any)}
                      title={typeInfo.label}
                    >
                      <div className="icone-type-grand">{typeInfo.icone}</div>
                      <div className="info-type-bouton">
                        <div className="nom-type">{typeInfo.label}</div>
                        <div className="description-type">
                          {typeInfo.type === 'professeur' ? 'Spécialiste d\'une matière' : 
                          typeInfo.type === 'instituteur' ? 'Enseigne plusieurs matières' : 
                          'Personnel administratif'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              
              <div className="grille-formulaire">
                {/* Champ Matricule */}
                <div className="groupe-champ-perso">
                  <label>Matricule *</label>
                  <div className="champ-matricule" style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      name="matricule"
                      value={formData.matricule}
                      onChange={gererChangementFormulaire}
                      required
                      placeholder="Ex: PROFA2024XYZ, INSTB2024ABC, ADMC2024DEF ou tout autre format"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const suggestionMatricule = genererMatriculeAutomatique(formData.type_personnel);
                        setFormData(prev => ({
                          ...prev,
                          matricule: suggestionMatricule
                        }));
                      }}
                      style={{
                        background: '#dde0ec',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '2px 2px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Générer une suggestion de matricule"
                    >
                      🔄
                    </button>
                  </div>
                  <small style={{ color: '#6b7280', fontSize: '12px' }}>
                    Format libre. Suggestion: {genererMatriculeAutomatique(formData.type_personnel)}
                  </small>
                </div>
                
                <div className="groupe-champ-perso">
                  <label>Nom *</label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={gererChangementFormulaire}
                    required
                    placeholder="ATTE"
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
                
                <div className="groupe-champ-perso">
                  <label>Prénom *</label>
                  <input
                    type="text"
                    name="prenom"
                    value={formData.prenom}
                    onChange={gererChangementFormulaire}
                    required
                    placeholder="Kouassi William Stéphane"
                    style={{ textTransform: 'capitalize' }}
                  />
                </div>
                
                <div className="groupe-champ-perso">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={gererChangementFormulaire}
                    required
                  />
                </div>

                {!personnelSelectionne && (
  <div className="groupe-champ-perso">
    <label>Mot de passe *</label>
    <div className="champ-mot-de-passe" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input
        type="text"
        name="password"
        value={formData.password}
        onChange={gererChangementFormulaire}
        required
        placeholder="Entrez le mot de passe"
        style={{ flex: 1 }}
      />
      <button
        type="button"
        onClick={() => {
          setFormData(prev => ({
            ...prev,
            password: 'Scolarion26'
          }));
        }}
        style={{
          background: '#f3f4f6',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          padding: '10px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          color: '#4b5563',
          whiteSpace: 'nowrap'
        }}
        title="Réinitialiser le mot de passe par défaut"
      >
        🔄 Réinitialiser
      </button>
    </div>
    <small style={{ color: '#6b7280', fontSize: '12px' }}>
      Mot de passe par défaut: "Scolarion26". Vous pouvez le modifier si nécessaire.
    </small>
  </div>
)}

{/* Pour la modification, afficher une note au lieu du champ */}
{personnelSelectionne && (
  <div className="groupe-champ-perso note-mot-de-passe" style={{
    background: '#fdf4d1',
    padding: '6px',
    borderRadius: '8px',
    borderLeft: '4px solid #f65c5c'
  }}>
    <label style={{ fontWeight: '600', fontSize: '14px', color: '#592323', display: 'block', marginBottom: '1px' }}>
      🔐 Informations de connexion
    </label>
    <p style={{ margin: '0', fontSize: '12px', color: '#856e66' }}>
      Le mot de passe ne peut pas être modifié depuis cette interface. 
      Utilisez la fonction "Réinitialiser le mot de passe" dans la page de connexion si nécessaire.
    </p>
  </div>
)}

                {formData.type_personnel === 'professeur' && (
                  <div className="groupe-champ-perso">
                    <label>Spécialité *</label>
                    <select
                      name="specialite"
                      value={formData.specialite}
                      onChange={gererChangementFormulaire}
                      required
                    >
                      <option value="">Sélectionnez une spécialité</option>
                      {specialites.map(specialite => (
                        <option key={specialite} value={specialite}>
                          {specialite}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.type_personnel === 'instituteur' && (
                  <div className="groupe-champ-perso plein-largeur">
                    <label>Matières enseignées *</label>
                    <div className="selecteur-matieres">
                      <div className="liste-matieres">
                        {matieres.map(matiere => (
                          <button
                            key={matiere.id}
                            type="button"
                            className={`bouton-matiere ${matieresSelectionnees.includes(matiere.nom) ? 'selectionnee' : ''}`}
                            onClick={() => gererSelectionMatiere(matiere.nom)}
                            style={{
                              borderColor: matiere.couleur,
                              backgroundColor: matieresSelectionnees.includes(matiere.nom) 
                                ? `${matiere.couleur}20` 
                                : 'transparent'
                            }}
                          >
                            <span className="icone-matiere">{matiere.icone}</span>
                            <span className="nom-matiere">{matiere.nom}</span>
                            {matieresSelectionnees.includes(matiere.nom) && (
                              <span className="check-matiere">✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="matieres-selectionnees">
                        <strong>Matières sélectionnées ({matieresSelectionnees.length}) :</strong>
                        <div className="liste-selection">
                          {matieresSelectionnees.map((matiere, index) => (
                            <span key={index} className="badge-matiere-selectionnee">
                              {matiere}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {formData.type_personnel === 'administratif' && (
                  <>
                    <div className="groupe-champ-perso">
                      <label>Fonction *</label>
                      <select
                        name="fonction"
                        value={formData.fonction}
                        onChange={gererChangementFormulaire}
                        required
                      >
                        <option value="">Sélectionnez une fonction</option>
                        {fonctions.map(fonction => (
                          <option key={fonction} value={fonction}>
                            {fonction}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="groupe-champ-perso">
                      <label>Département</label>
                      <select
                        name="departement"
                        value={formData.departement}
                        onChange={gererChangementFormulaire}
                      >
                        <option value="">Sélectionnez un département</option>
                        {departements.map(departement => (
                          <option key={departement} value={departement}>
                            {departement}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
                
                <div className="groupe-champ-perso">
                  <label>Date de Naissance</label>
                  <input
                    type="date"
                    name="date_naissance"
                    value={formData.date_naissance}
                    onChange={gererChangementFormulaire}
                  />
                </div>
                
                <div className="groupe-champ-perso">
                  <label>Lieu de Naissance</label>
                  <input
                    type="text"
                    name="lieu_naissance"
                    value={formData.lieu_naissance}
                    onChange={gererChangementFormulaire}
                  />
                </div>
                
                <div className="groupe-champ-perso">
                  <label>Genre</label>
                  <select
                    name="genre"
                    value={formData.genre}
                    onChange={gererChangementFormulaire}
                  >
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
                
                <div className="groupe-champ-perso">
                  <label>Diplôme</label>
                  <input
                    type="text"
                    name="diplome"
                    value={formData.diplome}
                    onChange={gererChangementFormulaire}
                  />
                </div>
                
                <div className="groupe-champ-perso">
                  <label>Date d'embauche</label>
                  <input
                    type="date"
                    name="date_embauche"
                    value={formData.date_embauche}
                    onChange={gererChangementFormulaire}
                  />
                </div>
                
                <div className="groupe-champ-perso">
                  <label>Type de contrat</label>
                  <select
                    name="type_contrat"
                    value={formData.type_contrat}
                    onChange={gererChangementFormulaire}
                  >
                    <option value="titulaire">Titulaire</option>
                    <option value="contractuel">Contractuel</option>
                    <option value="vacataire">Vacataire</option>
                  </select>
                </div>
                
                <div className="groupe-champ-perso">
                  <label>Salaire ({parametresApp?.symbole_devise || 'F CFA'})</label>
                  <input
                    type="number"
                    name="salaire"
                    value={formData.salaire}
                    onChange={gererChangementFormulaire}
                    step="0.01"
                    min="0"
                  />
                </div>
                
                <div className="groupe-champ-perso">
                  <label>Statut</label>
                  <select
                    name="statut"
                    value={formData.statut}
                    onChange={gererChangementFormulaire}
                  >
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                    <option value="retraite">Retraité</option>
                    <option value="demission">Démission</option>
                  </select>
                </div>
                
                <div className="groupe-champ-perso plein-largeur">
                  <label>Adresse</label>
                  <textarea
                    name="adresse"
                    value={formData.adresse}
                    onChange={gererChangementFormulaire}
                    rows={3}
                  />
                </div>
                
                <div className="groupe-champ-perso">
                  <label>Téléphone</label>
                  <input
                    type="tel"
                    name="telephone"
                    value={formData.telephone}
                    onChange={gererChangementFormulaire}
                  />
                </div>
                

                {/* Section Documents */}
                {(personnelSelectionne || formData.nom) && (
                  <div className="section-documents">
                    <h3>📁 Dossier Documents</h3>
                    
                    {personnelSelectionne && (
                      <div className="info-documents">
                        Documents attachés à ce membre
                      </div>
                    )}
                    
                    <div className="zone-upload-docs">
                      <label className="label-upload-documents">
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                          onChange={gererSelectionDocuments}
                          className="input-fichiers-multiples"
                          style={{ display: 'none' }}
                          disabled={uploadDocuments.enCours}
                        />
                        <div className="contenu-zone-upload">
                          <div className="icone-upload-docs">📎</div>
                          <div>
                            <div className="titre-upload-documents">
                              {personnelSelectionne ? 'Ajouter des documents supplémentaires' : 'Cliquez pour ajouter des documents'}
                            </div>
                            <div className="sous-titre-upload-documents">
                              PDF, Word, Excel, Images - max 10MB par fichier
                            </div>
                          </div>
                        </div>
                      </label>
                    </div>

                    {uploadDocuments.fichiers.length > 0 && (
                      <div className="liste-fichiers-selectionnes">
                        <div className="titre-liste-fichiers">
                          Fichiers à uploader ({uploadDocuments.fichiers.length})
                        </div>
                        <div className="grille-fichiers-selectionnes">
                          {uploadDocuments.fichiers.map((fichier, index) => (
                            <div key={index} className="carte-fichier-selectionne">
                              <div className="info-fichier">
                                <div className="icone-type-fichier">
                                  {getIconeTypeFichier(fichier.name)}
                                </div>
                                <div className="details-fichier">
                                  <div className="nom-fichier">{fichier.name}</div>
                                  <div className="taille-fichier">
                                    {formaterTailleFichier(fichier.size)}
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                className="bouton-supprimer-fichier"
                                onClick={() => supprimerFichierSelectionne(index)}
                                disabled={uploadDocuments.enCours}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        {personnelSelectionne && (
                          <button
                            type="button"
                            className="bouton-upload-documents"
                            onClick={() => uploaderDocuments(personnelSelectionne.id)}
                            disabled={uploadDocuments.enCours}
                          >
                            {uploadDocuments.enCours ? (
                              <>
                                <div className="spinner-mini"></div>
                                Upload en cours...
                              </>
                            ) : (
                              `Uploader ${uploadDocuments.fichiers.length} fichier(s)`
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {personnelSelectionne && documentsPersonnel.length > 0 && (
                      <div className="liste-documents-existants">
                        <div className="titre-documents-existants">
                          📂 Documents existants ({documentsPersonnel.length})
                        </div>
                        <div className="tableau-documents">
                          <table className="tableau-documents-table">
                            <thead>
                              <tr>
                                <th>Nom du fichier</th>
                                <th>Type</th>
                                <th>Taille</th>
                                <th>Date</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {documentsPersonnel.map(document => (
                                <tr key={document.id}>
                                  <td className="nom-document">
                                    <div className="icone-document">
                                      {getIconeTypeFichier(document.nom_fichier)}
                                    </div>
                                    <span className="texte-nom-document">
                                      {document.nom_fichier}
                                    </span>
                                  </td>
                                  <td>
                                    <span className="badge-type-document">
                                      {document.type_document}
                                    </span>
                                  </td>
                                  <td>
                                    {formaterTailleFichier(document.taille)}
                                  </td>
                                  <td>
                                    {new Date(document.date_upload).toLocaleDateString('fr-FR')}
                                  </td>
                                  <td>
                                    <div className="actions-document">
                                      <button
                                        type="button"
                                        className="bouton-telecharger-document"
                                        onClick={() => telechargerDocument(document as any)}
                                        title="Télécharger"
                                      >
                                        ⬇️
                                      </button>
                                      <button
                                        type="button"
                                        className="bouton-supprimer-document"
                                        onClick={() => supprimerDocument(document.id)}
                                        title="Supprimer"
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    
                    {!personnelSelectionne && (
                      <div className="note-documents-nouveau">
                        <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '10px' }}>
                          Note : Les documents pourront être ajoutés après la création du membre
                        </small>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="actions-formulaire-perso">
                <button 
                  type="button" 
                  className="bouton-annuler" 
                  onClick={fermerModal}
                  disabled={chargementSoumission}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className={`bouton-sauvegarder-perso ${chargementSoumission ? 'chargement' : ''}`}
                  onClick={soumettreFormulaire}
                  disabled={chargementSoumission}
                >
                  {chargementSoumission ? (
                    <>
                      <div className="spinner-bouton"></div>
                      Chargement...
                    </>
                  ) : (
                    <>
                      {personnelSelectionne ? '💾 Mettre à jour' : '👨‍💼 Créer'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE DÉTAIL */}
      {modalDetailOuvert && personnelSelectionne && (
        <div className="overlay-modal" onClick={fermerModalDetail}>
          <div className="modal-detail-personnel" onClick={(e) => e.stopPropagation()}>
            <div className="en-tete-modal">
              <h2>Détails du personnel</h2>
              <button className="bouton-fermer-modal-perso" onClick={fermerModalDetail}>✕</button>
            </div>
            
            <div className="contenu-detail-personnel">
              {/* En-tête avec photo */}
              <div className="info-principale-detail">
                {personnelSelectionne.avatar_url ? (
                  <img 
                    src={personnelSelectionne.avatar_url} 
                    alt=""
                    className="photo-personnel-grande"
                  />
                ) : (
                  <div className="photo-placeholder-grande">
                    {personnelSelectionne.prenom?.charAt(0) || 'P'}{personnelSelectionne.nom?.charAt(0) || 'N'}
                  </div>
                )}
                <div className="info-titre-detail">
                  <h2>{personnelSelectionne.prenom} {personnelSelectionne.nom}</h2>
                  <div className="email-detail">{personnelSelectionne.email}</div>
                  <div className="matricule-detail">Matricule: {personnelSelectionne.matricule}</div>
                </div>
              </div>

              {/* Onglets */}
              <div className="onglets-detail">
                <button
                  className={`onglet-perso ${activeOnglet === 'info' ? 'actif' : ''}`}
                  onClick={() => setActiveOnglet('info')}
                  
                >
                  📋 Informations
                </button>
                
                <button
                  className={`onglet-perso ${activeOnglet === 'documents' ? 'actif' : ''}`}
                  onClick={() => setActiveOnglet('documents')}>
                  📁 Documents ({documentsPersonnel.length})
                </button>
                
                {personnelSelectionne.type_personnel !== 'administratif' && (
                  <button
                    className={`onglet-perso ${activeOnglet === 'classes' ? 'actif' : ''}`}
                    onClick={() => setActiveOnglet('classes')}>
                    🏫 Classes ({personnelSelectionne.nombre_classes || 0})
                  </button>
                )}
              </div>

              {/* Contenu des onglets */}
              <div className="contenu-onglets">
                {activeOnglet === 'info' && (
                  <div className="contenu-info">
                    <div className="grille-details">
                      <div className="info-detail">
                        <h3>Informations Personnelles</h3>
                        <div className="info-detail-item">
                          <strong>Date de naissance:</strong>
                          <span>{personnelSelectionne.date_naissance ? formaterDate(personnelSelectionne.date_naissance) : 'Non renseignée'}</span>
                        </div>
                        <div className="info-detail-item">
                          <strong>Lieu de naissance:</strong>
                          <span>{personnelSelectionne.lieu_naissance || 'Non renseigné'}</span>
                        </div>
                        <div className="info-detail-item">
                          <strong>Genre:</strong>
                          <span>{personnelSelectionne.genre === 'M' ? 'Masculin' : 'Féminin'}</span>
                        </div>
                        <div className="info-detail-item">
                          <strong>Téléphone:</strong>
                          <span>{personnelSelectionne.telephone || 'Non renseigné'}</span>
                        </div>
                        <div className="info-detail-item">
                          <strong>Adresse:</strong>
                          <span>{personnelSelectionne.adresse || 'Non renseignée'}</span>
                        </div>
                        <div className="info-detail-item">
                          <strong>Salaire:</strong>
                          <span>{personnelSelectionne.salaire ? formaterMontant(personnelSelectionne.salaire) : 'Non renseigné'}</span>
                        </div>
                      </div>
                      
                      <div className="info-detail">
                        <h3>Informations Professionnelles</h3>
                        <div className="info-detail-item">
                          <strong>Type:</strong>
                          <span>
                            {personnelSelectionne.type_personnel === 'instituteur' ? '🏫 Instituteur' : 
                             personnelSelectionne.type_personnel === 'professeur' ? '👨‍🏫 Professeur' : 
                             '👨‍💼 Administratif'}
                          </span>
                        </div>
                        
                        {personnelSelectionne.type_personnel === 'professeur' && (
                          <div className="info-detail-item">
                            <strong>Spécialité:</strong>
                            <span>{personnelSelectionne.specialite || 'Non définie'}</span>
                          </div>
                        )}
                        
                        {personnelSelectionne.type_personnel === 'instituteur' && (
                          <div className="info-detail-item">
                            <strong>Matières enseignées:</strong>
                            <span>{personnelSelectionne.matieres_enseignees || 'Non définies'}</span>
                          </div>
                        )}
                        
                        {personnelSelectionne.type_personnel === 'administratif' && (
                          <>
                            <div className="info-detail-item">
                              <strong>Fonction:</strong>
                              <span>{personnelSelectionne.fonction || 'Non définie'}</span>
                            </div>
                            <div className="info-detail-item">
                              <strong>Département:</strong>
                              <span>{personnelSelectionne.departement || 'Non défini'}</span>
                            </div>
                          </>
                        )}
                        
                        <div className="info-detail-item">
                          <strong>Diplôme:</strong>
                          <span>{personnelSelectionne.diplome || 'Non renseigné'}</span>
                        </div>
                        <div className="info-detail-item">
                          <strong>Date d'embauche:</strong>
                          <span>{formaterDate(personnelSelectionne.date_embauche)}</span>
                        </div>
                        <div className="info-detail-item">
                          <strong>Ancienneté:</strong>
                          <span>{calculerAnciennete(personnelSelectionne.date_embauche)} an{calculerAnciennete(personnelSelectionne.date_embauche) > 1 ? 's' : ''}</span>
                        </div>
                        <div className="info-detail-item">
                          <strong>Type de contrat:</strong>
                          <span>{personnelSelectionne.type_contrat}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeOnglet === 'documents' && (
                  <div className="contenu-documents">
                    <h3 style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      marginBottom: '20px',
                      color: '#80858d'
                    }}>
                      <span>📁</span>
                      <span>Documents</span>
                      <span style={{
                        background: '#3b82f6',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {documentsPersonnel.length}
                      </span>
                    </h3>

                    {documentsPersonnel.length > 0 ? (
                      <div className="grille-documents-detail">
                        {documentsPersonnel.map(document => (
                          <div key={document.id} className="carte-document-detail">
                            <div className="entete-document">
                              <div className="icone-document-grand">
                                {getIconeTypeFichier(document.nom_fichier)}
                              </div>
                              <div className="info-document">
                                <div className="nom-document-detail">
                                  {document.nom_fichier}
                                </div>
                                <div className="meta-document">
                                  <span className="type-document">
                                    {document.type_document}
                                  </span>
                                  <span className="type-document">
                                    {formaterTailleFichier(document.taille)}
                                  </span>
                                  <span className="type-document">
                                    {formaterDate(document.date_upload)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="actions-document-detail">
                              <button
                                className="bouton-telecharger-document"
                                onClick={() => telechargerDocument(document)}
                                title="Télécharger"
                              >
                                ⬇️ Télécharger
                              </button>
                              <button
                                className="bouton-supprimer-document"
                                onClick={() => supprimerDocument(document.id)}
                                title="Supprimer"
                              >
                                🗑️ Supprimer
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="aucun-document-detail">
                        <div style={{ fontSize: '48px', marginBottom: '15px', color: '#cbd5e1' }}>
                          📁
                        </div>
                        <p style={{ margin: '0 0 10px 0', color: '#666' }}>
                          Aucun document pour ce membre
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {activeOnglet === 'classes' && personnelSelectionne.type_personnel !== 'administratif' && (
                  <div className="contenu-classes">
                    <h3>Classes attribuées</h3>
                    {personnelSelectionne.nombre_classes && personnelSelectionne.nombre_classes > 0 ? (
                      <div className="grille-classes-attribuees">
                        <div className="carte-classe-attribuee">
                          <div className="nom-classe-attribuee">{personnelSelectionne.classes_principales || 'Classes principales'}</div>
                          <div className="niveau-classe-attribuee">Niveau</div>
                          <div className="eleves-classe-attribuee">{personnelSelectionne.nombre_classes} classe(s)</div>
                        </div>
                      </div>
                    ) : (
                      <div className="aucune-classe-attribuee">
                        Aucune classe attribuée
                      </div>
                    )}
                    
                    <div style={{ marginTop: '1px', textAlign: 'center' }}>
                      <button
                        className="bouton-gerer-classe-perso"
                        onClick={() => {
                          fermerModalDetail();
                          ouvrirModalClasses(personnelSelectionne);
                        }}
                      >
                        🏫 Gérer les classes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="actions-modal-suppression">
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="bouton-modifier"
                  onClick={() => {
                    fermerModalDetail();
                    ouvrirModal(personnelSelectionne);
                  }}
                >
                  ✏️ Modifier
                </button>
                <button 
                  className="bouton-supprimer"
                  onClick={() => {
                    fermerModalDetail();
                    ouvrirModalSuppression(personnelSelectionne);
                  }}
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE GESTION DES CLASSES */}
      {modalClassesOuvert && personnelPourClasses && personnelPourClasses.type_personnel !== 'administratif' && (
        <div className="overlay-modal" onClick={fermerModalClasses}>
          <div className="modal-detail-personnel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
            <div className="en-tete-modal">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ fontSize: '24px' }}>🏫</div>
                <div>
                  <h2 style={{ margin: 0 }}>Gestion des Classes</h2>
                  <p style={{ margin: '1px 0 0 0', color: '#ffffff', fontSize: '16px' }}>
                    {personnelPourClasses.nom} {personnelPourClasses.prenom}
                  </p>
                  <p style={{ margin: '1px 0 0 0', color: '#260043', fontSize: '14px' }}>
                    {personnelPourClasses.type_personnel} - {personnelPourClasses.matricule}
                  </p>
                </div>
              </div>
              <button className="bouton-fermer-modal-perso" onClick={fermerModalClasses}>✕</button>
            </div>
            
            <div className="contenu-modal-classes" style={{ padding: '20px' }}>
              {chargementClasses ? (
                <div className="chargement-classes" style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="spinner"></div>
                  <p>Chargement des classes...</p>
                </div>
              ) : (
                <>
                  <div className="section-classes-actuelles" style={{ marginBottom: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h3 style={{ margin: 0}}>Classes attribuées</h3>
                      <span style={{ 
                        background: '#3b82f6', 
                        color: 'white', 
                        padding: '4px 12px', 
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        {classesPersonnel.length} classe{classesPersonnel.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    {classesPersonnel.length > 0 ? (
                      <div className="grille-classes" style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
                        gap: '15px' 
                      }}>
                        {classesPersonnel.map(classe => (
                          <div key={classe.id} className="carte-classe-attribuee" style={{
                      
                            borderRadius: '10px',
                            padding: '15px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}>
                            <div className="info-classe" style={{ marginBottom: '15px' }}>
                              <div className="nom-classe-attribuee" style={{ 
                                fontSize: '14px', 
                                fontWeight: '600', 
                                textAlign: 'center',
                                marginBottom: '5px'
                              }}>
                                {classe.nom}
                              </div>
                              <div className="niveau-classe-attribuee" style={{ 
                                fontSize: '11px', 
                                textAlign: 'center',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                marginBottom: '5px'
                              }}>
                                {classe.niveau}
                              </div>
                              {classe.nombre_eleves !== undefined && (
                                <div className="eleves-classe" style={{ 
                                  fontSize: '12px', 
                                  textAlign: 'center',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  marginTop: '8px'
                                }}>
                                  <span style={{ fontWeight: '600' }}>👥</span> {classe.nombre_eleves || 0} élève{classe.nombre_eleves !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                            <button 
                              className="bouton-retirer-classe"
                              onClick={() => retirerClasse(classe.id)}
                              style={{
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                cursor: 'pointer',
                                width: '100%',
                                fontSize: '12px',
                                fontWeight: '500',
                                transition: 'background-color 0.3s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                            >
                              🗑️ Retirer
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="aucune-classe" style={{
                        textAlign: 'center',
                        padding: '40px',
                        borderRadius: '10px'
                      }}>
                        <div style={{ fontSize: '48px', marginBottom: '15px' }}>🏫</div>
                        <p style={{ margin: '0 0 10px 0', color: '#666' }}>
                          Aucune classe attribuée
                        </p>
                        <p style={{ fontSize: '12px', color: '#888' }}>
                          Attribuez une classe depuis la liste ci-dessous
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="section-classes-disponibles" style={{ marginBottom: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h3 style={{ margin: 0}}>Classes disponibles</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ 
                          padding: '4px 12px', 
                          borderRadius: '20px',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}>
                          {classesDisponibles.filter(c => !c.professeur_principal_id).length} disponible{classesDisponibles.filter(c => !c.professeur_principal_id).length !== 1 ? 's' : ''}
                        </span>
                        <span style={{
                          padding: '4px 12px', 
                          background: '#8a7f07',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          Total : {classesDisponibles.length}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ 
                      background: 'none',
                      fontSize: '11px',  
                      padding: '8px', 
                      borderRadius: '6px',
                      marginBottom: '15px'
                    }}>
                    </div>
                    
                    {classesDisponibles.filter(c => !c.professeur_principal_id).length > 0 ? (
                      <div className="grille-classes" style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
                        gap: '15px' 
                      }}>
                        {classesDisponibles
                          .filter(classe => !classe.professeur_principal_id)
                          .map(classe => (
                            <div key={classe.id} className="carte-classe-disponible" style={{
                              borderRadius: '10px',
                              padding: '15px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              position: 'relative'
                            }}>
                              <div className="niveau-classe-disponible" style={{ 
                                position: 'absolute',
                                top: '-10px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: '#10b981',
                                color: '#ffffff',
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: '600',
                                whiteSpace: 'nowrap',
                              }}>
                                {classe.niveau}
                              </div>
                              
                              <div className="info-classe" style={{ marginBottom: '15px', marginTop: '15px' }}>
                                <div className="nom-classe-disponible" style={{ 
                                  fontSize: '14px', 
                                  fontWeight: '600', 
                                  color: '#333',
                                  textAlign: 'center',
                                  marginBottom: '8px'
                                }}>
                                  {classe.nom}
                                </div>
                                
                                {classe.nombre_eleves !== undefined && (
                                  <div className="eleves-classe" style={{ 
                                    fontSize: '12px', 
                                    color: '#64748b',
                                    textAlign: 'center',
                                    padding: '4px 8px',
                                    background: '#f1f5f9',
                                    borderRadius: '6px',
                                    marginTop: '8px'
                                  }}>
                                    <span style={{ fontWeight: '600' }}>👥</span> {classe.nombre_eleves || 0} élève{classe.nombre_eleves !== 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>
                              
                              <button 
                                className="bouton-attribuer-classe"
                                onClick={() => attribuerClasse(classe.id)}
                                style={{
                                  background: '#5c10b9',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  width: '100%',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  transition: 'all 0.3s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '5px'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#3e047b';
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#3e047b';
                                  e.currentTarget.style.transform = 'translateY(0)';
                                }}
                              >
                                <span>👨‍🏫</span>
                                <span>Attribuer</span>
                              </button>
                            </div>
                          ))
                        }
                      </div>
                    ) : (
                      <div className="aucune-classe-disponible" style={{
                        textAlign: 'center',
                        padding: '30px',
                        background: '#f8fafc',
                        borderRadius: '10px',
                        border: '2px dashed #cbd5e1'
                      }}>
                        <div style={{ fontSize: '36px', marginBottom: '10px' }}>📚</div>
                        <p style={{ margin: '0 0 10px 0', color: '#666' }}>
                          Aucune classe disponible
                        </p>
                        <p style={{ fontSize: '12px', color: '#888' }}>
                          Toutes les classes ont déjà un professeur principal
                        </p>
                        <div style={{ marginTop: '15px', fontSize: '11px', color: '#999' }}>
                          Total classes: {classesDisponibles.length} • Avec professeur: {classesDisponibles.filter(c => c.professeur_principal_id).length}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            
            <div className="actions-modal-suppression " style={{
              padding: '20px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '11px', color: '#888' }}>
              </div>
              <button 
                className="bouton-fermer"
                onClick={fermerModalClasses}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SUPPRESSION INDIVIDUELLE */}
      {modalSuppressionOuvert && personnelASupprimer && (
        <div className="overlay-modal" onClick={fermerModalSuppression}>
          <div className="modal-suppression" onClick={(e) => e.stopPropagation()}>
            <div className="en-tete-modal-suppression">
              <h2>⚠️ Confirmer la suppression</h2>
            </div>
            
            <div className="contenu-modal-suppression">
              <p>
                Voulez-Vous Vraiment supprimer <strong>"{personnelASupprimer.nom} {personnelASupprimer.prenom}"</strong> ?
              </p>
              
              <div className="avertissement-important">
                <p><strong>⚠️ Attention : Cette action est irréversible</strong></p>
                <p>• Toutes les données seront supprimées</p>
                <p>• L'accès au système sera révoqué</p>
                {personnelASupprimer.type_personnel !== 'administratif' && (
                  <p>• Les classes dont il est professeur principal seront affectées</p>
                )}
              </div>
              
              <div className="information-suppression">
                <div><strong>Matricule:</strong> {personnelASupprimer.matricule}</div>
                <div><strong>Email:</strong> {personnelASupprimer.email}</div>
                {personnelASupprimer.type_personnel === 'professeur' && (
                  <div><strong>Spécialité:</strong> {personnelASupprimer.specialite || 'Non définie'}</div>
                )}
                {personnelASupprimer.type_personnel === 'administratif' && (
                  <div><strong>Fonction:</strong> {personnelASupprimer.fonction || 'Non définie'}</div>
                )}
              </div>
            </div>
            
            <div className="actions-modal-suppression">
              <button 
                className="bouton-annuler-suppression"
                onClick={fermerModalSuppression}
              >
                Annuler
              </button>
              <button 
                className="bouton-confirmer-suppression"
                onClick={supprimerPersonnel}
              >
                🗑️ Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}