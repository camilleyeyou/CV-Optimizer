/**
 * Standardizes the skills format throughout the application.
 * This ensures all components receive skills data in a consistent format.
 */

// Convert any skills format to standard internal format (flattened array with objects)
export const normalizeSkills = (skills) => {
  if (!skills) return [];
  
  let normalizedSkills = [];
  
  // Handle array format
  if (Array.isArray(skills)) {
    normalizedSkills = skills.map(skill => 
      typeof skill === 'string' ? { name: skill, level: 'Intermediate' } : skill
    );
  }
  // Handle object format with nested technical/soft skills
  else if (typeof skills === 'object') {
    // Process technical skills
    if (Array.isArray(skills.technical)) {
      const techSkills = skills.technical.map(skill => {
        const skillObj = typeof skill === 'string' ? { name: skill, level: 'Intermediate' } : skill;
        return { ...skillObj, category: 'technical' };
      });
      normalizedSkills = [...normalizedSkills, ...techSkills];
    }
    
    // Process soft skills
    if (Array.isArray(skills.soft)) {
      const softSkills = skills.soft.map(skill => {
        const skillObj = typeof skill === 'string' ? { name: skill, level: 'Intermediate' } : skill;
        return { ...skillObj, category: 'soft' };
      });
      normalizedSkills = [...normalizedSkills, ...softSkills];
    }
  }
  
  return normalizedSkills;
};

// Convert normalized skills array to backend format
export const toBackendFormat = (normalizedSkills) => {
  // Create structure for backend
  const backendSkills = {
    technical: [],
    soft: []
  };
  
  // Distribute skills into proper categories
  normalizedSkills.forEach(skill => {
    if (skill.category === 'soft') {
      backendSkills.soft.push(skill.name);
    } else {
      // Default to technical if no category or technical
      backendSkills.technical.push(skill.name);
    }
  });
  
  return backendSkills;
};

// Core operations for manipulating skills
export const skillsOperations = {
  // Add new skill to array
  addSkill: (normalizedSkills, skill) => {
    // Create skill object if string is provided
    const skillObj = typeof skill === 'string' 
      ? { name: skill, level: 'Intermediate', category: 'technical' } 
      : skill;
    
    // Check if skill with same name already exists
    const exists = normalizedSkills.some(s => 
      s.name.toLowerCase() === skillObj.name.toLowerCase()
    );
    
    // Return with new skill added if it doesn't exist
    return exists ? normalizedSkills : [...normalizedSkills, skillObj];
  },
  
  // Remove skill by name
  removeSkill: (normalizedSkills, skillName) => {
    return normalizedSkills.filter(skill => 
      skill.name.toLowerCase() !== skillName.toLowerCase()
    );
  },
  
  // Update skill at specific index
  updateSkill: (normalizedSkills, index, updatedSkill) => {
    return normalizedSkills.map((skill, i) => 
      i === index ? updatedSkill : skill
    );
  }
};
