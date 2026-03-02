import React, { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import './ModalTypesAbsence.css';

interface TypeAbsence {
  id: number;
  libelle: string;
  code: string;
  description: string;
  couleur: string;
  icone: string;
  statut: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onTypeChange: () => void;
}

export default function ModalTypesAbsence({ isOpen, onClose, onTypeChange }: Props) {
  const { showSuccess, showError, showWarning } = useToast();
  
  const [types, setTypes] = useState<TypeAbsence[]>([]);
  const [chargement, setChargement] = useState(false);
  const [modeEdition, setModeEdition] = useState<'liste' | 'ajout' | 'modification'>('liste');
  const [typeCourant, setTypeCourant] = useState<Partial<TypeAbsence>>({
    libelle: '',
    code: '',
    description: '',
    couleur: '#64748b',
    icone: '📅',
    statut: 'actif'
  });
  const [filtreStatut, setFiltreStatut] = useState<string>('actif');

  useEffect(() => {
    if (isOpen) {
      chargerTypes();
    }
  }, [isOpen, filtreStatut]);

  const chargerTypes = async () => {
    try {
      setChargement(true);
      const params = new URLSearchParams();
      if (filtreStatut !== 'tous') params.append('statut', filtreStatut);
      
      const response = await fetch(`/api/absences/types?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setTypes(data.types || []);
      } else {
        showError('Erreur lors du chargement des types');
      }
    } catch (error) {
      console.error('Erreur chargement types:', error);
      showError('Erreur de chargement');
    } finally {
      setChargement(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTypeCourant(prev => ({ ...prev, [name]: value }));
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTypeCourant(prev => ({ ...prev, couleur: e.target.value }));
  };

  const generateCodeFromLibelle = () => {
    if (typeCourant.libelle) {
      const code = typeCourant.libelle
        .toLowerCase()
        .replace(/[éèêë]/g, 'e')
        .replace(/[àâä]/g, 'a')
        .replace(/[îï]/g, 'i')
        .replace(/[ôö]/g, 'o')
        .replace(/[ùûü]/g, 'u')
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
      
      setTypeCourant(prev => ({ ...prev, code }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!typeCourant.libelle || typeCourant.libelle.trim() === '') {
      showWarning('Le libellé est requis');
      return;
    }

    if (!typeCourant.code || typeCourant.code.trim() === '') {
      showWarning('Le code est requis');
      return;
    }

    try {
      const url = modeEdition === 'ajout' 
        ? '/api/absences/types'
        : `/api/absences/types?id=${typeCourant.id}`;
      
      const method = modeEdition === 'ajout' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(typeCourant)
      });

      const data = await response.json();
      
      if (data.success) {
        showSuccess(modeEdition === 'ajout' ? 'Type ajouté avec succès' : 'Type modifié avec succès');
        setModeEdition('liste');
        setTypeCourant({
          libelle: '',
          code: '',
          description: '',
          couleur: '#64748b',
          icone: '📅',
          statut: 'actif'
        });
        chargerTypes();
        onTypeChange(); // Notifier le parent
      } else {
        showError(data.error || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      console.error('Erreur sauvegarde type:', error);
      showError('Erreur de sauvegarde');
    }
  };

  const handleEdit = (type: TypeAbsence) => {
    setTypeCourant(type);
    setModeEdition('modification');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce type ?')) return;
    
    try {
      const response = await fetch(`/api/absences/types?id=${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess('Type supprimé avec succès');
        chargerTypes();
        onTypeChange();
      } else {
        showError(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression type:', error);
      showError('Erreur de suppression');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-types-absence" onClick={(e) => e.stopPropagation()}>
        <div className="en-tete-modal">
          <h2>Gestion des types d'absence</h2>
          <button className="bouton-fermer-modal" onClick={onClose}>✕</button>
        </div>

        <div className="contenu-modal">
          {modeEdition === 'liste' ? (
            <>
              <div className="barre-outils-types">
                <div className="filtres-types">
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
                  className="bouton-ajouter-type"
                  onClick={() => {
                    setTypeCourant({
                      libelle: '',
                      code: '',
                      description: '',
                      couleur: '#64748b',
                      icone: '📅',
                      statut: 'actif'
                    });
                    setModeEdition('ajout');
                  }}
                >
                  <span className="icone-ajouter">+</span>
                  Nouveau type
                </button>
              </div>

              {chargement ? (
                <div className="chargement-types">Chargement...</div>
              ) : (
                <div className="liste-types">
                  {types.length === 0 ? (
                    <div className="aucun-type">
                      <p>Aucun type trouvé</p>
                    </div>
                  ) : (
                    types.map(type => (
                      <div key={type.id} className="carte-type">
                        <div className="en-tete-carte-type">
                          <div className="info-type">
                            <span className="icone-type">{type.icone}</span>
                            <span 
                              className="pastille-couleur" 
                              style={{ backgroundColor: type.couleur }}
                            ></span>
                            <span className={`statut-type ${type.statut}`}>
                              {type.statut === 'actif' ? 'Actif' : 'Inactif'}
                            </span>
                          </div>
                          <div className="actions-carte">
                            <button 
                              className="bouton-modifier"
                              onClick={() => handleEdit(type)}
                              title="Modifier"
                            >
                              ✏️
                            </button>
                            <button 
                              className="bouton-supprimer"
                              onClick={() => handleDelete(type.id)}
                              title="Supprimer"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        
                        <div className="corps-carte-type">
                          <h4 className="libelle-type">{type.libelle}</h4>
                          <div className="code-type">Code: {type.code}</div>
                          {type.description && (
                            <p className="description-type">{type.description}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleSubmit} className="formulaire-type">
              <h3>{modeEdition === 'ajout' ? 'Ajouter un type' : 'Modifier le type'}</h3>
              
              <div className="groupe-champ-abs">
                <label className="label-champ">Libellé *</label>
                <input
                  type="text"
                  name="libelle"
                  value={typeCourant.libelle || ''}
                  onChange={handleInputChange}
                  onBlur={generateCodeFromLibelle}
                  className="champ"
                  required
                  autoFocus
                  placeholder="Libellé du type d'absence"
                />
              </div>
              
              <div className="groupe-champ-abs">
                <input
                  type="hidden"
                  name="code"
                  value={typeCourant.code || ''}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="groupe-champ-abs">
                <label className="label-champ">Description</label>
                <textarea
                  name="description"
                  value={typeCourant.description || ''}
                  onChange={handleInputChange}
                  className="champ textarea"
                  rows={3}
                  placeholder="Ajouter une description au type d'absence"
                />
              </div>
              
              <div className="groupe-champ-abs">
                <label className="label-champ">Icône</label>
                <input
                  type="text"
                  name="icone"
                  value={typeCourant.icone || '📅'}
                  onChange={handleInputChange}
                  className="champ"
                  placeholder="Emoji ou code"
                />
              </div>
              
              <div className="groupe-champ-abs">
                <label className="label-champ">Couleur</label>
                <div className="selecteur-couleur">
                  <input
                    type="color"
                    name="couleur"
                    value={typeCourant.couleur || '#64748b'}
                    onChange={handleColorChange}
                    className="input-couleur"
                  />
                  <span className="valeur-couleur">{typeCourant.couleur}</span>
                </div>
              </div>
              
              <div className="groupe-champ-abs">
                <label className="label-champ">Statut</label>
                <select
                  name="statut"
                  value={typeCourant.statut || 'actif'}
                  onChange={handleInputChange}
                  className="champ"
                >
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
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