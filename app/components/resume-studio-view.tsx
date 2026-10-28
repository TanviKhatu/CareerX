"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import {
  FileText,
  Printer,
  Sparkles,
  Plus,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  CheckCircle2,
  Download,
  ExternalLink,
} from "lucide-react";

export type ResumeExperience = {
  id: string;
  role: string;
  company: string;
  location?: string;
  period: string;
  bullets: string[];
};

export type ResumeEducation = {
  id: string;
  degree: string;
  institution: string;
  year: string;
};

export type ResumeState = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  targetRole: string;
  summary: string;
  skills: string[];
  experiences: ResumeExperience[];
  education: ResumeEducation[];
};

const defaultResume: ResumeState = {
  fullName: "Alex Rivera",
  email: "alex.rivera@example.com",
  phone: "+1 (555) 234-5678",
  location: "San Francisco, CA",
  website: "github.com/alexrivera",
  targetRole: "Full-Stack Software Engineer",
  summary:
    "Product-minded software engineer with strong foundations in TypeScript, React, and scalable backend services. Proven track record in designing high-performance web applications, optimizing relational databases, and shipping user-centric features.",
  skills: [
    "TypeScript",
    "JavaScript (ES6+)",
    "React",
    "Next.js",
    "Node.js",
    "PostgreSQL",
    "REST & GraphQL APIs",
    "Git & GitHub",
    "CI/CD Pipelines",
    "Automated Testing (Vitest/Playwright)",
    "Docker",
    "Tailwind CSS",
  ],
  experiences: [
    {
      id: "exp-1",
      role: "Software Engineering Intern",
      company: "Apex Tech Labs",
      location: "San Francisco, CA",
      period: "Jun 2024 – Present",
      bullets: [
        "Architected an automated reporting dashboard using Next.js, reducing weekly data compilation time by 40% for 15 internal stakeholders.",
        "Refactored high-traffic PostgreSQL queries and configured compound indexing, improving 95th-percentile response times by 320ms.",
        "Collaborated with product designers to implement an accessible component library with 100% WCAG AA compliance.",
        "Authored automated integration test suites achieving 88% branch coverage across critical authentication paths.",
      ],
    },
    {
      id: "exp-2",
      role: "Full-Stack Developer (Capstone Project)",
      company: "CareerX Project",
      location: "State University",
      period: "Jan 2024 – May 2024",
      bullets: [
        "Engineered and deployed a reactive web application using React, Supabase, and Tailwind CSS serving 1,200+ simulated user sessions.",
        "Implemented real-time algorithmic recommendation scoring with custom heuristics, achieving sub-150ms latency.",
        "Managed end-to-end continuous deployment using Vercel and GitHub Actions with automated linting and type checking.",
      ],
    },
  ],
  education: [
    {
      id: "edu-1",
      degree: "Bachelor of Science in Computer Science & Information Systems",
      institution: "State University",
      year: "Expected Graduation: May 2025",
    },
  ],
};

const roleKeywordBank: Record<string, string[]> = {
  "software engineer": [
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "PostgreSQL",
    "REST & GraphQL APIs",
    "Git & GitHub",
    "CI/CD Pipelines",
    "Automated Testing",
    "Docker",
    "System Design",
  ],
  "product designer": [
    "Figma",
    "Design Systems",
    "User Research",
    "Wireframing",
    "Prototyping",
    "Usability Testing",
    "Information Architecture",
    "Accessibility (WCAG)",
    "Interaction Design",
  ],
  "data analyst": [
    "SQL (Postgres/BigQuery)",
    "Python",
    "Pandas & NumPy",
    "Data Visualization",
    "Tableau / PowerBI",
    "Statistical Modeling",
    "Cohort Analysis",
    "A/B Testing",
    "ETL Pipelines",
  ],
  finance: [
    "Financial Modeling",
    "Excel (VBA/Macros)",
    "DCF Valuation",
    "3-Statement Models",
    "Market Research",
    "P&L Analysis",
    "Variance Analysis",
    "Accounting",
  ],
};

export function ResumeStudioView({
  initialProfile = {},
}: {
  initialProfile?: Partial<ResumeState>;
}) {
  const [resume, setResume] = useState<ResumeState>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("careerx_resume_state");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return {
      ...defaultResume,
      fullName: initialProfile.fullName || defaultResume.fullName,
      email: initialProfile.email || defaultResume.email,
      phone: initialProfile.phone || defaultResume.phone,
      location: initialProfile.location || defaultResume.location,
      skills: initialProfile.skills && initialProfile.skills.length > 0 ? initialProfile.skills : defaultResume.skills,
    };
  });

  const [copied, setCopied] = useState(false);
  const [selectedRoleForAts, setSelectedRoleForAts] = useState<string>("software engineer");

  useEffect(() => {
    try {
      localStorage.setItem("careerx_resume_state", JSON.stringify(resume));
    } catch {
      // ignore
    }
  }, [resume]);

  // ATS Keyword analysis
  const targetKeywords = roleKeywordBank[selectedRoleForAts] || roleKeywordBank["software engineer"];
  const resumeString = useMemo(() => {
    return (
      `${resume.summary} ${resume.skills.join(" ")} ` +
      resume.experiences.map((e) => `${e.role} ${e.company} ${e.bullets.join(" ")}`).join(" ")
    ).toLowerCase();
  }, [resume]);

  const matchedKeywords = useMemo(() => {
    return targetKeywords.filter((kw) => resumeString.includes(kw.toLowerCase().split("/")[0].trim()));
  }, [targetKeywords, resumeString]);

  const missingKeywords = useMemo(() => {
    return targetKeywords.filter((kw) => !resumeString.includes(kw.toLowerCase().split("/")[0].trim()));
  }, [targetKeywords, resumeString]);

  const atsScore = Math.min(
    100,
    Math.round((matchedKeywords.length / (targetKeywords.length || 1)) * 100)
  );

  // Clean printable resume HTML generation (for dedicated print / PDF download)
  const generateCleanResumeHtml = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${resume.fullName} - Resume</title>
  <style>
    @page {
      size: letter;
      margin: 0.55in 0.65in;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: "Calibri", "Segoe UI", Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      line-height: 1.35;
      font-size: 10.5pt;
      padding: 0.2in 0;
    }
    .header {
      text-align: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #111827;
    }
    .name {
      font-size: 22pt;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #111827;
      margin-bottom: 2px;
    }
    .target-role {
      font-size: 11pt;
      font-weight: 600;
      color: #374151;
      margin-bottom: 4px;
    }
    .contact-info {
      font-size: 9.5pt;
      color: #4b5563;
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 6px;
    }
    .contact-info span:not(:last-child)::after {
      content: " •";
      margin-left: 6px;
      color: #9ca3af;
    }
    .section {
      margin-top: 11px;
    }
    .section-title {
      font-size: 10pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #111827;
      border-bottom: 1px solid #1f2937;
      padding-bottom: 2px;
      margin-bottom: 6px;
    }
    .summary-text {
      font-size: 10pt;
      color: #374151;
      text-align: justify;
      line-height: 1.4;
    }
    .skills-text {
      font-size: 10pt;
      color: #374151;
      line-height: 1.45;
    }
    .experience-item {
      margin-bottom: 9px;
      page-break-inside: avoid;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 10.5pt;
    }
    .item-title {
      font-weight: 700;
      color: #111827;
    }
    .item-period {
      font-size: 9.5pt;
      color: #4b5563;
      font-weight: 600;
      text-align: right;
    }
    .item-company {
      font-size: 10pt;
      font-weight: 600;
      color: #374151;
      font-style: italic;
      margin-bottom: 3px;
    }
    .item-location {
      font-style: normal;
      color: #6b7280;
      font-weight: 400;
    }
    ul.bullets {
      margin-left: 18px;
      margin-top: 3px;
      list-style-type: disc;
    }
    ul.bullets li {
      font-size: 9.8pt;
      color: #374151;
      margin-bottom: 2.5px;
      line-height: 1.35;
      text-align: justify;
    }
    .education-item {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 10pt;
      margin-bottom: 4px;
    }
    .edu-degree {
      font-weight: 700;
      color: #111827;
    }
    .edu-school {
      color: #4b5563;
      font-style: italic;
    }
    .edu-year {
      font-size: 9.5pt;
      color: #4b5563;
      text-align: right;
    }
  </style>
</head>
<body>
  <!-- HEADER -->
  <div class="header">
    <div class="name">${resume.fullName || "Your Name"}</div>
    ${resume.targetRole ? `<div class="target-role">${resume.targetRole}</div>` : ""}
    <div class="contact-info">
      ${resume.email ? `<span>${resume.email}</span>` : ""}
      ${resume.phone ? `<span>${resume.phone}</span>` : ""}
      ${resume.location ? `<span>${resume.location}</span>` : ""}
      ${resume.website ? `<span>${resume.website}</span>` : ""}
    </div>
  </div>

  <!-- SUMMARY -->
  ${resume.summary
        ? `
  <div class="section">
    <div class="section-title">Professional Summary</div>
    <div class="summary-text">${resume.summary}</div>
  </div>`
        : ""
      }

  <!-- CORE SKILLS -->
  ${resume.skills && resume.skills.length > 0
        ? `
  <div class="section">
    <div class="section-title">Technical & Core Skills</div>
    <div class="skills-text">${resume.skills.join(" • ")}</div>
  </div>`
        : ""
      }

  <!-- EXPERIENCE -->
  ${resume.experiences && resume.experiences.length > 0
        ? `
  <div class="section">
    <div class="section-title">Professional Experience</div>
    ${resume.experiences
          .map(
            (exp) => `
    <div class="experience-item">
      <div class="item-header">
        <span class="item-title">${exp.role}</span>
        <span class="item-period">${exp.period}</span>
      </div>
      <div class="item-company">${exp.company}${exp.location ? ` <span class="item-location">| ${exp.location}</span>` : ""}</div>
      <ul class="bullets">
        ${exp.bullets.map((b) => `<li>${b}</li>`).join("")}
      </ul>
    </div>`
          )
          .join("")}
  </div>`
        : ""
      }

  <!-- EDUCATION -->
  ${resume.education && resume.education.length > 0
        ? `
  <div class="section">
    <div class="section-title">Education</div>
    ${resume.education
          .map(
            (edu) => `
    <div class="education-item">
      <div>
        <span class="edu-degree">${edu.degree}</span> — <span class="edu-school">${edu.institution}</span>
      </div>
      <span class="edu-year">${edu.year}</span>
    </div>`
          )
          .join("")}
  </div>`
        : ""
      }
</body>
</html>`;
  };

  // Dedicated Print / Download PDF window trigger
  const handleDownloadPdf = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }
    const html = generateCleanResumeHtml();
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Download standalone clean .html resume
  const handleDownloadHtml = () => {
    const html = generateCleanResumeHtml();
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(resume.fullName || "Resume").replace(/\s+/g, "_")}_Resume.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyPlainText = () => {
    const text = `
${(resume.fullName || "").toUpperCase()}
${resume.targetRole}
${[resume.email, resume.phone, resume.location, resume.website].filter(Boolean).join(" | ")}

========================================
PROFESSIONAL SUMMARY
========================================
${resume.summary}

========================================
TECHNICAL & CORE SKILLS
========================================
${resume.skills.join(" • ")}

========================================
PROFESSIONAL EXPERIENCE
========================================
${resume.experiences
        .map(
          (exp) => `
${exp.role.toUpperCase()} | ${exp.company}
${exp.period} ${exp.location ? `| ${exp.location}` : ""}
${exp.bullets.map((b) => `• ${b}`).join("\n")}
`
        )
        .join("\n")}

========================================
EDUCATION
========================================
${resume.education.map((edu) => `${edu.degree} — ${edu.institution} (${edu.year})`).join("\n")}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addSkill = (kw: string) => {
    if (resume.skills.some((s) => s.toLowerCase() === kw.toLowerCase())) return;
    setResume((prev) => ({
      ...prev,
      skills: [...prev.skills, kw],
    }));
  };

  const removeSkill = (skillToRemove: string) => {
    setResume((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const updateBullet = (expId: string, bulletIdx: number, val: string) => {
    setResume((prev) => ({
      ...prev,
      experiences: prev.experiences.map((exp) => {
        if (exp.id !== expId) return exp;
        const newBullets = [...exp.bullets];
        newBullets[bulletIdx] = val;
        return { ...exp, bullets: newBullets };
      }),
    }));
  };

  const addExperience = () => {
    const newExp: ResumeExperience = {
      id: `exp-${Date.now()}`,
      role: "Software Developer",
      company: "Company / Project",
      location: "Remote",
      period: "2024 – Present",
      bullets: [
        "Architected and deployed key features, resulting in improved system efficiency and user satisfaction.",
      ],
    };
    setResume((prev) => ({
      ...prev,
      experiences: [...prev.experiences, newExp],
    }));
  };

  const removeExperience = (id: string) => {
    setResume((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((e) => e.id !== id),
    }));
  };

  const enhanceBulletWithAction = (expId: string, bulletIdx: number) => {
    const current = resume.experiences.find((e) => e.id === expId)?.bullets[bulletIdx] || "";
    const cleaned = current.replace(/^(built|helped|worked on|did|developed|responsible for)\s+/i, "");
    const enhanced = `Spearheaded ${cleaned || "system development"}, driving a 28% increase in operational performance and saving 6+ hours weekly.`;
    updateBullet(expId, bulletIdx, enhanced);
  };

  const resetToStandard = () => {
    setResume(defaultResume);
    try {
      localStorage.removeItem("careerx_resume_state");
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-8">
      {/* Global Print-Only Styles to ensure that if user uses browser Ctrl+P directly, only the resume prints */}
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #111827 !important;
          }
          aside,
          header,
          nav,
          .no-print,
          button {
            display: none !important;
          }
          #clean-resume-document {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="no-print flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e05e43]">Resume Studio</p>
          <h1 className="display-font mt-2 text-4xl tracking-tight sm:text-5xl">Your story.</h1>
          <p className="mt-3 max-w-xl text-[#667085]">
            Shape your experiences into an executive resume. Download in clean, professional standard format with prominent header and crisp sections.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={copyPlainText}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#dfe3dc] bg-white px-3.5 py-2 text-xs font-semibold text-[#667085] hover:bg-[#f0f2ed]"
          >
            {copied ? <Check size={14} className="text-[#48a582]" /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy text"}
          </button>

          <button
            type="button"
            onClick={handleDownloadHtml}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#dfe3dc] bg-white px-3.5 py-2 text-xs font-semibold text-[#223b83] hover:bg-[#f0f2ed]"
            title="Download clean standalone HTML resume file"
          >
            <Download size={14} /> Download HTML
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 rounded-full bg-[#223b83] px-5 py-2.5 text-xs font-bold text-white shadow-[0_4px_0_#142658] transition hover:bg-[#1a2f6b]"
            title="Download / Print as PDF in exact resume layout"
          >
            <Printer size={15} /> Download PDF / Print
          </button>
        </div>
      </div>

      {/* ATS Keyword Scanner Banner */}
      <div className="no-print rounded-2xl border border-[#cfd8ef] bg-[#e8edff] p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#223b83] text-white">
              <Sparkles size={20} />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#182032]">
                ATS Target Fit: <span className="text-[#223b83]">{atsScore}% Alignment</span>
              </h2>
              <p className="text-xs text-[#556997]">
                Live keyword optimization for recruiters and applicant tracking systems.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#667085]">Role Target:</span>
            <select
              value={selectedRoleForAts}
              onChange={(e) => setSelectedRoleForAts(e.target.value)}
              className="rounded-xl border border-[#cad5f2] bg-white px-3 py-1.5 text-xs font-bold text-[#182032] outline-none"
            >
              <option value="software engineer">Software Engineer</option>
              <option value="product designer">Product Designer</option>
              <option value="data analyst">Data Analyst</option>
              <option value="finance">Finance Analyst</option>
            </select>
          </div>
        </div>

        {/* Keywords Chips */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#d4def7] pt-3 text-xs">
          <span className="font-bold text-[#223b83]">Matched ({matchedKeywords.length}):</span>
          {matchedKeywords.map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center gap-1 rounded-md bg-[#e3f2ec] px-2.5 py-1 text-[11px] font-bold text-[#25805c]"
            >
              <CheckCircle2 size={12} /> {kw}
            </span>
          ))}

          {missingKeywords.length > 0 && (
            <>
              <span className="ml-2 font-bold text-[#e05e43]">Missing ({missingKeywords.length}):</span>
              {missingKeywords.map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => addSkill(kw)}
                  title="Click to add to your skills"
                  className="inline-flex items-center gap-1 rounded-md border border-[#f8cfc6] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#b83d24] hover:bg-[#e05e43] hover:text-white transition"
                >
                  <Plus size={11} /> {kw}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Studio View: Split-Screen Editor & Clean Standard Resume Format */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: The Editor Form */}
        <div className="no-print space-y-6">
          <div className="rounded-2xl border border-[#e3e6df] bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#182032]">
                1. Header & Contact Information
              </h3>
              <button
                type="button"
                onClick={resetToStandard}
                className="text-[11px] font-bold text-[#667085] hover:text-[#223b83]"
              >
                Reset sample
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-bold text-[#667085]">Full Name (Bold Header)</label>
                <input
                  type="text"
                  value={resume.fullName}
                  onChange={(e) => setResume({ ...resume, fullName: e.target.value })}
                  placeholder="e.g. Alex Rivera"
                  className="mt-1 w-full rounded-xl border border-[#dfe3dc] p-2.5 text-xs font-bold outline-none focus:border-[#223b83]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#667085]">Target Job Title</label>
                <input
                  type="text"
                  value={resume.targetRole}
                  onChange={(e) => setResume({ ...resume, targetRole: e.target.value })}
                  placeholder="e.g. Full-Stack Software Engineer"
                  className="mt-1 w-full rounded-xl border border-[#dfe3dc] p-2.5 text-xs outline-none focus:border-[#223b83]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#667085]">Email Address</label>
                <input
                  type="email"
                  value={resume.email}
                  onChange={(e) => setResume({ ...resume, email: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#dfe3dc] p-2.5 text-xs outline-none focus:border-[#223b83]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#667085]">Phone / Location</label>
                <input
                  type="text"
                  value={resume.phone}
                  onChange={(e) => setResume({ ...resume, phone: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#dfe3dc] p-2.5 text-xs outline-none focus:border-[#223b83]"
                />
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-bold text-[#667085]">City, State / Country</label>
                <input
                  type="text"
                  value={resume.location}
                  onChange={(e) => setResume({ ...resume, location: e.target.value })}
                  placeholder="e.g. San Francisco, CA"
                  className="mt-1 w-full rounded-xl border border-[#dfe3dc] p-2.5 text-xs outline-none focus:border-[#223b83]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#667085]">Portfolio / GitHub / LinkedIn</label>
                <input
                  type="text"
                  value={resume.website}
                  onChange={(e) => setResume({ ...resume, website: e.target.value })}
                  placeholder="e.g. github.com/alexrivera"
                  className="mt-1 w-full rounded-xl border border-[#dfe3dc] p-2.5 text-xs outline-none focus:border-[#223b83]"
                />
              </div>
            </div>
          </div>

          {/* Professional Summary */}
          <div className="rounded-2xl border border-[#e3e6df] bg-white p-6 shadow-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#182032]">
              2. Professional Summary
            </h3>
            <textarea
              rows={3}
              value={resume.summary}
              onChange={(e) => setResume({ ...resume, summary: e.target.value })}
              className="mt-3 w-full rounded-xl border border-[#dfe3dc] p-3 text-xs leading-5 text-[#182032] outline-none focus:border-[#223b83]"
            />
          </div>

          {/* Core Skills */}
          <div className="rounded-2xl border border-[#e3e6df] bg-white p-6 shadow-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#182032]">
              3. Core Skills & Competencies
            </h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {resume.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#dfe3dc] bg-[#f7f8f5] px-2.5 py-1 text-xs font-semibold text-[#182032]"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="text-[#a3aab7] hover:text-[#e05e43]"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div className="rounded-2xl border border-[#e3e6df] bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#182032]">
                4. Professional Experience
              </h3>
              <button
                type="button"
                onClick={addExperience}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#223b83] hover:underline"
              >
                <Plus size={14} /> Add entry
              </button>
            </div>

            <div className="mt-4 space-y-5">
              {resume.experiences.map((exp) => (
                <div key={exp.id} className="rounded-xl border border-[#f0f2ed] bg-[#fbfbfa] p-4 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#182032]">{exp.role}</span>
                    <button
                      type="button"
                      onClick={() => removeExperience(exp.id)}
                      className="text-[#a3aab7] hover:text-[#e05e43]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <input
                      type="text"
                      value={exp.role}
                      onChange={(e) =>
                        setResume({
                          ...resume,
                          experiences: resume.experiences.map((x) =>
                            x.id === exp.id ? { ...x, role: e.target.value } : x
                          ),
                        })
                      }
                      placeholder="Role title"
                      className="rounded-lg border border-[#dfe3dc] bg-white p-2 text-xs font-semibold"
                    />
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) =>
                        setResume({
                          ...resume,
                          experiences: resume.experiences.map((x) =>
                            x.id === exp.id ? { ...x, company: e.target.value } : x
                          ),
                        })
                      }
                      placeholder="Company"
                      className="rounded-lg border border-[#dfe3dc] bg-white p-2 text-xs"
                    />
                    <input
                      type="text"
                      value={exp.period}
                      onChange={(e) =>
                        setResume({
                          ...resume,
                          experiences: resume.experiences.map((x) =>
                            x.id === exp.id ? { ...x, period: e.target.value } : x
                          ),
                        })
                      }
                      placeholder="Dates (e.g. 2024 – Present)"
                      className="rounded-lg border border-[#dfe3dc] bg-white p-2 text-xs"
                    />
                  </div>

                  {/* Bullets */}
                  <div className="mt-3 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#8b93a2]">
                      Action & Impact Bullets:
                    </p>
                    {exp.bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="space-y-1">
                        <textarea
                          rows={2}
                          value={bullet}
                          onChange={(e) => updateBullet(exp.id, bIdx, e.target.value)}
                          className="w-full rounded-lg border border-[#dfe3dc] bg-white p-2 text-xs leading-4"
                        />
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => enhanceBulletWithAction(exp.id, bIdx)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#223b83] hover:underline"
                          >
                            <Sparkles size={11} className="text-[#e05e43]" /> Polish with XYZ Impact formula
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: The Exact Simple Resume Format (Live Preview & Print Target) */}
        <div>
          <div className="sticky top-6">
            <div className="no-print mb-3 flex items-center justify-between px-2 text-xs text-[#8b93a2]">
              <span className="font-bold uppercase tracking-wider text-[#182032]">
                Exact Resume Output Preview
              </span>
              <span>Standard 1-Page Layout</span>
            </div>

            {/* Resume Sheet Container (Clean, Minimalist, Standard White Sheet) */}
            <div
              id="clean-resume-document"
              className="rounded-xl border border-[#d1d5db] bg-white p-8 sm:p-10 shadow-lg text-[#111827] font-sans text-sm"
              style={{
                fontFamily: "Calibri, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                lineHeight: "1.4",
              }}
            >
              {/* 1. NAME IN BOLD HIGHLIGHTED TEXT IN THE START */}
              <div className="border-b-2 border-[#111827] pb-3 text-center">
                <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-wide text-[#111827]">
                  {resume.fullName || "Your Full Name"}
                </h1>
                {resume.targetRole && (
                  <p className="mt-1 text-xs sm:text-sm font-semibold text-[#374151]">
                    {resume.targetRole}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 text-[11px] text-[#4b5563]">
                  {resume.email && <span>{resume.email}</span>}
                  {resume.email && resume.phone && <span>•</span>}
                  {resume.phone && <span>{resume.phone}</span>}
                  {(resume.email || resume.phone) && resume.location && <span>•</span>}
                  {resume.location && <span>{resume.location}</span>}
                  {resume.website && (
                    <>
                      <span>•</span>
                      <span className="font-semibold text-[#111827]">{resume.website}</span>
                    </>
                  )}
                </div>
              </div>

              {/* 2. PROFESSIONAL SUMMARY */}
              {resume.summary && (
                <div className="mt-4">
                  <h2 className="border-b border-[#1f2937] pb-0.5 text-[11px] font-bold uppercase tracking-wider text-[#111827]">
                    Professional Summary
                  </h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#374151] text-justify">
                    {resume.summary}
                  </p>
                </div>
              )}

              {/* 3. CORE SKILLS */}
              {resume.skills && resume.skills.length > 0 && (
                <div className="mt-4">
                  <h2 className="border-b border-[#1f2937] pb-0.5 text-[11px] font-bold uppercase tracking-wider text-[#111827]">
                    Technical & Core Skills
                  </h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#374151]">
                    {resume.skills.join("  •  ")}
                  </p>
                </div>
              )}

              {/* 4. PROFESSIONAL EXPERIENCE */}
              {resume.experiences && resume.experiences.length > 0 && (
                <div className="mt-4">
                  <h2 className="border-b border-[#1f2937] pb-0.5 text-[11px] font-bold uppercase tracking-wider text-[#111827]">
                    Professional Experience
                  </h2>

                  <div className="mt-2 space-y-3.5">
                    {resume.experiences.map((exp) => (
                      <div key={exp.id}>
                        <div className="flex justify-between items-baseline text-xs">
                          <span className="font-bold text-[#111827]">{exp.role}</span>
                          <span className="font-semibold text-[#4b5563] text-[11px]">{exp.period}</span>
                        </div>
                        <div className="text-[11.5px] italic text-[#374151]">
                          {exp.company}
                          {exp.location && <span className="not-italic text-[#6b7280]"> | {exp.location}</span>}
                        </div>
                        <ul className="mt-1 ml-4 list-disc space-y-1 text-xs text-[#374151] leading-relaxed text-justify">
                          {exp.bullets.map((bullet, idx) => (
                            <li key={idx}>{bullet}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. EDUCATION */}
              {resume.education && resume.education.length > 0 && (
                <div className="mt-4">
                  <h2 className="border-b border-[#1f2937] pb-0.5 text-[11px] font-bold uppercase tracking-wider text-[#111827]">
                    Education
                  </h2>

                  <div className="mt-2 space-y-1.5">
                    {resume.education.map((edu) => (
                      <div key={edu.id} className="flex justify-between items-baseline text-xs">
                        <div>
                          <span className="font-bold text-[#111827]">{edu.degree}</span>
                          <span className="text-[#4b5563] italic"> — {edu.institution}</span>
                        </div>
                        <span className="text-[11px] text-[#4b5563]">{edu.year}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions Footer below preview */}
            <div className="no-print mt-4 flex items-center justify-between rounded-xl border border-[#e3e6df] bg-white p-3.5 text-xs">
              <span className="font-semibold text-[#667085]">Ready to submit?</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadHtml}
                  className="rounded-lg border border-[#dfe3dc] px-3 py-1.5 font-bold text-[#223b83] hover:bg-[#f7f8f5]"
                >
                  Save HTML
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="rounded-lg bg-[#223b83] px-3.5 py-1.5 font-bold text-white hover:bg-[#1a2f6b]"
                >
                  Print / Save PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
