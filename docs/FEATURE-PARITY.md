# Parité fonctionnelle (Next → Nuxt)

Référence : commit `0ba91f23` (dernier Next avant migration `#73`).

## Restauré dans cette PR

| Domaine | Statut |
|---------|--------|
| Veille : fil, filtres, détail Quoi/Impact, enregistrements | OK |
| Veille : vue **Récent** (plus de jour vide par défaut) | OK (cette PR) |
| Snippets : dossiers, recherche, CRUD, copie | OK |
| Snippets : épinglage, tags (champ texte) | OK (cette PR) |
| CV + candidatures manuelles | OK (base) |
| Catalogue offres gratuites + suivis | OK |
| Auth e-mail / mot de passe + paramètres | OK (cette PR) |
| Navigation mobile (onglets + retour accueil) | OK (cette PR) |
| Session persistée (cookies longue durée + restore client) | OK (cette PR) |

## Partiel ou simplifié

| Fonctionnalité Next | Nuxt actuel | Raison |
|---------------------|-------------|--------|
| Snippets : import / export | Absent | Hors scope PR ; à planifier |
| Snippets : image upload + compression | Absent | UI image non portée |
| Snippets : classification LLM dossiers | Absent | Dépendance LLM + actions serveur |
| Snippets : recherche sémantique LLM | Absent | Idem |
| Snippets : langages avec liste `SNIPPET_LANGUAGES` | Liste libre | Simplifié |
| Veille : push / notifications | Absent | Module notifications Next retiré |
| CV : export PDF riche / thèmes multiples | Export HTML minimal | À enrichir |
| CV : sections complètes (formations détaillées, etc.) | Partiel | Édition guidée réduite |
| Overview : widgets stats / raccourcis dynamiques | Cartes modules + compteurs basiques | Cette PR ajoute compteurs |
| Paramètres : suppression compte auto | Message + déconnexion | Pas de RPC `delete_user` |
| Billing / entitlements Pro | App gratuite volontairement | Décision produit |

## Données snippets (prod)

Les snippets existants restent liés à l’**ancien `user_id`**. Réassignation documentée : [`docs/ops/reassign-snippets.sql`](ops/reassign-snippets.sql).
