/**
 * Normalizes skills data to handle both array and object formats
 * @param {Array|Object} skills - Skills data which can be an array or an object with technical/soft properties
 * @returns {Array} - Normalized array of skill objects
 */
export const normalizeSkills = (skills) => {
  // If skills is null or undefined, return an empty array
  if (!skills) return [];
  
  // If skills is already an array, return it with objects normalized
  if (Array.isArray(skills)) {
    return skills.map(skill => 
      typeof skill === 'string' 
        ? { name: skill, level: 'Intermediate' } 
        : skill
    );
  }
  
  // If skills has technical and soft properties (object format from schema)
  if (skills.technical || skills.soft) {
    // Combine technical and soft skills into a single array
    const technicalSkills = Array.isArray(skills.technical) 
      ? skills.technical.map(skill => typeof skill === 'string' 
          ? { name: skill, level: 'Intermediate' } 
          : skill)
      : [];
    
    const softSkills = Array.isArray(skills.soft)
      ? skills.soft.map(skill => typeof skill === 'string'
          ? { name: skill, level: 'Intermediate' }
          : skill)
      : [];
      
    return [...technicalSkills, ...softSkills];
  }
  
  // Fallback for any other format
  return [];
};
