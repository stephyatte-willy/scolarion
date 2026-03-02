'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '../services/authService';
import './connexion.css';

export default function PageConnexion() {
  const [email, setEmail] = useState(''); 
  const [motDePasse, setMotDePasse] = useState(''); 
  const [chargement, setChargement] = useState(false);
  const [chargementParametres, setChargementParametres] = useState(true);
  const [erreur, setErreur] = useState('');
  const [parametresEcole, setParametresEcole] = useState<any>(null);
  const [utilisateurTrouve, setUtilisateurTrouve] = useState<{nom: string, prenom: string, role: string} | null>(null);
  const [rechercheEnCours, setRechercheEnCours] = useState(false);
  const [erreurLogo, setErreurLogo] = useState(false);
  const router = useRouter();

  useEffect(() => {
    chargerParametresEcole();
  }, []);

  // Fonction pour rechercher l'utilisateur quand l'email change
  useEffect(() => {
    const rechercherUtilisateur = async () => {
      if (email && email.includes('@')) {
        setRechercheEnCours(true);
        const resultat = await AuthService.rechercherUtilisateurParEmail(email);
        
        if (resultat.success) {
          setUtilisateurTrouve(resultat.utilisateur || null);
        } else {
          setUtilisateurTrouve(null);
        }
        setRechercheEnCours(false);
      } else {
        setUtilisateurTrouve(null);
      }
    };

    const timeoutId = setTimeout(rechercherUtilisateur, 500);
    return () => clearTimeout(timeoutId);
  }, [email]);

  const chargerParametresEcole = async () => {
    try {
      setChargementParametres(true);
      setErreurLogo(false); // Reset l'erreur de logo
      
      const resultat = await AuthService.obtenirParametresEcole();
      
      if (resultat.success && resultat.parametres) {
        console.log('✅ Paramètres école chargés:', resultat.parametres);
        setParametresEcole(resultat.parametres);
      } else {
        console.error('Erreur chargement paramètres:', resultat.erreur);
        // Valeurs par défaut sans logo
        setParametresEcole({
          nom_ecole: "Établissement Scolaire",
          adresse: "Adresse non définie",
          telephone: "Téléphone non défini",
          email: "email@non-defini.com",
          logo_url: null,
          couleur_principale: "#3B82F6",
          slogan: "L'excellence éducative depuis 1985"
        });
      }
    } catch (error) {
      console.error('Erreur inattendue:', error);
      setParametresEcole({
        nom_ecole: "Établissement Scolaire",
        adresse: "Adresse non définie",
        telephone: "Téléphone non défini",
        email: "email@non-defini.com",
        logo_url: null,
        couleur_principale: "#3B82F6",
        slogan: "L'excellence éducative"
      });
    } finally {
      setChargementParametres(false);
    }
  };

  const gererSoumission = async (e: React.FormEvent) => {
    e.preventDefault();
    setChargement(true);
    setErreur('');

    try {
      const resultat = await AuthService.authentifierUtilisateur(email, motDePasse);
      
      if (resultat.success && resultat.utilisateur) {
        localStorage.setItem('utilisateur', JSON.stringify(resultat.utilisateur));
        localStorage.setItem('estConnecte', 'true');
        router.push('/tableau-de-bord');
      } else {
        setErreur(resultat.erreur || 'Email ou mot de passe incorrect');
      }
    } catch (error) {
      console.error('💥 Erreur inattendue:', error);
      setErreur('Une erreur est survenue lors de la connexion');
    } finally {
      setChargement(false);
    }
  };

  const initialiserBDD = async () => {
    setChargementParametres(true);
    setErreur('');
    
    const resultat = await AuthService.initialiserBaseDeDonnees();
    
    if (resultat.success) {
      await chargerParametresEcole();
    } else {
      setErreur('Erreur lors de l\'initialisation: ' + resultat.erreur);
    }
  };

  const formaterRole = (role: string) => {
    const roles: { [key: string]: string } = {
      'admin': 'Administrateur',
      'enseignant': 'Enseignant',
      'etudiant': 'Étudiant',
      'parent': 'Parent'
    };
    return roles[role] || role;
  };

  const gererErreurImage = () => {
    console.log('ℹ️ Le logo n\'est pas disponible, utilisation de l\'icône par défaut');
    setErreurLogo(true);
  };

  // Construire l'URL complète du logo
  const getLogoUrl = () => {
    if (parametresEcole?.logo_url) {
      // Si l'URL commence par /, c'est un chemin relatif
      if (parametresEcole.logo_url.startsWith('/')) {
        return parametresEcole.logo_url;
      }
      return `/${parametresEcole.logo_url}`;
    }
    return null;
  };

  return (
    <div className="conteneur-connexion">
      <div className="carte-connexion">
        {/* Section gauche - Informations école */}
        <div className="section-gauche">
          <div className="contenu-gauche">
            {chargementParametres ? (
              <div className="chargement-parametres">
                <div className="spinner"></div>
                <p>Chargement des paramètres...</p>
              </div>
            ) : parametresEcole ? (
              <>
                <div className="cercle-logo-ecole">
                  {!erreurLogo && getLogoUrl() ? (
                    <img 
                      src={getLogoUrl()!} 
                      alt="Logo Ecole"
                      className="image-logo-app"
                      onError={gererErreurImage}
                      onLoad={() => console.log('✅ Logo école chargé avec succès')}
                    />
                  ) : (
                    <span className="icone-app">🏫</span>
                  )}
                </div>
                
                <span className="nom-ecole">{parametresEcole.nom_ecole}</span>
                <p className="slogan-ecole">{parametresEcole.slogan}</p>
                
                <div className="informations-contact">
                  <div className="item-contact">
                    <span className="icone-contact">📍</span>
                    <span>{parametresEcole.adresse}</span>
                  </div>
                  <div className="item-contact">
                    <span className="icone-contact">📞</span>
                    <span>{parametresEcole.telephone}</span>
                  </div>
                  <div className="item-contact">
                    <span className="icone-contact">✉️</span>
                    <span>{parametresEcole.email}</span>
                  </div>
                  
                  {utilisateurTrouve && (
                    <div className="info-utilisateur-trouve fade-in">
                      <div className="avatar-utilisateur-mini">
                        {utilisateurTrouve.prenom[0]}{utilisateurTrouve.nom[0]}
                      </div>
                      <div className="details-utilisateur">
                        <div className="nom-complet">
                          {utilisateurTrouve.prenom} {utilisateurTrouve.nom}
                        </div>
                        <div className="role-utilisateur">
                          {formaterRole(utilisateurTrouve.role)}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {rechercheEnCours && (
                    <div className="recherche-en-cours">
                      <div className="spinner-mini"></div>
                      <span>Recherche de l'utilisateur...</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="erreur-parametres">
                <p>❌ Impossible de charger les paramètres</p>
                <button 
                  onClick={initialiserBDD}
                  className="bouton-init-bdd"
                >
                  Initialiser la BDD
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Section droite - Formulaire de connexion */}
        <div className="section-droite">
          <div className="contenu-droite">
            <div className="en-tete-connexion">
              <div className="logo-application">
                <div className="cercle-app">
                  {!erreurLogo ? (
                    <img 
                      src="/logo_scolarion.png" 
                      alt="Logo Scolarion"
                      onError={gererErreurImage}
                      onLoad={() => console.log('✅ Logo app chargé avec succès')}
                    />
                  ) : (
                    <span className="icone-app">📚</span>
                  )}
                </div>
              </div>
              <span className="titre-application-connexion">Scolarion</span>
              <p className="sous-titre">Plateforme de Gestion Scolaire</p>
            </div>

            <form onSubmit={gererSoumission} className="formulaire-connexion">
              <div className="groupe-champ">
                <label htmlFor="email" className="label-champ">
                  Adresse Email
                </label>
                <div className="conteneur-input">
                  <span className="icone-input">✉️</span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-champ"
                    placeholder="Votre email"
                    required
                    disabled={chargement}
                  />
                </div>
              </div>

              <div className="groupe-champ">
                <label htmlFor="motDePasse" className="label-champ">
                  Mot de Passe
                </label>
                <div className="conteneur-input">
                  <span className="icone-input">🔒</span>
                  <input
                    id="motDePasse"
                    type="password"
                    value={motDePasse}
                    onChange={(e) => setMotDePasse(e.target.value)}
                    className="input-champ"
                    placeholder="Votre mot de passe"
                    required
                    disabled={chargement}
                  />
                </div>
              </div>

              {erreur && (
                <div className="message-erreur">
                  ❌ {erreur}
                </div>
              )}

              <button
                type="submit"
                disabled={chargement}
                className={`bouton-connexion ${chargement ? 'chargement' : ''}`}
              >
                {chargement ? (
                  <>
                    <div className="spinner"></div>
                    Connexion en cours...
                  </>
                ) : (
                  'Se Connecter'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}