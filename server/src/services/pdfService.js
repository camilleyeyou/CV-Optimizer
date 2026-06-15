const PDFDocument = require('pdfkit');
const { getTemplate } = require('../templateRegistry');

const SIDEBAR_SECTIONS = ['skills', 'languages'];

class PDFService {
  async generatePDF(resume, template = 'modern') {
    return new Promise((resolve, reject) => {
      try {
        const spec = getTemplate(template);
        const theme = this._buildTheme(spec);
        const margins = this._marginsFor(spec, theme);

        const p = resume.personal_info || {};
        const doc = new PDFDocument({
          size: 'A4',
          margins,
          info: {
            Title: `${p.first_name || ''} ${p.last_name || ''} - Resume`,
            Author: `${p.first_name || ''} ${p.last_name || ''}`,
            Creator: 'CV Optimizer',
          },
        });

        if (spec.archetype === 'sidebar') {
          this._renderSidebar(doc, resume, spec, theme);
        } else if (spec.archetype === 'header-band') {
          this._renderHeaderBand(doc, resume, spec, theme);
        } else {
          this._renderSingleColumn(doc, resume, spec, theme);
        }

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

  // ---- Theme & layout ------------------------------------------------------
  _buildTheme(spec) {
    const serifHeading = spec.headingFamily === 'serif';
    const serifBody = spec.fontFamily === 'serif';
    return {
      accent: spec.accent || '#2563eb',
      accent2: spec.accent2 || spec.accent || '#2563eb',
      sidebarBg: spec.sidebarBg || spec.accent || '#1d4ed8',
      sidebarText: spec.sidebarText || '#ffffff',
      sectionTitle: spec.sectionTitle || 'underline',
      skillsStyle: spec.skillsStyle || 'tags',
      archetype: spec.archetype,
      headingBold: serifHeading ? 'Times-Bold' : 'Helvetica-Bold',
      heading: serifHeading ? 'Times-Roman' : 'Helvetica',
      body: serifBody ? 'Times-Roman' : 'Helvetica',
      bodyItalic: serifBody ? 'Times-Italic' : 'Helvetica-Oblique',
      name: '#111827',
      text: '#374151',
      muted: '#6b7280',
      compact: spec.archetype === 'compact',
    };
  }

  _marginsFor(spec) {
    if (spec.archetype === 'sidebar') {
      // Main column begins to the right of the sidebar; sidebar painted manually.
      const sidebarWidth = 200;
      return { top: 40, bottom: 40, left: sidebarWidth + 24, right: 40, _sidebarWidth: sidebarWidth };
    }
    if (spec.archetype === 'compact') {
      return { top: 32, bottom: 32, left: 40, right: 40 };
    }
    return { top: 40, bottom: 40, left: 48, right: 48 };
  }

  _region(doc) {
    return {
      left: doc.page.margins.left,
      right: doc.page.width - doc.page.margins.right,
      get width() {
        return this.right - this.left;
      },
    };
  }

  // ---- Top-level archetype renderers --------------------------------------
  _renderSingleColumn(doc, resume, spec, theme) {
    const align = spec.archetype === 'classic-centered' ? 'center' : 'left';
    this._renderHeader(doc, resume, theme, { align });
    const region = this._region(doc);
    spec.sectionOrder.forEach((key) => this._section(doc, key, resume, theme, region));
  }

  _renderHeaderBand(doc, resume, spec, theme) {
    const p = resume.personal_info || {};
    const pageW = doc.page.width;
    const sidePad = 48;
    const innerW = pageW - sidePad * 2;
    const name = `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Your Name';

    // Pre-measure to size the band.
    doc.fontSize(22).font(theme.headingBold);
    const nameH = doc.heightOfString(name, { width: innerW, align: 'center' });
    let titleH = 0;
    if (p.job_title) {
      doc.fontSize(11).font(theme.heading);
      titleH = doc.heightOfString(p.job_title, { width: innerW, align: 'center' }) + 2;
    }
    const contactItems = this._buildContactItems(p);
    const contactH = contactItems.length ? 16 : 0;
    const topPad = 30;
    const botPad = 22;
    const bandH = topPad + nameH + titleH + contactH + botPad;

    // Band fill (gradient; solid when accent2 === accent).
    const grad = doc.linearGradient(0, 0, pageW, bandH);
    grad.stop(0, theme.accent).stop(1, theme.accent2);
    doc.rect(0, 0, pageW, bandH).fill(grad);

    // Reversed-out header text.
    let y = topPad;
    doc.fillColor(theme.sidebarText).font(theme.headingBold).fontSize(22)
      .text(name, sidePad, y, { width: innerW, align: 'center' });
    y = doc.y;
    if (p.job_title) {
      doc.font(theme.heading).fontSize(11).fillColor(theme.sidebarText)
        .text(p.job_title, sidePad, y + 1, { width: innerW, align: 'center' });
      y = doc.y;
    }
    if (contactItems.length) {
      this._contactLineCentered(doc, contactItems, theme, {
        y: y + 4, color: theme.sidebarText, iconColor: theme.sidebarText, width: innerW, left: sidePad,
      });
    }

    doc.x = doc.page.margins.left;
    doc.y = bandH + 20;

    const region = this._region(doc);
    spec.sectionOrder.forEach((key) => this._section(doc, key, resume, theme, region));
  }

  _renderSidebar(doc, resume, spec, theme) {
    const p = resume.personal_info || {};
    const sidebarWidth = doc.page.margins._sidebarWidth || 200;
    const pageH = doc.page.height;

    // Paint the sidebar band on the first (and any subsequent) page.
    const paintSidebar = () => {
      doc.save();
      doc.rect(0, 0, sidebarWidth, pageH).fill(theme.sidebarBg);
      doc.restore();
    };
    paintSidebar();
    doc.on('pageAdded', paintSidebar);

    // --- Sidebar content (manual layout, page 1) ---
    const pad = 22;
    const sx = pad;
    const sw = sidebarWidth - pad * 2;
    let sy = 34;

    const name = `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Your Name';
    doc.fillColor(theme.sidebarText).font(theme.headingBold).fontSize(17)
      .text(name, sx, sy, { width: sw });
    sy = doc.y + 2;
    if (p.job_title) {
      doc.font(theme.heading).fontSize(10).fillColor(theme.sidebarText)
        .text(p.job_title, sx, sy, { width: sw });
      sy = doc.y;
    }
    sy += 12;

    // Contact (stacked)
    const contactItems = this._buildContactItems(p);
    contactItems.forEach((item) => {
      doc.font(theme.heading).fontSize(8.5).fillColor(theme.sidebarText);
      const h = doc.heightOfString(item.label, { width: sw - 12 });
      this._drawContactIcon(doc, item.icon, sx, sy + 1, 8, theme.sidebarText);
      doc.fillColor(theme.sidebarText)
        .text(item.label, sx + 12, sy, { width: sw - 12, link: item.url || null });
      sy += Math.max(h, 11) + 4;
    });
    sy += 8;

    // Sidebar sections (skills, languages)
    const sidebarKeys = spec.sectionOrder.filter((k) => SIDEBAR_SECTIONS.includes(k));
    sidebarKeys.forEach((key) => {
      sy = this._sidebarSection(doc, key, resume, theme, sx, sw, sy);
      sy += 10;
    });

    // --- Main column content (normal flow within margins) ---
    const mainKeys = spec.sectionOrder.filter((k) => !SIDEBAR_SECTIONS.includes(k));
    doc.x = doc.page.margins.left;
    doc.y = doc.page.margins.top;
    const region = this._region(doc);

    // Main header: name already in sidebar, so lead with summary etc. Add a slim title.
    if (p.job_title || mainKeys.length) {
      // No duplicate name; main column starts with sections.
    }
    mainKeys.forEach((key) => this._section(doc, key, resume, theme, region));
  }

  // ---- Header (single column / classic) -----------------------------------
  _renderHeader(doc, resume, theme, { align }) {
    const p = resume.personal_info || {};
    const region = this._region(doc);
    const name = `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Your Name';

    doc.fontSize(theme.compact ? 19 : 22).fillColor(theme.name).font(theme.headingBold)
      .text(name, region.left, doc.y, { width: region.width, align });

    if (p.job_title) {
      doc.fontSize(11).fillColor(theme.accent).font(theme.heading)
        .text(p.job_title, { width: region.width, align });
    }

    doc.moveDown(0.4);

    const contactItems = this._buildContactItems(p);
    if (contactItems.length) {
      if (align === 'center') {
        this._contactLineCentered(doc, contactItems, theme, {
          y: doc.y, color: theme.muted, iconColor: theme.muted, width: region.width, left: region.left,
        });
      } else {
        this._contactLineLeft(doc, contactItems, theme, region);
      }
    }

    doc.moveDown(0.5);

    // Header divider (accent), skip for plain-minimal feel handled via thinner rule.
    const lineY = doc.y;
    doc.moveTo(region.left, lineY).lineTo(region.right, lineY)
      .strokeColor(theme.accent).lineWidth(2).stroke();
    doc.moveDown(0.6);
    doc.x = region.left;
  }

  _buildContactItems(p) {
    const items = [];
    if (p.email) items.push({ label: p.email, url: `mailto:${p.email}`, icon: 'mail' });
    if (p.phone) items.push({ label: p.phone, url: `tel:${p.phone.replace(/\s/g, '')}`, icon: 'phone' });
    if (p.location) items.push({ label: p.location, url: null, icon: 'pin' });
    if (p.linkedin) {
      const url = p.linkedin.startsWith('http') ? p.linkedin : `https://${p.linkedin}`;
      items.push({ label: 'LinkedIn', url, icon: 'linkedin' });
    }
    if (p.website) {
      const url = p.website.startsWith('http') ? p.website : `https://${p.website}`;
      let label;
      try {
        label = new URL(url).hostname.replace(/^www\./, '');
      } catch {
        label = p.website;
      }
      items.push({ label, url, icon: 'globe' });
    }
    return items;
  }

  _contactLineCentered(doc, items, theme, { y, color, iconColor, width, left }) {
    const iconSize = 8;
    const iconGap = 3;
    const itemGap = 14;
    doc.fontSize(8.5).font(theme.heading);

    let totalWidth = 0;
    items.forEach((item, idx) => {
      totalWidth += iconSize + iconGap + doc.widthOfString(item.label);
      if (idx < items.length - 1) totalWidth += itemGap;
    });

    let curX = left + (width - totalWidth) / 2;
    items.forEach((item, idx) => {
      this._drawContactIcon(doc, item.icon, curX, y + 1, iconSize, iconColor);
      curX += iconSize + iconGap;
      const w = doc.widthOfString(item.label);
      doc.fillColor(color).text(item.label, curX, y, { width: w + 1, lineBreak: false, link: item.url || null });
      curX += w;
      if (idx < items.length - 1) curX += itemGap;
    });
    doc.x = doc.page.margins.left;
    doc.y = y + doc.currentLineHeight() + 2;
  }

  _contactLineLeft(doc, items, theme, region) {
    const iconSize = 8;
    const iconGap = 3;
    const itemGap = 14;
    doc.fontSize(8.5).font(theme.heading);
    let curX = region.left;
    const y = doc.y;
    items.forEach((item, idx) => {
      const w = doc.widthOfString(item.label);
      // Wrap if needed
      if (curX + iconSize + iconGap + w > region.right && curX > region.left) {
        // simple single-line assumption; keep on one line
      }
      this._drawContactIcon(doc, item.icon, curX, y + 1, iconSize, theme.muted);
      curX += iconSize + iconGap;
      doc.fillColor(theme.muted).text(item.label, curX, y, { width: w + 1, lineBreak: false, link: item.url || null });
      curX += w;
      if (idx < items.length - 1) curX += itemGap;
    });
    doc.x = region.left;
    doc.y = y + doc.currentLineHeight() + 2;
  }

  // ---- Section title (styled per spec) ------------------------------------
  _sectionTitle(doc, title, theme, region) {
    const style = theme.sectionTitle;
    const startY = doc.y;

    if (style === 'pill') {
      doc.fontSize(9.5).font(theme.headingBold);
      const tw = doc.widthOfString(title.toUpperCase());
      const padX = 8;
      const h = 15;
      doc.roundedRect(region.left, startY, tw + padX * 2, h, 7).fill(theme.accent);
      doc.fillColor('#ffffff').text(title.toUpperCase(), region.left + padX, startY + 3.5, { lineBreak: false });
      doc.x = region.left;
      doc.y = startY + h + 4;
      return;
    }

    if (style === 'bar') {
      doc.fontSize(11).font(theme.headingBold);
      const h = doc.currentLineHeight();
      doc.rect(region.left, startY + 1, 3.5, h - 2).fill(theme.accent);
      doc.fillColor(theme.name).font(theme.headingBold).fontSize(11)
        .text(title.toUpperCase(), region.left + 9, startY, { characterSpacing: 1, width: region.width - 9 });
      doc.moveDown(0.35);
      doc.x = region.left;
      return;
    }

    // Text-based styles (underline / rule / plain / smallcaps / bracket)
    const isSmallcaps = style === 'smallcaps';
    const titleColor = (style === 'underline' || style === 'smallcaps') ? theme.accent : theme.name;
    const label = isSmallcaps ? title.replace(/\b\w/g, (c) => c.toUpperCase()) : title.toUpperCase();
    const prefix = style === 'bracket' ? '# ' : '';

    doc.fontSize(11).fillColor(titleColor).font(theme.headingBold);
    if (prefix) {
      doc.text(prefix, region.left, startY, { continued: true, characterSpacing: isSmallcaps ? 2 : 1 })
        .fillColor(theme.name).text(label, { characterSpacing: isSmallcaps ? 2 : 1 });
    } else {
      doc.text(label, region.left, startY, { characterSpacing: isSmallcaps ? 2 : 1, width: region.width });
    }

    const ruleY = doc.y + 2;
    if (style === 'underline') {
      doc.moveTo(region.left, ruleY).lineTo(region.right, ruleY).strokeColor(theme.accent).lineWidth(1.5).stroke();
    } else if (style === 'rule' || style === 'bracket' || style === 'smallcaps') {
      doc.moveTo(region.left, ruleY).lineTo(region.right, ruleY)
        .strokeColor(style === 'smallcaps' ? theme.accent : '#d1d5db').lineWidth(0.6).stroke();
    }
    // 'plain' draws no rule.

    doc.moveDown(style === 'plain' ? 0.3 : 0.4);
    doc.x = region.left;
  }

  // ---- Body sections -------------------------------------------------------
  _section(doc, key, resume, theme, region) {
    switch (key) {
      case 'summary':
        if (resume.summary) {
          this._sectionTitle(doc, 'Professional Summary', theme, region);
          doc.fontSize(theme.compact ? 9.5 : 10).fillColor(theme.text).font(theme.body)
            .text(resume.summary, region.left, doc.y, { width: region.width, lineGap: 2 });
          doc.moveDown(theme.compact ? 0.5 : 0.7);
          doc.x = region.left;
        }
        break;

      case 'experience':
        if (resume.work_experience?.length > 0) {
          this._sectionTitle(doc, 'Experience', theme, region);
          resume.work_experience.forEach((exp, i) => {
            this._entryWithDate(
              doc, theme, region,
              exp.company ? `${exp.position || ''}  ·  ${exp.company}` : (exp.position || ''),
              this._formatDateRange(exp.start_date, exp.end_date, exp.current),
            );
            if (exp.location) {
              doc.fontSize(9).fillColor(theme.muted).font(theme.bodyItalic)
                .text(exp.location, region.left, doc.y, { width: region.width });
            }
            doc.moveDown(0.2);
            const bullets = (exp.description || []).filter(Boolean);
            if (bullets.length) {
              const indent = 14;
              bullets.forEach((bullet) => {
                const by = doc.y;
                doc.fontSize(theme.compact ? 9.5 : 10).fillColor(theme.accent).font(theme.body)
                  .text('•', region.left, by, { lineBreak: false });
                doc.fillColor(theme.text).font(theme.body)
                  .text(bullet, region.left + indent, by, { width: region.width - indent, lineGap: 1 });
              });
            }
            if (i < resume.work_experience.length - 1) doc.moveDown(theme.compact ? 0.35 : 0.5);
          });
          doc.moveDown(theme.compact ? 0.5 : 0.7);
          doc.x = region.left;
        }
        break;

      case 'education':
        if (resume.education?.length > 0) {
          this._sectionTitle(doc, 'Education', theme, region);
          resume.education.forEach((edu, i) => {
            this._entryWithDate(
              doc, theme, region,
              edu.field_of_study ? `${edu.degree || ''} in ${edu.field_of_study}` : (edu.degree || ''),
              this._formatDateRange(edu.start_date, edu.end_date),
            );
            const meta = [edu.institution, edu.gpa ? `GPA: ${edu.gpa}` : null].filter(Boolean).join(' - ');
            if (meta) {
              doc.fontSize(9.5).fillColor(theme.muted).font(theme.body)
                .text(meta, region.left, doc.y, { width: region.width });
            }
            if (i < resume.education.length - 1) doc.moveDown(0.4);
          });
          doc.moveDown(theme.compact ? 0.5 : 0.7);
          doc.x = region.left;
        }
        break;

      case 'skills': {
        const skills = (resume.skills || []).filter(Boolean);
        if (skills.length) {
          this._sectionTitle(doc, 'Skills', theme, region);
          this._renderSkills(doc, skills, theme, region);
          doc.moveDown(theme.compact ? 0.5 : 0.7);
          doc.x = region.left;
        }
        break;
      }

      case 'projects':
        if (resume.projects?.length > 0) {
          this._sectionTitle(doc, 'Projects', theme, region);
          resume.projects.forEach((proj, i) => {
            doc.fontSize(10.5).fillColor(theme.name).font(theme.headingBold)
              .text(proj.name || '', region.left, doc.y, { width: region.width });
            if (proj.url) {
              const url = proj.url.startsWith('http') ? proj.url : `https://${proj.url}`;
              let label;
              try {
                const parsed = new URL(url);
                label = parsed.hostname.includes('github.com')
                  ? `GitHub: ${parsed.pathname.replace(/^\//, '')}`
                  : parsed.hostname.replace(/^www\./, '') + parsed.pathname.replace(/\/$/, '');
              } catch {
                label = proj.url;
              }
              doc.fontSize(9).fillColor(theme.accent).font(theme.heading)
                .text(label, region.left, doc.y, { width: region.width, link: url });
            }
            if (proj.description) {
              doc.fontSize(10).fillColor(theme.text).font(theme.body)
                .text(proj.description, region.left, doc.y, { width: region.width, lineGap: 1 });
            }
            if (proj.technologies) {
              doc.fontSize(9).fillColor(theme.muted).font(theme.bodyItalic)
                .text(`Tech: ${proj.technologies}`, region.left, doc.y, { width: region.width });
            }
            if (i < resume.projects.length - 1) doc.moveDown(0.4);
          });
          doc.moveDown(theme.compact ? 0.5 : 0.7);
          doc.x = region.left;
        }
        break;

      case 'certifications':
        if (resume.certifications?.length > 0) {
          this._sectionTitle(doc, 'Certifications', theme, region);
          resume.certifications.forEach((cert) => {
            doc.fontSize(10).fillColor(theme.name).font(theme.headingBold)
              .text(cert.name || '', region.left, doc.y, { width: region.width, continued: !!cert.issuer });
            if (cert.issuer) {
              doc.font(theme.body).fillColor(theme.text).text(` - ${cert.issuer}`);
            }
            if (cert.date) {
              doc.fontSize(9).fillColor(theme.muted).font(theme.body)
                .text(this._formatDate(cert.date), region.left, doc.y, { width: region.width });
            }
          });
          doc.moveDown(theme.compact ? 0.5 : 0.7);
          doc.x = region.left;
        }
        break;

      case 'languages':
        if (resume.languages?.length > 0) {
          this._sectionTitle(doc, 'Languages', theme, region);
          const langStr = resume.languages.map((l) => `${l.name} (${l.proficiency})`).join('  •  ');
          doc.fontSize(10).fillColor(theme.text).font(theme.body)
            .text(langStr, region.left, doc.y, { width: region.width });
          doc.moveDown(0.5);
          doc.x = region.left;
        }
        break;

      default:
        break;
    }
  }

  _entryWithDate(doc, theme, region, titleText, dateStr) {
    const titleY = doc.y;
    let dateWidth = 0;
    if (dateStr) {
      doc.fontSize(9).font(theme.heading);
      dateWidth = doc.widthOfString(dateStr) + 10;
      doc.fillColor(theme.muted).text(dateStr, region.right - dateWidth + 10, titleY, { width: dateWidth, lineBreak: false });
    }
    doc.fontSize(10.5).font(theme.headingBold).fillColor(theme.name)
      .text(titleText, region.left, titleY, { width: region.width - dateWidth });
    doc.x = region.left;
  }

  _renderSkills(doc, skills, theme, region) {
    if (theme.skillsStyle === 'inline') {
      doc.fontSize(10).fillColor(theme.text).font(theme.body)
        .text(skills.join('  ·  '), region.left, doc.y, { width: region.width, lineGap: 2 });
      doc.x = region.left;
      return;
    }
    if (theme.skillsStyle === 'bars') {
      const colW = (region.width - 20) / 2;
      const barW = 70;
      let col = 0;
      let rowY = doc.y;
      skills.forEach((skill, i) => {
        const x = region.left + col * (colW + 20);
        doc.fontSize(9).fillColor(theme.text).font(theme.body)
          .text(skill, x, rowY, { width: colW - barW - 6, lineBreak: false });
        const barX = x + colW - barW;
        const pct = (70 + ((i * 7) % 30)) / 100;
        doc.roundedRect(barX, rowY + 2, barW, 5, 2).fill('#e5e7eb');
        doc.roundedRect(barX, rowY + 2, barW * pct, 5, 2).fill(theme.accent);
        col += 1;
        if (col === 2) { col = 0; rowY += 15; }
      });
      doc.y = col === 0 ? rowY : rowY + 15;
      doc.x = region.left;
      return;
    }
    // tags
    this._renderSkillTags(doc, skills, theme, region);
  }

  _renderSkillTags(doc, skills, theme, region) {
    const padX = 8;
    const gap = 6;
    const lineHeight = 18;
    let curX = region.left;
    let curY = doc.y;
    skills.forEach((skill) => {
      doc.font(theme.heading).fontSize(9);
      const textWidth = doc.widthOfString(skill);
      const tagWidth = textWidth + padX * 2;
      if (curX + tagWidth > region.right && curX > region.left) {
        curX = region.left;
        curY += lineHeight;
      }
      doc.roundedRect(curX, curY, tagWidth, lineHeight - 4, 3).fillAndStroke('#f3f4f6', '#e5e7eb');
      doc.fillColor(theme.text).text(skill, curX + padX, curY + 3, { lineBreak: false });
      curX += tagWidth + gap;
    });
    doc.y = curY + lineHeight;
    doc.x = region.left;
  }

  // ---- Sidebar sections (manual layout) -----------------------------------
  _sidebarSection(doc, key, resume, theme, x, w, startY) {
    let y = startY;
    const titleColor = theme.sidebarText;

    const title = (label) => {
      doc.fontSize(10).font(theme.headingBold).fillColor(titleColor)
        .text(label.toUpperCase(), x, y, { width: w, characterSpacing: 1 });
      y = doc.y + 2;
      doc.moveTo(x, y).lineTo(x + w, y).strokeColor(titleColor).opacity(0.4).lineWidth(0.5).stroke().opacity(1);
      y += 6;
    };

    if (key === 'skills') {
      const skills = (resume.skills || []).filter(Boolean);
      if (!skills.length) return y;
      title('Skills');
      skills.forEach((skill) => {
        doc.fontSize(9).font(theme.body).fillColor(theme.sidebarText);
        const h = doc.heightOfString(skill, { width: w });
        doc.text(skill, x, y, { width: w });
        y += Math.max(h, 11) + 2;
      });
    } else if (key === 'languages') {
      const langs = resume.languages || [];
      if (!langs.length) return y;
      title('Languages');
      langs.forEach((l) => {
        doc.fontSize(9).font(theme.body).fillColor(theme.sidebarText)
          .text(`${l.name} (${l.proficiency})`, x, y, { width: w });
        y = doc.y + 2;
      });
    }
    return y;
  }

  // ---- Cover letter (unchanged behavior) ----------------------------------
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

        if (name) doc.fontSize(14).fillColor('#1f2937').font('Helvetica-Bold').text(name);
        const contacts = [p.email, p.phone, p.location].filter(Boolean);
        if (contacts.length > 0) {
          doc.fontSize(9).fillColor('#6b7280').font('Helvetica').text(contacts.join('  |  '));
        }
        doc.moveDown(1.5);

        const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        doc.fontSize(10).fillColor('#4b5563').text(date);
        doc.moveDown(0.5);

        if (companyName) doc.fontSize(10).fillColor('#4b5563').text(companyName);
        if (jobTitle) doc.fontSize(10).fillColor('#4b5563').text(`Re: ${jobTitle}`);
        doc.moveDown(1);

        const paragraphs = coverLetterText.split('\n').filter((para) => para.trim());
        paragraphs.forEach((para) => {
          doc.fontSize(10.5).fillColor('#1f2937').font('Helvetica').text(para.trim(), { align: 'left', lineGap: 3 });
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

  // ---- Icons & date helpers -----------------------------------------------
  _drawContactIcon(doc, icon, x, y, size, color) {
    const s = size;
    const cx = x + s / 2;
    const cy = y + s / 2;
    const stroke = color || '#6b7280';
    doc.save();
    doc.strokeColor(stroke).fillColor(stroke).lineWidth(0.6);
    switch (icon) {
      case 'mail':
        doc.rect(x, y + s * 0.2, s, s * 0.6).stroke();
        doc.moveTo(x, y + s * 0.2).lineTo(cx, cy + s * 0.05).lineTo(x + s, y + s * 0.2).stroke();
        break;
      case 'phone':
        doc.moveTo(x + s * 0.25, y + s * 0.1)
          .lineTo(x + s * 0.45, y + s * 0.1).lineTo(x + s * 0.45, y + s * 0.35)
          .lineTo(x + s * 0.55, y + s * 0.45).lineTo(x + s * 0.55, y + s * 0.65)
          .lineTo(x + s * 0.75, y + s * 0.65).lineTo(x + s * 0.75, y + s * 0.9)
          .lineTo(x + s * 0.55, y + s * 0.9).lineTo(x + s * 0.25, y + s * 0.6)
          .closePath().stroke();
        break;
      case 'pin':
        doc.circle(cx, y + s * 0.35, s * 0.25).stroke();
        doc.moveTo(cx - s * 0.2, y + s * 0.5).lineTo(cx, y + s * 0.9).lineTo(cx + s * 0.2, y + s * 0.5).stroke();
        break;
      case 'linkedin':
        doc.font('Helvetica-Bold').fontSize(s * 0.85).fillColor(stroke)
          .text('in', x, y - s * 0.05, { width: s, lineBreak: false });
        break;
      case 'globe':
        doc.circle(cx, cy, s * 0.4).stroke();
        doc.moveTo(x + s * 0.1, cy).lineTo(x + s * 0.9, cy).stroke();
        doc.ellipse(cx, cy, s * 0.2, s * 0.4).stroke();
        break;
      default:
        break;
    }
    doc.restore();
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
