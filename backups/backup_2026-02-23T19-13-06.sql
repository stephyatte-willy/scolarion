-- Sauvegarde du 23/02/2026 19:13:06
-- Fichier: backup_2026-02-23T19-13-06.sql
-- ID: 7398602253
-- Date de création: 2026-02-23T19:13:06.022Z

-- Cette sauvegarde a été créée manuellement le 23/02/2026 19:13:06

CREATE TABLE IF NOT EXISTS backup_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date_sauvegarde DATETIME,
  fichier VARCHAR(255),
  backup_id INT
);

INSERT INTO backup_log (date_sauvegarde, fichier, backup_id) 
VALUES (NOW(), 'backup_2026-02-23T19-13-06.sql', 7398602253);
