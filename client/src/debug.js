// Debug script to find the problematic component
(function() {
  // Override Error constructor to capture stack trace info
  const originalError = Error;
  window.Error = function(message) {
    const err = new originalError(message);
    
    // If this is the skills map error, log debugging info
    if (message && message.includes("resumeData.skills.map is not a function")) {
      console.error("SKILLS MAP ERROR DETECTED!");
      console.error("Error location:", err.stack);
      
      // Try to find the component in the React tree
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        console.log("React DevTools detected, inspect React component tree");
      }
    }
    return err;
  };
  
  // Keep the prototype
  window.Error.prototype = originalError.prototype;
  
  console.log("Debug script initialized - monitoring for skills.map errors");
})();
