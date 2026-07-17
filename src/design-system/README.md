# Design System DevHub

## Couches

| Couche | Chemin | Rôle |
|--------|--------|------|
| Tokens CSS | `src/assets/styles/` | Primitives → semantic → `@theme` |
| Primitives UI | `src/components/ui/` | shadcn (Button, Card, Input…) |
| Product API | `src/design-system/` | Wrappers + patterns métier |

## Import (pages)

```ts
import { Button, Card, PageHeader } from "@/design-system";
```

Ne pas importer `@/components/ui/*` depuis les pages — passe par le design system.

## Tokens

Voir `src/assets/styles/README.md` (Tailwind v4 best practice).

## Stack

- Tailwind CSS **4.3.3**
- shadcn/ui (radix-nova) + `radix-ui`
- Utilities : `cn` via `@/lib/utils`
