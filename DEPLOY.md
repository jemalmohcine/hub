# Déploiement Vercel (lié au repo GitHub)

Repo : https://github.com/jemalmohcine/hub

## 1. Importer le projet

1. Va sur [vercel.com/new](https://vercel.com/new)
2. Import **jemalmohcine/hub**
3. Framework : Next.js (auto)
4. Build command : `npm run build` (Turbopack)

## 2. Variables d'environnement

Ajoute (Production + Preview) :

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service role (server only) |
| `NEXT_PUBLIC_APP_URL` | `https://<ton-domaine>.vercel.app` |
| `NEXT_PUBLIC_BILLING_MOCK` | `true` |

## 3. Supabase Auth redirects

Dans Supabase → Authentication → URL Configuration :

- Site URL : `https://<ton-domaine>.vercel.app`
- Redirect URLs :
  - `https://<ton-domaine>.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback` (dev)

Le reset password utilise le callback avec `?next=/reset-password`.

## 4. SQL

Exécute dans le SQL Editor Supabase, dans l’ordre :

1. `supabase/migrations/001_hub_phase1.sql`
2. `supabase/migrations/002_profile_names.sql` (prénom / nom)

Si `001` a déjà été appliqué, lance seulement `002`.

## CLI (optionnel)

```bash
vercel login
vercel link
vercel env pull
vercel --prod
```
