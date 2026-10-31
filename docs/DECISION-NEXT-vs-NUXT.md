# Choix architecture : Next historique vs Nuxt actuel

## Décision

**Corriger et faire évoluer l’app Nuxt** (pas de restauration du monolithe Next sur `main`).

## Raisons

1. **Cause racine prod identifiée** : `@nuxtjs/supabase` v2 remplit `useSupabaseUser()` avec les **claims JWT** (`sub`), pas un objet `User` avec `.id`. Toutes les requêtes utilisaient `user.value?.id` → toujours `undefined` → `useAsyncData` renvoyait `null` et l’UI masquait le contenu. Correctif central : `useAuthUserId()` / `extractAuthUserId()`.
2. **Restaurer Next** = réintroduire `src/`, double stack Vercel, régression auth déjà migrée, semaines de re-merge. Le code Next reste **référence fonctionnelle** dans git (`0ba91f23`) pour porter écran par écran.
3. **Parité** : une fois les données visibles, on continue le port fidèle des écrans Next (snippets workspace complet, etc.) documenté dans `FEATURE-PARITY.md`.

## Référence Next

Commit avant migration : `0ba91f23` (modules `src/modules/dev-snippets`, veille, CV, etc.).
