'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import '@/app/components/GestionNotesPrimaire.css';
import { Printer, Download, Home, ChevronLeft, Loader2, Calculator, BookOpen } from 'lucide-react';

interface MatiereNote {
  matiere_id: number;
  matiere_nom: string;
  coefficient: number;
  note: number;
  note_sur: number;
  note_coefficientee?: number;
  appreciation: string;
  couleur?: string;
  icone?: string;
}

interface ParametresEcole {
  nom_ecole: string;
  adresse: string;
  telephone: string;
  email: string;
  logo_url: string;
  couleur_principale: string;
}

interface Releve {
  id: number;
  eleve_id: number;
  matricule: string;
  eleve_nom: string;
  eleve_prenom: string;
  classe_id: number;
  classe_nom: string;
  periode_id: number;
  periode_nom: string;
  moyennes_par_matiere: MatiereNote[];
  moyenne_generale: number;
  rang: number;
  mention: string;
  appreciation_generale: string;
  date_generation: string;
  telephone_parent: string;
  email_parents: string;
  genre: string;
  date_naissance: string;
  lieu_naissance: string;
  nom_pere: string;
  nom_mere: string;
}

// Interface pour les relevés de la classe
interface ReleveClasse {
  id: number;
  eleve_id: number;
  moyenne_generale: number;
  eleve_nom: string;
  eleve_prenom: string;
  classe_id: number;
}

export default function PageReleve() {
  const params = useParams();
  const router = useRouter();
  const [releve, setReleve] = useState<Releve | null>(null);
  const [matieres, setMatieres] = useState<MatiereNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // NOUVEAU : État pour stocker les relevés de la classe et la moyenne
  const [relevesClasse, setRelevesClasse] = useState<ReleveClasse[]>([]);
  const [moyenneClasse, setMoyenneClasse] = useState<number>(0);
  const [totalElevesClasse, setTotalElevesClasse] = useState<number>(0);
  const [parametresEcole, setParametresEcole] = useState<ParametresEcole | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // Fonction pour générer une appréciation automatique
  const genererAppreciationAuto = (note: number): string => {
    if (note >= 18) return 'Excellent';
    if (note >= 16) return 'Très bien';
    if (note >= 14) return 'Bien';
    if (note >= 12) return 'Assez bien';
    if (note >= 10) return 'Passable';
    if (note >= 8) return 'Insuffisant';
    return 'Très insuffisant';
  };

  // Fonction pour obtenir la couleur d'une note
  const getNoteColor = (note: number): string => {
    if (note >= 16) return 'text-green-600';
    if (note >= 14) return 'text-blue-600';
    if (note >= 12) return 'text-indigo-600';
    if (note >= 10) return 'text-yellow-600';
    if (note >= 8) return 'text-orange-600';
    return 'text-red-600';
  };

  // Fonction pour obtenir la couleur de fond d'une note
  const getNoteBgColor = (note: number): string => {
    if (note >= 16) return 'bg-green-600';
    if (note >= 14) return 'bg-blue-600';
    if (note >= 12) return 'bg-indigo-600';
    if (note >= 10) return 'bg-yellow-600';
    if (note >= 8) return 'bg-orange-600';
    return 'bg-red-600';
  };

  // Fonction pour obtenir la classe CSS d'une mention
  const getMentionClass = (mention: string): string => {
    if (mention?.includes('Félicitations') || mention?.includes('Excellent')) return 'bg-green-100 text-green-800';
    if (mention?.includes('Très bien')) return 'bg-blue-100 text-blue-800';
    if (mention?.includes('Bien')) return 'bg-indigo-100 text-indigo-800';
    if (mention?.includes('Assez bien')) return 'bg-yellow-100 text-yellow-800';
    if (mention?.includes('Passable')) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  // Fonction pour récupérer les matières séparément si nécessaire
  const fetchMatieresSeparement = async (eleveId: number, periodeId: number) => {
    if (!eleveId || !periodeId) return [];
    
    try {
      console.log(`🔍 Récupération notes pour élève ${eleveId}, période ${periodeId}`);
      
      const response = await fetch(
        `/api/notes-primaires?eleve_id=${eleveId}&periode_id=${periodeId}`
      );
      const data = await response.json();
      
      if (data.success && data.notes && Array.isArray(data.notes)) {
        console.log(`📊 ${data.notes.length} notes récupérées`);
        
        // Transformer les notes en matières
        const matieresFormatees = data.notes.map((note: any) => {
          const noteValue = parseFloat(note.note) || 0;
          const coefficient = parseFloat(note.coefficient) || 1;
          const noteCoefficientee = noteValue * coefficient;
          const noteSur = parseFloat(note.note_sur) || 20;
          
          return {
            matiere_id: note.matiere_id || 0,
            matiere_nom: note.matiere_nom || 'Matière inconnue',
            coefficient: coefficient,
            note: noteValue,
            note_sur: noteSur,
            note_coefficientee: noteCoefficientee,
            appreciation: note.appreciation || genererAppreciationAuto(noteValue),
            couleur: note.couleur || '#3B82F6',
            icone: note.icone || '📚'
          };
        });
        
        return matieresFormatees;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Erreur récupération matières:', error);
      return [];
    }
  };

  // Fonction pour récupérer les matières détaillées
  const fetchMatieresDetaillees = async (eleveId: number, periodeId: number): Promise<MatiereNote[]> => {
    try {
      console.log(`🔍 Récupération détaillée des matières: élève ${eleveId}, période ${periodeId}`);
      
      // Essayer d'abord l'API des notes
      const response = await fetch(`/api/notes-primaires?eleve_id=${eleveId}&periode_id=${periodeId}`);
      const data = await response.json();
      
      if (data.success && data.notes && Array.isArray(data.notes)) {
        console.log(`✅ ${data.notes.length} notes récupérées depuis notes-primaires`);
        
        return data.notes.map((note: any) => {
          const noteValue = parseFloat(note.note) || 0;
          const coefficient = parseFloat(note.coefficient) || 1;
          const noteCoefficientee = noteValue * coefficient;
          const noteSur = parseFloat(note.note_sur) || 20;
          
          return {
            matiere_id: note.matiere_id || 0,
            matiere_nom: note.matiere_nom || 'Matière inconnue',
            coefficient: coefficient,
            note: noteValue,
            note_sur: noteSur,
            note_coefficientee: noteCoefficientee,
            appreciation: note.appreciation || genererAppreciationAuto(noteValue),
            couleur: note.couleur || '#3B82F6',
            icone: note.icone || '📚'
          };
        });
      }
      
      // Si pas de notes, essayer une requête directe aux matières
      const matieresResponse = await fetch(`/api/matieres-primaires?niveau=primaire`);
      const matieresData = await matieresResponse.json();
      
      if (matieresData.success && matieresData.matieres) {
        console.log(`📚 ${matieresData.matieres.length} matières disponibles`);
        
        // Retourner les matières avec des valeurs par défaut
        return matieresData.matieres.map((matiere: any) => ({
          matiere_id: matiere.id,
          matiere_nom: matiere.nom,
          coefficient: parseFloat(matiere.coefficient) || 1,
          note: 0,
          note_sur: parseFloat(matiere.note_sur) || 20,
          note_coefficientee: 0,
          appreciation: 'Non noté',
          couleur: matiere.couleur || '#3B82F6',
          icone: matiere.icone || '📚'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('❌ Erreur récupération détaillée:', error);
      return [];
    }
  };

  // FONCTION POUR RÉCUPÉRER LES RELEVÉS DE TOUTE LA CLASSE
  const fetchRelevesClasse = async (classeId: number, periodeId: number): Promise<ReleveClasse[]> => {
    try {
      console.log(`📊 Récupération des relevés de la classe ${classeId}, période ${periodeId}`);
      
      const response = await fetch(`/api/releves-primaires?classe_id=${classeId}&periode_id=${periodeId}`);
      const data = await response.json();
      
      if (data.success && data.releves && Array.isArray(data.releves)) {
        console.log(`✅ ${data.releves.length} relevés récupérés pour la classe`);
        
        return data.releves.map((r: any) => ({
          id: r.id,
          eleve_id: r.eleve_id,
          moyenne_generale: parseFloat(r.moyenne_generale) || 0,
          eleve_nom: r.eleve_nom || '',
          eleve_prenom: r.eleve_prenom || '',
          classe_id: r.classe_id || 0
        }));
      }
      
      return [];
    } catch (error) {
      console.error('❌ Erreur récupération relevés classe:', error);
      return [];
    }
  };

  // FONCTION POUR RÉCUPÉRER LE NOMBRE TOTAL D'ÉLÈVES DE LA CLASSE
  const fetchTotalElevesClasse = async (classeId: number): Promise<number> => {
    try {
      console.log(`👥 Récupération du nombre d'élèves de la classe ${classeId}`);
      
      const response = await fetch(`/api/eleves?classe_id=${classeId}`);
      const data = await response.json();
      
      if (data.success && data.eleves && Array.isArray(data.eleves)) {
        console.log(`✅ ${data.eleves.length} élèves dans la classe`);
        return data.eleves.length;
      }
      
      return 0;
    } catch (error) {
      console.error('❌ Erreur récupération nombre élèves:', error);
      return 0;
    }
  };

  // FONCTION POUR CALCULER LA MOYENNE GÉNÉRALE DE LA CLASSE
  const calculerMoyenneGeneraleClasse = (releves: ReleveClasse[], totalEleves: number, classeId: number): number => {
    if (totalEleves === 0) return 0;
    
    // Filtrer uniquement les relevés de la même classe
    const relevesMemeClasse = releves.filter(r => r.classe_id === classeId);
    
    // Si on a des relevés pour tous les élèves de la même classe
    if (relevesMemeClasse.length === totalEleves) {
      const sommeMoyennes = relevesMemeClasse.reduce((total, r) => total + r.moyenne_generale, 0);
      return parseFloat((sommeMoyennes / totalEleves).toFixed(2));
    }
    
    // Si on n'a pas de relevés pour tous les élèves, on calcule sur ceux qu'on a
    if (relevesMemeClasse.length > 0) {
      const sommeMoyennes = relevesMemeClasse.reduce((total, r) => total + r.moyenne_generale, 0);
      return parseFloat((sommeMoyennes / relevesMemeClasse.length).toFixed(2));
    }
    
    return 0;
  };

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

  // Modifiez le useEffect principal
  useEffect(() => {
    const fetchReleve = async () => {
      try {
        setLoading(true);
        setError('');
        chargerParametresEcole(); 
        
        console.log('🔄 Chargement du relevé ID:', params.id);
        
        const response = await fetch(`/api/releves-primaires/${params.id}`);
        const data = await response.json();
        
        console.log('📊 Réponse API:', data);
        
        if (data.success) {
          const releveData = data.releve;
          
          // Vérifier si nous avons des matières
          let matieresFinales: MatiereNote[] = [];
          
          if (releveData.moyennes_par_matiere && Array.isArray(releveData.moyennes_par_matiere) && releveData.moyennes_par_matiere.length > 0) {
            // Utiliser les matières de l'API
            matieresFinales = releveData.moyennes_par_matiere.map((matiere: any) => {
              const note = parseFloat(matiere.note) || 0;
              const coefficient = parseFloat(matiere.coefficient) || 1;
              const noteCoefficientee = note * coefficient;
              const noteSur = parseFloat(matiere.note_sur) || 20;
              
              return {
                matiere_id: matiere.matiere_id || 0,
                matiere_nom: matiere.matiere_nom || 'Matière',
                coefficient: coefficient,
                note: note,
                note_sur: noteSur,
                note_coefficientee: noteCoefficientee,
                appreciation: matiere.appreciation || genererAppreciationAuto(note),
                couleur: matiere.couleur || '#3B82F6',
                icone: matiere.icone || '📚'
              };
            });
          } else if (releveData.eleve_id && releveData.periode_id) {
            // Récupérer les matières détaillées
            console.log('🔄 Récupération détaillée des matières...');
            matieresFinales = await fetchMatieresDetaillees(releveData.eleve_id, releveData.periode_id);
          }
          
          console.log(`📊 ${matieresFinales.length} matières chargées`);
          
          setReleve(releveData);
          setMatieres(matieresFinales);
          
          // RÉCUPÉRER LES DONNÉES DE LA CLASSE POUR CALCULER LA MOYENNE
          if (releveData.classe_id && releveData.periode_id) {
            console.log('📈 Calcul de la moyenne de la classe...');
            
            // 1. Récupérer les relevés de toute la classe
            const releves = await fetchRelevesClasse(releveData.classe_id, releveData.periode_id);
            setRelevesClasse(releves);
            
            // 2. Récupérer le nombre total d'élèves dans la classe
            const totalEleves = await fetchTotalElevesClasse(releveData.classe_id);
            setTotalElevesClasse(totalEleves);
            
            // 3. Calculer la moyenne générale de la classe
            const moyenne = calculerMoyenneGeneraleClasse(releves, totalEleves, releveData.classe_id);
            setMoyenneClasse(moyenne);
            
            console.log(`📊 Statistiques classe: 
              - Moyenne classe: ${moyenne}/20
              - Relevés disponibles: ${releves.length}/${totalEleves}
              - Classe: ${releveData.classe_nom}`);
          }
        } else {
          setError(data.error || 'Erreur lors du chargement du relevé');
        }
      } catch (err: any) {
        console.error('❌ Erreur fetch:', err);
        setError('Erreur de connexion au serveur');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchReleve();
    }
  }, [params.id]);

  // Fonction d'impression CORRIGÉE
  const imprimerReleve = () => {
    setIsPrinting(true);
    
    // Préparer le contenu HTML pour l'impression
    const printContent = document.getElementById('releve-content-print');
    if (!printContent) {
      console.error('❌ Élément #releve-content-print non trouvé');
      setIsPrinting(false);
      return;
    }
    
    // Créer une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Veuillez autoriser les fenêtres popup pour imprimer le relevé.');
      setIsPrinting(false);
      return;
    }
    
    // Créer le contenu HTML complet
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relevé de notes - ${releve?.eleve_prenom} ${releve?.eleve_nom}</title>
        <style>
          /* Réinitialisation complète des marges */
          @page {
            margin: 0 !important;
            padding: 0 !important;
            size: auto;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            margin: 0 !important;
            padding: 5mm !important;
            background: white !important;
            width: 100% !important;
          }
          
          .releve-container {
            width: 100% !important;
            max-width: none !important;
            margin: 0 auto !important;
            padding: 0 !important;
            background: white !important;
          }
          
          .entete {
            text-align: center;
            margin-bottom: 8px;
            padding-bottom: 4px;
            border-bottom: 1px solid #ccc;
          }
          
          .nom-ecole {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 4px;
          }
          
          .infos-eleve-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          
          .infos-card {
            flex: 1;
            border: 1px solid #ddd;
            padding: 6px;
            border-radius: 4px;
            margin: 0 4px;
          }
          
          .infos-title {
            font-weight: bold;
            margin-bottom: 4px;
            font-size: 12px;
          }
          
          .infos-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
            font-size: 11px;
          }
          
          .tableau-notes {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0;
            font-size: 11px;
          }
          
          .tableau-notes th {
            background-color: #f5f5f5;
            border: 1px solid #000;
            padding: 4px;
            text-align: center;
            font-weight: bold;
          }
          
          .tableau-notes td {
            border: 1px solid #ddd;
            padding: 4px;
            text-align: center;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 4px;
            margin: 8px 0;
          }
          
          .stat-card {
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 6px;
            text-align: center;
          }
          
          .stat-label {
            font-size: 10px;
            font-weight: bold;
            margin-bottom: 2px;
          }
          
          .stat-value {
            font-size: 14px;
            font-weight: bold;
          }
          
          .pied-page {
            text-align: center;
            margin-top: 12px;
            padding-top: 4px;
            border-top: 1px solid #ccc;
            font-size: 10px;
            color: #666;
          }
          
          /* Classes de couleurs pour les notes */
          .text-green-600 { color: #10B981; }
          .text-blue-600 { color: #3B82F6; }
          .text-indigo-600 { color: #6366F1; }
          .text-yellow-600 { color: #F59E0B; }
          .text-orange-600 { color: #F97316; }
          .text-red-600 { color: #EF4444; }
          
          .bg-green-100 { background-color: #D1FAE5; }
          .bg-blue-100 { background-color: #DBEAFE; }
          .bg-indigo-100 { background-color: #E0E7FF; }
          .bg-yellow-100 { background-color: #FEF3C7; }
          .bg-orange-100 { background-color: #FFEDD5; }
          .bg-red-100 { background-color: #FEE2E2; }
          
          .text-green-800 { color: #065F46; }
          .text-blue-800 { color: #1E40AF; }
          .text-indigo-800 { color: #3730A3; }
          .text-yellow-800 { color: #92400E; }
          .text-orange-800 { color: #9A3412; }
          .text-red-800 { color: #991B1B; }
          
          .bg-blue-50 { background-color: #EFF6FF; }
          .bg-green-50 { background-color: #F0FDF4; }
          .bg-purple-50 { background-color: #FAF5FF; }
          
          .border-blue-200 { border-color: #BFDBFE; }
          .border-green-200 { border-color: #BBF7D0; }
          .border-purple-200 { border-color: #E9D5FF; }
          
          .rounded-lg { border-radius: 8px; }
          .rounded-full { border-radius: 9999px; }
          
          .font-semibold { font-weight: 600; }
          .font-bold { font-weight: bold; }
          .italic { font-style: italic; }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `;
    
    // Écrire le contenu dans la nouvelle fenêtre
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Attendre que le contenu soit chargé puis imprimer
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        
        // Fermer la fenêtre après impression (optionnel)
        setTimeout(() => {
          printWindow.close();
          setIsPrinting(false);
        }, 1000);
      }, 500);
    };
  };

  // Fonction de téléchargement PDF
  const telechargerPDF = () => {
    // Pour le téléchargement PDF, nous utilisons la même fonction d'impression
    imprimerReleve();
  };

  // Affichage du chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4">
            <Loader2 className="h-12 w-12 text-blue-600" />
          </div>
          <p className="text-gray-600">Chargement du relevé...</p>
          <p className="text-sm text-gray-400 mt-2">ID: {params.id}</p>
        </div>
      </div>
    );
  }

  // Affichage des erreurs
  if (error || !releve) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-6">{error || 'Relevé non trouvé'}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calcul des totaux
  const totalCoefficients = matieres.reduce((total, matiere) => total + matiere.coefficient, 0);
  const totalNotesCoefficientees = matieres.reduce((total, matiere) => {
    const noteCoefficientee = matiere.note_coefficientee || (matiere.note * matiere.coefficient);
    return total + noteCoefficientee;
  }, 0);

  // Fonction pour rendre le tableau des notes
  const renderTableauNotes = () => {
    if (matieres.length === 0) {
      return (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-gray-400 text-5xl mb-4">📝</div>
          <p className="text-gray-500">Aucune note disponible pour cette période</p>
          <button
            onClick={async () => {
              if (releve?.eleve_id && releve?.periode_id) {
                const matieresDetaillees = await fetchMatieresDetaillees(releve.eleve_id, releve.periode_id);
                if (matieresDetaillees.length > 0) {
                  setMatieres(matieresDetaillees);
                } else {
                  alert('Impossible de récupérer les matières. Vérifiez que les notes ont été saisies.');
                }
              }
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Essayer de récupérer les matières
          </button>
        </div>
      );
    }

    return (
      <>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left font-semibold text-gray-700 border-b">Matière</th>
                <th className="p-3 text-center font-semibold text-gray-700 border-b">Coefficient</th>
                <th className="p-3 text-center font-semibold text-gray-700 border-b">Note</th>
                <th className="p-3 text-center font-semibold text-gray-700 border-b">Note × Coef</th>
                <th className="p-3 text-center font-semibold text-gray-700 border-b">Sur</th>
                <th className="p-3 text-center font-semibold text-gray-700 border-b">Appréciation</th>
              </tr>
            </thead>
            <tbody>
              {matieres.map((matiere, index) => {
                const noteCoefficientee = matiere.note_coefficientee || (matiere.note * matiere.coefficient);
                const noteColor = getNoteColor(matiere.note);
                const noteBgColor = getNoteBgColor(matiere.note);
                const pourcentage = (matiere.note / matiere.note_sur) * 100;
                
                return (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">
                      <div className="flex items-center">
                        <div 
                          className="w-2 h-2 rounded-full mr-2" 
                          style={{ backgroundColor: matiere.couleur || '#3B82F6' }}
                        />
                        <span>{matiere.matiere_nom}</span>
                      </div>
                    </td>
                    <td className="text-center">
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">
                        {matiere.coefficient}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-xl font-bold ${noteColor}`}>
                          {matiere.note.toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-blue-700 text-lg">
                          {noteCoefficientee.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-500">
                        </span>
                      </div>
                    </td>
                    <td className="text-center text-gray-600">
                      {matiere.note_sur}
                    </td>
                    <td className="text-center">
                      <span className={`px-3 py-1 rounded text-sm font-medium ${
                        matiere.note >= 16 ? 'bg-green-100 text-green-800' :
                        matiere.note >= 14 ? 'bg-blue-100 text-blue-800' :
                        matiere.note >= 12 ? 'bg-indigo-100 text-indigo-800' :
                        matiere.note >= 10 ? 'bg-yellow-100 text-yellow-800' :
                        matiere.note >= 8 ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {matiere.appreciation}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Totaux et calculs */}
        <div className="space-y-1">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-0">
            <div className="p-1 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex flex-col">
                <span className="font-semibold text-blue-800 mb-1">Total Notes × Coef</span>
                <div className="flex items-center justify-between">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  <span className="text-xl font-bold text-blue-700">
                   {totalNotesCoefficientees.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-1 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex flex-col">
                <span className="font-semibold text-green-800 mb-1">Moyenne Générale</span>
                <div className="flex items-center justify-between">
                  <BookOpen className="h-5 w-5 text-green-600" />
                  <span className="text-xl font-bold text-green-700">
                    {releve.moyenne_generale.toFixed(2)} / 20 
                  </span>
                </div>
              </div>
            </div>
            <div className="p-1 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex flex-col">
                <span className="font-semibold text-purple-800 mb-1">RANG</span>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-purple-700">
                     {releve.rang}{releve.rang === 1 ? 'er' : 'ème'}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-1 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex flex-col">
                <span className="font-semibold text-purple-800 mb-1">Mention</span>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-purple-700">
                     {releve.mention || 'Non spécifiée'}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-1 bg-green-40 border border-green-200 rounded-lg">
              <div className="flex flex-col">
                <span className="font-semibold text-green-500 mb-1">Moyenne de la classe</span>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-green-500">
                   {moyenneClasse.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-1 border border-gray-300 rounded-lg" style={{ color: '#4b5056', backgroundColor: '#f5f6f7' }}>
              <div className="flex flex-col">
                <span className="font-semibold text-gray-800 mb-1">Appréciation</span>
                <div className="flex items-center justify-between">
                  <span className="italic" style={{ fontSize: '10px', color: '#4b5056' }}>
              "{releve.appreciation_generale || "Aucune appréciation disponible."}"
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      {/* Version normale pour l'affichage web */}
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4">
        {/* Barre d'outils */}
        <div className="max-w-6xl mx-auto mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-lg">          
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900">RELEVÉ DE NOTES</h1>
              <p className="text-sm text-gray-600">
                {releve.eleve_prenom} {releve.eleve_nom} - {releve.classe_nom}
              </p>
            </div>
            
            <div className="flex gap-2">
              <span className="px-4 py-2 rounded-lg flex items-center" style={{ backgroundColor: '#f6e5b2', color: '#c46c02' }}>Vous pouvez imprimer ou enregistrer en PDF le relevé de votre enfant : ➔ </span> 
              <button
                onClick={imprimerReleve}
                disabled={isPrinting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {isPrinting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Préparation...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Télécharger</span> /<Printer className="h-4 w-4" /> <span className="hidden sm:inline">Imprimer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Contenu du relevé - VERSION AFFICHAGE */}
        <div id="releve-content" className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-1 sm:p-1">
          {/* En-tête */}
          <div className="text-center mb-1 border-b pb-1">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {parametresEcole?.nom_ecole || 'ÉCOLE PRIMAIRE'}
            </h2>
            <p className="text-gray-600">
              {parametresEcole?.adresse || 'Adresse non définie'}
            </p>
            <p className="text-gray-600">
              {parametresEcole?.telephone ? `Tél: ${parametresEcole.telephone}` : ''}
              {parametresEcole?.email ? ` - Email: ${parametresEcole.email}` : ''}
            </p>
          </div>

          {/* Informations élève */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-1">
            <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
              <h3 className="font-bold text-gray-900 mb-1 text-sm">INFORMATIONS ÉLÈVE</h3>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nom complet:</span>
                  <span className="font-semibold text-gray-900">{releve.eleve_prenom} {releve.eleve_nom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Matricule:</span>
                  <span className="font-medium">{releve.matricule || 'Non spécifié'}</span>
                </div>
                {releve.genre && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Genre:</span>
                    <span className="font-medium">
                      {releve.genre === 'M' ? 'Masculin' : releve.genre === 'F' ? 'Féminin' : releve.genre}
                    </span>
                  </div>
                )}
                {releve.date_naissance && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date naissance:</span>
                    <span className="font-medium">
                      {new Date(releve.date_naissance).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}
                {releve.nom_pere && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Père:</span>
                    <span className="font-medium">{releve.nom_pere}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
              <h3 className="font-bold text-gray-900 mb-1 text-sm">INFORMATIONS SCOLAIRES</h3>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Classe:</span>
                  <span className="font-medium text-blue-600">{releve.classe_nom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Période:</span>
                  <span className="font-medium text-blue-600">{releve.periode_nom}</span>
                </div>
                {releve.nom_mere && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mère:</span>
                    <span className="font-medium">{releve.nom_mere}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tableau des notes */}
          <div className="mb-2">
            {renderTableauNotes()}
          </div> 

          {/* Pied de page */}
          <div className="mt-1 pt-1 border-t border-gray-300 text-center text-gray-500 text-sm">
            <p>Document généré automatiquement le {new Date(releve.date_generation).toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
            <p className="mt-2">© {new Date().getFullYear()} - {parametresEcole?.nom_ecole || 'ÉCOLE PRIMAIRE'} - Tous droits réservés</p>
            <p className="mt-1 text-xs text-gray-400">
              Ce document est confidentiel et destiné uniquement aux parents de l'élève
            </p>
          </div>
        </div>
      </div>

      {/* Version cachée pour l'impression - STRUCTURE SIMPLIFIÉE */}
      <div id="releve-content-print" style={{ display: 'none' }}>
        <div className="releve-container">
          {/* En-tête */}
          <div className="entete">
            <div className="nom-ecole">
              {parametresEcole?.nom_ecole || 'ÉCOLE PRIMAIRE'}
            </div>
            <div className="adresse-ecole">
              {parametresEcole?.adresse || 'Adresse non définie'}
            </div>
            <div className="contact-ecole">
              {parametresEcole?.telephone ? `Tél: ${parametresEcole.telephone}` : ''}
              {parametresEcole?.email ? ` - Email: ${parametresEcole.email}` : ''}
            </div>
          </div>

          {/* Informations élève */}
          <div className="infos-eleve-section">
            <div className="infos-card">
              <div className="infos-title">INFORMATIONS ÉLÈVE</div>
              <div className="infos-row">
                <span>Nom complet:</span>
                <span className="font-semibold">{releve.eleve_prenom} {releve.eleve_nom}</span>
              </div>
              <div className="infos-row">
                <span>Matricule:</span>
                <span>{releve.matricule || 'Non spécifié'}</span>
              </div>
              {releve.genre && (
                <div className="infos-row">
                  <span>Genre:</span>
                  <span>{releve.genre === 'M' ? 'Masculin' : releve.genre === 'F' ? 'Féminin' : releve.genre}</span>
                </div>
              )}
              {releve.date_naissance && (
                <div className="infos-row">
                  <span>Date naissance:</span>
                  <span>{new Date(releve.date_naissance).toLocaleDateString('fr-FR')}</span>
                </div>
              )}
              {releve.nom_pere && (
                <div className="infos-row">
                  <span>Père:</span>
                  <span>{releve.nom_pere}</span>
                </div>
              )}
            </div>
            
            <div className="infos-card">
              <div className="infos-title">INFORMATIONS SCOLAIRES</div>
              <div className="infos-row">
                <span>Classe:</span>
                <span className="font-medium text-blue-600">{releve.classe_nom}</span>
              </div>
              <div className="infos-row">
                <span>Période:</span>
                <span className="font-medium text-blue-600">{releve.periode_nom}</span>
              </div>
              {releve.nom_mere && (
                <div className="infos-row">
                  <span>Mère:</span>
                  <span>{releve.nom_mere}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tableau des notes */}
          <table className="tableau-notes">
            <thead>
              <tr>
                <th>Matière</th>
                <th>Coefficient</th>
                <th>Note</th>
                <th>Note × Coef</th>
                <th>Sur</th>
                <th>Appréciation</th>
              </tr>
            </thead>
            <tbody>
              {matieres.map((matiere, index) => {
                const noteCoefficientee = matiere.note_coefficientee || (matiere.note * matiere.coefficient);
                const noteColor = getNoteColor(matiere.note);
                
                return (
                  <tr key={index}>
                    <td className="text-left">
                      <div className="flex items-center">
                        <div 
                          className="w-2 h-2 rounded-full mr-2" 
                          style={{ backgroundColor: matiere.couleur || '#3B82F6' }}
                        />
                        <span>{matiere.matiere_nom}</span>
                      </div>
                    </td>
                    <td>
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
                        {matiere.coefficient}
                      </span>
                    </td>
                    <td>
                      <span className={`text-base font-bold ${noteColor}`}>
                        {matiere.note.toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <span className="font-bold text-blue-700">
                        {noteCoefficientee.toFixed(2)}
                      </span>
                    </td>
                    <td>{matiere.note_sur}</td>
                    <td>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        matiere.note >= 16 ? 'bg-green-100 text-green-800' :
                        matiere.note >= 14 ? 'bg-blue-100 text-blue-800' :
                        matiere.note >= 12 ? 'bg-indigo-100 text-indigo-800' :
                        matiere.note >= 10 ? 'bg-yellow-100 text-yellow-800' :
                        matiere.note >= 8 ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {matiere.appreciation}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Statistiques */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Notes × Coef</div>
              <div className="stat-value text-blue-700">{totalNotesCoefficientees.toFixed(2)}</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-label">Moyenne Générale</div>
              <div className="stat-value text-green-700">{releve.moyenne_generale.toFixed(2)} / 20</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-label">RANG</div>
              <div className="stat-value text-purple-700">{releve.rang}{releve.rang === 1 ? 'er' : 'ème'}</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-label">Mention</div>
              <div className="stat-value text-purple-700">{releve.mention || 'Non spécifiée'}</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-label">Moyenne classe</div>
              <div className="stat-value text-green-500">{moyenneClasse.toFixed(2)}</div>
            </div>
            
            <div className="stat-card" style={{ color: '#4b5056', backgroundColor: '#f5f6f7' }}>
              <div className="stat-label">Appréciation</div>
              <div className="italic" style={{ fontSize: '10px', color: '#4b5056' }}>
                "{releve.appreciation_generale || "Aucune appréciation disponible."}"
              </div>
            </div>
          </div>

          {/* Pied de page */}
          <div className="pied-page">
            <p>Document généré automatiquement le {new Date(releve.date_generation).toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
            <p>© {new Date().getFullYear()} - {parametresEcole?.nom_ecole || 'ÉCOLE PRIMAIRE'} - Tous droits réservés</p>
            <p style={{ fontSize: '9px' }}>Ce document est confidentiel et destiné uniquement aux parents de l'élève</p>
          </div>
        </div>
      </div>
    </>
  );
}