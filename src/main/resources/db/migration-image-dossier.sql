-- Si la table image_medicale a encore la colonne idSuivi au lieu de idDossierMedical,
-- exécuter ce script (adapter le nom de la base si besoin : nepdro / nep).

-- 1. Ajouter la nouvelle colonne
ALTER TABLE image_medicale ADD COLUMN idDossierMedical BIGINT NULL;

-- 2. Remplir idDossierMedical à partir du suivi (si vous aviez des données)
-- UPDATE image_medicale im
-- INNER JOIN suivi s ON im.idSuivi = s.idSuivi
-- SET im.idDossierMedical = s.idDossierMedical;

-- 3. Supprimer l'ancienne colonne
-- ALTER TABLE image_medicale DROP FOREIGN KEY <nom_contrainte_fk_si_existe>;
ALTER TABLE image_medicale DROP COLUMN idSuivi;

-- 4. Rendre la nouvelle colonne obligatoire
ALTER TABLE image_medicale MODIFY COLUMN idDossierMedical BIGINT NOT NULL;

-- 5. Ajouter la clé étrangère vers dossier_medical
ALTER TABLE image_medicale
  ADD CONSTRAINT fk_image_dossier
  FOREIGN KEY (idDossierMedical) REFERENCES dossier_medical(idDossierMedical);
