const PDFDocument = require('pdfkit');

class PDFService {
  constructor() {
    this.templates = {
      modern: this.modernTemplate.bind(this),
      professional: this.professionalTemplate.bind(this),
      minimal: this.minimalTemplate.bind(this)
    };
  }

  async generatePDF(resume, template = 'modern') {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `${resume.personalInfo.firstName} ${resume.personalInfo.lastName} - Resume`,
            Author: `${resume.personalInfo.firstName} ${resume.personalInfo.lastName}`,
            Creator: 'CV Optimizer'
          }
        });

        // Use selected template
        const templateFunction = this.templates[template] || this.templates.modern;
        templateFunction(doc, resume);

        // Collect the PDF data
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Finalize the PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  modernTemplate(doc, resume) {
    const { personalInfo, summary, skills, workExperience, education, certifications } = resume;

    // Colors
    const primaryColor = '#2c5aa0';
    const textColor = '#333333';
    const lightGray = '#666666';

    // Header with name and contact info
    doc.fontSize(24)
       .fillColor(primaryColor)
       .text(`${personalInfo.firstName} ${personalInfo.lastName}`, { align: 'center' });

    doc.moveDown(0.5);

    // Contact information
    doc.fontSize(10)
       .fillColor(lightGray);

    const contactItems = [];
    if (personalInfo.email) contactItems.push(personalInfo.email);
    if (personalInfo.phone) contactItems.push(personalInfo.phone);
    if (personalInfo.location) contactItems.push(personalInfo.location);

    if (contactItems.length > 0) {
      doc.text(contactItems.join(' • '), { align: 'center' });
    }

    const links = [];
    if (personalInfo.linkedin) links.push(personalInfo.linkedin);
    if (personalInfo.github) links.push(personalInfo.github);
    if (personalInfo.website) links.push(personalInfo.website);

    if (links.length > 0) {
      doc.text(links.join(' • '), { align: 'center' });
    }

    doc.moveDown();

    // Professional Summary
    if (summary) {
      this.addSection(doc, 'PROFESSIONAL SUMMARY', primaryColor);
      doc.fontSize(10)
         .fillColor(textColor)
         .text(summary, { align: 'justify' });
      doc.moveDown();
    }

    // Skills
    if (skills && (skills.technical?.length > 0 || skills.soft?.length > 0)) {
      this.addSection(doc, 'SKILLS', primaryColor);
      
      if (skills.technical?.length > 0) {
        doc.fontSize(10)
           .fillColor(primaryColor)
           .text('Technical Skills: ', { continued: true })
           .fillColor(textColor)
           .text(skills.technical.join(', '));
        doc.moveDown(0.5);
      }

      if (skills.soft?.length > 0) {
        doc.fontSize(10)
           .fillColor(primaryColor)
           .text('Soft Skills: ', { continued: true })
           .fillColor(textColor)
           .text(skills.soft.join(', '));
      }
      doc.moveDown();
    }

    // Work Experience
    if (workExperience && workExperience.length > 0) {
      this.addSection(doc, 'PROFESSIONAL EXPERIENCE', primaryColor);

      workExperience.forEach((exp, index) => {
        // Job title and company
        doc.fontSize(11)
           .fillColor(textColor)
           .font('Helvetica-Bold')
           .text(exp.position, { continued: true })
           .font('Helvetica')
           .text(' | ' + exp.company);

        // Date and location
        doc.fontSize(9)
           .fillColor(lightGray)
           .text(
             `${this.formatDate(exp.startDate)} - ${exp.current ? 'Present' : this.formatDate(exp.endDate)}` +
             (exp.location ? ` | ${exp.location}` : '')
           );

        doc.moveDown(0.5);

        // Description
        if (exp.description && exp.description.length > 0) {
          exp.description.forEach(desc => {
            doc.fontSize(10)
               .fillColor(textColor)
               .text('• ' + desc, { indent: 20 });
          });
        }

        // Achievements
        if (exp.achievements && exp.achievements.length > 0) {
          doc.moveDown(0.3);
          exp.achievements.forEach(achievement => {
            doc.fontSize(10)
               .fillColor(textColor)
               .text('• ' + achievement, { indent: 20 });
          });
        }

        if (index < workExperience.length - 1) {
          doc.moveDown();
        }
      });
      doc.moveDown();
    }

    // Education
    if (education && education.length > 0) {
      this.addSection(doc, 'EDUCATION', primaryColor);

      education.forEach((edu, index) => {
        doc.fontSize(11)
           .fillColor(textColor)
           .font('Helvetica-Bold')
           .text(edu.degree, { continued: true })
           .font('Helvetica')
           .text(edu.fieldOfStudy ? ' in ' + edu.fieldOfStudy : '');

        doc.fontSize(10)
           .fillColor(textColor)
           .text(edu.institution);

        doc.fontSize(9)
           .fillColor(lightGray)
           .text(
             `${this.formatDate(edu.startDate)} - ${this.formatDate(edu.endDate)}` +
             (edu.location ? ` | ${edu.location}` : '')
           );

        if (edu.gpa) {
          doc.fontSize(9)
             .fillColor(textColor)
             .text(`GPA: ${edu.gpa}`);
        }

        if (edu.honors && edu.honors.length > 0) {
          doc.fontSize(9)
             .fillColor(textColor)
             .text(`Honors: ${edu.honors.join(', ')}`);
        }

        if (index < education.length - 1) {
          doc.moveDown(0.5);
        }
      });
      doc.moveDown();
    }

    // Certifications
    if (certifications && certifications.length > 0) {
      this.addSection(doc, 'CERTIFICATIONS', primaryColor);

      certifications.forEach((cert, index) => {
        doc.fontSize(10)
           .fillColor(textColor)
           .font('Helvetica-Bold')
           .text(cert.name, { continued: true })
           .font('Helvetica')
           .text(' | ' + cert.issuer);

        doc.fontSize(9)
           .fillColor(lightGray)
           .text(`Issued: ${this.formatDate(cert.date)}`);

        if (index < certifications.length - 1) {
          doc.moveDown(0.5);
        }
      });
    }
  }

  professionalTemplate(doc, resume) {
    // Professional template - more traditional layout
    // Similar to modern but with different styling
    this.modernTemplate(doc, resume); // For now, using modern as base
  }

  minimalTemplate(doc, resume) {
    // Minimal template - clean and simple
    // Similar to modern but with less styling
    this.modernTemplate(doc, resume); // For now, using modern as base
  }

  addSection(doc, title, color) {
    doc.fontSize(12)
       .fillColor(color)
       .font('Helvetica-Bold')
       .text(title)
       .font('Helvetica');

    // Add a line under the section
    const y = doc.y + 5;
    doc.moveTo(50, y)
       .lineTo(545, y)
       .strokeColor(color)
       .lineWidth(0.5)
       .stroke();

    doc.moveDown(0.5);
  }

  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short' };
    return date.toLocaleDateString('en-US', options);
  }
}

module.exports = new PDFService();
