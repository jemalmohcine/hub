"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Copy,
  ExternalLink,
  FolderPlus,
  Loader2,
  Pin,
  PinOff,
  Plus,
  Search,
  Sparkles,
  StickyNote,
  Trash2,
  Code2,
  X,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Cluster,
  EmptyState,
  Field,
  IconButton,
  Input,
  Select,
  Stack,
  Text,
  Textarea,
  useAsyncAction,
  useToast,
} from "@/design-system";
import {
  createDevSnippet,
  createDevSnippetCategory,
  deleteDevSnippet,
  deleteDevSnippetCategory,
  searchDevSnippets,
  toggleDevSnippetPin,
  updateDevSnippet,
} from "@/modules/dev-snippets/actions";
import { SNIPPET_LANGUAGES } from "@/modules/dev-snippets/languages";
import { mergeRankedIds, rankSnippets } from "@/modules/dev-snippets/match";
import {
  buildSmartSearchQuery,
  buildWebSearchUrl,
  preferredProviders,
} from "@/modules/dev-snippets/search";
import type {
  DevSnippet,
  DevSnippetCategory,
  DevSnippetKind,
  WebSearchProvider,
} from "@/modules/dev-snippets/types";
import { WEB_SEARCH_PROVIDERS } from "@/modules/dev-snippets/types";
import { cn } from "@/lib/utils";

const EMPTY_FORM = {
  title: "",
  kind: "snippet" as DevSnippetKind,
  language: "typescript",
  content: "",
  tags: "",
  categoryId: "",
  referenceUrl: "",
};

export function SnippetsWorkspace({
  initialSnippets,
  initialCategories,
}: {
  initialSnippets: DevSnippet[];
  initialCategories: DevSnippetCategory[];
}) {
  const [snippets, setSnippets] = useState(initialSnippets);
  const [categories, setCategories] = useState(initialCategories);
  const [selectedId, setSelectedId] = useState<string | null>(initialSnippets[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [aiIds, setAiIds] = useState<string[] | null>(null);
  const [aiSource, setAiSource] = useState<"ai" | "local" | null>(null);
  const [aiPending, setAiPending] = useState(false);
  const searchSeq = useRef(0);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<DevSnippetKind | "all">("all");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [quickSearch, setQuickSearch] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const { run, pending } = useAsyncAction();
  const toast = useToast();

  const selected = snippets.find((item) => item.id === selectedId) ?? null;

  const categoryNameById = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category.name]));
  }, [categories]);

  const scoped = useMemo(() => {
    return snippets.filter((item) => {
      if (kindFilter !== "all" && item.kind !== kindFilter) return false;
      if (categoryFilter && item.categoryId !== categoryFilter) return false;
      return true;
    });
  }, [snippets, categoryFilter, kindFilter]);

  const localMatched = useMemo(() => {
    if (!search.trim()) return scoped;
    return rankSnippets(search, scoped);
  }, [scoped, search]);

  const filtered = useMemo(() => {
    if (!search.trim()) return scoped;
    const known = new Set(scoped.map((item) => item.id));
    const merged = mergeRankedIds(
      aiIds,
      localMatched.map((item) => item.id),
      known,
    );
    if (!merged) return localMatched;
    const byId = new Map(scoped.map((item) => [item.id, item]));
    return merged
      .map((id) => byId.get(id))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [scoped, search, localMatched, aiIds]);

  useEffect(() => {
    const query = search.trim();
    if (query.length < 2) {
      setAiIds(null);
      setAiSource(null);
      setAiPending(false);
      return;
    }

    const seq = (searchSeq.current += 1);
    setAiPending(true);
    const timer = window.setTimeout(() => {
      void searchDevSnippets(query)
        .then((result) => {
          if (seq !== searchSeq.current) return;
          setAiIds(result.ids);
          setAiSource(result.source);
        })
        .catch(() => {
          if (seq !== searchSeq.current) return;
          setAiIds(null);
          setAiSource("local");
        })
        .finally(() => {
          if (seq === searchSeq.current) setAiPending(false);
        });
    }, 400);

    return () => window.clearTimeout(timer);
  }, [search]);

  function clearSearch() {
    setSearch("");
    setAiIds(null);
    setAiSource(null);
    setAiPending(false);
  }

  function startCreate() {
    setEditing(true);
    setForm(EMPTY_FORM);
    setSelectedId(null);
  }

  function startEdit(item: DevSnippet) {
    setEditing(true);
    setForm({
      title: item.title,
      kind: item.kind,
      language: item.language ?? "other",
      content: item.content,
      tags: item.tags.join(", "),
      categoryId: item.categoryId ?? "",
      referenceUrl: item.referenceUrl ?? "",
    });
  }

  function cancelEdit() {
    setEditing(false);
    setForm(EMPTY_FORM);
    if (!selectedId && snippets[0]) setSelectedId(snippets[0].id);
  }

  function parseTags(value: string) {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  function handleSave() {
    const payload = {
      title: form.title,
      kind: form.kind,
      language: form.language,
      content: form.content,
      tags: parseTags(form.tags),
      categoryId: form.categoryId || null,
      referenceUrl: form.referenceUrl || null,
    };
    const categoryName = payload.categoryId
      ? (categoryNameById.get(payload.categoryId) ?? null)
      : null;

    if (selectedId) {
      void run(() => updateDevSnippet(selectedId, payload), {
        success: "Snippet mis à jour",
        error: "Impossible de sauvegarder",
        onSuccess: () => {
          setSnippets((prev) =>
            prev.map((item) =>
              item.id === selectedId
                ? {
                    ...item,
                    ...payload,
                    categoryName,
                    referenceUrl: payload.referenceUrl,
                    updatedAt: new Date().toISOString(),
                  }
                : item,
            ),
          );
          setEditing(false);
        },
      });
      return;
    }

    void run(() => createDevSnippet(payload), {
      success: "Snippet créé",
      error: "Impossible de créer le snippet",
      onSuccess: (created) => {
        setSnippets((prev) => [created, ...prev]);
        setSelectedId(created.id);
        setEditing(false);
        setForm(EMPTY_FORM);
      },
    });
  }

  function handleCreateCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    void run(() => createDevSnippetCategory(name), {
      success: "Catégorie créée",
      error: "Impossible de créer la catégorie",
      onSuccess: (created) => {
        setCategories((prev) =>
          [...prev, created].sort((a, b) => a.name.localeCompare(b.name, "fr")),
        );
        setNewCategoryName("");
        setAddingCategory(false);
        setCategoryFilter(created.id);
      },
    });
  }

  function handleDeleteCategory(id: string) {
    setCategories((prev) => prev.filter((category) => category.id !== id));
    setSnippets((prev) =>
      prev.map((item) =>
        item.categoryId === id
          ? { ...item, categoryId: null, categoryName: null }
          : item,
      ),
    );
    if (categoryFilter === id) setCategoryFilter(null);
    if (form.categoryId === id) setForm((current) => ({ ...current, categoryId: "" }));
    void run(() => deleteDevSnippetCategory(id), {
      success: "Catégorie supprimée",
      error: "Impossible de supprimer la catégorie",
    });
  }

  function handleDelete(id: string) {
    setSnippets((prev) => prev.filter((item) => item.id !== id));
    if (selectedId === id) {
      const next = snippets.find((item) => item.id !== id);
      setSelectedId(next?.id ?? null);
    }
    void run(() => deleteDevSnippet(id), {
      success: "Snippet supprimé",
      error: "Impossible de supprimer",
    });
  }

  function handleTogglePin(item: DevSnippet) {
    const next = !item.isPinned;
    setSnippets((prev) =>
      prev
        .map((snippet) =>
          snippet.id === item.id ? { ...snippet, isPinned: next } : snippet,
        )
        .sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        }),
    );
    void run(() => toggleDevSnippetPin(item.id, next), {
      error: "Impossible d'épingler",
    });
  }

  async function copyContent(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copié dans le presse-papiers");
    } catch {
      toast.error("Copie impossible");
    }
  }

  function openWebSearch(provider: WebSearchProvider, query: string) {
    const url = buildWebSearchUrl(provider, query);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const smartQuery = selected
    ? buildSmartSearchQuery(selected.title, selected.content, selected.language)
    : quickSearch;

  return (
    <Stack gap={4} className="pb-4 lg:pb-8">
      <Card className="p-4">
        <Stack gap={3}>
          <div>
            <Text weight="medium">Recherche rapide sur le web</Text>
            <Text size="sm" tone="muted" className="mt-1">
              Cherchez une doc ou une solution sans quitter DevHub.
            </Text>
          </div>
          <Input
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            placeholder="Ex. react useEffect cleanup, docker compose healthcheck…"
          />
          <Cluster gap={2} className="flex-wrap">
            {WEB_SEARCH_PROVIDERS.map((provider) => (
              <Button
                key={provider.id}
                type="button"
                size="sm"
                variant="outline"
                disabled={!quickSearch.trim()}
                onClick={() => openWebSearch(provider.id, quickSearch)}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {provider.label}
              </Button>
            ))}
          </Cluster>
        </Stack>
      </Card>

      <Cluster gap={2} className="flex-wrap justify-between">
        <Cluster gap={2} className="min-w-0 flex-1">
          <div className="relative min-w-[12rem] flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ex. docker, healthcheck postgres, note javascript…"
              className={search ? "pr-10 pl-9" : "pl-9"}
              aria-label="Rechercher dans tes snippets"
            />
            {search ? (
              <IconButton
                type="button"
                label="Effacer la recherche"
                size="sm"
                variant="ghost"
                className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
              </IconButton>
            ) : null}
          </div>
          <Select
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value as DevSnippetKind | "all")}
            className="w-[9rem]"
          >
            <option value="all">Tout</option>
            <option value="snippet">Snippets</option>
            <option value="note">Notes</option>
          </Select>
        </Cluster>
        <Button type="button" size="sm" onClick={startCreate}>
          <Plus className="h-4 w-4" />
          Nouveau
        </Button>
      </Cluster>
      {search.trim() ? (
        <Cluster gap={2} className="flex-wrap items-center">
          {aiPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          )}
          <Text size="sm" weight="medium">
            Recherche : « {search.trim()} »
          </Text>
          <Text size="sm" tone="muted">
            {filtered.length}{" "}
            {filtered.length === 1 ? "résultat" : "résultats"}
            {aiPending
              ? " — l’IA affine…"
              : aiSource === "ai"
                ? " — rangés par l’IA"
                : ""}
          </Text>
          <Button type="button" size="sm" variant="ghost" onClick={clearSearch}>
            <X className="h-3.5 w-3.5" />
            Effacer
          </Button>
        </Cluster>
      ) : (
        <Text size="sm" tone="muted">
          Tape un mot, un langage ou une intention. Filtre aussi par tes catégories.
        </Text>
      )}

      <Stack gap={2}>
        <Text size="sm" weight="medium">
          Tes catégories
        </Text>
        <Text size="sm" tone="muted">
          Tu les crées toi-même pour classer tes snippets. L’IA ne les invente pas.
        </Text>
        <Cluster gap={2} className="flex-wrap items-center">
          <Button
            type="button"
            size="sm"
            variant={categoryFilter === null ? "primary" : "outline"}
            onClick={() => setCategoryFilter(null)}
          >
            Toutes
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              type="button"
              size="sm"
              variant={categoryFilter === category.id ? "primary" : "outline"}
              onClick={() =>
                setCategoryFilter((current) =>
                  current === category.id ? null : category.id,
                )
              }
            >
              {category.name}
            </Button>
          ))}
          {addingCategory ? (
            <Cluster gap={2} className="items-center">
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ex. Docker, Frontend…"
                className="h-9 w-[10rem]"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleCreateCategory();
                  }
                  if (event.key === "Escape") {
                    setAddingCategory(false);
                    setNewCategoryName("");
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                disabled={pending || !newCategoryName.trim()}
                onClick={handleCreateCategory}
              >
                Ajouter
              </Button>
              <IconButton
                type="button"
                label="Annuler"
                size="sm"
                onClick={() => {
                  setAddingCategory(false);
                  setNewCategoryName("");
                }}
              >
                <X className="h-4 w-4" />
              </IconButton>
            </Cluster>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setAddingCategory(true)}
            >
              <FolderPlus className="h-3.5 w-3.5" />
              Nouvelle catégorie
            </Button>
          )}
          {categoryFilter ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => handleDeleteCategory(categoryFilter)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Supprimer
            </Button>
          ) : null}
        </Cluster>
      </Stack>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Stack gap={2}>
          {filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title={search.trim() ? "Aucun résultat" : "Aucun snippet"}
              hint={
                search.trim()
                  ? `Aucun snippet ne correspond à « ${search.trim()} ».`
                  : categoryFilter
                    ? "Cette catégorie est vide. Ajoute un snippet ou choisis une autre catégorie."
                    : "Crée ta première note ou ton premier extrait de code."
              }
            />
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedId(item.id);
                  setEditing(false);
                }}
                className={cn(
                  "rounded-2xl border p-3 text-left transition-colors",
                  selectedId === item.id
                    ? "border-foreground bg-muted/60"
                    : "border-border hover:bg-muted/40",
                )}
              >
                <Cluster gap={2} className="justify-between">
                  <Cluster gap={2} className="min-w-0">
                    {item.kind === "snippet" ? (
                      <Code2 className="h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <StickyNote className="h-4 w-4 shrink-0 text-primary" />
                    )}
                    <Text size="sm" weight="medium" className="truncate">
                      {item.title}
                    </Text>
                  </Cluster>
                  {item.isPinned ? <Pin className="h-3.5 w-3.5 text-primary" /> : null}
                </Cluster>
                <Text size="sm" tone="muted" className="mt-1 line-clamp-2 text-xs">
                  {item.content}
                </Text>
                <Cluster gap={2} className="mt-2 flex-wrap">
                  {item.categoryName ? (
                    <Badge tone="info">{item.categoryName}</Badge>
                  ) : null}
                  {item.language ? <Badge tone="neutral">{item.language}</Badge> : null}
                  {item.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} tone="neutral">
                      #{tag}
                    </Badge>
                  ))}
                </Cluster>
              </button>
            ))
          )}
        </Stack>

        <Card className="p-4">
          {editing ? (
            <Stack gap={3}>
              <Text weight="medium">{selectedId ? "Modifier" : "Nouveau snippet / note"}</Text>
              <Field label="Titre" htmlFor="snippet-title">
                <Input
                  id="snippet-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex. Docker healthcheck PostgreSQL"
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Type" htmlFor="snippet-kind">
                  <Select
                    id="snippet-kind"
                    value={form.kind}
                    onChange={(e) =>
                      setForm({ ...form, kind: e.target.value as DevSnippetKind })
                    }
                  >
                    <option value="snippet">Snippet code</option>
                    <option value="note">Note</option>
                  </Select>
                </Field>
                <Field label="Langage" htmlFor="snippet-language">
                  <Select
                    id="snippet-language"
                    value={form.language}
                    onChange={(e) => setForm({ ...form, language: e.target.value })}
                  >
                    {SNIPPET_LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="Catégorie" htmlFor="snippet-category">
                <Select
                  id="snippet-category"
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                >
                  <option value="">Sans catégorie</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Tags (séparés par des virgules)" htmlFor="snippet-tags">
                <Input
                  id="snippet-tags"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="docker, postgres, devops"
                />
              </Field>
              <Field label="Lien de référence" htmlFor="snippet-ref">
                <Input
                  id="snippet-ref"
                  value={form.referenceUrl}
                  onChange={(e) => setForm({ ...form, referenceUrl: e.target.value })}
                  placeholder="https://…"
                />
              </Field>
              <Field label="Contenu" htmlFor="snippet-content">
                <Textarea
                  id="snippet-content"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={12}
                  className="font-mono text-sm"
                  placeholder="Collez votre code ou note ici…"
                />
              </Field>
              <Cluster gap={2}>
                <Button
                  type="button"
                  disabled={pending || !form.title.trim()}
                  onClick={handleSave}
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Sauvegarder
                </Button>
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Annuler
                </Button>
              </Cluster>
            </Stack>
          ) : selected ? (
            <Stack gap={3}>
              <Cluster gap={2} className="justify-between">
                <div className="min-w-0">
                  <Text weight="medium" className="truncate">
                    {selected.title}
                  </Text>
                  <Cluster gap={2} className="mt-1 flex-wrap">
                    <Badge tone="neutral">
                      {selected.kind === "snippet" ? "Snippet" : "Note"}
                    </Badge>
                    {selected.language ? (
                      <Badge tone="info">{selected.language}</Badge>
                    ) : null}
                    {selected.categoryName ? (
                      <Badge tone="info">{selected.categoryName}</Badge>
                    ) : null}
                  </Cluster>
                </div>
                <Cluster gap={1}>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleTogglePin(selected)}
                  >
                    {selected.isPinned ? (
                      <PinOff className="h-4 w-4" />
                    ) : (
                      <Pin className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => copyContent(selected.content)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => startEdit(selected)}
                  >
                    Modifier
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleDelete(selected.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </Cluster>
              </Cluster>

              {selected.tags.length > 0 ? (
                <Cluster gap={2} className="flex-wrap">
                  {selected.tags.map((tag) => (
                    <Badge key={tag} tone="info">
                      #{tag}
                    </Badge>
                  ))}
                </Cluster>
              ) : null}

              <pre className="overflow-x-auto rounded-xl bg-muted/50 p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                {selected.content}
              </pre>

              {selected.referenceUrl ? (
                <a
                  href={selected.referenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Documentation de référence
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}

              <div>
                <Text size="sm" weight="medium" className="mb-2">
                  Chercher sur le web
                </Text>
                <Cluster gap={2} className="flex-wrap">
                  {preferredProviders(selected.language).map((providerId) => {
                    const provider = WEB_SEARCH_PROVIDERS.find((p) => p.id === providerId);
                    if (!provider) return null;
                    return (
                      <Button
                        key={provider.id}
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => openWebSearch(provider.id, smartQuery)}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {provider.label}
                      </Button>
                    );
                  })}
                </Cluster>
                <Text size="sm" tone="muted" className="mt-2 text-xs">
                  Requête : {smartQuery}
                </Text>
              </div>
            </Stack>
          ) : (
            <EmptyState
              variant="inline"
              icon={Code2}
              title="Aucun snippet sélectionné"
              hint="Choisis un snippet dans la liste ou crées-en un nouveau."
            />
          )}
        </Card>
      </div>
    </Stack>
  );
}
