// components/ModalRelevesGeneres.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, Eye, Mail, Filter, Search, Calendar, 
  BookOpen, X, RefreshCw, FileText, Printer, Loader2,
  MessageCircle, CheckSquare, Square 
} from 'lucide-react';

interface EleveInfo {
  id: number;
  nom: string;
  prenom: string;
  telephone_parent: string;
  email_parents: string;
  matricule?: string;
}

interface ParametresEcole {
  nom_ecole: string;
  adresse: string;
  telephone: string;
  email: string;
  logo_url: string;
  couleur_principale: string;
}

interface NoteDetail {
  note: number;
  type: string;
  note_sur?: number;
}

interface MatiereReleve {
  matiere_id: number;
  matiere_nom: string;
  moyenne_matiere: number;
  notes?: NoteDetail[];
  coefficient?: number;
}

interface RelevePrimaire {
  id: number;
  eleve_id: number;
  matricule: string;
  eleve_nom: string;
  eleve_prenom: string;
  classe_id: number;
  classe_nom: string;
  periode_id: number;
  periode_nom: string;
  moyennes_par_matiere: any;
  moyenne_generale: number;
  rang: number;
  mention: string;
  appreciation_generale: string;
  date_generation: string;
  statut: string;
  email_envoye: boolean;
}

interface MatiereNote {
  matiere_id: number;
  matiere_nom: string;
  coefficient: number;
  note: number;
  note_sur: number;
  appreciation: string;
  note_coefficientee?: number;
}

interface ModalRelevesGeneresProps {
  isOpen: boolean;
  onClose: () => void;
  compositionId?: number | null;  // AJOUT DE LA PROP OPTIONNELLE
}

interface RelevePrimaireAvecMatiere extends RelevePrimaire {
  matieres_parsed?: MatiereNote[];
}

export default function ModalRelevesGeneres({
  isOpen,
  onClose,
  compositionId  // AJOUT DU PARAMÈTRE
}: ModalRelevesGeneresProps) {
  const [releves, setReleves] = useState<RelevePrimaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClasse, setSelectedClasse] = useState<string>('toutes');
  const [selectedPeriode, setSelectedPeriode] = useState<string>('toutes');
  const [showReleveDetail, setShowReleveDetail] = useState(false);
  const [selectedReleve, setSelectedReleve] = useState<RelevePrimaireAvecMatiere | null>(null);
  const [exporting, setExporting] = useState(false);  
  const [classes, setClasses] = useState<string[]>([]);
  const [periodes, setPeriodes] = useState<string[]>([]);
  const [printingAll, setPrintingAll] = useState(false);
  const [parametresEcole, setParametresEcole] = useState<ParametresEcole | null>(null);
  
  // ÉTAT POUR LA SÉLECTION MULTIPLE
  const [selectedReleves, setSelectedReleves] = useState<Set<number>>(new Set());
  const [envoiWhatsAppMultiple, setEnvoiWhatsAppMultiple] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [statutsEnvoi, setStatutsEnvoi] = useState<Record<number, {
    statut: 'en_attente' | 'en_cours' | 'succes' | 'echec' | 'pas_de_contact';
    message?: string;
  }>>({});

  // Récupérer tous les relevés (optionnellement filtrés par composition)
  const fetchReleves = async () => {
    try {
      setLoading(true);
      console.log('🔄 Début du chargement des relevés...');
      
      // Construire l'URL avec le compositionId si fourni
      let url = '/api/releves-primaires';
      if (compositionId) {
        url += `?composition_id=${compositionId}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.success && data.releves && Array.isArray(data.releves)) {
        console.log(`✅ ${data.releves.length} relevés reçus`);
        
        const relevesData = await Promise.all(
          data.releves.map(async (r: any) => {
            let matieresParsed: MatiereNote[] = [];
            
            if (r.moyennes_par_matiere) {
              try {
                const parsed = typeof r.moyennes_par_matiere === 'string' 
                  ? JSON.parse(r.moyennes_par_matiere)
                  : r.moyennes_par_matiere;
                
                if (Array.isArray(parsed) && parsed.length > 0) {
                  matieresParsed = parsed.map((item: any) => {
                    const note = typeof item.note === 'number' ? item.note : parseFloat(item.note || 0);
                    const coefficient = typeof item.coefficient === 'number' ? item.coefficient : parseFloat(item.coefficient || 1);
                    const noteCoefficientee = note * coefficient;
                    
                    return {
                      matiere_id: item.matiere_id || 0,
                      matiere_nom: item.matiere_nom || 'Matière inconnue',
                      coefficient: coefficient,
                      note: note,
                      note_sur: typeof item.note_sur === 'number' ? item.note_sur : parseFloat(item.note_sur || 20),
                      appreciation: item.appreciation || genererAppreciationAuto(note),
                      note_coefficientee: noteCoefficientee
                    };
                  });
                }
              } catch (error) {
                console.error(`Erreur parsing moyennes pour ${r.id}:`, error);
              }
            }
            
            if (matieresParsed.length === 0 && r.eleve_id && r.periode_id) {
              try {
                const notesResponse = await fetch(`/api/notes-primaires?eleve_id=${r.eleve_id}&periode_id=${r.periode_id}`);
                const notesData = await notesResponse.json();
                
                if (notesData.success && notesData.notes && Array.isArray(notesData.notes)) {
                  matieresParsed = notesData.notes.map((note: any) => {
                    const noteValue = parseFloat(note.note) || 0;
                    const coefficientValue = note.coefficient || 1;
                    const noteCoefficientee = noteValue * coefficientValue;
                    
                    return {
                      matiere_id: note.matiere_id || 0,
                      matiere_nom: note.matiere_nom || 'Matière inconnue',
                      coefficient: coefficientValue,
                      note: noteValue,
                      note_sur: note.note_sur || 20,
                      appreciation: note.appreciation || genererAppreciationAuto(noteValue),
                      note_coefficientee: noteCoefficientee
                    };
                  });
                }
              } catch (error) {
                console.error(`Erreur API notes pour ${r.id}:`, error);
              }
            }
            
            return {
              ...r,
              moyenne_generale: parseFloat(r.moyenne_generale) || 0,
              rang: parseInt(r.rang) || 0,
              moyennes_par_matiere: matieresParsed,
              matieres_parsed: matieresParsed
            };
          })
        );
        
        setReleves(relevesData);
        
        const uniqueClasses = Array.from(new Set(relevesData.map((r: any) => r.classe_nom).filter(Boolean)));
        const uniquePeriodes = Array.from(new Set(relevesData.map((r: any) => r.periode_nom).filter(Boolean)));
        
        setClasses(uniqueClasses as string[]);
        setPeriodes(uniquePeriodes as string[]);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les relevés
  const filteredReleves = releves.filter(releve => {
    const matchesSearch = 
      (releve.eleve_nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (releve.eleve_prenom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (releve.matricule || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClasse = selectedClasse === 'toutes' || releve.classe_nom === selectedClasse;
    const matchesPeriode = selectedPeriode === 'toutes' || releve.periode_nom === selectedPeriode;

    return matchesSearch && matchesClasse && matchesPeriode;
  });

  // Fonction robuste pour parser les moyennes
  const parseMoyennes = (data: any): MatiereNote[] => {
    console.log('🔄 Parsing moyennes, input:', data);
    console.log('📝 Type d\'input:', typeof data);
    
    if (Array.isArray(data) && data.length > 0) {
      const firstItem = data[0];
      if (firstItem && (firstItem.matiere_nom || firstItem.matiere_id)) {
        console.log('✅ Déjà un tableau formaté');
        return data.map(item => {
          const note = typeof item.note === 'number' ? item.note : parseFloat(item.note || 0);
          const coefficient = typeof item.coefficient === 'number' ? item.coefficient : parseFloat(item.coefficient || 1);
          const noteCoefficientee = note * coefficient;
          
          return {
            matiere_id: item.matiere_id || 0,
            matiere_nom: item.matiere_nom || 'Matière inconnue',
            coefficient: coefficient,
            note: note,
            note_sur: typeof item.note_sur === 'number' ? item.note_sur : parseFloat(item.note_sur || 20),
            appreciation: item.appreciation || genererAppreciationAuto(note),
            note_coefficientee: noteCoefficientee
          };
        });
      }
    }
    
    if (data === null || data === undefined) {
      console.log('⚠️ Input est null ou undefined');
      return [];
    }
    
    try {
      if (typeof data === 'string') {
        const trimmed = data.trim();
        if (!trimmed || trimmed === 'null' || trimmed === 'undefined') {
          console.log('⚠️ String vide');
          return [];
        }
        
        console.log('📝 Tentative de parsing JSON string:', trimmed.substring(0, 100) + '...');
        
        try {
          const parsed = JSON.parse(trimmed);
          console.log('✅ JSON parsé:', parsed);
          
          if (Array.isArray(parsed)) {
            return parsed.map(item => {
              const note = typeof item.note === 'number' ? item.note : parseFloat(item.note || 0);
              const coefficient = typeof item.coefficient === 'number' ? item.coefficient : parseFloat(item.coefficient || 1);
              const noteCoefficientee = note * coefficient;
              
              return {
                matiere_id: item.matiere_id || item.id || 0,
                matiere_nom: item.matiere_nom || item.nom || 'Matière inconnue',
                coefficient: coefficient,
                note: note,
                note_sur: typeof item.note_sur === 'number' ? item.note_sur : parseFloat(item.note_sur || 20),
                appreciation: item.appreciation || genererAppreciationAuto(note),
                note_coefficientee: noteCoefficientee
              };
            });
          }
          
          if (typeof parsed === 'object' && parsed !== null) {
            const entries = Object.entries(parsed);
            if (entries.length > 0) {
              return entries.map(([key, value]: [string, any]) => {
                const note = typeof value.note === 'number' ? value.note : parseFloat(value.note || 0);
                const coefficient = typeof value.coefficient === 'number' ? value.coefficient : parseFloat(value.coefficient || 1);
                const noteCoefficientee = note * coefficient;
                
                return {
                  matiere_id: value.matiere_id || parseInt(key) || 0,
                  matiere_nom: value.matiere_nom || `Matière ${key}`,
                  coefficient: coefficient,
                  note: note,
                  note_sur: typeof value.note_sur === 'number' ? value.note_sur : parseFloat(value.note_sur || 20),
                  appreciation: value.appreciation || genererAppreciationAuto(note),
                  note_coefficientee: noteCoefficientee
                };
              });
            }
          }
        } catch (parseError) {
          console.error('❌ Erreur parsing JSON:', parseError);
          
          if (trimmed.includes('[') && trimmed.includes(']')) {
            const match = trimmed.match(/\[(.*?)\]/);
            if (match) {
              const items = match[1].split('},{').map(item => {
                const obj: any = {};
                item.replace(/{|}/g, '').split(',').forEach(pair => {
                  const [key, value] = pair.split(':');
                  if (key && value) {
                    obj[key.trim()] = value.trim().replace(/"/g, '');
                  }
                });
                return obj;
              });
              
              if (items.length > 0) {
                return items.map(item => {
                  const note = parseFloat(item.note || 0);
                  const coefficient = parseFloat(item.coefficient || 1);
                  const noteCoefficientee = note * coefficient;
                  
                  return {
                    matiere_id: parseInt(item.matiere_id || item.id || 0),
                    matiere_nom: item.matiere_nom || item.nom || 'Matière inconnue',
                    coefficient: coefficient,
                    note: note,
                    note_sur: parseFloat(item.note_sur || 20),
                    appreciation: item.appreciation || genererAppreciationAuto(note),
                    note_coefficientee: noteCoefficientee
                  };
                });
              }
            }
          }
        }
      }
      
      console.log('⚠️ Format non reconnu, retour tableau vide');
      return [];
    } catch (error) {
      console.error('❌ Erreur parsing:', error);
      console.log('💾 Input qui a causé l\'erreur:', typeof data === 'string' ? data.substring(0, 200) : data);
      return [];
    }
  };

  // Fonction pour charger les paramètres
const chargerParametresEcole = async () => {
  try {
    const response = await fetch('/api/parametres/ecole');
    const data = await response.json();
    if (data.success) {
      setParametresEcole(data.parametres);
    }
  } catch (error) {
    console.error('Erreur chargement paramètres:', error);
  }
};

  // Fonction de secours pour récupérer les notes depuis l'API notes-primaires
  const fetchNotesFromAPI = async (eleveId: number, periodeId: number): Promise<MatiereNote[]> => {
    try {
      console.log(`🔄 Tentative de récupération des notes pour élève ${eleveId}, période ${periodeId}`);
      
      const response = await fetch(`/api/notes-primaires?eleve_id=${eleveId}&periode_id=${periodeId}`);
      const data = await response.json();
      
      if (data.success && data.notes && Array.isArray(data.notes)) {
        console.log(`✅ ${data.notes.length} notes récupérées depuis l'API`);
        
        return data.notes.map((note: any) => {
          const noteValue = parseFloat(note.note) || 0;
          const coefficientValue = note.coefficient || 1;
          const noteCoefficientee = noteValue * coefficientValue;
          
          return {
            matiere_id: note.matiere_id || 0,
            matiere_nom: note.matiere_nom || 'Matière inconnue',
            coefficient: coefficientValue,
            note: noteValue,
            note_sur: note.note_sur || 20,
            appreciation: note.appreciation || genererAppreciationAuto(noteValue),
            note_coefficientee: noteCoefficientee
          };
        });
      }
      
      return [];
    } catch (error) {
      console.error('❌ Erreur récupération notes:', error);
      return [];
    }
  };

  // Fonction pour obtenir la classe CSS d'une note
  const getClasseNote = (note: number | string): string => {
    const noteNumber = typeof note === 'number' ? note : parseFloat(note.toString()) || 0;
    
    if (noteNumber >= 16) return 'excellent';
    if (noteNumber >= 14) return 'tres-bien';
    if (noteNumber >= 12) return 'bien';
    if (noteNumber >= 10) return 'assez-bien';
    if (noteNumber >= 8) return 'passable';
    return 'insuffisant';
  };

  // Fonction pour obtenir la couleur d'une note
  const obtenirCouleurNote = (note: number): string => {
    if (note >= 16) return '#10B981';
    if (note >= 14) return '#3B82F6';
    if (note >= 12) return '#8B5CF6';
    if (note >= 10) return '#F59E0B';
    if (note >= 8) return '#EF4444';
    return '#DC2626';
  };

  // Fonction pour obtenir la classe CSS d'une mention
  const getClasseMention = (mention: string): string => {
    const mentionMap: Record<string, string> = {
      'Félicitations': 'felicitations',
      'Très bien': 'tres-bien',
      'Bien': 'bien',
      'Assez bien': 'assez-bien',
      'Passable': 'passable',
      'Insuffisant': 'insuffisant',
      'Excellent': 'excellent'
    };
    return mentionMap[mention] || '';
  };

  // Fonction pour générer l'appréciation automatique
  const genererAppreciationAuto = (note: number): string => {
    const noteNum = parseFloat(note.toString()) || 0;
    
    if (noteNum === 0) return 'Non évalué';
    if (noteNum >= 18) return 'Excellent';
    if (noteNum >= 16) return 'Très Bien';
    if (noteNum >= 14) return 'Bien';
    if (noteNum >= 10) return 'Assez Bien';
    return 'Insuffisant';
  };

  // Fonction pour ouvrir un relevé détaillé
  const ouvrirReleveDetaille = async (releve: RelevePrimaire) => {
    console.log('🔓 Ouverture relevé:', releve.id);
    
    const matieresLocal = parseMoyennes(releve.moyennes_par_matiere);
    
    let matieresFinales = matieresLocal;
    
    if (matieresLocal.length === 0 && releve.eleve_id && releve.periode_id) {
      console.log('🔄 Aucune matière locale, tentative récupération depuis API...');
      matieresFinales = await fetchNotesFromAPI(releve.eleve_id, releve.periode_id);
    }
    
    const releveAvecMatiere = {
      ...releve,
      matieres_parsed: matieresFinales
    };
    
    console.log(`📊 ${matieresFinales.length} matières pour le relevé`);
    
    setSelectedReleve(releveAvecMatiere as any);
    setShowReleveDetail(true);
  };

  // Fermer la modale de détail
  const fermerReleveDetaille = () => {
    setShowReleveDetail(false);
    setSelectedReleve(null);
  };

  const imprimerTousReleves = async () => {
    if (filteredReleves.length === 0) {
      alert('Aucun relevé à imprimer !');
      return;
    }

    try {
      setPrintingAll(true);
      
      let htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tous les relevés de notes - ${filteredReleves.length} élèves</title>
    <style>
        @media print {
            body {
                margin: 0;
                padding: 0;
                font-family: 'Times New Roman', Times, serif;
            }
            .no-print {
                display: none !important;
            }
            .page-break {
                page-break-after: always;
            }
            .releve-section {
                page-break-inside: avoid;
                break-inside: avoid;
            }
        }
        
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            font-size: 12px;
        }
        
        .rapport-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px double #000;
        }
        
        .rapport-header h1 {
            font-size: 24px;
            font-weight: bold;
            color: #000;
            margin: 0;
            text-transform: uppercase;
        }
        
        .rapport-header .subtitle {
            font-size: 14px;
            color: #666;
            margin-top: 10px;
        }
        
        .filters-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 30px;
            border-left: 4px solid #3B82F6;
            font-size: 11px;
        }
        
        .releve-section {
            margin-bottom: 30px;
            border: 2px solid #000;
            padding: 15px;
            background: white;
            page-break-inside: avoid;
        }
        
        .entete-releve {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        
        .nom-ecole-releve {
            font-size: 18px;
            font-weight: bold;
            color: #000;
            margin-bottom: 3px;
            text-transform: uppercase;
        }
        
        .adresse-ecole-releve {
            font-size: 10px;
            color: #000;
            margin-bottom: 2px;
        }
        
        .infos-eleve {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            border: 1px solid #ddd;
            padding: 10px;
            border-radius: 3px;
            font-size: 11px;
        }
        
        .section-eleve, .section-scolaire {
            flex: 1;
        }
        
        .section-titre {
            font-weight: bold;
            color: #000;
            margin-bottom: 5px;
            font-size: 11px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 3px;
        }
        
        .info-ligne {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
        }
        
        .info-label {
            font-weight: bold;
            color: #555;
        }
        
        .info-valeur {
            color: #000;
        }
        
        .tableau-notes {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 10px;
        }
        
        .tableau-notes th {
            background-color: #f5f5f5;
            border: 1px solid #000;
            padding: 6px;
            text-align: center;
            font-weight: bold;
            color: #000;
        }
        
        .tableau-notes td {
            border: 1px solid #ddd;
            padding: 6px;
            text-align: center;
        }
        
        .note-coefficientee {
            font-weight: bold;
            color: #2c3e50;
            background-color: #f8f9fa;
        }
        
        .note-excellente { font-weight: bold; }
        .note-tres-bien { font-weight: bold; }
        .note-bien { font-weight: normal; }
        .note-passable { font-style: italic; }
        .note-insuffisante { color: #666; }
        
        .total-coefficientee {
            margin-top: 10px;
            padding: 8px;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            text-align: right;
            font-weight: bold;
            font-size: 11px;
        }
        
        .total-coefficientee span {
            color: #2c3e50;
        }
        
        .totaux {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 2px solid #000;
        }
        
        .moyenne-generale {
            text-align: center;
            flex: 1;
        }
        
        .moyenne-valeur {
            font-size: 20px;
            font-weight: bold;
            color: #000;
        }
        
        .rang-mention {
            text-align: center;
            flex: 1;
        }
        
        .mention {
            font-size: 16px;
            font-weight: bold;
            color: #000;
            margin-top: 8px;
        }
        
        .appreciation {
            margin-top: 15px;
            padding: 10px;
            background-color: #f9f9f9;
            border-radius: 3px;
            border-left: 4px solid #333;
            font-size: 11px;
        }
        
        .appreciation-titre {
            font-weight: bold;
            margin-bottom: 5px;
            color: #000;
        }
        
        .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #000;
        }
        
        .signature {
            text-align: center;
            flex: 1;
        }
        
        .ligne-signature {
            margin-top: 20px;
            border-top: 1px solid #000;
            width: 150px;
            display: inline-block;
        }
        
        .date-generation {
            text-align: right;
            font-size: 9px;
            color: #666;
            margin-top: 10px;
            font-style: italic;
        }
        
        .numero-page {
            position: absolute;
            bottom: 10px;
            right: 10px;
            font-size: 9px;
            color: #999;
        }
        
        .instructions {
            text-align: center;
            font-size: 10px;
            color: #999;
            margin-top: 5px;
            font-style: italic;
            border-top: 1px dashed #ddd;
            padding-top: 5px;
        }
    </style>
</head>
<body>
    <div class="rapport-header">
        <h1>RELEVÉS DE NOTES COMPLETS</h1>
        <div class="subtitle">
            ${filteredReleves.length} élève(s) • Généré le ${new Date().toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}
        </div>
    </div>
`;

    filteredReleves.forEach((releve, index) => {
      const matieres = parseMoyennes(releve.moyennes_par_matiere);
      
      const totalNotesCoefficientees = matieres.reduce((total, matiere) => {
        const noteValue = matiere.note || 0;
        const coefficientValue = matiere.coefficient || 1;
        return total + (noteValue * coefficientValue);
      }, 0);
      
      htmlContent += `
    <div class="releve-section">
        <div class="entete-releve">
  <div class="nom-ecole-releve">${parametresEcole?.nom_ecole || 'ÉCOLE PRIMAIRE'}</div>
  <div class="adresse-ecole-releve">${parametresEcole?.adresse || 'Adresse non définie'}</div>
  <div class="adresse-ecole-releve">Tél: ${parametresEcole?.telephone || ''} ${parametresEcole?.email ? '- Email: ' + parametresEcole.email : ''}</div>
</div>
        
        <div class="infos-eleve">
            <div class="section-eleve">
                <div class="section-titre">INFORMATIONS ÉLÈVE</div>
                <div class="info-ligne">
                    <span class="info-label">Nom complet:</span>
                    <span class="info-valeur">${releve.eleve_nom} ${releve.eleve_prenom}</span>
                </div>
                <div class="info-ligne">
                    <span class="info-label">Matricule:</span>
                    <span class="info-valeur">${releve.matricule || 'N/A'}</span>
                </div>
            </div>
            
            <div class="section-scolaire">
                <div class="section-titre">INFORMATIONS SCOLAIRES</div>
                <div class="info-ligne">
                    <span class="info-label">Classe:</span>
                    <span class="info-valeur">${releve.classe_nom}</span>
                </div>
                <div class="info-ligne">
                    <span class="info-label">Période:</span>
                    <span class="info-valeur">${releve.periode_nom}</span>
                </div>
                <div class="info-ligne">
                    <span class="info-label">Date génération:</span>
                    <span class="info-valeur">${new Date(releve.date_generation).toLocaleDateString('fr-FR')}</span>
                </div>
            </div>
        </div>
        
        <div style="text-align: center; margin: 10px 0;">
            <h3 style="margin: 0; font-size: 14px;">RELEVÉ DE NOTES</h3>
        </div>
        
        ${matieres.length > 0 ? `
        <table class="tableau-notes">
            <thead>
                <tr>
                    <th>Matières</th>
                    <th>Coefficients</th>
                    <th>Notes</th>
                    <th>Notes Coéfficientées</th>
                    <th>Sur</th>
                    <th>Appréciations</th>
                </tr>
            </thead>
            <tbody>
                ${matieres.map(matiere => {
                  const noteValue = matiere.note || 0;
                  const coefficientValue = matiere.coefficient || 1;
                  const noteCoefficientee = noteValue * coefficientValue;
                  const appreciation = matiere.appreciation || genererAppreciationAuto(noteValue);
                  
                  return `
                <tr>
                    <td>${matiere.matiere_nom}</td>
                    <td>${coefficientValue}</td>
                    <td>${noteValue.toFixed(2)}</td>
                    <td class="note-coefficientee">${noteCoefficientee.toFixed(2)}</td>
                    <td>${matiere.note_sur || 20}</td>
                    <td>${appreciation}</td>
                </tr>
                `;
                }).join('')}
            </tbody>
        </table>
        
        <div class="total-coefficientee">
            Total des notes coéfficientées: <span>${totalNotesCoefficientees.toFixed(2)}</span>
        </div>
        ` : `
        <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 5px; margin: 20px 0;">
            <p style="color: #666; margin: 0;">Aucune donnée de matière disponible</p>
        </div>
        `}
        
        <div class="totaux">
            <div class="moyenne-generale">
                <div>MOYENNE GÉNÉRALE</div>
                <div class="moyenne-valeur">${releve.moyenne_generale?.toFixed(2) || '0.00'} / 20</div>
            </div>
            
            <div class="rang-mention">
                <div>RANG: ${releve.rang || 0}${releve.rang === 1 ? 'er' : 'ème'}</div>
                <div class="mention">${releve.mention || 'Non spécifié'}</div>
            </div>
        </div>
        
        <div class="appreciation">
            <div class="appreciation-titre">APPRÉCIATION GÉNÉRALE</div>
            <div>${releve.appreciation_generale || 'Aucune appréciation disponible.'}</div>
        </div>
        
        <div class="signatures">
            <div class="signature">
                <div>Le Directeur</div>
                <div class="ligne-signature"></div>
            </div>
            
            <div class="signature">
                <div>L'Instituteur</div>
                <div class="ligne-signature"></div>
            </div>
        </div>
        
        <div class="date-generation">
            Relevé généré automatiquement • ${index + 1}/${filteredReleves.length}
        </div>
    </div>
    
    ${index < filteredReleves.length - 1 ? '<div class="page-break"></div>' : ''}
    `;
    });

    htmlContent += `
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      printWindow.onload = function() {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    } else {
      alert("Veuillez autoriser les popups pour l'impression, ou utilisez l'export HTML.");
    }
    
  } catch (error) {
    console.error('Erreur lors de l\'impression:', error);
    alert('Erreur lors de la préparation des relevés pour impression.');
  } finally {
    setPrintingAll(false);
  }
};

  // FONCTION D'EXPORT AVEC NOTES COÉFFICIENTÉES
  const exporterTousReleves = async () => {
    if (filteredReleves.length === 0) {
      alert('Aucun relevé à exporter !');
      return;
    }

    try {
      setExporting(true);
      
      let htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Export de tous les relevés</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #3B82F6;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #2c3e50;
            margin: 0;
        }
        .header .subtitle {
            color: #7f8c8d;
            margin-top: 10px;
        }
        .filters-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 30px;
            border-left: 4px solid #3B82F6;
        }
        .releve-section {
            margin-bottom: 50px;
            page-break-inside: avoid;
        }
        .releve-header {
            background: linear-gradient(135deg, #3B82F6, #8B5CF6);
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
        }
        .releve-content {
            border: 1px solid #e0e0e0;
            border-top: none;
            padding: 25px;
            border-radius: 0 0 8px 8px;
        }
        .eleve-info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .info-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #3498db;
        }
        .info-card h3 {
            color: #2c3e50;
            margin-top: 0;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .info-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px dashed #eee;
        }
        .info-label {
            font-weight: bold;
            color: #555;
        }
        .info-value {
            color: #2c3e50;
        }
        .notes-table {
            width: 100%;
            border-collapse: collapse;
            margin: 25px 0;
        }
        .notes-table th {
            background-color: #f1f5f9;
            padding: 15px;
            text-align: left;
            font-weight: bold;
            color: #2c3e50;
            border-bottom: 2px solid #3B82F6;
        }
        .notes-table td {
            padding: 15px;
            border-bottom: 1px solid #e0e0e0;
        }
        .notes-table tr:hover {
            background-color: #f8fafc;
        }
        .note-cell {
            font-weight: bold;
        }
        .note-coefficientee-cell {
            font-weight: bold;
            color: #2c3e50;
            background-color: #f8f9fa;
        }
        .note-excellent { color: #10B981; }
        .note-tres-bien { color: #3B82F6; }
        .note-bien { color: #8B5CF6; }
        .note-assez-bien { color: #F59E0B; }
        .note-passable { color: #EF4444; }
        .note-insuffisant { color: #DC2626; }
        .total-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .total-card {
            background: linear-gradient(135deg, #f8fafc, #f1f5f9);
            padding: 25px;
            border-radius: 10px;
            text-align: center;
            border: 1px solid #e2e8f0;
        }
        .total-card h4 {
            color: #64748b;
            margin: 0 0 15px 0;
            font-size: 16px;
            text-transform: uppercase;
        }
        .total-value {
            font-size: 36px;
            font-weight: bold;
            margin: 10px 0;
        }
        .total-coefficientee {
            margin: 15px 0;
            padding: 12px;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            text-align: right;
            font-weight: bold;
            font-size: 14px;
        }
        .total-coefficientee span {
            color: #2c3e50;
            font-size: 16px;
        }
        .mention-badge {
            display: inline-block;
            padding: 8px 20px;
            border-radius: 20px;
            font-weight: bold;
            margin-top: 10px;
        }
        .mention-excellent { background: #d1fae5; color: #065f46; }
        .mention-tres-bien { background: #dbeafe; color: #1e40af; }
        .mention-bien { background: #e0e7ff; color: #3730a3; }
        .mention-assez-bien { background: #fef3c7; color: #92400e; }
        .mention-passable { background: #fed7aa; color: #9a3412; }
        .mention-insuffisant { background: #fee2e2; color: #991b1b; }
        .appreciation {
            background: #f0f9ff;
            padding: 20px;
            border-radius: 8px;
            margin-top: 25px;
            border-left: 4px solid #0ea5e9;
        }
        .appreciation h4 {
            color: #0369a1;
            margin-top: 0;
        }
        .appreciation p {
            color: #334155;
            line-height: 1.6;
            margin: 10px 0 0 0;
            font-style: italic;
        }
        .page-break {
            page-break-after: always;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px dashed #ddd;
            color: #7f8c8d;
            font-size: 14px;
        }
        @media print {
            body {
                padding: 0;
                background: white;
            }
            .container {
                box-shadow: none;
                padding: 10px;
            }
            .releve-section {
                margin-bottom: 30px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>EXPORT COMPLET DES RELEVÉS DE NOTES</h1>
            <div class="subtitle">
                Généré le ${new Date().toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}
            </div>
        </div>
        
        <div class="filters-info">
            <strong>Filtres appliqués :</strong><br>
            • Recherche : ${searchTerm || 'Aucune'}<br>
            • Classe : ${selectedClasse === 'toutes' ? 'Toutes' : selectedClasse}<br>
            • Période : ${selectedPeriode === 'toutes' ? 'Toutes' : selectedPeriode}<br>
            • Nombre de relevés : ${filteredReleves.length}
        </div>
`;

      filteredReleves.forEach((releve, index) => {
        let matieres = parseMoyennes(releve.moyennes_par_matiere);
        const mentionClasse = getClasseMention(releve.mention);
        
        const totalNotesCoefficientees = matieres.reduce((total, matiere) => {
          return total + (matiere.note_coefficientee || 0);
        }, 0);
        
        htmlContent += `
        <div class="releve-section" id="releve-${releve.id}">
            <div class="releve-header">
                <h2 style="margin: 0; color: white;">RELEVÉ DE NOTES</h2>
                <div style="display: flex; justify-content: space-between; margin-top: 10px;">
                    <span>${releve.eleve_prenom} ${releve.eleve_nom}</span>
                    <span>N°${index + 1}/${filteredReleves.length}</span>
                </div>
            </div>
            
            <div class="releve-content">
                <div class="eleve-info-grid">
                    <div class="info-card">
                        <h3>Informations de l'élève</h3>
                        <div class="info-line">
                            <span class="info-label">Nom complet :</span>
                            <span class="info-value">${releve.eleve_nom} ${releve.eleve_prenom}</span>
                        </div>
                        <div class="info-line">
                            <span class="info-label">Matricule :</span>
                            <span class="info-value">${releve.matricule || 'Non spécifié'}</span>
                        </div>
                    </div>
                    
                    <div class="info-card">
                        <h3>Informations scolaires</h3>
                        <div class="info-line">
                            <span class="info-label">Classe :</span>
                            <span class="info-value">${releve.classe_nom}</span>
                        </div>
                        <div class="info-line">
                            <span class="info-label">Période :</span>
                            <span class="info-value">${releve.periode_nom}</span>
                        </div>
                        <div class="info-line">
                            <span class="info-label">Date génération :</span>
                            <span class="info-value">${new Date(releve.date_generation).toLocaleDateString('fr-FR')}</span>
                        </div>
                    </div>
                </div>
                
                ${matieres.length > 0 ? `
                <h3 style="color: #2c3e50; margin-bottom: 15px;">Détail des notes par matière</h3>
                <table class="notes-table">
                    <thead>
                        <tr>
                            <th>Matière</th>
                            <th>Coefficient</th>
                            <th>Note</th>
                            <th>Note Coéfficientée</th>
                            <th>Sur</th>
                            <th>Appréciation</th>
                        </tr>
                    </thead>
                    <tbody>
                ` + matieres.map(matiere => {
                    const noteNum = matiere.note || 0;
                    const noteSur = matiere.note_sur || 20;
                    const noteClasse = getClasseNote(noteNum);
                    const appreciation = matiere.appreciation || genererAppreciationAuto(noteNum);
                    const noteCoefficientee = matiere.note_coefficientee || (noteNum * matiere.coefficient);
                    
                    return `
                        <tr>
                            <td><strong>${matiere.matiere_nom}</strong></td>
                            <td>${matiere.coefficient}</td>
                            <td class="note-cell note-${noteClasse}">
                                <strong>${noteNum.toFixed(2)}</strong>
                            </td>
                            <td class="note-coefficientee-cell">
                                <strong>${noteCoefficientee.toFixed(2)}</strong>
                            </td>
                            <td>${noteSur}</td>
                            <td>
                                <span class="note-${noteClasse}" style="font-weight: bold;">
                                    ${appreciation}
                                </span>
                            </td>
                        </tr>
                    `;
                }).join('') + `
                    </tbody>
                </table>
                
                <div class="total-coefficientee">
                    Total des notes coéfficientées: <span>${totalNotesCoefficientees.toFixed(2)}</span>
                </div>
                ` : `
                <div style="text-align: center; padding: 30px; background: #f8f9fa; border-radius: 8px; margin: 20px 0;">
                    <div style="font-size: 48px; color: #ddd; margin-bottom: 10px;">📝</div>
                    <h3 style="color: #666;">Aucune donnée de matière disponible</h3>
                    <p style="color: #999;">Les notes par matière n'ont pas été sauvegardées dans ce relevé.</p>
                </div>
                `}
                
                <div class="total-section">
                    <div class="total-card">
                        <h4>Moyenne Générale</h4>
                        <div class="total-value" style="color: #3B82F6;">
                            ${releve.moyenne_generale?.toFixed(2) || '0.00'} / 20
                        </div>
                        <div style="font-size: 14px; color: #64748b;">
                            Sur ${matieres.length} matière${matieres.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                    
                    <div class="total-card">
                        <h4>Classement</h4>
                        <div class="total-value" style="color: #10B981;">
                            ${releve.rang || 0}${releve.rang === 1 ? 'er' : 'ème'}
                        </div>
                        <div class="mention-badge mention-${mentionClasse}">
                            ${releve.mention || 'Non spécifié'}
                        </div>
                    </div>
                </div>
                
                <div class="appreciation">
                    <h4>Appréciation générale</h4>
                    <p>"${releve.appreciation_generale || 'Aucune appréciation disponible.'}"</p>
                </div>
            </div>
        </div>
        
        ${index < filteredReleves.length - 1 ? '<div class="page-break"></div>' : ''}
        `;
      });

      htmlContent += `
        <div class="footer">
            <p>Document généré automatiquement par le système de gestion scolaire</p>
            <p>© ${new Date().getFullYear()} - Tous droits réservés</p>
        </div>
    </div>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const dateStr = new Date().toISOString().split('T')[0];
      const classeStr = selectedClasse === 'toutes' ? 'toutes-classes' : selectedClasse.replace(/[^a-z0-9]/gi, '-');
      const periodeStr = selectedPeriode === 'toutes' ? 'toutes-periodes' : selectedPeriode.replace(/[^a-z0-9]/gi, '-');
      
      a.download = `releves-${classeStr}-${periodeStr}-${dateStr}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
      
      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        previewWindow.document.write(htmlContent);
        previewWindow.document.close();
      }
      
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export des relevés.');
    } finally {
      setExporting(false);
    }
  };

  // Fonction pour récupérer les informations de l'élève (dont téléphone du parent)
  const fetchEleveInfo = async (eleveId: number) => {
    try {
      console.log(`📞 Récupération des infos élève ID: ${eleveId}`);
      const response = await fetch(`/api/eleves/${eleveId}`);
      
      if (!response.ok) {
        console.error(`❌ Erreur HTTP: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const data = await response.json();
      console.log(`📊 Données API reçues:`, data);
      
      if (data.success && data.eleve) {
        console.log(`✅ Infos élève récupérées:`, {
          id: data.eleve.id,
          nom: data.eleve.nom,
          prenom: data.eleve.prenom,
          telephone_parent: data.eleve.telephone_parent,
          email_parents: data.eleve.email_parents,
          matricule: data.eleve.matricule
        });
        return data.eleve;
      } else {
        console.error(`❌ Pas de succès dans la réponse:`, data);
      }
      return null;
    } catch (error) {
      console.error('❌ Erreur récupération infos élève:', error);
      return null;
    }
  };

  const formaterReleveWhatsApp = (releve: RelevePrimaire, eleveInfo: EleveInfo): string => {
    console.log('📋 Formatage WhatsApp pour:', eleveInfo.prenom, eleveInfo.nom);
    
    let message = `📋 RELEVÉ DE NOTES - ${eleveInfo.prenom} ${eleveInfo.nom}\n`;
    message += `🏫 Classe: ${releve.classe_nom}\n`;
    message += `📅 Période: ${releve.periode_nom}\n`;
    message += `📊 Moyenne Générale: ${releve.moyenne_generale.toFixed(2)}/20\n`;
    message += `🥇 Rang: ${releve.rang}\n`;
    message += `📝 Mention: ${releve.mention}\n\n`;
    
    message += '📚 NOTES PAR MATIÈRE:\n';
    message += '─'.repeat(40) + '\n';
    
    const matieres = parseMoyennes(releve.moyennes_par_matiere);
    
    if (matieres.length > 0) {
      matieres.forEach((matiere: MatiereNote, index: number) => {
        message += `${matiere.matiere_nom}: ${matiere.note.toFixed(2)}/20 (Coeff: ${matiere.coefficient})\n`;
      });
    } else {
      message += 'Aucune note disponible\n';
    }
    
    message += '\n' + '─'.repeat(40) + '\n';
    
    if (releve.appreciation_generale) {
      message += `\n📝 APPRÉCIATION:\n${releve.appreciation_generale}\n`;
    }
    
    message += `\n📅 Date: ${new Date(releve.date_generation).toLocaleDateString('fr-FR')}`;
    
    return encodeURIComponent(message);
  };

  const envoyerWhatsAppAvecDetails = async (releve: RelevePrimaire, eleveInfo: EleveInfo): Promise<void> => {
    try {
      console.log('📱 Préparation envoi WhatsApp détaillé');
      
      const messageWhatsApp = formaterReleveWhatsApp(releve, eleveInfo);
      
      const telephoneNettoye = eleveInfo.telephone_parent.replace(/[^\d+]/g, '');
      
      console.log('📱 Numéro nettoyé:', telephoneNettoye);
      console.log('📱 Message WhatsApp formaté:', decodeURIComponent(messageWhatsApp));
      
      const urlWhatsApp = `https://wa.me/${telephoneNettoye}?text=${messageWhatsApp}`;
      
      window.open(urlWhatsApp, '_blank');
      
      try {
        const response = await fetch('/api/releves-primaires/envoi', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            releve_id: releve.id,
            mode_envoi: 'whatsapp',
            date_envoi: new Date().toISOString(),
            statut: 'envoyé'
          })
        });
        
        if (response.ok) {
          console.log('✅ Statut WhatsApp mis à jour');
        }
      } catch (updateError) {
        console.error('⚠️ Erreur mise à jour statut:', updateError);
      }
      
    } catch (error) {
      console.error('❌ Erreur WhatsApp détaillé:', error);
      alert('❌ Impossible d\'envoyer par WhatsApp\n\n' + 
            'Veuillez vérifier que le numéro est correct.');
    }
  };

  // Fonction pour formater le numéro pour WhatsApp Côte d'Ivoire
  const formaterNumeroCI = (numero: string): string => {
    let numeroNettoye = numero.replace(/\s+/g, '');
    
    if (numeroNettoye.startsWith('00225')) {
      return '+' + numeroNettoye.substring(2);
    }
    
    if (numeroNettoye.startsWith('+225')) {
      return numeroNettoye;
    }
    
    if (numeroNettoye.startsWith('225')) {
      return '+' + numeroNettoye;
    }
    
    if (/^0[157]\d{8}$/.test(numeroNettoye)) {
      return '+225' + numeroNettoye;
    }
    
    if (/^0[157]\d{6}$/.test(numeroNettoye)) {
      return '+225' + numeroNettoye + '00';
    }
    
    if (/^[157]\d{8}$/.test(numeroNettoye)) {
      return '+2250' + numeroNettoye;
    }
    
    const chiffresSeuls = numeroNettoye.replace(/\D/g, '');
    
    if (chiffresSeuls.length === 10 && chiffresSeuls.startsWith('0')) {
      return '+225' + chiffresSeuls;
    }
    
    if (chiffresSeuls.length === 13 && chiffresSeuls.startsWith('225')) {
      return '+' + chiffresSeuls;
    }
    
    return numeroNettoye;
  };

// Fonction pour récupérer les paramètres de l'école
const fetchParametresEcole = async () => {
  try {
    const response = await fetch('/api/parametres/ecole');
    if (!response.ok) return null;
    const data = await response.json();
    return data.success ? data.parametres : null;
  } catch (error) {
    console.error('❌ Erreur récupération paramètres école:', error);
    return null;
  }
};

// Fonction pour générer une URL unique pour le relevé
const genererURLReleve = (releveId: number) => {
  const hash = btoa(`releve-${releveId}-${Date.now()}`);
  return `${window.location.origin}/releve/${hash}`;
  };

// Fonction pour encoder un message WhatsApp
const encoderMessageWhatsApp = async (releve: RelevePrimaire, eleveInfo: any) => {
  // Récupérer les paramètres de l'école
  const parametresEcole = await fetchParametresEcole();
  
  // Récupérer les matières
  const matieres = parseMoyennes(releve.moyennes_par_matiere);
  
  // Construire le message avec les nouvelles sections
  let message = `Bonjour Papa/Maman de ${eleveInfo.prenom} ${eleveInfo.nom},\n\n`;
  
  message += `*RELEVÉ DE NOTES - ${releve.periode_nom.toUpperCase()}*\n\n`;
  message += `*ÉLÈVE:* ${eleveInfo.prenom} ${eleveInfo.nom}\n`;
  message += `*CLASSE:* ${releve.classe_nom}\n`;
  message += `*MATRICULE:* ${releve.matricule || eleveInfo.matricule || 'Non spécifié'}\n\n`;
  
  if (matieres.length > 0) {
    message += `📊 *DÉTAIL DES NOTES* 📊\n`;
    matieres.forEach((matiere, index) => {
      const note = matiere.note?.toFixed(2) || '0.00';
      const appreciation = matiere.appreciation || genererAppreciationAuto(matiere.note || 0);
      message += `${index + 1}. *${matiere.matiere_nom}*: ${note}/20 (Coeff: ${matiere.coefficient}) - ${appreciation}\n`;
    });
    message += `\n`;
  }
  
  message += `🏆 *RÉSULTATS GÉNÉRAUX* 🏆\n`;
  message += `*Moyenne Générale:* ${releve.moyenne_generale?.toFixed(2) || '0.00'}/20\n`;
  message += `*Rang:* ${releve.rang}${releve.rang === 1 ? 'er' : 'ème'}\n`;
  message += `*Mention:* ${releve.mention}\n\n`;
  
  if (releve.appreciation_generale) {
    message += `📝 *Appréciation Générale:*\n${releve.appreciation_generale}\n\n`;
  }
  
  // Ajouter le lien pour voir le relevé (utiliser l'API simplifiée)
  const baseUrl = window.location.origin;
  const releveUrl = `${baseUrl}/releve/${releve.id}`;
  message += `📄 *VOIR LE RELEVÉ COMPLET:*\n`;
  message += `${releveUrl}\n\n`;
  message += `(Ouvrez ce lien dans votre navigateur pour voir le relevé détaillé et l'imprimer)\n\n`;
  
  // Ajouter les coordonnées de l'école
  message += `🏫 *COORDONNÉES DE L'ÉCOLE*\n`;
  if (parametresEcole) {
    message += `*École:* ${parametresEcole.nom_ecole}\n`;
    message += `*Adresse:* ${parametresEcole.adresse}\n`;
    message += `*Téléphone:* ${parametresEcole.telephone}\n`;
    message += `*Email:* ${parametresEcole.email}\n`;
  } else {
    message += `*École:* Groupe Scolaire GNAMIEN ASSA\n`;
    message += `*Adresse:* Biengerville CEFAL\n`;
    message += `*Téléphone:* +225 01 72 95 45 47\n`;
    message += `*Email:* groupescolairegnamienassa@gmail.com\n`;
  }
  
  message += `\nCordialement,\n`;
  message += `*L'Équipe Pédagogique*\n`;
  message += `Date: ${new Date().toLocaleDateString('fr-CI')}`;
  
  return encodeURIComponent(message);
};

// Fonction pour envoyer le relevé par WhatsApp
const envoyerParWhatsApp = async (releve: RelevePrimaire) => {
  try {
    console.log(`📱 Envoi WhatsApp pour l'élève ID: ${releve.eleve_id}`);
    console.log(`👤 Élève: ${releve.eleve_prenom} ${releve.eleve_nom}`);
    
    // Récupérer les informations de l'élève
    const eleveInfo = await fetchEleveInfo(releve.eleve_id);
    
    if (!eleveInfo) {
      alert('❌ Impossible de récupérer les informations de l\'élève');
      return;
    }
    
    console.log('📋 Informations récupérées:', {
      nomComplet: `${eleveInfo.nom} ${eleveInfo.prenom}`,
      telephone_parent: eleveInfo.telephone_parent,
      email_parents: eleveInfo.email_parents
    });
    
    const telephoneParent = eleveInfo.telephone_parent;
    
    // Vérifier si le numéro de téléphone existe
    if (!telephoneParent || telephoneParent.trim() === '') {
      alert(`❌ Aucun numéro de téléphone trouvé pour le parent de ${eleveInfo.prenom} ${eleveInfo.nom}`);
      
      // Suggérer d'utiliser l'email si disponible
      if (eleveInfo.email_parents) {
        const useEmail = confirm(
          `Aucun numéro WhatsApp trouvé pour ${eleveInfo.prenom} ${eleveInfo.nom}.\n\n` +
          `Voulez-vous envoyer par email à ${eleveInfo.email_parents} à la place ?`
        );
        
        if (useEmail) {
          // Ouvrir le client email
          const subject = encodeURIComponent(`Relevé de notes - ${eleveInfo.prenom} ${eleveInfo.nom}`);
          const body = encodeURIComponent(
            `Bonjour,\n\n` +
            `Veuillez trouver ci-joint le relevé de notes de ${eleveInfo.prenom} ${eleveInfo.nom}.\n\n` +
            `Classe: ${releve.classe_nom}\n` +
            `Période: ${releve.periode_nom}\n` +
            `Moyenne: ${releve.moyenne_generale?.toFixed(2) || '0.00'}/20\n` +
            `Rang: ${releve.rang}${releve.rang === 1 ? 'er' : 'ème'}\n` +
            `Mention: ${releve.mention}\n\n` +
            `Cordialement,\nL'École Primaire`
          );
          window.open(`mailto:${eleveInfo.email_parents}?subject=${subject}&body=${body}`);
        }
      }
      return;
    }

    const numeroPropre = formaterNumeroCI(telephoneParent);
    
    console.log('📱 Numéro formaté pour WhatsApp:', {
      original: telephoneParent,
      cleaned: numeroPropre
    });
    
    // Vérifier si le numéro est potentiellement valide
    if (!numeroPropre.match(/^\+225[157]\d{7}$/)) {
      console.warn('⚠️ Format de numéro potentiellement invalide:', numeroPropre);
      
      // Demander confirmation avec possibilité de corriger
      const confirmation = confirm(
        `Le numéro ${telephoneParent} sera envoyé comme: ${numeroPropre}\n\n` +
        `Format attendu pour WhatsApp Côte d'Ivoire:\n` +
        `• +22501234567\n` +
        `• +22551234567\n` +
        `• +22571234567\n\n` +
        `Voulez-vous continuer ?\n\n` +
        `Cliquez sur "Annuler" pour corriger le numéro manuellement.`
      );
      
      if (!confirmation) {
        // Permettre à l'utilisateur de corriger le numéro
        const nouveauNumero = prompt(
          `Correction du numéro pour ${eleveInfo.prenom} ${eleveInfo.nom}\n\n` +
          `Numéro actuel: ${telephoneParent}\n` +
          `Entrez le bon numéro (format: +225XXXXXXXX):`,
          numeroPropre
        );
        
        if (!nouveauNumero) return;
        
        // Réessayer avec le nouveau numéro
        const message = await encoderMessageWhatsApp(releve, eleveInfo);
        const whatsappUrl = `https://wa.me/${nouveauNumero.replace(/\s+/g, '')}?text=${message}`;
        window.open(whatsappUrl, '_blank');
        return;
      }
    }
    
    const message = await encoderMessageWhatsApp(releve, eleveInfo);
    
    // URL WhatsApp avec le numéro et le message
    const whatsappUrl = `https://wa.me/${numeroPropre}?text=${message}`;
    
    console.log('🔗 URL WhatsApp générée:', whatsappUrl);
    
    // Ouvrir WhatsApp dans un nouvel onglet
    const newWindow = window.open(whatsappUrl, '_blank');
        
    console.log('✅ WhatsApp ouvert pour:', {
      eleve: `${eleveInfo.prenom} ${eleveInfo.nom}`,
      telephone: telephoneParent,
      cleaned: numeroPropre,
      url: whatsappUrl.substring(0, 100) + '...'
    });
    
  } catch (error) {
    console.error('❌ Erreur envoi WhatsApp:', error);
    alert('❌ Erreur lors de l\'envoi par WhatsApp\n\n' + 
          'Veuillez vérifier:\n' +
          '1. Votre connexion internet\n' +
          '2. Que le numéro est correct\n' +
          '3. Réessayez plus tard');
  }
};

  // FONCTION POUR LA SÉLECTION/DÉSÉLECTION MULTIPLE
  const toggleSelectionReleve = (releveId: number) => {
    setSelectedReleves(prev => {
      const nouvelleSelection = new Set(prev);
      if (nouvelleSelection.has(releveId)) {
        nouvelleSelection.delete(releveId);
      } else {
        nouvelleSelection.add(releveId);
      }
      return nouvelleSelection;
    });
  };

  // FONCTION POUR TOUT SÉLECTIONNER/DÉSÉLECTIONNER
  const toggleSelectionTous = () => {
    if (selectedReleves.size === filteredReleves.length) {
      setSelectedReleves(new Set());
    } else {
      const tousIds = new Set(filteredReleves.map(r => r.id));
      setSelectedReleves(tousIds);
    }
  };

// FONCTION POUR ENVOYER PLUSIEURS RELEVÉS PAR WHATSAPP
const envoyerMultiplesWhatsApp = async () => {
  if (selectedReleves.size === 0) {
    alert('Veuillez sélectionner au moins un relevé à envoyer.');
    return;
  }

  const confirmation = confirm(
    `Voulez-vous envoyer ${selectedReleves.size} relevé(s) par WhatsApp ?\n\n` +
    `Cette action va ouvrir ${selectedReleves.size} onglet(s) WhatsApp.\n\n` +
    `⚠️ Note: Le message inclura un lien vers chaque relevé accessible par les parents.`
  );

  if (!confirmation) return;

  setEnvoiWhatsAppMultiple(true);
  setEnvoiEnCours(true);
  
  // Initialiser les statuts
  const nouveauxStatuts: Record<number, any> = {};
  Array.from(selectedReleves).forEach(id => {
    nouveauxStatuts[id] = { statut: 'en_attente' };
  });
  setStatutsEnvoi(nouveauxStatuts);

  // Récupérer les paramètres de l'école (une seule fois)
  const parametresEcole = await fetchParametresEcole();
  
  // Récupérer les relevés sélectionnés
  const relevesAEnvoyer = releves.filter(r => selectedReleves.has(r.id));
  
  // Préparer un tableau pour les statistiques
  const statistiques = {
    succes: 0,
    echecs: 0,
    pasDeContact: 0
  };

  // Ouvrir les fenêtres WhatsApp une par une avec un délai
  for (let i = 0; i < relevesAEnvoyer.length; i++) {
    const releve = relevesAEnvoyer[i];
    
    try {
      // Mettre à jour le statut
      setStatutsEnvoi(prev => ({
        ...prev,
        [releve.id]: { statut: 'en_cours' }
      }));

      // Récupérer les infos de l'élève
      const eleveInfo = await fetchEleveInfo(releve.eleve_id);
      
      if (!eleveInfo) {
        statistiques.echecs++;
        setStatutsEnvoi(prev => ({
          ...prev,
          [releve.id]: { 
            statut: 'echec', 
            message: 'Infos élève introuvables' 
          }
        }));
        continue;
      }

      const telephoneParent = eleveInfo.telephone_parent;
      
      if (!telephoneParent || telephoneParent.trim() === '') {
        statistiques.pasDeContact++;
        setStatutsEnvoi(prev => ({
          ...prev,
          [releve.id]: { 
            statut: 'pas_de_contact', 
            message: 'Pas de numéro WhatsApp' 
          }
        }));
        continue;
      }

      // UTILISER LA MÊME FONCTION QUE POUR L'ENVOI INDIVIDUEL
      const messageEncode = await encoderMessageWhatsApp(releve, eleveInfo);
      const numeroPropre = formaterNumeroCI(telephoneParent);
      
      // Ouvrir WhatsApp (avec un délai pour éviter le blocage des popups)
      setTimeout(() => {
        const whatsappUrl = `https://wa.me/${numeroPropre}?text=${messageEncode}`;
        window.open(whatsappUrl, `whatsapp_${releve.id}`);
      }, i * 1500); // 1.5 secondes entre chaque ouverture

      statistiques.succes++;
      // Mettre à jour le statut
      setStatutsEnvoi(prev => ({
        ...prev,
        [releve.id]: { statut: 'succes' }
      }));

    } catch (error) {
      console.error(`Erreur pour ${releve.id}:`, error);
      statistiques.echecs++;
      setStatutsEnvoi(prev => ({
        ...prev,
        [releve.id]: { 
          statut: 'echec', 
          message: 'Erreur technique' 
        }
      }));
    }
  }

  setEnvoiEnCours(false);
};

  // Fonction pour générer un PDF simple du relevé
  const genererPDF = (releve: RelevePrimaire) => {
    const matieres = parseMoyennes(releve.moyennes_par_matiere);
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .info-eleve { margin-bottom: 20px; }
    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    .table th { background-color: #f2f2f2; }
    .footer { margin-top: 30px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h2>ÉCOLE PRIMAIRE</h2>
    <h3>Relevé de notes</h3>
  </div>
  
  <div class="info-eleve">
    <p><strong>Élève:</strong> ${releve.eleve_prenom} ${releve.eleve_nom}</p>
    <p><strong>Classe:</strong> ${releve.classe_nom}</p>
    <p><strong>Période:</strong> ${releve.periode_nom}</p>
    <p><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
  </div>
  
  ${matieres.length > 0 ? `
  <table class="table">
    <thead>
      <tr>
        <th>Matière</th>
        <th>Note</th>
        <th>Coefficient</th>
        <th>Appréciation</th>
      </tr>
    </thead>
    <tbody>
      ${matieres.map(matiere => `
        <tr>
          <td>${matiere.matiere_nom}</td>
          <td>${matiere.note?.toFixed(2) || '0.00'}/20</td>
          <td>${matiere.coefficient}</td>
          <td>${matiere.appreciation}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div style="margin-top: 20px;">
    <p><strong>Moyenne Générale:</strong> ${releve.moyenne_generale?.toFixed(2) || '0.00'}/20</p>
    <p><strong>Rang:</strong> ${releve.rang}${releve.rang === 1 ? 'er' : 'ème'}</p>
    <p><strong>Mention:</strong> ${releve.mention}</p>
  </div>
  ` : '<p>Aucune note disponible</p>'}
  
  <div class="footer">
    <p>Document généré automatiquement</p>
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      return new Promise((resolve) => {
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            resolve(true);
          }, 500);
        };
      });
    }
    
    return Promise.resolve(false);
  };

  // Fonction améliorée pour WhatsApp avec option PDF
  const envoyerReleveWhatsApp = async (releve: RelevePrimaire) => {
    try {
      const eleveInfo = await fetchEleveInfo(releve.eleve_id);
      
      if (!eleveInfo) {
        alert('Impossible de récupérer les informations de l\'élève');
        return;
      }
      
      const telephoneParent = eleveInfo.telephone_parent;
      
      if (!telephoneParent) {
        alert(`Aucun numéro de téléphone trouvé pour le parent de ${eleveInfo.prenom} ${eleveInfo.nom}`);
        return;
      }
      
      const genererPDFFirst = confirm(
        `Voulez-vous générer un PDF du relevé de ${eleveInfo.prenom} ${eleveInfo.nom} avant de l'envoyer par WhatsApp?\n\n` +
        `Cliquez sur "OK" pour générer le PDF d'abord, puis ouvrir WhatsApp.\n` +
        `Cliquez sur "Annuler" pour envoyer un message texte uniquement.`
      );
      
      let messageWhatsApp = '';
      
      if (genererPDFFirst) {
        alert('Génération du PDF en cours... Ouvrez la fenêtre d\'impression qui va s\'ouvrir.');
        await genererPDF(releve);
        
        messageWhatsApp = encodeURIComponent(
          `Bonjour M./Mme ${eleveInfo.nom},\n\n` +
          `Je vous envoie le relevé de notes de ${eleveInfo.prenom} ${eleveInfo.nom} ` +
          `pour la période ${releve.periode_nom} en pièce jointe (PDF).\n\n` +
          `Résumé:\n` +
          `• Classe: ${releve.classe_nom}\n` +
          `• Moyenne: ${releve.moyenne_generale?.toFixed(2) || '0.00'}/20\n` +
          `• Rang: ${releve.rang}${releve.rang === 1 ? 'er' : 'ème'}\n` +
          `• Mention: ${releve.mention}\n\n` +
          `📎 Le PDF est prêt à être téléchargé depuis la fenêtre d'impression.\n\n` +
          `Cordialement,\nL'École Primaire`
        );
      } else {
        messageWhatsApp = encodeURIComponent(
          `Bonjour M./Mme ${eleveInfo.nom},\n\n` +
          `Voici le relevé de notes de ${eleveInfo.prenom} ${eleveInfo.nom} ` +
          `pour la période ${releve.periode_nom}:\n\n` +
          `📊 RÉSULTATS:\n` +
          `• Classe: ${releve.classe_nom}\n` +
          `• Moyenne: ${releve.moyenne_generale?.toFixed(2) || '0.00'}/20\n` +
          `• Rang: ${releve.rang}${releve.rang === 1 ? 'er' : 'ème'}\n` +
          `• Mention: ${releve.mention}\n\n` +
          `${releve.appreciation_generale ? `Appréciation: ${releve.appreciation_generale}\n\n` : ''}` +
          `📋 Détail des notes disponible sur le portail parent.\n\n` +
          `Cordialement,\nL'École Primaire`
        );
      }
      
      const numeroPropre = telephoneParent.replace(/\s+/g, '').replace('+', '');
      const whatsappUrl = `https://wa.me/${numeroPropre}?text=${messageWhatsApp}`;
      window.open(whatsappUrl, '_blank');
      
    } catch (error) {
      console.error('❌ Erreur envoi WhatsApp:', error);
      alert('Erreur lors de l\'envoi par WhatsApp');
    }
  };

  // FONCTION D'IMPRESSION D'UN RELEVÉ
  const imprimerReleve = (releve: RelevePrimaireAvecMatiere) => {
    const matieres = releve.matieres_parsed || parseMoyennes(releve.moyennes_par_matiere);
    
    const totalNotesCoefficientees = matieres.reduce((total, matiere) => {
      return total + (matiere.note_coefficientee || 0);
    }, 0);
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relevé de notes - ${releve.eleve_prenom} ${releve.eleve_nom}</title>
    <style>
        @media print {
            body {
                margin: 0;
                padding: 0;
                font-family: 'Times New Roman', Times, serif;
            }
            .no-print {
                display: none !important;
            }
            .page-break {
                page-break-after: always;
            }
        }
        
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            padding: 0;
            font-size: 12px;
            line-height: 1.4;
        }
        
        .releve-container {
            border: 2px solid #000;
            padding: 15px;
            max-width: 800px;
            margin: 0 auto;
            background: white;
        }
        
        .entete-ecole {
            text-align: center;
            border-bottom: 3px double #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        
        .nom-ecole {
            font-size: 20px;
            font-weight: bold;
            color: #000;
            margin-bottom: 3px;
            text-transform: uppercase;
        }
        
        .adresse-ecole {
            font-size: 11px;
            color: #000;
            margin-bottom: 2px;
        }
        
        .infos-eleve {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            border: 1px solid #ddd;
            padding: 10px;
            border-radius: 3px;
        }
        
        .section-eleve, .section-scolaire {
            flex: 1;
        }
        
        .section-titre {
            font-weight: bold;
            color: #000;
            margin-bottom: 5px;
            font-size: 12px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 3px;
        }
        
        .info-ligne {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
            font-size: 11px;
        }
        
        .info-label {
            font-weight: bold;
            color: #555;
        }
        
        .info-valeur {
            color: #000;
        }
        
        .tableau-notes {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 11px;
        }
        
        .tableau-notes th {
            background-color: #f5f5f5;
            border: 1px solid #000;
            padding: 6px;
            text-align: center;
            font-weight: bold;
            color: #000;
        }
        
        .tableau-notes td {
            border: 1px solid #ddd;
            padding: 6px;
            text-align: center;
        }
        
        .note-coefficientee {
            font-weight: bold;
            color: #2c3e50;
            background-color: #f8f9fa;
        }
        
        .note-excellente { font-weight: bold; }
        .note-tres-bien { font-weight: bold; }
        .note-bien { font-weight: normal; }
        .note-passable { font-style: italic; }
        .note-insuffisante { color: #666; }
        
        .total-coefficientee {
            margin-top: 10px;
            padding: 8px;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            text-align: right;
            font-weight: bold;
        }
        
        .total-coefficientee span {
            color: #2c3e50;
        }
        
        .totaux {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 2px solid #000;
        }
        
        .moyenne-generale {
            text-align: center;
            flex: 1;
        }
        
        .moyenne-valeur {
            font-size: 24px;
            font-weight: bold;
            color: #000;
        }
        
        .rang-mention {
            text-align: center;
            flex: 1;
        }
        
        .mention {
            font-size: 18px;
            font-weight: bold;
            color: #000;
            margin-top: 8px;
        }
        
        .appreciation {
            margin-top: 15px;
            padding: 10px;
            background-color: #f9f9f9;
            border-radius: 3px;
            border-left: 4px solid #333;
        }
        
        .appreciation-titre {
            font-weight: bold;
            margin-bottom: 5px;
            color: #000;
            font-size: 12px;
        }
        
        .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #000;
        }
        
        .signature {
            text-align: center;
            flex: 1;
        }
        
        .ligne-signature {
            margin-top: 30px;
            border-top: 1px solid #000;
            width: 150px;
            display: inline-block;
        }
        
        .date-generation {
            text-align: right;
            font-size: 10px;
            color: #666;
            margin-top: 15px;
            font-style: italic;
        }
        
        .instructions {
            text-align: center;
            font-size: 10px;
            color: #999;
            margin-top: 5px;
            font-style: italic;
            border-top: 1px dashed #ddd;
            padding-top: 5px;
        }
    </style>
</head>
<body>
    <div class="releve-container">
        <div class="entete-ecole">
  <div class="nom-ecole">${parametresEcole?.nom_ecole || 'ÉCOLE PRIMAIRE'}</div>
  <div class="adresse-ecole">${parametresEcole?.adresse || 'Adresse non définie'}</div>
  <div class="adresse-ecole">Tél: ${parametresEcole?.telephone || ''} ${parametresEcole?.email ? '- Email: ' + parametresEcole.email : ''}</div>
</div>
        
        <div class="infos-eleve">
            <div class="section-eleve">
                <div class="section-titre">SECTION ÉLÈVE</div>
                <div class="info-ligne">
                    <span class="info-label">Nom et Prénom:</span>
                    <span class="info-valeur">${releve.eleve_nom} ${releve.eleve_prenom}</span>
                </div>
                <div class="info-ligne">
                    <span class="info-label">Sexe:</span>
                    <span class="info-valeur">-</span>
                </div>
            </div>
            
            <div class="section-scolaire">
                <div class="section-titre">SECTION SCOLAIRE</div>
                <div class="info-ligne">
                    <span class="info-label">Classe:</span>
                    <span class="info-valeur">${releve.classe_nom}</span>
                </div>
                <div class="info-ligne">
                    <span class="info-label">Matricule:</span>
                    <span class="info-valeur">${releve.matricule || 'N/A'}</span>
                </div>
                <div class="info-ligne">
                    <span class="info-label">Redoublant:</span>
                    <span class="info-valeur">Non</span>
                </div>
            </div>
        </div>
        
        <div style="text-align: center; margin: 15px 0;">
            <h3 style="margin: 0; font-size: 14px;">RELEVÉ DE NOTES</h3>
            <div style="color: #777; font-size: 11px;">
                Période: ${releve.periode_nom}
            </div>
        </div>
        
        <table class="tableau-notes">
            <thead>
                <tr>
                    <th>Matières</th>
                    <th>Coefficients</th>
                    <th>Notes</th>
                    <th>Notes Coéfficientées</th>
                    <th>Sur</th>
                    <th>Appréciations</th>
                </tr>
            </thead>
            <tbody>
                ${matieres.map(matiere => {
                    const classeNote = getClasseNote(matiere.note);
                    const noteCoefficientee = matiere.note_coefficientee || (matiere.note * matiere.coefficient);
                    return `
                        <tr>
                            <td>${matiere.matiere_nom}</td>
                            <td>${matiere.coefficient}</td>
                            <td class="note-${classeNote}">
                                ${matiere.note.toFixed(2)}
                            </td>
                            <td class="note-coefficientee">
                                ${noteCoefficientee.toFixed(2)}
                            </td>
                            <td>${matiere.note_sur}</td>
                            <td>${matiere.appreciation}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
        
        <div class="total-coefficientee">
            Total des notes coéfficientées: <span>${totalNotesCoefficientees.toFixed(2)}</span>
        </div>
        
        <div class="totaux">
            <div class="moyenne-generale">
                <div>MOYENNE GÉNÉRALE</div>
                <div class="moyenne-valeur">${releve.moyenne_generale.toFixed(2)} / 20</div>
            </div>
            
            <div class="rang-mention">
                <div>RANG: ${releve.rang}${releve.rang === 1 ? 'er' : 'ème'}</div>
                <div class="mention">${releve.mention.toUpperCase()}</div>
            </div>
        </div>
        
        <div class="appreciation">
            <div class="appreciation-titre">APPRÉCIATION GÉNÉRALE</div>
            <div>${releve.appreciation_generale}</div>
        </div>
        
        <div class="signatures">
            <div class="signature">
                <div>Le Directeur</div>
                <div class="ligne-signature"></div>
            </div>
            
            <div class="signature">
                <div>L'Instituteur</div>
                <div class="ligne-signature"></div>
            </div>
        </div>
        
        <div class="date-generation">
            Généré le ${new Date(releve.date_generation).toLocaleDateString('fr-FR')}
        </div>
        
        <div class="instructions no-print">
            Pour imprimer: Ctrl+P ou Fichier > Imprimer | Pour fermer: Fermer cet onglet
        </div>
    </div>
</body>
</html>`;
    
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      printWindow.onload = function() {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    }
  };

  // FONCTION POUR AFFICHER L'ICÔNE DE STATUT
  const getStatutIcon = (releveId: number) => {
    const statut = statutsEnvoi[releveId];
    if (!statut) return null;
    
    switch (statut.statut) {
      case 'en_cours':
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        );
      case 'succes':
        return (
          <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
            <div className="h-2 w-2 bg-white rounded-full"></div>
          </div>
        );
      case 'echec':
        return (
          <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
            <div className="h-2 w-2 bg-white rounded-full"></div>
          </div>
        );
      case 'pas_de_contact':
        return (
          <div className="h-4 w-4 rounded-full bg-yellow-500 flex items-center justify-center">
            <div className="h-2 w-2 bg-white rounded-full"></div>
          </div>
        );
      default:
        return null;
    }
  };

  // Charger les données au montage
  useEffect(() => {
  if (isOpen) {
    fetchReleves();
    chargerParametresEcole(); 
  }
}, [isOpen]);

  // Gérer la fermeture avec ESC
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showReleveDetail) {
          fermerReleveDetaille();
        } else {
          onClose();
        }
      }
    };

    if (isOpen || showReleveDetail) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, showReleveDetail, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Modal principale */}
      <div className="modal-overlay">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <FileText className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Tous les relevés</h2>
                  <p className="text-blue-100 opacity-90">
                    {releves.length} relevés générés • {filteredReleves.length} filtrés
                    {selectedReleves.size > 0 && ` • ${selectedReleves.size} sélectionné(s)`}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-all"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Filtres */}
          <div className="p-6 border-b">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un élève..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={selectedClasse}
                  onChange={(e) => setSelectedClasse(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white"
                >
                  <option value="toutes">Toutes les classes</option>
                  {classes.map((classe) => (
                    <option key={classe} value={classe}>
                      {classe}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={selectedPeriode}
                  onChange={(e) => setSelectedPeriode(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white"
                >
                  <option value="toutes">Toutes les périodes</option>
                  {periodes.map((periode) => (
                    <option key={periode} value={periode}>
                      {periode}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={fetchReleves}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Actualiser
              </button>
            </div>
          </div>

          {/* Liste des relevés */}
          <div className="flex-1 overflow-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Chargement des relevés...</p>
                </div>
              </div>
            ) : filteredReleves.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <FileText className="h-20 w-20 mb-4 opacity-50" />
                <p className="text-xl font-semibold">Aucun relevé trouvé</p>
                <p className="text-gray-400">Ajustez vos filtres pour voir les résultats</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {/* COLONNE SÉLECTION */}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">
                        <button
                          onClick={toggleSelectionTous}
                          className="flex items-center justify-center focus:outline-none"
                          title={selectedReleves.size === filteredReleves.length ? "Tout désélectionner" : "Tout sélectionner"}
                        >
                          {selectedReleves.size === filteredReleves.length ? (
                            <CheckSquare className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Square className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Élève
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Classe
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Période
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Performance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredReleves.map((releve) => {
                      const estSelectionne = selectedReleves.has(releve.id);
                      
                      return (
                        <tr 
                          key={releve.id} 
                          className={`hover:bg-gray-50 ${estSelectionne ? 'bg-blue-50' : ''}`}
                        >
                          {/* CASE À COCHER */}
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={estSelectionne}
                                onChange={() => toggleSelectionReleve(releve.id)}
                                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </div>
                          </td>
                          
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold mr-3">
                                {(releve.eleve_nom?.charAt(0) || '')}{(releve.eleve_prenom?.charAt(0) || '')}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {releve.eleve_nom} {releve.eleve_prenom}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {releve.matricule}
                                </div>
                                {statutsEnvoi[releve.id] && (
                                  <div className="mt-1 flex items-center gap-2">
                                    {getStatutIcon(releve.id)}
                                    <span className={`text-xs ${
                                      statutsEnvoi[releve.id].statut === 'succes' ? 'text-green-600' :
                                      statutsEnvoi[releve.id].statut === 'echec' ? 'text-red-600' :
                                      statutsEnvoi[releve.id].statut === 'pas_de_contact' ? 'text-yellow-600' :
                                      'text-blue-600'
                                    }`}>
                                      {statutsEnvoi[releve.id].statut === 'en_cours' && 'Envoi en cours...'}
                                      {statutsEnvoi[releve.id].statut === 'succes' && 'Envoyé ✓'}
                                      {statutsEnvoi[releve.id].statut === 'echec' && 'Échec ✗'}
                                      {statutsEnvoi[releve.id].statut === 'pas_de_contact' && 'Pas de contact'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                              {releve.classe_nom}
                            </span>
                          </td>
                          
                          <td className="px-6 py-4 text-gray-700">
                            {releve.periode_nom}
                          </td>
                          
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <div className="text-sm font-bold text-gray-900">
                                  {releve.moyenne_generale?.toFixed(2) || '0.00'}/20
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                  getClasseMention(releve.mention) === 'excellent' ? 'bg-green-100 text-green-800' :
                                  getClasseMention(releve.mention) === 'tres-bien' ? 'bg-blue-100 text-blue-800' :
                                  getClasseMention(releve.mention) === 'bien' ? 'bg-indigo-100 text-indigo-800' :
                                  getClasseMention(releve.mention) === 'assez-bien' ? 'bg-yellow-100 text-yellow-800' :
                                  getClasseMention(releve.mention) === 'passable' ? 'bg-orange-100 text-orange-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {releve.mention}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="px-2 py-0.5 bg-gray-100 rounded">
                                  Rang: {releve.rang}{releve.rang === 1 ? 'er' : 'ème'}
                                </span>
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => ouvrirReleveDetaille(releve)}
                                className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                                title="Voir le relevé"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              
                              <button
                                onClick={() => {
                                  const releveAvecMatiere = {
                                    ...releve,
                                    matieres_parsed: parseMoyennes(releve.moyennes_par_matiere)
                                  };
                                  imprimerReleve(releveAvecMatiere as any);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                                title="Imprimer le relevé"
                              >
                                <Printer className="h-4 w-4" />
                              </button>
                              
                              <button
                                onClick={() => envoyerParWhatsApp(releve)}
                                className="p-2 hover:bg-green-50 rounded-lg text-green-600 transition-colors group relative"
                                title="Envoyer par WhatsApp"
                              >
                                <MessageCircle className="h-4 w-4" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                  Envoyer par WhatsApp
                                </div>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t p-6 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {selectedReleves.size > 0 && ` ${selectedReleves.size} sélectionné(s)`}
              </div>
              
              <div className="flex gap-3">
                {selectedReleves.size > 0 && (
                  <button
                    onClick={envoyerMultiplesWhatsApp}
                    disabled={envoiEnCours}
                    className={`px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:opacity-90 transition-all font-medium flex items-center gap-2 ${
                      envoiEnCours ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {envoiEnCours ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="h-4 w-4" />
                        Envoyer WhatsApp ({selectedReleves.size})
                      </>
                    )}
                  </button>
                )}
                
                <button
                  onClick={imprimerTousReleves}
                  disabled={printingAll || filteredReleves.length === 0}
                  className={`px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:opacity-90 transition-all font-medium flex items-center gap-2 ${printingAll || filteredReleves.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {printingAll ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Préparation...
                    </>
                  ) : (
                    <>
                      <Printer className="h-4 w-4" />
                      Imprimer tout ({filteredReleves.length})
                    </>
                  )}
                </button>
                
                <button
                  onClick={exporterTousReleves}
                  disabled={exporting || filteredReleves.length === 0}
                  className={`px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:opacity-90 transition-all font-medium flex items-center gap-2 ${exporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {exporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Export...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Exporter tout ({filteredReleves.length})
                    </>
                  )}
                </button>
                
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedReleves.size > 0 && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="font-semibold text-blue-800">
                {selectedReleves.size} relevé(s) sélectionné(s)
              </div>
              <button
                onClick={() => setSelectedReleves(new Set())}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Tout désélectionner
              </button>
            </div>
            <button
              onClick={envoyerMultiplesWhatsApp}
              disabled={envoiEnCours}
              className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 ${
                envoiEnCours ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {envoiEnCours ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <MessageCircle className="h-4 w-4" />
                  Envoyer par WhatsApp ({selectedReleves.size})
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modal de détail du relevé */}
      {showReleveDetail && selectedReleve && (
        <ModalReleveDetail
          releve={selectedReleve}
          onClose={fermerReleveDetaille}
          parseMoyennes={parseMoyennes}
          getClasseNote={getClasseNote}
          getClasseMention={getClasseMention}
          obtenirCouleurNote={obtenirCouleurNote}
          genererAppreciationAuto={genererAppreciationAuto}
          imprimerReleve={imprimerReleve}
        />
      )}
    </>
  );
}

// Composant modal pour afficher le détail d'un relevé
function ModalReleveDetail({ 
  releve, 
  onClose, 
  parseMoyennes,
  getClasseNote,
  getClasseMention,
  obtenirCouleurNote,
  genererAppreciationAuto,
  imprimerReleve
}: { 
  releve: RelevePrimaireAvecMatiere; 
  onClose: () => void;
  parseMoyennes: (data: any) => MatiereNote[];
  getClasseNote: (note: number | string) => string;
  getClasseMention: (mention: string) => string;
  obtenirCouleurNote: (note: number) => string;
  genererAppreciationAuto: (note: number) => string;
  imprimerReleve: (releve: RelevePrimaireAvecMatiere) => void;
}) {
  const matieres = releve.matieres_parsed || parseMoyennes(releve.moyennes_par_matiere);
  const [chargementNotes, setChargementNotes] = useState(false);
  const [matieresAvecNotes, setMatieresAvecNotes] = useState<MatiereNote[]>(matieres);

  // Calculer le total des notes coéfficientées
  const totalNotesCoefficientees = matieresAvecNotes.reduce((total, matiere) => {
    return total + (matiere.note_coefficientee || 0);
  }, 0);

  useEffect(() => {
    if (matieres.length === 0 && releve.eleve_id && releve.periode_id) {
      const chargerNotesAPI = async () => {
        try {
          setChargementNotes(true);
          const response = await fetch(
            `/api/notes-primaires?eleve_id=${releve.eleve_id}&periode_id=${releve.periode_id}`
          );
          const data = await response.json();
          
          if (data.success && data.notes && Array.isArray(data.notes)) {
            const notesFormatees = data.notes.map((note: any) => {
              const noteValue = parseFloat(note.note) || 0;
              const coefficientValue = note.coefficient || 1;
              const noteCoefficientee = noteValue * coefficientValue;
              
              return {
                matiere_id: note.matiere_id || 0,
                matiere_nom: note.matiere_nom || 'Matière inconnue',
                coefficient: coefficientValue,
                note: noteValue,
                note_sur: note.note_sur || 20,
                appreciation: note.appreciation || genererAppreciationAuto(noteValue),
                note_coefficientee: noteCoefficientee
              };
            });
            
            setMatieresAvecNotes(notesFormatees);
          }
        } catch (error) {
          console.error('Erreur chargement notes:', error);
        } finally {
          setChargementNotes(false);
        }
      };
      
      chargerNotesAPI();
    }
  }, [matieres.length, releve.eleve_id, releve.periode_id, genererAppreciationAuto]);

  const matieresAffichees = matieresAvecNotes.length > 0 ? matieresAvecNotes : matieres;

  return (
    <div className="modal-overlay">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Eye className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Relevé de notes</h2>
                <p className="text-blue-100">
                  {releve.eleve_prenom} {releve.eleve_nom} - {releve.classe_nom}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-all"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {/* Informations générales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="font-bold text-gray-700 mb-4">SECTION ÉLÈVE</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nom et Prénom:</span>
                    <span className="font-semibold">{releve.eleve_nom} {releve.eleve_prenom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Matricule:</span>
                    <span className="font-medium">{releve.matricule}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="font-bold text-gray-700 mb-4">SECTION SCOLAIRE</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Classe:</span>
                    <span className="font-medium">{releve.classe_nom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Période:</span>
                    <span className="font-medium">{releve.periode_nom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date génération:</span>
                    <span className="font-medium">
                      {new Date(releve.date_generation).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tableau des notes AVEC COLONNE NOTES COÉFFICIENTÉES */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-700 text-lg">Notes par matière</h3>
                <div className="text-sm text-gray-500">
                  {matieresAffichees.length} matière{matieresAffichees.length !== 1 ? 's' : ''}
                  {chargementNotes && <span className="ml-2 text-blue-500">(chargement...)</span>}
                </div>
              </div>
              
              {matieresAffichees.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <div className="text-gray-400 mb-2">📝</div>
                  <p className="text-gray-500 mb-2">Aucune matière disponible pour cet élève</p>
                  <p className="text-sm text-gray-400">
                    Les données des matières n'ont pas été sauvegardées dans le relevé
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Matière</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Coefficient</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Note</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Note Coéfficientée</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Sur</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Appréciation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {matieresAffichees.map((matiere, index) => {
                        const noteNum = matiere.note || 0;
                        const noteSur = matiere.note_sur || 20;
                        const noteClasse = getClasseNote(noteNum);
                        const appreciation = matiere.appreciation || genererAppreciationAuto(noteNum);
                        const noteCoefficientee = matiere.note_coefficientee || (noteNum * matiere.coefficient);
                        
                        const getAppreciationColor = () => {
                          if (noteNum >= 16) return 'bg-green-100 text-green-800 border-green-200';
                          if (noteNum >= 14) return 'bg-blue-100 text-blue-800 border-blue-200';
                          if (noteNum >= 12) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
                          if (noteNum >= 10) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                          if (noteNum >= 8) return 'bg-orange-100 text-orange-800 border-orange-200';
                          return 'bg-red-100 text-red-800 border-red-200';
                        };
                        
                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">{matiere.matiere_nom}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">
                                {matiere.coefficient}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <span 
                                  className="text-xl font-bold"
                                  style={{ color: obtenirCouleurNote(noteNum) }}
                                >
                                  {noteNum.toFixed(2)}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${getAppreciationColor()}`}>
                                  {appreciation}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-lg font-bold text-blue-700">
                                {noteCoefficientee.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {noteSur}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-center">
                                <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-bold ${
                                  noteNum >= 16 ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' :
                                  noteNum >= 14 ? 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-200' :
                                  noteNum >= 12 ? 'bg-gradient-to-r from-indigo-100 to-violet-100 text-indigo-800 border border-indigo-200' :
                                  noteNum >= 10 ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200' :
                                  noteNum >= 8 ? 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border border-orange-200' :
                                  'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200'
                                }`}>
                                  {noteNum >= 16 ? 'Excellent' :
                                   noteNum >= 14 ? 'Très bien' :
                                   noteNum >= 12 ? 'Bien' :
                                   noteNum >= 10 ? 'Assez bien' :
                                   noteNum >= 8 ? 'Passable' :
                                   'Insuffisant'}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              
              {matieresAffichees.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-blue-800">Total des notes coéfficientées:</span>
                    <span className="text-2xl font-bold text-blue-700">
                      {totalNotesCoefficientees.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Résultats généraux */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">MOYENNE GÉNÉRALE</div>
                  <div className="text-5xl font-bold text-blue-600 mb-2">
                    {releve.moyenne_generale?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-gray-600">sur 20</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">RANG ET MENTION</div>
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {releve.rang}{releve.rang === 1 ? 'er' : 'ème'}
                  </div>
                  <div className={`text-2xl font-bold px-4 py-2 rounded-lg ${
                    getClasseMention(releve.mention) === 'excellent' ? 'bg-green-100 text-green-800' :
                    getClasseMention(releve.mention) === 'tres-bien' ? 'bg-blue-100 text-blue-800' :
                    getClasseMention(releve.mention) === 'bien' ? 'bg-indigo-100 text-indigo-800' :
                    getClasseMention(releve.mention) === 'assez-bien' ? 'bg-yellow-100 text-yellow-800' :
                    getClasseMention(releve.mention) === 'passable' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {releve.mention}
                  </div>
                </div>
              </div>
            </div>

            {/* Appréciation générale */}
            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="font-bold text-gray-700 mb-3">Appréciation générale</h3>
              <div className="p-4 bg-white rounded-lg border">
                <p className="text-gray-700 leading-relaxed italic">
                  "{releve.appreciation_generale}"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50">
          <div className="flex justify-between gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Fermer
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={() => imprimerReleve(releve)}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Imprimer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}