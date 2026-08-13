"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Copy,
  ExternalLink,
  Loader2,
  Pin,
  PinOff,
  Plus,
  Search,
  Sparkles,
  StickyNote,
  Trash2,
  Code2,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Cluster,
  EmptyState,
  Field,
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
  deleteDevSnippet,
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
import type { DevSnippet, DevSnippetKind, WebSearchProvider } from "@/modules/dev-snippets/types";
import { WEB_SEARCH_PROVIDERS } from "@/modules/dev-snippets/types";
import { cn } from "@/lib/utils";

const EMPTY_FORM = {
  title: "",
  kind: "snippet" as DevSnippetKind,
  language: "typescript",
  content: "",
  tags: "",
  referenceUrl: "",
};

export function SnippetsWorkspace({ initialSnippets }: { initialSnippets: DevSnippet[] }) {
  const [snippets, setSnippets] = useState(initialSnippets);
  const [selectedId, setSelectedId] = useState<string | null>(initialSnippets[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [aiIds, setAiIds] = useState<string[] | null>(null);
  const [aiSource, setAiSource] = useState<"ai" | "local" | null>(null);
  const [aiPending, setAiPending] = useState(false);
  const searchSeq = useRef(0);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<DevSnippetKind | "all">("all");
  const [quickSearch, setQuickSearch] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const { run, pending } = useAsyncAction();
  const toast = useToast();

  const selected = snippets.find((item) => item.id === selectedId) ?? null;

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const snippet of snippets) {
      for (const tag of snippet.tags) tags.add(tag);
    }
    return [...tags].sort();
  }, [snippets]);

  const scoped = useMemo(() => {
    return snippets.filter((item) => {
      if (kindFilter !== "all" && item.kind !== kindFilter) return false;
      if (tagFilter && !item.tags.includes(tagFilter)) return false;
      return true;
    });
  }, [snippets, tagFilter, kindFilter]);

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
      referenceUrl: form.referenceUrl || null,
    };

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
              className="pl-9"
            />
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
      {search.trim().length >= 2 ? (
        <Cluster gap={2} className="items-center">
          {aiPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          )}
          <Text size="sm" tone="muted">
            {aiPending
              ? "L’IA lit tes snippets…"
              : aiSource === "ai"
                ? "Résultats rangés selon ce que tu as demandé."
                : "Titre, tags, code et notes — l’IA affine dès qu’elle peut."}
          </Text>
        </Cluster>
      ) : (
        <Text size="sm" tone="muted">
          Tape un mot, un langage ou une intention. L’IA retrouve le bon snippet même avec beaucoup d’entrées.
        </Text>
      )}

      {allTags.length > 0 ? (
        <Cluster gap={2} className="flex-wrap">
          <Button
            type="button"
            size="sm"
            variant={tagFilter === null ? "primary" : "outline"}
            onClick={() => setTagFilter(null)}
          >
            Tous les tags
          </Button>
          {allTags.map((tag) => (
            <Button
              key={tag}
              type="button"
              size="sm"
              variant={tagFilter === tag ? "primary" : "outline"}
              onClick={() => setTagFilter(tag)}
            >
              #{tag}
            </Button>
          ))}
        </Cluster>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Stack gap={2}>
          {filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title={search.trim() ? "Aucun résultat" : "Aucun snippet"}
              hint={
                search.trim()
                  ? "Essaie un autre mot, un tag, ou le langage (docker, javascript…)."
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
                  {item.language ? <Badge tone="neutral">{item.language}</Badge> : null}
                  {item.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} tone="info">
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
