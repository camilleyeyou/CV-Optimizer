const {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  TabStopPosition,
  TabStopType,
  Packer,
  BorderStyle,
} = require('docx');
const { getTemplate } = require('../templateRegistry');

class DocxService {
  async generate(resumeData, template) {
    const p = resumeData.personal_info || {};
    const spec = getTemplate(template);
    const theme = {
      accent: (spec.accent || '#2563eb').replace('#', ''),
      headingFont: spec.headingFamily === 'serif' ? 'Georgia' : 'Calibri',
      bodyFont: spec.fontFamily === 'serif' ? 'Georgia' : 'Calibri',
      sectionTitle: spec.sectionTitle || 'underline',
      sectionLabels: spec.sectionLabels || {},
    };
    const sections = [];

    // Header: Name
    const name = `${p.first_name || ''} ${p.last_name || ''}`.trim();
    if (name) {
      sections.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [
            new TextRun({ text: name, bold: true, size: 32, font: theme.headingFont }),
          ],
        })
      );
    }

    // Job title
    if (p.job_title) {
      sections.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [
            new TextRun({ text: p.job_title, size: 22, color: theme.accent, font: theme.headingFont }),
          ],
        })
      );
    }

    // Contact info
    const contacts = [p.email, p.phone, p.location, p.linkedin, p.website].filter(Boolean);
    if (contacts.length > 0) {
      sections.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({ text: contacts.join('  |  '), size: 18, color: '666666', font: 'Calibri' }),
          ],
        })
      );
    }

    // Body sections, in the order the template declares. Registry-driven, so a
    // template that leads with publications exports that way too instead of
    // always falling back to the default order.
    for (const key of spec.sectionOrder) {
      sections.push(...this._bodySection(key, resumeData, theme));
    }

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        children: sections,
      }],
    });

    return Packer.toBuffer(doc);
  }

  async generateCoverLetter({ coverLetterText, personalInfo, companyName, jobTitle }) {
    const p = personalInfo || {};
    const name = `${p.first_name || ''} ${p.last_name || ''}`.trim();
    const sections = [];

    // Sender name
    if (name) {
      sections.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: name, bold: true, size: 28, font: 'Calibri' }),
          ],
        })
      );
    }

    // Contact info
    const contacts = [p.email, p.phone, p.location].filter(Boolean);
    if (contacts.length > 0) {
      sections.push(
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({ text: contacts.join('  |  '), size: 18, color: '666666', font: 'Calibri' }),
          ],
        })
      );
    }

    // Date
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    sections.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({ text: date, size: 20, color: '555555', font: 'Calibri' }),
        ],
      })
    );

    // Company and job title
    if (companyName) {
      sections.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: companyName, size: 20, font: 'Calibri' }),
          ],
        })
      );
    }
    if (jobTitle) {
      sections.push(
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({ text: `Re: ${jobTitle}`, size: 20, font: 'Calibri' }),
          ],
        })
      );
    }

    // Body paragraphs
    const paragraphs = coverLetterText.split('\n').filter((t) => t.trim());
    paragraphs.forEach((para) => {
      sections.push(
        new Paragraph({
          spacing: { after: 160 },
          children: [
            new TextRun({ text: para.trim(), size: 21, font: 'Calibri' }),
          ],
        })
      );
    });

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        children: sections,
      }],
    });

    return Packer.toBuffer(doc);
  }

  /**
   * Paragraphs for one section, or [] when the resume has nothing for it.
   *
   * Mirrors pdfService._section: the template picks both the order (via
   * sectionOrder) and the heading (via sectionLabels), so all three renderers
   * agree on what a section is called and where it sits.
   */
  _bodySection(key, resumeData, theme) {
    const out = [];
    const label = (fallback) => (theme.sectionLabels[key] || fallback).toUpperCase();

    switch (key) {
      case 'summary': {
      if (resumeData.summary) {
        out.push(this._sectionHeading(label('PROFESSIONAL SUMMARY'), theme));
        out.push(
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: resumeData.summary, size: 20, font: 'Calibri' }),
            ],
          })
        );
      }
        break;
      }
      case 'experience': {
      if (resumeData.work_experience?.length > 0) {
        out.push(this._sectionHeading(label('EXPERIENCE'), theme));
        for (const exp of resumeData.work_experience) {
          // Position + Company line with dates on the right
          const dateLine = this._formatDateRange(exp.start_date, exp.end_date, exp.current);
          out.push(
            new Paragraph({
              spacing: { before: 120, after: 40 },
              tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
              children: [
                new TextRun({ text: exp.position || '', bold: true, size: 20, font: 'Calibri' }),
                ...(exp.company ? [new TextRun({ text: ` — ${exp.company}`, size: 20, font: 'Calibri' })] : []),
                new TextRun({ text: '\t', size: 20 }),
                new TextRun({ text: dateLine, size: 18, color: '666666', font: 'Calibri' }),
              ],
            })
          );

          if (exp.location) {
            out.push(
              new Paragraph({
                spacing: { after: 40 },
                children: [
                  new TextRun({ text: exp.location, size: 18, italics: true, color: '666666', font: 'Calibri' }),
                ],
              })
            );
          }

          // Bullet points
          const bullets = Array.isArray(exp.description) ? exp.description : [];
          for (const bullet of bullets.filter(Boolean)) {
            out.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { after: 40 },
                children: [
                  new TextRun({ text: bullet, size: 20, font: 'Calibri' }),
                ],
              })
            );
          }
        }
      }
        break;
      }
      case 'education': {
      if (resumeData.education?.length > 0) {
        out.push(this._sectionHeading(label('EDUCATION'), theme));
        for (const edu of resumeData.education) {
          const dateLine = this._formatDateRange(edu.start_date, edu.end_date);
          const degreeLine = [edu.degree, edu.field_of_study].filter(Boolean).join(' in ');
          out.push(
            new Paragraph({
              spacing: { before: 120, after: 40 },
              tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
              children: [
                new TextRun({ text: degreeLine || '', bold: true, size: 20, font: 'Calibri' }),
                new TextRun({ text: '\t', size: 20 }),
                new TextRun({ text: dateLine, size: 18, color: '666666', font: 'Calibri' }),
              ],
            })
          );
          const subLine = [edu.institution, edu.gpa ? `GPA: ${edu.gpa}` : ''].filter(Boolean).join(' — ');
          if (subLine) {
            out.push(
              new Paragraph({
                spacing: { after: 80 },
                children: [
                  new TextRun({ text: subLine, size: 18, color: '666666', font: 'Calibri' }),
                ],
              })
            );
          }
        }
      }
        break;
      }
      case 'skills': {
      if (resumeData.skills?.length > 0) {
        out.push(this._sectionHeading(label('SKILLS'), theme));
        out.push(
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: resumeData.skills.filter(Boolean).join('  •  '), size: 20, font: 'Calibri' }),
            ],
          })
        );
      }
        break;
      }
      case 'projects': {
      if (resumeData.projects?.length > 0) {
        out.push(this._sectionHeading(label('PROJECTS'), theme));
        for (const proj of resumeData.projects) {
          out.push(
            new Paragraph({
              spacing: { before: 120, after: 40 },
              children: [
                new TextRun({ text: proj.name || '', bold: true, size: 20, font: 'Calibri' }),
                ...(proj.technologies ? [new TextRun({ text: ` (${proj.technologies})`, size: 18, color: '666666', font: 'Calibri' })] : []),
              ],
            })
          );
          // The repo/portfolio link is often the point of the entry, and the PDF
          // and preview both render it - dropping it here lost real content.
          if (proj.url) {
            out.push(
              new Paragraph({
                spacing: { after: 40 },
                children: [
                  new TextRun({
                    text: proj.url, size: 18, color: theme.accent, font: 'Calibri',
                  }),
                ],
              })
            );
          }
          if (proj.description) {
            out.push(
              new Paragraph({
                spacing: { after: 80 },
                children: [
                  new TextRun({ text: proj.description, size: 20, font: 'Calibri' }),
                ],
              })
            );
          }
        }
      }
        break;
      }
      case 'certifications': {
      if (resumeData.certifications?.length > 0) {
        out.push(this._sectionHeading(label('CERTIFICATIONS'), theme));
        for (const cert of resumeData.certifications) {
          const parts = [cert.name, cert.issuer].filter(Boolean).join(' — ');
          out.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { after: 40 },
              children: [
                new TextRun({ text: parts, size: 20, font: 'Calibri' }),
                ...(cert.date ? [new TextRun({ text: ` (${cert.date})`, size: 18, color: '666666', font: 'Calibri' })] : []),
              ],
            })
          );
        }
      }
        break;
      }
      case 'languages': {
      if (resumeData.languages?.length > 0) {
        out.push(this._sectionHeading(label('LANGUAGES'), theme));
        const langText = resumeData.languages
          .map((l) => `${l.name}${l.proficiency ? ` (${l.proficiency})` : ''}`)
          .join('  •  ');
        out.push(
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: langText, size: 20, font: 'Calibri' }),
            ],
          })
        );
      }
        break;
      }
      default:
        break;
    }
    return out;
  }

  _sectionHeading(title, theme = {}) {
    const accent = theme.accent || '333333';
    const font = theme.headingFont || 'Calibri';
    const style = theme.sectionTitle || 'underline';
    // 'plain' draws no rule; underline/smallcaps use the accent, others a light grey.
    const hasBorder = style !== 'plain';
    const borderColor = style === 'underline' || style === 'smallcaps' ? accent : 'CCCCCC';
    const textColor = style === 'underline' || style === 'smallcaps' || style === 'pill' ? accent : '333333';
    const para = {
      spacing: { before: 240, after: 80 },
      children: [
        new TextRun({ text: title, bold: true, size: 22, font, color: textColor }),
      ],
    };
    if (hasBorder) {
      para.border = { bottom: { style: BorderStyle.SINGLE, size: 1, color: borderColor } };
    }
    return new Paragraph(para);
  }

  _formatDateRange(start, end, current) {
    const fmt = (d) => {
      if (!d) return '';
      const [year, month] = d.split('-');
      if (!month) return year;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[parseInt(month, 10) - 1]} ${year}`;
    };
    const startStr = fmt(start);
    const endStr = current ? 'Present' : fmt(end);
    if (startStr && endStr) return `${startStr} — ${endStr}`;
    return startStr || endStr || '';
  }
}

module.exports = new DocxService();
