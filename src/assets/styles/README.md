# Design tokens (Tailwind CSS v4)

Organisation recommandée (docs Tailwind `@theme` + tokens en couches) :

```
src/assets/styles/
  tokens/           # primitives (valeurs brutes)
    colors.primitives.css
    spacing.css
    typography.css
    radius.css
    shadows.css
    motion.css
    layout.css
  semantic/         # rôles UI (+ dark) — ce que consomment shadcn / composants
    colors.css
  theme.css         # @theme inline → utilities Tailwind
  base.css          # @layer base
src/app/globals.css # entry (imports only)
```

Règles :
1. **Primitives** = pas de sens UI (`--primitive-brand-700`)
2. **Semantic** = rôles (`--primary`, `--background`) — overridables en `.dark`
3. **`@theme`** = uniquement top-level, namespaces `--color-*`, `--radius-*`, `--font-*`
4. Les pages / composants utilisent les utilities (`bg-primary`, `text-muted-foreground`) ou le design system — jamais de hex en dur
