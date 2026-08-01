"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Download,
  Eye,
  FileText,
  Pencil,
  Save,
} from "lucide-react";
import {
  Button,
  Card,
  Cluster,
  Stack,
  Text,
} from "@/design-system";
import { saveCvDocument } from "@/modules/cv-builder/actions";
import { defaultCvDocument } from "@/modules/cv-builder/defaults";
import {
  exportCvJson,
  exportCvMarkdown,
  exportCvPdf,
} from "@/modules/cv-builder/export";
import type { CvDocument } from "@/modules/cv-builder/types";
import { CvForm } from "@/modules/cv-builder/ui/cv-form";
import { CvPreview } from "@/modules/cv-builder/ui/cv-preview";
import { ThemePicker } from "@/modules/cv-builder/ui/theme-picker";
import { cn } from "@/lib/utils";

type Panel = "edit" | "preview" | "themes" | "export";

export function CvBuilderWorkspace({
  initialDoc,
}: {
  initialDoc: CvDocument | null;
}) {
  const [doc, setDoc] = useState<CvDocument>(initialDoc ?? defaultCvDocument());
  const [panel, setPanel] = useState<Panel>("edit");
  const [saved, setSaved] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (initialDoc) setDoc(initialDoc);
  }, [initialDoc]);

  function update(next: CvDocument) {
    setDoc(next);
    setSaved(false);
  }

  function handleSave() {
    setSaveError(null);
    startTransition(async () => {
      try {
        await saveCvDocument(doc);
        setSaved(true);
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : "Erreur de sauvegarde");
      }
    });
  }

  const tabs: Array<{ id: Panel; label: string; icon: typeof Pencil }> = [
    { id: "edit", label: "Éditer", icon: Pencil },
    { id: "preview", label: "Aperçu", icon: Eye },
    { id: "themes", label: "Thèmes", icon: FileText },
    { id: "export", label: "Exporter", icon: Download },
  ];

  return (
    <Stack gap={4} className="pb-8">
      <Cluster gap={2} className="flex-wrap justify-between">
        <Text size="sm" tone="muted">
          {saved ? "Sauvegardé" : "Modifications non sauvegardées"}
        </Text>
        <Cluster gap={2}>
          <Button type="button" size="sm" variant="outline" onClick={handleSave}>
            <Save className="h-4 w-4" />
            Sauvegarder
          </Button>
        </Cluster>
      </Cluster>

      {saveError ? (
        <Card className="border-[var(--dh-danger)]/30 bg-[var(--dh-danger-soft)]/20 p-3">
          <Text size="sm">{saveError}</Text>
        </Card>
      ) : null}

      <div className="flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = panel === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPanel(tab.id)}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium",
                active
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="hidden gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Stack gap={3}>
          <Card className="p-4">
            <Text weight="medium" className="mb-3">
              Thème
            </Text>
            <ThemePicker
              value={doc.themeId}
              onChange={(themeId) => update({ ...doc, themeId })}
            />
          </Card>
          <CvForm doc={doc} onChange={update} />
        </Stack>
        <div className="sticky top-24 self-start">
          <Stack gap={3}>
            <CvPreview doc={doc} />
            <Card className="p-4">
              <Text weight="medium" className="mb-3">
                Exporter
              </Text>
              <ExportButtons doc={doc} />
            </Card>
          </Stack>
        </div>
      </div>

      <div className="lg:hidden">
        {panel === "edit" ? <CvForm doc={doc} onChange={update} /> : null}
        {panel === "preview" ? <CvPreview doc={doc} /> : null}
        {panel === "themes" ? (
          <Card className="p-4">
            <ThemePicker
              value={doc.themeId}
              onChange={(themeId) => update({ ...doc, themeId })}
            />
          </Card>
        ) : null}
        {panel === "export" ? (
          <Card className="p-4">
            <ExportButtons doc={doc} />
          </Card>
        ) : null}
      </div>
    </Stack>
  );
}

function ExportButtons({ doc }: { doc: CvDocument }) {
  return (
    <Stack gap={2}>
      <Button type="button" onClick={() => exportCvPdf(doc)}>
        <Download className="h-4 w-4" />
        Exporter en PDF
      </Button>
      <Button type="button" variant="outline" onClick={() => exportCvMarkdown(doc)}>
        <FileText className="h-4 w-4" />
        Télécharger Markdown
      </Button>
      <Button type="button" variant="outline" onClick={() => exportCvJson(doc)}>
        <FileText className="h-4 w-4" />
        Télécharger JSON (backup)
      </Button>
      <Text size="sm" tone="muted">
        Le PDF s’ouvre via l’impression du navigateur — choisissez « Enregistrer
        au format PDF ».
      </Text>
    </Stack>
  );
}
