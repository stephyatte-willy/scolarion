'use client';
import { useState, useEffect } from 'react';

interface Props {
  fraisScolaireId: string;
  classeId?: number;
  onEcheancierSauvegarde: () => void;
  onAnnuler?: () => void; // ✅ Optionnel
}

export default function GestionEcheancier({ fraisScolaireId, classeId, onEcheancierSauvegarde, onAnnuler }: Props) {
  const [echeancier, setEcheancier] = useState<any>(null);
  const [nombreVersements, setNombreVersements] = useState(4);
  const [montantTotal, setMontantTotal] = useState(0);
  const [nomEcheancier, setNomEcheancier] = useState('');
  const [versements, setVersements] = useState<any[]>([]);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    chargerEcheancierExistants();
  }, [fraisScolaireId, classeId]);

  const chargerEcheancierExistants = async () => {
    if (!classeId) return;
    
    try {
      setChargement(true);
      const response = await fetch(`/api/finance/echeanciers?classe_id=${classeId}&frais_scolaire_id=${fraisScolaireId}`);
      const data = await response.json();
      
      if (data.success && data.echeanciers.length > 0) {
        const echeancierExistants = data.echeanciers[0];
        setEcheancier(echeancierExistants);
        setNomEcheancier(echeancierExistants.nom_echeancier);
        setMontantTotal(echeancierExistants.montant_total);
        setNombreVersements(echeancierExistants.nombre_versements);
        setVersements(echeancierExistants.versements || []);
      }
    } catch (error) {
      console.error('Erreur chargement échéancier:', error);
    } finally {
      setChargement(false);
    }
  };

  const genererEcheancier = () => {
    const aujourdhui = new Date();
    const nouvelEcheancier = [];
    const montantParVersement = montantTotal / nombreVersements;

    for (let i = 1; i <= nombreVersements; i++) {
      const dateEcheance = new Date(aujourdhui);
      dateEcheance.setMonth(aujourdhui.getMonth() + (i - 1));
      
      nouvelEcheancier.push({
        numero_versement: i,
        montant_versement: montantParVersement,
        date_echeance: dateEcheance.toISOString().split('T')[0],
        pourcentage: 100 / nombreVersements,
        ordre: i
      });
    }

    setVersements(nouvelEcheancier);
  };

  const modifierVersement = (index: number, champ: string, valeur: any) => {
    const nouveauxVersements = [...versements];
    nouveauxVersements[index][champ] = valeur;
    
    // Recalculer le pourcentage si le montant change
    if (champ === 'montant_versement') {
      nouveauxVersements[index].pourcentage = (valeur / montantTotal) * 100;
    }
    
    setVersements(nouveauxVersements);
  };

  const sauvegarderEcheancier = async () => {
    try {
      const response = await fetch('/api/finance/echeanciers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classe_id: classeId,
          frais_scolaire_id: fraisScolaireId,
          nom_echeancier: nomEcheancier,
          montant_total: montantTotal,
          nombre_versements: nombreVersements,
          versements: versements
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Échéancier sauvegardé avec succès!');
        onEcheancierSauvegarde();
      } else {
        alert('Erreur: ' + data.erreur);
      }
    } catch (error) {
      alert('Erreur lors de la sauvegarde');
    }
  };

  // ✅ CORRECTION : Gestion sécurisée de onAnnuler
  const handleAnnuler = () => {
    if (onAnnuler) {
      onAnnuler();
    } else {
      // Comportement par défaut si onAnnuler n'est pas fourni
      console.log('Annulation de la gestion d\'échéancier');
      // Vous pouvez aussi fermer une modal ou revenir en arrière
      if (typeof window !== 'undefined') {
        window.history.back();
      }
    }
  };

  const totalCalcule = versements.reduce((sum, v) => sum + v.montant_versement, 0);
  const difference = montantTotal - totalCalcule;

  if (chargement) {
    return (
      <div className="chargement">
        <div className="spinner"></div>
        <p>Chargement de l'échéancier...</p>
      </div>
    );
  }

  return (
    <div className="gestion-echeancier">
      <div className="configuration-echeancier">
        <div className="groupe-champ-modern">
          <label>Nom de l'échéancier *</label>
          <input
            type="text"
            value={nomEcheancier}
            onChange={(e) => setNomEcheancier(e.target.value)}
            placeholder="Ex: Échéancier Terminale A 2025"
            className="input-modern"
          />
        </div>

        <div className="groupe-champ-modern">
          <label>Montant total (FCFA) *</label>
          <input
            type="number"
            value={montantTotal}
            onChange={(e) => setMontantTotal(parseFloat(e.target.value) || 0)}
            className="input-modern"
          />
        </div>

        <div className="groupe-champ-modern">
          <label>Nombre de versements</label>
          <select 
            value={nombreVersements} 
            onChange={(e) => setNombreVersements(parseInt(e.target.value))}
            className="input-modern"
          >
            <option value={2}>2 versements</option>
            <option value={3}>3 versements</option>
            <option value={4}>4 versements</option>
            <option value={5}>5 versements</option>
            <option value={6}>6 versements</option>
            <option value={8}>8 versements</option>
            <option value={10}>10 versements</option>
          </select>
        </div>

        <button onClick={genererEcheancier} className="bouton-primaire">
          🔄 Générer l'échéancier
        </button>
      </div>

      {difference !== 0 && (
        <div className={`alerte ${difference > 0 ? 'alerte-erreur' : 'alerte-avertissement'}`}>
          {difference > 0 
            ? `⚠️ Il manque ${formaterMontantFCFA(difference)}`
            : `⚠️ Excédent de ${formaterMontantFCFA(-difference)}`
          }
        </div>
      )}

      {versements.length > 0 && (
        <div className="tableau-versements">
          <h4>Détails des versements</h4>
          <table>
            <thead>
              <tr>
                <th>N°</th>
                <th>Montant (FCFA)</th>
                <th>Pourcentage</th>
                <th>Date d'échéance</th>
              </tr>
            </thead>
            <tbody>
              {versements.map((versement, index) => (
                <tr key={index}>
                  <td>{versement.numero_versement}</td>
                  <td>
                    <input
                      type="number"
                      value={versement.montant_versement}
                      onChange={(e) => modifierVersement(index, 'montant_versement', parseFloat(e.target.value) || 0)}
                      className="input-modern petit"
                    />
                  </td>
                  <td>{versement.pourcentage?.toFixed(1)}%</td>
                  <td>
                    <input
                      type="date"
                      value={versement.date_echeance}
                      onChange={(e) => modifierVersement(index, 'date_echeance', e.target.value)}
                      className="input-modern petit"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td><strong>Total</strong></td>
                <td><strong>{formaterMontantFCFA(totalCalcule)}</strong></td>
                <td><strong>{versements.reduce((sum, v) => sum + (v.pourcentage || 0), 0).toFixed(1)}%</strong></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div className="actions-modal-modern">
        {/* ✅ CORRECTION : Utilisation de handleAnnuler au lieu de onAnnuler directement */}
        <button className="bouton-secondaire-modern" onClick={handleAnnuler}>
          Annuler
        </button>
        <button 
          className="bouton-primaire-modern" 
          onClick={sauvegarderEcheancier}
          disabled={versements.length === 0 || difference !== 0 || !nomEcheancier}
        >
          💾 Sauvegarder l'échéancier
        </button>
      </div>

      <style jsx>{`
        .gestion-echeancier {
          max-width: 100%;
        }
        .configuration-echeancier {
          margin-bottom: 20px;
        }
        .tableau-versements {
          margin: 20px 0;
          overflow-x: auto;
        }
        .tableau-versements table {
          width: 100%;
          border-collapse: collapse;
        }
        .tableau-versements th,
        .tableau-versements td {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        .tableau-versements th {
          background: #f5f5f5;
          font-weight: bold;
        }
        .input-modern.petit {
          padding: 4px 8px;
          font-size: 14px;
        }
        .alerte {
          padding: 10px;
          margin: 10px 0;
          border-radius: 4px;
          font-weight: bold;
        }
        .alerte-erreur {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        .alerte-avertissement {
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        }
        .chargement {
          text-align: center;
          padding: 20px;
        }
        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 2s linear infinite;
          margin: 0 auto 10px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function formaterMontantFCFA(montant: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(montant);
}