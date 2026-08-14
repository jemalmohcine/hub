"use client";

import { useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { Badge, Cluster, Input, Text } from "@/design-system";

export type ChipOption = {
  id: string;
  label: string;
  hint?: string;
};

export function ChipMultiSelect({
  id,
  value,
  onChange,
  invalid,
  disabled,
  placeholder,
  max,
  suggest,
  resolveLabel,
}: {
  id?: string;
  value: string[];
  onChange: (ids: string[]) => void;
  invalid?: boolean;
  disabled?: boolean;
  placeholder: string;
  max: number;
  suggest: (query: string, selected: string[]) => ChipOption[];
  resolveLabel: (id: string) => string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => suggest(query, value), [query, value, suggest]);
  const canAddCustom =
    query.trim().length >= 2 &&
    !suggestions.some((entry) => entry.id === query.trim().toLowerCase()) &&
    value.length < max;

  function add(id: string) {
    if (value.length >= max || value.includes(id)) return;
    onChange([...value, id]);
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
      {value.length > 0 ? (
        <Cluster gap={1} className="mb-2 flex-wrap">
          {value.map((entry) => (
            <Badge
              key={entry}
              tone="brand"
              className="inline-flex items-center gap-1 pr-1"
            >
              {resolveLabel(entry)}
              <button
                type="button"
                className="rounded-full p-0.5 hover:bg-background/40"
                aria-label={`Retirer ${resolveLabel(entry)}`}
                disabled={disabled}
                onClick={() => remove(entry)}
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
        disabled={disabled || value.length >= max}
        invalid={invalid}
        placeholder={value.length >= max ? "Maximum atteint" : placeholder}
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
            else if (canAddCustom) add(query.trim());
          }
          if (event.key === "Backspace" && !query && value.length > 0) {
            remove(value[value.length - 1]!);
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
                <Text as="span" size="sm">
                  {entry.label}
                </Text>
                {entry.hint ? (
                  <Text as="span" size="sm" tone="muted">
                    {entry.hint}
                  </Text>
                ) : null}
              </button>
            </li>
          ))}
          {canAddCustom ? (
            <li>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-muted"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => add(query.trim())}
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
                Aucun choix proche — tape pour ajouter
              </Text>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
