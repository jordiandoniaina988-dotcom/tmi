# TANORA MPANDRESY IAVOLOHA — Guide d'installation complet

Contenu du dossier : `index.html` (application), `sw.js` (mode hors ligne), `manifest.json` + `logo.png` (installation), `schema.sql` (base de données), `diagnostic.html` (test de connexion).

## Étape 1 — Créer la base Supabase
1. Allez sur supabase.com, créez un compte puis **New project**. Notez le mot de passe de la base.
2. Attendez la fin de la création (1 à 2 minutes).
3. Menu **SQL Editor** > **New query**. Ouvrez `schema.sql`, copiez TOUT le contenu, collez, cliquez **Run**. Message attendu : « Success ».

## Étape 2 — Récupérer l'URL et la clé
1. **Project Settings** (engrenage) > **API Keys** / **Data API**.
2. Copiez l'**URL du projet** (`https://xxxx.supabase.co`) et la clé **anon / publishable** (`sb_publishable_…` ou `eyJ…`).
3. Ne copiez JAMAIS la clé `service_role` ou `secret`.
4. Dans `index.html` ET `diagnostic.html`, remplacez les valeurs de `CFG` (ligne `const CFG={url:'…',key:'…'}`). Déjà rempli avec votre projet actuel : vérifiez que c'est bien le bon.

## Étape 3 — Créer l'administrateur
1. **Authentication > Users > Add user > Create new user**.
2. Email : par exemple `admin@tanora.app` (ou votre vraie adresse). Choisissez un mot de passe (6 caractères minimum).
3. **Cochez « Auto Confirm User »**, puis **Create user**.
4. **SQL Editor > New query**, collez ceci en remplaçant l'email par le vôtre, puis **Run** :
```sql
insert into admins(username,auth_user_id)
select 'admin',id from auth.users where email='admin@tanora.app'
on conflict (username) do update set auth_user_id=excluded.auth_user_id;
```
   Attendu : « 1 row affected ».
5. Vérification :
```sql
select u.email,u.email_confirmed_at,a.username
from auth.users u left join admins a on a.auth_user_id=u.id;
```
   Les trois colonnes doivent être remplies.
6. **Authentication > Providers > Email** : désactivez « Allow new users to sign up » pour empêcher les inscriptions publiques.

## Étape 4 — Tester avant de lancer l'application
Ouvrez `diagnostic.html` (via le serveur de l'étape 5), saisissez vos identifiants, cliquez **Lancer le test**. Les 4 lignes doivent être vertes. Sinon, le message indique exactement quoi corriger.

Identifiants dans l'application : soit le nom (`admin` → l'application ajoute `@tanora.app`), soit l'email complet.

## Étape 5 — Lancer l'application
**En local (ne double-cliquez pas sur index.html)** : dans un terminal ouvert dans le dossier :
```
python3 -m http.server 8000
```
(Windows : `py -m http.server 8000`), puis ouvrez `http://localhost:8000` dans Chrome.

**En ligne (recommandé)** : Netlify Drop (app.netlify.com/drop) : glissez le dossier, vous obtenez une adresse HTTPS. Cloudflare Pages et GitHub Pages fonctionnent aussi.

## Étape 6 — Installer sur le téléphone
Ouvrez l'adresse HTTPS dans Chrome Android > menu ⋮ > **Installer l'application**. Sur ordinateur : icône d'installation dans la barre d'adresse.

## Utilisation
- **Accès membre** : lecture seule, sans mot de passe.
- **Administrateur** : ajout/modification de caisses, mouvements, membres.
- Les modifications sont enregistrées sur l'appareil puis synchronisées avec Supabase dès qu'Internet est disponible (pastille d'état en haut). Hors ligne, l'administrateur reste connecté 12 h après une connexion en ligne.
- **Paramètres** : sauvegarde JSON et restauration.

## Dépannage
| Message | Cause | Solution |
|---|---|---|
| Identifiants incorrects | Email ou mot de passe différent de Authentication > Users | Recréer l'utilisateur avec Auto Confirm, refaire l'étape 3.4 |
| Email non confirmé | Utilisateur non confirmé | Cocher Auto Confirm ou confirmer dans la liste |
| Compte non administrateur | INSERT INTO admins non fait | Étape 3.4 |
| Erreur de synchronisation | schema.sql non exécuté ou clé erronée | Étapes 1 et 2 |
| Ancienne version affichée | Cache du navigateur | F12 > Application > Service Workers > Unregister, puis Clear site data, Ctrl+Shift+R |
| Page blanche ou sans icônes | Pas d'Internet au premier chargement | Se connecter une première fois |

Mot de passe à ne jamais partager : celui de la base, la clé `service_role`.
