const PDFDocument = require('pdfkit');

class PDFService {
  async generatePDF(resume, template = 'modern') {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `${resume.personal_info?.first_name || ''} ${resume.personal_info?.last_name || ''} - Resume`,
            Author: `${resume.personal_info?.first_name || ''} ${resume.personal_info?.last_name || ''}`,
            Creator: 'CV Optimizer',
          },
        });

        this._renderResume(doc, resume, template);

        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  _renderResume(doc, resume, template) {
    const p = resume.personal_info || {};
    const colors = this._getColors(template);

    // Header - Name
    doc.fontSize(24)
      .fillColor(colors.primary)
      .font('Helvetica-Bold')
      .text(`${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Your Name', { align: 'center' });

    // Job title
    if (p.job_title) {
      doc.fontSize(11)
        .fillColor(colors.secondary)
        .font('Helvetica')
        .text(p.job_title, { align: 'center' });
    }

    doc.moveDown(0.5);

    // Contact info
    const contactItems = [p.email, p.phone, p.location, p.linkedin, p.website].filter(Boolean);
    if (contactItems.length > 0) {
      doc.fontSize(9)
        .fillColor(colors.muted)
        .text(contactItems.join('  |  '), { align: 'center' });
    }

    doc.moveDown(0.5);
    this._drawLine(doc, colors.primary);
    doc.moveDown(0.5);

    // Summary
    if (resume.summary) {
      this._sectionTitle(doc, 'PROFESSIONAL SUMMARY', colors);
      doc.fontSize(10)
        .fillColor(colors.text)
        .font('Helvetica')
        .text(resume.summary, { align: 'justify', lineGap: 2 });
      doc.moveDown(0.8);
    }

    // Experience
    if (resume.work_experience?.length > 0) {
      this._sectionTitle(doc, 'EXPERIENCE', colors);

      resume.work_experience.forEach((exp, i) => {
        // Position & Company
        doc.fontSize(11)
          .fillColor(colors.text)
          .font('Helvetica-Bold')
          .text(exp.position || '', { continued: !!exp.company });

        if (exp.company) {
          doc.font('Helvetica')
            .fillColor(colors.secondary)
            .text(`  |  ${exp.company}`);
        }

        // Date & Location
        const dateStr = this._formatDateRange(exp.start_date, exp.end_date, exp.current);
        const locationDate = [dateStr, exp.location].filter(Boolean).join('  |  ');
        if (locationDate) {
          doc.fontSize(9)
            .fillColor(colors.muted)
            .text(locationDate);
        }

        doc.moveDown(0.3);

        // Bullets
        if (exp.description?.length > 0) {
          exp.description.filter(Boolean).forEach((bullet) => {
            doc.fontSize(10)
              .fillColor(colors.text)
              .font('Helvetica')
              .text(`\u2022  ${bullet}`, { indent: 15, lineGap: 1 });
          });
        }

        if (i < resume.work_experience.length - 1) {
          doc.moveDown(0.5);
        }
      });

      doc.moveDown(0.8);
    }

    // Education
    if (resume.education?.length > 0) {
      this._sectionTitle(doc, 'EDUCATION', colors);

      resume.education.forEach((edu, i) => {
        doc.fontSize(11)
          .fillColor(colors.text)
          .font('Helvetica-Bold')
          .text(edu.degree || '', { continued: !!edu.field_of_study });

        if (edu.field_of_study) {
          doc.font('Helvetica')
            .text(` in ${edu.field_of_study}`);
        }

        doc.fontSize(10)
          .fillColor(colors.text)
          .font('Helvetica')
          .text(edu.institution || '');

        const dateStr = this._formatDateRange(edu.start_date, edu.end_date);
        const meta = [dateStr, edu.gpa ? `GPA: ${edu.gpa}` : null].filter(Boolean).join('  |  ');
        if (meta) {
          doc.fontSize(9)
            .fillColor(colors.muted)
            .text(meta);
        }

        if (i < resume.education.length - 1) {
          doc.moveDown(0.4);
        }
      });

      doc.moveDown(0.8);
    }

    // Skills
    const skills = resume.skills?.filter(Boolean);
    if (skills?.length > 0) {
      this._sectionTitle(doc, 'SKILLS', colors);
      doc.fontSize(10)
        .fillColor(colors.text)
        .font('Helvetica')
        .text(skills.join('  \u2022  '), { lineGap: 2 });
      doc.moveDown(0.8);
    }

    // Projects
    if (resume.projects?.length > 0) {
      this._sectionTitle(doc, 'PROJECTS', colors);

      resume.projects.forEach((proj, i) => {
        doc.fontSize(11)
          .fillColor(colors.text)
          .font('Helvetica-Bold')
          .text(proj.name || '');

        if (proj.description) {
          doc.fontSize(10)
            .fillColor(colors.text)
            .font('Helvetica')
            .text(proj.description, { lineGap: 1 });
        }

        if (proj.technologies) {
          doc.fontSize(9)
            .fillColor(colors.muted)
            .font('Helvetica-Oblique')
            .text(`Technologies: ${proj.technologies}`);
        }

        if (i < resume.projects.length - 1) {
          doc.moveDown(0.4);
        }
      });

      doc.moveDown(0.8);
    }

    // Certifications
    if (resume.certifications?.length > 0) {
      this._sectionTitle(doc, 'CERTIFICATIONS', colors);

      resume.certifications.forEach((cert) => {
        doc.fontSize(10)
          .fillColor(colors.text)
          .font('Helvetica-Bold')
          .text(cert.name || '', { continued: !!cert.issuer });

        if (cert.issuer) {
          doc.font('Helvetica')
            .fillColor(colors.secondary)
            .text(`  -  ${cert.issuer}`);
        }

        if (cert.date) {
          doc.fontSize(9)
            .fillColor(colors.muted)
            .text(this._formatDate(cert.date));
        }
      });

      doc.moveDown(0.8);
    }

    // Languages
    if (resume.languages?.length > 0) {
      this._sectionTitle(doc, 'LANGUAGES', colors);
      const langStr = resume.languages
        .map((l) => `${l.name} (${l.proficiency})`)
        .join('  \u2022  ');
      doc.fontSize(10)
        .fillColor(colors.text)
        .font('Helvetica')
        .text(langStr);
    }
  }

  async generateCoverLetterPDF({ coverLetterText, personalInfo, companyName, jobTitle }) {
    return new Promise((resolve, reject) => {
      try {
        const p = personalInfo || {};
        const name = `${p.first_name || ''} ${p.last_name || ''}`.trim();

        const doc = new PDFDocument({
          size: 'A4',
          margin: 60,
          info: {
            Title: `Cover Letter${jobTitle ? ` - ${jobTitle}` : ''}`,
            Author: name || 'CV Optimizer',
            Creator: 'CV Optimizer',
          },
        });

        // Sender info
        if (name) {
          doc.fontSize(14).fillColor('#1f2937').font('Helvetica-Bold').text(name);
        }
        const contacts = [p.email, p.phone, p.location].filter(Boolean);
        if (contacts.length > 0) {
          doc.fontSize(9).fillColor('#6b7280').font('Helvetica').text(contacts.join('  |  '));
        }

        doc.moveDown(1.5);

        // Date
        const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        doc.fontSize(10).fillColor('#4b5563').text(date);
        doc.moveDown(0.5);

        // Company
        if (companyName) {
          doc.fontSize(10).fillColor('#4b5563').text(companyName);
        }
        if (jobTitle) {
          doc.fontSize(10).fillColor('#4b5563').text(`Re: ${jobTitle}`);
        }

        doc.moveDown(1);

        // Body
        const paragraphs = coverLetterText.split('\n').filter((p) => p.trim());
        paragraphs.forEach((para) => {
          doc.fontSize(10.5).fillColor('#1f2937').font('Helvetica').text(para.trim(), {
            align: 'left',
            lineGap: 3,
          });
          doc.moveDown(0.8);
        });

        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  _getColors(template) {
    const palettes = {
      modern: { primary: '#2563eb', secondary: '#4b5563', text: '#1f2937', muted: '#6b7280' },
      professional: { primary: '#1e3a5f', secondary: '#374151', text: '#111827', muted: '#6b7280' },
      minimal: { primary: '#059669', secondary: '#4b5563', text: '#1f2937', muted: '#6b7280' },
      creative: { primary: '#d97706', secondary: '#4b5563', text: '#1f2937', muted: '#6b7280' },
      technical: { primary: '#7c3aed', secondary: '#4b5563', text: '#1f2937', muted: '#6b7280' },
      executive: { primary: '#1e3a5f', secondary: '#374151', text: '#111827', muted: '#6b7280' },
    };
    return palettes[template] || palettes.modern;
  }

  _sectionTitle(doc, title, colors) {
    doc.fontSize(12)
      .fillColor(colors.primary)
      .font('Helvetica-Bold')
      .text(title);

    const y = doc.y + 3;
    doc.moveTo(50, y)
      .lineTo(545, y)
      .strokeColor(colors.primary)
      .lineWidth(0.5)
      .stroke();

    doc.moveDown(0.4);
  }

  _drawLine(doc, color) {
    const y = doc.y;
    doc.moveTo(50, y)
      .lineTo(545, y)
      .strokeColor(color)
      .lineWidth(1)
      .stroke();
  }

  _formatDate(dateStr) {
    if (!dateStr) return '';
    const [year, month] = dateStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(month, 10) - 1] || ''} ${year}`;
  }

  _formatDateRange(start, end, current) {
    const s = this._formatDate(start);
    const e = current ? 'Present' : this._formatDate(end);
    if (!s && !e) return '';
    return `${s} - ${e}`;
  }
}

module.exports = new PDFService();
