# RetroMakersLab Announcer

Annonce automatiquement les nouvelles vidéos de la chaîne sur Discord, Facebook, Instagram et X, avec GitHub Actions.

TikTok et Reddit ne sont volontairement pas automatisés : TikTok exige l'envoi d'une vidéo, Reddit sanctionne les publications automatiques.

## Fonctionnement

Toutes les 15 minutes, GitHub lance `run.js`. Le script lit le flux RSS de la chaîne, repère les vidéos qui ne sont pas dans `state.json` (publiées depuis moins de 72 h) et poste l'annonce. Il enregistre ensuite la vidéo dans `state.json`, commité par le workflow : une vidéo n'est donc jamais annoncée deux fois.

- Premier lancement : les vidéos existantes sont enregistrées sans annonce.
- Un réseau sans clés est ignoré. Une erreur sur un réseau n'empêche pas les autres et fait échouer l'exécution (GitHub t'envoie un e-mail).
- Si aucun réseau n'a reçu le message, la vidéo est retentée au passage suivant.

## Mise en place

1. Crée un dépôt GitHub et envoie-y le contenu de ce dossier (le dossier `.github` compris).
2. Dans Settings → Secrets and variables → Actions → New repository secret, ajoute les secrets ci-dessous. Commence par Discord seul.
3. Dans l'onglet Actions, lance « Annonce des nouvelles vidéos » à la main (Run workflow) : le premier passage enregistre l'état.
4. Publie ensuite une vidéo, ou retire un identifiant de `state.json`, pour tester une vraie annonce.

| Secret | Rôle |
| --- | --- |
| `DISCORD_WEBHOOK_URL` | Salon d'annonces → Intégrations → Webhooks |
| `FB_PAGE_ID` | Identifiant de la page Facebook |
| `FB_PAGE_ACCESS_TOKEN` | Jeton d'accès de la page (app Meta) |
| `IG_USER_ID` | Compte Instagram professionnel lié à la page Facebook |
| `IG_ACCESS_TOKEN` | Facultatif : sinon le jeton Facebook de la page est utilisé |
| `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_SECRET` | Clés de l'app X avec droit d'écriture |

Ne mets jamais ces valeurs dans un fichier du dépôt ni dans un message.

## À savoir

- Dépôt public : les minutes GitHub Actions sont gratuites. Dépôt privé : le quota gratuit est limité, passe alors le cron à `*/30` dans `.github/workflows/announce.yml`. Vérifie les limites actuelles de GitHub.
- GitHub peut retarder les tâches planifiées de quelques minutes, et peut les désactiver sur un dépôt public sans activité pendant 60 jours. Les commits de `state.json` comptent comme activité.
- Vercel n'est plus utilisé : tu peux supprimer le projet.

## Tests

`npm test` vérifie le flux RSS, la déduplication, la longueur du message pour X, la légende Instagram et la signature OAuth.
