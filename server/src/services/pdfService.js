const PDFDocument = require('pdfkit');
const {
  getTemplate, getPage, getLayout, getSpacing, getType, getSeparators,
} = require('../templateRegistry');
const fonts = require('./fontService');

const SIDEBAR_SECTIONS = ['skills', 'languages'];

const PAGE = getPage();
const SP = getSpacing();
const SEP = getSeparators();

class PDFService {
  async generatePDF(resume, template = 'modern') {
    return new Promise((resolve, reject) => {
      try {
        const spec = getTemplate(template);
        const theme = this._buildTheme(spec);
        const layout = getLayout(spec.archetype);

        const p = resume.personal_info || {};
        const doc = new PDFDocument({
          size: [PAGE.width, PAGE.height],
          margins: { ...layout.margins },
          info: {
            Title: `${p.first_name || ''} ${p.last_name || ''} - Resume`,
            Author: `${p.first_name || ''} ${p.last_name || ''}`,
            Creator: 'CV Optimizer',
          },
        });

        // Bind the embedded font faces before anything is drawn. Without this
        // every non-Latin-1 codepoint is silently dropped by PDFKit's built-in
        // Helvetica/Times.
        fonts.attach(doc, {
          fontFamily: spec.fontFamily,
          headingFamily: spec.headingFamily,
          rtlDocument: fonts.isPredominantlyRTL(resume),
        });

        if (spec.archetype === 'sidebar') {
          this._renderSidebar(doc, resume, spec, theme, layout);
        } else if (spec.archetype === 'header-band') {
          this._renderHeaderBand(doc, resume, spec, theme, layout);
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

  // ---- Theme ---------------------------------------------------------------
  _buildTheme(spec) {
    return {
      accent: spec.accent || '#2563eb',
      accent2: spec.accent2 || spec.accent || '#2563eb',
      sidebarBg: spec.sidebarBg || spec.accent || '#1d4ed8',
      sidebarText: spec.sidebarText || '#ffffff',
      sectionTitle: spec.sectionTitle || 'underline',
      skillsStyle: spec.skillsStyle || 'tags',
      archetype: spec.archetype,
      // Per-template section headings, e.g. an academic CV calling the
      // projects section "Publications". Keys are section ids.
      sectionLabels: spec.sectionLabels || {},
      // Templates that want no header divider at all opt out explicitly.
      headerRule: spec.headerRule !== false,
      name: '#111827',
      text: '#374151',
      muted: '#6b7280',
      compact: spec.archetype === 'compact',
    };
  }

  /**
   * Resolve a shared type role into the option bag fontService.text() expects.
   * Every size, weight and colour in this renderer comes through here so the
   * preview can read the same values out of the registry.
   */
  _type(role, theme, overrides = {}) {
    const spec = getType(role, theme);
    const base = spec.family === 'heading' ? 'heading' : 'body';
    let font = base;
    if (spec.weight === 'bold') font = base === 'heading' ? 'headingBold' : 'bodyBold';
    else if (spec.style === 'italic') font = base === 'heading' ? 'headingItalic' : 'bodyItalic';
    const out = { font, size: spec.size, color: spec.color };
    if (spec.lineGap) out.lineGap = spec.lineGap;
    if (spec.letterSpacing) out.characterSpacing = spec.letterSpacing;
    return { ...out, ...overrides };
  }

  /** Body/heading role variant for compact templates. */
  _role(base, theme) {
    if (!theme.compact) return base;
    const compactRole = `${base}Compact`;
    try {
      getType(compactRole, theme);
      return compactRole;
    } catch {
      return base;
    }
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

  // ---- Page-bounds helpers -------------------------------------------------
  // Manually positioned blocks (skill tags, infographic chips, section title
  // pills, entry headers) bypass PDFKit's automatic pagination, so they have to
  // check the remaining page height themselves before drawing.
  _bottom(doc) {
    return doc.page.height - doc.page.margins.bottom;
  }

  /** Y at which the next block may start, adding a page when it will not fit. */
  _ensureSpace(doc, needed, y = doc.y) {
    if (y + needed > this._bottom(doc)) {
      doc.addPage();
      doc.x = doc.page.margins.left;
      doc.y = doc.page.margins.top;
      return doc.y;
    }
    return y;
  }

  // ---- Top-level archetype renderers --------------------------------------
  _renderSingleColumn(doc, resume, spec, theme) {
    const align = spec.archetype === 'classic-centered' ? 'center' : 'left';
    this._renderHeader(doc, resume, theme, { align });
    const region = this._region(doc);
    spec.sectionOrder.forEach((key) => this._section(doc, key, resume, theme, region));
  }

  _renderHeaderBand(doc, resume, spec, theme, layout) {
    const p = resume.personal_info || {};
    const band = layout.headerBand;
    const pageW = doc.page.width;
    const innerW = pageW - band.sidePad * 2;
    const name = `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Your Name';

    const nameStyle = this._type(this._role('name', theme), theme, { color: theme.sidebarText });
    const titleStyle = this._type('jobTitle', theme, { color: theme.sidebarText });

    // Pre-measure to size the band.
    const nameH = fonts.heightOfString(doc, name, { ...nameStyle, width: innerW, align: 'center' });
    let titleH = 0;
    if (p.job_title) {
      titleH = fonts.heightOfString(doc, p.job_title, { ...titleStyle, width: innerW, align: 'center' }) + 2;
    }
    const contactItems = this._buildContactItems(p);
    const contactH = contactItems.length ? band.contactHeight : 0;
    const bandH = band.topPad + nameH + titleH + contactH + band.bottomPad;

    // Band fill (gradient; solid when accent2 === accent).
    const grad = doc.linearGradient(0, 0, pageW, bandH);
    grad.stop(0, theme.accent).stop(1, theme.accent2);
    doc.rect(0, 0, pageW, bandH).fill(grad);

    // Reversed-out header text.
    let y = band.topPad;
    fonts.text(doc, name, band.sidePad, y, { ...nameStyle, width: innerW, align: 'center' });
    y = doc.y;
    if (p.job_title) {
      fonts.text(doc, p.job_title, band.sidePad, y + 1, { ...titleStyle, width: innerW, align: 'center' });
      y = doc.y;
    }
    if (contactItems.length) {
      this._contactLineCentered(doc, contactItems, theme, {
        y: y + 4, color: theme.sidebarText, iconColor: theme.sidebarText, width: innerW, left: band.sidePad,
      });
    }

    doc.x = doc.page.margins.left;
    doc.y = bandH + 20;

    const region = this._region(doc);
    spec.sectionOrder.forEach((key) => this._section(doc, key, resume, theme, region));
  }

  _renderSidebar(doc, resume, spec, theme, layout) {
    const p = resume.personal_info || {};
    const sidebarWidth = layout.sidebarWidth;
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
    const pad = layout.sidebarPad;
    const sx = pad;
    const sw = sidebarWidth - pad * 2;
    let sy = layout.sidebarTop;

    const name = `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Your Name';
    fonts.text(doc, name, sx, sy, { ...this._type('sidebarName', theme), width: sw });
    sy = doc.y + 2;
    if (p.job_title) {
      fonts.text(doc, p.job_title, sx, sy, { ...this._type('sidebarJobTitle', theme), width: sw });
      sy = doc.y;
    }
    sy += SP.sidebarNameGap;

    // Contact (stacked).
    // The guard has to be PDFKit's own page-break threshold, not the physical
    // page edge: drawing past doc.page.maxY() makes PDFKit silently add a page,
    // which would push the entire main column onto page 2.
    const contactItems = this._buildContactItems(p);
    const contactStyle = this._type('sidebarContact', theme);
    const sidebarBottom = this._bottom(doc) - layout.sidebarBottomInset;
    const iconSize = SP.contactIconSize;
    contactItems.forEach((item) => {
      const h = fonts.heightOfString(doc, item.label, { ...contactStyle, width: sw - 12 });
      if (sy + h > sidebarBottom) return;
      this._drawContactIcon(doc, item.icon, sx, sy + 1, iconSize, theme.sidebarText);
      fonts.text(doc, item.label, sx + 12, sy, {
        ...contactStyle, width: sw - 12, link: item.url || null,
      });
      // Advance by where the text actually ended; a long wrapped address is
      // taller than the pre-measure suggests and would otherwise overlap.
      sy = Math.max(doc.y, sy + 11) + SP.sidebarContactGap;
    });
    sy += 8;

    // Sidebar sections (skills, languages). Anything that will not fit inside
    // the painted band is handed back and rendered in the main column instead
    // of being drawn off the bottom of the page.
    const sidebarKeys = spec.sectionOrder.filter((k) => SIDEBAR_SECTIONS.includes(k));
    const overflow = {};
    sidebarKeys.forEach((key) => {
      const res = this._sidebarSection(doc, key, resume, theme, sx, sw, sy, sidebarBottom);
      sy = res.y + SP.sidebarSectionGap;
      if (res.overflow && res.overflow.length) overflow[key] = res.overflow;
    });

    // --- Main column content (normal flow within margins) ---
    const mainKeys = spec.sectionOrder.filter((k) => !SIDEBAR_SECTIONS.includes(k));
    doc.x = doc.page.margins.left;
    doc.y = doc.page.margins.top;
    const region = this._region(doc);

    mainKeys.forEach((key) => this._section(doc, key, resume, theme, region));

    // Sidebar spill-over, rendered as ordinary main-column sections.
    Object.keys(overflow).forEach((key) => {
      const spill = key === 'skills'
        ? { ...resume, skills: overflow[key] }
        : { ...resume, languages: overflow[key] };
      this._section(doc, key, spill, theme, region, {
        title: key === 'skills' ? 'Additional Skills' : 'Additional Languages',
      });
    });
  }

  // ---- Header (single column / classic) -----------------------------------
  _renderHeader(doc, resume, theme, { align }) {
    const p = resume.personal_info || {};
    const region = this._region(doc);
    const name = `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Your Name';

    fonts.text(doc, name, region.left, doc.y, {
      ...this._type(this._role('name', theme), theme), width: region.width, align,
    });

    if (p.job_title) {
      fonts.text(doc, p.job_title, region.left, doc.y, {
        ...this._type('jobTitle', theme), width: region.width, align,
      });
    }

    doc.y += SP.headerTitleGap;

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

    doc.y += SP.headerRuleGap;

    // Header divider (accent). Templates aiming for a maximally plain document
    // opt out with headerRule: false.
    if (theme.headerRule) {
      const lineY = doc.y;
      doc.moveTo(region.left, lineY).lineTo(region.right, lineY)
        .strokeColor(theme.accent).lineWidth(SP.headerRuleWidth).stroke();
    }
    doc.y += SP.headerBottomGap;
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
    const iconSize = SP.contactIconSize;
    const iconGap = SP.contactIconGap;
    const itemGap = SP.contactGap;
    const style = this._type('contact', theme, { color });

    const measured = items.map((item) => ({
      ...item,
      w: iconSize + iconGap + fonts.widthOfString(doc, item.label, style),
    }));

    // Wrap into centred rows. A long address used to be centred as one row
    // wider than the text column, so it ran past both margins.
    const rows = [];
    let row = [];
    let rowW = 0;
    measured.forEach((item) => {
      const add = (row.length ? itemGap : 0) + item.w;
      if (row.length && rowW + add > width) {
        rows.push({ items: row, w: rowW });
        row = [item];
        rowW = item.w;
      } else {
        row.push(item);
        rowW += add;
      }
    });
    if (row.length) rows.push({ items: row, w: rowW });

    let curY = y;
    rows.forEach((r) => {
      let curX = left + Math.max(0, (width - r.w) / 2);
      let lineH = 0;
      r.items.forEach((item, idx) => {
        this._drawContactIcon(doc, item.icon, curX, curY + 1, iconSize, iconColor);
        curX += iconSize + iconGap;
        const w = item.w - iconSize - iconGap;
        fonts.text(doc, item.label, curX, curY, {
          ...style, width: w + 2, lineBreak: false, link: item.url || null,
        });
        lineH = Math.max(lineH, doc.currentLineHeight());
        curX += w;
        if (idx < r.items.length - 1) curX += itemGap;
      });
      curY += lineH + (r === rows[rows.length - 1] ? 0 : 3);
    });

    doc.x = doc.page.margins.left;
    doc.y = curY + SP.contactLinePad;
  }

  _contactLineLeft(doc, items, theme, region) {
    const iconSize = SP.contactIconSize;
    const iconGap = SP.contactIconGap;
    const itemGap = SP.contactGap;
    const style = this._type('contact', theme);
    let curX = region.left;
    let y = doc.y;
    let lineH = 0;
    items.forEach((item) => {
      const w = fonts.widthOfString(doc, item.label, style);
      // Wrap to the next line rather than running past the right margin.
      if (curX + iconSize + iconGap + w > region.right && curX > region.left) {
        curX = region.left;
        y += Math.max(lineH, 11) + 3;
        lineH = 0;
      }
      this._drawContactIcon(doc, item.icon, curX, y + 1, iconSize, theme.muted);
      curX += iconSize + iconGap;
      fonts.text(doc, item.label, curX, y, {
        ...style, width: w + 2, lineBreak: false, link: item.url || null,
      });
      lineH = Math.max(lineH, doc.currentLineHeight());
      curX += w + itemGap;
    });
    doc.x = region.left;
    doc.y = y + Math.max(lineH, 11) + SP.contactLinePad;
  }

  // ---- Section title (styled per spec) ------------------------------------
  _sectionTitle(doc, title, theme, region) {
    const style = theme.sectionTitle;
    // Keep the heading with at least a little of its content.
    const startY = this._ensureSpace(doc, SP.keepWithNextTitle);

    if (style === 'pill') {
      const pill = this._type('sectionTitlePill', theme);
      const tw = fonts.widthOfString(doc, title.toUpperCase(), pill);
      const padX = SP.sectionTitlePillPadX;
      const h = SP.sectionTitlePillHeight;
      doc.roundedRect(region.left, startY, tw + padX * 2, h, 7).fill(theme.accent);
      fonts.text(doc, title.toUpperCase(), region.left + padX, startY + 3.5, {
        ...pill, width: tw + 2, lineBreak: false,
      });
      doc.x = region.left;
      doc.y = startY + h + SP.sectionTitlePillGap;
      return;
    }

    if (style === 'bar') {
      const bar = this._type('sectionTitle', theme);
      fonts.apply(doc, bar, title);
      const h = doc.currentLineHeight();
      doc.rect(region.left, startY + 1, SP.sectionTitleBarWidth, h - 2).fill(theme.accent);
      fonts.text(doc, title.toUpperCase(), region.left + SP.sectionTitleBarTextGap, startY, {
        ...bar, width: region.width - SP.sectionTitleBarTextGap,
      });
      doc.y += SP.sectionTitleBarGap;
      doc.x = region.left;
      return;
    }

    // Text-based styles (underline / rule / plain / smallcaps / bracket)
    const isSmallcaps = style === 'smallcaps';
    const roleName = isSmallcaps ? 'sectionTitleSmallcaps' : 'sectionTitle';
    const base = this._type(roleName, theme);
    const titleColor = (style === 'underline' || style === 'smallcaps') ? theme.accent : theme.name;
    const label = isSmallcaps ? title.replace(/\b\w/g, (c) => c.toUpperCase()) : title.toUpperCase();
    const charSpacing = base.characterSpacing;

    if (style === 'bracket') {
      const pw = fonts.widthOfString(doc, '# ', base);
      fonts.text(doc, '# ', region.left, startY, {
        ...base, color: titleColor, width: pw + 2, lineBreak: false,
      });
      fonts.text(doc, label, region.left + pw, startY, {
        ...base, color: theme.name, width: region.width - pw,
      });
    } else {
      fonts.text(doc, label, region.left, startY, {
        ...base, color: titleColor, characterSpacing: charSpacing, width: region.width,
      });
    }

    const ruleY = doc.y + SP.sectionTitleRuleGap;
    if (style === 'underline') {
      doc.moveTo(region.left, ruleY).lineTo(region.right, ruleY).strokeColor(theme.accent).lineWidth(1.5).stroke();
    } else if (style === 'rule' || style === 'bracket' || style === 'smallcaps') {
      doc.moveTo(region.left, ruleY).lineTo(region.right, ruleY)
        .strokeColor(style === 'smallcaps' ? theme.accent : '#d1d5db').lineWidth(0.6).stroke();
    }
    // 'plain' draws no rule.

    doc.y += style === 'plain' ? SP.sectionTitleGapPlain : SP.sectionTitleGap;
    doc.x = region.left;
  }

  // ---- Body sections -------------------------------------------------------
  _section(doc, key, resume, theme, region, opts = {}) {
    const sectionGap = theme.compact ? SP.sectionGapCompact : SP.sectionGap;
    /**
     * Heading for this section. opts.title wins because it carries the
     * sidebar spill-over continuation ("Additional Skills"), which is about
     * position on the page rather than what the template calls the section.
     */
    const label = (fallback) => opts.title || theme.sectionLabels[key] || fallback;

    switch (key) {
      case 'summary':
        if (resume.summary) {
          this._sectionTitle(doc, label('Professional Summary'), theme, region);
          fonts.text(doc, resume.summary, region.left, doc.y, {
            ...this._type(this._role('summary', theme), theme), width: region.width,
          });
          doc.y += sectionGap;
          doc.x = region.left;
        }
        break;

      case 'experience':
        if (resume.work_experience?.length > 0) {
          this._sectionTitle(doc, label('Experience'), theme, region);
          const bulletStyle = this._type(this._role('bullet', theme), theme);
          const indent = bulletStyle.indent || 14;
          resume.work_experience.forEach((exp, i) => {
            this._entryWithDate(
              doc, theme, region,
              exp.company ? `${exp.position || ''}${SEP.entryTitle}${exp.company}` : (exp.position || ''),
              this._formatDateRange(exp.start_date, exp.end_date, exp.current),
            );
            if (exp.location) {
              fonts.text(doc, exp.location, region.left, doc.y, {
                ...this._type('entryLocation', theme), width: region.width,
              });
            }
            doc.y += SP.entryInnerGap;
            const bullets = (exp.description || []).filter(Boolean);
            if (bullets.length) {
              bullets.forEach((bullet) => {
                // Keep the marker with the first line of its bullet.
                const by = this._ensureSpace(doc, doc.currentLineHeight() + 2);
                fonts.text(doc, '•', region.left, by, {
                  ...bulletStyle, color: theme.accent, width: 10, lineBreak: false,
                });
                fonts.text(doc, bullet, region.left + indent, by, {
                  ...bulletStyle, width: region.width - indent,
                });
              });
            }
            if (i < resume.work_experience.length - 1) {
              doc.y += theme.compact ? SP.entryGapCompact : SP.entryGap;
            }
          });
          doc.y += sectionGap;
          doc.x = region.left;
        }
        break;

      case 'education':
        if (resume.education?.length > 0) {
          this._sectionTitle(doc, label('Education'), theme, region);
          resume.education.forEach((edu, i) => {
            this._entryWithDate(
              doc, theme, region,
              edu.field_of_study ? `${edu.degree || ''} in ${edu.field_of_study}` : (edu.degree || ''),
              this._formatDateRange(edu.start_date, edu.end_date),
            );
            const meta = [edu.institution, edu.gpa ? `GPA: ${edu.gpa}` : null].filter(Boolean).join(SEP.educationMeta);
            if (meta) {
              fonts.text(doc, meta, region.left, doc.y, {
                ...this._type('educationMeta', theme), width: region.width,
              });
            }
            if (i < resume.education.length - 1) doc.y += SP.educationEntryGap;
          });
          doc.y += sectionGap;
          doc.x = region.left;
        }
        break;

      case 'skills': {
        const skills = (resume.skills || []).filter(Boolean);
        if (skills.length) {
          this._sectionTitle(doc, label('Skills'), theme, region);
          this._renderSkills(doc, skills, theme, region);
          doc.y += sectionGap;
          doc.x = region.left;
        }
        break;
      }

      case 'projects':
        if (resume.projects?.length > 0) {
          this._sectionTitle(doc, label('Projects'), theme, region);
          resume.projects.forEach((proj, i) => {
            this._ensureSpace(doc, SP.keepWithNextProject);
            fonts.text(doc, proj.name || '', region.left, doc.y, {
              ...this._type('projectName', theme), width: region.width,
            });
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
              fonts.text(doc, label, region.left, doc.y, {
                ...this._type('projectUrl', theme), width: region.width, link: url,
              });
            }
            if (proj.description) {
              fonts.text(doc, proj.description, region.left, doc.y, {
                ...this._type('projectDescription', theme), width: region.width,
              });
            }
            if (proj.technologies) {
              fonts.text(doc, `Tech: ${proj.technologies}`, region.left, doc.y, {
                ...this._type('projectTech', theme), width: region.width,
              });
            }
            if (i < resume.projects.length - 1) doc.y += SP.projectEntryGap;
          });
          doc.y += sectionGap;
          doc.x = region.left;
        }
        break;

      case 'certifications':
        if (resume.certifications?.length > 0) {
          this._sectionTitle(doc, label('Certifications'), theme, region);
          resume.certifications.forEach((cert) => {
            this._ensureSpace(doc, SP.keepWithNextCert);
            // Name in bold, issuer in body weight, on one line.
            fonts.text(doc, cert.name || '', region.left, doc.y, {
              ...this._type('certName', theme), width: region.width, continued: !!cert.issuer,
            });
            if (cert.issuer) {
              fonts.text(doc, `${SEP.certIssuer}${cert.issuer}`, null, null, this._type('certIssuer', theme));
            }
            if (cert.date) {
              fonts.text(doc, this._formatDate(cert.date), region.left, doc.y, {
                ...this._type('certDate', theme), width: region.width,
              });
            }
          });
          doc.y += sectionGap;
          doc.x = region.left;
        }
        break;

      case 'languages':
        if (resume.languages?.length > 0) {
          this._sectionTitle(doc, label('Languages'), theme, region);
          const langStr = resume.languages
            .map((l) => (l.proficiency ? `${l.name} (${l.proficiency})` : l.name))
            .join(SEP.languages);
          fonts.text(doc, langStr, region.left, doc.y, {
            ...this._type('languages', theme), width: region.width,
          });
          doc.y += SP.languagesGap;
          doc.x = region.left;
        }
        break;

      default:
        break;
    }
  }

  _entryWithDate(doc, theme, region, titleText, dateStr) {
    // Reserve room for the heading plus one following line so the date never
    // ends up orphaned on the previous page.
    const titleY = this._ensureSpace(doc, SP.keepWithNextEntry);
    let dateWidth = 0;
    if (dateStr) {
      const dateStyle = this._type('entryDate', theme);
      dateWidth = fonts.widthOfString(doc, dateStr, dateStyle) + SP.entryDatePad;
      fonts.text(doc, dateStr, region.right - dateWidth + SP.entryDatePad, titleY, {
        ...dateStyle, width: dateWidth, lineBreak: false,
      });
    }
    fonts.text(doc, titleText, region.left, titleY, {
      ...this._type('entryTitle', theme), width: region.width - dateWidth,
    });
    doc.x = region.left;
  }

  _renderSkills(doc, skills, theme, region) {
    if (theme.skillsStyle === 'inline') {
      fonts.text(doc, skills.join(SEP.inlineSkills), region.left, doc.y, {
        ...this._type('skillsInline', theme), width: region.width,
      });
      doc.x = region.left;
      return;
    }
    if (theme.skillsStyle === 'bars') {
      this._renderSkillChips(doc, skills, theme, region);
      return;
    }
    this._renderSkillTags(doc, skills, theme, region);
  }

  /**
   * Infographic skills.
   *
   * This previously drew a progress bar per skill whose fill came from
   * `(70 + ((i * 7) % 30)) / 100` - a proficiency percentage derived from the
   * skill's position in the list, which the user never supplied. Presenting
   * invented numbers as self-reported data is not acceptable on a resume, so
   * the bars are gone. Skills render as accent-tinted chips in two columns,
   * which keeps the template's visual character without asserting a rating.
   */
  _renderSkillChips(doc, skills, theme, region) {
    const colGap = SP.chipColumnGap;
    const colW = (region.width - colGap) / 2;
    const rowH = SP.chipRowHeight;
    const padX = SP.chipPadX;
    const chipH = SP.chipHeight;
    const style = this._type('skillChip', theme);
    let y = doc.y;
    let col = 0;

    skills.forEach((skill) => {
      if (col === 0) y = this._ensureSpace(doc, rowH, y);
      const x = region.left + col * (colW + colGap);
      // Chips are fixed-width; an over-long skill is ellipsised rather than
      // allowed to spill into the neighbouring column.
      const label = fonts.fit(doc, skill, colW - padX * 2, style);
      const w = Math.min(fonts.widthOfString(doc, label, style) + padX * 2, colW);

      doc.save();
      doc.roundedRect(x, y, w, chipH, SP.chipRadius).fillOpacity(SP.chipTint).fill(theme.accent);
      doc.restore();
      doc.save();
      doc.roundedRect(x, y, SP.chipAccentWidth, chipH, 1.2).fill(theme.accent);
      doc.restore();

      fonts.text(doc, label, x + padX, y + 2.5, {
        ...style, width: Math.max(w - padX * 2, 4), lineBreak: false,
      });

      col += 1;
      if (col === 2) { col = 0; y += rowH; }
    });

    doc.y = col === 0 ? y : y + rowH;
    doc.x = region.left;
  }

  _renderSkillTags(doc, skills, theme, region) {
    const padX = SP.tagPadX;
    const gap = SP.tagGap;
    const lineHeight = SP.tagLineHeight;
    const tagH = SP.tagHeight;
    const style = this._type('skillTag', theme);
    let curY = this._ensureSpace(doc, lineHeight);
    let curX = region.left;

    skills.forEach((skill) => {
      // A skill wider than the whole column is ellipsised so the label can
      // never overflow its tag.
      const label = fonts.fit(doc, skill, region.width - padX * 2, style);
      const textWidth = fonts.widthOfString(doc, label, style);
      const tagWidth = Math.min(textWidth + padX * 2, region.width);

      if (curX + tagWidth > region.right && curX > region.left) {
        curX = region.left;
        curY += lineHeight;
      }
      // Break to a new page before drawing a row that would fall off the sheet.
      if (curY + tagH > this._bottom(doc)) {
        doc.addPage();
        doc.x = region.left;
        curY = doc.page.margins.top;
        curX = region.left;
      }

      doc.roundedRect(curX, curY, tagWidth, tagH, SP.tagRadius).fillAndStroke('#f3f4f6', '#e5e7eb');
      fonts.text(doc, label, curX + padX, curY + 3, {
        ...style, width: Math.max(tagWidth - padX * 2, 4), lineBreak: false,
      });
      curX += tagWidth + gap;
    });

    doc.y = curY + lineHeight;
    doc.x = region.left;
  }

  // ---- Sidebar sections (manual layout) -----------------------------------
  /**
   * Renders a sidebar section inside the painted band, stopping at `maxY`.
   * Items that do not fit are returned so the caller can place them in the main
   * column rather than drawing them past the bottom of the page.
   */
  _sidebarSection(doc, key, resume, theme, x, w, startY, maxY) {
    let y = startY;
    const titleStyle = this._type('sidebarSectionTitle', theme);
    const itemStyle = this._type('sidebarItem', theme);
    const overflow = [];

    const title = (label) => {
      fonts.text(doc, label.toUpperCase(), x, y, { ...titleStyle, width: w });
      y = doc.y + 2;
      doc.moveTo(x, y).lineTo(x + w, y)
        .strokeColor(theme.sidebarText).opacity(0.4).lineWidth(0.5)
        .stroke()
        .opacity(1);
      y += SP.sidebarTitleGap;
    };

    // Once one item spills, everything after it spills too, so the main-column
    // continuation keeps the author's ordering.
    let spilling = false;
    const place = (label) => {
      const h = fonts.heightOfString(doc, label, { ...itemStyle, width: w });
      if (spilling || y + h > maxY) { spilling = true; return false; }
      fonts.text(doc, label, x, y, { ...itemStyle, width: w });
      y = Math.max(doc.y, y + 11) + SP.sidebarItemGap;
      return true;
    };

    if (key === 'skills') {
      const skills = (resume.skills || []).filter(Boolean);
      if (!skills.length) return { y, overflow };
      if (y + 32 > maxY) return { y, overflow: skills };
      title('Skills');
      skills.forEach((skill) => {
        if (!place(String(skill))) overflow.push(skill);
      });
    } else if (key === 'languages') {
      const langs = resume.languages || [];
      if (!langs.length) return { y, overflow };
      if (y + 32 > maxY) return { y, overflow: langs };
      title('Languages');
      langs.forEach((l) => {
        const label = l.proficiency ? `${l.name} (${l.proficiency})` : l.name;
        if (!place(label)) overflow.push(l);
      });
    }
    return { y, overflow };
  }

  // ---- Cover letter --------------------------------------------------------
  async generateCoverLetterPDF({ coverLetterText, personalInfo, companyName, jobTitle }) {
    return new Promise((resolve, reject) => {
      try {
        const p = personalInfo || {};
        const name = `${p.first_name || ''} ${p.last_name || ''}`.trim();
        const doc = new PDFDocument({
          size: [PAGE.width, PAGE.height],
          margin: 60,
          info: {
            Title: `Cover Letter${jobTitle ? ` - ${jobTitle}` : ''}`,
            Author: name || 'CV Optimizer',
            Creator: 'CV Optimizer',
          },
        });

        // Cover letters are translated too, so they need the same embedded
        // fonts as the resume.
        fonts.attach(doc, {
          fontFamily: 'sans',
          headingFamily: 'sans',
          rtlDocument: fonts.isPredominantlyRTL({ coverLetterText, personalInfo, companyName, jobTitle }),
        });

        const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const left = doc.page.margins.left;

        if (name) {
          fonts.text(doc, name, left, doc.y, {
            font: 'headingBold', size: 14, color: '#1f2937', width,
          });
        }
        const contacts = [p.email, p.phone, p.location].filter(Boolean);
        if (contacts.length > 0) {
          fonts.text(doc, contacts.join('  |  '), left, doc.y, {
            font: 'heading', size: 9, color: '#6b7280', width,
          });
        }
        doc.moveDown(1.5);

        const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        fonts.text(doc, date, left, doc.y, { font: 'body', size: 10, color: '#4b5563', width });
        doc.moveDown(0.5);

        if (companyName) {
          fonts.text(doc, companyName, left, doc.y, { font: 'body', size: 10, color: '#4b5563', width });
        }
        if (jobTitle) {
          fonts.text(doc, `Re: ${jobTitle}`, left, doc.y, { font: 'body', size: 10, color: '#4b5563', width });
        }
        doc.moveDown(1);

        const paragraphs = String(coverLetterText || '').split('\n').filter((para) => para.trim());
        paragraphs.forEach((para) => {
          fonts.text(doc, para.trim(), left, doc.y, {
            font: 'body', size: 10.5, color: '#1f2937', width, align: 'left', lineGap: 3,
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
        doc.moveTo(x, y + s * 0.2).lineTo(cx, cy + s * 0.05).lineTo(x + s, y + s * 0.2)
          .stroke();
        break;
      case 'phone':
        doc.moveTo(x + s * 0.25, y + s * 0.1)
          .lineTo(x + s * 0.45, y + s * 0.1).lineTo(x + s * 0.45, y + s * 0.35)
          .lineTo(x + s * 0.55, y + s * 0.45)
          .lineTo(x + s * 0.55, y + s * 0.65)
          .lineTo(x + s * 0.75, y + s * 0.65)
          .lineTo(x + s * 0.75, y + s * 0.9)
          .lineTo(x + s * 0.55, y + s * 0.9)
          .lineTo(x + s * 0.25, y + s * 0.6)
          .closePath()
          .stroke();
        break;
      case 'pin':
        doc.circle(cx, y + s * 0.35, s * 0.25).stroke();
        doc.moveTo(cx - s * 0.2, y + s * 0.5).lineTo(cx, y + s * 0.9).lineTo(cx + s * 0.2, y + s * 0.5)
          .stroke();
        break;
      case 'linkedin':
        doc.font(fonts.fontFor(doc, 'headingBold', 'in')).fontSize(s * 0.85).fillColor(stroke)
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
    const [year, month] = String(dateStr).split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const name = months[parseInt(month, 10) - 1];
    // Year-only values ("2019") must not render as a bare year with a stray
    // space, and an unparseable month must not produce "undefined".
    return name ? `${name} ${year}` : `${year}`;
  }

  _formatDateRange(start, end, current) {
    const s = this._formatDate(start);
    const e = current ? 'Present' : this._formatDate(end);
    if (!s && !e) return '';
    if (!s) return e;
    if (!e) return s;
    return `${s} - ${e}`;
  }
}

module.exports = new PDFService();
