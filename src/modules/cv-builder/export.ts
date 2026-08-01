import type { CvDocument, CvExperience } from "@/modules/cv-builder/types";
import { getTheme } from "@/modules/cv-builder/themes";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatPeriod(
  start: string,
  end: string,
  current: boolean,
): string {
  const a = start || "—";
  const b = current || !end ? "Présent" : end;
  return `${a} — ${b}`;
}

function contactLine(doc: CvDocument): string {
  const { profile } = doc;
  const parts = [
    profile.email,
    profile.phone,
    profile.location,
    profile.website,
    profile.github,
    profile.linkedin,
  ].filter(Boolean);
  return parts.map(esc).join(" · ");
}

function experienceBlock(exp: CvExperience): string {
  const highlights = exp.highlights
    .filter(Boolean)
    .map((h) => `<li>${esc(h)}</li>`)
    .join("");
  const tech =
    exp.techStack.filter(Boolean).length > 0
      ? `<p class="tech">${exp.techStack.map(esc).join(" · ")}</p>`
      : "";

  return `
    <article class="block">
      <div class="block-head">
        <div>
          <h3>${esc(exp.role)}</h3>
          <p class="sub">${esc(exp.company)}${exp.location ? ` · ${esc(exp.location)}` : ""}</p>
        </div>
        <span class="dates">${esc(formatPeriod(exp.startDate, exp.endDate, exp.current))}</span>
      </div>
      ${highlights ? `<ul>${highlights}</ul>` : ""}
      ${tech}
    </article>
  `;
}

export function buildCvHtml(doc: CvDocument): string {
  const theme = getTheme(doc.themeId);
  const isTech = doc.themeId === "tech";
  const isModern = doc.themeId === "modern";
  const isClassic = doc.themeId === "classic";

  const skillsHtml = doc.skillGroups
    .filter((g) => g.skills.some((s) => s.name.trim()))
    .map(
      (g) => `
      <div class="skill-group">
        <h4>${esc(g.label)}</h4>
        <p>${g.skills
          .filter((s) => s.name.trim())
          .map((s) => esc(s.name))
          .join(" · ")}</p>
      </div>
    `,
    )
    .join("");

  const experiencesHtml = doc.experiences
    .filter((e) => e.company.trim() || e.role.trim())
    .map(experienceBlock)
    .join("");

  const projectsHtml = doc.projects
    .filter((p) => p.name.trim())
    .map(
      (p) => `
      <article class="block">
        <div class="block-head">
          <div>
            <h3>${p.url ? `<a href="${esc(p.url)}">${esc(p.name)}</a>` : esc(p.name)}</h3>
            <p class="sub">${esc(p.description)}</p>
          </div>
        </div>
        ${
          p.highlights.filter(Boolean).length
            ? `<ul>${p.highlights.filter(Boolean).map((h) => `<li>${esc(h)}</li>`).join("")}</ul>`
            : ""
        }
        ${
          p.techStack.filter(Boolean).length
            ? `<p class="tech">${p.techStack.map(esc).join(" · ")}</p>`
            : ""
        }
      </article>
    `,
    )
    .join("");

  const educationHtml = doc.education
    .filter((e) => e.school.trim())
    .map(
      (e) => `
      <article class="block">
        <div class="block-head">
          <div>
            <h3>${esc(e.degree)}${e.field ? ` — ${esc(e.field)}` : ""}</h3>
            <p class="sub">${esc(e.school)}</p>
          </div>
          <span class="dates">${esc(formatPeriod(e.startDate, e.endDate, false))}</span>
        </div>
      </article>
    `,
    )
    .join("");

  const certsHtml = doc.certifications
    .filter((c) => c.name.trim())
    .map(
      (c) =>
        `<li><strong>${esc(c.name)}</strong> — ${esc(c.issuer)} (${esc(c.date)})</li>`,
    )
    .join("");

  const langsHtml = doc.languages
    .filter((l) => l.name.trim())
    .map((l) => `<li>${esc(l.name)} — ${esc(l.level)}</li>`)
    .join("");

  const ossHtml = doc.openSource
    .filter((o) => o.name.trim())
    .map(
      (o) =>
        `<li>${o.url ? `<a href="${esc(o.url)}">${esc(o.name)}</a>` : esc(o.name)}${o.stars ? ` (${esc(o.stars)}★)` : ""} — ${esc(o.description)}</li>`,
    )
    .join("");

  const sidebarBg = isTech ? "#020617" : isModern ? theme.preview.accent : isClassic ? "#f5f0e6" : "#f9fafb";
  const accent = theme.preview.accent;
  const text = theme.preview.text;
  const muted = theme.preview.muted;
  const bg = theme.preview.bg;
  const font = theme.preview.font;
  const headingFont = isClassic ? "Georgia, serif" : font;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${esc(doc.profile.fullName || doc.title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: ${font}; color: ${text}; background: ${bg}; line-height: 1.45; font-size: 11pt; }
    .page { max-width: 210mm; margin: 0 auto; min-height: 297mm; }
    .layout { display: grid; grid-template-columns: ${isModern || isTech ? "72mm 1fr" : "1fr"}; min-height: 297mm; }
    .sidebar { background: ${sidebarBg}; color: ${isTech || isModern ? "#f8fafc" : text}; padding: 14mm 10mm; }
    .main { padding: 14mm 12mm; }
    h1 { font-family: ${headingFont}; font-size: 20pt; line-height: 1.1; margin-bottom: 4px; }
    h2 { font-family: ${headingFont}; font-size: 11pt; text-transform: uppercase; letter-spacing: 0.08em; color: ${accent}; margin: 14px 0 8px; border-bottom: 1px solid ${isTech ? "#334155" : "#e5e7eb"}; padding-bottom: 4px; }
    h3 { font-size: 11pt; margin-bottom: 2px; }
    h4 { font-size: 9pt; text-transform: uppercase; letter-spacing: 0.06em; color: ${muted}; margin-bottom: 4px; }
    .headline { color: ${muted}; font-size: 11pt; margin-bottom: 10px; }
    .contact { font-size: 9pt; line-height: 1.6; opacity: 0.9; }
    .summary { font-size: 10pt; margin-top: 8px; }
    .block { margin-bottom: 10px; }
    .block-head { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 4px; }
    .sub { color: ${muted}; font-size: 9.5pt; }
    .dates { font-size: 9pt; color: ${muted}; white-space: nowrap; }
    ul { margin: 4px 0 0 16px; font-size: 9.5pt; }
    li { margin-bottom: 2px; }
    .tech { font-size: 8.5pt; color: ${accent}; margin-top: 4px; font-family: ui-monospace, monospace; }
    a { color: inherit; text-decoration: none; }
    .skill-group { margin-bottom: 8px; }
    .skill-group p { font-size: 9.5pt; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { max-width: none; margin: 0; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="layout">
      ${
        isModern || isTech
          ? `
      <aside class="sidebar">
        <h1>${esc(doc.profile.fullName || "Votre nom")}</h1>
        <p class="headline">${esc(doc.profile.headline)}</p>
        <div class="contact">${contactLine(doc)}</div>
        ${doc.profile.summary ? `<p class="summary">${esc(doc.profile.summary)}</p>` : ""}
        ${skillsHtml ? `<h2>Compétences</h2>${skillsHtml}` : ""}
        ${langsHtml ? `<h2>Langues</h2><ul>${langsHtml}</ul>` : ""}
      </aside>
      <main class="main">
        ${experiencesHtml ? `<h2>Expérience</h2>${experiencesHtml}` : ""}
        ${projectsHtml ? `<h2>Projets</h2>${projectsHtml}` : ""}
        ${educationHtml ? `<h2>Formation</h2>${educationHtml}` : ""}
        ${certsHtml ? `<h2>Certifications</h2><ul>${certsHtml}</ul>` : ""}
        ${ossHtml ? `<h2>Open Source</h2><ul>${ossHtml}</ul>` : ""}
      </main>`
          : `
      <main class="main" style="grid-column: 1 / -1;">
        <header style="margin-bottom: 12px; border-bottom: 2px solid ${accent}; padding-bottom: 10px;">
          <h1>${esc(doc.profile.fullName || "Votre nom")}</h1>
          <p class="headline">${esc(doc.profile.headline)}</p>
          <div class="contact">${contactLine(doc)}</div>
          ${doc.profile.summary ? `<p class="summary">${esc(doc.profile.summary)}</p>` : ""}
        </header>
        ${skillsHtml ? `<h2>Compétences</h2>${skillsHtml}` : ""}
        ${experiencesHtml ? `<h2>Expérience</h2>${experiencesHtml}` : ""}
        ${projectsHtml ? `<h2>Projets</h2>${projectsHtml}` : ""}
        ${educationHtml ? `<h2>Formation</h2>${educationHtml}` : ""}
        ${certsHtml ? `<h2>Certifications</h2><ul>${certsHtml}</ul>` : ""}
        ${langsHtml ? `<h2>Langues</h2><ul>${langsHtml}</ul>` : ""}
        ${ossHtml ? `<h2>Open Source</h2><ul>${ossHtml}</ul>` : ""}
      </main>`
      }
    </div>
  </div>
</body>
</html>`;
}

export function exportCvPdf(doc: CvDocument): void {
  const html = buildCvHtml(doc);
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.onload = () => {
    win.print();
  };
}

export function exportCvJson(doc: CvDocument): void {
  const blob = new Blob([JSON.stringify(doc, null, 2)], {
    type: "application/json",
  });
  downloadBlob(blob, `${slugify(doc.profile.fullName || doc.title)}.json`);
}

export function exportCvMarkdown(doc: CvDocument): void {
  const lines: string[] = [];
  const p = doc.profile;

  lines.push(`# ${p.fullName || doc.title}`);
  lines.push(`**${p.headline}**`);
  lines.push("");
  const contact = [p.email, p.phone, p.location, p.website, p.github, p.linkedin]
    .filter(Boolean)
    .join(" · ");
  if (contact) lines.push(contact);
  if (p.summary) {
    lines.push("");
    lines.push(p.summary);
  }

  if (doc.skillGroups.some((g) => g.skills.length)) {
    lines.push("", "## Compétences");
    for (const g of doc.skillGroups) {
      if (!g.skills.some((s) => s.name.trim())) continue;
      lines.push(
        `- **${g.label}:** ${g.skills.map((s) => s.name).filter(Boolean).join(", ")}`,
      );
    }
  }

  if (doc.experiences.some((e) => e.role || e.company)) {
    lines.push("", "## Expérience");
    for (const e of doc.experiences) {
      if (!e.role && !e.company) continue;
      lines.push(
        `### ${e.role} — ${e.company}`,
        `*${formatPeriod(e.startDate, e.endDate, e.current)}*`,
      );
      for (const h of e.highlights.filter(Boolean)) lines.push(`- ${h}`);
      if (e.techStack.filter(Boolean).length) {
        lines.push(`- Stack: ${e.techStack.join(", ")}`);
      }
      lines.push("");
    }
  }

  if (doc.projects.some((p) => p.name.trim())) {
    lines.push("## Projets");
    for (const proj of doc.projects) {
      if (!proj.name.trim()) continue;
      lines.push(`### ${proj.name}`);
      if (proj.description) lines.push(proj.description);
      for (const h of proj.highlights.filter(Boolean)) lines.push(`- ${h}`);
      if (proj.techStack.filter(Boolean).length) {
        lines.push(`- Stack: ${proj.techStack.join(", ")}`);
      }
      lines.push("");
    }
  }

  const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
  downloadBlob(blob, `${slugify(p.fullName || doc.title)}.md`);
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "cv"
  );
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
