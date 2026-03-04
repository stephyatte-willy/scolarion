-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Hôte : localhost
-- Généré le : mer. 04 mars 2026 à 02:59
-- Version du serveur : 10.11.15-MariaDB-deb12
-- Version de PHP : 8.2.29

SET SESSION sql_require_primary_key = OFF;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `westc2710564_1wzu2u`
--

-- --------------------------------------------------------

--
-- Structure de la table `absences`
--


CREATE TABLE `absences` (
  `id` int(11) NOT NULL,
  `eleve_id` int(11) NOT NULL,
  `date_absence` date NOT NULL,
  `heure_debut` time DEFAULT NULL,
  `heure_fin` time DEFAULT NULL,
  `type_absence` enum('absence','retard','sortie_anticipée','exclusion') DEFAULT 'absence',
  `duree_minutes` int(11) DEFAULT 0,
  `justifiee` tinyint(1) DEFAULT 0,
  `motif` varchar(255) DEFAULT NULL,
  `piece_justificative` varchar(255) DEFAULT NULL,
  `saisie_par` int(11) NOT NULL,
  `classe_id` int(11) NOT NULL,
  `cours_id` varchar(20) DEFAULT NULL,
  `periode_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `alertes_absences`
--

CREATE TABLE `alertes_absences` (
  `id` int(11) NOT NULL,
  `eleve_id` int(11) NOT NULL,
  `type_alerte` enum('seuil_atteint','absence_prolongee','tendance') DEFAULT 'seuil_atteint',
  `message` text NOT NULL,
  `seuil` varchar(50) DEFAULT NULL,
  `date_alerte` date NOT NULL,
  `vu_par_parent` tinyint(1) DEFAULT 0,
  `vu_par_professeur` tinyint(1) DEFAULT 0,
  `traitee` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `annees_scolaires`
--

CREATE TABLE `annees_scolaires` (
  `id` int(11) NOT NULL,
  `libelle` varchar(20) NOT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  `est_active` tinyint(1) DEFAULT 0,
  `est_cloturee` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `annees_scolaires`
--

INSERT INTO `annees_scolaires` (`id`, `libelle`, `date_debut`, `date_fin`, `est_active`, `est_cloturee`, `created_at`, `updated_at`) VALUES
(1, '2025-2026', '2025-09-08', '2026-07-30', 1, 0, '2026-02-19 10:11:09', '2026-03-01 11:59:30');

-- --------------------------------------------------------

--
-- Structure de la table `audit_budgets`
--

CREATE TABLE `audit_budgets` (
  `id` int(11) NOT NULL,
  `budget_id` int(11) NOT NULL,
  `action` enum('creation','modification','suppression','depense_ajoutee','depense_modifiee','depense_supprimee') CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `ancienne_valeur` text CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `nouvelle_valeur` text CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `utilisateur_id` int(11) DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `budgets`
--

CREATE TABLE `budgets` (
  `id` int(11) NOT NULL,
  `annee_scolaire` varchar(9) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `categorie` varchar(50) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `montant_alloue` decimal(10,2) NOT NULL DEFAULT 0.00,
  `description` text CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `bulletins_eleves`
--

CREATE TABLE `bulletins_eleves` (
  `id` int(11) NOT NULL,
  `eleve_id` int(11) NOT NULL,
  `eleve_nom` varchar(100) NOT NULL,
  `eleve_prenom` varchar(100) NOT NULL,
  `periode_id` int(11) NOT NULL,
  `periode_nom` varchar(50) NOT NULL,
  `moyenne_generale` decimal(5,2) DEFAULT 0.00,
  `rang_classe` int(11) DEFAULT NULL,
  `rang_niveau` int(11) DEFAULT NULL,
  `appreciation_generale` text DEFAULT NULL,
  `appreciation_prof_principal` text DEFAULT NULL,
  `nombre_absences` int(11) DEFAULT 0,
  `nombre_retards` int(11) DEFAULT 0,
  `est_valide` tinyint(1) DEFAULT 0,
  `valide_par` int(11) DEFAULT NULL,
  `valide_par_nom` varchar(200) DEFAULT NULL,
  `date_validation` date DEFAULT NULL,
  `date_impression` date DEFAULT NULL,
  `classe_id` int(11) DEFAULT NULL,
  `classe_nom` varchar(100) DEFAULT NULL,
  `annee_scolaire` varchar(9) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `categories_frais`
--

CREATE TABLE `categories_frais` (
  `id` int(11) NOT NULL,
  `nom` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `description` text CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `type` enum('scolarite','inscription','divers','penalite','cantine','materiel','uniforme','activites','transport','autre') CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `montant_base` decimal(10,0) DEFAULT NULL,
  `periodicite` enum('unique','mensuel','trimestriel','annuel') CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT 'unique',
  `statut` enum('actif','inactif') CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT 'actif',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `categories_frais`
--

INSERT INTO `categories_frais` (`id`, `nom`, `description`, `type`, `montant_base`, `periodicite`, `statut`, `created_at`, `updated_at`) VALUES
(1, 'Scolarité', 'scolarité', 'scolarite', NULL, 'mensuel', 'actif', '2025-11-24 23:48:10', '2026-02-11 09:46:50'),
(2, 'Inscription', 'Frais d\'inscription annuels', 'inscription', NULL, 'unique', 'actif', '2025-11-24 23:48:10', '2026-02-11 09:47:00'),
(3, 'Cantine', 'Frais de restauration scolaire', 'cantine', NULL, 'mensuel', 'actif', '2025-11-24 23:48:10', '2025-12-02 07:48:34'),
(4, 'Transport', 'Transport scolaire', 'transport', NULL, 'mensuel', 'actif', '2025-11-24 23:48:10', '2025-12-02 07:48:40'),
(5, 'Matériel', 'Matériel pédagogique', 'materiel', NULL, 'annuel', 'actif', '2025-11-24 23:48:10', '2026-02-12 10:53:32'),
(6, 'Uniforme', 'Uniforme scolaire', 'uniforme', NULL, 'unique', 'actif', '2025-11-24 23:48:10', '2025-12-02 07:48:52'),
(7, 'Activités', 'Activités parascolaires', 'activites', NULL, 'annuel', 'actif', '2025-11-24 23:48:10', '2026-02-12 10:53:44'),
(8, 'Retard', 'Pénalités pour retard de paiement', 'penalite', NULL, 'unique', 'actif', '2025-11-24 23:48:10', '2025-12-02 07:49:05'),
(9, 'Frais Annexe', 'Frais Annexe', 'autre', NULL, 'unique', 'actif', '2026-01-21 15:49:00', '2026-01-21 15:49:36');

-- --------------------------------------------------------

--
-- Structure de la table `classes`
--

CREATE TABLE `classes` (
  `id` int(11) NOT NULL,
  `nom` varchar(50) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `niveau` varchar(50) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `cycle` varchar(50) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `professeur_principal_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `classes`
--

INSERT INTO `classes` (`id`, `nom`, `niveau`, `cycle`, `professeur_principal_id`, `created_at`) VALUES
(1, '', 'Petite Section', '', NULL, '2026-01-21 14:30:33'),
(2, '', 'Moyenne Section', '', 5, '2026-01-21 14:31:16'),
(3, '', 'Grande Section', '', NULL, '2026-01-21 14:31:36'),
(4, '', 'CP1', '', 4, '2026-01-21 14:32:08'),
(5, '', 'CP2', '', 6, '2026-01-21 14:32:51'),
(6, '', 'CE1', '', 7, '2026-01-21 14:34:11'),
(7, '', 'CE2', '', NULL, '2026-01-21 14:34:44'),
(8, '', 'CM1', '', NULL, '2026-01-21 14:35:16'),
(9, '', 'CM2', '', NULL, '2026-01-21 14:36:18'),
(10, 'A', 'CE1', '', 18, '2026-02-25 21:01:51');

-- --------------------------------------------------------

--
-- Structure de la table `compositions_primaire`
--

CREATE TABLE `compositions_primaire` (
  `id` int(11) NOT NULL,
  `code_composition` varchar(50) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `titre` varchar(200) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `classe_id` int(11) NOT NULL,
  `classe_nom` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `instituteur_id` int(11) NOT NULL,
  `instituteur_nom` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `date_composition` date NOT NULL,
  `periode_id` int(11) NOT NULL,
  `periode_nom` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `annee_scolaire` varchar(20) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `statut` varchar(20) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT 'a_venir',
  `notes_saisies` tinyint(1) NOT NULL,
  `releves_generes` tinyint(1) NOT NULL,
  `est_supprime` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `compositions_primaire`
--

INSERT INTO `compositions_primaire` (`id`, `code_composition`, `titre`, `classe_id`, `classe_nom`, `instituteur_id`, `instituteur_nom`, `date_composition`, `periode_id`, `periode_nom`, `annee_scolaire`, `statut`, `notes_saisies`, `releves_generes`, `est_supprime`, `created_at`, `updated_at`) VALUES
(1, 'COMP-PRIM-2026-5FJDLR', 'Trimestre 1 - 30/01/2026', 5, 'CP2', 1, 'ATTE Stéphane', '2026-02-02', 1, 'Trimestre 1', '2025-2026', 'en_cours', 1, 1, 0, '2026-01-30 00:26:26', '2026-02-04 11:21:35'),
(2, 'COMP-PRIM-2026-T8327F', 'Trimestre 1 - 30/01/2026', 8, 'CM1', 1, 'ATTE Stéphane', '2026-02-02', 1, 'Trimestre 1', '2025-2026', 'en_cours', 1, 1, 0, '2026-01-30 09:23:50', '2026-02-24 01:02:47'),
(3, 'COMP-PRIM-2026-CUHQMK', 'Trimestre 1 - 25/02/2026', 10, 'CE1 A', 1, 'ATTE Stéphane', '2026-02-25', 1, 'Trimestre 1', '2025-2026', 'en_cours', 1, 1, 0, '2026-02-25 21:10:05', '2026-02-26 02:24:12');

-- --------------------------------------------------------

--
-- Structure de la table `cours`
--

CREATE TABLE `cours` (
  `code_cours` varchar(20) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `nom_cours` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `description` text CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `professeur_id` int(11) NOT NULL,
  `classe_id` int(11) NOT NULL,
  `jour_semaine` varchar(10) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `heure_debut` time NOT NULL,
  `heure_fin` time NOT NULL,
  `salle` varchar(50) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `couleur` varchar(20) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `statut` varchar(10) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT 'actif',
  `matiere_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déclencheurs `cours`
--
DELIMITER $$
CREATE TRIGGER `after_cours_insert` AFTER INSERT ON `cours` FOR EACH ROW BEGIN
  INSERT INTO emploi_du_temps 
    (code_cours, classe_id, professeur_id, jour_semaine, 
     heure_debut, heure_fin, salle, type_creneau, 
     description, couleur)
  VALUES 
    (NEW.code_cours, NEW.classe_id, NEW.professeur_id, NEW.jour_semaine,
     NEW.heure_debut, NEW.heure_fin, NEW.salle, 'cours',
     NEW.description, NEW.couleur);
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `after_cours_update` AFTER UPDATE ON `cours` FOR EACH ROW BEGIN
  UPDATE emploi_du_temps 
  SET classe_id = NEW.classe_id,
      professeur_id = NEW.professeur_id,
      jour_semaine = NEW.jour_semaine,
      heure_debut = NEW.heure_debut,
      heure_fin = NEW.heure_fin,
      salle = NEW.salle,
      couleur = NEW.couleur
  WHERE code_cours = NEW.code_cours;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `depenses_budget`
--

CREATE TABLE `depenses_budget` (
  `id` int(11) NOT NULL,
  `budget_id` int(11) NOT NULL,
  `description` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `montant` decimal(10,2) NOT NULL DEFAULT 0.00,
  `date_depense` date NOT NULL,
  `categorie` varchar(50) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `beneficiaire` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `reference` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `statut` enum('valide','en_attente','annule') CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT 'valide',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `type_depense` varchar(50) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT 'divers',
  `mode_paiement` enum('especes','cheque','virement','carte','mobile','autre') CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT 'especes',
  `sous_categorie` varchar(50) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `numero_facture` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `notes` text CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `documents_enseignants`
--

CREATE TABLE `documents_enseignants` (
  `id` int(11) NOT NULL,
  `enseignant_id` int(11) NOT NULL,
  `nom_fichier` varchar(255) NOT NULL,
  `chemin_fichier` varchar(500) NOT NULL,
  `type_document` varchar(50) NOT NULL,
  `taille` int(11) NOT NULL COMMENT 'Taille en octets',
  `date_upload` datetime DEFAULT current_timestamp(),
  `uploaded_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `echeanciers_classe`
--

CREATE TABLE `echeanciers_classe` (
  `id` int(11) NOT NULL,
  `classe_id` int(11) NOT NULL,
  `frais_scolaire_id` int(11) NOT NULL,
  `nom_echeancier` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `nombre_versements` int(11) NOT NULL,
  `montant_total` decimal(10,2) NOT NULL,
  `statut` enum('actif','inactif') CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT 'actif',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `eleves`
--

CREATE TABLE `eleves` (
  `id` int(11) NOT NULL,
  `matricule` varchar(50) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `nom` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `prenom` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `date_naissance` date NOT NULL,
  `lieu_naissance` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `genre` enum('M','F') CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `adresse` text CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `email` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `nom_pere` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `nom_mere` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `telephone_parent` varchar(20) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `email_parents` varchar(355) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `classe_id` int(11) DEFAULT NULL,
  `photo_url` varchar(500) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `statut` enum('actif','inactif','diplome','abandon') CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT 'actif',
  `date_inscription` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `dossiers_physiques` longtext CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `eleves`
--

INSERT INTO `eleves` (`id`, `matricule`, `nom`, `prenom`, `date_naissance`, `lieu_naissance`, `genre`, `adresse`, `email`, `nom_pere`, `nom_mere`, `telephone_parent`, `email_parents`, `classe_id`, `photo_url`, `statut`, `date_inscription`, `created_at`, `updated_at`, `dossiers_physiques`) VALUES
(2, 'ELV20261N43JZ', 'KOUASSI', 'Memmoh C', '2020-01-01', NULL, 'F', NULL, NULL, NULL, NULL, '0748904965', '', 1, NULL, 'actif', '2026-01-21', '2026-01-21 14:44:21', '2026-02-05 18:42:50', NULL),
(3, 'ELV2026ZHD687', 'TRAORE', 'Noura', '2020-12-03', NULL, 'F', NULL, NULL, NULL, NULL, NULL, '', 5, NULL, 'actif', '2026-01-21', '2026-01-21 14:49:28', '2026-02-23 19:54:03', NULL),
(4, 'ELV2026AF9QCY', 'BAH', 'Amadou Bailla', '2019-07-12', NULL, 'M', NULL, NULL, NULL, NULL, '0709678798', '', 5, NULL, 'actif', '2026-01-21', '2026-01-21 14:52:31', '2026-02-26 07:47:10', NULL),
(5, 'ELV20268J2PYW', 'KONE', 'Prince', '2018-09-07', NULL, 'M', NULL, NULL, NULL, NULL, NULL, '', 4, NULL, 'actif', '2026-01-21', '2026-01-21 14:54:38', '2026-01-21 14:54:38', NULL),
(6, 'ELV20264HEHLX', 'KOUASSI', 'Moayeesther', '2018-02-09', NULL, 'F', NULL, NULL, NULL, NULL, NULL, '', 4, NULL, 'actif', '2026-01-21', '2026-01-21 14:56:47', '2026-02-12 22:24:01', NULL),
(7, 'ELV202644ZRU4', 'MOAYE', 'Danh Chris', '2020-02-04', NULL, 'M', NULL, NULL, NULL, NULL, NULL, '', 4, NULL, 'actif', '2026-01-21', '2026-01-21 15:00:14', '2026-01-21 15:00:14', NULL),
(8, 'ELV2026OERGUL', 'KANON', 'Zlanan Janis', '2020-10-10', NULL, 'F', NULL, NULL, NULL, NULL, NULL, '', 4, NULL, 'actif', '2026-01-21', '2026-01-21 15:02:16', '2026-01-21 15:02:16', NULL),
(9, 'ELV2026Z9OHZH', 'YAPO', 'Kely Prince', '2020-02-18', NULL, 'M', NULL, NULL, NULL, NULL, NULL, '', 4, NULL, 'actif', '2026-01-21', '2026-01-21 15:04:09', '2026-01-21 15:04:09', NULL),
(10, 'ELV2026J27L7T', 'YAO', 'Yao Anderson', '2018-01-15', NULL, 'M', NULL, NULL, NULL, NULL, '0748904965', '', 5, NULL, 'actif', '2026-01-21', '2026-01-21 15:05:35', '2026-02-02 09:37:54', NULL),
(11, 'ELV2026W3MNJA', 'NGUESSAN', 'Lalune', '2019-06-02', NULL, 'M', NULL, NULL, NULL, NULL, '0709678798', '', 5, NULL, 'actif', '2026-01-21', '2026-01-21 15:06:46', '2026-02-01 23:18:41', NULL),
(12, 'ELV20269POA5Q', 'BANLE', 'Amirah', '2020-08-05', NULL, 'F', NULL, NULL, NULL, NULL, NULL, '', 6, NULL, 'actif', '2026-01-21', '2026-01-21 15:11:12', '2026-02-26 07:46:03', NULL),
(13, 'ELV2026R51KNC', 'CISSE', 'Oumar', '0017-02-05', NULL, 'M', NULL, NULL, NULL, NULL, NULL, '', 6, NULL, 'actif', '2026-01-21', '2026-01-21 15:14:08', '2026-02-26 06:51:00', NULL),
(14, 'ELV2026E2JF76', 'DRAMERA', 'Lemuel Daouda', '2018-04-04', NULL, 'M', NULL, NULL, NULL, NULL, NULL, '', 6, NULL, 'actif', '2026-01-21', '2026-01-21 15:16:48', '2026-01-21 15:16:48', NULL),
(15, 'ELV20269JTOYI', 'FOFANA', 'Bachir', '2019-07-07', NULL, 'M', NULL, NULL, NULL, NULL, NULL, '', 6, NULL, 'actif', '2026-01-21', '2026-01-21 15:18:41', '2026-01-21 15:18:41', NULL),
(16, 'ELV2026BQIAOL', 'FOFANA', 'Ange Uriel', '2018-01-30', NULL, 'M', NULL, NULL, NULL, NULL, NULL, '', 6, NULL, 'actif', '2026-01-21', '2026-01-21 15:20:21', '2026-01-21 15:20:21', NULL),
(17, 'ELV2026DEKVNV', 'GBOKO', 'Succes Reda', '2019-07-24', NULL, 'M', NULL, NULL, NULL, NULL, NULL, '', 3, NULL, 'actif', '2026-01-21', '2026-01-21 15:23:09', '2026-02-26 07:35:04', NULL),
(18, 'ELV2026WH0IKC', 'ILY', 'Fadilah', '2019-04-27', NULL, 'M', NULL, NULL, NULL, NULL, NULL, '', 6, NULL, 'actif', '2026-01-21', '2026-01-21 15:25:54', '2026-01-21 15:25:54', NULL),
(19, 'ELV202688M92S', 'SYLLA', 'Hamza', '2019-10-10', NULL, 'M', NULL, NULL, NULL, NULL, NULL, '', 6, NULL, 'actif', '2026-01-21', '2026-01-21 15:27:08', '2026-01-21 15:27:08', NULL),
(20, 'ELV2026X8BP51', 'NGUESSAN', 'Yabamiah Kyliane', '2019-01-18', NULL, 'M', NULL, NULL, NULL, NULL, NULL, '', 6, NULL, 'actif', '2026-01-21', '2026-01-21 15:28:26', '2026-01-21 15:28:26', NULL),
(21, 'ELV2026OWOADJ', 'KOUAKOU', 'Ramissou', '2019-02-02', NULL, 'M', NULL, NULL, NULL, NULL, NULL, '', 6, NULL, 'actif', '2026-01-21', '2026-01-21 15:31:00', '2026-01-21 15:31:00', NULL),
(22, 'ELV2026CH00IR', 'FOFANA', 'Marie', '2017-03-07', NULL, 'F', NULL, NULL, NULL, NULL, NULL, '', 8, NULL, 'actif', '2026-01-21', '2026-01-21 15:34:22', '2026-01-21 15:34:22', NULL),
(23, 'ELV20262DSGLI', 'ABOKE', 'Etani', '2017-07-17', NULL, 'F', NULL, NULL, NULL, NULL, NULL, '', 10, '/uploads/eleves/eleve-1769376021212.jpg', 'actif', '2026-01-21', '2026-01-21 15:35:43', '2026-02-26 08:25:47', NULL),
(24, 'ELV202664MEKG', 'OTTRE', 'Nda Jocellin', '2017-10-10', NULL, 'M', NULL, NULL, NULL, NULL, NULL, '', 9, NULL, 'actif', '2026-01-21', '2026-01-21 15:37:54', '2026-01-21 15:37:54', NULL),
(25, 'ELV202647L40A', 'SOMA', 'Pacome', '2016-07-07', NULL, 'M', NULL, NULL, NULL, NULL, NULL, '', 9, NULL, 'actif', '2026-01-21', '2026-01-21 15:39:09', '2026-01-21 15:39:09', NULL),
(26, 'ELV2026FIUWD8', 'DOUHO', 'Maninkaz', '2015-03-01', NULL, 'M', NULL, NULL, NULL, NULL, NULL, '', 9, NULL, 'actif', '2026-01-21', '2026-01-21 15:41:21', '2026-01-21 15:41:21', NULL),
(29, 'AZEZTERTY', 'ATTE', 'Adou Océane', '2016-05-12', 'Yopougon', 'F', NULL, NULL, 'Atte Roland', 'Kouassi Eliane', '0122890987', '', 10, NULL, 'actif', '2026-01-23', '2026-01-23 09:33:05', '2026-02-26 09:03:16', '[{\"url\":\"/uploads/dossiers/nouveau_1769160785706_brun_1769160785743_rzwifb.jpeg\",\"nomOriginal\":\"BRUN.jpeg\",\"taille\":241881,\"type\":\"image/jpeg\",\"date\":\"2026-01-23T09:33:05.752Z\"},{\"url\":\"/uploads/dossiers/nouveau_1769160785856_brunch2_1769160785890_qgtaah.jpeg\",\"nomOriginal\":\"BRUNCH2.jpeg\",\"taille\":168217,\"type\":\"image/jpeg\",\"date\":\"2026-01-23T09:33:05.894Z\"}]'),
(30, 'ELV2026EWCI1H', 'TOCLO', 'Alain Honorat', '2018-09-21', 'Yopougon', 'M', NULL, NULL, 'Toclo Etienne', NULL, '0102032929', '', 10, '/uploads/eleves/eleve-1772053093237.png', 'actif', '2026-02-25', '2026-02-25 20:58:13', '2026-02-25 21:02:22', '[{\"url\":\"/uploads/dossiers/elv2026ewci1h_acte_nai_1772053174297_eoqe4t.jpg\",\"nomOriginal\":\"acte_nai.jpg\",\"taille\":25269,\"type\":\"image/jpeg\",\"date\":\"2026-02-25T20:59:34.314Z\"}]'),
(31, 'ELV20260JMV7D', 'AFFI', 'Frederique Anne', '2020-02-05', NULL, 'F', NULL, NULL, NULL, NULL, NULL, '', 10, NULL, 'actif', '2026-02-26', '2026-02-26 06:50:02', '2026-02-26 06:50:02', NULL),
(33, 'ELV2026TTB5CG', 'OUATTARA', 'Stephanie Fierlaha', '2019-05-15', NULL, 'M', NULL, NULL, NULL, NULL, NULL, '', 10, NULL, 'actif', '2026-02-26', '2026-02-26 08:25:15', '2026-02-26 08:25:15', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `emploi_du_temps`
--

CREATE TABLE `emploi_du_temps` (
  `id` int(11) NOT NULL,
  `code_cours` varchar(20) DEFAULT NULL,
  `classe_id` int(11) NOT NULL,
  `professeur_id` int(11) NOT NULL,
  `jour_semaine` varchar(20) NOT NULL,
  `heure_debut` time NOT NULL,
  `heure_fin` time NOT NULL,
  `salle` varchar(50) DEFAULT NULL,
  `type_creneau` enum('cours','pause','activite','reunion') DEFAULT 'cours',
  `description` text DEFAULT NULL,
  `couleur` varchar(20) DEFAULT '#3B82F6',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `enseignants`
--

CREATE TABLE `enseignants` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `matricule` varchar(50) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `date_naissance` date DEFAULT NULL,
  `lieu_naissance` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `genre` enum('M','F') CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `adresse` text CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `telephone` varchar(20) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `specialite` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `diplome` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `type_enseignant` enum('instituteur','professeur','administratif') CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL DEFAULT 'professeur',
  `matieres_enseignees` text CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `date_embauche` date DEFAULT NULL,
  `statut` enum('actif','inactif','retraite','demission') CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT 'actif',
  `type_contrat` enum('titulaire','contractuel','vacataire') CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT 'titulaire',
  `avatar_url` text CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `salaire` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `fonction` varchar(100) DEFAULT NULL,
  `departement` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `enseignants`
--

INSERT INTO `enseignants` (`id`, `user_id`, `matricule`, `date_naissance`, `lieu_naissance`, `genre`, `adresse`, `telephone`, `specialite`, `diplome`, `type_enseignant`, `matieres_enseignees`, `date_embauche`, `statut`, `type_contrat`, `avatar_url`, `salaire`, `created_at`, `updated_at`, `fonction`, `departement`) VALUES
(1, 1, 'ADMIN001', '0000-00-00', 'Agboville', 'M', 'Toit Rouge', '0709678798', NULL, NULL, 'administratif', NULL, NULL, 'actif', 'titulaire', '/uploads/avatars/avatar_1763703707787_k3zfastyz.jpeg', NULL, '2026-02-20 06:18:52', '2026-03-03 23:14:42', NULL, NULL),
(2, 2, 'ADMIN002', NULL, 'Agboville', 'M', 'Bingerville FEKESSE', '0143551057', NULL, NULL, 'administratif', NULL, NULL, 'actif', 'titulaire', NULL, NULL, '2026-01-22 13:15:30', '2026-03-03 23:27:11', 'Directeur-Fondateur', 'Direction');

-- --------------------------------------------------------

--
-- Structure de la table `evaluations`
--

CREATE TABLE `evaluations` (
  `id` int(11) NOT NULL,
  `code_evaluation` varchar(50) NOT NULL,
  `titre` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `matiere_id` int(11) NOT NULL,
  `classe_id` int(11) NOT NULL,
  `enseignant_id` int(11) NOT NULL,
  `type_evaluation` enum('devoir','controle','examen','projet','participation','oral') DEFAULT 'devoir',
  `date_evaluation` date NOT NULL,
  `coefficient` decimal(4,2) DEFAULT 1.00,
  `note_maximale` decimal(5,2) DEFAULT 20.00,
  `bareme` enum('sur_20','sur_10','sur_100','lettre','pourcentage') DEFAULT 'sur_20',
  `periode_id` int(11) NOT NULL,
  `statut` enum('a_venir','en_cours','corrige','archive') DEFAULT 'a_venir',
  `annee_scolaire` varchar(10) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `evaluations_notes`
--

CREATE TABLE `evaluations_notes` (
  `id` int(11) NOT NULL,
  `code_evaluation` varchar(50) NOT NULL,
  `titre` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `matiere_id` int(11) NOT NULL,
  `matiere_nom` varchar(100) NOT NULL,
  `classe_id` int(11) NOT NULL,
  `classe_nom` varchar(100) NOT NULL,
  `professeur_id` int(11) NOT NULL,
  `professeur_nom` varchar(200) NOT NULL,
  `type_evaluation` enum('devoir','controle','examen','projet','participation','oral') DEFAULT 'devoir',
  `date_evaluation` date NOT NULL,
  `coefficient` decimal(4,2) DEFAULT 1.00,
  `note_maximale` decimal(5,2) DEFAULT 20.00,
  `bareme` enum('sur_20','sur_10','sur_100','lettre','pourcentage') DEFAULT 'sur_20',
  `periode_id` int(11) NOT NULL,
  `periode_nom` varchar(50) NOT NULL,
  `statut` enum('a_venir','en_cours','corrige','archive') DEFAULT 'a_venir',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `frais_eleves`
--

CREATE TABLE `frais_eleves` (
  `id` int(11) NOT NULL,
  `frais_scolaire_id` int(11) NOT NULL,
  `eleve_id` int(11) NOT NULL,
  `annee_scolaire` varchar(20) NOT NULL,
  `montant` decimal(10,2) NOT NULL,
  `montant_paye` decimal(10,2) NOT NULL DEFAULT 0.00,
  `date_echeance` date NOT NULL,
  `statut` enum('en_attente','partiel','paye','en_retard') NOT NULL DEFAULT 'en_attente',
  `date_paiement` date DEFAULT NULL,
  `mode_paiement` enum('especes','cheque','virement','carte','mobile','autre') DEFAULT NULL,
  `reference_paiement` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `frais_eleves`
--

INSERT INTO `frais_eleves` (`id`, `frais_scolaire_id`, `eleve_id`, `annee_scolaire`, `montant`, `montant_paye`, `date_echeance`, `statut`, `date_paiement`, `mode_paiement`, `reference_paiement`, `notes`, `created_at`, `updated_at`) VALUES
(34, 23, 2, '2025-2026', 15000.00, 15000.00, '2026-03-15', 'paye', '2026-01-28', NULL, NULL, NULL, '2026-02-13 14:31:43', '2026-02-13 14:31:43'),
(35, 24, 2, '2025-2026', 60000.00, 60000.00, '2026-03-15', 'paye', '2026-01-28', NULL, NULL, NULL, '2026-02-13 14:32:12', '2026-02-13 14:32:12'),
(36, 25, 2, '2025-2026', 90000.00, 57500.00, '2026-03-15', 'partiel', NULL, NULL, NULL, NULL, '2026-02-13 14:32:37', '2026-02-13 14:38:46'),
(37, 31, 4, '2025-2026', 25000.00, 25000.00, '2026-03-15', 'paye', '2026-03-02', NULL, NULL, NULL, '2026-02-13 14:33:22', '2026-02-13 14:33:23'),
(38, 26, 4, '2025-2026', 60000.00, 60000.00, '2026-03-15', 'paye', '2026-02-03', NULL, NULL, NULL, '2026-02-13 14:33:48', '2026-02-13 14:33:48'),
(39, 31, 8, '2025-2026', 25000.00, 25000.00, '2026-03-15', 'paye', '2026-02-02', NULL, NULL, NULL, '2026-02-13 14:34:12', '2026-02-13 14:34:12'),
(40, 33, 11, '2025-2026', 90000.00, 15000.00, '2026-03-15', 'partiel', NULL, NULL, NULL, NULL, '2026-02-13 14:34:35', '2026-02-13 14:34:36'),
(41, 28, 11, '2025-2026', 60000.00, 60000.00, '2026-03-15', 'paye', '2026-02-04', NULL, NULL, NULL, '2026-02-13 14:34:57', '2026-02-13 14:34:58'),
(42, 32, 29, '2025-2026', 25000.00, 25000.00, '2026-03-15', 'paye', '2026-02-13', NULL, NULL, NULL, '2026-02-13 14:35:13', '2026-02-13 14:35:13'),
(43, 32, 14, '2025-2026', 25000.00, 25000.00, '2026-03-15', 'paye', '2026-02-05', NULL, NULL, NULL, '2026-02-13 14:35:32', '2026-02-13 14:35:32'),
(44, 28, 10, '2025-2026', 60000.00, 60000.00, '2026-03-15', 'paye', '2026-02-04', NULL, NULL, NULL, '2026-02-13 14:35:57', '2026-02-13 14:35:57'),
(45, 29, 10, '2025-2026', 100000.00, 15000.00, '2026-03-15', 'partiel', NULL, NULL, NULL, NULL, '2026-02-13 14:36:56', '2026-02-13 14:36:57'),
(46, 29, 11, '2025-2026', 100000.00, 60000.00, '2026-03-15', 'partiel', NULL, NULL, NULL, NULL, '2026-02-13 14:40:02', '2026-02-17 01:13:06'),
(47, 35, 17, '2025-2026', 15000.00, 15000.00, '2026-03-15', 'paye', '2026-02-10', NULL, NULL, NULL, '2026-02-13 17:56:38', '2026-02-13 17:56:39'),
(48, 38, 4, '2025-2026', 90000.00, 15000.00, '2026-03-16', 'partiel', NULL, NULL, NULL, NULL, '2026-02-14 23:35:59', '2026-02-14 23:35:59'),
(49, 33, 10, '2025-2026', 90000.00, 30000.00, '2026-03-16', 'partiel', NULL, NULL, NULL, NULL, '2026-02-14 23:36:46', '2026-02-14 23:39:00'),
(50, 27, 4, '2025-2026', 90000.00, 45000.00, '2026-03-19', 'partiel', NULL, NULL, NULL, NULL, '2026-02-17 21:25:27', '2026-02-17 21:35:38'),
(51, 32, 15, '2025-2026', 25000.00, 25000.00, '2026-03-20', 'paye', '2026-02-18', NULL, NULL, NULL, '2026-02-18 22:47:00', '2026-02-18 22:47:00'),
(52, 30, 20, '2025-2026', 65000.00, 65000.00, '2026-03-20', 'paye', '2026-02-18', NULL, NULL, NULL, '2026-02-18 22:47:23', '2026-02-18 22:47:23'),
(53, 41, 30, '2025-2026', 75000.00, 75000.00, '2026-03-27', 'paye', '2026-02-25', NULL, NULL, NULL, '2026-02-25 21:25:44', '2026-02-25 21:25:45'),
(54, 40, 30, '2025-2026', 60000.00, 10000.00, '2026-03-27', 'partiel', NULL, NULL, NULL, NULL, '2026-02-25 21:27:08', '2026-02-25 21:27:08'),
(55, 42, 30, '2025-2026', 200000.00, 50000.00, '2026-03-27', 'partiel', NULL, NULL, NULL, NULL, '2026-02-25 21:27:43', '2026-02-25 21:27:44');

-- --------------------------------------------------------

--
-- Structure de la table `frais_scolaires`
--

CREATE TABLE `frais_scolaires` (
  `id` int(11) NOT NULL,
  `categorie_frais_id` int(11) NOT NULL,
  `classe_id` int(11) NOT NULL,
  `annee_scolaire` varchar(20) NOT NULL,
  `montant` decimal(10,0) NOT NULL,
  `nombre_versements` int(11) DEFAULT 4,
  `date_debut_versements` date DEFAULT NULL,
  `date_fin_versements` date DEFAULT NULL,
  `periodicite` enum('unique','mensuel','trimestriel','annuel') NOT NULL DEFAULT 'unique',
  `statut` enum('actif','inactif') NOT NULL DEFAULT 'actif',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `frais_scolaires`
--

INSERT INTO `frais_scolaires` (`id`, `categorie_frais_id`, `classe_id`, `annee_scolaire`, `montant`, `nombre_versements`, `date_debut_versements`, `date_fin_versements`, `periodicite`, `statut`, `created_at`, `updated_at`) VALUES
(23, 7, 1, '2025-2026', 15000, 4, NULL, NULL, 'annuel', 'actif', '2026-02-13 14:25:36', '2026-02-13 14:25:36'),
(24, 2, 1, '2025-2026', 60000, 4, NULL, NULL, 'unique', 'actif', '2026-02-13 14:26:28', '2026-02-13 14:26:28'),
(25, 1, 1, '2025-2026', 90000, 4, NULL, NULL, 'mensuel', 'actif', '2026-02-13 14:26:51', '2026-02-13 14:26:51'),
(26, 2, 4, '2025-2026', 60000, 4, NULL, NULL, 'unique', 'actif', '2026-02-13 14:27:06', '2026-02-13 14:27:06'),
(27, 1, 4, '2025-2026', 90000, 4, NULL, NULL, 'mensuel', 'actif', '2026-02-13 14:27:23', '2026-02-13 14:27:23'),
(28, 2, 5, '2025-2026', 60000, 4, NULL, NULL, 'unique', 'actif', '2026-02-13 14:27:51', '2026-02-13 14:27:51'),
(29, 1, 5, '2025-2026', 100000, 4, NULL, NULL, 'mensuel', 'actif', '2026-02-13 14:28:17', '2026-02-13 14:28:17'),
(30, 2, 6, '2025-2026', 65000, 4, NULL, NULL, 'unique', 'actif', '2026-02-13 14:29:00', '2026-02-13 14:29:00'),
(31, 7, 4, '2025-2026', 25000, 4, NULL, NULL, 'annuel', 'actif', '2026-02-13 14:29:24', '2026-02-13 14:29:24'),
(32, 7, 6, '2025-2026', 25000, 4, NULL, NULL, 'annuel', 'actif', '2026-02-13 14:29:49', '2026-02-13 14:29:49'),
(33, 3, 5, '2025-2026', 90000, 4, NULL, NULL, 'mensuel', 'actif', '2026-02-13 14:30:00', '2026-02-13 14:30:00'),
(34, 4, 5, '2025-2026', 90000, 4, NULL, NULL, 'mensuel', 'actif', '2026-02-13 14:30:10', '2026-02-13 14:30:10'),
(35, 7, 2, '2025-2026', 15000, 4, NULL, NULL, 'annuel', 'actif', '2026-02-13 17:54:16', '2026-02-13 17:54:16'),
(36, 2, 2, '2025-2026', 60000, 4, NULL, NULL, 'unique', 'actif', '2026-02-13 17:54:32', '2026-02-13 17:54:32'),
(37, 1, 2, '2025-2026', 120000, 4, NULL, NULL, 'mensuel', 'actif', '2026-02-13 17:55:01', '2026-02-13 17:55:01'),
(38, 3, 4, '2025-2026', 90000, 4, NULL, NULL, 'mensuel', 'actif', '2026-02-14 23:35:20', '2026-02-14 23:35:20'),
(39, 3, 6, '2025-2026', 90000, 4, NULL, NULL, 'mensuel', 'actif', '2026-02-14 23:35:43', '2026-02-14 23:35:43'),
(40, 3, 10, '2025-2026', 60000, 4, NULL, NULL, 'mensuel', 'actif', '2026-02-25 21:22:48', '2026-02-25 21:22:48'),
(41, 2, 10, '2025-2026', 75000, 4, NULL, NULL, 'unique', 'actif', '2026-02-25 21:23:06', '2026-02-25 21:23:06'),
(42, 1, 10, '2025-2026', 200000, 4, NULL, NULL, 'mensuel', 'actif', '2026-02-25 21:23:22', '2026-02-25 21:23:22'),
(43, 4, 10, '2025-2026', 60000, 4, NULL, NULL, 'mensuel', 'actif', '2026-02-25 21:24:08', '2026-02-25 21:24:08');

-- --------------------------------------------------------

--
-- Structure de la table `logs_activite`
--

CREATE TABLE `logs_activite` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `logs_suppression`
--

CREATE TABLE `logs_suppression` (
  `id` int(11) NOT NULL,
  `table_name` varchar(100) NOT NULL,
  `record_id` int(11) NOT NULL,
  `action` varchar(50) NOT NULL,
  `details` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `logs_utilisateurs`
--

CREATE TABLE `logs_utilisateurs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `action` varchar(50) NOT NULL,
  `motif` text DEFAULT NULL,
  `date` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `matieres`
--

CREATE TABLE `matieres` (
  `id` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `niveau` enum('primaire','college','lycee') DEFAULT 'primaire',
  `couleur` varchar(7) DEFAULT '#3B82F6',
  `icone` varchar(10) DEFAULT '?',
  `statut` enum('actif','inactif') DEFAULT 'actif',
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `matieres`
--

INSERT INTO `matieres` (`id`, `nom`, `niveau`, `couleur`, `icone`, `statut`, `created_at`) VALUES
(1, 'Mathématiques', 'primaire', '#3B82F6', '➕', 'actif', '2025-11-24 17:42:36'),
(2, 'Français', 'primaire', '#10B981', '????', 'actif', '2025-11-24 17:42:36'),
(3, 'Sciences', 'primaire', '#8B5CF6', '????', 'actif', '2025-11-24 17:42:36'),
(4, 'Histoire-Géographie', 'primaire', '#F59E0B', '????', 'actif', '2025-11-24 17:42:36'),
(5, 'Arts Plastiques', 'primaire', '#EC4899', '????', 'actif', '2025-11-24 17:42:36'),
(6, 'Éducation Physique', 'primaire', '#EF4444', '⚽', 'actif', '2025-11-24 17:42:36'),
(7, 'Anglais', 'primaire', '#6366F1', '????', 'actif', '2025-11-24 17:42:36'),
(8, 'Musique', 'primaire', '#F97316', '????', 'actif', '2025-11-24 17:42:36'),
(9, 'Informatique', 'primaire', '#06B6D4', '????', 'actif', '2025-11-24 17:42:36'),
(10, 'Éducation Civique et Morale', 'primaire', '#DC2626', '⚖️', 'actif', '2025-11-24 20:30:17'),
(11, 'Sciences et Technologie', 'primaire', '#059669', '????', 'actif', '2025-11-24 20:30:17'),
(12, 'Éveil et Initiation', 'primaire', '#7C3AED', '????', 'actif', '2025-11-24 20:30:17'),
(13, 'Éducation Artistique', 'primaire', '#DB2777', '????', 'actif', '2025-11-24 20:30:17'),
(14, 'Langues Vivantes', 'primaire', '#0EA5E9', '????️', 'actif', '2025-11-24 20:30:17'),
(15, 'Chimie', 'primaire', '#06B6D4', '????', 'actif', '2026-01-14 06:54:25'),
(16, 'Dermatologie', 'primaire', '#3B82F6', '????', 'actif', '2026-01-14 12:57:43');

-- --------------------------------------------------------

--
-- Structure de la table `matieres_primaire`
--

CREATE TABLE `matieres_primaire` (
  `id` int(11) NOT NULL,
  `nom` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `code_matiere` varchar(50) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `niveau` varchar(50) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT 'primaire',
  `description` text CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `couleur` varchar(7) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT '#3B82F6',
  `icone` varchar(20) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `coefficient` decimal(3,1) NOT NULL DEFAULT 1.0,
  `note_sur` decimal(4,2) DEFAULT 20.00,
  `ordre_affichage` int(11) DEFAULT 0,
  `statut` varchar(20) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT 'actif',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `matieres_primaire`
--

INSERT INTO `matieres_primaire` (`id`, `nom`, `code_matiere`, `niveau`, `description`, `couleur`, `icone`, `coefficient`, `note_sur`, `ordre_affichage`, `statut`, `created_at`, `updated_at`) VALUES
(2, 'Mathématiques', 'MATH-PRIM', 'primaire', '', '#EF4444', NULL, 1.0, 20.00, 2, 'actif', '2026-01-20 10:45:37', '2026-03-02 16:43:52'),
(4, 'Écriture', 'ECRI-PRIM', 'primaire', '', '#8B5CF6', NULL, 1.0, 20.00, 4, 'actif', '2026-01-20 10:45:37', '2026-03-02 16:43:55'),
(5, 'Histoire-Géographie', 'HIST-PRIM', 'primaire', '', '#F59E0B', NULL, 1.0, 20.00, 5, 'actif', '2026-01-20 10:45:37', '2026-03-02 16:43:58'),
(6, 'Sciences', 'SCIE-PRIM', 'primaire', '', '#EC4899', NULL, 1.0, 20.00, 6, 'actif', '2026-01-20 10:45:37', '2026-03-02 16:44:00'),
(7, 'Éducation Civique', 'CIVI-PRIM', 'primaire', '', '#6366F1', NULL, 1.0, 20.00, 7, 'actif', '2026-01-20 10:45:37', '2026-03-02 16:44:03'),
(9, 'Éducation Physique', 'EPS-PRIM', 'primaire', '', '#06B6D4', NULL, 1.0, 20.00, 9, 'actif', '2026-01-20 10:45:37', '2026-03-02 16:44:06'),
(10, 'eveil du milieu', 'G-PRIM-1206', 'primaire', '', '#3B82F6', NULL, 1.0, 20.00, 8, 'actif', '2026-02-28 03:05:06', '2026-03-02 16:44:09');

-- --------------------------------------------------------

--
-- Structure de la table `modules`
--

CREATE TABLE `modules` (
  `id` int(11) NOT NULL,
  `nom` varchar(50) NOT NULL,
  `icone` varchar(50) DEFAULT NULL,
  `ordre` int(11) DEFAULT 0,
  `est_actif` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `modules`
--

INSERT INTO `modules` (`id`, `nom`, `icone`, `ordre`, `est_actif`) VALUES
(1, 'Tableau de bord', '????', 1, 1),
(2, 'Élèves', '????‍????', 2, 1),
(3, 'Classes', '????', 3, 1),
(4, 'Personnel', '????‍????', 4, 1),
(5, 'Cours', '????', 5, 1),
(6, 'Emploi du temps', '????', 6, 1),
(7, 'Notes', '????', 7, 1),
(8, 'Absences', '????', 8, 1),
(9, 'Finances', '????', 9, 1),
(10, 'Paramètres', '⚙️', 10, 1);

-- --------------------------------------------------------

--
-- Structure de la table `motifs_absence`
--

CREATE TABLE `motifs_absence` (
  `id` int(11) NOT NULL,
  `libelle` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `type_absence` enum('absence','retard','sortie_anticipée','exclusion') DEFAULT 'absence',
  `justifiable` tinyint(1) DEFAULT 1,
  `couleur` varchar(20) DEFAULT '#64748b',
  `statut` enum('actif','inactif') DEFAULT 'actif',
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `motifs_absence`
--

INSERT INTO `motifs_absence` (`id`, `libelle`, `description`, `type_absence`, `justifiable`, `couleur`, `statut`, `created_at`) VALUES
(1, 'Maladie', NULL, 'absence', 1, '#64748b', 'actif', '2026-01-21 01:01:52'),
(2, 'Maladie', NULL, 'absence', 0, '#64748b', 'inactif', '2026-02-24 01:44:03'),
(3, 'Raison familiale', 'Événement familial', 'absence', 1, '#F59E0B', 'actif', '2026-02-24 01:44:03'),
(4, 'Transport', 'Problème de transport', 'retard', 1, '#3B82F6', 'actif', '2026-02-24 01:44:03'),
(5, 'Retard non justifié', 'Retard sans justification', 'retard', 0, '#64748b', 'actif', '2026-02-24 01:44:03'),
(6, 'Rendez-vous médical', 'Consultation ou soins', 'sortie_anticipée', 1, '#10b981', 'actif', '2026-02-24 01:44:03'),
(7, 'Exclusion temporaire', 'Mesure disciplinaire', 'exclusion', 0, '#DC2626', 'actif', '2026-02-24 01:44:03');

-- --------------------------------------------------------

--
-- Structure de la table `moyennes_eleves`
--

CREATE TABLE `moyennes_eleves` (
  `id` int(11) NOT NULL,
  `eleve_id` int(11) NOT NULL,
  `eleve_nom` varchar(100) NOT NULL,
  `eleve_prenom` varchar(100) NOT NULL,
  `matiere_id` int(11) NOT NULL,
  `matiere_nom` varchar(100) NOT NULL,
  `periode_id` int(11) NOT NULL,
  `periode_nom` varchar(50) NOT NULL,
  `moyenne` decimal(5,2) NOT NULL,
  `coefficient_total` decimal(5,2) DEFAULT 0.00,
  `note_maximale` decimal(5,2) DEFAULT NULL,
  `note_minimale` decimal(5,2) DEFAULT NULL,
  `nombre_notes` int(11) DEFAULT 0,
  `appreciation` text DEFAULT NULL,
  `rang_classe` int(11) DEFAULT NULL,
  `rang_niveau` int(11) DEFAULT NULL,
  `classe_id` int(11) DEFAULT NULL,
  `classe_nom` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `notes`
--

CREATE TABLE `notes` (
  `id` int(11) NOT NULL,
  `eleve_id` int(11) NOT NULL,
  `eleve_nom` varchar(100) NOT NULL,
  `eleve_prenom` varchar(100) NOT NULL,
  `evaluation_id` int(11) NOT NULL,
  `evaluation_code` varchar(50) NOT NULL,
  `evaluation_titre` varchar(255) NOT NULL,
  `note` decimal(5,2) NOT NULL,
  `note_sur` decimal(5,2) DEFAULT 20.00,
  `appreciation` text DEFAULT NULL,
  `date_saisie` date NOT NULL,
  `saisie_par` int(11) NOT NULL,
  `saisie_par_nom` varchar(200) DEFAULT NULL,
  `est_absent` tinyint(1) DEFAULT 0,
  `est_exempte` tinyint(1) DEFAULT 0,
  `est_annulee` tinyint(1) DEFAULT 0,
  `motif_absence` varchar(255) DEFAULT NULL,
  `classe_id` int(11) DEFAULT NULL,
  `classe_nom` varchar(100) DEFAULT NULL,
  `matiere_id` int(11) DEFAULT NULL,
  `matiere_nom` varchar(100) DEFAULT NULL,
  `enseignant_id` int(11) DEFAULT NULL,
  `enseignant_nom` varchar(200) DEFAULT NULL,
  `periode_id` int(11) DEFAULT NULL,
  `periode_nom` varchar(100) DEFAULT NULL,
  `annee_scolaire` varchar(9) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `notes_primaire`
--

CREATE TABLE `notes_primaire` (
  `id` int(11) NOT NULL,
  `eleve_id` int(11) NOT NULL,
  `eleve_nom` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `eleve_prenom` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `composition_id` int(11) NOT NULL,
  `matiere_id` int(11) NOT NULL,
  `matiere_nom` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `note` decimal(4,2) NOT NULL DEFAULT 0.00,
  `note_sur` decimal(4,2) NOT NULL DEFAULT 20.00,
  `appreciation` text CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `date_saisie` date NOT NULL,
  `saisie_par` int(11) NOT NULL,
  `saisie_par_nom` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `numero_recu_sequence`
--

CREATE TABLE `numero_recu_sequence` (
  `id` int(11) NOT NULL,
  `dernier_numero` int(11) NOT NULL DEFAULT 0,
  `annee` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `paiements_frais`
--

CREATE TABLE `paiements_frais` (
  `id` int(11) NOT NULL,
  `frais_eleve_id` int(11) NOT NULL,
  `eleve_id` int(11) NOT NULL,
  `montant` decimal(10,2) NOT NULL,
  `date_paiement` date NOT NULL,
  `mode_paiement` enum('especes','cheque','virement','carte','mobile','autre') NOT NULL,
  `reference_paiement` varchar(100) DEFAULT NULL,
  `numero_versement` int(11) DEFAULT NULL COMMENT 'Numéro du versement pour les paiements fractionnés',
  `numero_recu` int(11) DEFAULT NULL,
  `date_premiere_impression` datetime DEFAULT NULL,
  `date_impression_recu` datetime DEFAULT NULL,
  `est_duplicata` tinyint(1) DEFAULT 0,
  `notes` text DEFAULT NULL,
  `statut` varchar(35) DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `paiement_frais_supp`
--

CREATE TABLE `paiement_frais_supp` (
  `id` int(11) NOT NULL,
  `frais_eleve_id` int(11) DEFAULT NULL,
  `eleve_id` int(11) DEFAULT NULL,
  `montant` decimal(10,2) DEFAULT NULL,
  `date_paiement` date DEFAULT NULL,
  `mode_paiement` varchar(50) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `reference_paiement` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `statut` varchar(20) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `notes` text CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `parametres`
--

CREATE TABLE `parametres` (
  `id` int(11) NOT NULL,
  `nom_ecole` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `slogan` varchar(500) NOT NULL DEFAULT 'L''excellence éducative depuis 1985',
  `adresse` text CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `telephone` varchar(20) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `email` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `logo_url` varchar(500) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `couleur_principale` varchar(7) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT '#3B82F6',
  `annee_scolaire` varchar(20) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `parametres`
--

INSERT INTO `parametres` (`id`, `nom_ecole`, `slogan`, `adresse`, `telephone`, `email`, `logo_url`, `couleur_principale`, `annee_scolaire`, `created_at`, `updated_at`) VALUES
(1, 'Groupe Scolaire Gnamien Assa', 'Apprendre - Partager - Grandir', 'Biengerville CEFAL ', '+225 01 72 95 45 47', 'groupescolairegnamienassa@gmail.com', '/uploads/logos/logo_1771500537479_bkngk.jpeg', '#6200c4', '2025-2026', '2026-01-21 14:00:07', '2026-03-01 12:52:46');

-- --------------------------------------------------------

--
-- Structure de la table `parametres_absences`
--

CREATE TABLE `parametres_absences` (
  `id` int(11) NOT NULL,
  `niveau` enum('primaire','college','lycee') NOT NULL,
  `seuil_alerte_absences` int(11) DEFAULT 3,
  `seuil_alerte_retards` int(11) DEFAULT 5,
  `duree_max_retard_minutes` int(11) DEFAULT 15,
  `retard_compte_absence` int(11) DEFAULT 3,
  `jours_carence` int(11) DEFAULT 2,
  `procedure_justification` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `parametres_application`
--

CREATE TABLE `parametres_application` (
  `id` int(11) NOT NULL,
  `devise` varchar(10) DEFAULT 'XOF',
  `symbole_devise` varchar(5) DEFAULT 'F CFA',
  `format_date` varchar(20) DEFAULT 'dd/mm/yyyy',
  `fuseau_horaire` varchar(50) DEFAULT 'Africa/Abidjan',
  `langue_defaut` varchar(10) DEFAULT 'fr',
  `theme_defaut` varchar(20) DEFAULT 'clair',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `parametres_application`
--

INSERT INTO `parametres_application` (`id`, `devise`, `symbole_devise`, `format_date`, `fuseau_horaire`, `langue_defaut`, `theme_defaut`, `created_at`, `updated_at`) VALUES
(1, 'XOF', 'FCFA', 'dd/mm/yyyy', 'Africa/Abidjan', 'fr', 'clair', '2026-02-19 09:07:31', '2026-03-02 13:36:48');

-- --------------------------------------------------------

--
-- Structure de la table `parametres_notation`
--

CREATE TABLE `parametres_notation` (
  `id` int(11) NOT NULL,
  `niveau` enum('primaire','college','lycee') NOT NULL,
  `systeme_notation` enum('sur_20','sur_10','sur_100','lettre','competences') NOT NULL DEFAULT 'sur_20',
  `echelle_competences` text DEFAULT NULL COMMENT 'JSON des compétences pour le primaire',
  `bareme_minimum` decimal(5,2) NOT NULL DEFAULT 0.00,
  `bareme_maximum` decimal(5,2) NOT NULL DEFAULT 20.00,
  `moyenne_admission` decimal(5,2) NOT NULL DEFAULT 10.00,
  `moyenne_felicitation` decimal(5,2) NOT NULL DEFAULT 16.00,
  `moyenne_table_honneur` decimal(5,2) NOT NULL DEFAULT 14.00,
  `coeff_matiere_base` decimal(4,2) NOT NULL DEFAULT 1.00,
  `coeff_matiere_importante` decimal(4,2) NOT NULL DEFAULT 2.00,
  `nombre_min_notes` int(11) NOT NULL DEFAULT 2,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `parametres_notation`
--

INSERT INTO `parametres_notation` (`id`, `niveau`, `systeme_notation`, `echelle_competences`, `bareme_minimum`, `bareme_maximum`, `moyenne_admission`, `moyenne_felicitation`, `moyenne_table_honneur`, `coeff_matiere_base`, `coeff_matiere_importante`, `nombre_min_notes`, `created_at`, `updated_at`) VALUES
(1, 'primaire', 'competences', '{\"TB\":\"Très Bien\",\"B\":\"Bien\",\"AB\":\"Assez Bien\",\"PA\":\"Passable\",\"I\":\"Insuffisant\"}', 0.00, 20.00, 10.00, 16.00, 14.00, 1.00, 2.00, 2, '2026-01-16 12:15:03', '2026-01-16 12:15:03'),
(2, 'college', 'sur_20', NULL, 0.00, 20.00, 10.00, 16.00, 14.00, 1.00, 2.00, 2, '2026-01-16 12:15:03', '2026-01-16 12:15:03'),
(3, 'lycee', 'sur_20', NULL, 0.00, 20.00, 10.00, 16.00, 14.00, 1.00, 2.00, 2, '2026-01-16 12:15:03', '2026-01-16 12:15:03');

-- --------------------------------------------------------

--
-- Structure de la table `periodes`
--

CREATE TABLE `periodes` (
  `id` int(11) NOT NULL,
  `nom` varchar(50) NOT NULL,
  `annee_scolaire` varchar(9) NOT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  `type_periode` enum('trimestre','semestre','annuel') DEFAULT 'trimestre',
  `numero` int(11) DEFAULT NULL,
  `statut` enum('active','fermee','a_venir') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `periodes_primaire`
--

CREATE TABLE `periodes_primaire` (
  `id` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `code_periode` varchar(20) NOT NULL COMMENT 'Ex: T1-2024',
  `annee_scolaire` varchar(9) NOT NULL COMMENT 'Ex: 2024-2025',
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  `type_periode` varchar(355) DEFAULT NULL,
  `numero` int(11) DEFAULT NULL,
  `est_periode_courante` tinyint(1) DEFAULT 0,
  `statut` enum('active','fermee','a_venir') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `periodes_primaire`
--

INSERT INTO `periodes_primaire` (`id`, `nom`, `code_periode`, `annee_scolaire`, `date_debut`, `date_fin`, `type_periode`, `numero`, `est_periode_courante`, `statut`, `created_at`, `updated_at`) VALUES
(1, 'Trimestre 1', 'TRM1', '2025-2026', '2025-09-12', '2026-01-14', 'trimestre', 1, 1, 'active', '2026-01-30 00:25:33', '2026-01-30 00:25:33');

-- --------------------------------------------------------

--
-- Structure de la table `permissions`
--

CREATE TABLE `permissions` (
  `id` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `code` varchar(50) NOT NULL,
  `module` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `permissions`
--

INSERT INTO `permissions` (`id`, `nom`, `code`, `module`, `description`, `created_at`) VALUES
(1, 'Voir les utilisateurs', 'users.view', 'users', 'Permet de voir la liste des utilisateurs', '2026-02-19 09:07:31'),
(2, 'Créer des utilisateurs', 'users.create', 'users', 'Permet de créer de nouveaux utilisateurs', '2026-02-19 09:07:31'),
(3, 'Modifier les utilisateurs', 'users.edit', 'users', 'Permet de modifier les utilisateurs', '2026-02-19 09:07:31'),
(4, 'Supprimer les utilisateurs', 'users.delete', 'users', 'Permet de supprimer des utilisateurs', '2026-02-19 09:07:31'),
(5, 'Voir les élèves', 'eleves.view', 'eleves', 'Permet de voir la liste des élèves', '2026-02-19 09:07:31'),
(6, 'Créer des élèves', 'eleves.create', 'eleves', 'Permet d\'ajouter des élèves', '2026-02-19 09:07:31'),
(7, 'Modifier les élèves', 'eleves.edit', 'eleves', 'Permet de modifier les élèves', '2026-02-19 09:07:31'),
(8, 'Supprimer les élèves', 'eleves.delete', 'eleves', 'Permet de supprimer des élèves', '2026-02-19 09:07:31'),
(9, 'Voir les classes', 'classes.view', 'classes', 'Permet de voir la liste des classes', '2026-02-19 09:07:31'),
(10, 'Gérer les classes', 'classes.manage', 'classes', 'Permet de gérer les classes', '2026-02-19 09:07:31'),
(11, 'Voir les cours', 'cours.view', 'cours', 'Permet de voir les cours', '2026-02-19 09:07:31'),
(12, 'Gérer les cours', 'cours.manage', 'cours', 'Permet de gérer les cours', '2026-02-19 09:07:31'),
(13, 'Voir les notes', 'notes.view', 'notes', 'Permet de voir les notes', '2026-02-19 09:07:31'),
(14, 'Saisir les notes', 'notes.create', 'notes', 'Permet de saisir les notes', '2026-02-19 09:07:31'),
(15, 'Modifier les notes', 'notes.edit', 'notes', 'Permet de modifier les notes', '2026-02-19 09:07:31'),
(16, 'Voir les absences', 'absences.view', 'absences', 'Permet de voir les absences', '2026-02-19 09:07:31'),
(17, 'Gérer les absences', 'absences.manage', 'absences', 'Permet de gérer les absences', '2026-02-19 09:07:31'),
(18, 'Voir les finances', 'finance.view', 'finance', 'Permet de voir les finances', '2026-02-19 09:07:31'),
(19, 'Gérer les finances', 'finance.manage', 'finance', 'Permet de gérer les finances', '2026-02-19 09:07:31'),
(20, 'Voir les paramètres', 'settings.view', 'settings', 'Permet d\'accéder aux paramètres', '2026-02-19 09:07:31'),
(21, 'Gérer les paramètres', 'settings.manage', 'settings', 'Permet de modifier les paramètres', '2026-02-19 09:07:31'),
(22, 'Gérer les rôles', 'roles.manage', 'settings', 'Permet de gérer les rôles', '2026-02-19 09:07:31'),
(23, 'Gérer les permissions', 'permissions.manage', 'settings', 'Permet de gérer les permissions', '2026-02-19 09:07:31'),
(34, 'Voir le tableau de bord', 'dashboard.view', 'dashboard', 'Permet d\'accéder au tableau de bord', '2026-02-20 17:52:02'),
(35, 'Voir le personnel', 'personnel.view', 'personnel', 'Permet de voir la liste du personnel', '2026-02-20 17:52:02'),
(36, 'Gérer le personnel', 'personnel.manage', 'personnel', 'Permet de gérer le personnel', '2026-02-20 17:52:02'),
(37, 'Voir l\'emploi du temps', 'emploi.view', 'emploi', 'Permet de voir l\'emploi du temps', '2026-02-20 17:52:02'),
(38, 'Gérer l\'emploi du temps', 'emploi.manage', 'emploi', 'Permet de gérer l\'emploi du temps', '2026-02-20 17:52:02');

-- --------------------------------------------------------

--
-- Structure de la table `relances_paiements`
--

CREATE TABLE `relances_paiements` (
  `id` int(11) NOT NULL,
  `eleve_id` int(11) NOT NULL,
  `parent_telephone` varchar(50) DEFAULT NULL,
  `parent_email` varchar(255) DEFAULT NULL,
  `message` text NOT NULL,
  `montant_du` decimal(10,2) DEFAULT 0.00,
  `methode_envoi` varchar(20) NOT NULL,
  `statut` varchar(20) DEFAULT 'envoye',
  `envoye_par` int(11) DEFAULT NULL,
  `date_envoi` datetime DEFAULT current_timestamp(),
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Structure de la table `releves_primaire`
--

CREATE TABLE `releves_primaire` (
  `id` int(11) NOT NULL,
  `eleve_id` int(11) NOT NULL,
  `matricule` varchar(155) NOT NULL,
  `eleve_nom` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `eleve_prenom` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `classe_id` int(11) NOT NULL,
  `classe_nom` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `periode_id` int(11) NOT NULL,
  `periode_nom` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `moyennes_par_matiere` text DEFAULT NULL,
  `moyenne_generale` decimal(4,2) NOT NULL,
  `rang` int(11) NOT NULL,
  `mention` varchar(50) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `appreciation_generale` text CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `date_generation` datetime NOT NULL,
  `statut` varchar(20) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT 'brouillon',
  `email_envoye` tinyint(1) NOT NULL,
  `date_envoi_email` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `releve_tokens`
--

CREATE TABLE `releve_tokens` (
  `id` int(11) NOT NULL,
  `token` varchar(64) NOT NULL,
  `releve_id` int(11) NOT NULL,
  `eleve_id` int(11) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `remises_bourses`
--

CREATE TABLE `remises_bourses` (
  `id` int(11) NOT NULL,
  `eleve_id` int(11) NOT NULL,
  `type` enum('remise','bourse','autre') CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `montant` decimal(10,2) NOT NULL,
  `pourcentage` decimal(5,2) DEFAULT 0.00,
  `motif` text CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `date_debut` date DEFAULT NULL,
  `date_fin` date DEFAULT NULL,
  `statut` enum('actif','expire','annule') CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT 'actif',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `retenues`
--

CREATE TABLE `retenues` (
  `id` int(11) NOT NULL,
  `eleve_id` int(11) NOT NULL,
  `absence_id` int(11) NOT NULL,
  `date_retenue` date NOT NULL,
  `heure_debut` time NOT NULL,
  `heure_fin` time NOT NULL,
  `salle` varchar(50) DEFAULT NULL,
  `surveillant_id` int(11) DEFAULT NULL,
  `motif` varchar(255) NOT NULL,
  `effectuee` tinyint(1) DEFAULT 0,
  `date_effectuee` date DEFAULT NULL,
  `observation` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `nom` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `niveau` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `roles`
--

INSERT INTO `roles` (`id`, `nom`, `description`, `niveau`, `created_at`, `updated_at`) VALUES
(1, 'Super Admin', 'Accès complet à toutes les fonctionnalités', 100, '2026-02-19 09:07:31', '2026-02-19 09:07:31'),
(2, 'Administrateur', 'Accès à la gestion administrative', 80, '2026-02-19 09:07:31', '2026-02-20 08:06:45'),
(3, 'Directeur', 'Accès à la direction', 70, '2026-02-19 09:07:31', '2026-02-19 09:07:31'),
(4, 'Censeur', 'Gestion de la discipline et des absences', 60, '2026-02-19 09:07:31', '2026-02-19 09:07:31'),
(5, 'Comptable', 'Gestion financière', 50, '2026-02-19 09:07:31', '2026-02-19 09:07:31'),
(6, 'Professeur', 'Gestion des cours et notes', 40, '2026-02-19 09:07:31', '2026-02-19 09:07:31'),
(7, 'Surveillant', 'Gestion des absences', 30, '2026-02-19 09:07:31', '2026-02-19 09:07:31'),
(8, 'Parent', 'Suivi des enfants', 20, '2026-02-19 09:07:31', '2026-02-19 09:07:31'),
(20, 'Insituteur', 'Gestion des cours et notes', 20, '2026-02-19 12:08:57', '2026-02-21 04:50:07');

-- --------------------------------------------------------

--
-- Structure de la table `roles_permissions`
--

CREATE TABLE `roles_permissions` (
  `role_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `roles_permissions`
--

INSERT INTO `roles_permissions` (`role_id`, `permission_id`, `created_at`) VALUES
(1, 1, '2026-02-21 14:08:56'),
(1, 2, '2026-02-21 14:08:56'),
(1, 3, '2026-02-21 14:08:56'),
(1, 4, '2026-02-21 14:08:56'),
(1, 5, '2026-02-21 14:08:56'),
(1, 6, '2026-02-21 14:08:56'),
(1, 7, '2026-02-21 14:08:56'),
(1, 8, '2026-02-21 14:08:56'),
(1, 9, '2026-02-21 14:08:56'),
(1, 10, '2026-02-21 14:08:56'),
(1, 11, '2026-02-21 14:08:56'),
(1, 12, '2026-02-21 14:08:56'),
(1, 13, '2026-02-21 14:08:56'),
(1, 14, '2026-02-21 14:08:56'),
(1, 15, '2026-02-21 14:08:56'),
(1, 16, '2026-02-21 14:08:56'),
(1, 17, '2026-02-21 14:08:56'),
(1, 18, '2026-02-21 14:08:56'),
(1, 19, '2026-02-21 14:08:56'),
(1, 20, '2026-02-21 14:08:56'),
(1, 21, '2026-02-21 14:08:56'),
(1, 22, '2026-02-21 14:08:56'),
(1, 23, '2026-02-21 14:08:56'),
(1, 34, '2026-02-21 14:08:56'),
(1, 35, '2026-02-21 14:08:56'),
(1, 36, '2026-02-21 14:08:56'),
(1, 37, '2026-02-21 14:08:56'),
(1, 38, '2026-02-21 14:08:56'),
(2, 1, '2026-02-20 08:07:57'),
(2, 2, '2026-02-20 08:07:57'),
(2, 3, '2026-02-20 08:07:57'),
(2, 4, '2026-02-20 08:07:57'),
(2, 5, '2026-02-20 08:07:57'),
(2, 6, '2026-02-20 08:07:57'),
(2, 7, '2026-02-20 08:07:57'),
(2, 8, '2026-02-20 08:07:57'),
(2, 9, '2026-02-20 08:07:57'),
(2, 10, '2026-02-20 08:07:57'),
(2, 11, '2026-02-20 08:07:57'),
(2, 12, '2026-02-20 08:07:57'),
(2, 13, '2026-02-20 08:07:57'),
(2, 14, '2026-02-20 08:07:57'),
(2, 15, '2026-02-20 08:07:57'),
(2, 16, '2026-02-20 08:07:57'),
(2, 17, '2026-02-20 08:07:57'),
(2, 20, '2026-02-20 08:07:57'),
(2, 21, '2026-02-20 08:07:57'),
(2, 22, '2026-02-20 08:07:57'),
(2, 23, '2026-02-20 08:07:57'),
(3, 5, '2026-02-21 14:02:39'),
(3, 6, '2026-02-21 14:02:39'),
(3, 7, '2026-02-21 14:02:39'),
(3, 8, '2026-02-21 14:02:39'),
(3, 9, '2026-02-21 14:02:39'),
(3, 10, '2026-02-21 14:02:39'),
(3, 11, '2026-02-21 14:02:39'),
(3, 12, '2026-02-21 14:02:39'),
(3, 16, '2026-02-21 14:02:39'),
(3, 17, '2026-02-21 14:02:39'),
(3, 34, '2026-02-21 14:02:39'),
(4, 5, '2026-02-20 08:08:38'),
(4, 6, '2026-02-20 08:08:38'),
(4, 7, '2026-02-20 08:08:38'),
(4, 8, '2026-02-20 08:08:38'),
(4, 9, '2026-02-20 08:08:38'),
(4, 10, '2026-02-20 08:08:38'),
(4, 11, '2026-02-20 08:08:38'),
(4, 12, '2026-02-20 08:08:38'),
(4, 13, '2026-02-20 08:08:38'),
(4, 14, '2026-02-20 08:08:38'),
(4, 15, '2026-02-20 08:08:38'),
(4, 16, '2026-02-20 08:08:38'),
(4, 17, '2026-02-20 08:08:38'),
(5, 18, '2026-02-20 08:08:53'),
(5, 19, '2026-02-20 08:08:53'),
(6, 5, '2026-02-20 08:09:10'),
(6, 6, '2026-02-20 08:09:10'),
(6, 7, '2026-02-20 08:09:10'),
(6, 8, '2026-02-20 08:09:10'),
(6, 9, '2026-02-20 08:09:10'),
(6, 10, '2026-02-20 08:09:10'),
(6, 11, '2026-02-20 08:09:10'),
(6, 12, '2026-02-20 08:09:10'),
(7, 5, '2026-02-20 08:09:44'),
(7, 6, '2026-02-20 08:09:44'),
(7, 7, '2026-02-20 08:09:44'),
(7, 8, '2026-02-20 08:09:44'),
(7, 9, '2026-02-20 08:09:44'),
(7, 10, '2026-02-20 08:09:44'),
(7, 11, '2026-02-20 08:09:44'),
(7, 12, '2026-02-20 08:09:44'),
(7, 16, '2026-02-20 08:09:44'),
(7, 17, '2026-02-20 08:09:44'),
(20, 5, '2026-02-20 08:10:08'),
(20, 6, '2026-02-20 08:10:08'),
(20, 7, '2026-02-20 08:10:08'),
(20, 8, '2026-02-20 08:10:08'),
(20, 9, '2026-02-20 08:10:08'),
(20, 10, '2026-02-20 08:10:08'),
(20, 11, '2026-02-20 08:10:08'),
(20, 12, '2026-02-20 08:10:08'),
(20, 13, '2026-02-20 08:10:08'),
(20, 14, '2026-02-20 08:10:08'),
(20, 15, '2026-02-20 08:10:08'),
(20, 16, '2026-02-20 08:10:08'),
(20, 17, '2026-02-20 08:10:08');

-- --------------------------------------------------------

--
-- Structure de la table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(175) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `data` text DEFAULT NULL,
  `expires` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `seuils_appreciation`
--

CREATE TABLE `seuils_appreciation` (
  `id` int(11) NOT NULL,
  `niveau` enum('primaire','college','lycee') NOT NULL,
  `note_min` decimal(5,2) NOT NULL,
  `note_max` decimal(5,2) NOT NULL,
  `appreciation` varchar(100) NOT NULL,
  `couleur` varchar(7) NOT NULL DEFAULT '#3B82F6',
  `ordre` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `statistiques_absences`
--

CREATE TABLE `statistiques_absences` (
  `id` int(11) NOT NULL,
  `eleve_id` int(11) NOT NULL,
  `classe_id` int(11) NOT NULL,
  `periode_id` int(11) NOT NULL,
  `total_absences` int(11) DEFAULT 0,
  `total_retards` int(11) DEFAULT 0,
  `absences_justifiees` int(11) DEFAULT 0,
  `absences_non_justifiees` int(11) DEFAULT 0,
  `total_minutes_retard` int(11) DEFAULT 0,
  `derniere_absence` date DEFAULT NULL,
  `mise_a_jour_le` date NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `types_absence`
--

CREATE TABLE `types_absence` (
  `id` int(11) NOT NULL,
  `libelle` varchar(50) NOT NULL,
  `code` varchar(30) NOT NULL,
  `description` text DEFAULT NULL,
  `couleur` varchar(20) DEFAULT '#64748b',
  `icone` varchar(50) DEFAULT '?',
  `statut` enum('actif','inactif') DEFAULT 'actif',
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `types_absence`
--

INSERT INTO `types_absence` (`id`, `libelle`, `code`, `description`, `couleur`, `icone`, `statut`, `created_at`) VALUES
(1, 'Absence', 'absence', 'Absence complète', '#EF4444', '????', 'actif', '2026-02-25 12:21:56'),
(2, 'Retard', 'retard', 'Arrivée en retard', '#F59E0B', '⏰', 'actif', '2026-02-25 12:21:56'),
(3, 'Sortie anticipée', 'sortie_anticipée', 'Départ avant la fin des cours', '#3B82F6', '????', 'actif', '2026-02-25 12:21:56'),
(4, 'Exclusion', 'exclusion', 'Exclusion temporaire', '#DC2626', '????', 'actif', '2026-02-25 12:21:56');

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `password` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `nom` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `prenom` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `role` enum('admin','enseignant','etudiant','parent') NOT NULL,
  `avatar_url` varchar(500) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `statut` enum('actif','inactif') CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT 'actif',
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `nom`, `prenom`, `role`, `avatar_url`, `statut`, `last_login`, `created_at`, `updated_at`) VALUES
(1, 'stephyatte@yahoo.fr', '$2b$12$dyxnw6Yp6w5YoTPMDL.CqejTwJ9qgmyf5HEr.jQ80Ye8THk1gZ33W', 'ATTE', 'Stéphane', 'admin', '/uploads/avatars/avatar_1763703707787_k3zfastyz.jpeg', 'actif', '2026-03-02 13:36:41', '2025-11-20 19:51:07', '2026-03-02 13:36:41'),
(2, 'gnamiencamille@gmail.com', '$2b$12$dyxnw6Yp6w5YoTPMDL.CqejTwJ9qgmyf5HEr.jQ80Ye8THk1gZ33W', 'Gnamien', 'Camille', 'admin', NULL, 'actif', '2026-01-21 14:44:54', '2026-01-21 14:10:00', '2026-02-21 12:22:34');

-- --------------------------------------------------------

--
-- Structure de la table `users_roles`
--

CREATE TABLE `users_roles` (
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `users_roles`
--

INSERT INTO `users_roles` (`user_id`, `role_id`, `created_at`) VALUES
(1, 1, '2026-02-20 09:50:50'),
(4, 5, '2026-02-21 12:12:53'),
(7, 5, '2026-02-27 02:39:32'),
(18, 20, '2026-02-25 21:36:43');

-- --------------------------------------------------------

--
-- Structure de la table `versement_scolarite`
--

CREATE TABLE `versement_scolarite` (
  `id` int(11) NOT NULL,
  `frais_eleve_id` int(11) NOT NULL,
  `eleve_id` int(11) NOT NULL,
  `numero_versement` int(11) NOT NULL,
  `montant_versement` decimal(10,2) NOT NULL,
  `montant_paye` decimal(10,2) DEFAULT 0.00,
  `date_echeance` date NOT NULL,
  `date_paiement` date DEFAULT NULL,
  `statut` enum('en_attente','partiel','paye','en_retard') DEFAULT 'en_attente',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `versement_scolarite`
--

INSERT INTO `versement_scolarite` (`id`, `frais_eleve_id`, `eleve_id`, `numero_versement`, `montant_versement`, `montant_paye`, `date_echeance`, `date_paiement`, `statut`, `created_at`, `updated_at`) VALUES
(17, 36, 2, 1, 22500.00, 25000.00, '2026-02-13', '2026-02-13', 'paye', '2026-02-13 14:32:38', '2026-02-13 14:32:38'),
(18, 36, 2, 2, 22500.00, 32500.00, '2026-03-13', '2026-02-13', 'paye', '2026-02-13 14:32:38', '2026-02-13 14:38:46'),
(19, 36, 2, 3, 22500.00, 0.00, '2026-04-13', NULL, 'en_attente', '2026-02-13 14:32:38', '2026-02-13 14:32:38'),
(20, 36, 2, 4, 22500.00, 0.00, '2026-05-13', NULL, 'en_attente', '2026-02-13 14:32:38', '2026-02-13 14:32:38'),
(21, 45, 10, 1, 25000.00, 15000.00, '2026-02-13', '2026-02-13', 'paye', '2026-02-13 14:36:57', '2026-02-13 14:36:57'),
(22, 45, 10, 2, 25000.00, 0.00, '2026-03-13', NULL, 'en_attente', '2026-02-13 14:36:57', '2026-02-13 14:36:57'),
(23, 45, 10, 3, 25000.00, 0.00, '2026-04-13', NULL, 'en_attente', '2026-02-13 14:36:57', '2026-02-13 14:36:57'),
(24, 45, 10, 4, 25000.00, 0.00, '2026-05-13', NULL, 'en_attente', '2026-02-13 14:36:57', '2026-02-13 14:36:57'),
(25, 46, 11, 1, 25000.00, 35000.00, '2026-02-13', '2026-02-13', 'paye', '2026-02-13 14:40:03', '2026-02-13 14:40:03'),
(26, 46, 11, 2, 25000.00, 25000.00, '2026-03-13', '2026-02-17', 'paye', '2026-02-13 14:40:03', '2026-02-17 01:13:06'),
(27, 46, 11, 3, 25000.00, 0.00, '2026-04-13', NULL, 'en_attente', '2026-02-13 14:40:03', '2026-02-13 14:40:03'),
(28, 46, 11, 4, 25000.00, 0.00, '2026-05-13', NULL, 'en_attente', '2026-02-13 14:40:03', '2026-02-13 14:40:03'),
(29, 50, 4, 1, 22500.00, 25000.00, '2026-02-17', '2026-02-17', 'paye', '2026-02-17 21:25:27', '2026-02-17 21:25:28'),
(30, 50, 4, 2, 22500.00, 20000.00, '2026-03-17', '2026-03-11', 'paye', '2026-02-17 21:25:27', '2026-02-17 21:35:38'),
(31, 50, 4, 3, 22500.00, 0.00, '2026-04-17', NULL, 'en_attente', '2026-02-17 21:25:27', '2026-02-17 21:25:27'),
(32, 50, 4, 4, 22500.00, 0.00, '2026-05-17', NULL, 'en_attente', '2026-02-17 21:25:28', '2026-02-17 21:25:28'),
(33, 55, 30, 1, 50000.00, 50000.00, '2026-02-25', '2026-02-25', 'paye', '2026-02-25 21:27:44', '2026-02-25 21:27:44'),
(34, 55, 30, 2, 50000.00, 0.00, '2026-03-25', NULL, 'en_attente', '2026-02-25 21:27:44', '2026-02-25 21:27:44'),
(35, 55, 30, 3, 50000.00, 0.00, '2026-04-25', NULL, 'en_attente', '2026-02-25 21:27:44', '2026-02-25 21:27:44'),
(36, 55, 30, 4, 50000.00, 0.00, '2026-05-25', NULL, 'en_attente', '2026-02-25 21:27:44', '2026-02-25 21:27:44');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `absences`
--
ALTER TABLE `absences`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_eleve` (`eleve_id`),
  ADD KEY `idx_date` (`date_absence`),
  ADD KEY `idx_classe` (`classe_id`),
  ADD KEY `idx_cours` (`cours_id`),
  ADD KEY `idx_periode` (`periode_id`),
  ADD KEY `idx_type` (`type_absence`),
  ADD KEY `idx_justifiee` (`justifiee`);

--
-- Index pour la table `alertes_absences`
--
ALTER TABLE `alertes_absences`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_eleve` (`eleve_id`),
  ADD KEY `idx_type_date` (`type_alerte`,`date_alerte`);

--
-- Index pour la table `annees_scolaires`
--
ALTER TABLE `annees_scolaires`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `audit_budgets`
--
ALTER TABLE `audit_budgets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `budget_id` (`budget_id`);

--
-- Index pour la table `budgets`
--
ALTER TABLE `budgets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_annee_categorie` (`annee_scolaire`,`categorie`);

--
-- Index pour la table `bulletins_eleves`
--
ALTER TABLE `bulletins_eleves`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_bulletin` (`eleve_id`,`periode_id`),
  ADD KEY `idx_eleve` (`eleve_id`),
  ADD KEY `idx_periode` (`periode_id`),
  ADD KEY `idx_valide_par` (`valide_par`),
  ADD KEY `idx_classe` (`classe_id`);

--
-- Index pour la table `categories_frais`
--
ALTER TABLE `categories_frais`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `classes`
--
ALTER TABLE `classes`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `compositions_primaire`
--
ALTER TABLE `compositions_primaire`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code_composition` (`code_composition`),
  ADD KEY `idx_classe` (`classe_id`),
  ADD KEY `idx_periode` (`periode_id`),
  ADD KEY `idx_statut` (`statut`),
  ADD KEY `idx_est_supprime` (`est_supprime`);

--
-- Index pour la table `cours`
--
ALTER TABLE `cours`
  ADD PRIMARY KEY (`code_cours`),
  ADD KEY `idx_professeur_id` (`professeur_id`),
  ADD KEY `idx_classe_id` (`classe_id`),
  ADD KEY `idx_jour_semaine` (`jour_semaine`),
  ADD KEY `idx_matiere_id` (`matiere_id`);

--
-- Index pour la table `depenses_budget`
--
ALTER TABLE `depenses_budget`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_budget_date` (`budget_id`,`date_depense`);

--
-- Index pour la table `documents_enseignants`
--
ALTER TABLE `documents_enseignants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `uploaded_by` (`uploaded_by`),
  ADD KEY `idx_enseignant_id` (`enseignant_id`),
  ADD KEY `idx_date_upload` (`date_upload`);

--
-- Index pour la table `echeanciers_classe`
--
ALTER TABLE `echeanciers_classe`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_echeancier_classe` (`classe_id`,`frais_scolaire_id`),
  ADD KEY `fk_echeancier_classe` (`classe_id`),
  ADD KEY `fk_echeancier_frais` (`frais_scolaire_id`);

--
-- Index pour la table `eleves`
--
ALTER TABLE `eleves`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `matricule` (`matricule`),
  ADD KEY `classe_id` (`classe_id`);

--
-- Index pour la table `emploi_du_temps`
--
ALTER TABLE `emploi_du_temps`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_classe` (`classe_id`),
  ADD KEY `idx_professeur` (`professeur_id`),
  ADD KEY `idx_jour` (`jour_semaine`),
  ADD KEY `idx_creneau` (`heure_debut`,`heure_fin`);

--
-- Index pour la table `enseignants`
--
ALTER TABLE `enseignants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `matricule` (`matricule`),
  ADD KEY `user_id` (`user_id`);

--
-- Index pour la table `evaluations`
--
ALTER TABLE `evaluations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code_evaluation` (`code_evaluation`),
  ADD KEY `idx_matiere` (`matiere_id`),
  ADD KEY `idx_classe` (`classe_id`),
  ADD KEY `idx_professeur` (`enseignant_id`),
  ADD KEY `idx_periode` (`periode_id`);

--
-- Index pour la table `evaluations_notes`
--
ALTER TABLE `evaluations_notes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code_evaluation` (`code_evaluation`),
  ADD KEY `idx_matiere` (`matiere_id`),
  ADD KEY `idx_classe` (`classe_id`),
  ADD KEY `idx_professeur` (`professeur_id`),
  ADD KEY `idx_periode` (`periode_id`);

--
-- Index pour la table `frais_eleves`
--
ALTER TABLE `frais_eleves`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_frais_eleve` (`frais_scolaire_id`,`eleve_id`,`annee_scolaire`),
  ADD KEY `fk_frais_eleve_eleve` (`eleve_id`),
  ADD KEY `fk_frais_eleve_frais` (`frais_scolaire_id`);

--
-- Index pour la table `frais_scolaires`
--
ALTER TABLE `frais_scolaires`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_frais_classe` (`categorie_frais_id`,`classe_id`,`annee_scolaire`),
  ADD KEY `fk_frais_classe` (`classe_id`),
  ADD KEY `fk_frais_categorie` (`categorie_frais_id`);

--
-- Index pour la table `logs_activite`
--
ALTER TABLE `logs_activite`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `action` (`action`),
  ADD KEY `created_at` (`created_at`);

--
-- Index pour la table `logs_suppression`
--
ALTER TABLE `logs_suppression`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_table_record` (`table_name`,`record_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Index pour la table `logs_utilisateurs`
--
ALTER TABLE `logs_utilisateurs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Index pour la table `matieres`
--
ALTER TABLE `matieres`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `matieres_primaire`
--
ALTER TABLE `matieres_primaire`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code_matiere` (`code_matiere`),
  ADD KEY `idx_niveau` (`niveau`),
  ADD KEY `idx_statut` (`statut`),
  ADD KEY `idx_ordre` (`ordre_affichage`);

--
-- Index pour la table `modules`
--
ALTER TABLE `modules`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `motifs_absence`
--
ALTER TABLE `motifs_absence`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_type` (`type_absence`);

--
-- Index pour la table `moyennes_eleves`
--
ALTER TABLE `moyennes_eleves`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_moyenne` (`eleve_id`,`matiere_id`,`periode_id`),
  ADD KEY `idx_eleve_matiere` (`eleve_id`,`matiere_id`),
  ADD KEY `idx_periode` (`periode_id`),
  ADD KEY `idx_classe` (`classe_id`);

--
-- Index pour la table `notes`
--
ALTER TABLE `notes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_note` (`eleve_id`,`evaluation_id`),
  ADD KEY `idx_eleve` (`eleve_id`),
  ADD KEY `idx_evaluation` (`evaluation_id`),
  ADD KEY `idx_saisie_par` (`saisie_par`),
  ADD KEY `idx_classe` (`classe_id`),
  ADD KEY `idx_matiere` (`matiere_id`),
  ADD KEY `idx_periode` (`periode_id`);

--
-- Index pour la table `notes_primaire`
--
ALTER TABLE `notes_primaire`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_note` (`eleve_id`,`composition_id`,`matiere_id`),
  ADD KEY `matiere_id` (`matiere_id`),
  ADD KEY `idx_composition` (`composition_id`),
  ADD KEY `idx_eleve` (`eleve_id`);

--
-- Index pour la table `numero_recu_sequence`
--
ALTER TABLE `numero_recu_sequence`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `paiements_frais`
--
ALTER TABLE `paiements_frais`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_paiement_frais_eleve` (`frais_eleve_id`),
  ADD KEY `fk_paiement_eleve` (`eleve_id`),
  ADD KEY `idx_numero_recu` (`numero_recu`);

--
-- Index pour la table `paiement_frais_supp`
--
ALTER TABLE `paiement_frais_supp`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `parametres`
--
ALTER TABLE `parametres`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `parametres_absences`
--
ALTER TABLE `parametres_absences`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_niveau` (`niveau`);

--
-- Index pour la table `parametres_application`
--
ALTER TABLE `parametres_application`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `parametres_notation`
--
ALTER TABLE `parametres_notation`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_niveau` (`niveau`);

--
-- Index pour la table `periodes`
--
ALTER TABLE `periodes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_annee_scolaire` (`annee_scolaire`),
  ADD KEY `idx_statut` (`statut`);

--
-- Index pour la table `periodes_primaire`
--
ALTER TABLE `periodes_primaire`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_code_periode` (`code_periode`),
  ADD UNIQUE KEY `uk_periode_annee` (`nom`,`annee_scolaire`),
  ADD KEY `idx_annee_scolaire` (`annee_scolaire`),
  ADD KEY `idx_statut` (`statut`),
  ADD KEY `idx_periode_courante` (`est_periode_courante`);

--
-- Index pour la table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Index pour la table `relances_paiements`
--
ALTER TABLE `relances_paiements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_eleve` (`eleve_id`),
  ADD KEY `idx_date_envoi` (`date_envoi`),
  ADD KEY `idx_methode_envoi` (`methode_envoi`),
  ADD KEY `idx_statut` (`statut`);

--
-- Index pour la table `releves_primaire`
--
ALTER TABLE `releves_primaire`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_eleve_periode` (`eleve_id`,`periode_id`),
  ADD KEY `idx_classe` (`classe_id`),
  ADD KEY `idx_periode` (`periode_id`);

--
-- Index pour la table `releve_tokens`
--
ALTER TABLE `releve_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `idx_token` (`token`),
  ADD KEY `idx_releve_id` (`releve_id`),
  ADD KEY `idx_expires_at` (`expires_at`),
  ADD KEY `eleve_id` (`eleve_id`);

--
-- Index pour la table `remises_bourses`
--
ALTER TABLE `remises_bourses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `eleve_id` (`eleve_id`);

--
-- Index pour la table `retenues`
--
ALTER TABLE `retenues`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_eleve` (`eleve_id`),
  ADD KEY `idx_absence` (`absence_id`),
  ADD KEY `idx_date` (`date_retenue`);

--
-- Index pour la table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nom` (`nom`);

--
-- Index pour la table `roles_permissions`
--
ALTER TABLE `roles_permissions`
  ADD PRIMARY KEY (`role_id`,`permission_id`),
  ADD KEY `permission_id` (`permission_id`);

--
-- Index pour la table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `expires` (`expires`);

--
-- Index pour la table `seuils_appreciation`
--
ALTER TABLE `seuils_appreciation`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_niveau_seuil` (`niveau`,`note_min`,`note_max`),
  ADD KEY `idx_niveau` (`niveau`);

--
-- Index pour la table `statistiques_absences`
--
ALTER TABLE `statistiques_absences`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_stats` (`eleve_id`,`classe_id`,`periode_id`),
  ADD KEY `idx_eleve_periode` (`eleve_id`,`periode_id`),
  ADD KEY `idx_classe_periode` (`classe_id`,`periode_id`);

--
-- Index pour la table `types_absence`
--
ALTER TABLE `types_absence`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Index pour la table `users_roles`
--
ALTER TABLE `users_roles`
  ADD PRIMARY KEY (`user_id`,`role_id`),
  ADD KEY `role_id` (`role_id`);

--
-- Index pour la table `versement_scolarite`
--
ALTER TABLE `versement_scolarite`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_versement` (`frais_eleve_id`,`numero_versement`),
  ADD KEY `idx_versement_eleve` (`eleve_id`),
  ADD KEY `idx_versement_statut` (`statut`),
  ADD KEY `idx_versement_echeance` (`date_echeance`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `absences`
--
ALTER TABLE `absences`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `alertes_absences`
--
ALTER TABLE `alertes_absences`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `annees_scolaires`
--
ALTER TABLE `annees_scolaires`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `audit_budgets`
--
ALTER TABLE `audit_budgets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `budgets`
--
ALTER TABLE `budgets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `bulletins_eleves`
--
ALTER TABLE `bulletins_eleves`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `categories_frais`
--
ALTER TABLE `categories_frais`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT pour la table `classes`
--
ALTER TABLE `classes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT pour la table `compositions_primaire`
--
ALTER TABLE `compositions_primaire`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `depenses_budget`
--
ALTER TABLE `depenses_budget`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `documents_enseignants`
--
ALTER TABLE `documents_enseignants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `echeanciers_classe`
--
ALTER TABLE `echeanciers_classe`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `eleves`
--
ALTER TABLE `eleves`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT pour la table `emploi_du_temps`
--
ALTER TABLE `emploi_du_temps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `enseignants`
--
ALTER TABLE `enseignants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `evaluations`
--
ALTER TABLE `evaluations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `evaluations_notes`
--
ALTER TABLE `evaluations_notes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `frais_eleves`
--
ALTER TABLE `frais_eleves`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- AUTO_INCREMENT pour la table `frais_scolaires`
--
ALTER TABLE `frais_scolaires`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT pour la table `logs_activite`
--
ALTER TABLE `logs_activite`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `logs_suppression`
--
ALTER TABLE `logs_suppression`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `logs_utilisateurs`
--
ALTER TABLE `logs_utilisateurs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `matieres`
--
ALTER TABLE `matieres`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT pour la table `matieres_primaire`
--
ALTER TABLE `matieres_primaire`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT pour la table `modules`
--
ALTER TABLE `modules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT pour la table `motifs_absence`
--
ALTER TABLE `motifs_absence`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `moyennes_eleves`
--
ALTER TABLE `moyennes_eleves`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `notes`
--
ALTER TABLE `notes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `notes_primaire`
--
ALTER TABLE `notes_primaire`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `numero_recu_sequence`
--
ALTER TABLE `numero_recu_sequence`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `paiements_frais`
--
ALTER TABLE `paiements_frais`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `parametres`
--
ALTER TABLE `parametres`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `parametres_absences`
--
ALTER TABLE `parametres_absences`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `parametres_application`
--
ALTER TABLE `parametres_application`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `parametres_notation`
--
ALTER TABLE `parametres_notation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `periodes`
--
ALTER TABLE `periodes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `periodes_primaire`
--
ALTER TABLE `periodes_primaire`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT pour la table `relances_paiements`
--
ALTER TABLE `relances_paiements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `releves_primaire`
--
ALTER TABLE `releves_primaire`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `releve_tokens`
--
ALTER TABLE `releve_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `remises_bourses`
--
ALTER TABLE `remises_bourses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `retenues`
--
ALTER TABLE `retenues`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT pour la table `seuils_appreciation`
--
ALTER TABLE `seuils_appreciation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `statistiques_absences`
--
ALTER TABLE `statistiques_absences`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `types_absence`
--
ALTER TABLE `types_absence`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `versement_scolarite`
--
ALTER TABLE `versement_scolarite`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `audit_budgets`
--
ALTER TABLE `audit_budgets`
  ADD CONSTRAINT `audit_budgets_ibfk_1` FOREIGN KEY (`budget_id`) REFERENCES `budgets` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `compositions_primaire`
--
ALTER TABLE `compositions_primaire`
  ADD CONSTRAINT `compositions_primaire_ibfk_1` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`),
  ADD CONSTRAINT `fk_composition_periode_primaire` FOREIGN KEY (`periode_id`) REFERENCES `periodes_primaire` (`id`);

--
-- Contraintes pour la table `depenses_budget`
--
ALTER TABLE `depenses_budget`
  ADD CONSTRAINT `depenses_budget_ibfk_1` FOREIGN KEY (`budget_id`) REFERENCES `budgets` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `documents_enseignants`
--
ALTER TABLE `documents_enseignants`
  ADD CONSTRAINT `documents_enseignants_ibfk_1` FOREIGN KEY (`enseignant_id`) REFERENCES `enseignants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `documents_enseignants_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_documents_enseignant` FOREIGN KEY (`enseignant_id`) REFERENCES `enseignants` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `echeanciers_classe`
--
ALTER TABLE `echeanciers_classe`
  ADD CONSTRAINT `fk_echeancier_classe` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`),
  ADD CONSTRAINT `fk_echeancier_frais` FOREIGN KEY (`frais_scolaire_id`) REFERENCES `frais_scolaires` (`id`);

--
-- Contraintes pour la table `eleves`
--
ALTER TABLE `eleves`
  ADD CONSTRAINT `eleves_ibfk_1` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `enseignants`
--
ALTER TABLE `enseignants`
  ADD CONSTRAINT `enseignants_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `evaluations`
--
ALTER TABLE `evaluations`
  ADD CONSTRAINT `fk_eval_classe` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_eval_matiere` FOREIGN KEY (`matiere_id`) REFERENCES `matieres` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_eval_periode` FOREIGN KEY (`periode_id`) REFERENCES `periodes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_eval_professeur` FOREIGN KEY (`enseignant_id`) REFERENCES `enseignants` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `frais_eleves`
--
ALTER TABLE `frais_eleves`
  ADD CONSTRAINT `fk_frais_eleve_eleve` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`),
  ADD CONSTRAINT `fk_frais_eleve_frais` FOREIGN KEY (`frais_scolaire_id`) REFERENCES `frais_scolaires` (`id`);

--
-- Contraintes pour la table `frais_scolaires`
--
ALTER TABLE `frais_scolaires`
  ADD CONSTRAINT `fk_frais_categorie` FOREIGN KEY (`categorie_frais_id`) REFERENCES `categories_frais` (`id`),
  ADD CONSTRAINT `fk_frais_classe` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`);

--
-- Contraintes pour la table `notes_primaire`
--
ALTER TABLE `notes_primaire`
  ADD CONSTRAINT `notes_primaire_ibfk_1` FOREIGN KEY (`composition_id`) REFERENCES `compositions_primaire` (`id`),
  ADD CONSTRAINT `notes_primaire_ibfk_2` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`),
  ADD CONSTRAINT `notes_primaire_ibfk_3` FOREIGN KEY (`matiere_id`) REFERENCES `matieres` (`id`);

--
-- Contraintes pour la table `paiements_frais`
--
ALTER TABLE `paiements_frais`
  ADD CONSTRAINT `fk_paiement_eleve` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`),
  ADD CONSTRAINT `fk_paiement_frais_eleve` FOREIGN KEY (`frais_eleve_id`) REFERENCES `frais_eleves` (`id`);

--
-- Contraintes pour la table `relances_paiements`
--
ALTER TABLE `relances_paiements`
  ADD CONSTRAINT `relances_paiements_ibfk_1` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `releves_primaire`
--
ALTER TABLE `releves_primaire`
  ADD CONSTRAINT `fk_releve_periode_primaire` FOREIGN KEY (`periode_id`) REFERENCES `periodes_primaire` (`id`),
  ADD CONSTRAINT `releves_primaire_ibfk_1` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`),
  ADD CONSTRAINT `releves_primaire_ibfk_2` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`);

--
-- Contraintes pour la table `releve_tokens`
--
ALTER TABLE `releve_tokens`
  ADD CONSTRAINT `releve_tokens_ibfk_1` FOREIGN KEY (`releve_id`) REFERENCES `releves_primaire` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `releve_tokens_ibfk_2` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `remises_bourses`
--
ALTER TABLE `remises_bourses`
  ADD CONSTRAINT `remises_bourses_ibfk_1` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`);

--
-- Contraintes pour la table `versement_scolarite`
--
ALTER TABLE `versement_scolarite`
  ADD CONSTRAINT `versement_scolarite_ibfk_1` FOREIGN KEY (`frais_eleve_id`) REFERENCES `frais_eleves` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `versement_scolarite_ibfk_2` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
