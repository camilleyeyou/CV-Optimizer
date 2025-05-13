import React, { useEffect } from 'react';
import { loadTemplateStyles, removeTemplateStyles } from '../../utils/templateStyles';

/**
 * Component for managing template CSS
 * This attaches/detaches template-specific CSS when template changes
 */
const TemplateStyles = ({ templateId }) => {
  useEffect(() => {
    // Load template styles on mount and when templateId changes
    loadTemplateStyles(templateId);
    
    // Clean up styles on unmount
    return () => {
      removeTemplateStyles();
    };
  }, [templateId]);
  
  // This component doesn't render anything visible
  return null;
};

export default TemplateStyles;
