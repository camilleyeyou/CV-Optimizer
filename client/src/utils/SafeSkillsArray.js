/**
 * Utility function to safely process skills data for use in components
 * This handles all possible skills data formats and always returns an array
 */
export function getSafeSkillsArray(skills) {
  // Handle null or undefined
  if (!skills) return [];
  
  // Already an array, return it
  if (Array.isArray(skills)) return skills;
  
  // Has technical/soft skill arrays
  if (skills.technical || skills.soft) {
    const result = [];
    
    // Add technical skills
    if (Array.isArray(skills.technical)) {
      result.push(...skills.technical);
    }
    
    // Add soft skills
    if (Array.isArray(skills.soft)) {
      result.push(...skills.soft);
    }
    
    return result;
  }
  
  // Any other case, return empty array
  return [];
}
