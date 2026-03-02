'use client';
import { useState, useEffect } from 'react';
import GestionEcheancier from './GestionEcheancier';

interface EcheancierClasse {
  id: number;
  classe_id: number;
  frais_scolaire_id: number;
  nom_echeancier: string;
  nombre_versements: number;
  montant_total: number;
  statut: 'actif' | 'inactif';
  created_at: string;
  // Champs de jointure
  classe_nom?: string;
  classe_niveau?: string;
  frais_montant?: number;
  categorie_nom?: string;
}

interface Props {
  onEcheancierSauvegarde: () => void;
}

export default function GestionEcheancierGlobal({ onEcheancierSauvegarde }: Props) {
  const [echeanciers, setEcheanciers] = useState<EcheancierClasse[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [fraisScolaires, setFraisScolaires] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [selection, setSelection] = useState({
    classe_id: '',
    frais_scolaire_id: ''
  });
  const [creationMode, setCreationMode] = useState(false);

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    try {
      setChargement(true);
      
      const [classesResponse, fraisResponse, echeanciersResponse] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/finance/frais-scolaires?statut=actif'),
        fetch('/api/finance/echeanciers')
      ]);

      if (classesResponse.ok) {
        const data = await classesResponse.json();
        setClasses(data.classes || []);
      }

      if (fraisResponse.ok) {
        const data = await fraisResponse.json();
        setFraisScolaires(data.frais || []);
      }

      if (echeanciersResponse.ok) {
        const data = await echeanciersResponse.json();
        setEcheanciers(data.echeanciers || []);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setChargement(false);
    }
  };

  const fraisFiltres = fraisScolaires.filter(frais => 
    !selection.classe_id || frais.classe_id === parseInt(selection.classe_id)
  );

  const echeancierExistant = echeanciers.find(ech => 
    ech.classe_id === parseInt(selection.classe_id) && 
    ech.frais_scolaire_id === parseInt(selection.frais_scolaire_id)
  );

  const handleSelectionClasse = (classeId: string) => {
    setSelection({
      classe_id: classeId,
      frais_scolaire_id: ''
    });
    setCreationMode(false);
  };

  const handleSelectionFrais = (fraisId: string) => {
    setSelection(prev => ({
      ...prev,
      frais_scolaire_id: fraisId
    }));
    
    const frais = fraisScolaires.find(f => f.id === parseInt(fraisId));
    if (frais && frais.categorie_frais_id === 1) { // Frais de scolarité
      const existe = echeanciers.find(ech => 
        ech.classe_id === parseInt(selection.classe_id) && 
        ech.frais_scolaire_id === parseInt(fraisId)
      );
      
      if (!existe) {
        setCreationMode(true);
      }
    }
  };

  const ouvrirEditionEcheancier = (echeancier: EcheancierClasse) => {
    setSelection({
      classe_id: echeancier.classe_id.toString(),
      frais_scolaire_id: echeancier.frais_scolaire_id.toString()
    });
    setCreationMode(true);
  };

  if (chargement) {
    return (
      <div className="chargement">
        <div className="spinner"></div>
        <p>Chargement des échéanciers...</p>
      </div>
    );
  }

  return (
    <div className="gestion-echeancier-global">
      {/* Sélection de la classe et du frais */}
      <div className="section-selection">
        <h3>📋 Sélectionnez une classe et un frais</h3>
        
        <div className="grille-selection">
          <div className="groupe-champ-modern">
            <label>Classe *</label>
            <select
              value={selection.classe_id}
              onChange={(e) => handleSelectionClasse(e.target.value)}
              className="input-modern"
            >
              <option value="">Choisissez une classe</option>
              {classes.map(classe => (
                <option key={classe.id} value={classe.id}>
                  {classe.niveau} {classe.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="groupe-champ-modern">
            <label>Frais scolaire *</label>
            <select
              value={selection.frais_scolaire_id}
              onChange={(e) => handleSelectionFrais(e.target.value)}
              className="input-modern"
              disabled={!selection.classe_id}
            >
              <option value="">Choisissez un frais</option>
              {fraisFiltres
                .filter(frais => frais.categorie_frais_id === 1) // Uniquement frais de scolarité
                .map(frais => (
                <option key={frais.id} value={frais.id}>
                  {frais.categorie_nom} - {formaterMontantFCFA(frais.montant)} ({frais.periodicite})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Affichage selon la sélection */}
      {selection.classe_id && selection.frais_scolaire_id && (
        <div className="section-action">
          {echeancierExistant ? (
            <div className="echeancier-existant">
              <div className="info-echeancier">
                <h4>📅 Échéancier existant</h4>
                <div className="details-echeancier">
                  <p><strong>Nom:</strong> {echeancierExistant.nom_echeancier}</p>
                  <p><strong>Versements:</strong> {echeancierExistant.nombre_versements}</p>
                  <p><strong>Montant total:</strong> {formaterMontantFCFA(echeancierExistant.montant_total)}</p>
                  <p><strong>Statut:</strong> 
                    <span className={`badge-statut ${echeancierExistant.statut}`}>
                      {echeancierExistant.statut === 'actif' ? '✅ Actif' : '❌ Inactif'}
                    </span>
                  </p>
                </div>
                
                <div className="actions-echeancier">
                  <button 
                    className="bouton-primaire"
                    onClick={() => ouvrirEditionEcheancier(echeancierExistant)}
                  >
                    ✏️ Modifier cet échéancier
                  </button>
                  
                  <button 
                    className="bouton-secondaire"
                    onClick={async () => {
                      if (confirm('Voulez-vous vraiment désactiver cet échéancier ?')) {
                        // Implémenter la désactivation
                        console.log('Désactivation échéancier:', echeancierExistant.id);
                      }
                    }}
                  >
                    🚫 Désactiver
                  </button>
                </div>
              </div>
            </div>
          ) : creationMode ? (
            <div className="creation-echeancier">
              <h4>➕ Créer un nouvel échéancier</h4>
              <p>Créez un échéancier de paiement pour cette classe.</p>
              
              <GestionEcheancier 
                fraisScolaireId={selection.frais_scolaire_id}
                classeId={parseInt(selection.classe_id)}
                onEcheancierSauvegarde={() => {
                  onEcheancierSauvegarde();
                  chargerDonnees(); // Recharger la liste
                }}
              />
            </div>
          ) : (
            <div className="aucun-echeancier">
              <div className="message-info">
                <div className="icone-info">ℹ️</div>
                <div>
                  <h4>Aucun échéancier configuré</h4>
                  <p>Créez un échéancier de paiement pour cette classe et ce frais de scolarité.</p>
                  <button 
                    className="bouton-primaire"
                    onClick={() => setCreationMode(true)}
                  >
                    📅 Créer un échéancier
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Liste de tous les échéanciers */}
      <div className="section-liste-echeanciers">
        <h3>📊 Tous les échéanciers configurés</h3>
        
        {echeanciers.length === 0 ? (
          <div className="aucune-donnee">
            <p>Aucun échéancier configuré pour le moment.</p>
          </div>
        ) : (
          <div className="tableau-echeanciers">
            <table>
              <thead>
                <tr>
                  <th>Classe</th>
                  <th>Frais</th>
                  <th>Échéancier</th>
                  <th>Versements</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {echeanciers.map(echeancier => (
                  <tr key={echeancier.id}>
                    <td>
                      <strong>{echeancier.classe_nom}</strong>
                      <br />
                      <small>{echeancier.classe_niveau}</small>
                    </td>
                    <td>{echeancier.categorie_nom}</td>
                    <td>
                      <strong>{echeancier.nom_echeancier}</strong>
                    </td>
                    <td>{echeancier.nombre_versements} versements</td>
                    <td>{formaterMontantFCFA(echeancier.montant_total)}</td>
                    <td>
                      <span className={`badge-statut ${echeancier.statut}`}>
                        {echeancier.statut === 'actif' ? '✅ Actif' : '❌ Inactif'}
                      </span>
                    </td>
                    <td>
                      <div className="actions-ligne">
                        <button 
                          className="bouton-icone modifier"
                          onClick={() => ouvrirEditionEcheancier(echeancier)}
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button 
                          className="bouton-icone supprimer"
                          onClick={() => {
                            if (confirm('Supprimer cet échéancier ?')) {
                              // Implémenter la suppression
                              console.log('Suppression:', echeancier.id);
                            }
                          }}
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
        )}
      </div>

      <style jsx>{`
        .gestion-echeancier-global {
          max-height: 80vh;
          overflow-y: auto;
        }
        .section-selection {
          margin-bottom: 30px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        .grille-selection {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 15px;
        }
        .section-action {
          margin: 20px 0;
          padding: 20px;
          border: 2px dashed #dee2e6;
          border-radius: 8px;
        }
        .echeancier-existant {
          background: #d4edda;
          padding: 15px;
          border-radius: 6px;
        }
        .details-echeancier {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin: 15px 0;
        }
        .actions-echeancier {
          display: flex;
          gap: 10px;
        }
        .aucun-echeancier {
          text-align: center;
          padding: 30px;
        }
        .message-info {
          display: flex;
          align-items: center;
          gap: 15px;
          justify-content: center;
        }
        .icone-info {
          font-size: 2em;
        }
        .section-liste-echeanciers {
          margin-top: 30px;
        }
        .tableau-echeanciers table {
          width: 100%;
          border-collapse: collapse;
        }
        .tableau-echeanciers th,
        .tableau-echeanciers td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #dee2e6;
        }
        .tableau-echeanciers th {
          background: #e9ecef;
          font-weight: bold;
        }
        .badge-statut {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.8em;
          font-weight: bold;
        }
        .badge-statut.actif {
          background: #28a745;
          color: white;
        }
        .badge-statut.inactif {
          background: #6c757d;
          color: white;
        }
        .actions-ligne {
          display: flex;
          gap: 5px;
        }
        .bouton-icone {
          padding: 6px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        .bouton-icone.modifier {
          background: #ffc107;
          color: #212529;
        }
        .bouton-icone.supprimer {
          background: #dc3545;
          color: white;
        }
      `}</style>
    </div>
  );
}

function formaterMontantFCFA(montant: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(montant);
}