'use client';

import { useState, useEffect } from 'react';
import './GestionFinance.css';

interface FraisClasse {
  id: number;
  classe_id: number;
  categorie_frais_id: number;
  annee_scolaire: string;
  montant: number;
  periodicite: 'unique' | 'mensuel' | 'trimestriel' | 'annuel';
  date_debut: string;
  date_fin?: string;
  statut: 'actif' | 'inactif';
  classe_nom?: string;
  classe_niveau?: string;
  categorie_nom?: string;
  nombre_eleves?: number;
}

interface CategorieFrais {
  id: number;
  nom: string;
  type: string;
  montant_base: number;
  periodicite: string;
}

interface Classe {
  id: number;
  nom: string;
  niveau: string;
}

export default function GestionFraisClasses() {
  const [fraisClasses, setFraisClasses] = useState<FraisClasse[]>([]);
  const [categories, setCategories] = useState<CategorieFrais[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [chargement, setChargement] = useState(true);

  const [formData, setFormData] = useState({
    classe_id: '',
    categorie_frais_id: '',
    montant: 0,
    periodicite: 'unique' as 'unique' | 'mensuel' | 'trimestriel' | 'annuel',
    date_debut: new Date().toISOString().split('T')[0],
    date_fin: '',
    annee_scolaire: ''
  });

  useEffect(() => {
    chargerDonnees();
    // Générer automatiquement l'année scolaire
    const anneeScolaire = genererAnneeScolaire();
    setFormData(prev => ({ ...prev, annee_scolaire: anneeScolaire }));
  }, []);

  const genererAnneeScolaire = (): string => {
    const maintenant = new Date();
    const annee = maintenant.getFullYear();
    const mois = maintenant.getMonth() + 1;
    
    if (mois >= 8) {
      return `${annee}-${annee + 1}`;
    } else {
      return `${annee - 1}-${annee}`;
    }
  };

  const chargerDonnees = async () => {
    try {
      const [fraisResponse, categoriesResponse, classesResponse] = await Promise.all([
        fetch('/api/finance/frais-classes'),
        fetch('/api/finance/categories-frais'),
        fetch('/api/classes')
      ]);

      const fraisData = await fraisResponse.json();
      const categoriesData = await categoriesResponse.json();
      const classesData = await classesResponse.json();

      if (fraisData.success) setFraisClasses(fraisData.frais || []);
      if (categoriesData.success) setCategories(categoriesData.categories || []);
      if (classesData.success) setClasses(classesData.classes || []);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setChargement(false);
    }
  };

  const creerFraisClasse = async () => {
    try {
      const response = await fetch('/api/finance/frais-classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        setModalOuvert(false);
        chargerDonnees();
      }
    } catch (error) {
      console.error('Erreur création frais classe:', error);
    }
  };

  const supprimerFraisClasse = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce frais de classe ?')) return;

    try {
      const response = await fetch(`/api/finance/frais-classes/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        chargerDonnees();
      } else {
        alert(data.erreur || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression frais classe:', error);
    }
  };

  const formaterMontantFCFA = (montant: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(montant);
  };

  if (chargement) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="conteneur-frais-classes">
      <div className="en-tete-section">
        <h2>Gestion des Frais par Classe</h2>
        <button 
          className="bouton-primaire"
          onClick={() => setModalOuvert(true)}
        >
          ➕ Ajouter un Frais de Classe
        </button>
      </div>

      <table className="tableau-simple">
        <thead>
          <tr>
            <th>Classe</th>
            <th>Catégorie</th>
            <th>Montant</th>
            <th>Périodicité</th>
            <th>Année Scolaire</th>
            <th>Élèves</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {fraisClasses.map(frais => (
            <tr key={frais.id}>
              <td>
                <strong>{frais.classe_niveau} {frais.classe_nom}</strong>
              </td>
              <td>{frais.categorie_nom}</td>
              <td>{formaterMontantFCFA(frais.montant)}</td>
              <td>
                <span className={`badge ${frais.periodicite}`}>
                  {frais.periodicite}
                </span>
              </td>
              <td>{frais.annee_scolaire}</td>
              <td>{frais.nombre_eleves || 0}</td>
              <td>
                <span className={`badge ${frais.statut}`}>
                  {frais.statut}
                </span>
              </td>
              <td>
                <div className="actions-ligne">
                  <button className="bouton-icone" title="Détails">
                    👁️
                  </button>
                  <button className="bouton-icone" title="Modifier">
                    ✏️
                  </button>
                  <button 
                    className="bouton-icone danger"
                    onClick={() => supprimerFraisClasse(frais.id)}
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

      {modalOuvert && (
        <div className="overlay-modal">
          <div className="modal">
            <div className="en-tete-modal">
              <h3>Nouveau Frais de Classe</h3>
              <button onClick={() => setModalOuvert(false)}>✕</button>
            </div>
            
            <div className="contenu-modal">
              <div className="groupe-formulaire">
                <label>Classe *</label>
                <select
                  value={formData.classe_id}
                  onChange={(e) => setFormData({...formData, classe_id: e.target.value})}
                >
                  <option value="">Sélectionnez une classe</option>
                  {classes.map(classe => (
                    <option key={classe.id} value={classe.id}>
                      {classe.niveau} {classe.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div className="groupe-formulaire">
                <label>Catégorie de frais *</label>
                <select
                  value={formData.categorie_frais_id}
                  onChange={(e) => {
                    const categorieId = e.target.value;
                    const categorie = categories.find(c => c.id === parseInt(categorieId));
                    setFormData({
                      ...formData,
                      categorie_frais_id: categorieId,
                      montant: categorie?.montant_base || 0,
                      periodicite: (categorie?.periodicite as any) || 'unique'
                    });
                  }}
                >
                  <option value="">Sélectionnez une catégorie</option>
                  {categories.map(categorie => (
                    <option key={categorie.id} value={categorie.id}>
                      {categorie.nom} - {formaterMontantFCFA(categorie.montant_base)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="groupe-formulaire">
                <label>Montant (FCFA) *</label>
                <input
                  type="number"
                  value={formData.montant}
                  onChange={(e) => setFormData({...formData, montant: parseFloat(e.target.value) || 0})}
                  min="0"
                  step="100"
                />
              </div>

              <div className="groupe-formulaire">
                <label>Périodicité *</label>
                <select
                  value={formData.periodicite}
                  onChange={(e) => setFormData({...formData, periodicite: e.target.value as any})}
                >
                  <option value="unique">Unique</option>
                  <option value="mensuel">Mensuel</option>
                  <option value="trimestriel">Trimestriel</option>
                  <option value="annuel">Annuel</option>
                </select>
              </div>

              <div className="groupe-formulaire">
                <label>Date de début *</label>
                <input
                  type="date"
                  value={formData.date_debut}
                  onChange={(e) => setFormData({...formData, date_debut: e.target.value})}
                />
              </div>

              <div className="groupe-formulaire">
                <label>Date de fin</label>
                <input
                  type="date"
                  value={formData.date_fin}
                  onChange={(e) => setFormData({...formData, date_fin: e.target.value})}
                />
              </div>

              <div className="groupe-formulaire">
                <label>Année Scolaire *</label>
                <input
                  type="text"
                  value={formData.annee_scolaire}
                  onChange={(e) => setFormData({...formData, annee_scolaire: e.target.value})}
                  placeholder="2024-2025"
                />
              </div>

              <div className="actions-modal">
                <button onClick={() => setModalOuvert(false)}>Annuler</button>
                <button 
                  onClick={creerFraisClasse}
                  disabled={!formData.classe_id || !formData.categorie_frais_id || !formData.montant}
                >
                  Créer le frais
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}