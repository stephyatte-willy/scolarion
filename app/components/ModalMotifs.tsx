// ModalMotifs.tsx - Version corrigée
import React, { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import './ModalMotifs.css';

interface Motif {
  id: number;
  libelle: string;
  description: string;
  type_absence: string;
  justifiable: boolean;
  couleur: string;
  statut: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onMotifChange: () => void;
  typeAbsence?: string;
}

export default function ModalMotifs({ isOpen, onClose, onMotifChange, typeAbsence = 'tous' }: Props) {
  const { showSuccess, showError, showWarning } = useToast();
  
  const [motifs, setMotifs] = useState<Motif[]>([]);
  const [chargement, setChargement] = useState(false);
  const [modeEdition, setModeEdition] = useState<'liste' | 'ajout' | 'modification'>('liste');
  const [motifCourant, setMotifCourant] = useState<Partial<Motif>>({
    libelle: '',
    description: '',
    type_absence: 'absence',
    justifiable: true,
    couleur: '#64748b',
    statut: 'actif'
  });
  const [filtreType, setFiltreType] = useState<string>(typeAbsence);
  const [filtreStatut, setFiltreStatut] = useState<string>('actif');
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);

  useEffect(() => {
    if (isOpen) {
      chargerMotifs();
    }
  }, [isOpen, filtreType, filtreStatut]);

  const chargerMotifs = async () => {
    try {
      setChargement(true);
      const params = new URLSearchParams();
      if (filtreType !== 'tous') params.append('type', filtreType);
      if (filtreStatut !== 'tous') params.append('statut', filtreStatut);
      
      const response = await fetch(`/api/absences/motifs?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setMotifs(data.motifs || []);
      } else {
        showError('Erreur lors du chargement des motifs');
      }
    } catch (error) {
      console.error('Erreur chargement motifs:', error);
      showError('Erreur de chargement');
    } finally {
      setChargement(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setMotifCourant(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'justifiable') {
      setMotifCourant(prev => ({ ...prev, [name]: value === 'true' }));
    } else {
      setMotifCourant(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMotifCourant(prev => ({ ...prev, couleur: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!motifCourant.libelle || motifCourant.libelle.trim() === '') {
      showWarning('Le libellé est requis');
      return;
    }

    if (!motifCourant.type_absence) {
      showWarning('Le type d\'absence est requis');
      return;
    }

    try {
      const url = modeEdition === 'ajout' 
        ? '/api/absences/motifs'
        : `/api/absences/motifs?id=${motifCourant.id}`;
      
      const method = modeEdition === 'ajout' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(motifCourant)
      });

      const data = await response.json();
      
      if (data.success) {
        showSuccess(modeEdition === 'ajout' ? 'Motif ajouté avec succès' : 'Motif modifié avec succès');
        setModeEdition('liste');
        setMotifCourant({
          libelle: '',
          description: '',
          type_absence: 'absence',
          justifiable: true,
          couleur: '#64748b',
          statut: 'actif'
        });
        chargerMotifs();
        onMotifChange(); // Notifier le parent
      } else {
        showError(data.error || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      console.error('Erreur sauvegarde motif:', error);
      showError('Erreur de sauvegarde');
    }
  };

  const handleEdit = (motif: Motif) => {
    setMotifCourant(motif);
    setModeEdition('modification');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce motif ?')) return;
    
    try {
      setSuppressionEnCours(true);
      
      const response = await fetch(`/api/absences/motifs?id=${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess('Motif supprimé avec succès');
        chargerMotifs();
        onMotifChange();
      } else {
        // CORRECTION: Afficher un message d'erreur clair
        showError(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression motif:', error);
      showError('Erreur de suppression');
    } finally {
      setSuppressionEnCours(false);
    }
  };

  // CORRECTION: Nouvelle fonction pour désactiver un motif au lieu de le supprimer
  const handleDesactiver = async (id: number, libelle: string, type_absence: string) => {
    try {
      const response = await fetch(`/api/absences/motifs?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          libelle,
          type_absence,
          statut: 'inactif'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess('Motif désactivé avec succès');
        chargerMotifs();
        onMotifChange();
      } else {
        showError(data.error || 'Erreur lors de la désactivation');
      }
    } catch (error) {
      console.error('Erreur désactivation motif:', error);
      showError('Erreur de désactivation');
    }
  };

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'absence': 'Absence',
      'retard': 'Retard',
      'sortie_anticipée': 'Sortie anticipée',
      'exclusion': 'Exclusion'
    };
    return labels[type] || type;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-motifs" onClick={(e) => e.stopPropagation()}>
        <div className="en-tete-modal">
          <h2>Gestion des motifs d'absence</h2>
          <button className="bouton-fermer-modal" onClick={onClose}>✕</button>
        </div>

        <div className="contenu-modal">
          {modeEdition === 'liste' ? (
            <>
              <div className="barre-outils-motifs">
                <div className="filtres-motifs">
                  <select 
                    value={filtreType}
                    onChange={(e) => setFiltreType(e.target.value)}
                    className="filtre-select"
                  >
                    <option value="tous">Tous les types</option>
                    <option value="absence">Absences</option>
                    <option value="retard">Retards</option>
                    <option value="sortie_anticipée">Sorties anticipées</option>
                    <option value="exclusion">Exclusions</option>
                  </select>
                  
                  <select 
                    value={filtreStatut}
                    onChange={(e) => setFiltreStatut(e.target.value)}
                    className="filtre-select"
                  >
                    <option value="actif">Actifs</option>
                    <option value="inactif">Inactifs</option>
                    <option value="tous">Tous</option>
                  </select>
                </div>
                
                <button 
                  className="bouton-ajouter-motif"
                  onClick={() => {
                    setMotifCourant({
                      libelle: '',
                      description: '',
                      type_absence: filtreType !== 'tous' ? filtreType : 'absence',
                      justifiable: true,
                      couleur: '#64748b',
                      statut: 'actif'
                    });
                    setModeEdition('ajout');
                  }}
                >
                  <span className="icone-ajouter">+</span>
                  Nouveau motif
                </button>
              </div>

              {chargement ? (
                <div className="chargement-motifs">Chargement...</div>
              ) : (
                <div className="liste-motifs">
                  {motifs.length === 0 ? (
                    <div className="aucun-motif">
                      <p>Aucun motif trouvé</p>
                    </div>
                  ) : (
                    motifs.map(motif => (
                      <div key={motif.id} className="carte-motif">
                        <div className="en-tete-carte-motif">
                          <div className="info-type">
                            <span 
                              className="pastille-couleur" 
                              style={{ backgroundColor: motif.couleur }}
                            ></span>
                            <span className="type-motif">{getTypeLabel(motif.type_absence)}</span>
                            <span className={`statut-motif ${motif.statut}`}>
                              {motif.statut === 'actif' ? 'Actif' : 'Inactif'}
                            </span>
                          </div>
                          <div className="actions-carte">
                            <button 
                              className="bouton-modifier"
                              onClick={() => handleEdit(motif)}
                              title="Modifier"
                            >
                              ✏️
                            </button>
                            
                            {/* CORRECTION: Si le motif est utilisé, proposer la désactivation */}
                            <button 
                              className="bouton-supprimer"
                              onClick={() => handleDelete(motif.id)}
                              title="Supprimer définitivement"
                            >
                              🗑️
                            </button>
                            
                            {motif.statut === 'actif' && (
                              <button 
                                className="bouton-desactiver"
                                onClick={() => handleDesactiver(motif.id, motif.libelle, motif.type_absence)}
                                title="Désactiver (conserver pour l'historique)"
                              >
                                ⏸️
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="corps-carte-motif">
                          <h4 className="libelle-motif">{motif.libelle}</h4>
                          {motif.description && (
                            <p className="description-motif">{motif.description}</p>
                          )}
                          <div className="infos-supplementaires">
                            <span className={`justifiable ${motif.justifiable ? 'oui' : 'non'}`}>
                              {motif.justifiable ? '✅ Justifiable' : '❌ Non justifiable'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleSubmit} className="formulaire-motif">
              <h3>{modeEdition === 'ajout' ? 'Ajouter un motif' : 'Modifier le motif'}</h3>
              
              <div className="groupe-champ-abs">
                <label className="label-champ">Libellé *</label>
                <input
                  type="text"
                  name="libelle"
                  value={motifCourant.libelle || ''}
                  onChange={handleInputChange}
                  className="champ"
                  placeholder="Ex: Maladie, Retard de transport..."
                  required
                  autoFocus
                />
              </div>
              
              <div className="groupe-champ-abs">
                <label className="label-champ">Description</label>
                <textarea
                  name="description"
                  value={motifCourant.description || ''}
                  onChange={handleInputChange}
                  className="champ"
                  placeholder="Description détaillée (optionnelle)"
                  rows={3}
                />
              </div>
              
              <div className="groupe-champ-abs">
                <label className="label-champ">Type d'absence *</label>
                <select
                  name="type_absence"
                  value={motifCourant.type_absence || 'absence'}
                  onChange={handleInputChange}
                  className="champ"
                  required
                >
                  <option value="absence">Absence</option>
                  <option value="retard">Retard</option>
                  <option value="sortie_anticipée">Sortie anticipée</option>
                  <option value="exclusion">Exclusion</option>
                </select>
              </div>
              
              <div className="groupe-champ-abs">
                <label className="label-champ">Justifiable</label>
                <select
                  name="justifiable"
                  value={motifCourant.justifiable ? 'true' : 'false'}
                  onChange={handleInputChange}
                  className="champ"
                >
                  <option value="true">Oui (peut être justifié)</option>
                  <option value="false">Non (ne peut pas être justifié)</option>
                </select>
              </div>
              
              <div className="groupe-champ-abs">
                <label className="label-champ">Couleur</label>
                <div className="selecteur-couleur">
                  <input
                    type="color"
                    name="couleur"
                    value={motifCourant.couleur || '#64748b'}
                    onChange={handleColorChange}
                    className="input-couleur"
                  />
                  <span className="valeur-couleur">{motifCourant.couleur}</span>
                </div>
              </div>
              
              <div className="groupe-champ-abs">
                <label className="label-champ">Statut</label>
                <select
                  name="statut"
                  value={motifCourant.statut || 'actif'}
                  onChange={handleInputChange}
                  className="champ"
                >
                  <option value="actif">Actif (disponible pour les nouvelles saisies)</option>
                  <option value="inactif">Inactif (visible seulement dans l'historique)</option>
                </select>
              </div>
              
              <div className="pied-formulaire">
                <button 
                  type="button" 
                  className="bouton-annuler"
                  onClick={() => setModeEdition('liste')}
                >
                  Annuler
                </button>
                <button type="submit" className="bouton-sauvegarder">
                  {modeEdition === 'ajout' ? 'Ajouter' : 'Modifier'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}