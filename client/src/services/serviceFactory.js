import * as authService from './authService';
import * as resumeService from './resumeService';
import * as aiService from './aiService';

// The factory is now simplified to just export the real services
// We're no longer using mock services since we're connecting to the real backend

export { authService, resumeService, aiService };
