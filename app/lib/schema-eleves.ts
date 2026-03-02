-- Table des élèves
CREATE TABLE IF NOT EXISTS eleves (
  id INT PRIMARY KEY AUTO_INCREMENT,
  matricule VARCHAR(50) UNIQUE NOT NULL,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  date_naissance DATE NOT NULL,
  lieu_naissance VARCHAR(100),
  genre ENUM('M', 'F') NOT NULL,
  adresse TEXT,
  telephone VARCHAR(20),
  email VARCHAR(100),
  nom_pere VARCHAR(100),
  nom_mere VARCHAR(100),
  telephone_parent VARCHAR(20),
  classe_id INT,
  photo_url VARCHAR(500),
  statut ENUM('actif', 'inactif', 'diplome', 'abandon') DEFAULT 'actif',
  date_inscription DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (classe_id) REFERENCES classes(id)
);

-- Table des classes
CREATE TABLE IF NOT EXISTS classes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nom VARCHAR(50) NOT NULL,
  niveau VARCHAR(50) NOT NULL,
  cycle VARCHAR(50),
  capacite_max INT DEFAULT 40,
  professeur_principal_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertion de données de test
INSERT INTO classes (nom, niveau, cycle) VALUES 
('6ème A', '6ème', 'Collège'),
('5ème B', '5ème', 'Collège'),
('Seconde C', 'Seconde', 'Lycée'),
('Première S', 'Première', 'Lycée'),
('Terminale ES', 'Terminale', 'Lycée');

INSERT INTO eleves (matricule, nom, prenom, date_naissance, genre, adresse, telephone, email, nom_pere, nom_mere, telephone_parent, classe_id) VALUES
('ELV2024001', 'Dupont', 'Jean', '2008-05-15', 'M', '123 Rue de Paris, 75001', '+33123456789', 'jean.dupont@ecole.fr', 'Pierre Dupont', 'Marie Dupont', '+33123456780', 1),
('ELV2024002', 'Martin', 'Sophie', '2008-08-22', 'F', '456 Avenue Victor Hugo, 75016', '+33123456790', 'sophie.martin@ecole.fr', 'Paul Martin', 'Julie Martin', '+33123456791', 1),
('ELV2024003', 'Bernard', 'Lucas', '2007-03-10', 'M', '789 Boulevard Saint-Germain, 75006', '+33123456792', 'lucas.bernard@ecole.fr', 'Jacques Bernard', 'Anne Bernard', '+33123456793', 2),
('ELV2024004', 'Petit', 'Emma', '2006-11-30', 'F', '321 Rue de Rivoli, 75004', '+33123456794', 'emma.petit@ecole.fr', 'Michel Petit', 'Catherine Petit', '+33123456795', 3);