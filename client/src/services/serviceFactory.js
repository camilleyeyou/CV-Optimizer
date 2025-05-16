import * as realAuthService from './authService';
import * as realResumeService from './resumeService';
import * as realAiService from './aiService';

import * as mockAuthService from './mock/mockAuthService';
import * as mockResumeService from './mock/mockResumeService';
import * as mockAiService from './mock/mockAiService';

// Change to false to use the real services connected to your backend
const USE_MOCK_SERVICES = false;

export const authService = USE_MOCK_SERVICES ? mockAuthService : realAuthService;
export const resumeService = USE_MOCK_SERVICES ? mockResumeService : realResumeService;
export const aiService = USE_MOCK_SERVICES ? mockAiService : realAiService;
