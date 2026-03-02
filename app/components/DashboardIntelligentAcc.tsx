'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './DashboardIntelligentAcc.css';

// Définition des types
interface StatistiquesDashboard {
  eleves: {
    total: number;
    garcons: number;
    filles: number;
    parClasse: Array<{ 
      id: number; 
      nom: string; 
      niveau: string; 
      total_eleves: number;
    }>;
  };
  classes: {
    total: number;
    avecProfs: number;
    liste: Array<{ 
      id: number; 
      nom: string; 
      niveau: string; 
      nombre_eleves: number; 
      nom_professeur_principal: string | null 
    }>;
  };
  personnel: {
    total: number;
    professeurs: number;
    instituteurs: number;
    administratif: number;
  };
  cours: {
    total: number;
    aujourdhui: number;
    cetteSemaine: Array<{ jour: string; count: number }>;
  };
  notes: {
    totalSaisies: number;
    dernieresNotes: Array<{ 
      id: number; 
      eleve_nom: string; 
      eleve_prenom?: string;
      matiere: string; 
      note: number; 
      date: string;
      appreciation?: string;
    }>;
  };
  absences: {
    totalSemaine: number;      // Total des absences de la semaine
    cetteSemaine: Array<{ 
      date: string; 
      count: number;
      jour: string;
    }>;
    nonJustifiees: number;     // Absences non justifiées de la semaine
    dernieresAbsences: Array<{
      id: number;
      eleve_id: number;
      eleve_nom: string;
      eleve_prenom?: string;
      date_absence: string;
      type_absence: string;
      justifiee: boolean;
      motif?: string;
      classe_nom?: string;
      duree_minutes?: number;
    }>;
  };
}

// Types pour l'utilisateur et ses rôles
interface Utilisateur {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  avatar_url?: string;
  statut: string;
}

interface Role {
  id: number;
  nom: string;
  description?: string;
  niveau: number;
}

interface UserRole {
  user_id: number;
  role_id: number;
  role?: Role;
}

interface Props {
  formaterMontant?: (montant: number) => string;
  formaterDate?: (date: Date | string) => string;
  deviseSymbole?: string;
}

// Composant pour les cartes statistiques
const StatCard: React.FC<{
  title: string;
  value: number | string;
  icon: string;
  gradient: string;
  subtext?: string;
  trend?: { value: number; isPositive: boolean };
  onClick?: () => void;
}> = ({ title, value, icon, gradient, subtext, trend, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    }
  }, [onClick]);

  return (
    <div
      className="stat-card-dashboard"
      style={{ background: gradient }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className="stat-card-header">
        <span className="stat-icon">{icon}</span>
        <h3>{title}</h3>
      </div>
      <div className="stat-card-body">
        <div className="stat-main-value">
          {value}
          {subtext && <span className="stat-unit">{subtext}</span>}
        </div>
        {trend && (
          <div className={`stat-trend ${trend.isPositive ? 'positive' : 'negative'}`}>
            {trend.isPositive ? '▲' : '▼'} {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      {isHovered && onClick && (
        <div className="stat-card-hover-effect">
          <span>Voir les détails →</span>
        </div>
      )}
    </div>
  );
};

// COMPOSANT GRAPHIQUE SIMPLE QUI FONCTIONNE
const SimpleBarChart: React.FC<{
  data: Array<{ label: string; value: number; color?: string }>;
  title?: string;
}> = ({ data, title }) => {
  console.log(`📊 ${title} - Rendu avec`, data.length, 'éléments');

  if (!data || data.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px 20px',
        background: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>📊</div>
        <p>Aucune donnée disponible</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div style={{ width: '100%' }}>
      {/* Version texte des données pour vérification */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-around',
        marginBottom: '20px',
        padding: '6px',
        borderRadius: '8px',
        fontSize: '12px'
      }}>
      </div>

      {/* Version graphique simple */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: '200px',
        gap: '10px',
        padding: '10px 0'
      }}>
        {data.map((item, index) => {
          const height = (item.value / maxValue) * 180;
          
          return (
            <div key={index} style={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1
            }}>
              <div style={{ 
                height: `${Math.max(height, 5)}px`,
                width: '40px',
                background: item.color || '#FFB347',
                borderRadius: '8px 8px 0 0',
                marginBottom: '8px',
                transition: 'height 0.3s ease',
                position: 'relative'
              }}>
                <span style={{
                  position: 'absolute',
                  top: '-20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}>
                  {item.value}
                </span>
              </div>
              <span style={{ fontSize: '8px'}}>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Composant pour les activités récentes
const ActivityItem: React.FC<{
  icon: string;
  title: string;
  description: string;
  time: string;
  gradient: string;
  onClick?: () => void;
}> = ({ icon, title, description, time, gradient, onClick }) => {
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    }
  }, [onClick]);

  return (
    <div 
      className="activity-item-dashboard" 
      onClick={handleClick}
    >
      <div className="activity-icon" style={{ background: gradient }}>
        {icon}
      </div>
      <div className="activity-content">
        <div className="activity-title">{title}</div>
        <div className="activity-description">{description}</div>
        <div className="activity-time">{time}</div>
      </div>
    </div>
  );
};

export default function DashboardIntelligentAcc({ 
  formaterMontant, 
  formaterDate: propsFormaterDate, 
  deviseSymbole = 'F CFA' 
}: Props) {
  // États pour les données
  const [stats, setStats] = useState<StatistiquesDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animateIn, setAnimateIn] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [debugInfo, setDebugInfo] = useState<any>({});
  
  // États pour l'utilisateur et ses rôles
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [rolePrincipal, setRolePrincipal] = useState<string>('');

  // Animation d'entrée
  useEffect(() => {
    setAnimateIn(true);
    const timer = setTimeout(() => setAnimateIn(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Mise à jour de l'horloge
  useEffect(() => {
    const interval = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Charger les informations de l'utilisateur depuis localStorage
  useEffect(() => {
    const chargerUtilisateur = () => {
      try {
        const userData = localStorage.getItem('utilisateur');
        if (userData) {
          const user = JSON.parse(userData);
          setUtilisateur(user);
          chargerRolesUtilisateur(user.id);
        }
      } catch (error) {
        console.error('Erreur chargement utilisateur:', error);
      }
    };

    chargerUtilisateur();
  }, []);

  // Charger les rôles de l'utilisateur
  const chargerRolesUtilisateur = async (userId: number) => {
    try {
      const response = await fetch(`/api/utilisateurs/${userId}/roles`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.roles)) {
          setUserRoles(data.roles);
          
          // Trouver le rôle principal (le plus élevé)
          if (data.roles.length > 0) {
            // Trier par niveau et prendre le plus élevé
            const rolesAvecNiveau = data.roles.filter((r: any) => r.role_niveau !== undefined);
            if (rolesAvecNiveau.length > 0) {
              const rolePrincipal = rolesAvecNiveau.sort((a: any, b: any) => b.role_niveau - a.role_niveau)[0];
              setRolePrincipal(rolePrincipal.role_nom);
            } else {
              // Fallback: prendre le premier rôle
              setRolePrincipal(data.roles[0].role_nom);
            }
          }
        }
      }
    } catch (error) {
      console.error('Erreur chargement rôles:', error);
    }
  };

  // Fonction de navigation
  const handleNavigation = useCallback((page: string) => {
    console.log(`Navigation vers ${page}`);
    const event = new CustomEvent('dashboard-navigation', { 
      detail: { page } 
    });
    window.dispatchEvent(event);
  }, []);

  // Formater une date
  const formaterDate = (date: Date | string): string => {
    if (propsFormaterDate) {
      return propsFormaterDate(date);
    }
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Formater une date pour l'affichage (avec le nom du jour)
  const formaterDateAvecJour = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit'
    });
  };

  // Obtenir les dates de la semaine courante
  const getSemaineCourante = () => {
    const aujourdhui = new Date();
    const debutSemaine = new Date(aujourdhui);
    debutSemaine.setDate(aujourdhui.getDate() - aujourdhui.getDay() + 1); // Lundi
    const finSemaine = new Date(aujourdhui);
    finSemaine.setDate(aujourdhui.getDate() + (7 - aujourdhui.getDay())); // Dimanche
    
    return {
      debut: debutSemaine.toISOString().split('T')[0],
      fin: finSemaine.toISOString().split('T')[0]
    };
  };

  // Chargement des données statistiques
  useEffect(() => {
    const chargerStatistiques = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🔍 Début du chargement des statistiques...');
        
        const safeFetch = async (url: string) => {
          try {
            const response = await fetch(url, {
              cache: 'no-store',
              headers: { 'Cache-Control': 'no-cache' }
            });
            
            if (!response.ok) {
              console.warn(`⚠️ API ${url} a retourné ${response.status}`);
              return null;
            }
            const text = await response.text();
            if (!text || text.trim() === '') {
              console.warn(`⚠️ API ${url} a retourné une réponse vide`);
              return null;
            }
            try {
              return JSON.parse(text);
            } catch (parseError) {
              console.error(`❌ Erreur parsing JSON pour ${url}:`, parseError);
              return null;
            }
          } catch (fetchError) {
            console.error(`❌ Erreur fetch pour ${url}:`, fetchError);
            return null;
          }
        };

        const [elevesData, classesData, personnelData, coursData, notesData, absencesData] = await Promise.all([
          safeFetch('/api/eleves/statistiques'),
          safeFetch('/api/classes'),
          safeFetch('/api/enseignants/statistiques'),
          safeFetch('/api/cours'),
          safeFetch('/api/notes/dernieres?limite=5'),
          safeFetch('/api/absences'), // Récupérer TOUTES les absences
        ]);

        console.log('📊 Données reçues:', {
          eleves: elevesData,
          classes: classesData,
          personnel: personnelData,
          cours: coursData,
          notes: notesData,
          absences: absencesData
        });

        // Traitement des données élèves
        let elevesParClasse: Array<{ id: number; nom: string; niveau: string; total_eleves: number }> = [];
        let totalEleves = 0;
        let garcons = 0;
        let filles = 0;

        if (elevesData?.success) {
          if (elevesData.statistiques) {
            totalEleves = elevesData.statistiques.total || 0;
            garcons = elevesData.statistiques.garcons || 0;
            filles = elevesData.statistiques.filles || 0;
            
            if (elevesData.statistiques.parClasse && Array.isArray(elevesData.statistiques.parClasse)) {
              elevesParClasse = elevesData.statistiques.parClasse;
            }
          }
        }

        // Traitement des données classes
        let classesListe: Array<any> = [];
        let totalClasses = 0;
        let classesAvecProfs = 0;

        if (classesData?.success && classesData.classes) {
          classesListe = classesData.classes;
          totalClasses = classesListe.length;
          classesAvecProfs = classesListe.filter((c: any) => c.professeur_principal_id).length;
        }

        // Traitement des données personnel
        let totalPersonnel = 0;
        let professeurs = 0;
        let instituteurs = 0;
        let administratif = 0;

        if (personnelData?.success) {
          if (personnelData.statistiques) {
            totalPersonnel = personnelData.statistiques.total || 0;
            
            if (personnelData.statistiques.parType && Array.isArray(personnelData.statistiques.parType)) {
              personnelData.statistiques.parType.forEach((type: any) => {
                const typePers = type.type_personnel || type.type_enseignant;
                if (typePers === 'professeur') {
                  professeurs = type.total || 0;
                } else if (typePers === 'instituteur') {
                  instituteurs = type.total || 0;
                } else if (typePers === 'administratif') {
                  administratif = type.total || 0;
                }
              });
            }
          }
        }

        if (totalPersonnel > 0 && professeurs === 0 && instituteurs === 0 && administratif === 0) {
          professeurs = Math.round(totalPersonnel * 0.5);
          instituteurs = Math.round(totalPersonnel * 0.3);
          administratif = totalPersonnel - professeurs - instituteurs;
        }

        // Traitement des données cours
        let totalCours = 0;
        let coursAujourdhui = 0;
        let coursParJour: Array<{ jour: string; count: number }> = [];

        if (coursData?.success && coursData.cours) {
          totalCours = coursData.cours.length || 0;
          const aujourdhui = getTodayFrench();
          coursAujourdhui = coursData.cours.filter((c: any) => c.jour_semaine === aujourdhui).length || 0;
          
          const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
          coursParJour = jours.map(jour => ({
            jour,
            count: coursData.cours.filter((c: any) => c.jour_semaine === jour).length
          }));
        }

        // Traitement des données notes
        let dernieresNotes: any[] = [];
        let totalNotes = 0;

        if (notesData?.success && notesData.notes) {
          dernieresNotes = notesData.notes;
          totalNotes = notesData.total || dernieresNotes.length;
        }

        // TRAITEMENT DES ABSENCES - CORRECTION IMPORTANTE
        let totalAbsencesSemaine = 0;
        let absencesNonJustifieesSemaine = 0;
        let dernieresAbsences: any[] = [];
        let absencesParJourSemaine: Array<{ date: string; count: number; jour: string }> = [];

        if (absencesData?.success && absencesData.absences) {
          const toutesAbsences = absencesData.absences;
          console.log('📊 Toutes les absences reçues:', toutesAbsences.length);
          
          // Obtenir la semaine courante
          const { debut, fin } = getSemaineCourante();
          console.log('📅 Semaine courante:', debut, 'à', fin);
          
          // Filtrer les absences de la semaine courante
          const absencesSemaine = toutesAbsences.filter((a: any) => {
            const dateAbsence = new Date(a.date_absence);
            const dateDebut = new Date(debut);
            const dateFin = new Date(fin);
            return dateAbsence >= dateDebut && dateAbsence <= dateFin;
          });
          
          console.log('📊 Absences de la semaine:', absencesSemaine.length);
          
          totalAbsencesSemaine = absencesSemaine.length;
          absencesNonJustifieesSemaine = absencesSemaine.filter((a: any) => a.justifiee === 0).length;
          
          // Grouper par jour pour le graphique
          const absencesParJour: Record<string, { count: number, date: string }> = {};
          
          absencesSemaine.forEach((a: any) => {
            const dateStr = a.date_absence;
            if (!absencesParJour[dateStr]) {
              absencesParJour[dateStr] = { count: 0, date: dateStr };
            }
            absencesParJour[dateStr].count++;
          });
          
          // Convertir en tableau pour l'affichage
          absencesParJourSemaine = Object.values(absencesParJour).map(item => {
            const date = new Date(item.date);
            const jours = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
            return {
              date: item.date,
              count: item.count,
              jour: jours[date.getDay()]
            };
          }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          // Prendre les 5 dernières absences pour l'affichage
          dernieresAbsences = absencesSemaine
            .sort((a: any, b: any) => new Date(b.date_absence).getTime() - new Date(a.date_absence).getTime())
            .slice(0, 5)
            .map((a: any) => ({
              id: a.id,
              eleve_id: a.eleve_id,
              eleve_nom: a.eleve_nom || 'Inconnu',
              eleve_prenom: a.eleve_prenom || '',
              date_absence: a.date_absence,
              type_absence: a.type_absence || 'absence',
              justifiee: a.justifiee === 1,
              motif: a.motif,
              classe_nom: a.classe_nom,
              duree_minutes: a.duree_minutes
            }));
          
          console.log('📊 Dernières absences de la semaine:', dernieresAbsences);
        }

        const nouvellesStats: StatistiquesDashboard = {
          eleves: {
            total: totalEleves,
            garcons: garcons,
            filles: filles,
            parClasse: elevesParClasse,
          },
          classes: {
            total: totalClasses,
            avecProfs: classesAvecProfs,
            liste: classesListe,
          },
          personnel: {
            total: totalPersonnel,
            professeurs: professeurs,
            instituteurs: instituteurs,
            administratif: administratif,
          },
          cours: {
            total: totalCours,
            aujourdhui: coursAujourdhui,
            cetteSemaine: coursParJour,
          },
          notes: {
            totalSaisies: totalNotes,
            dernieresNotes: dernieresNotes,
          },
          absences: {
            totalSemaine: totalAbsencesSemaine,
            cetteSemaine: absencesParJourSemaine,
            nonJustifiees: absencesNonJustifieesSemaine,
            dernieresAbsences: dernieresAbsences,
          },
        };

        console.log('✅ Statistiques finales des absences:', nouvellesStats.absences);
        setDebugInfo({
          elevesParClasse: nouvellesStats.eleves.parClasse,
          coursParJour: nouvellesStats.cours.cetteSemaine,
          absences: nouvellesStats.absences
        });
        setStats(nouvellesStats);
      } catch (error) {
        console.error('💥 Erreur majeure chargement dashboard:', error);
        setError('Impossible de charger les données. Veuillez rafraîchir la page.');
      } finally {
        setLoading(false);
      }
    };

    chargerStatistiques();
  }, []);

  // Utilitaires
  const getTodayFrench = (): string => {
    const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return jours[new Date().getDay()];
  };

  const formatDateHeure = () => {
    const date = currentDateTime.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const heure = currentDateTime.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${date} à ${heure}`;
  };

  // Obtenir le message de bienvenue avec le rôle
  const getWelcomeMessage = () => {
    if (!utilisateur) return 'Bonjour, visiteur';
    
    const prenom = utilisateur.prenom || '';
    const nom = utilisateur.nom || '';
    const nomComplet = prenom && nom ? `${prenom} ${nom}` : (prenom || nom || 'utilisateur');
    
    if (rolePrincipal) {
      return `Bonjour ${nomComplet} (${rolePrincipal})`;
    } else if (userRoles.length > 0) {
      const rolesNoms = userRoles.map(ur => ur.role?.nom || 'Rôle').join(', ');
      return `Bonjour ${nomComplet} (${rolesNoms})`;
    } else {
      return `Bonjour ${nomComplet}`;
    }
  };

  // Données pour les graphiques
  const chartDataClasses = useMemo(() => {
    if (!stats?.eleves.parClasse) return [];
    
    return stats.eleves.parClasse.map((c, index) => ({
      label: c.niveau ? (c.nom ? `${c.niveau} ${c.nom}`.substring(0, 8) : c.niveau.substring(0, 8)) : 'Classe',
      value: c.total_eleves || 0,
      color: ['#FFB347', '#FF8C42', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][index % 6]
    }));
  }, [stats]);

  const chartDataCours = useMemo(() => {
    if (!stats?.cours.cetteSemaine) return [];
    
    return stats.cours.cetteSemaine.map((item, index) => ({
      label: item.jour?.substring(0, 3) || 'Jour',
      value: item.count || 0,
      color: ['#FFB347', '#FF8C42', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][index % 6]
    }));
  }, [stats]);

  // Palettes de couleurs
  const gradients = {
    primary: 'linear-gradient(135deg, #FFF5E6 0%, #FFE8D4 100%)',
    secondary: 'linear-gradient(135deg, #E6F3FF 0%, #D4E8FF 100%)',
    tertiary: 'linear-gradient(135deg, #F0F9FF 0%, #E6F3F5 100%)',
    quaternary: 'linear-gradient(135deg, #FFF0F0 0%, #FFE4E4 100%)',
    purple: 'linear-gradient(135deg, #F3E8FF 0%, #E8D6FF 100%)',
    pink: 'linear-gradient(135deg, #FFF0F5 0%, #FFE4ED 100%)',
    green: 'linear-gradient(135deg, #F0FFF0 0%, #E0FFE0 100%)',
    orange: 'linear-gradient(135deg, #FFF3E0 0%, #FFE8D4 100%)',
  };

  if (loading) {
    return (
      <div className={`dashboard-loading ${animateIn ? 'animate-in' : ''}`}>
        <div className="loading-spinner"></div>
        <p>Chargement de votre tableau de bord...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="error-icon">⚠️</div>
        <h2>Oups ! Une erreur est survenue</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="error-retry">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className={`dashboard-intelligent ${animateIn ? 'animate-in' : ''}`}>
      {/* En-tête */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="dashboard-title">
            <span className="title-wave">✨</span> Tableau de Bord
          </h1>
          <p className="dashboard-subtitle">{formatDateHeure()}</p>
        </div>
        <div className="header-right">
          <div className="welcome-message">
            {getWelcomeMessage()}
          </div>
          <button className="refresh-button" onClick={() => window.location.reload()}>
            ↻ Actualiser
          </button>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="stats-grid">
        <StatCard
          title="Élèves"
          value={stats?.eleves.total || 0}
          icon="👨‍🎓"
          gradient={gradients.orange}
          subtext={`${stats?.eleves.garcons || 0} G · ${stats?.eleves.filles || 0} F`}
          onClick={() => handleNavigation('eleves')}
        />
        <StatCard
          title="Personnel"
          value={stats?.personnel.total || 0}
          icon="👨‍🏫"
          gradient={gradients.green}
          subtext={`${stats?.personnel.professeurs || 0} Prof · ${stats?.personnel.instituteurs || 0} Inst`}
          onClick={() => handleNavigation('personnel')}
        />
        <StatCard
          title="Classes"
          value={stats?.classes.total || 0}
          icon="🏫"
          gradient={gradients.secondary}
          subtext={`${stats?.classes.avecProfs || 0} avec professeur`}
          onClick={() => handleNavigation('classes')}
        />
        <StatCard
          title="Cours"
          value={stats?.cours.total || 0}
          icon="📚"
          gradient={gradients.pink}
          subtext={`${stats?.cours.aujourdhui || 0} aujourd'hui`}
          onClick={() => handleNavigation('cours')}
        />
        <StatCard
          title="Notes"
          value={stats?.notes.totalSaisies || 0}
          icon="📝"
          gradient={gradients.purple}
          subtext="saisies"
          onClick={() => handleNavigation('notes')}
        />
        <StatCard
          title="Absences"
          value={stats?.absences.totalSemaine || 0}
          icon="🚫"
          gradient={gradients.quaternary}
          subtext={`${stats?.absences.nonJustifiees || 0} non justifiées`}
          onClick={() => handleNavigation('absences')}
        />
      </div>

      {/* Section des graphiques */}
      <div className="charts-section">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Répartition des Élèves par Classe</h3>
            <span className="chart-badge">
              👥 {stats?.eleves.total || 0} élèves
            </span>
          </div>
          <SimpleBarChart 
            data={chartDataClasses} 
            title="Répartition des Élèves" 
          />
        </div>

        {/* Graphique 2: Cours cette Semaine */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Cours cette Semaine</h3>
            <span className="chart-badge">
              📅 {stats?.cours.cetteSemaine.reduce((acc, j) => acc + (j.count || 0), 0)} cours
            </span>
          </div>
          <SimpleBarChart 
            data={chartDataCours} 
            title="Cours par Jour" 
          />
        </div>
      </div>

      {/* Section des widgets avancés */}
      <div className="widgets-section">
        {/* Composition du Personnel */}
        <div className="widget-card">
          <div className="widget-header">
            <h3>🧑‍🏫 Composition du Personnel</h3>
            <span className="widget-badge">
              {stats?.personnel.total || 0} total
            </span>
          </div>
          <div className="personnel-chart">
            {stats?.personnel && stats.personnel.total > 0 ? (
              <div className="personnel-details">
                <div className="personnel-item">
                  <span className="item-label">Professeurs</span>
                  <span className="item-value">{stats.personnel.professeurs}</span>
                  <div className="item-bar">
                    <div
                      className="bar-fill"
                      style={{ 
                        width: `${(stats.personnel.professeurs / stats.personnel.total) * 100}%`,
                        background: 'linear-gradient(90deg, #FFB347, #FF8C42)'
                      }}
                    ></div>
                  </div>
                </div>
                <div className="personnel-item">
                  <span className="item-label">Instituteurs</span>
                  <span className="item-value">{stats.personnel.instituteurs}</span>
                  <div className="item-bar">
                    <div
                      className="bar-fill"
                      style={{ 
                        width: `${(stats.personnel.instituteurs / stats.personnel.total) * 100}%`,
                        background: 'linear-gradient(90deg, #4ECDC4, #45B7D1)'
                      }}
                    ></div>
                  </div>
                </div>
                <div className="personnel-item">
                  <span className="item-label">Administratif</span>
                  <span className="item-value">{stats.personnel.administratif}</span>
                  <div className="item-bar">
                    <div
                      className="bar-fill"
                      style={{ 
                        width: `${(stats.personnel.administratif / stats.personnel.total) * 100}%`,
                        background: 'linear-gradient(90deg, #FF6B6B, #FF8C42)'
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="widget-empty">
                <div className="widget-empty-icon">👥</div>
                <p>Aucune donnée personnel</p>
                <small>Les statistiques apparaîtront ici</small>
              </div>
            )}
          </div>
          <button className="widget-action" onClick={() => handleNavigation('personnel')}>
            Gérer le personnel →
          </button>
        </div>

        {/* Dernières Notes */}
        <div className="widget-card">
          <div className="widget-header">
            <h3>📝 Dernières Notes</h3>
            <span className="widget-badge">
              {stats?.notes.totalSaisies || 0} total
            </span>
          </div>
          <div className="activities-list">
            {stats?.notes.dernieresNotes && stats.notes.dernieresNotes.length > 0 ? (
              stats.notes.dernieresNotes.slice(0, 5).map((note, index) => (
                <ActivityItem
                  key={index}
                  icon="📝"
                  title={`${note.eleve_prenom || ''} ${note.eleve_nom || 'Élève'}`}
                  description={`${note.matiere || 'Matière'}: ${note.note || '0'}/20`}
                  time={note.date ? formaterDate(note.date) : 'Date inconnue'}
                  gradient="linear-gradient(135deg, #FFB34720, #FF8C4220)"
                  onClick={() => handleNavigation('notes')}
                />
              ))
            ) : (
              <div className="widget-empty">
                <div className="widget-empty-icon">📝</div>
                <p>Aucune note récente</p>
                <small>Les notes apparaîtront ici</small>
              </div>
            )}
          </div>
          <button className="widget-action" onClick={() => handleNavigation('notes')}>
            Voir toutes les notes →
          </button>
        </div>

        {/* Dernières Absences - CORRIGÉ */}
        <div className="widget-card">
          <div className="widget-header">
            <h3>🚫 Absences Recentes</h3>
            <span className="widget-badge">
              {stats?.absences.totalSemaine || 0} cette semaine
            </span>
          </div>
          <div className="activities-list">
            {stats?.absences.dernieresAbsences && stats.absences.dernieresAbsences.length > 0 ? (
              stats.absences.dernieresAbsences.slice(0, 5).map((absence, index) => (
                <ActivityItem
                  key={index}
                  icon={absence.justifiee ? '✓' : '⚠️'}
                  title={`${absence.eleve_prenom || ''} ${absence.eleve_nom || 'Élève'}`}
                  description={`${absence.type_absence || 'absence'}${absence.motif ? ` - ${absence.motif}` : ''}${!absence.justifiee ? ' (non justifiée)' : ''}`}
                  time={formaterDateAvecJour(absence.date_absence)}
                  gradient={absence.justifiee ? 'linear-gradient(135deg, #4ECDC420, #45B7D120)' : 'linear-gradient(135deg, #FF6B6B20, #FF8C4220)'}
                  onClick={() => handleNavigation('absences')}
                />
              ))
            ) : (
              <div className="widget-empty">
                <div className="widget-empty-icon">✅</div>
                <p>Aucune absence cette semaine</p>
                <small>Tous les élèves sont présents</small>
              </div>
            )}
          </div>
          <button className="widget-action" onClick={() => handleNavigation('absences')}>
            Voir toutes les absences →
          </button>
        </div>
      </div>

      {/* Barre de navigation rapide */}
      <div className="quick-nav-bar">
        <button className="nav-item" onClick={() => handleNavigation('eleves')}>
          <span className="nav-icon">👨‍🎓</span>
          <span className="nav-label">Élèves</span>
        </button>
        <button className="nav-item" onClick={() => handleNavigation('classes')}>
          <span className="nav-icon">🏫</span>
          <span className="nav-label">Classes</span>
        </button>
        <button className="nav-item" onClick={() => handleNavigation('personnel')}>
          <span className="nav-icon">👨‍🏫</span>
          <span className="nav-label">Personnel</span>
        </button>
        <button className="nav-item" onClick={() => handleNavigation('cours')}>
          <span className="nav-icon">📚</span>
          <span className="nav-label">Cours</span>
        </button>
        <button className="nav-item" onClick={() => handleNavigation('emploi')}>
          <span className="nav-icon">📅</span>
          <span className="nav-label">Emploi</span>
        </button>
        <button className="nav-item" onClick={() => handleNavigation('notes')}>
          <span className="nav-icon">📝</span>
          <span className="nav-label">Notes</span>
        </button>
        <button className="nav-item" onClick={() => handleNavigation('absences')}>
          <span className="nav-icon">🚫</span>
          <span className="nav-label">Absences</span>
        </button>
      </div>
    </div>
  );
}