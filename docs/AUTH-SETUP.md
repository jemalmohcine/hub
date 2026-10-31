# Authentification (e-mail + mot de passe)

Configuration à vérifier dans le **tableau de bord du projet** (Authentication), en plus des variables `NUXT_PUBLIC_APP_URL`, `NUXT_PUBLIC_SUPABASE_URL` et clés anon/service.

## Providers

- **E-mail** : activé, connexion par mot de passe activée.
- **Confirm email** : **activé** (inscription impossible sans confirmation).
- Désactiver ou laisser inactifs **GitHub**, **Google** et le **magic link** si vous n’utilisez que mot de passe + confirmation.

## URLs

| Champ | Valeur production |
|--------|-------------------|
| **Site URL** | `https://hub-onedev.vercel.app` |
| **Redirect URLs** (allow list) | `https://hub-onedev.vercel.app/auth/confirm` |
| | `https://hub-onedev.vercel.app/auth/update-password` |
| | `https://hub-onedev.vercel.app/**` (previews Vercel si besoin) |

Les liens e-mail utilisent `NUXT_PUBLIC_APP_URL` :

- Confirmation d’inscription → `/auth/confirm`
- Réinitialisation mot de passe → `/auth/update-password`

## Modèle de lien

Laisser le flux **PKCE** par défaut (recommandé). L’application échange le paramètre `code` côté client (`ssr: false` sur les pages de callback).

## Previews Vercel

Pour chaque URL de preview utilisée en test, ajouter la variante  
`https://<preview>/auth/confirm` et `/auth/update-password`,  
ou définir `NUXT_PUBLIC_APP_URL` sur l’URL de preview du déploiement.
