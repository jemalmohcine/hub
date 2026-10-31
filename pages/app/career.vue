<script setup lang="ts">
import type { CvDocument, CvDocumentSummary } from "~/shared/cv/types";
import { defaultCvDocument } from "~/shared/cv/defaults";
import type { JobApplication, JobApplicationInput } from "~/shared/job-tracker/types";
import { JOB_STATUS_LABELS } from "~/shared/job-tracker/types";
import { userFacingDataError } from "~/shared/lib/user-error";

const route = useRoute();
const tab = ref<"cv" | "candidatures">(
  route.query.tab === "jobs" ? "candidatures" : "cv",
);
watch(
  () => route.query.tab,
  (value) => {
    if (value === "jobs") tab.value = "candidatures";
    else if (value === "cv") tab.value = "cv";
  },
);
const client = useSupabaseClient();
const user = useSupabaseUser();

const { data, pending, error, refresh } = await useAsyncData(
  () => `profil-${user.value?.id ?? "anon"}`,
  async () => {
    const uid = user.value?.id;
    if (!uid) return null;

  const { data: cvRows, error: cvErr } = await client
    .from("cv_documents")
    .select("id, title, theme_id, updated_at, content")
    .eq("user_id", uid)
    .order("updated_at", { ascending: false });

  if (cvErr) throw new Error(userFacingDataError(cvErr));

  const documents: CvDocumentSummary[] = (cvRows ?? []).map((r) => ({
    id: r.id as string,
    title: r.title as string,
    themeId: r.theme_id as CvDocumentSummary["themeId"],
    updatedAt: r.updated_at as string,
  }));

  const first = cvRows?.[0];
  const doc: CvDocument = first
    ? ({
        ...(first.content as CvDocument),
        id: first.id as string,
        title: first.title as string,
        themeId: first.theme_id as CvDocument["themeId"],
      })
    : defaultCvDocument();

  const { data: jobsRows, error: jobsErr } = await client
    .from("job_applications")
    .select("*")
    .eq("user_id", uid)
    .order("updated_at", { ascending: false });

  if (jobsErr) throw new Error(userFacingDataError(jobsErr));

  const jobs: JobApplication[] = (jobsRows ?? []).map((row) => ({
    id: row.id as string,
    company: row.company as string,
    role: row.role as string,
    status: row.status as JobApplication["status"],
    jobUrl: row.job_url as string | null,
    notes: row.notes as string | null,
    cvDocumentId: row.cv_document_id as string | null,
    appliedAt: row.applied_at as string | null,
    followUpAt: row.follow_up_at as string | null,
    employmentCategory: row.employment_category as JobApplication["employmentCategory"],
    freelanceSubtype: row.freelance_subtype as JobApplication["freelanceSubtype"],
    listingId: row.listing_id as string | null,
    description: row.description as string | null,
    location: row.location as string | null,
    salaryHint: row.salary_hint as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));

  return { doc, documents, jobs };
  },
  { watch: [() => user.value?.id], server: false },
);

const cvForm = reactive(JSON.parse(JSON.stringify(data.value?.doc ?? defaultCvDocument())));

watch(
  () => data.value?.doc,
  (d) => {
    if (d) Object.assign(cvForm, JSON.parse(JSON.stringify(d)));
  },
);

async function saveCv() {
  const uid = user.value?.id;
  if (!uid) return;
  const payload = { ...cvForm };
  const id = payload.id;
  delete (payload as { id?: string }).id;
  if (id) {
    await client
      .from("cv_documents")
      .update({
        title: cvForm.title,
        theme_id: cvForm.themeId,
        content: cvForm,
      })
      .eq("id", id);
  } else {
    await client.from("cv_documents").insert({
      user_id: uid,
      title: cvForm.title,
      theme_id: cvForm.themeId,
      content: cvForm,
    });
  }
  await refresh();
}

function exportPdf() {
  const html = `<html><head><title>CV</title></head><body><pre>${cvForm.profile.fullName}\n${cvForm.profile.headline}\n\n${cvForm.profile.summary}</pre></body></html>`;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.print();
}

const jobForm = reactive<JobApplicationInput>({
  company: "",
  role: "",
  status: "to_apply",
});

async function addJob() {
  const uid = user.value?.id;
  if (!uid || !jobForm.company.trim() || !jobForm.role.trim()) return;
  await client.from("job_applications").insert({
    user_id: uid,
    company: jobForm.company.trim(),
    role: jobForm.role.trim(),
    status: jobForm.status,
    job_url: jobForm.jobUrl ?? null,
    notes: jobForm.notes ?? null,
  });
  jobForm.company = "";
  jobForm.role = "";
  await refresh();
}
</script>

<template>
  <div>
    <DsPageHeader
      title="Carrière"
      description="Rédigez votre CV et suivez vos candidatures au même endroit."
      :pending="pending && !data"
      :error="error?.message ?? null"
    />
    <div v-if="!error && data" class="flex flex-wrap gap-2">
      <DsButton
        :variant="tab === 'cv' ? 'primary' : 'secondary'"
        size="sm"
        @click="tab = 'cv'"
      >
        CV
      </DsButton>
      <DsButton
        :variant="tab === 'candidatures' ? 'primary' : 'secondary'"
        size="sm"
        @click="tab = 'candidatures'"
      >
        Candidatures
      </DsButton>
    </div>

    <div v-if="!error && tab === 'cv'" class="mt-6 grid gap-6 lg:grid-cols-2">
      <DsCard class="space-y-3 p-4">
        <h2 class="font-medium">Édition guidée</h2>
        <DsInput v-model="cvForm.title" placeholder="Titre du CV" />
        <DsInput v-model="cvForm.profile.fullName" placeholder="Nom complet" />
        <DsInput v-model="cvForm.profile.headline" placeholder="Accroche" />
        <DsTextarea v-model="cvForm.profile.summary" placeholder="Résumé" :rows="5" />
        <div class="flex gap-2">
          <DsButton @click="saveCv">Enregistrer</DsButton>
          <DsButton variant="secondary" @click="exportPdf">Export PDF</DsButton>
        </div>
      </DsCard>
      <DsCard class="p-4">
        <h2 class="mb-2 font-medium">Aperçu</h2>
        <p class="text-lg font-semibold">{{ cvForm.profile.fullName || "Nom" }}</p>
        <p class="text-sm text-muted-foreground">{{ cvForm.profile.headline }}</p>
        <p class="mt-3 text-sm">{{ cvForm.profile.summary }}</p>
      </DsCard>
    </div>

    <div v-else-if="!error" class="mt-6 space-y-4">
      <DsCard class="grid gap-2 p-4 sm:grid-cols-3">
        <DsInput v-model="jobForm.company" placeholder="Entreprise" />
        <DsInput v-model="jobForm.role" placeholder="Poste" />
        <DsButton @click="addJob">Ajouter</DsButton>
      </DsCard>
      <DsCard class="divide-y divide-border">
        <div
          v-for="job in data?.jobs ?? []"
          :key="job.id"
          class="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
        >
          <div>
            <p class="font-medium">{{ job.role }} · {{ job.company }}</p>
            <p class="text-xs text-muted-foreground">{{ JOB_STATUS_LABELS[job.status] }}</p>
          </div>
          <a v-if="job.jobUrl" :href="job.jobUrl" target="_blank" class="text-sm text-primary">Lien</a>
        </div>
        <DsEmptyState
          v-if="!(data?.jobs?.length)"
          class="border-0"
          title="Aucune candidature"
          description="Ajoutez une candidature dès que vous postulez."
        />
      </DsCard>
    </div>
  </div>
</template>
