import React from 'react';

const MinimalTemplate = ({ resumeData }) => {
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
    <div className="max-w-4xl mx-auto bg-white" style={{ minHeight: '11in' }}>
      <div className="p-8">
        {/* Header */}
        <header className="text-center mb-8 pb-6 border-b border-gray-300">
          <h1 className="text-3xl font-light text-gray-800 mb-2">{fullName}</h1>
          <div className="text-gray-600 space-y-1">
            {email && <div>{email}</div>}
            {phone && <div>{phone}</div>}
            {location && <div>{location}</div>}
            <div className="flex justify-center space-x-4 mt-2">
              {linkedIn && (
                <span className="text-sm">LinkedIn: {linkedIn}</span>
              )}
              {website && (
                <span className="text-sm">Website: {website}</span>
              )}
            </div>
          </div>
        </header>

        {/* Summary */}
        {summary && (
          <section className="mb-6">
            <h2 className="text-lg font-medium text-gray-800 mb-3 uppercase tracking-wide">
              Summary
            </h2>
            <p className="text-gray-700 leading-relaxed">{summary}</p>
          </section>
        )}

        {/* Skills */}
        {skills && skills.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-medium text-gray-800 mb-3 uppercase tracking-wide">
              Skills
            </h2>
            <div className="text-gray-700">
              {skills.join(' • ')}
            </div>
          </section>
        )}

        {/* Work Experience */}
        {workExperience && workExperience.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-medium text-gray-800 mb-3 uppercase tracking-wide">
              Experience
            </h2>
            <div className="space-y-4">
              {workExperience.map((job, index) => (
                <div key={job.id || index}>
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3 className="font-medium text-gray-800">
                        {job.jobTitle || job.position}
                      </h3>
                      <p className="text-gray-600">{job.company}</p>
                      {job.location && (
                        <p className="text-gray-500 text-sm">{job.location}</p>
                      )}
                    </div>
                    <div className="text-gray-500 text-sm text-right">
                      {formatDate(job.startDate)} - {job.isCurrentJob || job.current ? 'Present' : formatDate(job.endDate)}
                    </div>
                  </div>
                  {job.description && (
                    <div className="text-gray-700 text-sm mt-2">
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
                      <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                        {job.achievements.map((achievement, achIndex) => (
                          <li key={achIndex}>{achievement}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {education && education.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-medium text-gray-800 mb-3 uppercase tracking-wide">
              Education
            </h2>
            <div className="space-y-3">
              {education.map((edu, index) => (
                <div key={edu.id || index}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-800">{edu.degree}</h3>
                      <p className="text-gray-600">{edu.institution}</p>
                      {edu.fieldOfStudy && (
                        <p className="text-gray-500 text-sm">{edu.fieldOfStudy}</p>
                      )}
                      {edu.location && (
                        <p className="text-gray-500 text-sm">{edu.location}</p>
                      )}
                      {edu.gpa && (
                        <p className="text-gray-500 text-sm">GPA: {edu.gpa}</p>
                      )}
                    </div>
                    <div className="text-gray-500 text-sm">
                      {formatDate(edu.graduationDate || edu.endDate)}
                    </div>
                  </div>
                  {edu.honors && edu.honors.length > 0 && (
                    <p className="text-gray-600 text-sm mt-1">
                      Honors: {edu.honors.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Certifications */}
        {certifications && certifications.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-medium text-gray-800 mb-3 uppercase tracking-wide">
              Certifications
            </h2>
            <div className="space-y-2">
              {certifications.map((cert, index) => (
                <div key={cert.id || index}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-800">{cert.name}</h3>
                      <p className="text-gray-600">{cert.issuer}</p>
                      {cert.credentialId && (
                        <p className="text-gray-500 text-sm">ID: {cert.credentialId}</p>
                      )}
                    </div>
                    <div className="text-gray-500 text-sm text-right">
                      {(cert.issueDate || cert.date) && (
                        <div>Issued: {formatDate(cert.issueDate || cert.date)}</div>
                      )}
                      {cert.expirationDate && (
                        <div>Expires: {formatDate(cert.expirationDate)}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default MinimalTemplate;