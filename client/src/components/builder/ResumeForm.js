import { useState } from 'react';
import { useResume } from '../../context/ResumeContext';
import {
  User, Briefcase, GraduationCap, Wrench, FolderOpen, Award, Globe,
  ChevronDown, ChevronRight, Plus, Trash2, Sparkles, Loader,
} from 'lucide-react';
import { generateSummary, enhanceExperience, suggestSkills } from '../../services/api';
import toast from 'react-hot-toast';
import './ResumeForm.css';

const SECTIONS = [
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'summary', label: 'Summary', icon: Sparkles },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'skills', label: 'Skills', icon: Wrench },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'certifications', label: 'Certifications', icon: Award },
  { id: 'languages', label: 'Languages', icon: Globe },
];

const ResumeForm = () => {
  const { resumeData, updateField } = useResume();
  const [openSections, setOpenSections] = useState(['personal', 'summary']);
  const [aiLoading, setAiLoading] = useState({});

  const toggleSection = (id) => {
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const isOpen = (id) => openSections.includes(id);

  // Personal Info
  const updatePersonal = (key, value) => {
    updateField('personal_info', { ...resumeData.personal_info, [key]: value });
  };

  // Summary
  const updateSummary = (value) => {
    updateField('summary', value);
  };

  // Work Experience
  const addExperience = () => {
    const exp = [...(resumeData.work_experience || [])];
    exp.push({
      id: Date.now().toString(),
      company: '',
      position: '',
      location: '',
      start_date: '',
      end_date: '',
      current: false,
      description: [''],
    });
    updateField('work_experience', exp);
    if (!isOpen('experience')) toggleSection('experience');
  };

  const updateExperience = (index, key, value) => {
    const exp = [...resumeData.work_experience];
    exp[index] = { ...exp[index], [key]: value };
    updateField('work_experience', exp);
  };

  const removeExperience = (index) => {
    updateField('work_experience', resumeData.work_experience.filter((_, i) => i !== index));
  };

  const addBullet = (expIndex) => {
    const exp = [...resumeData.work_experience];
    exp[expIndex] = { ...exp[expIndex], description: [...(exp[expIndex].description || []), ''] };
    updateField('work_experience', exp);
  };

  const updateBullet = (expIndex, bulletIndex, value) => {
    const exp = [...resumeData.work_experience];
    const desc = [...exp[expIndex].description];
    desc[bulletIndex] = value;
    exp[expIndex] = { ...exp[expIndex], description: desc };
    updateField('work_experience', exp);
  };

  const removeBullet = (expIndex, bulletIndex) => {
    const exp = [...resumeData.work_experience];
    exp[expIndex] = {
      ...exp[expIndex],
      description: exp[expIndex].description.filter((_, i) => i !== bulletIndex),
    };
    updateField('work_experience', exp);
  };

  // Education
  const addEducation = () => {
    const edu = [...(resumeData.education || [])];
    edu.push({
      id: Date.now().toString(),
      institution: '',
      degree: '',
      field_of_study: '',
      location: '',
      start_date: '',
      end_date: '',
      gpa: '',
    });
    updateField('education', edu);
    if (!isOpen('education')) toggleSection('education');
  };

  const updateEducation = (index, key, value) => {
    const edu = [...resumeData.education];
    edu[index] = { ...edu[index], [key]: value };
    updateField('education', edu);
  };

  const removeEducation = (index) => {
    updateField('education', resumeData.education.filter((_, i) => i !== index));
  };

  // Skills
  const addSkill = () => {
    updateField('skills', [...(resumeData.skills || []), '']);
    if (!isOpen('skills')) toggleSection('skills');
  };

  const updateSkill = (index, value) => {
    const skills = [...resumeData.skills];
    skills[index] = value;
    updateField('skills', skills);
  };

  const removeSkill = (index) => {
    updateField('skills', resumeData.skills.filter((_, i) => i !== index));
  };

  // Projects
  const addProject = () => {
    const projects = [...(resumeData.projects || [])];
    projects.push({
      id: Date.now().toString(),
      name: '',
      description: '',
      technologies: '',
      url: '',
    });
    updateField('projects', projects);
    if (!isOpen('projects')) toggleSection('projects');
  };

  const updateProject = (index, key, value) => {
    const projects = [...resumeData.projects];
    projects[index] = { ...projects[index], [key]: value };
    updateField('projects', projects);
  };

  const removeProject = (index) => {
    updateField('projects', resumeData.projects.filter((_, i) => i !== index));
  };

  // Certifications
  const addCertification = () => {
    const certs = [...(resumeData.certifications || [])];
    certs.push({
      id: Date.now().toString(),
      name: '',
      issuer: '',
      date: '',
      url: '',
    });
    updateField('certifications', certs);
    if (!isOpen('certifications')) toggleSection('certifications');
  };

  const updateCertification = (index, key, value) => {
    const certs = [...resumeData.certifications];
    certs[index] = { ...certs[index], [key]: value };
    updateField('certifications', certs);
  };

  const removeCertification = (index) => {
    updateField('certifications', resumeData.certifications.filter((_, i) => i !== index));
  };

  // Languages
  const addLanguage = () => {
    const langs = [...(resumeData.languages || [])];
    langs.push({ name: '', proficiency: 'Professional' });
    updateField('languages', langs);
    if (!isOpen('languages')) toggleSection('languages');
  };

  const updateLanguage = (index, key, value) => {
    const langs = [...resumeData.languages];
    langs[index] = { ...langs[index], [key]: value };
    updateField('languages', langs);
  };

  const removeLanguage = (index) => {
    updateField('languages', resumeData.languages.filter((_, i) => i !== index));
  };

  // AI Assist Functions
  const handleAISummary = async () => {
    setAiLoading((prev) => ({ ...prev, summary: true }));
    try {
      const result = await generateSummary(resumeData, resumeData.personal_info?.job_title);
      updateField('summary', result.summary);
      toast.success('Summary generated!');
    } catch (err) {
      toast.error('Failed to generate summary');
    } finally {
      setAiLoading((prev) => ({ ...prev, summary: false }));
    }
  };

  const handleAIEnhance = async (index) => {
    const exp = resumeData.work_experience[index];
    if (!exp.position && !exp.company) {
      toast.error('Add position and company first');
      return;
    }
    setAiLoading((prev) => ({ ...prev, [`exp_${index}`]: true }));
    try {
      const result = await enhanceExperience(exp);
      const updated = [...resumeData.work_experience];
      updated[index] = { ...updated[index], description: result.enhancedDescription };
      updateField('work_experience', updated);
      toast.success('Bullets enhanced!');
    } catch (err) {
      toast.error('Failed to enhance experience');
    } finally {
      setAiLoading((prev) => ({ ...prev, [`exp_${index}`]: false }));
    }
  };

  const handleAISkills = async () => {
    const jobTitle = resumeData.personal_info?.job_title;
    if (!jobTitle) {
      toast.error('Add a job title in Personal Info first');
      return;
    }
    setAiLoading((prev) => ({ ...prev, skills: true }));
    try {
      const result = await suggestSkills(resumeData, `Looking for a ${jobTitle}`);
      const newSkills = [
        ...(result.suggestions?.technical || []),
        ...(result.suggestions?.soft || []),
      ];
      const existing = resumeData.skills || [];
      const unique = newSkills.filter(
        (s) => !existing.some((e) => e.toLowerCase() === s.toLowerCase())
      );
      if (unique.length > 0) {
        updateField('skills', [...existing, ...unique]);
        toast.success(`Added ${unique.length} skills!`);
      } else {
        toast.success('No new skills to suggest');
      }
    } catch (err) {
      toast.error('Failed to suggest skills');
    } finally {
      setAiLoading((prev) => ({ ...prev, skills: false }));
    }
  };

  return (
    <div className="resume-form">
      {SECTIONS.map(({ id, label, icon: Icon }) => (
        <div key={id} className={`form-section ${isOpen(id) ? 'is-open' : ''}`}>
          <button className="section-header" onClick={() => toggleSection(id)}>
            <div className="section-header-left">
              <Icon size={16} />
              <span>{label}</span>
              {id === 'experience' && resumeData.work_experience?.length > 0 && (
                <span className="section-count">{resumeData.work_experience.length}</span>
              )}
              {id === 'education' && resumeData.education?.length > 0 && (
                <span className="section-count">{resumeData.education.length}</span>
              )}
              {id === 'skills' && resumeData.skills?.length > 0 && (
                <span className="section-count">{resumeData.skills.length}</span>
              )}
            </div>
            {isOpen(id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {isOpen(id) && (
            <div className="section-content">
              {/* Personal Info */}
              {id === 'personal' && (
                <div className="section-fields">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">First Name</label>
                      <input className="form-input" value={resumeData.personal_info?.first_name || ''} onChange={(e) => updatePersonal('first_name', e.target.value)} placeholder="John" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      <input className="form-input" value={resumeData.personal_info?.last_name || ''} onChange={(e) => updatePersonal('last_name', e.target.value)} placeholder="Doe" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Job Title</label>
                    <input className="form-input" value={resumeData.personal_info?.job_title || ''} onChange={(e) => updatePersonal('job_title', e.target.value)} placeholder="Software Engineer" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input className="form-input" type="email" value={resumeData.personal_info?.email || ''} onChange={(e) => updatePersonal('email', e.target.value)} placeholder="john@example.com" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input className="form-input" value={resumeData.personal_info?.phone || ''} onChange={(e) => updatePersonal('phone', e.target.value)} placeholder="+1 (555) 000-0000" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input className="form-input" value={resumeData.personal_info?.location || ''} onChange={(e) => updatePersonal('location', e.target.value)} placeholder="New York, NY" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">LinkedIn</label>
                      <input className="form-input" value={resumeData.personal_info?.linkedin || ''} onChange={(e) => updatePersonal('linkedin', e.target.value)} placeholder="linkedin.com/in/johndoe" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Website</label>
                      <input className="form-input" value={resumeData.personal_info?.website || ''} onChange={(e) => updatePersonal('website', e.target.value)} placeholder="johndoe.com" />
                    </div>
                  </div>
                </div>
              )}

              {/* Summary */}
              {id === 'summary' && (
                <div className="section-fields">
                  <div className="form-group">
                    <div className="form-label-row">
                      <label className="form-label">Professional Summary</label>
                      <button
                        className="btn btn-ai btn-sm"
                        onClick={handleAISummary}
                        disabled={aiLoading.summary}
                      >
                        {aiLoading.summary ? <><Loader size={12} className="spin" /> Generating...</> : <><Sparkles size={12} /> AI Write</>}
                      </button>
                    </div>
                    <textarea className="form-textarea" rows={4} value={resumeData.summary || ''} onChange={(e) => updateSummary(e.target.value)} placeholder="Experienced software engineer with 5+ years building scalable web applications..." />
                    <span className="form-hint">{(resumeData.summary || '').length}/500 characters</span>
                  </div>
                </div>
              )}

              {/* Experience */}
              {id === 'experience' && (
                <div className="section-fields">
                  {(resumeData.work_experience || []).map((exp, i) => (
                    <div key={exp.id || i} className="repeater-item">
                      <div className="repeater-header">
                        <span className="repeater-title">{exp.position || exp.company || `Position ${i + 1}`}</span>
                        <button className="btn btn-ghost btn-sm" onClick={() => removeExperience(i)}><Trash2 size={14} /></button>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Position</label>
                          <input className="form-input" value={exp.position || ''} onChange={(e) => updateExperience(i, 'position', e.target.value)} placeholder="Software Engineer" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Company</label>
                          <input className="form-input" value={exp.company || ''} onChange={(e) => updateExperience(i, 'company', e.target.value)} placeholder="Acme Inc." />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Location</label>
                        <input className="form-input" value={exp.location || ''} onChange={(e) => updateExperience(i, 'location', e.target.value)} placeholder="San Francisco, CA" />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Start Date</label>
                          <input className="form-input" type="month" value={exp.start_date || ''} onChange={(e) => updateExperience(i, 'start_date', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">End Date</label>
                          <input className="form-input" type="month" value={exp.end_date || ''} onChange={(e) => updateExperience(i, 'end_date', e.target.value)} disabled={exp.current} />
                          <label className="checkbox-label">
                            <input type="checkbox" checked={exp.current || false} onChange={(e) => updateExperience(i, 'current', e.target.checked)} />
                            Currently working here
                          </label>
                        </div>
                      </div>
                      <div className="form-group">
                        <div className="form-label-row">
                          <label className="form-label">Key Achievements</label>
                          <button
                            className="btn btn-ai btn-sm"
                            onClick={() => handleAIEnhance(i)}
                            disabled={aiLoading[`exp_${i}`]}
                          >
                            {aiLoading[`exp_${i}`] ? <><Loader size={12} className="spin" /> Enhancing...</> : <><Sparkles size={12} /> AI Enhance</>}
                          </button>
                        </div>
                        {(exp.description || []).map((bullet, bi) => (
                          <div key={bi} className="bullet-row">
                            <span className="bullet-dot" />
                            <input className="form-input" value={bullet} onChange={(e) => updateBullet(i, bi, e.target.value)} placeholder="Led a team of 5 engineers to deliver..." />
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => removeBullet(i, bi)}><Trash2 size={12} /></button>
                          </div>
                        ))}
                        <button className="btn btn-ghost btn-sm" onClick={() => addBullet(i)}><Plus size={14} /> Add bullet</button>
                      </div>
                    </div>
                  ))}
                  <button className="btn btn-secondary btn-sm" onClick={addExperience}><Plus size={14} /> Add Experience</button>
                </div>
              )}

              {/* Education */}
              {id === 'education' && (
                <div className="section-fields">
                  {(resumeData.education || []).map((edu, i) => (
                    <div key={edu.id || i} className="repeater-item">
                      <div className="repeater-header">
                        <span className="repeater-title">{edu.institution || `Education ${i + 1}`}</span>
                        <button className="btn btn-ghost btn-sm" onClick={() => removeEducation(i)}><Trash2 size={14} /></button>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Institution</label>
                          <input className="form-input" value={edu.institution || ''} onChange={(e) => updateEducation(i, 'institution', e.target.value)} placeholder="MIT" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Degree</label>
                          <input className="form-input" value={edu.degree || ''} onChange={(e) => updateEducation(i, 'degree', e.target.value)} placeholder="B.S. Computer Science" />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Field of Study</label>
                          <input className="form-input" value={edu.field_of_study || ''} onChange={(e) => updateEducation(i, 'field_of_study', e.target.value)} placeholder="Computer Science" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">GPA</label>
                          <input className="form-input" value={edu.gpa || ''} onChange={(e) => updateEducation(i, 'gpa', e.target.value)} placeholder="3.8" />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Start Date</label>
                          <input className="form-input" type="month" value={edu.start_date || ''} onChange={(e) => updateEducation(i, 'start_date', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">End Date</label>
                          <input className="form-input" type="month" value={edu.end_date || ''} onChange={(e) => updateEducation(i, 'end_date', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="btn btn-secondary btn-sm" onClick={addEducation}><Plus size={14} /> Add Education</button>
                </div>
              )}

              {/* Skills */}
              {id === 'skills' && (
                <div className="section-fields">
                  <div className="skills-grid">
                    {(resumeData.skills || []).map((skill, i) => (
                      <div key={i} className="skill-tag-input">
                        <input className="form-input" value={skill} onChange={(e) => updateSkill(i, e.target.value)} placeholder="React, Python, etc." />
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => removeSkill(i)}><Trash2 size={12} /></button>
                      </div>
                    ))}
                  </div>
                  <div className="skills-actions">
                    <button className="btn btn-secondary btn-sm" onClick={addSkill}><Plus size={14} /> Add Skill</button>
                    <button
                      className="btn btn-ai btn-sm"
                      onClick={handleAISkills}
                      disabled={aiLoading.skills}
                    >
                      {aiLoading.skills ? <><Loader size={12} className="spin" /> Suggesting...</> : <><Sparkles size={12} /> AI Suggest Skills</>}
                    </button>
                  </div>
                </div>
              )}

              {/* Projects */}
              {id === 'projects' && (
                <div className="section-fields">
                  {(resumeData.projects || []).map((proj, i) => (
                    <div key={proj.id || i} className="repeater-item">
                      <div className="repeater-header">
                        <span className="repeater-title">{proj.name || `Project ${i + 1}`}</span>
                        <button className="btn btn-ghost btn-sm" onClick={() => removeProject(i)}><Trash2 size={14} /></button>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Project Name</label>
                        <input className="form-input" value={proj.name || ''} onChange={(e) => updateProject(i, 'name', e.target.value)} placeholder="My Project" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea className="form-textarea" rows={2} value={proj.description || ''} onChange={(e) => updateProject(i, 'description', e.target.value)} placeholder="Built a full-stack application that..." />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Technologies</label>
                          <input className="form-input" value={proj.technologies || ''} onChange={(e) => updateProject(i, 'technologies', e.target.value)} placeholder="React, Node.js, PostgreSQL" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">URL</label>
                          <input className="form-input" value={proj.url || ''} onChange={(e) => updateProject(i, 'url', e.target.value)} placeholder="github.com/..." />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="btn btn-secondary btn-sm" onClick={addProject}><Plus size={14} /> Add Project</button>
                </div>
              )}

              {/* Certifications */}
              {id === 'certifications' && (
                <div className="section-fields">
                  {(resumeData.certifications || []).map((cert, i) => (
                    <div key={cert.id || i} className="repeater-item">
                      <div className="repeater-header">
                        <span className="repeater-title">{cert.name || `Certification ${i + 1}`}</span>
                        <button className="btn btn-ghost btn-sm" onClick={() => removeCertification(i)}><Trash2 size={14} /></button>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Name</label>
                          <input className="form-input" value={cert.name || ''} onChange={(e) => updateCertification(i, 'name', e.target.value)} placeholder="AWS Solutions Architect" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Issuer</label>
                          <input className="form-input" value={cert.issuer || ''} onChange={(e) => updateCertification(i, 'issuer', e.target.value)} placeholder="Amazon Web Services" />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Date</label>
                          <input className="form-input" type="month" value={cert.date || ''} onChange={(e) => updateCertification(i, 'date', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">URL</label>
                          <input className="form-input" value={cert.url || ''} onChange={(e) => updateCertification(i, 'url', e.target.value)} placeholder="credential URL" />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="btn btn-secondary btn-sm" onClick={addCertification}><Plus size={14} /> Add Certification</button>
                </div>
              )}

              {/* Languages */}
              {id === 'languages' && (
                <div className="section-fields">
                  {(resumeData.languages || []).map((lang, i) => (
                    <div key={i} className="repeater-item-inline">
                      <input className="form-input" value={lang.name || ''} onChange={(e) => updateLanguage(i, 'name', e.target.value)} placeholder="English" />
                      <select className="form-select" value={lang.proficiency || 'Professional'} onChange={(e) => updateLanguage(i, 'proficiency', e.target.value)}>
                        <option value="Native">Native</option>
                        <option value="Fluent">Fluent</option>
                        <option value="Professional">Professional</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Basic">Basic</option>
                      </select>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => removeLanguage(i)}><Trash2 size={12} /></button>
                    </div>
                  ))}
                  <button className="btn btn-secondary btn-sm" onClick={addLanguage}><Plus size={14} /> Add Language</button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ResumeForm;
