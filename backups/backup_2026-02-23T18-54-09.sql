-- Sauvegarde du 23/02/2026 18:54:09
-- Fichier: backup_2026-02-23T18-54-09.sql
-- ID: 72849552504
-- Date de création: 2026-02-23T18:54:09.676Z

-- Cette sauvegarde a été créée manuellement le 23/02/2026 18:54:09

CREATE TABLE IF NOT EXISTS backup_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date_sauvegarde DATETIME,
  fichier VARCHAR(255),
  backup_id INT
);

INSERT INTO backup_log (date_sauvegarde, fichier, backup_id) 
VALUES (NOW(), 'backup_2026-02-23T18-54-09.sql', 72849552504);
