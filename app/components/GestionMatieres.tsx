'use client';

import { useState, useEffect } from 'react';
import ModalSuppression from './ModalSuppression';
import './GestionMatieres.css';

interface Matiere {
  id: number;
  nom: string;
  code_matiere: string;
  niveau: string;
  description: string;
  couleur: string;
  icone: string;
  coefficient: number;
  note_sur: number;
  ordre_affichage: number;
  statut: 'actif' | 'inactif';
  created_at: string;
  updated_at?: string;
}

interface Props {
  onMatiereAjoutee?: () => void;
  onFermer?: () => void;
}

export default function GestionMatieres({ onMatiereAjoutee, onFermer }: Props) {
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [modalAjoutOuvert, setModalAjoutOuvert] = useState(false);
  const [modalEditionOuvert, setModalEditionOuvert] = useState(false);
  const [modalSuppressionOuvert, setModalSuppressionOuvert] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtreNiveau, setFiltreNiveau] = useState<string>('tous');
  const [filtreStatut, setFiltreStatut] = useState<string>('tous');
  const [alerte, setAlerte] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [matiereSelectionnee, setMatiereSelectionnee] = useState<Matiere | null>(null);
  const [actionEnCours, setActionEnCours] = useState<string>('');
  const [matiereAvecNotes, setMatiereAvecNotes] = useState<{id: number, nom: string, count: number} | null>(null);

  // Formulaire
  const [formData, setFormData] = useState({
    nom: '',
    code_matiere: '',
    niveau: 'primaire',
    description: '',
    couleur: '#3B82F6',
    icone: '📚',
    coefficient: 1.0,
    note_sur: 20.0,
    ordre_affichage: 0,
    statut: 'actif' as 'actif' | 'inactif'
  });

  // Icônes disponibles
  const iconesDisponibles = ['📚', '➕', '📖', '🔬', '🌍', '🎨', '⚽', '🔠', '🎵', '💻', '📐', '🔢', '📝', '🗣️', '🧮'];
  
  // Couleurs disponibles
  const couleursDisponibles = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', 
    '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#059669',
    '#7C3AED', '#DB2777', '#DC2626', '#D97706', '#65A30D'
  ];
  
  // Niveaux disponibles (spécifiques au primaire)
  const niveauxDisponibles = [
    { valeur: 'primaire', label: 'Primaire (Tous niveaux)', icone: '👦' },
    { valeur: 'cp1', label: 'CP1', icone: '👦' },
    { valeur: 'cp2', label: 'CP2', icone: '👦' },
    { valeur: 'ce1', label: 'CE1', icone: '👦' },
    { valeur: 'ce2', label: 'CE2', icone: '👦' },
    { valeur: 'cm1', label: 'CM1', icone: '👧' },
    { valeur: 'cm2', label: 'CM2', icone: '👧' }
  ];

  useEffect(() => {
    chargerMatieres();
  }, []);

  // Gérer les alertes
  useEffect(() => {
    if (alerte) {
      const timer = setTimeout(() => setAlerte(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alerte]);

const chargerMatieres = async () => {
  try {
    setChargement(true);
    
    console.log('🔄 Chargement des matières...');
    const params = new URLSearchParams();
    if (filtreNiveau !== 'tous') params.append('niveau', filtreNiveau);
    if (filtreStatut !== 'tous') params.append('statut', filtreStatut);
    
    const url = `/api/matieres-primaires${params.toString() ? `?${params.toString()}` : ''}`;
    console.log('📡 URL appelée:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const text = await response.text();
      console.error('❌ Réponse non-OK:', response.status, text.substring(0, 200));
      throw new Error(`Erreur HTTP ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ Réponse non-JSON:', text.substring(0, 200));
      throw new Error('La réponse n\'est pas au format JSON');
    }
    
    const data = await response.json();
    console.log('📦 Données reçues du serveur:', data);
    
    // Vérifier les icônes des matières chargées
    if (data.success && data.matieres) {
      console.log('🎨 Icônes des matières chargées:', 
        data.matieres.map((m: any) => ({ nom: m.nom, icone: m.icone }))
      );
      setMatieres(data.matieres || []);
    }
    
    if (data.success) {
      setMatieres(data.matieres || []);
    } else {
      setAlerte({ type: 'error', message: data.error || 'Erreur de chargement' });
    }
  } catch (error: any) {
    console.error('❌ Erreur détaillée:', error);
    setAlerte({ type: 'error', message: error.message || 'Erreur de connexion au serveur' });
  } finally {
    setChargement(false);
  }
};

  // Fonction pour générer le code matière
  const genererCodeMatiere = (nom: string): string => {
    const prefixe = nom.substring(0, 4).toUpperCase().replace(/\s/g, '');
    const timestamp = Date.now().toString().slice(-4);
    return `${prefixe}-PRIM-${timestamp}`;
  };

  const ouvrirModalAjout = () => {
    setFormData({
      nom: '',
      code_matiere: '',
      niveau: 'primaire',
      description: '',
      couleur: '#3B82F6',
      icone: '📚',
      coefficient: 1.0,
      note_sur: 20.0,
      ordre_affichage: matieres.length + 1,
      statut: 'actif'
    });
    setModalAjoutOuvert(true);
  };

  const ouvrirModalEdition = (matiere: Matiere) => {
    setMatiereSelectionnee(matiere);
    setFormData({
      nom: matiere.nom,
      code_matiere: matiere.code_matiere,
      niveau: matiere.niveau,
      description: matiere.description || '',
      couleur: matiere.couleur,
      icone: matiere.icone || '📚',
      coefficient: matiere.coefficient,
      note_sur: matiere.note_sur,
      ordre_affichage: matiere.ordre_affichage,
      statut: matiere.statut
    });
    setModalEditionOuvert(true);
  };

  const fermerModalAjout = () => {
    setModalAjoutOuvert(false);
  };

  const fermerModalEdition = () => {
    setModalEditionOuvert(false);
    setMatiereSelectionnee(null);
  };

  const demanderSuppression = (matiere: Matiere) => {
    setMatiereSelectionnee(matiere);
    setModalSuppressionOuvert(true);
  };

 // Dans GestionMatieres.tsx, remplacez la fonction gererChangementForm :

// Dans GestionMatieres.tsx, remplacez la fonction gererChangementForm :

const gererChangementForm = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  const { name, value } = e.target;
  
  // Pour les champs numériques
  if (name === 'coefficient' || name === 'note_sur' || name === 'ordre_affichage') {
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  } else {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }

  // Générer le code automatiquement si le nom change et que le code est vide
  if (name === 'nom' && !matiereSelectionnee && !formData.code_matiere) {
    setFormData(prev => ({
      ...prev,
      code_matiere: genererCodeMatiere(value)
    }));
  }
};

// CORRECTION : Fonction spéciale pour gérer le clic sur l'icône
const handleIconeClick = (icone: string) => {
  console.log('🔵 Clic sur icône:', icone);
  console.log('🔵 Ancienne icône:', formData.icone);
  
  setFormData(prev => {
    const newData = {
      ...prev,
      icone: icone
    };
    console.log('🟢 Nouvelle icône dans state:', newData.icone);
    return newData;
  });
};

  const validerFormulaire = (): boolean => {
    if (!formData.nom.trim()) {
      setAlerte({ type: 'error', message: 'Le nom de la matière est requis' });
      return false;
    }
    if (formData.coefficient <= 0) {
      setAlerte({ type: 'error', message: 'Le coefficient doit être supérieur à 0' });
      return false;
    }
    if (formData.note_sur <= 0) {
      setAlerte({ type: 'error', message: 'La note sur doit être supérieure à 0' });
      return false;
    }
    return true;
  };

const sauvegarderMatiere = async () => {
  if (!validerFormulaire()) return;

  const isEdition = !!matiereSelectionnee;
  const method = isEdition ? 'PUT' : 'POST';
  const url = '/api/matieres-primaires';

  // CRITIQUE : Log de l'icône avant envoi
  console.log('🎯 Icône avant envoi:', formData.icone);
  console.log('🎯 Données complètes avant envoi:', {
    ...formData,
    id: isEdition ? matiereSelectionnee!.id : undefined
  });

  setActionEnCours(isEdition ? 'edition' : 'ajout');

  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(isEdition ? { ...formData, id: matiereSelectionnee!.id } : formData)
    });

    // Log de la réponse
    const data = await response.json();
    console.log('📦 Réponse du serveur:', data);
    
    if (data.success) {
      console.log('✅ Icône sauvegardée:', data.matiere?.icone);
      setAlerte({ 
        type: 'success', 
        message: isEdition ? 'Matière modifiée avec succès' : 'Matière ajoutée avec succès' 
      });
      
      await chargerMatieres();
      
      if (isEdition) {
        fermerModalEdition();
      } else {
        fermerModalAjout();
      }
      
      if (onMatiereAjoutee) {
        onMatiereAjoutee();
      }
    } else {
      setAlerte({ type: 'error', message: data.error });
    }
  } catch (error: any) {
    console.error('❌ Erreur sauvegarde:', error);
    setAlerte({ type: 'error', message: error.message || 'Erreur lors de la sauvegarde' });
  } finally {
    setActionEnCours('');
  }
};

  const confirmerSuppression = async () => {
    if (!matiereSelectionnee) return;

    setActionEnCours('suppression');

    try {
      const response = await fetch('/api/matieres-primaires', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: matiereSelectionnee.id })
      });

      const data = await response.json();

      if (data.success) {
        setAlerte({ type: 'success', message: 'Matière supprimée avec succès' });
        await chargerMatieres();
        if (onMatiereAjoutee) onMatiereAjoutee();
      } else {
        setAlerte({ type: 'error', message: data.error });
      }
    } catch (error: any) {
      setAlerte({ type: 'error', message: 'Erreur lors de la suppression' });
    } finally {
      setModalSuppressionOuvert(false);
      setMatiereSelectionnee(null);
      setActionEnCours('');
    }
  };

  const matieresFiltrees = matieres.filter(matiere => {
    const correspondRecherche = 
      matiere.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      matiere.code_matiere.toLowerCase().includes(recherche.toLowerCase()) ||
      (matiere.description && matiere.description.toLowerCase().includes(recherche.toLowerCase()));
    
    return correspondRecherche;
  });

  const reinitialiserFiltres = () => {
    setRecherche('');
    setFiltreNiveau('tous');
    setFiltreStatut('tous');
    chargerMatieres(); // Recharger avec les filtres réinitialisés
  };

  // Appliquer les filtres quand ils changent
  useEffect(() => {
    chargerMatieres();
  }, [filtreNiveau, filtreStatut]);

  if (chargement) {
    return (
      <div className="chargement-matieres">
        <div className="spinner"></div>
        <p>Chargement des matières...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="en-tete-matieres">
        <h2>📚 Gestion des Matières</h2>

        <div className="recherche">
          <input
            type="text" style={{ fontSize: '13px', width: '260px', margin: '6px' }}
            placeholder="🔍 Rech. par nom, code ou description"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="champ-recherche-matiere"
          />
          
          <button className="bouton-reinitialiser-mat" onClick={reinitialiserFiltres}>
          🔄 Réinitialiser
        </button>
        </div>
        
        <button className="bouton-ajouter-matiere" onClick={ouvrirModalAjout}>
          <span className="icone-ajouter">+</span> Nouvelle
        </button>
        {onFermer && (
          <button className="bouton-fermer-page" onClick={onFermer}>✕</button>
        )}
      </div>

      {/* Alertes */}
      {alerte && (
        <div className={`alerte-matiere ${alerte.type === 'success' ? 'alerte-succes' : 'alerte-erreur'}`}>
          <div className="contenu-alerte-matiere">
            <span className="icone-alerte">{alerte.type === 'success' ? '✅' : '❌'}</span>
            <span className="texte-alerte">{alerte.message}</span>
            <button className="bouton-fermer-alerte" onClick={() => setAlerte(null)}>✕</button>
          </div>
        </div>
      )}

      {/* Statistiques */}
      <div className="statistiques-matieres">
        <div className="carte-stat-matiere">
          <div className="icone-stat-mat">📚</div>
          <div className="contenu-stat">
            <div className="valeur-stat-mat">{matieres.length}</div>
            <div className="label-stat-mat">Matières</div>
          </div>
        </div>
        
        <div className="carte-stat-matiere">
          <div className="icone-stat-mat">✅</div>
          <div className="contenu-stat">
            <div className="valeur-stat-mat">{matieres.filter(m => m.statut === 'actif').length}</div>
            <div className="label-stat-mat">Actives</div>
          </div>
        </div>
        
        <div className="carte-stat-matiere">
          <div className="icone-stat-mat">📊</div>
          <div className="contenu-stat">
            <div className="valeur-stat-mat">
              {matieres.reduce((acc, m) => acc + m.coefficient, 0)}
            </div>
            <div className="label-stat-mat">Coef total</div>
          </div>
        </div>
      </div>

      {/* Liste des matières */}
      <div>
        <div className="liste-matieres">
          {matieresFiltrees.length === 0 ? (
            <div className="aucune-matiere">
              <div className="icone-aucune">📚</div>
              <h3>Aucune matière trouvée</h3>
              <p>Aucune matière ne correspond à vos critères.</p>
              <button className="bouton-creer-premiere" onClick={ouvrirModalAjout}>
                + Créer une matière
              </button>
            </div>
          ) : (
            matieresFiltrees
              .sort((a, b) => a.ordre_affichage - b.ordre_affichage)
              .map(matiere => (
                <div key={matiere.id} className="carte-matiere" style={{ borderLeftColor: matiere.couleur }}>
                  <div className="en-tete-carte-matiere">
                    <div className="icone-matiere-mat" style={{ backgroundColor: matiere.couleur }}>
                      
                    </div>
                    <div className="info-matiere">
                      <h3>{matiere.nom}</h3>
                      <div className="code-matiere">
                       <span className="badge-note1"> 
                        {matiere.code_matiere}  
                        </span>
                        <span className="badge-note2">
                          Coef: {matiere.coefficient}
                        </span>  
                        <span className="badge-note3">
                          Sur {matiere.note_sur}
                        </span></div>
                      {matiere.description && (
                        <div className="description-matiere">{matiere.description}</div>
                      )}
                    </div>
                  </div>
                  <div className="actions-carte">
                    <button 
                      className="bouton-action-modifier"
                      onClick={() => ouvrirModalEdition(matiere)}
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <button 
                      className="bouton-action-supprimer"
                      onClick={() => demanderSuppression(matiere)}
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Modal d'ajout */}
      {modalAjoutOuvert && (
        <div className="modal-overlay" onClick={fermerModalAjout}>
          <div className="modal-matiere-ajout" onClick={(e) => e.stopPropagation()}>
            <div className="en-tete-modal">
              <h3>➕ Nouvelle Matière</h3>
              <button className="bouton-fermer-modal" onClick={fermerModalAjout}>✕</button>
            </div>
            
            <div className="contenu-modal">
              <div className="groupe-champ-mat">
                <label>Code matière</label>
                <input
                  type="text"
                  name="code_matiere"
                  value={formData.code_matiere}
                  onChange={gererChangementForm}
                  className="champ-matiere"
                  placeholder="Généré automatiquement"
                />
                <small className="texte-aide">Laissez vide pour génération automatique</small>
              </div>

              <div className="groupe-champ-mat">
                <label><span className="required">*</span> Nom de la matière</label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={gererChangementForm}
                  placeholder="Ex: Mathématiques"
                  className="champ-matiere"
                  required
                />
              </div>
              
              <div className="groupe-champ-mat">
                <label>Niveau</label>
                <select
                  name="niveau"
                  value={formData.niveau}
                  onChange={gererChangementForm}
                  className="champ-matiere"
                >
                  {niveauxDisponibles.map(niveau => (
                    <option key={niveau.valeur} value={niveau.valeur}>
                      {niveau.icone} {niveau.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="groupe-champ-mat">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={gererChangementForm}
                  placeholder="Description de la matière..."
                  className="champ-matiere textarea"
                  rows={3}
                />
              </div>
              
              <div className="groupe-champ-mat">
                <label>Couleur</label>
                <div className="selecteur-couleurs">
                  {couleursDisponibles.map((couleur, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`cercle-couleur ${formData.couleur === couleur ? 'selectionnee' : ''}`}
                      style={{ backgroundColor: couleur }}
                      onClick={() => setFormData(prev => ({ ...prev, couleur }))}
                    />
                  ))}
                </div>
              </div>
              
              <div className="groupe-champ-mat">
  <label>Icône</label>
  <div style={{ 
    display: 'flex', 
    flexWrap: 'wrap', 
    gap: '10px', 
    marginTop: '5px',
    padding: '10px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    backgroundColor: '#f8fafc'
  }}>
    {iconesDisponibles.map((icone, index) => (
      <button
        key={index}
        type="button"
        onClick={() => {
          console.log('👆 Clic sur icône:', icone);
          handleIconeClick(icone);
        }}
        style={{
          width: '45px',
          height: '45px',
          fontSize: '24px',
          border: formData.icone === icone ? '3px solid #3b82f6' : '1px solid #cbd5e1',
          borderRadius: '8px',
          backgroundColor: formData.icone === icone ? '#dbeafe' : 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s'
        }}
      >
        {icone}
      </button>
    ))}
  </div>
  
  {/* Affichage de l'icône sélectionnée en grand */}
  <div style={{
    marginTop: '15px',
    padding: '15px',
    backgroundColor: '#f1f5f9',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  }}>
    <div style={{
      width: '60px',
      height: '60px',
      backgroundColor: formData.couleur,
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '32px'
    }}>
      {formData.icone}
    </div>
    <div>
      <div style={{ fontWeight: 'bold', color: '#1e293b' }}>Icône sélectionnée</div>
      <div style={{ color: '#64748b', fontSize: '14px' }}>Valeur: "{formData.icone}"</div>
    </div>
  </div>
</div>
              
              <div className="groupe-champ-mat double">
                <div className="sous-groupe">
                  <label><span className="required">*</span> Coefficient</label>
                  <input
                    type="number"
                    name="coefficient"
                    value={formData.coefficient}
                    onChange={gererChangementForm}
                    step="0.5"
                    min="0.5"
                    max="10"
                    className="champ-matiere"
                  />
                </div>
                
                <div className="sous-groupe">
                  <label><span className="required">*</span> Note sur</label>
                  <input
                    type="number"
                    name="note_sur"
                    value={formData.note_sur}
                    onChange={gererChangementForm}
                    step="0.5"
                    min="5"
                    max="100"
                    className="champ-matiere"
                  />
                </div>
              </div>
              
              <div className="groupe-champ-mat">
                <label>Ordre d'affichage</label>
                <input
                  type="number"
                  name="ordre_affichage"
                  value={formData.ordre_affichage}
                  onChange={gererChangementForm}
                  min="0"
                  className="champ-matiere"
                />
              </div>
              
              <div className="groupe-champ-mat">
                <label>Statut</label>
                <div className="boutons-statut">
                  <button
                    type="button"
                    className={`bouton-statut ${formData.statut === 'actif' ? 'actif' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, statut: 'actif' }))}
                  >
                    ✅ Actif
                  </button>
                  <button
                    type="button"
                    className={`bouton-statut ${formData.statut === 'inactif' ? 'inactif' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, statut: 'inactif' }))}
                  >
                    ⏸️ Inactif
                  </button>
                </div>
              </div>
            </div>
            
            <div className="pied-modal">
              <button className="bouton-annuler" onClick={fermerModalAjout}>Annuler</button>
              <button className="bouton-sauvegarder" onClick={sauvegarderMatiere} disabled={actionEnCours === 'ajout'}>
                {actionEnCours === 'ajout' ? 'Création...' : '➕ Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition */}
      {modalEditionOuvert && (
        <div className="modal-overlay-matiere-ajout" onClick={fermerModalEdition}>
          <div className="modal-matiere-ajout" onClick={(e) => e.stopPropagation()}>
            <div className="en-tete-modal">
              <h3>✏️ Modifier la matière</h3>
              <button className="bouton-fermer-modal" onClick={fermerModalEdition}>✕</button>
            </div>
            
            <div className="contenu-modal">
              <div className="info-matiere-selectionnee">
                <div className="icone-grande" style={{ backgroundColor: formData.couleur }}>
                  {formData.icone}
                </div>
                <div className="details-matiere-selectionnee">
                  <h4>{matiereSelectionnee?.nom}</h4>
                  <p>Code: {matiereSelectionnee?.code_matiere}</p>
                </div>
              </div>
              
              <div className="groupe-champ-mat">
                <label><span className="required">*</span> Code matière</label>
                <input
                  type="text"
                  name="code_matiere"
                  value={formData.code_matiere}
                  onChange={gererChangementForm}
                  className="champ-matiere"
                  required
                />
              </div>

              <div className="groupe-champ-mat">
                <label><span className="required">*</span> Nom de la matière</label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={gererChangementForm}
                  className="champ-matiere"
                  required
                />
              </div>
              
              <div className="groupe-champ-mat">
                <label>Niveau</label>
                <select
                  name="niveau"
                  value={formData.niveau}
                  onChange={gererChangementForm}
                  className="champ-matiere"
                >
                  {niveauxDisponibles.map(niveau => (
                    <option key={niveau.valeur} value={niveau.valeur}>
                      {niveau.icone} {niveau.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="groupe-champ-mat">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={gererChangementForm}
                  className="champ-matiere textarea"
                  rows={3}
                />
              </div>
              
              <div className="groupe-champ-mat">
                <label>Couleur</label>
                <div className="selecteur-couleurs">
                  {couleursDisponibles.map((couleur, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`cercle-couleur ${formData.couleur === couleur ? 'selectionnee' : ''}`}
                      style={{ backgroundColor: couleur }}
                      onClick={() => setFormData(prev => ({ ...prev, couleur }))}
                    />
                  ))}
                </div>
              </div>
              
              <div className="groupe-champ-mat">
  <label>Icône</label>
  <div style={{ 
    display: 'flex', 
    flexWrap: 'wrap', 
    gap: '10px', 
    marginTop: '5px',
    padding: '10px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    backgroundColor: '#f8fafc'
  }}>
    {iconesDisponibles.map((icone, index) => (
      <button
        key={index}
        type="button"
        onClick={() => {
          console.log('👆 Clic sur icône (édition):', icone);
          handleIconeClick(icone);
        }}
        style={{
          width: '45px',
          height: '45px',
          fontSize: '24px',
          border: formData.icone === icone ? '3px solid #3b82f6' : '1px solid #cbd5e1',
          borderRadius: '8px',
          backgroundColor: formData.icone === icone ? '#dbeafe' : 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s'
        }}
      >
        {icone}
      </button>
    ))}
  </div>
  
  {/* Affichage de l'icône sélectionnée en grand */}
  <div style={{
    marginTop: '15px',
    padding: '15px',
    backgroundColor: '#f1f5f9',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  }}>
    <div style={{
      width: '60px',
      height: '60px',
      backgroundColor: formData.couleur,
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '32px'
    }}>
      {formData.icone}
    </div>
    <div>
      <div style={{ fontWeight: 'bold', color: '#1e293b' }}>Icône sélectionnée</div>
      <div style={{ color: '#64748b', fontSize: '14px' }}>Valeur: "{formData.icone}"</div>
    </div>
  </div>
</div>
              
              <div className="groupe-champ-mat double">
                <div className="sous-groupe">
                  <label><span className="required">*</span> Coefficient</label>
                  <input
                    type="number"
                    name="coefficient"
                    value={formData.coefficient}
                    onChange={gererChangementForm}
                    step="0.5"
                    min="0.5"
                    max="10"
                    className="champ-matiere"
                  />
                </div>
                
                <div className="sous-groupe">
                  <label><span className="required">*</span> Note sur</label>
                  <input
                    type="number"
                    name="note_sur"
                    value={formData.note_sur}
                    onChange={gererChangementForm}
                    step="0.5"
                    min="5"
                    max="100"
                    className="champ-matiere"
                  />
                </div>
              </div>
              
              <div className="groupe-champ-mat">
                <label>Ordre d'affichage</label>
                <input
                  type="number"
                  name="ordre_affichage"
                  value={formData.ordre_affichage}
                  onChange={gererChangementForm}
                  min="0"
                  className="champ-matiere"
                />
              </div>
              
              <div className="groupe-champ-mat">
                <label>Statut</label>
                <div className="boutons-statut">
                  <button
                    type="button"
                    className={`bouton-statut ${formData.statut === 'actif' ? 'actif' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, statut: 'actif' }))}
                  >
                    ✅ Actif
                  </button>
                  <button
                    type="button"
                    className={`bouton-statut ${formData.statut === 'inactif' ? 'inactif' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, statut: 'inactif' }))}
                  >
                    ⏸️ Inactif
                  </button>
                </div>
              </div>
            </div>
            
            <div className="pied-modal">
              <button className="bouton-annuler" onClick={fermerModalEdition}>Annuler</button>
              <button className="bouton-sauvegarder" onClick={sauvegarderMatiere} disabled={actionEnCours === 'edition'}>
                {actionEnCours === 'edition' ? 'Sauvegarde...' : '💾 Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de suppression */}
      <ModalSuppression
        isOpen={modalSuppressionOuvert}
        onClose={() => {
          setModalSuppressionOuvert(false);
          setMatiereSelectionnee(null);
        }}
        onConfirm={confirmerSuppression}
        title="Supprimer la matière"
        message="Êtes-vous sûr de vouloir supprimer cette matière ?"
        type="danger"
        itemName={matiereSelectionnee ? `"${matiereSelectionnee.nom}" (${matiereSelectionnee.code_matiere})` : ''}
        isLoading={actionEnCours === 'suppression'}
      />

      {/* Bouton retour */}
      {onFermer && (
        <div className="pied-page-matieres">
          <button className="bouton-fermer-complet" onClick={onFermer}>
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}