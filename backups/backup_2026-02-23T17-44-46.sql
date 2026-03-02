-- Sauvegarde du 23/02/2026 17:44:46
-- Fichier: backup_2026-02-23T17-44-46.sql

-- Cette sauvegarde a été créée manuellement
-- Pour une vraie sauvegarde, installez mysqldump

CREATE TABLE IF NOT EXISTS backup_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date_sauvegarde DATETIME,
  fichier VARCHAR(255)
);

INSERT INTO backup_log (date_sauvegarde, fichier) 
VALUES (NOW(), 'backup_2026-02-23T17-44-46.sql');
