-- Vérifiez si la table existe
SELECT TABLE_NAME 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'releves_primaire';

-- Si elle n'existe pas, créez-la :
CREATE TABLE IF NOT EXISTS releves_primaire (
  id INT PRIMARY KEY AUTO_INCREMENT,
  eleve_id INT NOT NULL,
  eleve_nom VARCHAR(100) NOT NULL,
  eleve_prenom VARCHAR(100) NOT NULL,
  classe_id INT NOT NULL,
  classe_nom VARCHAR(100) NOT NULL,
  periode_id INT NOT NULL,
  periode_nom VARCHAR(100) NOT NULL,
  moyenne_generale DECIMAL(5,2) DEFAULT 0.00,
  moyennes_par_matiere TEXT,
  rang INT DEFAULT 0,
  mention VARCHAR(50),
  appreciation_generale TEXT,
  date_generation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  statut VARCHAR(20) DEFAULT 'genere',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE,
  FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (periode_id) REFERENCES periodes_primaire(id) ON DELETE CASCADE
);

-- Ajoutez un index unique pour éviter les doublons
ALTER TABLE releves_primaire 
ADD UNIQUE INDEX idx_unique_eleve_periode (eleve_id, periode_id);

-- Vérifiez la création
DESCRIBE releves_primaire;