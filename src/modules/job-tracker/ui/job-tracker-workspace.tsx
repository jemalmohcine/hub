"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  ExternalLink,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Cluster,
  Field,
  Input,
  Select,
  Stack,
  Text,
  Textarea,
  useAsyncAction,
} from "@/design-system";
import {
  createJobApplication,
  deleteJobApplication,
  updateJobApplication,
  updateJobStatus,
} from "@/modules/job-tracker/actions";
import {
  JOB_STATUS_LABELS,
  JOB_STATUS_ORDER,
  type JobApplication,
  type JobApplicationStatus,
} from "@/modules/job-tracker/types";
import {
  EMPLOYMENT_CATEGORY_LABELS,
  FREELANCE_SUBTYPE_LABELS,
} from "@/modules/job-board/types";
import type { CvDocumentSummary } from "@/modules/cv-builder/types";
import { cn } from "@/lib/utils";

const EMPTY_FORM = {
  company: "",
  role: "",
  status: "to_apply" as JobApplicationStatus,
  jobUrl: "",
  notes: "",
  cvDocumentId: "",
  appliedAt: "",
  followUpAt: "",
};

function employmentBadge(job: JobApplication) {
  if (job.employmentCategory === "salaried") {
    return EMPLOYMENT_CATEGORY_LABELS.salaried;
  }
  if (job.employmentCategory === "freelance") {
    if (job.freelanceSubtype === "part_time") {
      return FREELANCE_SUBTYPE_LABELS.part_time;
    }
    return FREELANCE_SUBTYPE_LABELS.full_time;
  }
  return null;
}

export function JobTrackerWorkspace({
  initialJobs,
  cvDocuments,
}: {
  initialJobs: JobApplication[];
  cvDocuments: CvDocumentSummary[];
}) {
  const [jobs, setJobs] = useState(initialJobs);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const { run, pending } = useAsyncAction();

  useEffect(() => {
    setJobs(initialJobs);
  }, [initialJobs]);

  const jobsByStatus = useMemo(() => {
    const map: Record<JobApplicationStatus, JobApplication[]> = {
      to_apply: [],
      applied: [],
      interview: [],
      offer: [],
      rejected: [],
    };
    for (const job of jobs) {
      map[job.status].push(job);
    }
    return map;
  }, [jobs]);

  function handleCreate() {
    void run(
      () =>
        createJobApplication({
          company: form.company,
          role: form.role,
          status: form.status,
          jobUrl: form.jobUrl || undefined,
          notes: form.notes || undefined,
          cvDocumentId: form.cvDocumentId || null,
          appliedAt: form.appliedAt || null,
          followUpAt: form.followUpAt || null,
        }),
      {
        success: "Candidature ajoutée",
        error: "Impossible d'ajouter la candidature",
        onSuccess: (created) => {
          setJobs((prev) => [created, ...prev]);
          setForm(EMPTY_FORM);
          setShowForm(false);
        },
      },
    );
  }

  function handleStatusChange(id: string, status: JobApplicationStatus) {
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, status, updatedAt: new Date().toISOString() } : j)),
    );
    void run(() => updateJobStatus(id, status), {
      error: "Impossible de mettre à jour le statut",
    });
  }

  function handleDelete(id: string) {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    void run(() => deleteJobApplication(id), {
      success: "Candidature supprimée",
      error: "Impossible de supprimer",
    });
  }

  function cvTitle(cvId: string | null) {
    if (!cvId) return null;
    return cvDocuments.find((d) => d.id === cvId)?.title ?? "CV lié";
  }

  return (
    <Stack gap={4} className="pb-8">
      <Cluster gap={2} className="justify-between">
        <Text size="sm" tone="muted">
          {jobs.length} candidature{jobs.length !== 1 ? "s" : ""} suivie
          {jobs.length !== 1 ? "s" : ""}
        </Text>
        <Button type="button" size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </Cluster>

      {showForm ? (
        <Card className="p-4">
          <Stack gap={3}>
            <Text weight="medium">Nouvelle candidature</Text>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Entreprise" htmlFor="job-company">
                <Input
                  id="job-company"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="Acme Corp"
                />
              </Field>
              <Field label="Poste" htmlFor="job-role">
                <Input
                  id="job-role"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="Développeur Full Stack"
                />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Statut" htmlFor="job-status">
                <Select
                  id="job-status"
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as JobApplicationStatus })
                  }
                >
                  {JOB_STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {JOB_STATUS_LABELS[s]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="CV associé" htmlFor="job-cv">
                <Select
                  id="job-cv"
                  value={form.cvDocumentId}
                  onChange={(e) => setForm({ ...form, cvDocumentId: e.target.value })}
                >
                  <option value="">Aucun</option>
                  {cvDocuments.map((cv) => (
                    <option key={cv.id} value={cv.id}>
                      {cv.title}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Lien de l'offre" htmlFor="job-url">
              <Input
                id="job-url"
                value={form.jobUrl}
                onChange={(e) => setForm({ ...form, jobUrl: e.target.value })}
                placeholder="https://…"
              />
            </Field>
            <Field label="Notes" htmlFor="job-notes">
              <Textarea
                id="job-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                placeholder="Contact recruteur, salaire visé, prochaine relance…"
              />
            </Field>
            <Cluster gap={2}>
              <Button
                type="button"
                disabled={pending || !form.company.trim() || !form.role.trim()}
                onClick={handleCreate}
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Enregistrer
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setForm(EMPTY_FORM);
                }}
              >
                Annuler
              </Button>
            </Cluster>
          </Stack>
        </Card>
      ) : null}

      <div className="-mx-[var(--dh-space-4)] flex gap-3 overflow-x-auto px-[var(--dh-space-4)] pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0 lg:pb-0 lg:snap-none [&::-webkit-scrollbar]:hidden">
        {JOB_STATUS_ORDER.map((status) => (
          <div
            key={status}
            className="w-[min(82vw,18rem)] shrink-0 snap-start lg:w-auto lg:shrink"
          >
            <Cluster gap={2} className="mb-2">
              <Text size="sm" weight="medium">
                {JOB_STATUS_LABELS[status]}
              </Text>
              <Badge tone="neutral">{jobsByStatus[status].length}</Badge>
            </Cluster>
            <Stack gap={2}>
              {jobsByStatus[status].map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  cvTitle={cvTitle(job.cvDocumentId)}
                  disabled={pending}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                  onNotesSave={(notes) => {
                    setJobs((prev) =>
                      prev.map((j) => (j.id === job.id ? { ...j, notes } : j)),
                    );
                    void run(() => updateJobApplication(job.id, { notes }), {
                      error: "Impossible de sauvegarder les notes",
                    });
                  }}
                />
              ))}
              {jobsByStatus[status].length === 0 ? (
                <Card className="border-dashed p-3">
                  <Text size="sm" tone="muted" className="text-center">
                    Vide
                  </Text>
                </Card>
              ) : null}
            </Stack>
          </div>
        ))}
      </div>
    </Stack>
  );
}

function JobCard({
  job,
  cvTitle,
  disabled,
  onStatusChange,
  onDelete,
  onNotesSave,
}: {
  job: JobApplication;
  cvTitle: string | null;
  disabled: boolean;
  onStatusChange: (id: string, status: JobApplicationStatus) => void;
  onDelete: (id: string) => void;
  onNotesSave: (notes: string) => void;
}) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(job.notes ?? "");

  return (
    <Card className="p-3">
      <Stack gap={2}>
        <div>
          <Text size="sm" weight="medium" className="leading-snug">
            {job.role}
          </Text>
          <Cluster gap={1}>
            <Briefcase className="h-3 w-3 text-muted-foreground" />
            <Text size="sm" tone="muted">
              {job.company}
            </Text>
          </Cluster>
        </div>

        {cvTitle ? (
          <Badge tone="info" className="w-fit text-[10px]">
            {cvTitle}
          </Badge>
        ) : null}

        {employmentBadge(job) ? (
          <Badge tone="neutral" className="w-fit text-[10px]">
            {employmentBadge(job)}
          </Badge>
        ) : null}

        {job.location ? (
          <Text size="sm" tone="muted" className="text-xs">
            {job.location}
          </Text>
        ) : null}

        {job.jobUrl ? (
          <a
            href={job.jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Voir l&apos;offre
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}

        {editingNotes ? (
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="text-xs"
          />
        ) : job.notes ? (
          <Text size="sm" tone="muted" className="text-xs">
            {job.notes}
          </Text>
        ) : null}

        <Select
          value={job.status}
          disabled={disabled}
          onChange={(e) => onStatusChange(job.id, e.target.value as JobApplicationStatus)}
          className="h-8 text-xs"
        >
          {JOB_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {JOB_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>

        <Cluster gap={1}>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => {
              if (editingNotes) onNotesSave(notes);
              setEditingNotes((v) => !v);
            }}
          >
            {editingNotes ? "OK notes" : "Notes"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={cn("h-7 text-xs text-destructive")}
            disabled={disabled}
            onClick={() => onDelete(job.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </Cluster>
      </Stack>
    </Card>
  );
}
