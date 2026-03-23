const PDFDocument = require('pdfkit');

class PDFService {
  async generatePDF(resume, template = 'modern') {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 40, bottom: 40, left: 48, right: 48 },
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

    // Font mapping: Helvetica-Bold for headings (matches Inter bold), Times-Roman for body (matches Georgia)
    const FONT_HEADING = 'Helvetica-Bold';
    const FONT_HEADING_REGULAR = 'Helvetica';
    const FONT_BODY = 'Times-Roman';
    const FONT_BODY_ITALIC = 'Times-Italic';

    // Header - Name (centered, large, bold - Inter/Helvetica)
    doc.fontSize(22)
      .fillColor('#111827')
      .font(FONT_HEADING)
      .text(`${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Your Name', { align: 'center' });

    // Job title (centered, blue - Inter/Helvetica)
    if (p.job_title) {
      doc.fontSize(11)
        .fillColor(colors.primary)
        .font(FONT_HEADING_REGULAR)
        .text(p.job_title, { align: 'center' });
    }

    doc.moveDown(0.4);

    // Contact info (centered, with icons and clickable links)
    const contactItems = [];
    if (p.email) contactItems.push({ label: p.email, url: `mailto:${p.email}`, icon: 'mail' });
    if (p.phone) contactItems.push({ label: p.phone, url: `tel:${p.phone.replace(/\s/g, '')}`, icon: 'phone' });
    if (p.location) contactItems.push({ label: p.location, url: null, icon: 'pin' });
    if (p.linkedin) {
      const linkedinUrl = p.linkedin.startsWith('http') ? p.linkedin : `https://${p.linkedin}`;
      contactItems.push({ label: 'LinkedIn', url: linkedinUrl, icon: 'linkedin' });
    }
    if (p.website) {
      const websiteUrl = p.website.startsWith('http') ? p.website : `https://${p.website}`;
      let label;
      try {
        label = new URL(websiteUrl).hostname.replace(/^www\./, '');
      } catch {
        label = p.website;
      }
      contactItems.push({ label, url: websiteUrl, icon: 'globe' });
    }

    if (contactItems.length > 0) {
      const iconSize = 8;
      const iconGap = 3;  // gap between icon and text
      const itemGap = 14; // gap between contact items
      doc.fontSize(8.5).font(FONT_HEADING_REGULAR);

      // Calculate total width to center
      let totalWidth = 0;
      contactItems.forEach((item, idx) => {
        totalWidth += iconSize + iconGap + doc.widthOfString(item.label);
        if (idx < contactItems.length - 1) totalWidth += itemGap;
      });

      let curX = (doc.page.width - totalWidth) / 2;
      const curY = doc.y;

      contactItems.forEach((item, idx) => {
        // Draw icon
        this._drawContactIcon(doc, item.icon, curX, curY + 1, iconSize);
        curX += iconSize + iconGap;

        // Draw label
        const w = doc.widthOfString(item.label);
        if (item.url) {
          doc.fillColor('#4b5563')
            .text(item.label, curX, curY, { width: w + 1, lineBreak: false, link: item.url, underline: false });
        } else {
          doc.fillColor('#4b5563')
            .text(item.label, curX, curY, { width: w + 1, lineBreak: false });
        }
        curX += w;
        if (idx < contactItems.length - 1) {
          curX += itemGap;
        }
      });

      // Move cursor below the contact line
      doc.x = doc.page.margins.left;
      doc.y = curY + doc.currentLineHeight() + 2;
    }

    doc.moveDown(0.5);

    // Header divider line (blue, matching preview)
    const lineY = doc.y;
    doc.moveTo(doc.page.margins.left, lineY)
      .lineTo(doc.page.width - doc.page.margins.right, lineY)
      .strokeColor(colors.primary)
      .lineWidth(2)
      .stroke();

    doc.moveDown(0.6);

    // Summary
    if (resume.summary) {
      this._sectionTitle(doc, 'PROFESSIONAL SUMMARY', colors);
      doc.fontSize(10)
        .fillColor('#374151')
        .font(FONT_BODY)
        .text(resume.summary, { lineGap: 2 });
      doc.moveDown(0.7);
    }

    // Experience
    if (resume.work_experience?.length > 0) {
      this._sectionTitle(doc, 'EXPERIENCE', colors);

      resume.work_experience.forEach((exp, i) => {
        const dateStr = this._formatDateRange(exp.start_date, exp.end_date, exp.current);
        const left = doc.page.margins.left;
        const right = doc.page.width - doc.page.margins.right;
        const titleY = doc.y;

        // Draw date right-aligned FIRST (so we know how much space it takes)
        let dateWidth = 0;
        if (dateStr) {
          doc.fontSize(9).font(FONT_HEADING_REGULAR);
          dateWidth = doc.widthOfString(dateStr) + 10;
          doc.fillColor('#6b7280')
            .text(dateStr, right - dateWidth + 10, titleY, { width: dateWidth, lineBreak: false });
        }

        // Draw title on the left, constrained to not overlap the date
        const titleWidth = right - left - dateWidth;
        doc.fontSize(10.5).font(FONT_HEADING).fillColor('#111827');
        const titleText = exp.company
          ? `${exp.position || ''}  \u00B7  ${exp.company}`
          : (exp.position || '');
        doc.text(titleText, left, titleY, { width: titleWidth });
        const afterTitleY = doc.y;

        doc.x = left;
        doc.y = afterTitleY;

        // Location
        if (exp.location) {
          doc.fontSize(9)
            .fillColor('#6b7280')
            .font(FONT_BODY_ITALIC)
            .text(exp.location, left, doc.y, { width: right - left });
        }

        doc.moveDown(0.2);

        // Bullet points (hanging indent so wrapped lines align with text, not the bullet)
        if (exp.description?.length > 0) {
          const bulletIndent = 14;
          exp.description.filter(Boolean).forEach((bullet) => {
            const bulletY = doc.y;
            doc.fontSize(10).fillColor('#9ca3af').font(FONT_BODY)
              .text('\u2022', left, bulletY, { lineBreak: false });
            doc.fontSize(10).fillColor('#374151').font(FONT_BODY)
              .text(bullet, left + bulletIndent, bulletY, { width: right - left - bulletIndent, lineGap: 1 });
          });
        }

        if (i < resume.work_experience.length - 1) {
          doc.moveDown(0.5);
        }
      });

      doc.moveDown(0.7);
    }

    // Education
    if (resume.education?.length > 0) {
      this._sectionTitle(doc, 'EDUCATION', colors);

      resume.education.forEach((edu, i) => {
        const left = doc.page.margins.left;
        const right = doc.page.width - doc.page.margins.right;
        const eduY = doc.y;

        // Date right-aligned FIRST
        const dateStr = this._formatDateRange(edu.start_date, edu.end_date);
        let dateWidth = 0;
        if (dateStr) {
          doc.fontSize(9).font(FONT_HEADING_REGULAR);
          dateWidth = doc.widthOfString(dateStr) + 10;
          doc.fillColor('#6b7280')
            .text(dateStr, right - dateWidth + 10, eduY, { width: dateWidth, lineBreak: false });
        }

        // Degree + field on the left
        const titleWidth = right - left - dateWidth;
        const degreeText = edu.field_of_study
          ? `${edu.degree || ''} in ${edu.field_of_study}`
          : (edu.degree || '');
        doc.fontSize(10.5)
          .fillColor('#111827')
          .font(FONT_HEADING)
          .text(degreeText, left, eduY, { width: titleWidth });

        doc.x = left;

        const meta = [edu.institution, edu.gpa ? `GPA: ${edu.gpa}` : null].filter(Boolean).join(' - ');
        if (meta) {
          doc.fontSize(9.5)
            .fillColor('#6b7280')
            .font(FONT_BODY)
            .text(meta, left, doc.y, { width: right - left });
        }

        if (i < resume.education.length - 1) {
          doc.moveDown(0.4);
        }
      });

      doc.moveDown(0.7);
    }

    // Skills (rendered as tag chips matching preview)
    const skills = resume.skills?.filter(Boolean);
    if (skills?.length > 0) {
      this._sectionTitle(doc, 'SKILLS', colors);
      this._renderSkillTags(doc, skills);
      doc.moveDown(0.7);
    }

    // Projects
    if (resume.projects?.length > 0) {
      this._sectionTitle(doc, 'PROJECTS', colors);

      const left = doc.page.margins.left;
      const right = doc.page.width - doc.page.margins.right;

      resume.projects.forEach((proj, i) => {
        // Project name
        doc.fontSize(10.5)
          .fillColor('#111827')
          .font(FONT_HEADING)
          .text(proj.name || '', left, doc.y, { width: right - left });

        // Project URL as clickable link
        if (proj.url) {
          const projUrl = proj.url.startsWith('http') ? proj.url : `https://${proj.url}`;
          let label;
          try {
            const parsed = new URL(projUrl);
            label = parsed.hostname.includes('github.com')
              ? `GitHub: ${parsed.pathname.replace(/^\//, '')}`
              : parsed.hostname.replace(/^www\./, '') + parsed.pathname.replace(/\/$/, '');
          } catch {
            label = proj.url;
          }
          doc.fontSize(9)
            .fillColor('#2563eb')
            .font(FONT_HEADING_REGULAR)
            .text(label, left, doc.y, { width: right - left, link: projUrl });
        }

        if (proj.description) {
          doc.fontSize(10)
            .fillColor('#374151')
            .font(FONT_BODY)
            .text(proj.description, left, doc.y, { width: right - left, lineGap: 1 });
        }

        if (proj.technologies) {
          doc.fontSize(9)
            .fillColor('#6b7280')
            .font(FONT_BODY_ITALIC)
            .text(`Tech: ${proj.technologies}`, left, doc.y, { width: right - left });
        }

        if (i < resume.projects.length - 1) {
          doc.moveDown(0.4);
        }
      });

      doc.moveDown(0.7);
    }

    // Certifications
    if (resume.certifications?.length > 0) {
      this._sectionTitle(doc, 'CERTIFICATIONS', colors);

      resume.certifications.forEach((cert) => {
        doc.fontSize(10)
          .fillColor('#111827')
          .font(FONT_HEADING)
          .text(cert.name || '', { continued: !!cert.issuer });

        if (cert.issuer) {
          doc.font(FONT_BODY)
            .fillColor('#4b5563')
            .text(` - ${cert.issuer}`);
        }

        if (cert.date) {
          doc.fontSize(9)
            .fillColor('#6b7280')
            .font(FONT_BODY)
            .text(this._formatDate(cert.date));
        }
      });

      doc.moveDown(0.7);
    }

    // Languages (inline with bullet separators)
    if (resume.languages?.length > 0) {
      this._sectionTitle(doc, 'LANGUAGES', colors);
      const langStr = resume.languages
        .map((l) => `${l.name} (${l.proficiency})`)
        .join('  \u2022  ');
      doc.fontSize(10)
        .fillColor('#374151')
        .font(FONT_BODY)
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

  _renderSkillTags(doc, skills) {
    const padX = 8;
    const padY = 3;
    const gap = 6;
    const lineHeight = 20;
    const leftMargin = doc.page.margins.left;
    const maxX = doc.page.width - doc.page.margins.right;
    let curX = leftMargin;
    let curY = doc.y;

    skills.forEach((skill) => {
      doc.font('Helvetica').fontSize(9);
      const textWidth = doc.widthOfString(skill);
      const tagWidth = textWidth + padX * 2;

      // Wrap to next line if tag doesn't fit
      if (curX + tagWidth > maxX && curX > leftMargin) {
        curX = leftMargin;
        curY += lineHeight;
      }

      // Draw tag border
      doc.roundedRect(curX, curY, tagWidth, lineHeight - 4, 3)
        .strokeColor('#e5e7eb')
        .lineWidth(0.75)
        .fillAndStroke('#f3f4f6', '#e5e7eb');

      // Draw tag text
      doc.fillColor('#374151')
        .text(skill, curX + padX, curY + padY, { lineBreak: false });

      curX += tagWidth + gap;
    });

    // Move doc cursor below the last row of tags
    doc.y = curY + lineHeight + 4;
    doc.x = leftMargin;
  }

  _drawContactIcon(doc, icon, x, y, size) {
    const s = size;
    const cx = x + s / 2;
    const cy = y + s / 2;
    doc.save();
    doc.strokeColor('#6b7280').fillColor('#6b7280').lineWidth(0.6);

    switch (icon) {
      case 'mail':
        // Envelope: rectangle + V shape
        doc.rect(x, y + s * 0.2, s, s * 0.6).stroke();
        doc.moveTo(x, y + s * 0.2).lineTo(cx, cy + s * 0.05).lineTo(x + s, y + s * 0.2).stroke();
        break;
      case 'phone':
        // Phone handset approximation
        doc.moveTo(x + s * 0.25, y + s * 0.1)
          .lineTo(x + s * 0.45, y + s * 0.1)
          .lineTo(x + s * 0.45, y + s * 0.35)
          .lineTo(x + s * 0.55, y + s * 0.45)
          .lineTo(x + s * 0.55, y + s * 0.65)
          .lineTo(x + s * 0.75, y + s * 0.65)
          .lineTo(x + s * 0.75, y + s * 0.9)
          .lineTo(x + s * 0.55, y + s * 0.9)
          .lineTo(x + s * 0.25, y + s * 0.6)
          .closePath().stroke();
        break;
      case 'pin':
        // Map pin: circle + triangle
        doc.circle(cx, y + s * 0.35, s * 0.25).stroke();
        doc.moveTo(cx - s * 0.2, y + s * 0.5)
          .lineTo(cx, y + s * 0.9)
          .lineTo(cx + s * 0.2, y + s * 0.5).stroke();
        break;
      case 'linkedin':
        // "in" text styled as icon
        doc.font('Helvetica-Bold').fontSize(s * 0.85)
          .fillColor('#6b7280')
          .text('in', x, y - s * 0.05, { width: s, lineBreak: false });
        break;
      case 'globe':
        // Circle with horizontal + vertical lines
        doc.circle(cx, cy, s * 0.4).stroke();
        doc.moveTo(x + s * 0.1, cy).lineTo(x + s * 0.9, cy).stroke();
        doc.ellipse(cx, cy, s * 0.2, s * 0.4).stroke();
        break;
      default:
        break;
    }

    doc.restore();
  }

  _sectionTitle(doc, title, colors) {
    doc.fontSize(11)
      .fillColor('#111827')
      .font('Helvetica-Bold')
      .text(title, { characterSpacing: 1 });

    const y = doc.y + 2;
    doc.moveTo(doc.page.margins.left, y)
      .lineTo(doc.page.width - doc.page.margins.right, y)
      .strokeColor('#e5e7eb')
      .lineWidth(0.5)
      .stroke();

    doc.moveDown(0.35);
  }

  _drawLine(doc, color) {
    const y = doc.y;
    doc.moveTo(doc.page.margins.left, y)
      .lineTo(doc.page.width - doc.page.margins.right, y)
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
