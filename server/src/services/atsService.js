const natural = require('natural');
const keywordExtractor = require('keyword-extractor');
const stringSimilarity = require('string-similarity');

class ATSService {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
  }

  analyzeResume(resume, jobDescription) {
    const analysis = {
      overall: 0,
      breakdown: {
        keywords: this.analyzeKeywords(resume, jobDescription),
        experience: this.analyzeExperience(resume, jobDescription),
        skills: this.analyzeSkills(resume, jobDescription),
        formatting: this.checkFormatting(resume)
      },
      suggestions: [],
      matchedKeywords: [],
      missingKeywords: []
    };

    // Calculate overall score (weighted average)
    analysis.overall = Math.round(
      (analysis.breakdown.keywords * 0.35) +
      (analysis.breakdown.experience * 0.25) +
      (analysis.breakdown.skills * 0.25) +
      (analysis.breakdown.formatting * 0.15)
    );

    // Extract and compare keywords
    const jobKeywords = this.extractKeywords(jobDescription);
    const resumeText = this.getResumeText(resume);
    const resumeKeywords = this.extractKeywords(resumeText);

    analysis.matchedKeywords = jobKeywords.filter(keyword => 
      resumeKeywords.some(resumeKeyword => 
        stringSimilarity.compareTwoStrings(keyword.toLowerCase(), resumeKeyword.toLowerCase()) > 0.7
      )
    );

    analysis.missingKeywords = jobKeywords.filter(keyword => 
      !analysis.matchedKeywords.includes(keyword)
    ).filter(keyword => 
      // Filter out common words
      !['looking', 'seeking', 'need', 'want', 'must', 'required'].includes(keyword.toLowerCase())
    );

    // Generate improvement suggestions
    analysis.suggestions = this.generateSuggestions(resume, jobDescription, analysis);

    return {
      score: analysis.overall,
      breakdown: analysis.breakdown,
      suggestions: analysis.suggestions,
      matchedKeywords: analysis.matchedKeywords,
      missingKeywords: analysis.missingKeywords.slice(0, 10) // Limit to top 10
    };
  }

  extractKeywords(text) {
    if (!text) return [];
    
    // Use keyword-extractor for better results
    const extracted = keywordExtractor.extract(text, {
      language: 'english',
      remove_digits: false,
      return_changed_case: true,
      remove_duplicates: true
    });

    // Add common tech terms that might be missed
    const techTerms = text.match(/\b(?:react|node\.?js|javascript|typescript|python|java|aws|docker|kubernetes|mongodb|postgresql|mysql|api|rest|graphql|microservices|cloud|devops|ci\/cd|agile|scrum)\b/gi) || [];
    
    // Combine and deduplicate
    const allKeywords = [...new Set([...extracted, ...techTerms.map(term => term.toLowerCase())])];
    
    // Filter out very common words
    const stopWords = [
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'we', 'are', 'is', 'was', 'be', 'been', 'have', 'has', 'had', 'will', 'would', 'should',
      'can', 'could', 'may', 'might', 'must', 'seeking', 'looking', 'ideal', 'candidate',
      'required', 'requirements', 'preferred', 'strong', 'good', 'excellent', 'skills', 'include',
      'including', 'such', 'like', 'need', 'needs', 'want', 'wants'
    ];
    
    return allKeywords.filter(word => 
      word.length > 2 && !stopWords.includes(word.toLowerCase())
    );
  }

  analyzeKeywords(resume, jobDescription) {
    const jobKeywords = this.extractKeywords(jobDescription);
    const resumeText = this.getResumeText(resume);
    const resumeKeywords = this.extractKeywords(resumeText);

    let matchCount = 0;
    let totalImportance = 0;

    jobKeywords.forEach(keyword => {
      // Give more weight to technical skills
      const importance = this.getKeywordImportance(keyword);
      totalImportance += importance;

      if (resumeKeywords.some(resumeKeyword => 
        stringSimilarity.compareTwoStrings(keyword.toLowerCase(), resumeKeyword.toLowerCase()) > 0.7
      )) {
        matchCount += importance;
      }
    });

    return Math.min(100, Math.round((matchCount / Math.max(totalImportance, 1)) * 100));
  }

  getKeywordImportance(keyword) {
    // Technical skills get higher weight
    const highValueKeywords = ['react', 'node', 'javascript', 'typescript', 'python', 'aws', 'docker', 'kubernetes', 'microservices'];
    const mediumValueKeywords = ['agile', 'scrum', 'api', 'rest', 'mongodb', 'postgresql', 'cloud'];
    
    if (highValueKeywords.some(hvk => keyword.toLowerCase().includes(hvk))) return 3;
    if (mediumValueKeywords.some(mvk => keyword.toLowerCase().includes(mvk))) return 2;
    return 1;
  }

  analyzeExperience(resume, jobDescription) {
    let score = 100;
    const jobText = jobDescription.toLowerCase();

    // Check years of experience
    const yearsMatch = jobText.match(/(\d+)\+?\s*years?\s*(?:of\s*)?experience/i);
    if (yearsMatch) {
      const requiredYears = parseInt(yearsMatch[1]);
      const actualYears = this.calculateExperienceYears(resume);
      
      if (actualYears < requiredYears) {
        score -= Math.min(40, (requiredYears - actualYears) * 10);
      }
    }

    // Check for seniority level match
    const seniorityKeywords = {
      'senior': ['senior', 'lead', 'principal', 'architect'],
      'mid': ['mid-level', 'intermediate'],
      'junior': ['junior', 'entry-level', 'associate']
    };

    for (const [level, keywords] of Object.entries(seniorityKeywords)) {
      if (keywords.some(kw => jobText.includes(kw))) {
        const resumeText = this.getResumeText(resume).toLowerCase();
        const hasMatchingLevel = keywords.some(kw => resumeText.includes(kw));
        
        if (!hasMatchingLevel && level === 'senior') {
          score -= 20;
        }
      }
    }

    // Check for specific experience requirements
    if (jobText.includes('microservices') && !this.hasExperience(resume, 'microservices')) score -= 10;
    if (jobText.includes('leadership') && !this.hasExperience(resume, ['lead', 'leadership', 'managed', 'mentored'])) score -= 10;
    if (jobText.includes('architecture') && !this.hasExperience(resume, ['architect', 'design', 'scalable'])) score -= 10;

    return Math.max(0, score);
  }

  analyzeSkills(resume, jobDescription) {
    const jobSkills = this.extractSkills(jobDescription);
    const resumeSkills = [
      ...(resume.skills?.technical || []).map(s => s.toLowerCase()),
      ...(resume.skills?.soft || []).map(s => s.toLowerCase())
    ];

    let matchCount = 0;
    jobSkills.forEach(skill => {
      if (resumeSkills.some(resumeSkill => 
        stringSimilarity.compareTwoStrings(skill, resumeSkill) > 0.7
      )) {
        matchCount++;
      }
    });

    return Math.min(100, Math.round((matchCount / Math.max(jobSkills.length, 1)) * 100));
  }

  extractSkills(text) {
    const skillPatterns = [
      'javascript', 'typescript', 'python', 'java', 'c\\+\\+', 'c#', 'php', 'ruby', 'go',
      'react', 'angular', 'vue', 'node\\.?js', 'express', 'django', 'flask', 'spring',
      'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch',
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'terraform',
      'git', 'agile', 'scrum', 'ci/cd', 'devops', 'microservices', 'rest', 'graphql',
      'leadership', 'communication', 'problem solving', 'team work'
    ];

    const foundSkills = [];
    const lowerText = text.toLowerCase();

    skillPatterns.forEach(pattern => {
      const regex = new RegExp(`\\b${pattern}\\b`, 'i');
      if (regex.test(lowerText)) {
        foundSkills.push(pattern);
      }
    });

    return [...new Set(foundSkills)];
  }

  checkFormatting(resume) {
    let score = 100;
    const issues = [];

    // Check essential contact information
    if (!resume.personalInfo?.email) {
      score -= 10;
      issues.push('Missing email address');
    }

    if (!resume.personalInfo?.phone) {
      score -= 10;
      issues.push('Missing phone number');
    }

    if (!resume.personalInfo?.location) {
      score -= 5;
      issues.push('Missing location information');
    }

    // Check for professional summary
    if (!resume.summary || resume.summary.length < 50) {
      score -= 15;
      issues.push('Missing or too short professional summary');
    }

    // Check work experience
    if (!resume.workExperience || resume.workExperience.length === 0) {
      score -= 20;
      issues.push('No work experience listed');
    } else {
      // Check if experiences have descriptions
      resume.workExperience.forEach((exp, index) => {
        if (!exp.description || exp.description.length === 0) {
          score -= 5;
          issues.push(`Work experience ${index + 1} lacks description`);
        }
      });
    }

    // Check skills section
    if (!resume.skills || (!resume.skills.technical?.length && !resume.skills.soft?.length)) {
      score -= 15;
      issues.push('No skills listed');
    }

    // Check education
    if (!resume.education || resume.education.length === 0) {
      score -= 10;
      issues.push('No education information');
    }

    return Math.max(0, score);
  }

  getResumeText(resume) {
    const parts = [
      resume.summary,
      resume.personalInfo?.firstName,
      resume.personalInfo?.lastName,
      ...(resume.skills?.technical || []),
      ...(resume.skills?.soft || []),
      ...(resume.workExperience?.map(exp => [
        exp.position,
        exp.company,
        ...(exp.description || []),
        ...(exp.achievements || [])
      ].join(' ')) || []),
      ...(resume.education?.map(edu => [
        edu.degree,
        edu.fieldOfStudy,
        edu.institution
      ].join(' ')) || [])
    ];

    return parts.filter(Boolean).join(' ');
  }

  calculateExperienceYears(resume) {
    if (!resume.workExperience || resume.workExperience.length === 0) return 0;

    // Sort experiences by start date
    const experiences = [...resume.workExperience].sort((a, b) => 
      new Date(a.startDate) - new Date(b.startDate)
    );

    const firstStart = new Date(experiences[0].startDate);
    const lastEnd = experiences[experiences.length - 1].current ? 
      new Date() : new Date(experiences[experiences.length - 1].endDate);

    return Math.round((lastEnd - firstStart) / (1000 * 60 * 60 * 24 * 365.25));
  }

  hasExperience(resume, keywords) {
    const resumeText = this.getResumeText(resume).toLowerCase();
    const keywordArray = Array.isArray(keywords) ? keywords : [keywords];
    
    return keywordArray.some(keyword => resumeText.includes(keyword.toLowerCase()));
  }

  generateSuggestions(resume, jobDescription, analysis) {
    const suggestions = [];

    // Keyword suggestions
    if (analysis.breakdown.keywords < 80) {
      const topMissing = analysis.missingKeywords.slice(0, 5);
      if (topMissing.length > 0) {
        suggestions.push({
          category: 'keywords',
          priority: 'high',
          suggestion: `Add these important keywords: ${topMissing.join(', ')}`
        });
      }
    }

    // Experience suggestions
    if (analysis.breakdown.experience < 80) {
      const yearsMatch = jobDescription.match(/(\d+)\+?\s*years?\s*(?:of\s*)?experience/i);
      if (yearsMatch) {
        const requiredYears = parseInt(yearsMatch[1]);
        const actualYears = this.calculateExperienceYears(resume);
        
        if (actualYears < requiredYears) {
          suggestions.push({
            category: 'experience',
            priority: 'medium',
            suggestion: `The job requires ${requiredYears}+ years of experience. Consider highlighting additional relevant experience or projects.`
          });
        }
      }

      if (jobDescription.toLowerCase().includes('leadership')) {
        suggestions.push({
          category: 'experience',
          priority: 'high',
          suggestion: 'Emphasize leadership experience, team management, and mentoring activities'
        });
      }
    }

    // Skills suggestions
    if (analysis.breakdown.skills < 80) {
      const jobSkills = this.extractSkills(jobDescription);
      const resumeSkills = [...(resume.skills?.technical || []), ...(resume.skills?.soft || [])];
      const missingSkills = jobSkills.filter(skill => 
        !resumeSkills.some(rs => rs.toLowerCase().includes(skill))
      ).slice(0, 5);

      if (missingSkills.length > 0) {
        suggestions.push({
          category: 'skills',
          priority: 'high',
          suggestion: `Add these relevant skills: ${missingSkills.join(', ')}`
        });
      }
    }

    // Formatting suggestions
    if (analysis.breakdown.formatting < 100) {
      if (!resume.personalInfo?.phone) {
        suggestions.push({
          category: 'formatting',
          priority: 'medium',
          suggestion: 'Add a phone number to your contact information'
        });
      }

      if (!resume.summary || resume.summary.length < 50) {
        suggestions.push({
          category: 'formatting',
          priority: 'high',
          suggestion: 'Add a compelling professional summary (2-3 sentences) that highlights your key qualifications'
        });
      }
    }

    // General suggestions
    if (analysis.overall < 70) {
      suggestions.push({
        category: 'general',
        priority: 'high',
        suggestion: 'Consider tailoring your resume more specifically to this job description'
      });
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
}

module.exports = new ATSService();
