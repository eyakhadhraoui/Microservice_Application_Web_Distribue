# API à implémenter (notes internes + messagerie)

Le frontend appelle les endpoints suivants. Il faut les ajouter au backend pour que les fonctionnalités soient opérationnelles.

## Notes internes (médecin uniquement)

- **GET** `/api/notes-internes/dossier/{idDossierMedical}`  
  Réponse : tableau de `{ idNoteInterne?, idDossierMedical, contenu, dateCreation?, medecinNom? }`

- **POST** `/api/notes-internes`  
  Body : `{ idDossierMedical: number, contenu: string }`  
  Réponse : note créée (avec id, dateCreation, etc.)

- **DELETE** `/api/notes-internes/{id}`  
  Supprime la note.

## Messagerie médecin–patient

- **GET** `/api/messages/dossier/{idDossierMedical}`  
  Réponse : tableau de `{ idMessage?, idDossierMedical, typeExpediteur: 'MEDECIN'|'PATIENT', contenu, dateEnvoi?, lu?, expediteurNom? }`

- **POST** `/api/messages`  
  Body : `{ idDossierMedical: number, typeExpediteur: 'MEDECIN'|'PATIENT', contenu: string }`  
  Réponse : message créé (avec id, dateEnvoi, etc.)

- **PATCH** (optionnel) `/api/messages/{id}/lu`  
  Marque le message comme lu.

## Signature électronique (rapports)

Les rapports (`/api/rapports-bi`) peuvent inclure en body :

- `signatureBase64?: string` — image PNG en base64
- `dateSignature?: string` — date/heure ISO de la signature
- `nomMedecin?: string` — nom du médecin signataire

À stocker en base et à renvoyer dans les GET pour que l’export PDF côté front affiche la signature.
