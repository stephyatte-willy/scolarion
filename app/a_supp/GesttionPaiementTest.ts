'use client';
import { useState, useEffect } from 'react';
import './GestionFinance.css';

interface PaiementFrais {
  id: number;
  frais_eleve_id: number;
  eleve_id: number;
  montant: number;
  date_paiement: string;
  mode_paiement: string;
  reference_paiement?: string;
  eleve_nom?: string;
  eleve_prenom?: string;
  eleve_matricule?: string;
  classe_nom?: string;
  categorie_nom?: string;
  montant_total: number;
}

interface StatistiquesPaiements {
  total_jour: number;
  total_mois: number;
  total_annee: number;
  total_periode: number;
  nombre_paiements_jour: number;
  nombre_paiements_mois: number;
  moyenne_paiement: number;
  repartition_categories: { categorie: string; montant: number }[];
  evolution_paiements: { date: string; montant: number }[];
}

interface FraisEleve {
  id: number;
  frais_scolaire_id: number;
  eleve_id: number;
  annee_scolaire: string;
  montant: number;
  montant_paye: number;
  date_echeance: string;
  statut: 'en_attente' | 'partiel' | 'paye' | 'en_retard';
  date_paiement?: string;
  mode_paiement?: string;
  reference_paiement?: string;
  notes?: string;
  eleve_nom?: string;
  eleve_prenom?: string;
  eleve_matricule?: string;
  classe_nom?: string;
  classe_niveau?: string;
  categorie_nom?: string;
}

interface Eleve {
  id: number;
  nom: string;
  prenom: string;
  matricule: string;
  classe_id: number;
  classe_nom?: string;
}

interface Classe {
  id: number;
  nom: string;
  niveau: string;
}

export default function GestionPaiements() {
  const [paiements, setPaiements] = useState<PaiementFrais[]>([]);
  const [fraisEleves, setFraisEleves] = useState<FraisEleve[]>([]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [statistiques, setStatistiques] = useState<StatistiquesPaiements | null>(null);
  const [filtres, setFiltres] = useState({
    date_debut: '',
    date_fin: '',
    classe_id: '',
    categorie_id: '',
    eleve_id: '',
    mode_paiement: '',
    du_jour: false,
    du_mois: false,
    de_l_annee: false
  });
  const [chargement, setChargement] = useState(true);
  const [modalPaiementOuvert, setModalPaiementOuvert] = useState(false);
  const [fraisSelectionne, setFraisSelectionne] = useState<FraisEleve | null>(null);
  const [alerte, setAlerte] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [rechercheEleve, setRechercheEleve] = useState('');

  const [formPaiement, setFormPaiement] = useState({
    montant: 0,
    date_paiement: new Date().toISOString().split('T')[0],
    mode_paiement: 'especes' as 'especes' | 'cheque' | 'virement' | 'carte' | 'mobile' | 'autre',
    reference_paiement: '',
    notes: '',
    created_by: 1
  });

  useEffect(() => {
    chargerDonnees();
  }, [filtres]);

  useEffect(() => {
    if (alerte) {
      const timer = setTimeout(() => {
        setAlerte(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [alerte]);

  const chargerDonnees = async () => {
    setChargement(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filtres).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });

      const [paiementsResponse, statsResponse, fraisResponse, elevesResponse, classesResponse] = await Promise.all([
        fetch(`/api/finance/paiements?${queryParams}`),
        fetch(`/api/finance/paiements/statistiques?${queryParams}`),
        fetch('/api/finance/frais-eleves?statut=en_attente,partiel,en_retard'),
        fetch('/api/eleves?statut=actif'),
        fetch('/api/classes')
      ]);

      const paiementsData = await paiementsResponse.json();
      const statsData = await statsResponse.json();
      const fraisData = await fraisResponse.json();
      const elevesData = await elevesResponse.json();
      const classesData = await classesResponse.json();

      if (paiementsData.success) setPaiements(paiementsData.paiements || []);
      if (statsData.success) setStatistiques(statsData.statistiques);
      if (fraisData.success) setFraisEleves(fraisData.frais || []);
      if (elevesData.success) setEleves(elevesData.eleves || []);
      if (classesData.success) setClasses(classesData.classes || []);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      setAlerte({ type: 'error', message: 'Erreur lors du chargement des données' });
    } finally {
      setChargement(false);
    }
  };

  const appliquerFiltreTemporel = (type: 'jour' | 'mois' | 'annee' | 'reset') => {
    const aujourdhui = new Date();
    
    switch (type) {
      case 'jour':
        setFiltres({
          ...filtres,
          du_jour: true,
          du_mois: false,
          de_l_annee: false,
          date_debut: aujourdhui.toISOString().split('T')[0],
          date_fin: aujourdhui.toISOString().split('T')[0]
        });
        break;
      case 'mois':
        const debutMois = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1);
        const finMois = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth() + 1, 0);
        setFiltres({
          ...filtres,
          du_jour: false,
          du_mois: true,
          de_l_annee: false,
          date_debut: debutMois.toISOString().split('T')[0],
          date_fin: finMois.toISOString().split('T')[0]
        });
        break;
      case 'annee':
        const debutAnnee = new Date(aujourdhui.getFullYear(), 0, 1);
        const finAnnee = new Date(aujourdhui.getFullYear(), 11, 31);
        setFiltres({
          ...filtres,
          du_jour: false,
          du_mois: false,
          de_l_annee: true,
          date_debut: debutAnnee.toISOString().split('T')[0],
          date_fin: finAnnee.toISOString().split('T')[0]
        });
        break;
      case 'reset':
        setFiltres({
          date_debut: '',
          date_fin: '',
          classe_id: '',
          categorie_id: '',
          eleve_id: '',
          mode_paiement: '',
          du_jour: false,
          du_mois: false,
          de_l_annee: false
        });
        break;
    }
  };

  const ouvrirModalPaiement = (frais: FraisEleve) => {
    setFraisSelectionne(frais);
    const resteAPayer = frais.montant - frais.montant_paye;
    setFormPaiement({
      montant: resteAPayer,
      date_paiement: new Date().toISOString().split('T')[0],
      mode_paiement: 'especes',
      reference_paiement: '',
      notes: '',
      created_by: 1
    });
    setModalPaiementOuvert(true);
  };

  const fermerModalPaiement = () => {
    setModalPaiementOuvert(false);
    setFraisSelectionne(null);
  };

  const enregistrerPaiement = async () => {
    if (!fraisSelectionne) return;

    try {
      const response = await fetch(`/api/finance/frais-eleves/${fraisSelectionne.id}/paiement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formPaiement)
      });

      const data = await response.json();

      if (data.success) {
        fermerModalPaiement();
        chargerDonnees();
        setAlerte({ type: 'success', message: 'Paiement enregistré avec succès!' });
      } else {
        setAlerte({ type: 'error', message: data.erreur || 'Erreur lors de l\'enregistrement du paiement' });
      }
    } catch (error) {
      console.error('Erreur enregistrement paiement:', error);
      setAlerte({ type: 'error', message: 'Erreur lors de l\'enregistrement du paiement' });
    }
  };

  const formaterMontantFCFA = (montant: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(montant);
  };

  const getBadgeStatut = (statut: string) => {
    const styles = {
      en_attente: { background: '#fff3cd', color: '#856404' },
      partiel: { background: '#cce7ff', color: '#004085' },
      paye: { background: '#d4edda', color: '#155724' },
      en_retard: { background: '#f8d7da', color: '#721c24' }
    };
    
    return styles[statut as keyof typeof styles] || styles.en_attente;
  };

  // Gestion de la fermeture avec Echap
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        fermerModalPaiement();
      }
    };

    if (modalPaiementOuvert) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [modalPaiementOuvert]);

  // Filtrer les frais élèves par recherche
  const fraisElevesFiltres = fraisEleves.filter(frais => 
    rechercheEleve === '' || 
    `${frais.eleve_prenom} ${frais.eleve_nom}`.toLowerCase().includes(rechercheEleve.toLowerCase()) ||
    frais.eleve_matricule?.toLowerCase().includes(rechercheEleve.toLowerCase())
  );

  return (
    <div className="conteneur-paiements">
      {/* En-tête avec statistiques */}
      <div className="en-tete-section">
        <h2>Gestion des Paiements</h2>
        <div className="actions-en-tete">
          <button 
            className="bouton-secondaire"
            onClick={chargerDonnees}
          >
            🔄 Actualiser
          </button>
        </div>
      </div>

      {/* Alertes */}
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
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Cartes de statistiques */}
      {statistiques && (
        <div className="cartes-statistiques">
          <div className="carte-statistique">
            <div className="icone-statistique">📅</div>
            <div className="contenu-statistique">
              <h3>Aujourd'hui</h3>
              <div className="valeur">{formaterMontantFCFA(statistiques.total_jour)}</div>
              <div className="sous-titre">{statistiques.nombre_paiements_jour} paiements</div>
            </div>
          </div>
          
          <div className="carte-statistique">
            <div className="icone-statistique">📊</div>
            <div className="contenu-statistique">
              <h3>Ce Mois</h3>
              <div className="valeur">{formaterMontantFCFA(statistiques.total_mois)}</div>
              <div className="sous-titre">{statistiques.nombre_paiements_mois} paiements</div>
            </div>
          </div>
          
          <div className="carte-statistique">
            <div className="icone-statistique">📈</div>
            <div className="contenu-statistique">
              <h3>Cette Année</h3>
              <div className="valeur">{formaterMontantFCFA(statistiques.total_annee)}</div>
            </div>
          </div>
          
          <div className="carte-statistique">
            <div className="icone-statistique">🔍</div>
            <div className="contenu-statistique">
              <h3>Période</h3>
              <div className="valeur">{formaterMontantFCFA(statistiques.total_periode)}</div>
              <div className="sous-titre">Filtrée</div>
            </div>
          </div>
        </div>
      )}

      {/* Filtres rapides */}
      <div className="section-filtres">
        <div className="en-tete-filtres">
          <h3>Filtres Rapides</h3>
          <button 
            className="bouton-secondaire petit"
            onClick={() => appliquerFiltreTemporel('reset')}
          >
            🔄 Réinitialiser
          </button>
        </div>
        
        <div className="filtres-rapides">
          <button 
            className={`bouton-filtre ${filtres.du_jour ? 'actif' : ''}`}
            onClick={() => appliquerFiltreTemporel('jour')}
          >
            📅 Aujourd'hui
          </button>
          <button 
            className={`bouton-filtre ${filtres.du_mois ? 'actif' : ''}`}
            onClick={() => appliquerFiltreTemporel('mois')}
          >
            📊 Ce Mois
          </button>
          <button 
            className={`bouton-filtre ${filtres.de_l_annee ? 'actif' : ''}`}
            onClick={() => appliquerFiltreTemporel('annee')}
          >
            📈 Cette Année
          </button>
        </div>

        {/* Filtres détaillés */}
        <div className="filtres-detaille">
          <div className="groupe-filtre">
            <label>Date de début</label>
            <input
              type="date"
              value={filtres.date_debut}
              onChange={(e) => setFiltres({...filtres, date_debut: e.target.value})}
              className="input-filtre"
            />
          </div>
          
          <div className="groupe-filtre">
            <label>Date de fin</label>
            <input
              type="date"
              value={filtres.date_fin}
              onChange={(e) => setFiltres({...filtres, date_fin: e.target.value})}
              className="input-filtre"
            />
          </div>
          
          <div className="groupe-filtre">
            <label>Classe</label>
            <select
              value={filtres.classe_id}
              onChange={(e) => setFiltres({...filtres, classe_id: e.target.value})}
              className="input-filtre"
            >
              <option value="">Toutes les classes</option>
              {classes.map(classe => (
                <option key={classe.id} value={classe.id}>
                  {classe.niveau} {classe.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="groupe-filtre">
            <label>Mode de paiement</label>
            <select
              value={filtres.mode_paiement}
              onChange={(e) => setFiltres({...filtres, mode_paiement: e.target.value})}
              className="input-filtre"
            >
              <option value="">Tous</option>
              <option value="especes">Espèces</option>
              <option value="cheque">Chèque</option>
              <option value="virement">Virement</option>
              <option value="carte">Carte</option>
              <option value="mobile">Mobile</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section Frais en attente */}
      <div className="section-frais-attente">
        <div className="en-tete-section-frais">
          <h3>Frais en attente de paiement ({fraisElevesFiltres.length})</h3>
          <div className="recherche-eleve">
            <input
              type="text"
              placeholder="Rechercher un élève..."
              value={rechercheEleve}
              onChange={(e) => setRechercheEleve(e.target.value)}
              className="input-recherche"
            />
          </div>
        </div>
        
        <div className="grille-frais-attente">
          {fraisElevesFiltres.length > 0 ? (
            fraisElevesFiltres.map(frais => (
              <div key={frais.id} className="carte-frais-attente">
                <div className="en-tete-carte-frais">
                  <div>
                    <h4>{frais.eleve_prenom} {frais.eleve_nom}</h4>
                    <small className="matricule">{frais.eleve_matricule}</small>
                  </div>
                  <span 
                    className="badge-statut-frais"
                    style={getBadgeStatut(frais.statut)}
                  >
                    {frais.statut.replace('_', ' ')}
                  </span>
                </div>
                <div className="details-carte-frais">
                  <div className="ligne-detail">
                    <span className="label">Classe:</span>
                    <span className="valeur">{frais.classe_nom}</span>
                  </div>
                  <div className="ligne-detail">
                    <span className="label">Catégorie:</span>
                    <span className="valeur">{frais.categorie_nom}</span>
                  </div>
                  <div className="ligne-detail">
                    <span className="label">Total:</span>
                    <span className="valeur">{formaterMontantFCFA(frais.montant)}</span>
                  </div>
                  <div className="ligne-detail">
                    <span className="label">Payé:</span>
                    <span className="valeur">{formaterMontantFCFA(frais.montant_paye)}</span>
                  </div>
                  <div className="ligne-detail accent">
                    <span className="label">Reste:</span>
                    <span className="valeur">{formaterMontantFCFA(frais.montant - frais.montant_paye)}</span>
                  </div>
                  {frais.date_echeance && (
                    <div className="ligne-detail">
                      <span className="label">Échéance:</span>
                      <span className="valeur">{new Date(frais.date_echeance).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                </div>
                <button 
                  className="bouton-payer-rapide"
                  onClick={() => ouvrirModalPaiement(frais)}
                  disabled={frais.montant - frais.montant_paye <= 0}
                >
                  💳 Payer
                </button>
              </div>
            ))
          ) : (
            <div className="aucun-frais-trouve">
              <div className="icone-aucun">📝</div>
              <p>Aucun frais en attente trouvé</p>
              {rechercheEleve && <small>Essayez de modifier votre recherche</small>}
            </div>
          )}
        </div>
      </div>

      {/* Tableau des paiements */}
      <div className="tableau-paiements">
        <div className="en-tete-tableau">
          <h3>Historique des Paiements ({paiements.length})</h3>
        </div>
        
        <table className="tableau-simple">
          <thead>
            <tr>
              <th>Date</th>
              <th>Élève</th>
              <th>Classe</th>
              <th>Catégorie</th>
              <th>Montant</th>
              <th>Mode</th>
              <th>Référence</th>
            </tr>
          </thead>
          <tbody>
            {paiements.length > 0 ? (
              paiements.map(paiement => (
                <tr key={paiement.id}>
                  <td>{new Date(paiement.date_paiement).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <div className="info-eleve">
                      <strong>{paiement.eleve_prenom} {paiement.eleve_nom}</strong>
                      <small>{paiement.eleve_matricule}</small>
                    </div>
                  </td>
                  <td>{paiement.classe_nom}</td>
                  <td>{paiement.categorie_nom}</td>
                  <td className="montant">
                    <strong>{formaterMontantFCFA(paiement.montant)}</strong>
                  </td>
                  <td>
                    <span className={`badge ${paiement.mode_paiement}`}>
                      {paiement.mode_paiement}
                    </span>
                  </td>
                  <td>{paiement.reference_paiement || '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="aucune-donnee">
                  <div className="contenu-aucune-donnee">
                    <div className="icone-aucune-donnee">💸</div>
                    <p>Aucun paiement trouvé pour les critères sélectionnés</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de paiement moderne */}
      {modalPaiementOuvert && fraisSelectionne && (
        <div className="overlay-modal-modern" onClick={fermerModalPaiement}>
          <div className="modal-modern large" onClick={(e) => e.stopPropagation()}>
            <div className="en-tete-modal-modern">
              <h2>Enregistrer un Paiement</h2>
              <button className="bouton-fermer-modal-modern" onClick={fermerModalPaiement}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="contenu-modal-modern">
              <div className="info-frais-paiement-modern">
                <h3>{fraisSelectionne.eleve_prenom} {fraisSelectionne.eleve_nom}</h3>
                <div className="grille-info-frais">
                  <div className="info-item">
                    <span className="label">Matricule:</span>
                    <span className="valeur">{fraisSelectionne.eleve_matricule}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Classe:</span>
                    <span className="valeur">{fraisSelectionne.classe_nom}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Catégorie:</span>
                    <span className="valeur">{fraisSelectionne.categorie_nom}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Total:</span>
                    <span className="valeur">{formaterMontantFCFA(fraisSelectionne.montant)}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Déjà payé:</span>
                    <span className="valeur">{formaterMontantFCFA(fraisSelectionne.montant_paye)}</span>
                  </div>
                  <div className="info-item accent">
                    <span className="label">Reste à payer:</span>
                    <span className="valeur">{formaterMontantFCFA(fraisSelectionne.montant - fraisSelectionne.montant_paye)}</span>
                  </div>
                </div>
              </div>

              <div className="formulaire-paiement-modern">
                <div className="groupe-champ-modern">
                  <label>Montant du paiement (FCFA) *</label>
                  <input
                    type="number"
                    value={formPaiement.montant || ''}
                    onChange={(e) => setFormPaiement({...formPaiement, montant: parseFloat(e.target.value) || 0})}
                    min="0"
                    max={fraisSelectionne.montant - fraisSelectionne.montant_paye}
                    step="100"
                    className="input-modern"
                  />
                  <small>Maximum: {formaterMontantFCFA(fraisSelectionne.montant - fraisSelectionne.montant_paye)}</small>
                </div>

                <div className="groupe-champ-modern">
                  <label>Date du paiement *</label>
                  <input
                    type="date"
                    value={formPaiement.date_paiement}
                    onChange={(e) => setFormPaiement({...formPaiement, date_paiement: e.target.value})}
                    className="input-modern"
                  />
                </div>

                <div className="groupe-champ-modern">
                  <label>Mode de paiement *</label>
                  <select
                    value={formPaiement.mode_paiement}
                    onChange={(e) => setFormPaiement({...formPaiement, mode_paiement: e.target.value as any})}
                    className="input-modern"
                  >
                    <option value="especes">Espèces</option>
                    <option value="cheque">Chèque</option>
                    <option value="virement">Virement bancaire</option>
                    <option value="carte">Carte bancaire</option>
                    <option value="mobile">Paiement mobile</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                <div className="groupe-champ-modern">
                  <label>Référence</label>
                  <input
                    type="text"
                    value={formPaiement.reference_paiement}
                    onChange={(e) => setFormPaiement({...formPaiement, reference_paiement: e.target.value})}
                    placeholder="Numéro de chèque, référence virement..."
                    className="input-modern"
                  />
                </div>

                <div className="groupe-champ-modern">
                  <label>Notes</label>
                  <textarea
                    value={formPaiement.notes}
                    onChange={(e) => setFormPaiement({...formPaiement, notes: e.target.value})}
                    placeholder="Notes supplémentaires..."
                    rows={3}
                    className="input-modern"
                  />
                </div>
              </div>

              <div className="resume-paiement-modern">
                <h4>Résumé du paiement</h4>
                <div className="ligne-resume">
                  <span>Nouveau total payé:</span>
                  <span>{formaterMontantFCFA(fraisSelectionne.montant_paye + formPaiement.montant)}</span>
                </div>
                <div className="ligne-resume">
                  <span>Nouveau reste:</span>
                  <span>{formaterMontantFCFA(fraisSelectionne.montant - (fraisSelectionne.montant_paye + formPaiement.montant))}</span>
                </div>
                {fraisSelectionne.montant_paye + formPaiement.montant >= fraisSelectionne.montant && (
                  <div className="notification-complet-modern">
                    ✅ Le frais sera marqué comme complètement payé
                  </div>
                )}
              </div>

              <div className="actions-modal-modern">
                <button className="bouton-secondaire-modern" onClick={fermerModalPaiement}>
                  Annuler
                </button>
                <button 
                  className="bouton-primaire-modern" 
                  onClick={enregistrerPaiement}
                  disabled={formPaiement.montant <= 0 || formPaiement.montant > (fraisSelectionne.montant - fraisSelectionne.montant_paye)}
                >
                  💰 Enregistrer le paiement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}