"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useRef, useTransition } from "react";
import { Cluster, Input, Select } from "@/design-system";
import { PILLAR_LABELS, URGENCY_LABELS } from "@/modules/ai-intel/types";

export function FeedFilters({ categories }: { categories: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function pushParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (!value || value === "all" || value === "0") next.delete(key);
    else next.set(key, value);
    startTransition(() => {
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  return (
    <Cluster gap={2} className="w-full flex-wrap">
      <Select
        aria-label="Pilier"
        className="min-w-[10rem] flex-1"
        defaultValue={searchParams.get("pillar") ?? "all"}
        disabled={pending}
        onChange={(e) => pushParam("pillar", e.target.value)}
      >
        <option value="all">Tous les piliers</option>
        {Object.entries(PILLAR_LABELS).map(([id, label]) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Urgence"
        className="min-w-[8rem] flex-1"
        defaultValue={searchParams.get("urgency") ?? "all"}
        disabled={pending}
        onChange={(e) => pushParam("urgency", e.target.value)}
      >
        <option value="all">Toute urgence</option>
        {Object.entries(URGENCY_LABELS).map(([id, label]) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Catégorie"
        className="min-w-[9rem] flex-1"
        defaultValue={searchParams.get("category") ?? "all"}
        disabled={pending}
        onChange={(e) => pushParam("category", e.target.value)}
      >
        <option value="all">Toutes catégories</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Sauvegardes"
        className="min-w-[8rem] flex-1"
        defaultValue={
          searchParams.get("saved") === "1" ||
          searchParams.get("saved") === "true"
            ? "1"
            : "all"
        }
        disabled={pending}
        onChange={(e) => pushParam("saved", e.target.value)}
      >
        <option value="all">Tous</option>
        <option value="1">Saved only</option>
      </Select>

      <Input
        aria-label="Recherche"
        className="min-w-[12rem] flex-[2]"
        placeholder="Rechercher…"
        defaultValue={searchParams.get("q") ?? ""}
        disabled={pending}
        onChange={(e) => {
          const value = e.target.value;
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => pushParam("q", value), 300);
        }}
      />
    </Cluster>
  );
}
