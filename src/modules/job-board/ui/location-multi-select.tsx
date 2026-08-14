"use client";

import { useMemo, useRef, useState } from "react";
import { MapPin, X } from "lucide-react";
import { Badge, Cluster, Input, Text } from "@/design-system";
import {
  MAX_JOB_LOCATIONS,
  resolveLocation,
  suggestLocations,
  type JobLocation,
} from "@/modules/job-board/locations";

const KIND_LABEL: Record<JobLocation["kind"], string> = {
  city: "Ville",
  country: "Pays",
  region: "Région",
};

export function LocationMultiSelect({
  id,
  value,
  onChange,
  invalid,
  disabled,
}: {
  id?: string;
  value: string[];
  onChange: (ids: string[]) => void;
  invalid?: boolean;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => value.map((id) => resolveLocation(id)),
    [value],
  );
  const suggestions = useMemo(
    () => suggestLocations(query, value, 8),
    [query, value],
  );
  const canAddCustom =
    query.trim().length >= 2 &&
    !suggestions.some(
      (entry) => entry.id === resolveLocation(query).id,
    ) &&
    selected.length < MAX_JOB_LOCATIONS;

  function add(id: string) {
    if (selected.length >= MAX_JOB_LOCATIONS) return;
    const resolved = resolveLocation(id);
    if (value.includes(resolved.id)) return;
    onChange([...value, resolved.id]);
    setQuery("");
    setOpen(true);
  }

  function remove(id: string) {
    onChange(value.filter((entry) => entry !== id));
  }

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node)) {
          setOpen(false);
        }
      }}
    >
      {selected.length > 0 ? (
        <Cluster gap={1} className="mb-2 flex-wrap">
          {selected.map((entry) => (
            <Badge
              key={entry.id}
              tone="brand"
              className="inline-flex items-center gap-1 pr-1"
            >
              {entry.label}
              <button
                type="button"
                className="rounded-full p-0.5 hover:bg-background/40"
                aria-label={`Retirer ${entry.label}`}
                disabled={disabled}
                onClick={() => remove(entry.id)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </Cluster>
      ) : null}
      <Input
        id={id}
        value={query}
        disabled={disabled || selected.length >= MAX_JOB_LOCATIONS}
        invalid={invalid}
        placeholder={
          selected.length >= MAX_JOB_LOCATIONS
            ? "Maximum atteint"
            : "Cherche Paris, Belgique, Lyon…"
        }
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            if (suggestions[0]) add(suggestions[0].id);
            else if (canAddCustom) add(query);
          }
          if (event.key === "Backspace" && !query && selected.length > 0) {
            remove(selected[selected.length - 1]!.id);
          }
          if (event.key === "Escape") setOpen(false);
        }}
      />
      {open ? (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border bg-background p-1 shadow-md"
        >
          {suggestions.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left hover:bg-muted"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => add(entry.id)}
              >
                <Cluster gap={2}>
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <Text as="span" size="sm">
                    {entry.label}
                  </Text>
                </Cluster>
                <Text as="span" size="sm" tone="muted">
                  {KIND_LABEL[entry.kind]}
                </Text>
              </button>
            </li>
          ))}
          {canAddCustom ? (
            <li>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-muted"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => add(query)}
              >
                <Text as="span" size="sm">
                  Ajouter « {query.trim()} »
                </Text>
              </button>
            </li>
          ) : null}
          {suggestions.length === 0 && !canAddCustom ? (
            <li className="px-3 py-2">
              <Text size="sm" tone="muted">
                Aucun lieu proche
              </Text>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
