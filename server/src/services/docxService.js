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

class DocxService {
  async generate(resumeData, template) {
    const p = resumeData.personal_info || {};
    const sections = [];

    // Header: Name
    const name = `${p.first_name || ''} ${p.last_name || ''}`.trim();
    if (name) {
      sections.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [
            new TextRun({ text: name, bold: true, size: 32, font: 'Calibri' }),
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
            new TextRun({ text: p.job_title, size: 22, color: '555555', font: 'Calibri' }),
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

    // Summary
    if (resumeData.summary) {
      sections.push(this._sectionHeading('PROFESSIONAL SUMMARY'));
      sections.push(
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({ text: resumeData.summary, size: 20, font: 'Calibri' }),
          ],
        })
      );
    }

    // Experience
    if (resumeData.work_experience?.length > 0) {
      sections.push(this._sectionHeading('EXPERIENCE'));
      for (const exp of resumeData.work_experience) {
        // Position + Company line with dates on the right
        const dateLine = this._formatDateRange(exp.start_date, exp.end_date, exp.current);
        sections.push(
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
          sections.push(
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
          sections.push(
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

    // Education
    if (resumeData.education?.length > 0) {
      sections.push(this._sectionHeading('EDUCATION'));
      for (const edu of resumeData.education) {
        const dateLine = this._formatDateRange(edu.start_date, edu.end_date);
        const degreeLine = [edu.degree, edu.field_of_study].filter(Boolean).join(' in ');
        sections.push(
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
          sections.push(
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

    // Skills
    if (resumeData.skills?.length > 0) {
      sections.push(this._sectionHeading('SKILLS'));
      sections.push(
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({ text: resumeData.skills.filter(Boolean).join('  •  '), size: 20, font: 'Calibri' }),
          ],
        })
      );
    }

    // Projects
    if (resumeData.projects?.length > 0) {
      sections.push(this._sectionHeading('PROJECTS'));
      for (const proj of resumeData.projects) {
        sections.push(
          new Paragraph({
            spacing: { before: 120, after: 40 },
            children: [
              new TextRun({ text: proj.name || '', bold: true, size: 20, font: 'Calibri' }),
              ...(proj.technologies ? [new TextRun({ text: ` (${proj.technologies})`, size: 18, color: '666666', font: 'Calibri' })] : []),
            ],
          })
        );
        if (proj.description) {
          sections.push(
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

    // Certifications
    if (resumeData.certifications?.length > 0) {
      sections.push(this._sectionHeading('CERTIFICATIONS'));
      for (const cert of resumeData.certifications) {
        const parts = [cert.name, cert.issuer].filter(Boolean).join(' — ');
        sections.push(
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

    // Languages
    if (resumeData.languages?.length > 0) {
      sections.push(this._sectionHeading('LANGUAGES'));
      const langText = resumeData.languages
        .map((l) => `${l.name}${l.proficiency ? ` (${l.proficiency})` : ''}`)
        .join('  •  ');
      sections.push(
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({ text: langText, size: 20, font: 'Calibri' }),
          ],
        })
      );
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

  _sectionHeading(title) {
    return new Paragraph({
      spacing: { before: 240, after: 80 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      },
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 22,
          font: 'Calibri',
          color: '333333',
        }),
      ],
    });
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
