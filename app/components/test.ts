'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  const calculerMoyenneGeneraleClasse = (releves: ReleveClasse[], totalEleves: number): number => {
    if (totalEleves === 0) return 0;
    
    // Si on a des relevés pour tous les élèves
    if (releves.length === totalEleves) {
      const sommeMoyennes = releves.reduce((total, r) => total + r.moyenne_generale, 0);
      return parseFloat((sommeMoyennes / totalEleves).toFixed(2));
    }
    
    // Si on n'a pas de relevés pour tous les élèves, on calcule sur ceux qu'on a
    if (releves.length > 0) {
      const sommeMoyennes = releves.reduce((total, r) => total + r.moyenne_generale, 0);
      return parseFloat((sommeMoyennes / releves.length).toFixed(2));
    }
    
    return 0;
  };

  // Modifiez le useEffect principal
  useEffect(() => {
    const fetchReleve = async () => {
      try {
        setLoading(true);
        setError('');
        
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
            const moyenne = calculerMoyenneGeneraleClasse(releves, totalEleves);
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

  // Fonction d'impression
  const imprimerReleve = () => {
    window.print();
  };

  // Fonction de téléchargement PDF
  const telechargerPDF = () => {
    const printContent = document.getElementById('releve-content');
    if (printContent) {
      const originalContent = document.body.innerHTML;
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload();
    }
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
              onClick={() => router.push('/')}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Home className="h-5 w-5" />
              Retour à l'accueil
            </button>
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
                    <td className="p-3 font-medium text-gray-900">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: matiere.couleur || '#3B82F6' }}
                        />
                        <span>{matiere.icone || '📚'} {matiere.matiere_nom}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">
                        {matiere.coefficient}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-xl font-bold ${noteColor}`}>
                          {matiere.note.toFixed(2)}
                        </span>
                        <div className="w-24 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                          <div 
                            className={`h-full ${noteBgColor}`}
                            style={{ width: `${Math.min(pourcentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-gray-500 text-sm mt-1">
                          {pourcentage.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-blue-700 text-lg">
                          {noteCoefficientee.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({matiere.note.toFixed(2)} × {matiere.coefficient})
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-center text-gray-600">
                      {matiere.note_sur}
                    </td>
                    <td className="p-3 text-center">
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
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex flex-col">
                <span className="font-semibold text-blue-800 mb-1">Total Coefficients</span>
                <div className="flex items-center justify-between">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  <span className="text-2xl font-bold text-blue-700">
                    {totalCoefficients}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex flex-col">
                <span className="font-semibold text-green-800 mb-1">Total Notes × Coef</span>
                <div className="flex items-center justify-between">
                  <BookOpen className="h-5 w-5 text-green-600" />
                  <span className="text-2xl font-bold text-green-700">
                    {totalNotesCoefficientees.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex flex-col">
                <span className="font-semibold text-purple-800 mb-1">Moyenne Générale</span>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-purple-700">
                    {releve.moyenne_generale.toFixed(2)} / 20
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Calcul détaillé */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Calcul détaillé de la moyenne
            </h4>
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex justify-between">
                <span>Somme des (Notes × Coefficients):</span>
                <span className="font-medium">{totalNotesCoefficientees.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Somme des Coefficients:</span>
                <span className="font-medium">{totalCoefficients}</span>
              </div>
              <div className="border-t border-gray-300 pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span>Moyenne = Total ÷ Coefficients:</span>
                  <span className="text-blue-700">
                    {totalNotesCoefficientees.toFixed(2)} ÷ {totalCoefficients} = {releve.moyenne_generale.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* SECTION STATISTIQUES DE LA CLASSE - CORRIGÉE */}
          <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">📊 STATISTIQUES DE LA CLASSE</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Moyenne générale de la classe */}
              <div className="p-4 bg-white border border-gray-200 rounded-lg text-center shadow-sm">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {moyenneClasse.toFixed(2)}
                </div>
                <div className="text-gray-600 font-medium">Moyenne générale de la classe</div>
                <div className="text-sm text-gray-500 mt-2">
                  Classe: {releve.classe_nom}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {relevesClasse.length}/{totalElevesClasse} élève(s) avec relevé(s)
                </div>
              </div>
              
              {/* Comparaison avec la moyenne de la classe */}
              <div className="p-4 bg-white border border-gray-200 rounded-lg text-center shadow-sm">
                <div className="text-3xl font-bold mb-2">
                  {releve.moyenne_generale >= moyenneClasse ? (
                    <span className="text-green-600">+{Math.abs(releve.moyenne_generale - moyenneClasse).toFixed(2)}</span>
                  ) : (
                    <span className="text-red-600">-{Math.abs(releve.moyenne_generale - moyenneClasse).toFixed(2)}</span>
                  )}
                </div>
                <div className="text-gray-600 font-medium">
                  {releve.moyenne_generale >= moyenneClasse ? 'Au-dessus' : 'En dessous'} de la moyenne
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Différence: {Math.abs(releve.moyenne_generale - moyenneClasse).toFixed(2)} points
                </div>
                <div className={`text-xs mt-1 px-2 py-1 rounded-full inline-block ${
                  releve.moyenne_generale >= moyenneClasse 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {releve.moyenne_generale >= moyenneClasse ? '✅ Bonne performance' : '📈 Peut mieux faire'}
                </div>
              </div>
              
              {/* Rang dans la classe */}
              <div className="p-4 bg-white border border-gray-200 rounded-lg text-center shadow-sm">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {releve.rang}{releve.rang === 1 ? 'er' : 'ème'}
                </div>
                <div className="text-gray-600 font-medium">Rang dans la classe</div>
                <div className="text-sm text-gray-500 mt-2">
                  sur {totalElevesClasse} élève(s)
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Top {Math.round((releve.rang / totalElevesClasse) * 100)}% de la classe
                </div>
              </div>
            </div>
            
            {/* Explication du calcul */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Calcul de la moyenne de la classe :</strong><br/>
                ({relevesClasse.map((r, i) => `${r.moyenne_generale.toFixed(2)}`).join(' + ')}) ÷ {totalElevesClasse} = {moyenneClasse.toFixed(2)}/20
              </p>
            </div>
          </div>
        </div>
      </>
    );
  };

  // Le reste du code reste inchangé...
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4">
      {/* Barre d'outils */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-lg">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            Retour
          </button>
          
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900">RELEVÉ DE NOTES DÉTAILLÉ</h1>
            <p className="text-sm text-gray-600">
              {releve.eleve_prenom} {releve.eleve_nom} - {releve.classe_nom}
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={telechargerPDF}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Télécharger</span>
            </button>
            <button
              onClick={imprimerReleve}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Imprimer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenu du relevé */}
      <div id="releve-content" className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6 sm:p-8">
        {/* En-tête */}
        <div className="text-center mb-8 border-b pb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">ÉCOLE PRIMAIRE</h2>
          <p className="text-gray-600">Biengerville CEFAL</p>
          <p className="text-gray-600">Tél: +225 01 72 95 45 47 - Email: groupescolairegnamienassa@gmail.com</p>
        </div>

        {/* Informations élève */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="font-bold text-gray-700 mb-3 text-lg">INFORMATIONS ÉLÈVE</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Nom complet:</span>
                <span className="font-semibold text-gray-900">{releve.eleve_prenom} {releve.eleve_nom}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Matricule:</span>
                <span className="font-medium">{releve.matricule || 'Non spécifié'}</span>
              </div>
              {releve.genre && (
                <div className="