"use client";

import { useCallback, useState } from "react";
import {
  Download,
  Eye,
  FileText,
  Loader2,
  Palette,
  Save,
} from "lucide-react";
import {
  Button,
  Card,
  Cluster,
  Stack,
  Text,
  useAsyncAction,
  useToast,
} from "@/design-system";
import {
  createCvDocument,
  deleteCvDocument,
  duplicateCvDocument,
  loadCvDocument,
  saveCvDocument,
} from "@/modules/cv-builder/actions";
import { defaultCvDocument } from "@/modules/cv-builder/defaults";
import {
  exportCvJson,
  exportCvMarkdown,
  exportCvPdf,
} from "@/modules/cv-builder/export";
import type { CvDocument, CvDocumentSummary } from "@/modules/cv-builder/types";
import {
  CvDocumentPicker,
  cvSummaryFromDoc,
} from "@/modules/cv-builder/ui/cv-document-picker";
import {
  CvForm,
  CvFormTabs,
  type CvFormSection,
} from "@/modules/cv-builder/ui/cv-form";
import { CvPreview } from "@/modules/cv-builder/ui/cv-preview";
import { JobTailorCard } from "@/modules/cv-builder/ui/job-tailor-card";
import { CvReadinessCard } from "@/modules/cv-builder/ui/cv-readiness-card";
import { TailorRecommendationsPanel } from "@/modules/cv-builder/ui/tailor-recommendations";
import { ThemePicker } from "@/modules/cv-builder/ui/theme-picker";
import { cn } from "@/lib/utils";

type WorkspacePanel = "edit" | "preview" | "themes" | "export";

export function CvBuilderWorkspace({
  initialDoc,
  initialDocuments,
}: {
  initialDoc: CvDocument;
  initialDocuments: CvDocumentSummary[];
}) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [doc, setDoc] = useState<CvDocument>(initialDoc);
  const [formSection, setFormSection] = useState<CvFormSection>("profile");
  const [panel, setPanel] = useState<WorkspacePanel>("edit");
  const [saved, setSaved] = useState(Boolean(initialDoc.id));
  const { run, pending } = useAsyncAction();

  const update = useCallback((next: CvDocument) => {
    setDoc(next);
    setSaved(false);
  }, []);

  function upsertSummary(savedDoc: CvDocument) {
    const summary = cvSummaryFromDoc(savedDoc);
    if (!summary) return;
    setDocuments((prev) => {
      const idx = prev.findIndex((d) => d.id === summary.id);
      if (idx === -1) return [summary, ...prev];
      const next = [...prev];
      next[idx] = { ...summary, updatedAt: new Date().toISOString() };
      return next.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    });
  }

  function handleSave() {
    void run(() => saveCvDocument(doc), {
      success: "CV sauvegardé",
      error: "Impossible de sauvegarder le CV",
      onSuccess: (savedDoc) => {
        setDoc(savedDoc);
        setSaved(true);
        upsertSummary(savedDoc);
      },
    });
  }

  function handleSelect(id: string) {
    if (id === doc.id) return;
    void run(() => loadCvDocument(id), {
      error: "Impossible de charger le CV",
      onSuccess: (loaded) => {
        setDoc(loaded);
        setSaved(true);
        setFormSection("profile");
      },
    });
  }

  function handleCreate() {
    void run(() => createCvDocument(), {
      success: "Nouveau CV créé",
      error: "Impossible de créer le CV",
      onSuccess: (created) => {
        setDoc(created);
        setSaved(true);
        upsertSummary(created);
        setFormSection("profile");
      },
    });
  }

  function handleDuplicate(id: string) {
    void run(() => duplicateCvDocument(id), {
      success: "CV dupliqué",
      error: "Impossible de dupliquer",
      onSuccess: (copy) => {
        setDoc(copy);
        setSaved(true);
        upsertSummary(copy);
      },
    });
  }

  function handleDelete(id: string) {
    void run(() => deleteCvDocument(id), {
      success: "CV supprimé",
      error: "Impossible de supprimer",
      onSuccess: () => {
        setDocuments((prev) => {
          const next = prev.filter((d) => d.id !== id);
          if (doc.id !== id) return next;
          if (next.length === 0) {
            const fresh = defaultCvDocument();
            setDoc(fresh);
            setSaved(false);
            return next;
          }
          void handleSelect(next[0].id);
          return next;
        });
      },
    });
  }

  function handleTailored(tailored: CvDocument) {
    setDoc(tailored);
    setSaved(true);
    upsertSummary(tailored);
    setFormSection("profile");
  }

  const mobileTabs: Array<{
    id: WorkspacePanel;
    label: string;
    icon: typeof Eye;
  }> = [
    { id: "edit", label: "Éditer", icon: FileText },
    { id: "preview", label: "Aperçu", icon: Eye },
    { id: "themes", label: "Thèmes", icon: Palette },
    { id: "export", label: "Export", icon: Download },
  ];

  return (
    <Stack gap={4} className="pb-8">
      <Cluster gap={2} className="flex-wrap justify-between">
        <Text size="sm" tone="muted">
          {saved ? "Sauvegardé" : "Modifications non sauvegardées"}
          {doc.isTailored && doc.targetJobTitle
            ? ` · Adapté pour ${doc.targetJobTitle}`
            : null}
        </Text>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={handleSave}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {pending ? "Sauvegarde…" : "Sauvegarder"}
        </Button>
      </Cluster>

      <div className="flex gap-1 overflow-x-auto pb-0.5 lg:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {mobileTabs.map((tab) => {
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

      <div className="hidden gap-6 lg:grid lg:grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)]">
        <Stack gap={3}>
          <CvDocumentPicker
            documents={documents}
            activeId={doc.id}
            onSelect={handleSelect}
            onCreate={handleCreate}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            disabled={pending}
          />
          <CvReadinessCard doc={doc} onJump={setFormSection} />
          <JobTailorCard sourceDoc={doc} onTailored={handleTailored} />
        </Stack>
        <Stack gap={3}>
          <CvFormTabs active={formSection} onChange={setFormSection} />
          <CvForm doc={doc} onChange={update} section={formSection} />
        </Stack>
        <div className="sticky top-24 self-start">
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
            <CvPreview doc={doc} />
            {doc.tailorRecommendations && doc.tailorRecommendations.length > 0 ? (
              <TailorRecommendationsPanel recommendations={doc.tailorRecommendations} />
            ) : null}
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
        {panel === "edit" ? (
          <Stack gap={3}>
            <CvDocumentPicker
              documents={documents}
              activeId={doc.id}
              onSelect={handleSelect}
              onCreate={handleCreate}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              disabled={pending}
            />
            <CvReadinessCard doc={doc} onJump={setFormSection} />
            <JobTailorCard sourceDoc={doc} onTailored={handleTailored} />
            <CvFormTabs active={formSection} onChange={setFormSection} />
            <CvForm doc={doc} onChange={update} section={formSection} />
          </Stack>
        ) : null}
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
  const toast = useToast();

  return (
    <Stack gap={2}>
      <Button
        type="button"
        onClick={() => {
          exportCvPdf(doc);
          toast.info("Fenêtre d'impression ouverte pour exporter en PDF");
        }}
      >
        <Download className="h-4 w-4" />
        Exporter en PDF
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          exportCvMarkdown(doc);
          toast.success("Markdown téléchargé");
        }}
      >
        <FileText className="h-4 w-4" />
        Télécharger Markdown
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          exportCvJson(doc);
          toast.success("Sauvegarde JSON téléchargée");
        }}
      >
        <FileText className="h-4 w-4" />
        Télécharger JSON
      </Button>
      <Text size="sm" tone="muted">
        Le PDF utilise l’impression du navigateur. Choisissez « Enregistrer au
        format PDF ».
      </Text>
    </Stack>
  );
}
