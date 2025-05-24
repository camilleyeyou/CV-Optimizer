import React from 'react';

const CreativeTemplate = ({ resumeData }) => {
  const {
    personalInfo = {},
    summary = '',
    workExperience = [],
    education = [],
    skills = [],
    certifications = []
  } = resumeData || {};

  const {
    firstName = '',
    lastName = '',
    email = '',
    phone = '',
    linkedIn = '',
    website = '',
    address = '',
    city = '',
    state = '',
    country = ''
    // Removed zipCode since it wasn't being used
  } = personalInfo;

  const formatDate = (date) => {
    if (!date) return '';
    if (date === 'Present' || date === 'Current') return 'Present';
    
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return date;
      return dateObj.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
    } catch {
      return date;
    }
  };

  const fullName = `${firstName} ${lastName}`.trim();
  const location = [address, city, state, country].filter(Boolean).join(', ');

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-lg" style={{ minHeight: '11in' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8">
        <div className="flex flex-col md:flex-row justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">{fullName}</h1>
            <div className="text-lg opacity-90">
              {email && <div>{email}</div>}
              {phone && <div>{phone}</div>}
              {location && <div>{location}</div>}
            </div>
          </div>
          <div className="mt-4 md:mt-0 text-right">
            {linkedIn && (
              <div className="mb-1">
                <span className="text-sm opacity-75">LinkedIn: </span>
                <span>{linkedIn}</span>
              </div>
            )}
            {website && (
              <div>
                <span className="text-sm opacity-75">Website: </span>
                <span>{website}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Summary */}
        {summary && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-purple-600 mb-4 border-b-2 border-purple-200 pb-2">
              Professional Summary
            </h2>
            <p className="text-gray-700 leading-relaxed">{summary}</p>
          </section>
        )}

        {/* Skills */}
        {skills && skills.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-purple-600 mb-4 border-b-2 border-purple-200 pb-2">
              Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Work Experience */}
        {workExperience && workExperience.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-purple-600 mb-4 border-b-2 border-purple-200 pb-2">
              Experience
            </h2>
            <div className="space-y-6">
              {workExperience.map((job, index) => (
                <div key={job.id || index} className="relative pl-6">
                  <div className="absolute left-0 top-2 w-3 h-3 bg-purple-600 rounded-full"></div>
                  <div className="ml-4">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-2">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">
                          {job.jobTitle || job.position}
                        </h3>
                        <p className="text-lg text-purple-600 font-medium">{job.company}</p>
                        {job.location && (
                          <p className="text-gray-600">{job.location}</p>
                        )}
                      </div>
                      <div className="text-gray-600 text-sm md:text-right mt-1 md:mt-0">
                        <div>
                          {formatDate(job.startDate)} - {job.isCurrentJob || job.current ? 'Present' : formatDate(job.endDate)}
                        </div>
                      </div>
                    </div>
                    {job.description && (
                      <div className="text-gray-700 mt-2">
                        {Array.isArray(job.description) ? (
                          <ul className="list-disc list-inside space-y-1">
                            {job.description.map((desc, descIndex) => (
                              <li key={descIndex}>{desc}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>{job.description}</p>
                        )}
                      </div>
                    )}
                    {job.achievements && job.achievements.length > 0 && (
                      <div className="mt-2">
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                          {job.achievements.map((achievement, achIndex) => (
                            <li key={achIndex}>{achievement}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {education && education.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-purple-600 mb-4 border-b-2 border-purple-200 pb-2">
              Education
            </h2>
            <div className="space-y-4">
              {education.map((edu, index) => (
                <div key={edu.id || index} className="relative pl-6">
                  <div className="absolute left-0 top-2 w-3 h-3 bg-purple-600 rounded-full"></div>
                  <div className="ml-4">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{edu.degree}</h3>
                        <p className="text-purple-600 font-medium">{edu.institution}</p>
                        {edu.fieldOfStudy && (
                          <p className="text-gray-600">{edu.fieldOfStudy}</p>
                        )}
                        {edu.location && (
                          <p className="text-gray-600 text-sm">{edu.location}</p>
                        )}
                        {edu.gpa && (
                          <p className="text-gray-600 text-sm">GPA: {edu.gpa}</p>
                        )}
                      </div>
                      <div className="text-gray-600 text-sm mt-1 md:mt-0">
                        {formatDate(edu.graduationDate || edu.endDate)}
                      </div>
                    </div>
                    {edu.honors && edu.honors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Honors: </span>
                          {edu.honors.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Certifications */}
        {certifications && certifications.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-purple-600 mb-4 border-b-2 border-purple-200 pb-2">
              Certifications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certifications.map((cert, index) => (
                <div key={cert.id || index} className="border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800">{cert.name}</h3>
                  <p className="text-purple-600">{cert.issuer}</p>
                  {(cert.issueDate || cert.date) && (
                    <p className="text-gray-600 text-sm">
                      Issued: {formatDate(cert.issueDate || cert.date)}
                    </p>
                  )}
                  {cert.expirationDate && (
                    <p className="text-gray-600 text-sm">
                      Expires: {formatDate(cert.expirationDate)}
                    </p>
                  )}
                  {cert.credentialId && (
                    <p className="text-gray-600 text-sm">ID: {cert.credentialId}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default CreativeTemplate;