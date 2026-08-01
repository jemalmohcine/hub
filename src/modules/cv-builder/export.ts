import type { CvDocument, CvExperience } from "@/modules/cv-builder/types";
import { getTheme } from "@/modules/cv-builder/themes";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Recruiter friendly date: "2022" or "Jan 2024 à Présent" */
function formatPeriod(start: string, end: string, current: boolean): string {
  const a = formatDateLabel(start) || "…";
  const b = current || !end ? "Présent" : formatDateLabel(end);
  return `${a} à ${b}`;
}

function formatDateLabel(raw: string): string {
  if (!raw) return "";
  if (/^\d{4}$/.test(raw)) return raw;
  if (/^\d{4}-\d{2}$/.test(raw)) {
    const [y, m] = raw.split("-");
    const months = [
      "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
      "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc",
    ];
    return `${months[Number(m) - 1] ?? m} ${y}`;
  }
  return raw;
}

function joinParts(parts: string[], sep = " · "): string {
  return parts.filter(Boolean).map(esc).join(sep);
}

function contactItems(doc: CvDocument): string[] {
  const { profile } = doc;
  return [
    profile.email,
    profile.phone,
    profile.location,
    profile.website,
    profile.github,
    profile.linkedin,
  ].filter(Boolean);
}

function skillGroupsHtml(doc: CvDocument): string {
  return doc.skillGroups
    .filter((g) => g.skills.some((s) => s.name.trim()))
    .map(
      (g) => `
      <div class="skill-group">
        <h4>${esc(g.label)}</h4>
        <div class="chips">${g.skills
          .filter((s) => s.name.trim())
          .map((s) => `<span class="chip">${esc(s.name)}</span>`)
          .join("")}</div>
      </div>`,
    )
    .join("");
}

function experienceBlock(exp: CvExperience): string {
  const highlights = exp.highlights
    .filter(Boolean)
    .map((h) => `<li>${esc(h)}</li>`)
    .join("");
  const tech =
    exp.techStack.filter(Boolean).length > 0
      ? `<div class="tech-row">${exp.techStack.map((t) => `<span class="chip chip-sm">${esc(t)}</span>`).join("")}</div>`
      : "";

  return `
    <article class="block">
      <div class="block-head">
        <div>
          <h3>${esc(exp.role)}</h3>
          <p class="sub">${joinParts([exp.company, exp.location ?? ""])}</p>
        </div>
        <span class="dates">${esc(formatPeriod(exp.startDate, exp.endDate, exp.current))}</span>
      </div>
      ${highlights ? `<ul>${highlights}</ul>` : ""}
      ${tech}
    </article>`;
}

function section(title: string, body: string): string {
  if (!body.trim()) return "";
  return `<section class="cv-section"><h2>${esc(title)}</h2>${body}</section>`;
}

export function buildCvHtml(doc: CvDocument): string {
  const theme = getTheme(doc.themeId);
  const c = theme.colors;
  const sidebar = theme.layout === "sidebar";

  const experiencesHtml = doc.experiences
    .filter((e) => e.company.trim() || e.role.trim())
    .map((e) => experienceBlock(e))
    .join("");

  const projectsHtml = doc.projects
    .filter((p) => p.name.trim())
    .map(
      (p) => `
      <article class="block">
        <div class="block-head">
          <div>
            <h3>${p.url ? `<a href="${esc(p.url)}">${esc(p.name)}</a>` : esc(p.name)}</h3>
            ${p.description ? `<p class="sub">${esc(p.description)}</p>` : ""}
          </div>
        </div>
        ${
          p.highlights.filter(Boolean).length
            ? `<ul>${p.highlights.filter(Boolean).map((h) => `<li>${esc(h)}</li>`).join("")}</ul>`
            : ""
        }
        ${
          p.techStack.filter(Boolean).length
            ? `<div class="tech-row">${p.techStack.map((t) => `<span class="chip chip-sm">${esc(t)}</span>`).join("")}</div>`
            : ""
        }
      </article>`,
    )
    .join("");

  const educationHtml = doc.education
    .filter((e) => e.school.trim())
    .map(
      (e) => `
      <article class="block">
        <div class="block-head">
          <div>
            <h3>${esc(e.degree)}${e.field ? `<span class="muted-inline">, ${esc(e.field)}</span>` : ""}</h3>
            <p class="sub">${esc(e.school)}</p>
          </div>
          <span class="dates">${esc(formatPeriod(e.startDate, e.endDate, false))}</span>
        </div>
      </article>`,
    )
    .join("");

  const certsHtml = doc.certifications
    .filter((cert) => cert.name.trim())
    .map(
      (cert) =>
        `<li><strong>${esc(cert.name)}</strong> · ${esc(cert.issuer)}${cert.date ? ` (${esc(cert.date)})` : ""}</li>`,
    )
    .join("");

  const langsHtml = doc.languages
    .filter((l) => l.name.trim())
    .map((l) => `<li><strong>${esc(l.name)}</strong> · ${esc(l.level)}</li>`)
    .join("");

  const ossHtml = doc.openSource
    .filter((o) => o.name.trim())
    .map(
      (o) =>
        `<li>${o.url ? `<a href="${esc(o.url)}">${esc(o.name)}</a>` : esc(o.name)}${o.stars ? ` <span class="stars">${esc(o.stars)} ★</span>` : ""}${o.description ? ` · ${esc(o.description)}` : ""}</li>`,
    )
    .join("");

  const summaryBlock = doc.profile.summary
    ? section("Profil", `<p class="summary-body">${esc(doc.profile.summary)}</p>`)
    : "";

  const mainSections = [
    summaryBlock,
    section("Expérience", experiencesHtml),
    section("Projets", projectsHtml),
    section("Open Source", ossHtml ? `<ul>${ossHtml}</ul>` : ""),
    section("Formation", educationHtml),
    section("Certifications", certsHtml ? `<ul>${certsHtml}</ul>` : ""),
  ].join("");

  const sidebarContent = `
    <h1>${esc(doc.profile.fullName || "Votre nom")}</h1>
    <p class="headline">${esc(doc.profile.headline)}</p>
    <div class="contact">${contactItems(doc).map((item) => `<div>${esc(item)}</div>`).join("")}</div>
    ${skillGroupsHtml(doc) ? section("Compétences", skillGroupsHtml(doc)) : ""}
    ${langsHtml ? section("Langues", `<ul class="plain">${langsHtml}</ul>`) : ""}
  `;

  const singleColumnContent = `
    <header class="hero">
      <h1>${esc(doc.profile.fullName || "Votre nom")}</h1>
      <p class="headline">${esc(doc.profile.headline)}</p>
      <div class="contact-line">${joinParts(contactItems(doc))}</div>
    </header>
    ${summaryBlock}
    ${skillGroupsHtml(doc) ? section("Compétences techniques", skillGroupsHtml(doc)) : ""}
    ${section("Expérience professionnelle", experiencesHtml)}
    ${section("Projets", projectsHtml)}
    ${section("Open Source", ossHtml ? `<ul>${ossHtml}</ul>` : "")}
    ${section("Formation", educationHtml)}
    ${section("Certifications", certsHtml ? `<ul>${certsHtml}</ul>` : "")}
    ${section("Langues", langsHtml ? `<ul class="plain">${langsHtml}</ul>` : "")}
  `;

  const isDark = doc.themeId === "tech";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${esc(doc.profile.fullName || doc.title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="${theme.fonts.google}" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ${theme.fonts.body};
      color: ${c.text};
      background: ${c.bg};
      line-height: 1.5;
      font-size: 10.5pt;
      -webkit-font-smoothing: antialiased;
    }
    .page { max-width: 210mm; margin: 0 auto; min-height: 297mm; background: ${c.surface}; }
    .layout {
      display: grid;
      grid-template-columns: ${sidebar ? "68mm 1fr" : "1fr"};
      min-height: 297mm;
    }
    .sidebar {
      background: ${c.sidebar};
      color: ${c.sidebarText};
      padding: 12mm 9mm;
    }
    .sidebar h2 { color: ${isDark ? c.accent : c.sidebarText}; border-color: ${isDark ? c.border : "rgba(255,255,255,0.15)"}; opacity: 0.95; }
    .sidebar .sub, .sidebar .dates, .sidebar .contact { color: ${isDark ? c.muted : "rgba(255,255,255,0.75)"}; }
    .sidebar .chip { background: ${isDark ? c.chip : "rgba(255,255,255,0.12)"}; color: ${isDark ? c.chipText : "#fff"}; }
    .main { padding: 12mm 11mm; background: ${c.surface}; }
    h1 {
      font-family: ${theme.fonts.heading};
      font-size: ${sidebar ? "17pt" : "22pt"};
      line-height: 1.15;
      margin-bottom: 4px;
      letter-spacing: ${doc.themeId === "tech" ? "-0.02em" : "normal"};
    }
    h2 {
      font-family: ${theme.fonts.heading};
      font-size: 9.5pt;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: ${c.accent};
      margin: 0 0 8px;
      padding-bottom: 4px;
      border-bottom: 1.5px solid ${c.border};
    }
    h3 { font-size: 10.5pt; font-weight: 600; margin-bottom: 2px; }
    h4 { font-size: 8pt; text-transform: uppercase; letter-spacing: 0.08em; color: ${c.muted}; margin-bottom: 5px; }
    .headline { color: ${sidebar ? (isDark ? c.accent : "rgba(255,255,255,0.9)") : c.muted}; font-size: 10.5pt; margin-bottom: 10px; font-weight: 500; }
    .hero { margin-bottom: 14px; padding-bottom: 12px; border-bottom: 2.5px solid ${c.accent}; }
    .contact, .contact-line { font-size: 8.5pt; line-height: 1.7; color: ${c.muted}; }
    .contact div { margin-bottom: 2px; }
    .summary-body { font-size: 10pt; color: ${c.text}; }
    .cv-section { margin-bottom: 14px; }
    .block { margin-bottom: 11px; page-break-inside: avoid; }
    .block-head { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 4px; align-items: flex-start; }
    .sub { color: ${c.muted}; font-size: 9pt; margin-top: 1px; }
    .muted-inline { color: ${c.muted}; font-weight: 400; }
    .dates { font-size: 8.5pt; color: ${c.muted}; white-space: nowrap; flex-shrink: 0; }
    ul { margin: 4px 0 0 15px; font-size: 9.5pt; }
    ul.plain { list-style: none; margin-left: 0; }
    li { margin-bottom: 3px; }
    .skill-group { margin-bottom: 10px; }
    .chips { display: flex; flex-wrap: wrap; gap: 4px; }
    .chip {
      display: inline-block;
      font-size: 8pt;
      font-family: ${theme.fonts.mono};
      padding: 2px 7px;
      border-radius: 4px;
      background: ${c.chip};
      color: ${c.chipText};
    }
    .chip-sm { font-size: 7.5pt; padding: 1px 6px; }
    .tech-row { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 5px; }
    .stars { color: ${c.accent}; font-family: ${theme.fonts.mono}; font-size: 8.5pt; }
    a { color: inherit; text-decoration: none; }
    a:hover { text-decoration: underline; }
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
        sidebar
          ? `<aside class="sidebar">${sidebarContent}</aside><main class="main">${mainSections}</main>`
          : `<main class="main">${singleColumnContent}</main>`
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
  const contact = joinParts(
    [p.email, p.phone, p.location, p.website, p.github, p.linkedin],
    " | ",
  );
  if (contact) lines.push(contact);
  if (p.summary) {
    lines.push("", "## Profil", "", p.summary);
  }

  if (doc.skillGroups.some((g) => g.skills.length)) {
    lines.push("", "## Compétences techniques");
    for (const g of doc.skillGroups) {
      if (!g.skills.some((s) => s.name.trim())) continue;
      lines.push(
        `**${g.label}:** ${g.skills.map((s) => s.name).filter(Boolean).join(", ")}`,
      );
    }
  }

  if (doc.experiences.some((e) => e.role || e.company)) {
    lines.push("", "## Expérience professionnelle");
    for (const e of doc.experiences) {
      if (!e.role && !e.company) continue;
      lines.push(
        `### ${e.role} · ${e.company}`,
        `*${formatPeriod(e.startDate, e.endDate, e.current)}*`,
      );
      for (const h of e.highlights.filter(Boolean)) lines.push(`• ${h}`);
      if (e.techStack.filter(Boolean).length) {
        lines.push(`Stack: ${e.techStack.join(", ")}`);
      }
      lines.push("");
    }
  }

  if (doc.projects.some((proj) => proj.name.trim())) {
    lines.push("## Projets");
    for (const proj of doc.projects) {
      if (!proj.name.trim()) continue;
      lines.push(`### ${proj.name}`);
      if (proj.description) lines.push(proj.description);
      for (const h of proj.highlights.filter(Boolean)) lines.push(`• ${h}`);
      if (proj.techStack.filter(Boolean).length) {
        lines.push(`Stack: ${proj.techStack.join(", ")}`);
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
