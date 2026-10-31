# Restauration Next.js (après #73)

Référence fonctionnelle : commit `0ba91f23`.

## Fait dans cette PR

| Zone | Statut |
|------|--------|
| Stack Next 16 + App Router (`src/app`) | OK |
| Routes app : overview, ai, career, snippets, expenses, settings (+ sous-pages) | OK |
| Auth e-mail / mot de passe (+ confirmation) | OK (OAuth retiré) |
| Veille UI (module ai-intel) | OK, données **`veille_ia_items`** + saves **`veille_ia_saves`** |
| `POST /api/veille/ingest` + `x-ingest-secret` | OK |
| Snippets, CV builder + export PDF, dépenses dev, catalogue outils | OK (code Next d’origine) |
| PWA (`manifest.webmanifest`, icônes hub, SW statique) | OK |
| Rebrand **hub** + palette indigo + logo SVG/PNG | OK |
| Mobile : safe areas, bottom nav, bouton accueil | OK |
| Offres scrapées (job-board ingest / onglet Offres) | **Retiré** (demande Mohcine) |
| Candidatures manuelles (job-tracker) | OK |

## Écarts connus / non repris

| Next `0ba91f23` | Cette PR | Note |
|-----------------|----------|------|
| Pipeline `ai_intel_*` + cron GitHub | Non | Ingest externe veille uniquement |
| Onglet Carrière « Offres » (scraping) | Retiré | Volontaire |
| OAuth Google / GitHub | Retiré | E-mail + mot de passe |
| Billing Stripe actif | Pages présentes, flux selon clés PSP | Comme avant si non configuré |
| Admin `/admin` | Inchangé | Rôle admin requis |
| Notifications push veille | Code présent, VAPID optionnel | Non activé sans clés |

## Nuxt (#73–#78)

Abandonné. PR #78 considérée comme remplacée par cette branche.
