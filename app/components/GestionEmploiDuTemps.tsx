'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import './GestionEmploiDuTemps.css';
import { formatTimeToHHMM } from '@/app/utils/formatTime';
import { fetchWithErrorHandling } from '@/app//utils/fetchWithErrorHandling';
import * as XLSX from 'xlsx';

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

interface Cours {
  code_cours: string;
  nom_cours: string;
  description: string;
  professeur_id: number;
  classe_id: number;
  jour_semaine: string;
  heure_debut: string;
  heure_fin: string;
  salle: string;
  couleur: string;
  statut: string;
  matiere_id?: number;
  professeur_nom?: string;
  classe_nom?: string;
  estDansEmploi?: boolean; 
}

interface Classe {
  id: number;
  nom: string;
  niveau: string;
  annee_scolaire: string;
}

interface Professeur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  specialite?: string;
}

interface CoursComplet {
  code_cours: string;
  nom_cours: string;
  description: string;
  professeur_id: number;
  classe_id: number;
  jour_semaine: string;
  heure_debut: string;
  heure_fin: string;
  salle: string;
  couleur: string;
  statut: string;
  matiere_id?: number;
  professeur_nom?: string;
  classe_nom?: string;
  estDansEmploi?: boolean;
}

interface EmploiDuTempsCreneau {
  id: number;
  code_cours: string;
  classe_id: number;
  professeur_id: number;
  jour_semaine: string;
  heure_debut: string;
  heure_fin: string;
  salle: string;
  type_creneau: 'cours' | 'pause' | 'activite' | 'reunion';
  description?: string;
  couleur: string;
  created_at: string;
  updated_at: string;
  nom_cours?: string;
  classe_nom?: string;
  professeur_nom?: string;
}

// Interface pour les alertes
interface Alerte {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface Props {
  onRetourTableauDeBord: () => void;
}

export default function GestionEmploiDuTemps({ onRetourTableauDeBord }: Props) {
  // États principaux
  const [cours, setCours] = useState<Cours[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [professeurs, setProfesseurs] = useState<Professeur[]>([]);
  const [emploiDuTemps, setEmploiDuTemps] = useState<EmploiDuTempsCreneau[]>([]);
  const [chargement, setChargement] = useState(true);
  const [classeSelectionnee, setClasseSelectionnee] = useState<number | null>(null);
  const [professeurSelectionne, setProfesseurSelectionne] = useState<number | null>(null);
  const [filtreActif, setFiltreActif] = useState<string>('classes');
  const [afficherFormCreneau, setAfficherFormCreneau] = useState(false);
  const [creneauEnEdition, setCreneauEnEdition] = useState<EmploiDuTempsCreneau | null>(null);
  const [alerte, setAlerte] = useState<Alerte | null>(null);
  const [semaineSelectionnee, setSemaineSelectionnee] = useState(0);
  const [chargementEmploi, setChargementEmploi] = useState(false);

  // États pour les paramètres
  const [parametresEcole, setParametresEcole] = useState<ParametresEcole | null>(null);
  const [parametresApp, setParametresApp] = useState<ParametresApp | null>(null);

  // Formulaire
  const [formData, setFormData] = useState({
    code_cours: '',
    classe_id: 0,
    professeur_id: 0,
    jour_semaine: 'Lundi',
    heure_debut: '08:00',
    heure_fin: '09:00',
    salle: '',
    type_creneau: 'cours' as 'cours' | 'pause' | 'activite' | 'reunion',
    description: '',
    couleur: '#3B82F6'
  });

  // Jours de la semaine
const joursSemaine = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const indexJours: { [key: string]: number } = {
  'Lundi': 0,
  'Mardi': 1,
  'Mercredi': 2,
  'Jeudi': 3,
  'Vendredi': 4,
  'Samedi': 5
};
  
  // Heures de la journée
  const heures = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  // Couleurs pour les types de créneaux
  const couleursTypes = {
    cours: '#3B82F6',
    pause: '#10B981',
    activite: '#8B5CF6',
    reunion: '#F59E0B'
  };

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

  // Formater une heure avec le fuseau horaire
  const formaterHeure = (heure: string): string => {
    // Si l'heure est déjà au format HH:MM, on la retourne
    if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(heure)) {
      return heure;
    }
    
    // Si l'heure contient des secondes (HH:MM:SS)
    if (heure.includes(':')) {
      const parts = heure.split(':');
      if (parts.length >= 2) {
        return `${parts[0].padStart(2, '0')}:${parts[1]}`;
      }
    }
    
    return heure;
  };

  // Obtenir le libellé du fuseau horaire
  const getFuseauHoraireLibelle = (): string => {
    if (!parametresApp) return 'GMT+0';
    
    const fuseaux: Record<string, string> = {
      'Africa/Abidjan': 'GMT+0',
      'Africa/Dakar': 'GMT+0',
      'Africa/Lagos': 'GMT+1',
      'Africa/Johannesburg': 'GMT+2',
      'Europe/Paris': 'GMT+1',
      'Europe/London': 'GMT+0'
    };
    
    return fuseaux[parametresApp.fuseau_horaire] || 'GMT+0';
  };

  // ==================== CHARGEMENT DES DONNÉES ====================

  // Charger les paramètres
  const chargerParametres = async () => {
    try {
      const [ecoleRes, appRes] = await Promise.all([
        fetch('/api/parametres/ecole'),
        fetch('/api/parametres/application')
      ]);
      
      const ecoleData = await ecoleRes.json();
      const appData = await appRes.json();
      
      if (ecoleData.success) {
        setParametresEcole(ecoleData.parametres);
      }
      
      if (appData.success && appData.parametres) {
        setParametresApp(appData.parametres);
      }
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
    }
  };

  // Charger les données au montage
  useEffect(() => {
    chargerParametres();
    chargerDonnees();
  }, []);

  useEffect(() => {
    if (alerte) {
      const timer = setTimeout(() => setAlerte(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alerte]);

  // Recharger l'emploi du temps quand les filtres changent
  useEffect(() => {
    if (classeSelectionnee || professeurSelectionne || semaineSelectionnee !== 0) {
      chargerEmploiDuTemps();
    }
  }, [classeSelectionnee, professeurSelectionne, semaineSelectionnee]);

  const chargerDonnees = async () => {
    try {
      setChargement(true);
      
      await Promise.all([
        chargerCours(),
        chargerClasses(),
        chargerProfesseurs(),
        chargerEmploiDuTemps()
      ]);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      setAlerte({ type: 'error', message: 'Erreur lors du chargement des données' });
    } finally {
      setChargement(false);
    }
  };

  const chargerCours = async () => {
  try {
    const response = await fetch('/api/cours');
    const data = await response.json();
    
    if (data.success) {
      // Pour chaque cours, vérifier s'il est dans l'emploi du temps
      const coursAvecSync = (data.cours || []).map((c: Cours) => {
        const estDansEmploi = emploiDuTemps.some(
          e => e.code_cours === c.code_cours
        );
        return {
          ...c,
          estDansEmploi
        };
      });
      
      setCours(coursAvecSync);
    }
  } catch (error) {
    console.error('Erreur chargement cours:', error);
  }
};

  const chargerClasses = async () => {
    try {
      const response = await fetch('/api/classes');
      const data = await response.json();
      
      if (data.success) {
        const classesFormatees = data.classes?.map((classe: any) => ({
          id: classe.id,
          nom: classe.nom,
          niveau: classe.niveau,
          annee_scolaire: parametresEcole?.annee_scolaire || '2024-2025'
        })) || [];
        
        setClasses(classesFormatees);
      }
    } catch (error) {
      console.error('Erreur chargement classes:', error);
    }
  };

  const chargerProfesseurs = async () => {
    try {
      const response = await fetch('/api/enseignants');
      const data = await response.json();
      
      if (data.success) {
        const professeursFormates = data.enseignants?.map((enseignant: any) => ({
          id: enseignant.id,
          nom: enseignant.nom || enseignant.user?.nom || '',
          prenom: enseignant.prenom || enseignant.user?.prenom || '',
          email: enseignant.email || enseignant.user?.email || '',
          specialite: enseignant.specialite
        })) || [];
        
        setProfesseurs(professeursFormates);
      }
    } catch (error) {
      console.error('Erreur chargement professeurs:', error);
    }
  };

  const chargerEmploiDuTemps = async () => {
    try {
      setChargementEmploi(true);
      
      let url = '/api/emploi-du-temps?';
      const params = new URLSearchParams();
      
      if (filtreActif === 'classes' && classeSelectionnee) {
        params.append('classe_id', classeSelectionnee.toString());
      } else if (filtreActif === 'professeurs' && professeurSelectionne) {
        params.append('professeur_id', professeurSelectionne.toString());
      }
      
      if (semaineSelectionnee !== 0) {
        // Calculer la date de début de semaine
        const dateDebut = new Date();
        dateDebut.setDate(dateDebut.getDate() + (semaineSelectionnee * 7));
        params.append('semaine_debut', dateDebut.toISOString().split('T')[0]);
      }
      
      url += params.toString();
      
      console.log('📡 Chargement emploi du temps depuis:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('📊 Données reçues:', data);
      
      if (data.success) {
        const creneauxFormates: EmploiDuTempsCreneau[] = data.emploiDuTemps?.map((item: any) => ({
          id: item.id,
          code_cours: item.code_cours || '',
          classe_id: item.classe_id,
          professeur_id: item.professeur_id,
          jour_semaine: item.jour_semaine,
          heure_debut: formaterHeure(item.heure_debut),
          heure_fin: formaterHeure(item.heure_fin),
          salle: item.salle || '',
          type_creneau: item.type_creneau || 'cours',
          description: item.description || '',
          couleur: item.couleur || '#3B82F6',
          created_at: item.created_at,
          updated_at: item.updated_at,
          nom_cours: item.nom_cours || '',
          classe_nom: item.classe_nom || '',
          professeur_nom: item.professeur_nom || '',
          estCoursSync: !!item.code_cours
        })) || [];
        
        console.log('✅ Emploi chargé:', creneauxFormates.length, 'créneaux');
        setEmploiDuTemps(creneauxFormates);
      } else {
        console.error('Erreur API:', data.error);
        setAlerte({ type: 'error', message: data.error || 'Erreur chargement emploi du temps' });
      }
    } catch (error: any) {
      console.error('❌ Erreur chargement:', error);
      setAlerte({ 
        type: 'error', 
        message: error.message || 'Erreur de connexion au serveur' 
      });
    } finally {
      setChargementEmploi(false);
    }
  };

  // ==================== FONCTIONS DE SYNCHRONISATION ====================

  const synchroniserCoursVersEmploi = async (codeCours: string) => {
    try {
      setChargement(true);
      
      const response = await fetch('/api/cours/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code_cours: codeCours,
          action: 'add' 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAlerte({ 
          type: 'success', 
          message: 'Cours synchronisé avec l\'emploi du temps' 
        });
        await chargerEmploiDuTemps();
      } else {
        setAlerte({ 
          type: 'error', 
          message: data.error || 'Erreur lors de la synchronisation' 
        });
      }
    } catch (error: any) {
      console.error('Erreur synchronisation:', error);
      setAlerte({ 
        type: 'error', 
        message: 'Erreur lors de la synchronisation' 
      });
    } finally {
      setChargement(false);
    }
  };

  const retirerCoursDeEmploi = async (codeCours: string) => {
    try {
      if (!confirm('Retirer ce cours de l\'emploi du temps ?')) return;
      
      setChargement(true);
      
      const response = await fetch('/api/cours/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code_cours: codeCours,
          action: 'remove' 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAlerte({ 
          type: 'success', 
          message: 'Cours retiré de l\'emploi du temps' 
        });
        await chargerEmploiDuTemps();
      } else {
        setAlerte({ 
          type: 'error', 
          message: data.error || 'Erreur lors du retrait' 
        });
      }
    } catch (error: any) {
      console.error('Erreur retrait:', error);
      setAlerte({ 
        type: 'error', 
        message: 'Erreur lors du retrait' 
      });
    } finally {
      setChargement(false);
    }
  };

  const verifierSynchronisation = async (codeCours: string) => {
    try {
      const response = await fetch(`/api/cours/sync?code_cours=${codeCours}`);
      const data = await response.json();
      
      if (data.success) {
        const message = data.isSynced 
          ? `✅ Ce cours est synchronisé (ID emploi: ${data.syncDetails?.emploi_id})`
          : `⚠️ Ce cours n'est pas dans l'emploi du temps`;
        
        setAlerte({ 
          type: data.isSynced ? 'success' : 'warning',
          message 
        });
      }
    } catch (error) {
      console.error('Erreur vérification:', error);
    }
  };

  const verifierCoursNonSync = async () => {
    try {
      let url = '/api/emploi-du-temps/sync-masse?';
      const params = new URLSearchParams();
      
      if (filtreActif === 'classes' && classeSelectionnee) {
        params.append('classe_id', classeSelectionnee.toString());
      } else if (filtreActif === 'professeurs' && professeurSelectionne) {
        params.append('professeur_id', professeurSelectionne.toString());
      }
      
      url += params.toString();
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        return data.cours_non_synchronises || 0;
      }
      return 0;
    } catch (error) {
      console.error('Erreur vérification cours non sync:', error);
      return 0;
    }
  };

  const synchroniserEnMasse = async () => {
    try {
      if (!confirm('Voulez-vous synchroniser tous les cours avec l\'emploi du temps ?')) {
        return;
      }
      
      setChargement(true);
      
      const dataToSend: any = { action: 'sync' };
      
      if (filtreActif === 'classes' && classeSelectionnee) {
        dataToSend.classe_id = classeSelectionnee;
      } else if (filtreActif === 'professeurs' && professeurSelectionne) {
        dataToSend.professeur_id = professeurSelectionne;
      }
      
      const data = await fetchWithErrorHandling('/api/emploi-du-temps/sync-masse', {
        method: 'POST',
        body: JSON.stringify(dataToSend)
      });
      
      if (data.success) {
        setAlerte({ 
          type: 'success', 
          message: data.message || 'Synchronisation terminée avec succès' 
        });
        
        await chargerEmploiDuTemps();
        
      } else {
        setAlerte({ 
          type: 'error', 
          message: data.error || 'Erreur lors de la synchronisation' 
        });
      }
      
    } catch (error: any) {
      console.error('Erreur synchronisation:', error);
      setAlerte({ 
        type: 'error', 
        message: error.message || 'Erreur lors de la synchronisation'
      });
    } finally {
      setChargement(false);
    }
  };

// ==================== FONCTIONS D'EXPORT ET IMPRESSION ====================

  const imprimerEmploiDuTemps = () => {
    if (!classeSelectionnee && !professeurSelectionne) {
      setAlerte({ type: 'warning', message: 'Veuillez sélectionner une classe ou un professeur' });
      return;
    }

    // Créer une fenêtre d'impression
    const fenetreImpression = window.open('', '_blank');
    if (!fenetreImpression) {
      setAlerte({ type: 'error', message: 'Impossible d\'ouvrir la fenêtre d\'impression' });
      return;
    }

    // Récupérer le titre et les données
    const titre = filtreActif === 'classes' 
      ? `Emploi du temps - ${getNomClasse(classeSelectionnee || 0)}` 
      : `Emploi du temps - ${getNomProfesseur(professeurSelectionne || 0)}`;

    // Générer le contenu HTML pour l'impression
    const contenuImpression = genererContenuImpression(titre);
    
    // Écrire le contenu dans la fenêtre
    fenetreImpression.document.write(contenuImpression);
    fenetreImpression.document.close();
    
    // Déclencher l'impression après le chargement
    fenetreImpression.onload = () => {
      fenetreImpression.print();
      // Optionnel : fermer la fenêtre après impression
      // fenetreImpression.onafterprint = () => fenetreImpression.close();
    };

    setAlerte({ type: 'success', message: 'Préparation de l\'impression...' });
  };

  const genererContenuImpression = (titre: string): string => {
    // Récupérer les créneaux selon le filtre actif
    const creneaux = filtreActif === 'classes'
      ? getCreneauxParClasse(classeSelectionnee || 0)
      : getCreneauxParProfesseur(professeurSelectionne || 0);

    // Regrouper les créneaux par jour
    const creneauxParJour = joursSemaine.reduce((acc, jour) => {
      acc[jour] = creneaux
        .filter(c => c.jour_semaine === jour)
        .sort((a, b) => a.heure_debut.localeCompare(b.heure_debut));
      return acc;
    }, {} as Record<string, EmploiDuTempsCreneau[]>);

    // Couleur principale de l'école
    const couleurPrincipale = parametresEcole?.couleur_principale || '#3B82F6';

    // Date d'impression
    const dateImpression = formaterDate(new Date());
    const heureImpression = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    // Générer le HTML
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${titre}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          }
          
          body {
            padding: 20px;
            background: white;
          }
          
          .entete-impression {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid ${couleurPrincipale};
          }
          
          .logo-ecole {
            max-width: 100px;
            max-height: 100px;
            margin-bottom: 10px;
          }
          
          .titre-ecole {
            font-size: 24px;
            color: ${couleurPrincipale};
            margin-bottom: 5px;
          }
          
          .sous-titre-ecole {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
          }
          
          .titre-emploi {
            font-size: 20px;
            margin: 15px 0;
            font-weight: bold;
          }
          
          .info-impression {
            display: flex;
            justify-content: space-between;
            margin: 20px 0;
            padding: 10px;
            background: #f5f5f5;
            border-radius: 5px;
            font-size: 14px;
          }
          
          .annee-scolaire {
            font-weight: bold;
            color: ${couleurPrincipale};
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            page-break-inside: avoid;
          }
          
          th {
            background-color: ${couleurPrincipale};
            color: white;
            padding: 12px;
            font-size: 14px;
            text-align: center;
            border: 1px solid #ddd;
          }
          
          td {
            border: 1px solid #ddd;
            padding: 10px;
            vertical-align: top;
            height: 100px;
          }
          
          .cellule-heure {
            background-color: #f5f5f5;
            font-weight: bold;
            text-align: center;
            width: 80px;
          }
          
          .creneau-impression {
            margin-bottom: 8px;
            padding: 6px;
            border-radius: 4px;
            color: white;
            font-size: 12px;
            page-break-inside: avoid;
          }
          
          .creneau-cours {
            background-color: ${couleursTypes.cours};
          }
          
          .creneau-pause {
            background-color: ${couleursTypes.pause};
          }
          
          .creneau-activite {
            background-color: ${couleursTypes.activite};
          }
          
          .creneau-reunion {
            background-color: ${couleursTypes.reunion};
          }
          
          .titre-creneau-impression {
            font-weight: bold;
            margin-bottom: 3px;
            font-size: 11px;
          }
          
          .details-creneau-impression {
            font-size: 10px;
            opacity: 0.9;
          }
          
          .horaire-creneau-impression {
            font-size: 9px;
            margin-top: 3px;
            opacity: 0.8;
          }
          
          .legende {
            margin-top: 30px;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 5px;
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
          }
          
          .legende-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
          }
          
          .couleur-legende {
            width: 20px;
            height: 20px;
            border-radius: 4px;
          }
          
          .pied-impression {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
          
          @media print {
            body {
              padding: 0;
            }
            
            .no-print {
              display: none;
            }
            
            table {
              page-break-inside: auto;
            }
            
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
          }
        </style>
      </head>
      <body>
        <div class="entete-impression">
          ${parametresEcole?.logo_url ? 
            `<img src="${parametresEcole.logo_url}" alt="Logo école" class="logo-ecole">` : 
            ''
          }
          <h1 class="titre-ecole">${parametresEcole?.nom_ecole || 'Établissement Scolaire'}</h1>
          ${parametresEcole?.slogan ? 
            `<p class="sous-titre-ecole">${parametresEcole.slogan}</p>` : 
            ''
          }
          <p class="sous-titre-ecole">
            ${parametresEcole?.adresse || ''}<br>
            Tél: ${parametresEcole?.telephone || ''} - Email: ${parametresEcole?.email || ''}
          </p>
          
          <h2 class="titre-emploi">${titre}</h2>
          
          <div class="info-impression">
            <span>Semaine du ${formaterDate(getDateSemaine())}</span>
            <span class="annee-scolaire">Année scolaire: ${parametresEcole?.annee_scolaire || '2024-2025'}</span>
            <span>Imprimé le ${dateImpression} à ${heureImpression}</span>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Heures</th>
              ${joursSemaine.map(jour => `<th>${jour}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${heures.map((heure, index) => `
              <tr>
                <td class="cellule-heure">${heure}</td>
                ${joursSemaine.map(jour => {
                  const creneauxJour = creneauxParJour[jour] || [];
                  const creneauxACetteHeure = creneauxJour.filter(c => {
                    const heureDebut = formaterHeure(c.heure_debut);
                    const heureFin = formaterHeure(c.heure_fin);
                    return heureDebut <= heure && heureFin > heure;
                  });
                  
                  return `
                    <td>
                      ${creneauxACetteHeure.map(creneau => `
                        <div class="creneau-impression creneau-${creneau.type_creneau}">
                          <div class="titre-creneau-impression">
                            ${creneau.type_creneau === 'cours' ? 
                              creneau.nom_cours || creneau.code_cours :
                              creneau.description || creneau.type_creneau
                            }
                          </div>
                          <div class="details-creneau-impression">
                            ${filtreActif === 'classes' ? 
                              (creneau.professeur_nom || getNomProfesseur(creneau.professeur_id)) :
                              (creneau.classe_nom || getNomClasse(creneau.classe_id))
                            }
                            ${creneau.salle ? ` • ${creneau.salle}` : ''}
                          </div>
                          <div class="horaire-creneau-impression">
                            ${formaterHeure(creneau.heure_debut)} - ${formaterHeure(creneau.heure_fin)}
                          </div>
                        </div>
                      `).join('')}
                    </td>
                  `;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="legende">
          <div class="legende-item">
            <div class="couleur-legende" style="background-color: ${couleursTypes.cours}"></div>
            <span>Cours</span>
          </div>
          <div class="legende-item">
            <div class="couleur-legende" style="background-color: ${couleursTypes.pause}"></div>
            <span>Pause</span>
          </div>
          <div class="legende-item">
            <div class="couleur-legende" style="background-color: ${couleursTypes.activite}"></div>
            <span>Activité</span>
          </div>
          <div class="legende-item">
            <div class="couleur-legende" style="background-color: ${couleursTypes.reunion}"></div>
            <span>Réunion</span>
          </div>
        </div>
        
        <div class="pied-impression">
          <p>${parametresEcole?.slogan || 'Document généré automatiquement'}</p>
          <p>Document officiel - ${parametresEcole?.nom_ecole || ''}</p>
        </div>
      </body>
      </html>
    `;
  };

// Remplacer la fonction exporterExcel par celle-ci
const exporterExcel = async () => {
  if (!classeSelectionnee && !professeurSelectionne) {
    setAlerte({ type: 'warning', message: 'Veuillez sélectionner une classe ou un professeur' });
    return;
  }

  try {
    setChargement(true);
    setAlerte({ type: 'info', message: 'Génération du fichier Excel...' });

    // Récupérer les créneaux selon le filtre
    const creneaux = filtreActif === 'classes'
      ? getCreneauxParClasse(classeSelectionnee || 0)
      : getCreneauxParProfesseur(professeurSelectionne || 0);

    if (creneaux.length === 0) {
      setAlerte({ type: 'warning', message: 'Aucun créneau à exporter' });
      setChargement(false);
      return;
    }

    // Ordre des jours de la semaine
    const ordreJours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

    // Trier les créneaux par jour et par heure
    const creneauxTries = [...creneaux].sort((a, b) => {
      const indexA = ordreJours.indexOf(a.jour_semaine);
      const indexB = ordreJours.indexOf(b.jour_semaine);
      if (indexA !== indexB) return indexA - indexB;
      return a.heure_debut.localeCompare(b.heure_debut);
    });

    // Préparer les données pour Excel
    const donneesExcel = [];
    
    // En-tête avec informations de l'école
    donneesExcel.push([parametresEcole?.nom_ecole || 'Établissement Scolaire']);
    donneesExcel.push([parametresEcole?.adresse || '']);
    donneesExcel.push([`Tél: ${parametresEcole?.telephone || ''} - Email: ${parametresEcole?.email || ''}`]);
    donneesExcel.push([]); // Ligne vide
    
    // Titre de l'emploi du temps
    const titre = filtreActif === 'classes' 
      ? `EMPLOI DU TEMPS - ${getNomClasse(classeSelectionnee || 0)}`
      : `EMPLOI DU TEMPS - ${getNomProfesseur(professeurSelectionne || 0)}`;
    donneesExcel.push([titre]);
    donneesExcel.push([]); // Ligne vide
    
    // Informations générales
    donneesExcel.push(['Année scolaire:', parametresEcole?.annee_scolaire || '2024-2025']);
    donneesExcel.push(['Semaine du:', formaterDate(getDateSemaine())]);
    donneesExcel.push(['Date d\'export:', formaterDate(new Date())]);
    donneesExcel.push([]); // Ligne vide
    donneesExcel.push([]); // Ligne vide
    
    // En-têtes des colonnes
    donneesExcel.push([
      'Jour',
      'Heure début',
      'Heure fin',
      'Cours/Activité',
      filtreActif === 'classes' ? 'Professeur' : 'Classe',
      'Salle',
      'Type',
      'Description'
    ]);
    
    // Données
    creneauxTries.forEach(creneau => {
      donneesExcel.push([
        creneau.jour_semaine,
        formaterHeure(creneau.heure_debut),
        formaterHeure(creneau.heure_fin),
        creneau.type_creneau === 'cours' 
          ? (creneau.nom_cours || creneau.code_cours)
          : (creneau.type_creneau.charAt(0).toUpperCase() + creneau.type_creneau.slice(1)),
        filtreActif === 'classes'
          ? (creneau.professeur_nom || getNomProfesseur(creneau.professeur_id))
          : (creneau.classe_nom || getNomClasse(creneau.classe_id)),
        creneau.salle || '-',
        creneau.type_creneau,
        creneau.description || ''
      ]);
    });

    // Ajouter une ligne de total
    donneesExcel.push([]);
    donneesExcel.push(['Total créneaux:', creneauxTries.length.toString()]);

    // Créer le workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(donneesExcel);

    // Ajuster la largeur des colonnes
    const colWidths = [
      { wch: 15 }, // Jour
      { wch: 12 }, // Heure début
      { wch: 12 }, // Heure fin
      { wch: 40 }, // Cours/Activité
      { wch: 30 }, // Professeur/Classe
      { wch: 15 }, // Salle
      { wch: 12 }, // Type
      { wch: 50 }  // Description
    ];
    ws['!cols'] = colWidths;

    // Style pour l'en-tête (optionnel - peut être ajouté avec des bibliothèques plus avancées)
    // Pour l'instant, on se contente des données brutes

    // Nom de la feuille
    const nomFeuille = filtreActif === 'classes'
      ? getNomClasse(classeSelectionnee || 0).substring(0, 25) // Limiter à 25 caractères
      : getNomProfesseur(professeurSelectionne || 0).substring(0, 25);
    
    XLSX.utils.book_append_sheet(wb, ws, nomFeuille.replace(/[\[\]:*?\/\\]/g, '_')); // Caractères interdits dans les noms de feuilles

    // Générer le nom du fichier
    const nomFichierBase = filtreActif === 'classes' 
      ? `Emploi_du_temps_${getNomClasse(classeSelectionnee || 0).replace(/\s+/g, '_')}` 
      : `Emploi_du_temps_${getNomProfesseur(professeurSelectionne || 0).replace(/\s+/g, '_')}`;
    
    // Nettoyer le nom de fichier (enlever les caractères spéciaux)
    const nomFichierPropre = nomFichierBase.replace(/[<>:"\/\\|?*]/g, '');
    const dateStr = formaterDate(new Date()).replace(/\//g, '-');
    const nomFichier = `${nomFichierPropre}_${dateStr}.xlsx`;

    // Sauvegarder le fichier
    XLSX.writeFile(wb, nomFichier);

    setAlerte({ 
      type: 'success', 
      message: `Export Excel réussi : ${creneauxTries.length} créneaux exportés` 
    });

  } catch (error: any) {
    console.error('❌ Erreur export Excel:', error);
    setAlerte({ 
      type: 'error', 
      message: error.message || 'Erreur lors de l\'export Excel' 
    });
  } finally {
    setChargement(false);
  }
};

  const ouvrirModalCreationCreneau = () => {
    setFormData({
      code_cours: '',
      classe_id: classeSelectionnee || classes.length > 0 ? classes[0].id : 0,
      professeur_id: professeurSelectionne || professeurs.length > 0 ? professeurs[0].id : 0,
      jour_semaine: 'Lundi',
      heure_debut: '08:00',
      heure_fin: '09:00',
      salle: '',
      type_creneau: 'cours',
      description: '',
      couleur: couleursTypes.cours
    });
    setCreneauEnEdition(null);
    setAfficherFormCreneau(true);
  };

  const ouvrirModalEditionCreneau = (creneau: EmploiDuTempsCreneau) => {
    setFormData({
      code_cours: creneau.code_cours || '',
      classe_id: creneau.classe_id,
      professeur_id: creneau.professeur_id,
      jour_semaine: creneau.jour_semaine,
      heure_debut: formaterHeure(creneau.heure_debut),
      heure_fin: formaterHeure(creneau.heure_fin),
      salle: creneau.salle,
      type_creneau: creneau.type_creneau,
      description: creneau.description || '',
      couleur: creneau.couleur
    });
    setCreneauEnEdition(creneau);
    setAfficherFormCreneau(true);
  };

  const fermerModal = () => {
    setAfficherFormCreneau(false);
  };

  const gererChangementForm = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'classe_id' || name === 'professeur_id' ? parseInt(value) : value
    }));
  };

  const validerFormulaire = (): boolean => {
    const erreurs: string[] = [];
    
    if (formData.type_creneau === 'cours' && !formData.code_cours.trim()) {
      erreurs.push('Le code du cours est requis pour un cours');
    }
    
    if (formData.classe_id === 0) {
      erreurs.push('Veuillez sélectionner une classe');
    }
    
    if (formData.professeur_id === 0) {
      erreurs.push('Veuillez sélectionner un professeur');
    }
    
    const heureRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    let heureDebut = formData.heure_debut;
    let heureFin = formData.heure_fin;
    
    if (!heureRegex.test(heureDebut)) {
      if (heureDebut.includes(':')) {
        const parts = heureDebut.split(':');
        if (parts.length >= 2) {
          heureDebut = `${parts[0].padStart(2, '0')}:${parts[1]}`;
          formData.heure_debut = heureDebut;
        }
      } else {
        erreurs.push("Le format d'heure de début est invalide (format attendu: HH:MM)");
      }
    }
    
    if (!heureRegex.test(heureFin)) {
      if (heureFin.includes(':')) {
        const parts = heureFin.split(':');
        if (parts.length >= 2) {
          heureFin = `${parts[0].padStart(2, '0')}:${parts[1]}`;
          formData.heure_fin = heureFin;
        }
      } else {
        erreurs.push("Le format d'heure de fin est invalide (format attendu: HH:MM)");
      }
    }
    
    if (heureDebut >= heureFin && erreurs.length === 0) {
      erreurs.push("L'heure de début doit être avant l'heure de fin");
    }
    
    if (erreurs.length > 0) {
      setAlerte({ type: 'error', message: erreurs.join('\n') });
      return false;
    }
    
    return true;
  };

  const sauvegarderCreneau = async () => {
    if (!validerFormulaire()) return;

    try {
      const method = creneauEnEdition ? 'PUT' : 'POST';
      const url = '/api/emploi-du-temps';
      
      const dataAEnvoyer = creneauEnEdition 
        ? { ...formData, id: creneauEnEdition.id }
        : formData;
      
      console.log('📤 Envoi créneau:', { method, url, data: dataAEnvoyer });
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataAEnvoyer)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAlerte({ 
          type: 'success', 
          message: creneauEnEdition 
            ? 'Créneau modifié avec succès' 
            : 'Créneau ajouté avec succès' 
        });
        
        await chargerEmploiDuTemps();
        fermerModal();
      } else {
        setAlerte({ type: 'error', message: data.error || 'Erreur lors de la sauvegarde' });
      }
    } catch (error: any) {
      console.error('Erreur sauvegarde créneau:', error);
      setAlerte({ type: 'error', message: 'Erreur lors de la sauvegarde' });
    }
  };

  const supprimerCreneau = async (creneau: EmploiDuTempsCreneau) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce créneau ?')) return;

    try {
      const response = await fetch('/api/emploi-du-temps', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: creneau.id })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAlerte({ type: 'success', message: 'Créneau supprimé avec succès' });
        await chargerEmploiDuTemps();
      } else {
        setAlerte({ type: 'error', message: data.error || 'Erreur lors de la suppression' });
      }
    } catch (error) {
      console.error('Erreur suppression créneau:', error);
      setAlerte({ type: 'error', message: 'Erreur lors de la suppression' });
    }
  };

  // ==================== FONCTIONS D'EXPORT ====================

  const exporterPDF = () => {
    if (!classeSelectionnee && !professeurSelectionne) {
      setAlerte({ type: 'warning', message: 'Veuillez sélectionner une classe ou un professeur' });
      return;
    }
    
    const element = document.createElement('a');
    const titre = filtreActif === 'classes' 
      ? `Emploi_du_temps_${getNomClasse(classeSelectionnee || 0)}` 
      : `Emploi_du_temps_${getNomProfesseur(professeurSelectionne || 0)}`;
    
    element.href = `/api/emploi-du-temps/export?format=pdf&${filtreActif === 'classes' ? 'classe_id' : 'professeur_id'}=${filtreActif === 'classes' ? classeSelectionnee : professeurSelectionne}`;
    element.download = `${titre}_${formaterDate(new Date())}.pdf`;
    element.click();
    
    setAlerte({ type: 'success', message: 'Export PDF en cours...' });
  };

  // ==================== FONCTIONS D'AFFICHAGE ====================

  const afficherParClasse = () => {
    setFiltreActif('classes');
    setClasseSelectionnee(null);
    setProfesseurSelectionne(null);
  };

  const afficherParProfesseur = () => {
    setFiltreActif('professeurs');
    setClasseSelectionnee(null);
    setProfesseurSelectionne(null);
  };

  const getNomClasse = (classeId: number) => {
    const classe = classes.find(c => c.id === classeId);
    return classe ? `${classe.niveau} ${classe.nom}` : 'Classe inconnue';
  };

  const getNomProfesseur = (professeurId: number) => {
    const professeur = professeurs.find(p => p.id === professeurId);
    return professeur ? `${professeur.prenom} ${professeur.nom}` : 'Professeur inconnu';
  };

const getCreneauxParClasse = (classeId: number | null) => {
  if (!classeId) return [];
  
  return emploiDuTemps
    .filter(c => c.classe_id === classeId)
    .sort((a, b) => {
      // Trier d'abord par jour selon l'ordre défini
      const jourA = indexJours[a.jour_semaine] ?? 0;
      const jourB = indexJours[b.jour_semaine] ?? 0;
      if (jourA !== jourB) return jourA - jourB;
      
      // Ensuite par heure de début
      return a.heure_debut.localeCompare(b.heure_debut);
    });
};

const getCreneauxParProfesseur = (professeurId: number | null) => {
  if (!professeurId) return [];
  
  return emploiDuTemps
    .filter(c => c.professeur_id === professeurId)
    .sort((a, b) => {
      // Trier d'abord par jour selon l'ordre défini
      const jourA = indexJours[a.jour_semaine] ?? 0;
      const jourB = indexJours[b.jour_semaine] ?? 0;
      if (jourA !== jourB) return jourA - jourB;
      
      // Ensuite par heure de début
      return a.heure_debut.localeCompare(b.heure_debut);
    });
};

  const getHeurePosition = (heure: string) => {
    // Normaliser l'heure au format HH:MM
    const heureNormalisee = formaterHeure(heure);
    const index = heures.findIndex(h => h === heureNormalisee);
    return index !== -1 ? index : 0;
  };

  const getDureeCreneau = (heureDebut: string, heureFin: string) => {
    const debut = formaterHeure(heureDebut);
    const fin = formaterHeure(heureFin);
    
    const [h1, m1] = debut.split(':').map(Number);
    const [h2, m2] = fin.split(':').map(Number);
    
    // Calculer la durée en heures (en tenant compte des minutes)
    const duree = (h2 - h1) + (m2 - m1) / 60;
    return Math.max(duree, 0.5); // Minimum 30 minutes
  };

  const getDateSemaine = () => {
  let maintenant = new Date(); // Changé de const à let
  
  // Ajuster en fonction du fuseau horaire
  if (parametresApp?.fuseau_horaire) {
    try {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: parametresApp.fuseau_horaire,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      };
      const formatter = new Intl.DateTimeFormat('fr-FR', options);
      const parts = formatter.formatToParts(maintenant);
      const day = parts.find(p => p.type === 'day')?.value;
      const month = parts.find(p => p.type === 'month')?.value;
      const year = parts.find(p => p.type === 'year')?.value;
      
      if (day && month && year) {
        maintenant = new Date(`${year}-${month}-${day}`); // Maintenant c'est possible avec let
      }
    } catch (error) {
      console.error('Erreur fuseau horaire:', error);
    }
  }
  
  const debutSemaine = new Date(maintenant);
  debutSemaine.setDate(maintenant.getDate() - maintenant.getDay() + 1 + (semaineSelectionnee * 7));
  return debutSemaine;
};

  if (chargement) {
    return (
      <div className="chargement-emploi-temps">
        <div className="spinner-grand"></div>
        <p>Chargement de l'emploi du temps...</p>
      </div>
    );
  }

  return (
    <div className={`conteneur-gestion-emploi-temps ${parametresApp?.theme_defaut || 'clair'}`}>
      {/* En-tête avec les infos de l'école */}

    <div className="en-tete-fixe-eleves">
        <div className="conteneur-en-tete-fixe-eleves">
          <div className="titre-fixe-eleves">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>📅</span> 
              <h1>
                Emploi du temps
              </h1>
            </div>
          </div>

          <div className="actions-fixes-eleves">
             <div className="actions-synchronisation">
            <button 
              className="bouton-sync"
              onClick={synchroniserEnMasse}
              title="Synchroniser tous les cours avec l'emploi du temps"
              disabled={chargement}
            >
              {chargement ? (
                <>
                  <span className="spinner-mini"></span>
                  Synchronisation...
                </>
              ) : (
                <>
                  <span className="icone-sync">🔄</span>
                  Sync Tous les Cours
                </>
              )}
            </button>
            
            <button 
              className="bouton-verifier-sync"
              onClick={async () => {
                const count = await verifierCoursNonSync();
                if (count > 0) {
                  setAlerte({ 
                    type: 'info', 
                    message: `${count} cours ne sont pas dans l'emploi du temps` 
                  });
                } else {
                  setAlerte({ 
                    type: 'success', 
                    message: 'Tous les cours sont synchronisés !' 
                  });
                }
              }}
              title="Vérifier les cours non synchronisés"
            >
              <span className="icone-verifier">🔍</span>
              Vérifier Sync
            </button>
          </div>

          <div className="boutons-export">
          <button className="bouton-export pdf" onClick={imprimerEmploiDuTemps}>
            <span className="icone-export">🖨️</span>
            Imprimer
          </button>
          <button className="bouton-export excel" onClick={exporterExcel}>
            <span className="icone-export">📊</span>
            Excel
          </button>
        </div>
          </div>
        </div>
      </div>

      {/* Alertes */}
      {alerte && (
        <div className={`alerte-emploi-temps alerte-${alerte.type}`}>
          <div className="contenu-alerte-emploi-temps">
            <span className="icone-alerte">
              {alerte.type === 'success' && '✅'}
              {alerte.type === 'error' && '❌'}
              {alerte.type === 'info' && 'ℹ️'}
              {alerte.type === 'warning' && '⚠️'}
            </span>
            <span className="texte-alerte">{alerte.message}</span>
            <button 
              className="bouton-fermer-alerte"
              onClick={() => setAlerte(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Navigation par filtres */}
      <div className="navigation-filtres">
        <div className="boutons-filtres">
          <button 
            className={`bouton-filtre ${filtreActif === 'classes' ? 'actif' : ''}`}
            onClick={afficherParClasse}
          >
            <span className="icone-filtre">🏫</span>
            Par Classe
          </button>
          <button 
            className={`bouton-filtre ${filtreActif === 'professeurs' ? 'actif' : ''}`}
            onClick={afficherParProfesseur}
          >
            <span className="icone-filtre">👨‍🏫</span>
            Par Professeur
          </button>
        </div>
        
        <div className="controles-semaine">
          <button 
            className="bouton-semaine"
            onClick={() => setSemaineSelectionnee(prev => prev - 1)}
            title='Précédent'
          >
            ◀
          </button>
          <span className="affichage-semaine">
            Semaine du {formaterDate(getDateSemaine())}
          </span>
          <button 
            className="bouton-semaine"
            onClick={() => setSemaineSelectionnee(prev => prev + 1)}
            title='Suivant'
          >
           ▶
          </button>
        </div>
      </div>

      {/* Contenu principal (inchangé dans la structure) */}
      <div className="contenu-principal-emploi-temps">
        {filtreActif === 'classes' ? (
          <div className="vue-classes">
            <div className="liste-classes">
              <h3>Sélectionnez une classe</h3>
              <div className="cartes-classes">
                {classes.map(classe => {
                  const creneauxClasse = getCreneauxParClasse(classe.id);
                  return (
                    <div 
                      key={classe.id}
                      className={`carte-classe ${classeSelectionnee === classe.id ? 'selectionnee' : ''}`}
                      onClick={() => setClasseSelectionnee(classe.id)}
                    >
                      <div className="en-tete-carte-classe">
                        <span className="icone-classe">🏫</span>
                        <span className="badge-nombre">
                          {creneauxClasse.length} créneaux
                        </span>
                      </div>
                      <p className="niveau-classe">{classe.niveau} {classe.nom}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="emploi-classe">
              {classeSelectionnee ? (
                <>
                  <div className="en-tete-emploi-classe">
                    <h2>Emploi du temps - {getNomClasse(classeSelectionnee)}</h2>
                    <div className="statistiques-classe">
                      <span className="statistique">
                        <span className="valeur-stat">
                          {getCreneauxParClasse(classeSelectionnee).length}
                        </span>
                        <span className="label-stat">cours</span>
                      </span>
                      <span className="statistique">
                        <span className="valeur-stat">
                          {new Set(getCreneauxParClasse(classeSelectionnee).map(c => c.professeur_id)).size}
                        </span>
                        <span className="label-stat">professeurs</span>
                      </span>
                      <span className="statistique">
                        <span className="valeur-stat">
                          {new Set(getCreneauxParClasse(classeSelectionnee).map(c => c.salle)).size}
                        </span>
                        <span className="label-stat">salles</span>
                      </span>
                    </div>
                  </div>

{chargementEmploi ? (
  <div className="chargement-tableau">
    <div className="spinner"></div>
    <p>Chargement de l'emploi du temps...</p>
  </div>
) : (
  <div className="tableau-emploi-temps">
    {/* En-tête du tableau avec les jours */}
    <div className="en-tete-tableau-emploi">
      <div className="cellule-heure"></div>
      {joursSemaine.map(jour => (
        <div key={jour} className="cellule-jour">
          {jour}
        </div>
      ))}
    </div>
    
    {/* Lignes horaires */}
    {heures.map(heure => (
      <div key={heure} className="ligne-heure">
        <div className="cellule-heure">
          {heure}
        </div>
        
        {/* Cellules pour chaque jour */}
        {joursSemaine.map(jour => {
          // Filtrer les créneaux pour ce jour et cette heure
          const creneaux = getCreneauxParClasse(classeSelectionnee)
            .filter(c => c.jour_semaine === jour)
            .filter(c => {
              const heureDebut = formaterHeure(c.heure_debut);
              const heureFin = formaterHeure(c.heure_fin);
              return heureDebut <= heure && heureFin > heure;
            });
          
          return (
            <div key={jour} className="cellule-creneau">
              {creneaux.map(creneau => {
                const duree = getDureeCreneau(creneau.heure_debut, creneau.heure_fin);
                
                return (
                  <div 
                    key={creneau.id}
                    className="creneau"
                    style={{
                      backgroundColor: creneau.couleur,
                      height: `${duree * 60}px`
                    }}
                    onClick={() => ouvrirModalEditionCreneau(creneau)}
                    title="Cliquer pour modifier"
                  >
                    <div className="contenu-creneau-simple">
                      <div className="matiere-nom">
                        {creneau.nom_cours || creneau.description || 'Cours'}
                      </div>
                      <div className="horaire-simple">
                        {formaterHeure(creneau.heure_debut)} - {formaterHeure(creneau.heure_fin)}
                      </div>
                    </div>
                    
                    <div className="actions-creneau">
                      <button 
                        className="bouton-supprimer-creneau"
                        onClick={(e) => {
                          e.stopPropagation();
                          supprimerCreneau(creneau);
                        }}
                        title="Supprimer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    ))}
  </div>
)}
                </>
              ) : (
                <div className="aucune-classe-selectionnee">
                  <div className="icone-aucune-classe">👆</div>
                  <h3>Sélectionnez une classe pour voir son emploi du temps</h3>
                  <p>Choisissez une classe dans la liste pour afficher son emploi du temps hebdomadaire</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="vue-professeurs">
            <div className="liste-professeurs">
              <h3>Professeurs</h3>
              <div className="cartes-professeurs">
                {professeurs.map(professeur => {
                  const creneauxProf = getCreneauxParProfesseur(professeur.id);
                  return (
                    <div 
                      key={professeur.id}
                      className={`carte-professeur ${professeurSelectionne === professeur.id ? 'selectionnee' : ''}`}
                      onClick={() => setProfesseurSelectionne(professeur.id)}
                    >
                      <div className="en-tete-carte-professeur">
                        <div className="avatar-professeur">
                          <span className="initiale-professeur">
                            {professeur.prenom[0]}{professeur.nom[0]}
                          </span>
                        </div>
                        <span className="badge-nombre">
                          {creneauxProf.length} cours
                        </span>
                      </div>
                      <h4 className="nom-professeur">{professeur.prenom} {professeur.nom}</h4>
                      <p className="specialite-professeur">{professeur.specialite || 'Sans spécialité'}</p>
                      <p className="email-professeur">{professeur.email}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="emploi-professeur">
              {professeurSelectionne ? (
                <>
                  <div className="en-tete-emploi-professeur">
                    <h2>Emploi du temps - {getNomProfesseur(professeurSelectionne)}</h2>
                    <div className="statistiques-professeur">
                      <span className="statistique">
                        <span className="valeur-stat">
                          {getCreneauxParProfesseur(professeurSelectionne).length}
                        </span>
                        <span className="label-stat">cours</span>
                      </span>
                      <span className="statistique">
                        <span className="valeur-stat">
                          {new Set(getCreneauxParProfesseur(professeurSelectionne).map(c => c.classe_id)).size}
                        </span>
                        <span className="label-stat">classes</span>
                      </span>
                      <span className="statistique">
                        <span className="valeur-stat">
                          {new Set(getCreneauxParProfesseur(professeurSelectionne).map(c => c.salle)).size}
                        </span>
                        <span className="label-stat">salles</span>
                      </span>
                    </div>
                  </div>
                  
                 {chargementEmploi ? (
  <div className="chargement-tableau">
    <div className="spinner"></div>
    <p>Chargement de l'emploi du temps...</p>
  </div>
) : (
  <div className="tableau-emploi-temps">
    {/* En-tête du tableau avec les jours */}
    <div className="en-tete-tableau-emploi">
      <div className="cellule-heure"></div>
      {joursSemaine.map(jour => (
        <div key={jour} className="cellule-jour">
          {jour}
        </div>
      ))}
    </div>
    
    {/* Lignes horaires */}
    {heures.map(heure => (
      <div key={heure} className="ligne-heure">
        <div className="cellule-heure">
          {heure}
        </div>
        
        {/* Cellules pour chaque jour */}
        {joursSemaine.map(jour => {
          // Filtrer les créneaux pour ce jour et cette heure
          const creneaux = getCreneauxParProfesseur(professeurSelectionne)
            .filter(c => c.jour_semaine === jour)
            .filter(c => {
              const heureDebut = formaterHeure(c.heure_debut);
              const heureFin = formaterHeure(c.heure_fin);
              return heureDebut <= heure && heureFin > heure;
            });
          
          return (
            <div key={jour} className="cellule-creneau">
              {creneaux.map(creneau => {
                const duree = getDureeCreneau(creneau.heure_debut, creneau.heure_fin);
                
                return (
                  <div 
                    key={creneau.id}
                    className="creneau"
                    style={{
                      backgroundColor: creneau.couleur,
                      height: `${duree * 60}px`
                    }}
                    onClick={() => ouvrirModalEditionCreneau(creneau)}
                    title="Cliquer pour modifier"
                  >
                    <div className="contenu-creneau-simple">
                      <div className="matiere-nom">
                        {creneau.nom_cours || creneau.description || 'Cours'}
                      </div>
                      <div className="horaire-simple">
                        {formaterHeure(creneau.heure_debut)} - {formaterHeure(creneau.heure_fin)}
                      </div>
                    </div>
                    
                    <div className="actions-creneau">
                      <button 
                        className="bouton-supprimer-creneau"
                        onClick={(e) => {
                          e.stopPropagation();
                          supprimerCreneau(creneau);
                        }}
                        title="Supprimer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    ))}
  </div>
)}
                </>
              ) : (
                <div className="aucune-professeur-selectionne">
                  <div className="icone-aucune-professeur">👆</div>
                  <h3>Sélectionnez un professeur pour voir son emploi du temps</h3>
                  <p>Choisissez un professeur dans la liste pour afficher son emploi du temps hebdomadaire</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de création/édition de créneau */}
      {afficherFormCreneau && (
        <div className="modal-overlay">
          <div className="modal-creneau">
            <div className="en-tete-modal-creneau">
              <h2>{creneauEnEdition ? 'Modifier le créneau' : 'Nouveau créneau'}</h2>
              <button className="bouton-fermer-modal" onClick={fermerModal}>✕</button>
            </div>
            
            <div className="contenu-modal-creneau">
              <div className="formulaire-creneau">
                <div className="groupe-champ-creneau">
                  <label className="label-champ-creneau">Type de créneau *</label>
                  <select
                    name="type_creneau"
                    value={formData.type_creneau}
                    onChange={gererChangementForm}
                    className="champ-creneau"
                  >
                    <option value="cours">Cours</option>
                    <option value="pause">Pause</option>
                    <option value="activite">Activité</option>
                    <option value="reunion">Réunion</option>
                  </select>
                </div>
                
                {formData.type_creneau === 'cours' && (
                  <div className="section-cours-disponibles">
                    <h4>Cours disponibles</h4>
                    <div className="liste-cours-sync">
                      {cours
                        .filter((c: Cours) => 
                          (!formData.classe_id || c.classe_id === formData.classe_id) &&
                          (!formData.professeur_id || c.professeur_id === formData.professeur_id)
                        )
                        .map((c: Cours) => (
                          <div key={c.code_cours} className={`cours-item ${c.estDansEmploi ? 'dans-emploi' : ''}`}>
                            <div className="info-cours">
                              <strong>{c.nom_cours}</strong>
                              <small>{c.code_cours} • {c.jour_semaine} {c.heure_debut}-{c.heure_fin}</small>
                            </div>
                            <div className="actions-cours">
                              {c.estDansEmploi ? (
                                <button 
                                  className="bouton-retirer"
                                  onClick={() => retirerCoursDeEmploi(c.code_cours)}
                                  title="Retirer de l'emploi du temps"
                                >
                                  ✕
                                </button>
                              ) : (
                                <button 
                                  className="bouton-ajouter"
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      code_cours: c.code_cours,
                                      classe_id: c.classe_id,
                                      professeur_id: c.professeur_id,
                                      jour_semaine: c.jour_semaine,
                                      heure_debut: formaterHeure(c.heure_debut),
                                      heure_fin: formaterHeure(c.heure_fin),
                                      salle: c.salle,
                                      couleur: c.couleur,
                                      description: c.nom_cours
                                    });
                                  }}
                                  title="Utiliser ce cours"
                                >
                                  ✓
                                </button>
                              )}
                              <button 
                                className="bouton-verifier"
                                onClick={() => verifierSynchronisation(c.code_cours)}
                                title="Vérifier synchronisation"
                              >
                                🔍
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                
                <div className="groupe-champ-creneau double">
                  <div className="sous-groupe">
                    <label className="label-champ-creneau">Classe *</label>
                    <select
                      name="classe_id"
                      value={formData.classe_id}
                      onChange={gererChangementForm}
                      className="champ-creneau"
                      required
                    >
                      <option value="0">Sélectionnez une classe</option>
                      {classes.map(classe => (
                        <option key={classe.id} value={classe.id}>
                          {classe.niveau} {classe.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="sous-groupe">
                    <label className="label-champ-creneau">Professeur *</label>
                    <select
                      name="professeur_id"
                      value={formData.professeur_id}
                      onChange={gererChangementForm}
                      className="champ-creneau"
                      required
                    >
                      <option value="0">Sélectionnez un professeur</option>
                      {professeurs.map(prof => (
                        <option key={prof.id} value={prof.id}>
                          {prof.prenom} {prof.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="groupe-champ-creneau triple">
                  <div className="sous-groupe">
                    <label className="label-champ-creneau">Jour</label>
                    <select
                    name="jour_semaine"
                    value={formData.jour_semaine}
                    onChange={gererChangementForm}
                    className="champ-creneau"
                  >
                    {joursSemaine.map(jour => ( 
                      <option key={jour} value={jour}>{jour}</option>
                    ))}
                  </select>
                  </div>
                  
                  <div className="sous-groupe">
                    <label className="label-champ-creneau">Heure début</label>
                    <input
                      type="time"
                      name="heure_debut"
                      value={formData.heure_debut}
                      onChange={gererChangementForm}
                      className="champ-creneau"
                    />
                  </div>
                  
                  <div className="sous-groupe">
                    <label className="label-champ-creneau">Heure fin</label>
                    <input
                      type="time"
                      name="heure_fin"
                      value={formData.heure_fin}
                      onChange={gererChangementForm}
                      className="champ-creneau"
                    />
                  </div>
                </div>
                
                <div className="groupe-champ-creneau">
                  <label className="label-champ-creneau">Salle</label>
                  <input
                    type="text"
                    name="salle"
                    value={formData.salle}
                    onChange={gererChangementForm}
                    className="champ-creneau"
                    placeholder="Ex: Salle 101"
                  />
                </div>
                
                <div className="groupe-champ-creneau">
                  <label className="label-champ-creneau">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={gererChangementForm}
                    className="champ-creneau champ-textarea"
                    placeholder="Description du créneau..."
                    rows={3}
                  />
                </div>
                
                <div className="groupe-champ-creneau">
                  <label className="label-champ-creneau">Couleur</label>
                  <div className="selecteur-couleur-creneau">
                    {Object.entries(couleursTypes).map(([type, couleur]) => (
                      <button
                        key={type}
                        type="button"
                        className={`cercle-couleur ${formData.couleur === couleur ? 'selectionnee' : ''}`}
                        style={{ backgroundColor: couleur }}
                        onClick={() => setFormData(prev => ({ ...prev, couleur }))}
                        title={type}
                      />
                    ))}
                    <input
                      type="color"
                      value={formData.couleur}
                      onChange={(e) => setFormData(prev => ({ ...prev, couleur: e.target.value }))}
                      className="selecteur-couleur-input"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pied-modal-creneau">
              <button className="bouton-annuler-creneau" onClick={fermerModal}>
                Annuler
              </button>
              <button className="bouton-sauvegarder-creneau" onClick={sauvegarderCreneau}>
                {creneauEnEdition ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}