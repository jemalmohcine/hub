"use client";

import { Plus, Trash2 } from "lucide-react";
import {
  Button,
  Card,
  Field,
  Heading,
  Input,
  Stack,
  Text,
  Textarea,
} from "@/design-system";
import { createId } from "@/modules/cv-builder/defaults";
import type {
  CvDocument,
  CvEducation,
  CvExperience,
  CvProject,
  CvSkillGroup,
} from "@/modules/cv-builder/types";
import { cn } from "@/lib/utils";

export type CvFormSection =
  | "profile"
  | "skills"
  | "experience"
  | "projects"
  | "extra";

export const CV_FORM_TABS: Array<{
  id: CvFormSection;
  label: string;
  hint: string;
}> = [
  { id: "profile", label: "Profil", hint: "Identité et résumé" },
  { id: "skills", label: "Compétences", hint: "Stack technique" },
  { id: "experience", label: "Expérience", hint: "Postes et impact" },
  { id: "projects", label: "Projets", hint: "Réalisations clés" },
  { id: "extra", label: "Formation", hint: "Diplômes et plus" },
];

function SectionIntro({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4">
      <Heading level={4}>{title}</Heading>
      {description ? (
        <Text size="sm" tone="muted" className="mt-1">
          {description}
        </Text>
      ) : null}
    </div>
  );
}

function ListActions({
  onAdd,
  label,
}: {
  onAdd: () => void;
  label: string;
}) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onAdd}>
      <Plus className="h-4 w-4" />
      {label}
    </Button>
  );
}

export function CvFormTabs({
  active,
  onChange,
}: {
  active: CvFormSection;
  onChange: (section: CvFormSection) => void;
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {CV_FORM_TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex h-10 shrink-0 flex-col items-start justify-center rounded-2xl border px-3.5 text-left transition-colors",
              isActive
                ? "border-[var(--dh-brand)]/40 bg-[var(--dh-brand-soft)]/40"
                : "border-border/80 bg-card/60 hover:bg-muted/40",
            )}
          >
            <span className="text-sm font-medium leading-none">{tab.label}</span>
            <span className="mt-1 text-[10px] text-muted-foreground">
              {tab.hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function CvForm({
  doc,
  onChange,
  section,
}: {
  doc: CvDocument;
  onChange: (next: CvDocument) => void;
  section: CvFormSection;
}) {
  function patch<K extends keyof CvDocument>(key: K, value: CvDocument[K]) {
    onChange({ ...doc, [key]: value });
  }

  function patchProfile(field: keyof CvDocument["profile"], value: string) {
    onChange({ ...doc, profile: { ...doc.profile, [field]: value } });
  }

  if (section === "profile") {
    return (
      <Card className="p-4">
        <SectionIntro
          title="Profil"
          description="Ce que les recruteurs voient en premier : nom, titre clair et résumé orienté impact."
        />
        <Stack gap={3}>
          <Field label="Titre du document">
            <Input
              value={doc.title}
              onChange={(e) => patch("title", e.target.value)}
            />
          </Field>
          <Field label="Nom complet">
            <Input
              value={doc.profile.fullName}
              onChange={(e) => patchProfile("fullName", e.target.value)}
            />
          </Field>
          <Field label="Titre professionnel">
            <Input
              value={doc.profile.headline}
              onChange={(e) => patchProfile("headline", e.target.value)}
              placeholder="Développeur Full Stack · React et Node.js"
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Email">
              <Input
                type="email"
                value={doc.profile.email}
                onChange={(e) => patchProfile("email", e.target.value)}
              />
            </Field>
            <Field label="Téléphone">
              <Input
                value={doc.profile.phone}
                onChange={(e) => patchProfile("phone", e.target.value)}
              />
            </Field>
            <Field label="Localisation">
              <Input
                value={doc.profile.location}
                onChange={(e) => patchProfile("location", e.target.value)}
                placeholder="Paris · Remote"
              />
            </Field>
            <Field label="Portfolio">
              <Input
                value={doc.profile.website}
                onChange={(e) => patchProfile("website", e.target.value)}
                placeholder="https://"
              />
            </Field>
            <Field label="GitHub">
              <Input
                value={doc.profile.github}
                onChange={(e) => patchProfile("github", e.target.value)}
                placeholder="github.com/username"
              />
            </Field>
            <Field label="LinkedIn">
              <Input
                value={doc.profile.linkedin}
                onChange={(e) => patchProfile("linkedin", e.target.value)}
                placeholder="linkedin.com/in/username"
              />
            </Field>
          </div>
          <Field label="Résumé professionnel">
            <Textarea
              rows={5}
              value={doc.profile.summary}
              onChange={(e) => patchProfile("summary", e.target.value)}
              placeholder="2 à 4 phrases : années d'expérience, stack principale, type de produits livrés, impact mesurable."
            />
          </Field>
        </Stack>
      </Card>
    );
  }

  if (section === "skills") {
    return (
      <Card className="p-4">
        <SectionIntro
          title="Compétences techniques"
          description="Section scannée en quelques secondes. Regroupez par catégorie : langages, frameworks, cloud, outils."
        />
        <Stack gap={3}>
          {doc.skillGroups.map((group, gi) => (
            <Card key={group.id} className="border border-border/80 p-3">
              <div className="mb-3 flex items-center gap-2">
                <Input
                  value={group.label}
                  onChange={(e) => {
                    const skillGroups = [...doc.skillGroups];
                    skillGroups[gi] = { ...group, label: e.target.value };
                    patch("skillGroups", skillGroups);
                  }}
                  placeholder="Frontend · Backend · DevOps"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Supprimer la catégorie"
                  onClick={() =>
                    patch(
                      "skillGroups",
                      doc.skillGroups.filter((g) => g.id !== group.id),
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Stack gap={2}>
                {group.skills.map((skill, si) => (
                  <div key={skill.id} className="flex gap-2">
                    <Input
                      className="flex-1"
                      value={skill.name}
                      onChange={(e) => {
                        const skillGroups = [...doc.skillGroups];
                        const skills = [...group.skills];
                        skills[si] = { ...skill, name: e.target.value };
                        skillGroups[gi] = { ...group, skills };
                        patch("skillGroups", skillGroups);
                      }}
                      placeholder="TypeScript · React · AWS"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const skillGroups = [...doc.skillGroups];
                        skillGroups[gi] = {
                          ...group,
                          skills: group.skills.filter((s) => s.id !== skill.id),
                        };
                        patch("skillGroups", skillGroups);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const skillGroups = [...doc.skillGroups];
                    skillGroups[gi] = {
                      ...group,
                      skills: [...group.skills, { id: createId(), name: "" }],
                    };
                    patch("skillGroups", skillGroups);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Compétence
                </Button>
              </Stack>
            </Card>
          ))}
          <ListActions
            label="Catégorie"
            onAdd={() => {
              const next: CvSkillGroup = {
                id: createId(),
                label: "Nouvelle catégorie",
                skills: [{ id: createId(), name: "" }],
              };
              patch("skillGroups", [...doc.skillGroups, next]);
            }}
          />
        </Stack>
      </Card>
    );
  }

  if (section === "experience") {
    return (
      <Card className="p-4">
        <SectionIntro
          title="Expérience professionnelle"
          description="Ordre anti chronologique. Chaque poste : rôle, entreprise, dates, réalisations chiffrées et stack."
        />
        <Stack gap={3}>
          {doc.experiences.map((exp, ei) => (
            <ExperienceCard
              key={exp.id}
              exp={exp}
              onChange={(next) => {
                const experiences = [...doc.experiences];
                experiences[ei] = next;
                patch("experiences", experiences);
              }}
              onRemove={() =>
                patch(
                  "experiences",
                  doc.experiences.filter((e) => e.id !== exp.id),
                )
              }
            />
          ))}
          <ListActions
            label="Expérience"
            onAdd={() => {
              const next: CvExperience = {
                id: createId(),
                company: "",
                role: "",
                location: "",
                startDate: "",
                endDate: "",
                current: false,
                highlights: [""],
                techStack: [],
              };
              patch("experiences", [...doc.experiences, next]);
            }}
          />
        </Stack>
      </Card>
    );
  }

  if (section === "projects") {
    return (
      <Card className="p-4">
        <SectionIntro
          title="Projets"
          description="Projets perso, freelance ou open source qui prouvent votre niveau technique."
        />
        <Stack gap={3}>
          {doc.projects.map((proj, pi) => (
            <ProjectCard
              key={proj.id}
              proj={proj}
              onChange={(next) => {
                const projects = [...doc.projects];
                projects[pi] = next;
                patch("projects", projects);
              }}
              onRemove={() =>
                patch(
                  "projects",
                  doc.projects.filter((p) => p.id !== proj.id),
                )
              }
            />
          ))}
          <ListActions
            label="Projet"
            onAdd={() => {
              const next: CvProject = {
                id: createId(),
                name: "",
                url: "",
                description: "",
                highlights: [""],
                techStack: [],
              };
              patch("projects", [...doc.projects, next]);
            }}
          />
        </Stack>
      </Card>
    );
  }

  return (
    <Stack gap={3}>
      <Card className="p-4">
        <SectionIntro
          title="Formation"
          description="Diplômes et parcours académique, en second plan après l'expérience."
        />
        <Stack gap={3}>
          {doc.education.map((edu, ei) => (
            <Card key={edu.id} className="border border-border/80 p-3">
              <div className="mb-3 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    patch(
                      "education",
                      doc.education.filter((e) => e.id !== edu.id),
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Stack gap={2}>
                <Field label="École">
                  <Input
                    value={edu.school}
                    onChange={(e) => {
                      const education = [...doc.education];
                      education[ei] = { ...edu, school: e.target.value };
                      patch("education", education);
                    }}
                  />
                </Field>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Field label="Diplôme">
                    <Input
                      value={edu.degree}
                      onChange={(e) => {
                        const education = [...doc.education];
                        education[ei] = { ...edu, degree: e.target.value };
                        patch("education", education);
                      }}
                    />
                  </Field>
                  <Field label="Domaine">
                    <Input
                      value={edu.field ?? ""}
                      onChange={(e) => {
                        const education = [...doc.education];
                        education[ei] = { ...edu, field: e.target.value };
                        patch("education", education);
                      }}
                    />
                  </Field>
                </div>
              </Stack>
            </Card>
          ))}
          <ListActions
            label="Formation"
            onAdd={() => {
              const next: CvEducation = {
                id: createId(),
                school: "",
                degree: "",
                field: "",
                startDate: "",
                endDate: "",
                highlights: [],
              };
              patch("education", [...doc.education, next]);
            }}
          />
        </Stack>
      </Card>

      <Card className="p-4">
        <SectionIntro title="Certifications" />
        <Stack gap={2}>
          {doc.certifications.map((cert, ci) => (
            <div key={cert.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Input
                value={cert.name}
                placeholder="AWS Solutions Architect"
                onChange={(e) => {
                  const certifications = [...doc.certifications];
                  certifications[ci] = { ...cert, name: e.target.value };
                  patch("certifications", certifications);
                }}
              />
              <Input
                value={cert.issuer}
                placeholder="Émetteur"
                onChange={(e) => {
                  const certifications = [...doc.certifications];
                  certifications[ci] = { ...cert, issuer: e.target.value };
                  patch("certifications", certifications);
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  patch(
                    "certifications",
                    doc.certifications.filter((c) => c.id !== cert.id),
                  )
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <ListActions
            label="Certification"
            onAdd={() =>
              patch("certifications", [
                ...doc.certifications,
                { id: createId(), name: "", issuer: "", date: "", url: "" },
              ])
            }
          />
        </Stack>
      </Card>

      <Card className="p-4">
        <SectionIntro title="Langues" />
        <Stack gap={2}>
          {doc.languages.map((lang, li) => (
            <div key={lang.id} className="flex gap-2">
              <Input
                className="flex-1"
                value={lang.name}
                placeholder="Français"
                onChange={(e) => {
                  const languages = [...doc.languages];
                  languages[li] = { ...lang, name: e.target.value };
                  patch("languages", languages);
                }}
              />
              <Input
                className="flex-1"
                value={lang.level}
                placeholder="Courant C1"
                onChange={(e) => {
                  const languages = [...doc.languages];
                  languages[li] = { ...lang, level: e.target.value };
                  patch("languages", languages);
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  patch(
                    "languages",
                    doc.languages.filter((l) => l.id !== lang.id),
                  )
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <ListActions
            label="Langue"
            onAdd={() =>
              patch("languages", [
                ...doc.languages,
                { id: createId(), name: "", level: "" },
              ])
            }
          />
        </Stack>
      </Card>

      <Card className="p-4">
        <SectionIntro
          title="Open Source"
          description="Repos maintenus, contributions notables, projets GitHub avec impact."
        />
        <Stack gap={3}>
          {doc.openSource.map((oss, oi) => (
            <Card key={oss.id} className="border border-border/80 p-3">
              <Stack gap={2}>
                <div className="flex gap-2">
                  <Input
                    className="flex-1"
                    value={oss.name}
                    placeholder="nom du repo"
                    onChange={(e) => {
                      const openSource = [...doc.openSource];
                      openSource[oi] = { ...oss, name: e.target.value };
                      patch("openSource", openSource);
                    }}
                  />
                  <Input
                    className="w-24"
                    value={oss.stars ?? ""}
                    placeholder="★"
                    onChange={(e) => {
                      const openSource = [...doc.openSource];
                      openSource[oi] = { ...oss, stars: e.target.value };
                      patch("openSource", openSource);
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      patch(
                        "openSource",
                        doc.openSource.filter((o) => o.id !== oss.id),
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  value={oss.url ?? ""}
                  placeholder="https://github.com/..."
                  onChange={(e) => {
                    const openSource = [...doc.openSource];
                    openSource[oi] = { ...oss, url: e.target.value };
                    patch("openSource", openSource);
                  }}
                />
                <Textarea
                  rows={2}
                  value={oss.description}
                  onChange={(e) => {
                    const openSource = [...doc.openSource];
                    openSource[oi] = { ...oss, description: e.target.value };
                    patch("openSource", openSource);
                  }}
                />
              </Stack>
            </Card>
          ))}
          <ListActions
            label="Repo open source"
            onAdd={() =>
              patch("openSource", [
                ...doc.openSource,
                { id: createId(), name: "", description: "", url: "", stars: "" },
              ])
            }
          />
        </Stack>
      </Card>
    </Stack>
  );
}

function ExperienceCard({
  exp,
  onChange,
  onRemove,
}: {
  exp: CvExperience;
  onChange: (next: CvExperience) => void;
  onRemove: () => void;
}) {
  return (
    <Card className="border border-border/80 p-3">
      <div className="mb-3 flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <Stack gap={2}>
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="Poste">
            <Input
              value={exp.role}
              onChange={(e) => onChange({ ...exp, role: e.target.value })}
            />
          </Field>
          <Field label="Entreprise">
            <Input
              value={exp.company}
              onChange={(e) => onChange({ ...exp, company: e.target.value })}
            />
          </Field>
          <Field label="Début">
            <Input
              value={exp.startDate}
              onChange={(e) => onChange({ ...exp, startDate: e.target.value })}
              placeholder="2022-01"
            />
          </Field>
          <Field label="Fin">
            <Input
              value={exp.endDate}
              onChange={(e) => onChange({ ...exp, endDate: e.target.value })}
              placeholder="2024-06 ou vide si actuel"
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={exp.current}
            onChange={(e) => onChange({ ...exp, current: e.target.checked })}
          />
          Poste actuel
        </label>
        <Field label="Stack technique">
          <Input
            value={exp.techStack.join(", ")}
            onChange={(e) =>
              onChange({
                ...exp,
                techStack: e.target.value.split(",").map((s) => s.trim()),
              })
            }
            placeholder="TypeScript, React, PostgreSQL"
          />
        </Field>
        {exp.highlights.map((h, hi) => (
          <div key={hi} className="flex gap-2">
            <Input
              className="flex-1"
              value={h}
              placeholder="Impact mesurable : perf +40%, 10k utilisateurs, CI/CD"
              onChange={(e) => {
                const highlights = [...exp.highlights];
                highlights[hi] = e.target.value;
                onChange({ ...exp, highlights });
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                onChange({
                  ...exp,
                  highlights: exp.highlights.filter((_, i) => i !== hi),
                })
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange({ ...exp, highlights: [...exp.highlights, ""] })}
        >
          <Plus className="h-4 w-4" />
          Réalisation
        </Button>
      </Stack>
    </Card>
  );
}

function ProjectCard({
  proj,
  onChange,
  onRemove,
}: {
  proj: CvProject;
  onChange: (next: CvProject) => void;
  onRemove: () => void;
}) {
  return (
    <Card className="border border-border/80 p-3">
      <div className="mb-3 flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <Stack gap={2}>
        <Field label="Nom du projet">
          <Input
            value={proj.name}
            onChange={(e) => onChange({ ...proj, name: e.target.value })}
          />
        </Field>
        <Field label="URL">
          <Input
            value={proj.url ?? ""}
            onChange={(e) => onChange({ ...proj, url: e.target.value })}
          />
        </Field>
        <Field label="Description">
          <Textarea
            rows={2}
            value={proj.description}
            onChange={(e) => onChange({ ...proj, description: e.target.value })}
          />
        </Field>
        <Field label="Stack">
          <Input
            value={proj.techStack.join(", ")}
            onChange={(e) =>
              onChange({
                ...proj,
                techStack: e.target.value.split(",").map((s) => s.trim()),
              })
            }
          />
        </Field>
        {proj.highlights.map((h, hi) => (
          <div key={hi} className="flex gap-2">
            <Input
              className="flex-1"
              value={h}
              placeholder="Résultat ou fonctionnalité clé"
              onChange={(e) => {
                const highlights = [...proj.highlights];
                highlights[hi] = e.target.value;
                onChange({ ...proj, highlights });
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                onChange({
                  ...proj,
                  highlights: proj.highlights.filter((_, i) => i !== hi),
                })
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onChange({ ...proj, highlights: [...proj.highlights, ""] })
          }
        >
          <Plus className="h-4 w-4" />
          Point clé
        </Button>
      </Stack>
    </Card>
  );
}
