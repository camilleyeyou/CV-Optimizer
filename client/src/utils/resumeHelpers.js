/**
 * Helper utilities for working with resume data structure
 */

/**
 * Ensures the skills structure is consistent regardless of data format
 * @param {Object|Array} skills - The skills data structure
 * @returns {Object} A normalized skills object with technical and soft arrays
 */
export const ensureSkillsStructure = (skills) => {
  if (!skills) return { technical: [], soft: [] };
  
  if (Array.isArray(skills)) {
    // Convert from array to object structure if needed
    return { 
      technical: skills.map(skill => 
        typeof skill === 'string' ? { name: skill, level: 'Intermediate' } : skill
      ),
      soft: []
    };
  }
  
  return {
    technical: Array.isArray(skills.technical) ? skills.technical : [],
    soft: Array.isArray(skills.soft) ? skills.soft : []
  };
};

/**
 * Gets a flat array of skill names from the skills structure
 * @param {Object|Array} skills - The skills data structure
 * @returns {Array} A flat array of skill names
 */
export const getSkillNames = (skills) => {
  const normalizedSkills = ensureSkillsStructure(skills);
  
  const technicalNames = normalizedSkills.technical.map(skill => 
    typeof skill === 'string' ? skill : skill.name
  );
  
  const softNames = normalizedSkills.soft.map(skill => 
    typeof skill === 'string' ? skill : skill.name
  );
  
  return [...technicalNames, ...softNames];
};

/**
 * Adds a skill to the technical skills array
 * @param {Object} skills - The current skills structure
 * @param {String} skillName - The name of the skill to add
 * @returns {Object} The updated skills structure
 */
export const addSkillToTechnical = (skills, skillName) => {
  const normalizedSkills = ensureSkillsStructure(skills);
  
  return {
    ...normalizedSkills,
    technical: [
      ...normalizedSkills.technical, 
      { name: skillName, level: 'Intermediate' }
    ]
  };
};

/**
 * Removes a skill from both technical and soft skills
 * @param {Object} skills - The current skills structure
 * @param {String} skillName - The name of the skill to remove
 * @returns {Object} The updated skills structure
 */
export const removeSkillByName = (skills, skillName) => {
  const normalizedSkills = ensureSkillsStructure(skills);
  
  return {
    technical: normalizedSkills.technical.filter(skill => 
      (typeof skill === 'string' && skill !== skillName) || 
      (typeof skill === 'object' && skill.name !== skillName)
    ),
    soft: normalizedSkills.soft.filter(skill => 
      (typeof skill === 'string' && skill !== skillName) || 
      (typeof skill === 'object' && skill.name !== skillName)
    )
  };
};
